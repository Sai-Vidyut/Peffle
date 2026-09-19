import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ActionRequest, GuardOptions, LedgerFilter, Peffle, PeffleConfig } from "./types.js";
import { loadPolicyFromJson } from "./schema.js";
import { PeffleStorage } from "./storage.js";
import { checkPolicy as evaluatePolicy } from "./policy.js";
import { runGuard } from "./guard.js";
import { approveEvent, denyEvent, revokeApprovedEvent, waitForApprovalEvent } from "./approval.js";
import { assertValidAmount } from "./validate-request.js";

const DEFAULT_STORAGE = "./.peffle/ledger.db";
const DEFAULT_POLICY = "./peffle.policy.json";
const DEFAULT_APPROVAL_TTL_MS = 15 * 60 * 1000;

function loadPolicy(config: PeffleConfig) {
  if (config.policy) return config.policy;
  const path = resolve(config.policyPath ?? DEFAULT_POLICY);
  try {
    return loadPolicyFromJson(readFileSync(path, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return loadPolicyFromJson(
        JSON.stringify({
          version: 1,
          defaults: { onNoMatchingRule: "deny" },
          budgets: [],
          actions: [],
        })
      );
    }
    throw e;
  }
}

export function createPeffle(config: PeffleConfig = {}): Peffle {
  const rawPath = config.storagePath ?? DEFAULT_STORAGE;
  const storagePath = rawPath === ":memory:" ? ":memory:" : resolve(rawPath);
  const policy = loadPolicy(config);
  const storage = new PeffleStorage(storagePath);
  const approvalRedeemTtlMs = config.approvalRedeemTtlMs ?? DEFAULT_APPROVAL_TTL_MS;

  const ctx = { storage, policy, config };

  return {
    /**
     * Advisory policy preview only. Does not reserve budget, create ledger events,
     * enforce kill switch at execution time, or authorize actions — use `guard()` for that.
     */
    checkPolicy(request: ActionRequest) {
      assertValidAmount(request.amount);
      return evaluatePolicy(storage, policy, request);
    },

    guard<T>(request: ActionRequest, fn: () => Promise<T> | T, opts?: GuardOptions) {
      return runGuard(ctx, request, fn, opts);
    },

    kill(agentId: string, opts?: { reason?: string }) {
      storage.transactionImmediate(() => {
        storage.upsertKill(agentId, opts?.reason);
        storage.voidApprovalsForAgent(agentId);
      });
    },

    revive(agentId: string, _opts?: { reason?: string }) {
      storage.reviveAgent(agentId);
    },

    query(filter?: LedgerFilter) {
      return storage.queryEvents(filter);
    },

    approve(eventId: string, opts?: { note?: string }) {
      approveEvent(storage, eventId, approvalRedeemTtlMs, opts?.note);
    },

    deny(eventId: string, opts?: { note?: string }) {
      denyEvent(storage, eventId, opts?.note);
    },

    revoke(eventId: string, opts?: { note?: string }) {
      revokeApprovedEvent(storage, eventId, opts?.note);
    },

    waitForApproval(eventId: string, opts?: { timeoutMs?: number }) {
      return waitForApprovalEvent(storage, eventId, opts?.timeoutMs);
    },

    close() {
      storage.close();
    },
  };
}
