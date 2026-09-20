import { readFileSync, writeFileSync } from "node:fs";
import type { Peffle } from "../core/types.js";
import type { PolicyConfig } from "../core/types.js";
import { parsePolicyConfig } from "../core/schema.js";
import type { PeffleToolCall, PeffleToolName } from "./types.js";
import { computePolicyDiff, formatPolicyDiffHuman } from "./policy-diff.js";
import { isPeffleToolName, parseToolArguments, ToolArgumentError } from "./tool-schemas.js";

export interface ToolSession {
  peffle: Peffle;
  policyPath: string;
  getPolicy(): PolicyConfig;
  setPolicy(policy: PolicyConfig): void;
  reloadPeffle(): void;
  pendingProposedPolicy: PolicyConfig | null;
  pendingKillAgentId: string | null;
}

export interface ToolResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

export function executeToolCall(session: ToolSession, call: PeffleToolCall): ToolResult {
  if (!isPeffleToolName(call.name)) {
    return { ok: false, message: `Rejected unknown tool: ${call.name}` };
  }
  try {
    const args = parseToolArguments(call.name, call.arguments);
    return runTool(session, call.name, args);
  } catch (e) {
    if (e instanceof ToolArgumentError) {
      return { ok: false, message: e.message };
    }
    throw e;
  }
}

function runTool(
  session: ToolSession,
  name: PeffleToolName,
  args: Record<string, unknown>
): ToolResult {
  switch (name) {
    case "getPolicy":
      return {
        ok: true,
        message: formatPolicySummary(session.getPolicy()),
        data: session.getPolicy(),
      };
    case "proposePolicyChange": {
      const { policy, summary } = args as { policy: PolicyConfig; summary: string };
      parsePolicyConfig(policy);
      session.pendingProposedPolicy = policy;
      const diff = formatPolicyDiffHuman(
        computePolicyDiff(session.getPolicy(), policy)
      );
      return {
        ok: true,
        message: `${summary}\n\n${diff}\n\nNo changes have been made yet.\nApply these changes?  [y] Apply  [n] Cancel  [e] Edit (cancel for now)`,
        data: { proposed: policy, diff },
      };
    }
    case "validatePolicy": {
      const p = session.pendingProposedPolicy ?? session.getPolicy();
      parsePolicyConfig(p);
      return { ok: true, message: "Policy configuration is valid." };
    }
    case "getPolicyDiff": {
      const proposed =
        (args as { proposedPolicy?: PolicyConfig }).proposedPolicy ??
        session.pendingProposedPolicy;
      if (!proposed) {
        return { ok: false, message: "No proposed policy to diff." };
      }
      return {
        ok: true,
        message: formatPolicyDiffHuman(computePolicyDiff(session.getPolicy(), proposed)),
      };
    }
    case "applyPolicy": {
      if (!session.pendingProposedPolicy) {
        return { ok: false, message: "Nothing to apply. Propose a policy change first." };
      }
      const next = session.pendingProposedPolicy;
      parsePolicyConfig(next);
      writeFileSync(session.policyPath, JSON.stringify(next, null, 2) + "\n", "utf8");
      session.setPolicy(next);
      session.reloadPeffle();
      session.pendingProposedPolicy = null;
      return { ok: true, message: "Policy applied and saved." };
    }
    case "listPendingApprovals": {
      const pending = session.peffle.query({ status: "pending" });
      if (pending.length === 0) {
        return { ok: true, message: "No pending approvals." };
      }
      const lines = pending.map(
        (e) => `${e.id}  agent=${e.agent.agentId}  action=${e.action}  amount=${e.amount ?? ""}`
      );
      return { ok: true, message: lines.join("\n"), data: pending };
    }
    case "approveAction": {
      const { eventId } = args as { eventId: string };
      session.peffle.approve(eventId);
      return { ok: true, message: `Approved ${eventId}` };
    }
    case "denyAction": {
      const { eventId } = args as { eventId: string };
      session.peffle.deny(eventId);
      return { ok: true, message: `Denied ${eventId}` };
    }
    case "getLedger": {
      const { limit, agentId } = args as { limit?: number; agentId?: string };
      const events = session.peffle.query({
        limit: limit ?? 20,
        agentId,
      });
      if (events.length === 0) return { ok: true, message: "Ledger is empty." };
      const lines = events.map(
        (e) =>
          `${e.createdAt}  ${e.id}  ${e.agent.agentId}  ${e.action}  ${e.status}  ${e.amount ?? ""}`
      );
      return { ok: true, message: lines.join("\n"), data: events };
    }
    case "killAgent": {
      const { agentId } = args as { agentId: string };
      session.pendingKillAgentId = agentId;
      return {
        ok: true,
        message: `Kill agent "${agentId}"? This blocks guarded actions.  [y/N]`,
      };
    }
    case "reviveAgent": {
      const { agentId } = args as { agentId: string };
      session.peffle.revive(agentId);
      return { ok: true, message: `Revived agent ${agentId}` };
    }
    case "getAgentStatus": {
      const { agentId } = args as { agentId: string };
      const decision = session.peffle.checkPolicy({
        agent: { agentId },
        action: "__peffle_status_probe__",
        amount: 0,
      });
      const killed =
        decision.outcome === "deny" &&
        (decision.reason === "agent_killed" || decision.rule === "kill-switch");
      const events = session.peffle.query({ agentId, limit: 3 });
      const recent = events.length
        ? `Recent ledger: ${events.map((e) => `${e.action}/${e.status}`).join(", ")}`
        : "No ledger events yet.";
      return {
        ok: true,
        message: `Agent ${agentId}: ${killed ? "KILLED" : "active (not kill-blocked)"}. ${recent}`,
      };
    }
    case "listKnownActions": {
      const fromPolicy = session
        .getPolicy()
        .actions.map((a) => a.match.action ?? a.match.resource ?? a.id);
      const fromLedger = [
        ...new Set(session.peffle.query({ limit: 50 }).map((e) => e.action)),
      ];
      const all = [...new Set([...fromPolicy, ...fromLedger])].sort();
      return {
        ok: true,
        message: all.length ? all.join("\n") : "No actions recorded yet.",
        data: all,
      };
    }
    default:
      return { ok: false, message: `Unsupported tool: ${name}` };
  }
}

export function applyPendingKill(session: ToolSession): ToolResult {
  const id = session.pendingKillAgentId;
  if (!id) return { ok: false, message: "No kill pending." };
  session.peffle.kill(id);
  session.pendingKillAgentId = null;
  return { ok: true, message: `Killed agent ${id}` };
}

export function loadPolicyFile(path: string): PolicyConfig {
  return parsePolicyConfig(JSON.parse(readFileSync(path, "utf8")));
}

export function formatPolicySummary(policy: PolicyConfig): string {
  const budgets = policy.budgets
    .map((b) => `  ${b.id}: $${b.limit} (${b.window}, ${b.scope})`)
    .join("\n");
  const actions = policy.actions
    .map((a) => {
      const m = a.match.action ?? a.match.resource ?? "*";
      return `  ${m.padEnd(24)} ${a.effect}`;
    })
    .join("\n");
  return `BUDGETS\n${budgets || "  (none)"}\n\nACTIONS\n${actions || "  (none)"}\n\nDefault when unmatched: ${policy.defaults.onNoMatchingRule}`;
}
