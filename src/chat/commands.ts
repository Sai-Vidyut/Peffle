import type { ChatSession } from "./session.js";
import {
  applyPendingKill,
  executeToolCall,
  formatPolicySummary,
} from "../ai/tools.js";
import { formatPolicyDiffHuman, computePolicyDiff } from "../ai/policy-diff.js";
import type { PolicyConfig } from "../core/types.js";
import { parsePolicyConfig } from "../core/schema.js";

export interface CommandResult {
  lines: string[];
  exit?: boolean;
  clear?: boolean;
}

export function handleSlashCommand(session: ChatSession, line: string): CommandResult | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("/")) return null;

  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
  const arg = rest.join(" ").trim();

  switch (cmd.toLowerCase()) {
    case "help":
      return {
        lines: [
          "Commands:",
          "  /help              Show this help",
          "  /show              Current policy",
          "  /policy            Policy editing via natural language (AI) or manual JSON path",
          "  /pending           Pending approvals",
          "  /approve <id>      Approve event",
          "  /deny <id>         Deny event",
          "  /kill <agent>      Kill agent (confirmation)",
          "  /revive <agent>    Revive agent",
          "  /ledger [n]        Recent ledger (default 20)",
          "  /diff              Diff pending proposal",
          "  /validate          Validate pending or current policy",
          "  /clear             Clear screen",
          "  /reset             Clear pending proposals",
          "  /exit              Exit chat",
        ],
      };
    case "exit":
    case "quit":
      return { lines: ["Goodbye."], exit: true };
    case "clear":
      return { lines: [], clear: true };
    case "reset":
      session.pendingProposedPolicy = null;
      session.pendingKillAgentId = null;
      return { lines: ["Pending proposals cleared."] };
    case "show":
      return { lines: [formatPolicySummary(session.getPolicy())] };
    case "policy":
      return {
        lines: [
          "Describe policy changes in natural language (requires PEFFLE_AI_PROVIDER),",
          "or edit the policy file directly:",
          `  ${session.policyPath}`,
          "Then run /show or restart chat.",
        ],
      };
    case "pending": {
      const r = executeToolCall(session, {
        name: "listPendingApprovals",
        arguments: {},
      });
      return { lines: [r.message] };
    }
    case "approve": {
      if (!arg) return { lines: ["Usage: /approve <eventId>"] };
      const r = executeToolCall(session, { name: "approveAction", arguments: { eventId: arg } });
      return { lines: [r.message] };
    }
    case "deny": {
      if (!arg) return { lines: ["Usage: /deny <eventId>"] };
      const r = executeToolCall(session, { name: "denyAction", arguments: { eventId: arg } });
      return { lines: [r.message] };
    }
    case "kill": {
      if (!arg) return { lines: ["Usage: /kill <agentId>"] };
      const r = executeToolCall(session, { name: "killAgent", arguments: { agentId: arg } });
      return { lines: [r.message] };
    }
    case "revive": {
      if (!arg) return { lines: ["Usage: /revive <agentId>"] };
      const r = executeToolCall(session, { name: "reviveAgent", arguments: { agentId: arg } });
      return { lines: [r.message] };
    }
    case "ledger": {
      const limit = arg ? Number(arg) : 20;
      const r = executeToolCall(session, {
        name: "getLedger",
        arguments: { limit: Number.isFinite(limit) ? limit : 20 },
      });
      return { lines: [r.message] };
    }
    case "diff": {
      if (!session.pendingProposedPolicy) {
        return { lines: ["No pending policy proposal."] };
      }
      return {
        lines: [
          formatPolicyDiffHuman(
            computePolicyDiff(session.getPolicy(), session.pendingProposedPolicy)
          ),
        ],
      };
    }
    case "validate": {
      try {
        parsePolicyConfig(session.pendingProposedPolicy ?? session.getPolicy());
        return { lines: ["Policy is valid."] };
      } catch (e) {
        return { lines: [`Invalid policy: ${(e as Error).message}`] };
      }
    }
    default:
      return { lines: [`Unknown command /${cmd}. Try /help.`] };
  }
}

export function handleConfirmation(
  session: ChatSession,
  answer: string
): CommandResult | null {
  const a = answer.trim().toLowerCase();
  if (session.pendingProposedPolicy) {
    if (a === "y" || a === "yes") {
      const r = executeToolCall(session, {
        name: "applyPolicy",
        arguments: { confirm: true },
      });
      return { lines: [r.message] };
    }
    if (a === "n" || a === "no" || a === "e" || a === "edit") {
      session.pendingProposedPolicy = null;
      return { lines: ["Policy change cancelled."] };
    }
    return {
      lines: ["Reply [y] Apply, [n] Cancel, or [e] Edit (cancel)."],
    };
  }
  if (session.pendingKillAgentId) {
    if (a === "y" || a === "yes") {
      const r = applyPendingKill(session);
      return { lines: [r.message] };
    }
    if (a === "n" || a === "no" || a === "") {
      session.pendingKillAgentId = null;
      return { lines: ["Kill cancelled."] };
    }
    return { lines: ["Reply [y] to kill or [n] to cancel."] };
  }
  return null;
}

export function exportFormatPolicySummary(policy: PolicyConfig): string {
  return formatPolicySummary(policy);
}
