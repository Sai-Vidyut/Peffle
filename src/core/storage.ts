import Database from "better-sqlite3";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ActionEvent,
  ActionRequest,
  AgentIdentity,
  ApprovalGrant,
  EventStatus,
  LedgerFilter,
} from "./types.js";
import { PeffleError, StorageError } from "./errors.js";
import { escapeLikePattern, globMatch, nowIso, utcDayStartIso } from "./util.js";

const SCHEMA_VERSION = "2";

const DDL = `
CREATE TABLE IF NOT EXISTS agents (
  agent_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  killed_at TEXT,
  reason TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  principal TEXT,
  delegation_chain TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  amount REAL,
  status TEXT NOT NULL,
  rule_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  executed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS approvals (
  event_id TEXT PRIMARY KEY REFERENCES events(id),
  fingerprint TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT,
  consumed_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export interface ApprovalRow {
  event_id: string;
  fingerprint: string;
  token_hash: string;
  status: string;
  expires_at: string | null;
  consumed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  agent_id: string;
  principal: string | null;
  delegation_chain: string | null;
  action: string;
  resource: string | null;
  amount: number | null;
  status: string;
  rule_id: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
  executed_at?: string | null;
}

function rowToEvent(row: EventRow): ActionEvent {
  const delegationChain = row.delegation_chain
    ? (JSON.parse(row.delegation_chain) as string[])
    : undefined;
  const agent: AgentIdentity = {
    agentId: row.agent_id,
    principal: row.principal ?? undefined,
    delegationChain,
  };
  return {
    id: row.id,
    agent,
    action: row.action,
    resource: row.resource ?? undefined,
    amount: row.amount ?? undefined,
    status: row.status as EventStatus,
    ruleId: row.rule_id ?? undefined,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PeffleStorage {
  readonly db: Database.Database;

  constructor(storagePath: string) {
    try {
      if (storagePath !== ":memory:") {
        const dir = dirname(storagePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      }
      this.db = new Database(storagePath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("busy_timeout = 5000");
      this.db.exec(DDL);
      this.migrate();
      this.db
        .prepare(
          `INSERT INTO schema_meta (key, value) VALUES ('schema_version', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        )
        .run(SCHEMA_VERSION);
      if (storagePath !== ":memory:") {
        try {
          chmodSync(storagePath, 0o600);
        } catch {
          // Windows or permission issues — best effort
        }
      }
    } catch (e) {
      throw new StorageError("Failed to open storage", e);
    }
  }

  private migrate(): void {
    const cols = this.db.prepare(`PRAGMA table_info(events)`).all() as { name: string }[];
    if (!cols.some((c) => c.name === "executed_at")) {
      this.db.exec(`ALTER TABLE events ADD COLUMN executed_at TEXT`);
    }
  }

  private run<T>(operation: string, fn: () => T): T {
    try {
      return fn();
    } catch (e) {
      if (e instanceof StorageError || e instanceof PeffleError) throw e;
      throw new StorageError(`${operation} failed`, e);
    }
  }

  close(): void {
    this.run("close", () => {
      this.db.close();
    });
  }

  getAgentStatus(agentId: string): "active" | "killed" | null {
    return this.run("getAgentStatus", () => {
      const row = this.db
        .prepare(`SELECT status FROM agents WHERE agent_id = ?`)
        .get(agentId) as { status: string } | undefined;
      if (!row) return null;
      return row.status as "active" | "killed";
    });
  }

  upsertKill(agentId: string, reason?: string): void {
    this.run("upsertKill", () => {
      const now = nowIso();
      this.db
        .prepare(
          `INSERT INTO agents (agent_id, status, killed_at, reason, updated_at)
           VALUES (?, 'killed', ?, ?, ?)
           ON CONFLICT(agent_id) DO UPDATE SET
             status = 'killed', killed_at = excluded.killed_at, reason = excluded.reason, updated_at = excluded.updated_at`
        )
        .run(agentId, now, reason ?? null, now);
    });
  }

  reviveAgent(agentId: string): void {
    this.run("reviveAgent", () => {
      const now = nowIso();
      this.db
        .prepare(
          `INSERT INTO agents (agent_id, status, killed_at, reason, updated_at)
           VALUES (?, 'active', NULL, NULL, ?)
           ON CONFLICT(agent_id) DO UPDATE SET
             status = 'active', killed_at = NULL, reason = NULL, updated_at = excluded.updated_at`
        )
        .run(agentId, now);
    });
  }

  voidApprovalsForAgent(agentId: string): void {
    this.run("voidApprovalsForAgent", () => {
      const chainLike = `%"${escapeLikePattern(agentId)}"%`;
      this.db.transaction(() => {
        const pending = this.db
          .prepare(
            `SELECT e.id FROM events e
             INNER JOIN approvals a ON a.event_id = e.id
             WHERE a.status IN ('pending', 'approved')
             AND (e.agent_id = ? OR e.delegation_chain LIKE ? ESCAPE '\\')`
          )
          .all(agentId, chainLike) as { id: string }[];
        const now = nowIso();
        for (const { id } of pending) {
          this.db
            .prepare(
              `UPDATE approvals SET status = 'denied', updated_at = ? WHERE event_id = ? AND status IN ('pending', 'approved')`
            )
            .run(now, id);
          this.db
            .prepare(`UPDATE events SET status = 'approval_denied', updated_at = ? WHERE id = ?`)
            .run(now, id);
        }
      })();
    });
  }

  insertEvent(
    id: string,
    request: ActionRequest,
    status: EventStatus,
    ruleId?: string
  ): void {
    this.run("insertEvent", () => {
      const now = nowIso();
      const chain = request.agent.delegationChain
        ? JSON.stringify(request.agent.delegationChain)
        : null;
      const meta = request.metadata ? JSON.stringify(request.metadata) : null;
      const executedAt =
        status === "in_progress" || status === "completed" ? now : null;
      this.db
        .prepare(
          `INSERT INTO events (id, agent_id, principal, delegation_chain, action, resource, amount, status, rule_id, metadata, created_at, updated_at, executed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          request.agent.agentId,
          request.agent.principal ?? null,
          chain,
          request.action,
          request.resource ?? null,
          request.amount ?? null,
          status,
          ruleId ?? null,
          meta,
          now,
          now,
          executedAt
        );
    });
  }

  updateEventStatus(id: string, status: EventStatus): void {
    this.run("updateEventStatus", () => {
      const now = nowIso();
      if (status === "in_progress" || status === "completed") {
        this.db
          .prepare(
            `UPDATE events SET status = ?, updated_at = ?, executed_at = COALESCE(executed_at, ?) WHERE id = ?`
          )
          .run(status, now, now, id);
      } else {
        this.db
          .prepare(`UPDATE events SET status = ?, updated_at = ? WHERE id = ?`)
          .run(status, now, id);
      }
    });
  }

  getEvent(id: string): ActionEvent | null {
    return this.run("getEvent", () => {
      const row = this.db.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as
        | EventRow
        | undefined;
      return row ? rowToEvent(row) : null;
    });
  }

  insertApproval(
    eventId: string,
    fingerprint: string,
    tokenHash: string
  ): void {
    this.run("insertApproval", () => {
      const now = nowIso();
      this.db
        .prepare(
          `INSERT INTO approvals (event_id, fingerprint, token_hash, status, expires_at, consumed_at, note, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?)`
        )
        .run(eventId, fingerprint, tokenHash, now, now);
    });
  }

  getApproval(eventId: string): ApprovalRow | null {
    return this.run("getApproval", () => {
      return (
        this.db.prepare(`SELECT * FROM approvals WHERE event_id = ?`).get(eventId) as
          | ApprovalRow
          | undefined
      ) ?? null;
    });
  }

  getApprovalGrant(eventId: string): ApprovalGrant | null {
    const row = this.getApproval(eventId);
    if (!row) return null;
    return {
      eventId: row.event_id,
      fingerprint: row.fingerprint,
      status: row.status as ApprovalGrant["status"],
      expiresAt: row.expires_at ?? undefined,
      consumedAt: row.consumed_at ?? undefined,
    };
  }

  approvePending(eventId: string, expiresAt: string, note?: string): boolean {
    return this.run("approvePending", () => {
      return this.db.transaction(() => {
        const now = nowIso();
        const result = this.db
          .prepare(
            `UPDATE approvals SET status = 'approved', expires_at = ?, note = ?, updated_at = ?
             WHERE event_id = ? AND status = 'pending'`
          )
          .run(expiresAt, note ?? null, now, eventId);
        if (result.changes === 0) return false;
        this.db
          .prepare(`UPDATE events SET status = 'approved', updated_at = ? WHERE id = ?`)
          .run(now, eventId);
        return true;
      })();
    });
  }

  denyPending(eventId: string, note?: string): boolean {
    return this.run("denyPending", () => {
      return this.db.transaction(() => {
        const now = nowIso();
        const result = this.db
          .prepare(
            `UPDATE approvals SET status = 'denied', note = ?, updated_at = ?
             WHERE event_id = ? AND status = 'pending'`
          )
          .run(note ?? null, now, eventId);
        if (result.changes === 0) return false;
        this.db
          .prepare(`UPDATE events SET status = 'approval_denied', updated_at = ? WHERE id = ?`)
          .run(now, eventId);
        return true;
      })();
    });
  }

  revokeApproved(eventId: string, note?: string): boolean {
    return this.run("revokeApproved", () => {
      return this.db.transaction(() => {
        const now = nowIso();
        const result = this.db
          .prepare(
            `UPDATE approvals SET status = 'denied', note = ?, updated_at = ?
             WHERE event_id = ? AND status = 'approved'`
          )
          .run(note ?? null, now, eventId);
        if (result.changes === 0) return false;
        this.db
          .prepare(`UPDATE events SET status = 'approval_denied', updated_at = ? WHERE id = ?`)
          .run(now, eventId);
        return true;
      })();
    });
  }

  consumeApproval(
    eventId: string,
    tokenHash: string,
    now: string
  ): boolean {
    return this.run("consumeApproval", () => {
      const result = this.db
        .prepare(
          `UPDATE approvals SET status = 'consumed', consumed_at = ?, updated_at = ?
           WHERE event_id = ? AND status = 'approved' AND token_hash = ? AND expires_at > ?`
        )
        .run(now, now, eventId, tokenHash, now);
      return result.changes === 1;
    });
  }

  sumBudgetSpend(
    scope: "global" | "agent" | "principal",
    window: "total" | "daily",
    agentId: string,
    principal?: string,
    appliesTo?: { agentId?: string; principal?: string },
    actionPattern?: string
  ): number {
    return this.run("sumBudgetSpend", () => {
      const conditions: string[] = [
        `status IN ('completed', 'in_progress')`,
        `amount IS NOT NULL`,
      ];
      const params: unknown[] = [];

      if (scope === "agent" || appliesTo?.agentId) {
        conditions.push(`agent_id = ?`);
        params.push(appliesTo?.agentId ?? agentId);
      }
      if (scope === "principal") {
        const p = appliesTo?.principal ?? principal;
        if (!p) return 0;
        conditions.push(`principal IS NOT NULL`);
        conditions.push(`principal = ?`);
        params.push(p);
      } else if (appliesTo?.principal) {
        conditions.push(`principal IS NOT NULL`);
        conditions.push(`principal = ?`);
        params.push(appliesTo.principal);
      }
      if (window === "daily") {
        conditions.push(`COALESCE(executed_at, created_at) >= ?`);
        params.push(utcDayStartIso());
      }

      const sql = `SELECT action, amount FROM events WHERE ${conditions.join(" AND ")}`;
      const rows = this.db.prepare(sql).all(...params) as { action: string; amount: number }[];
      let total = 0;
      for (const row of rows) {
        if (actionPattern && !globMatch(actionPattern, row.action)) {
          continue;
        }
        total += row.amount;
      }
      return total;
    });
  }

  queryEvents(filter: LedgerFilter = {}): ActionEvent[] {
    return this.run("queryEvents", () => {
      const conditions: string[] = ["1=1"];
      const params: unknown[] = [];

      if (filter.agentId) {
        conditions.push(`agent_id = ?`);
        params.push(filter.agentId);
      }
      if (filter.principal) {
        conditions.push(`principal = ?`);
        params.push(filter.principal);
      }
      if (filter.action) {
        conditions.push(`action = ?`);
        params.push(filter.action);
      }
      if (filter.status) {
        conditions.push(`status = ?`);
        params.push(filter.status);
      }
      if (filter.since) {
        conditions.push(`created_at >= ?`);
        params.push(filter.since);
      }
      if (filter.until) {
        conditions.push(`created_at <= ?`);
        params.push(filter.until);
      }

      const limit = filter.limit ?? 100;
      const offset = filter.offset ?? 0;
      const sql = `SELECT * FROM events WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      const rows = this.db.prepare(sql).all(...params) as EventRow[];
      return rows.map(rowToEvent);
    });
  }

  listPendingApprovals(): ActionEvent[] {
    return this.run("listPendingApprovals", () => {
      const rows = this.db
        .prepare(
          `SELECT e.* FROM events e
           INNER JOIN approvals a ON a.event_id = e.id
           WHERE a.status = 'pending'
           ORDER BY e.created_at DESC`
        )
        .all() as EventRow[];
      return rows.map(rowToEvent);
    });
  }

  transaction<T>(fn: () => T): T {
    return this.run("transaction", () => this.db.transaction(fn)());
  }

  transactionImmediate<T>(fn: () => T): T {
    return this.run("transactionImmediate", () => {
      this.db.prepare("BEGIN IMMEDIATE").run();
      try {
        const result = fn();
        this.db.prepare("COMMIT").run();
        return result;
      } catch (e) {
        this.db.prepare("ROLLBACK").run();
        throw e;
      }
    });
  }
}
