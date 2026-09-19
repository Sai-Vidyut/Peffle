import type { ActionRequest, PolicyConfig, PolicyDecision } from "./types.js";
import type { PeffleStorage } from "./storage.js";
import { matchActionRule } from "./util.js";

export function isAgentEffectivelyKilled(
  storage: PeffleStorage,
  agent: ActionRequest["agent"]
): { killed: boolean; agentId?: string } {
  if (storage.getAgentStatus(agent.agentId) === "killed") {
    return { killed: true, agentId: agent.agentId };
  }
  for (const ancestorId of agent.delegationChain ?? []) {
    if (storage.getAgentStatus(ancestorId) === "killed") {
      return { killed: true, agentId: ancestorId };
    }
  }
  return { killed: false };
}

export function evaluateBudgets(
  storage: PeffleStorage,
  policy: PolicyConfig,
  request: ActionRequest
): PolicyDecision | null {
  const add = request.amount ?? 0;
  for (const rule of policy.budgets) {
    if (
      rule.match?.action &&
      !matchActionRule({ action: rule.match.action }, request.action, request.resource)
    ) {
      continue;
    }
    if (rule.scope === "agent" && rule.appliesTo?.agentId && rule.appliesTo.agentId !== request.agent.agentId) {
      continue;
    }
    if (rule.scope === "principal") {
      const rulePrincipal = rule.appliesTo?.principal;
      if (rulePrincipal) {
        if (!request.agent.principal || request.agent.principal !== rulePrincipal) {
          continue;
        }
      } else if (!request.agent.principal) {
        return {
          outcome: "deny",
          reason: "principal_required",
          rule: rule.id,
        };
      }
    }
    const spent = storage.sumBudgetSpend(
      rule.scope,
      rule.window,
      request.agent.agentId,
      request.agent.principal,
      rule.appliesTo,
      rule.match?.action
    );
    if (spent + add > rule.limit) {
      return {
        outcome: "deny",
        reason: `Budget ${rule.id} exceeded`,
        rule: rule.id,
        budget: { limit: rule.limit, spent: spent + add },
      };
    }
  }
  return null;
}

/**
 * Evaluate policy rules and budgets for a request **without** executing or authorizing it.
 *
 * **Advisory only** — callers must not treat `allow` as permission to run side effects.
 * This function does not reserve budget, write ledger events, enforce the kill switch at
 * execution time, or redeem approvals. All real actions must go through `guard()`.
 */
export function checkPolicy(
  storage: PeffleStorage,
  policy: PolicyConfig,
  request: ActionRequest,
  options?: { skipActionRules?: boolean }
): PolicyDecision {
  const skipActionRules = options?.skipActionRules ?? false;

  if (isAgentEffectivelyKilled(storage, request.agent).killed) {
    return { outcome: "deny", reason: "agent_killed", rule: "kill-switch" };
  }

  if (!skipActionRules) {
    let matched = false;
    for (const rule of policy.actions) {
      if (!matchActionRule(rule.match, request.action, request.resource)) {
        continue;
      }
      matched = true;
      if (rule.effect === "deny") {
        return {
          outcome: "deny",
          reason: rule.reason ?? `Denied by rule ${rule.id}`,
          rule: rule.id,
        };
      }
      if (rule.effect === "require_approval") {
        const budgetBlock = evaluateBudgets(storage, policy, request);
        if (budgetBlock) return budgetBlock;
        return { outcome: "require_approval", ruleId: rule.id };
      }
      break;
    }
    if (!matched && policy.defaults.onNoMatchingRule === "deny") {
      return { outcome: "deny", reason: "No matching allow rule", rule: "default" };
    }
  }

  const budgetBlock = evaluateBudgets(storage, policy, request);
  if (budgetBlock) return budgetBlock;

  return { outcome: "allow" };
}
