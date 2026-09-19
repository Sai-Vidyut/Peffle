import type { ActionRequest, GuardOptions, PolicyConfig, PeffleConfig, PolicyDecision } from "./types.js";
import type { PeffleStorage } from "./storage.js";
import { checkPolicy, evaluateBudgets, isAgentEffectivelyKilled } from "./policy.js";
import {
  AgentKilledError,
  ApprovalAlreadyConsumedError,
  ApprovalDeniedError,
  ApprovalExpiredError,
  ApprovalFingerprintMismatchError,
  ApprovalNotFoundError,
  ApprovalNotYetGrantedError,
  ApprovalRequiredError,
  ApprovalTokenInvalidError,
  BudgetExceededError,
  PolicyDeniedError,
  PrincipalRequiredError,
} from "./errors.js";
import {
  newApprovalToken,
  newEventId,
  nowIso,
  requestFingerprint,
  secureCompareHex,
  sha256Hex,
} from "./util.js";
import { normalizeActionRequest } from "./validate-request.js";

export interface GuardContext {
  storage: PeffleStorage;
  policy: PolicyConfig;
  config: PeffleConfig;
}

function throwForDeny(decision: Extract<PolicyDecision, { outcome: "deny" }>, eventId: string): never {
  if (decision.budget) {
    throw new BudgetExceededError(
      decision.budget.limit,
      decision.budget.spent,
      eventId,
      decision.rule
    );
  }
  if (decision.reason === "principal_required") {
    throw new PrincipalRequiredError(decision.rule);
  }
  throw new PolicyDeniedError(decision.reason, eventId, decision.rule);
}

export async function runGuard<T>(
  ctx: GuardContext,
  request: ActionRequest,
  fn: () => Promise<T> | T,
  opts?: GuardOptions
): Promise<T> {
  const normalized = normalizeActionRequest(request);
  if (opts?.approval) {
    return redeemApproval(ctx, normalized, fn, opts.approval);
  }
  return firstAttempt(ctx, normalized, fn);
}

type FirstAttemptTx =
  | { kind: "deny"; decision: Extract<PolicyDecision, { outcome: "deny" }> }
  | { kind: "approval"; token: string }
  | { kind: "proceed" };

async function firstAttempt<T>(
  ctx: GuardContext,
  request: ActionRequest,
  fn: () => Promise<T> | T
): Promise<T> {
  const eventId = newEventId();

  const tx = ctx.storage.transactionImmediate((): FirstAttemptTx => {
    const killed = isAgentEffectivelyKilled(ctx.storage, request.agent);
    if (killed.killed) {
      ctx.storage.insertEvent(eventId, request, "denied", "kill-switch");
      return {
        kind: "deny",
        decision: {
          outcome: "deny",
          reason: "agent_killed",
          rule: "kill-switch",
        },
      };
    }

    const decision = checkPolicy(ctx.storage, ctx.policy, request);

    if (decision.outcome === "deny") {
      ctx.storage.insertEvent(eventId, request, "denied", decision.rule);
      return { kind: "deny", decision };
    }

    if (decision.outcome === "require_approval") {
      const token = newApprovalToken();
      const fingerprint = requestFingerprint(request);
      const tokenHash = sha256Hex(token);
      ctx.storage.insertEvent(eventId, request, "pending", decision.ruleId);
      ctx.storage.insertApproval(eventId, fingerprint, tokenHash);
      return { kind: "approval", token };
    }

    ctx.storage.insertEvent(eventId, request, "in_progress");
    return { kind: "proceed" };
  });

  if (tx.kind === "deny") {
    if (tx.decision.reason === "agent_killed") {
      throw new AgentKilledError(request.agent.agentId);
    }
    throwForDeny(tx.decision, eventId);
  }

  if (tx.kind === "approval") {
    const event = ctx.storage.getEvent(eventId);
    if (event && ctx.config.onApprovalRequired) {
      ctx.config.onApprovalRequired(event);
    }
    throw new ApprovalRequiredError(eventId, tx.token);
  }

  if (tx.kind !== "proceed") {
    throw new PolicyDeniedError("Unexpected guard state", eventId);
  }

  try {
    const result = await fn();
    ctx.storage.updateEventStatus(eventId, "completed");
    return result;
  } catch (err) {
    ctx.storage.updateEventStatus(eventId, "failed");
    throw err;
  }
}

type RedeemTxResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "not_yet" | "denied" | "consumed" | "expired" | "fingerprint" | "token" | "killed" | "budget"; budget?: { limit: number; spent: number; rule: string }; expiresAt?: string; agentId?: string };

async function redeemApproval<T>(
  ctx: GuardContext,
  request: ActionRequest,
  fn: () => Promise<T> | T,
  approval: { eventId: string; token: string }
): Promise<T> {
  const { eventId, token } = approval;
  const tokenHash = sha256Hex(token);
  const fingerprint = requestFingerprint(request);

  const row = ctx.storage.getApproval(eventId);
  if (!row) throw new ApprovalNotFoundError(eventId);
  if (row.status === "pending") throw new ApprovalNotYetGrantedError(eventId);
  if (row.status === "denied") throw new ApprovalDeniedError(eventId);
  if (row.status === "consumed") throw new ApprovalAlreadyConsumedError(eventId);
  const preCheckNow = nowIso();
  if (row.status === "approved" && row.expires_at && row.expires_at <= preCheckNow) {
    throw new ApprovalExpiredError(eventId, row.expires_at);
  }
  if (!secureCompareHex(fingerprint, row.fingerprint)) {
    throw new ApprovalFingerprintMismatchError(eventId);
  }
  if (!secureCompareHex(tokenHash, row.token_hash)) {
    throw new ApprovalTokenInvalidError(eventId);
  }

  const txResult = ctx.storage.transactionImmediate((): RedeemTxResult => {
    const now = nowIso();
    const killed = isAgentEffectivelyKilled(ctx.storage, request.agent);
    if (killed.killed) {
      return { ok: false, code: "killed", agentId: killed.agentId ?? request.agent.agentId };
    }

    const live = ctx.storage.getApproval(eventId);
    if (!live) {
      return { ok: false, code: "not_found" };
    }
    if (live.status === "consumed") {
      return { ok: false, code: "consumed" };
    }
    if (live.status === "denied") {
      return { ok: false, code: "denied" };
    }
    if (live.status === "pending") {
      return { ok: false, code: "not_yet" };
    }
    if (live.status !== "approved") {
      return { ok: false, code: "not_found" };
    }
    if (live.expires_at && live.expires_at <= now) {
      return { ok: false, code: "expired", expiresAt: live.expires_at };
    }
    if (!secureCompareHex(fingerprint, live.fingerprint) || !secureCompareHex(tokenHash, live.token_hash)) {
      return { ok: false, code: "token" };
    }

    const budgetBlock = evaluateBudgets(ctx.storage, ctx.policy, request);
    if (budgetBlock && budgetBlock.outcome === "deny") {
      return {
        ok: false,
        code: "budget",
        budget: budgetBlock.budget
          ? { limit: budgetBlock.budget.limit, spent: budgetBlock.budget.spent, rule: budgetBlock.rule }
          : { limit: 0, spent: 0, rule: budgetBlock.rule },
      };
    }

    const ok = ctx.storage.consumeApproval(eventId, tokenHash, now);
    if (!ok) {
      const after = ctx.storage.getApproval(eventId);
      if (after?.status === "denied") return { ok: false, code: "denied" };
      return { ok: false, code: "consumed" };
    }

    ctx.storage.updateEventStatus(eventId, "in_progress");
    return { ok: true };
  });

  if (!txResult.ok) {
    switch (txResult.code) {
      case "killed":
        throw new AgentKilledError(txResult.agentId ?? request.agent.agentId);
      case "not_found":
        throw new ApprovalNotFoundError(eventId);
      case "not_yet":
        throw new ApprovalNotYetGrantedError(eventId);
      case "denied":
        throw new ApprovalDeniedError(eventId);
      case "consumed":
        throw new ApprovalAlreadyConsumedError(eventId);
      case "expired":
        throw new ApprovalExpiredError(eventId, txResult.expiresAt!);
      case "fingerprint":
        throw new ApprovalFingerprintMismatchError(eventId);
      case "token":
        throw new ApprovalTokenInvalidError(eventId);
      case "budget":
        throw new BudgetExceededError(
          txResult.budget!.limit,
          txResult.budget!.spent,
          eventId,
          txResult.budget!.rule
        );
    }
  }

  try {
    const result = await fn();
    ctx.storage.updateEventStatus(eventId, "completed");
    return result;
  } catch (err) {
    ctx.storage.updateEventStatus(eventId, "failed");
    throw err;
  }
}
