export interface AgentIdentity {
  agentId: string;
  principal?: string;
  delegationChain?: string[];
}

export interface ActionRequest {
  agent: AgentIdentity;
  action: string;
  resource?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export type PolicyDecision =
  | { outcome: "allow" }
  | { outcome: "deny"; reason: string; rule: string; budget?: { limit: number; spent: number } }
  | { outcome: "require_approval"; ruleId: string };

export interface GuardApproval {
  eventId: string;
  token: string;
}

export interface GuardOptions {
  approval?: GuardApproval;
}

export type EventStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "denied"
  | "pending"
  | "approved"
  | "approval_denied";

export interface ActionEvent {
  id: string;
  agent: AgentIdentity;
  action: string;
  resource?: string;
  amount?: number;
  status: EventStatus;
  ruleId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalGrant {
  eventId: string;
  fingerprint: string;
  status: "pending" | "approved" | "denied" | "consumed";
  expiresAt?: string;
  consumedAt?: string;
}

export interface LedgerFilter {
  agentId?: string;
  principal?: string;
  action?: string;
  status?: EventStatus;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export interface PolicyConfig {
  version: 1;
  defaults: {
    onNoMatchingRule: "allow" | "deny";
  };
  budgets: BudgetRule[];
  actions: ActionRule[];
}

export interface BudgetRule {
  id: string;
  scope: "global" | "agent" | "principal";
  window: "total" | "daily";
  limit: number;
  appliesTo?: { agentId?: string; principal?: string };
  /** When set, only events with a matching action count toward this budget. */
  match?: { action?: string };
}

export interface ActionRule {
  id: string;
  match: { action?: string; resource?: string };
  effect: "allow" | "deny" | "require_approval";
  reason?: string;
}

export interface PeffleConfig {
  storagePath?: string;
  policyPath?: string;
  policy?: PolicyConfig;
  onApprovalRequired?: (event: ActionEvent) => void;
  approvalRedeemTtlMs?: number;
}

export interface Peffle {
  /** Advisory only — see `checkPolicy` in policy module; use `guard()` to enforce. */
  checkPolicy(request: ActionRequest): PolicyDecision;
  guard<T>(
    request: ActionRequest,
    fn: () => Promise<T> | T,
    opts?: GuardOptions
  ): Promise<T>;
  kill(agentId: string, opts?: { reason?: string }): void;
  revive(agentId: string, opts?: { reason?: string }): void;
  query(filter?: LedgerFilter): ActionEvent[];
  approve(eventId: string, opts?: { note?: string }): void;
  deny(eventId: string, opts?: { note?: string }): void;
  revoke(eventId: string, opts?: { note?: string }): void;
  waitForApproval(
    eventId: string,
    opts?: { timeoutMs?: number }
  ): Promise<ActionEvent>;
  close(): void;
}
