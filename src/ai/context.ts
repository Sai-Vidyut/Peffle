import type { Peffle, PolicyConfig } from "../core/types.js";
import type { PeffleContext } from "./types.js";

const CAPABILITIES = [
  "Read and explain policy (budgets, action rules, defaults)",
  "Propose policy changes (requires user confirmation before apply)",
  "List / approve / deny pending approvals",
  "Inspect audit ledger",
  "Kill / revive agents (kill requires confirmation)",
  "Validate policy JSON against schema",
];

export function buildPeffleContext(
  peffle: Peffle,
  policyPath: string,
  storagePath: string,
  policy: PolicyConfig
): PeffleContext {
  const pendingApprovals = peffle.query({ status: "pending", limit: 20 });
  const recentLedger = peffle.query({ limit: 15 });
  const knownActions = [
    ...new Set([
      ...policy.actions.map((a) => a.match.action ?? a.match.resource ?? a.id),
      ...recentLedger.map((e) => e.action),
    ]),
  ].filter(Boolean);

  const agentIds = [
    ...new Set([
      ...pendingApprovals.map((e) => e.agent.agentId),
      ...recentLedger.map((e) => e.agent.agentId),
    ]),
  ];

  return {
    policyPath,
    storagePath,
    policy,
    pendingApprovals,
    recentLedger,
    knownActions,
    agentStatuses: agentIds.map((agentId) => ({
      agentId,
      status: "unknown" as const,
    })),
    capabilities: CAPABILITIES,
  };
}

export function contextForPrompt(ctx: PeffleContext): string {
  return JSON.stringify(
    {
      policyPath: ctx.policyPath,
      budgets: ctx.policy.budgets,
      actions: ctx.policy.actions.map((a) => ({
        id: a.id,
        match: a.match,
        effect: a.effect,
      })),
      defaults: ctx.policy.defaults,
      pendingCount: ctx.pendingApprovals.length,
      pending: ctx.pendingApprovals.map((e) => ({
        id: e.id,
        agent: e.agent.agentId,
        action: e.action,
        amount: e.amount,
      })),
      recentLedger: ctx.recentLedger.slice(0, 8).map((e) => ({
        id: e.id,
        agent: e.agent.agentId,
        action: e.action,
        status: e.status,
        amount: e.amount,
      })),
      knownActions: ctx.knownActions.slice(0, 40),
      capabilities: ctx.capabilities,
    },
    null,
    2
  );
}
