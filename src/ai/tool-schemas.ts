import { z } from "zod";
import type { PeffleToolName } from "./types.js";
import { policyConfigSchema } from "../core/schema.js";

export const PEFFLE_TOOL_NAMES: PeffleToolName[] = [
  "getPolicy",
  "proposePolicyChange",
  "validatePolicy",
  "getPolicyDiff",
  "applyPolicy",
  "listPendingApprovals",
  "approveAction",
  "denyAction",
  "getLedger",
  "killAgent",
  "reviveAgent",
  "getAgentStatus",
  "listKnownActions",
];

const eventIdSchema = z.object({ eventId: z.string().min(1) });
const agentIdSchema = z.object({ agentId: z.string().min(1) });
const ledgerSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  agentId: z.string().optional(),
});
const proposeSchema = z.object({
  policy: policyConfigSchema,
  summary: z.string().min(1).max(4000),
});
const applySchema = z.object({ confirm: z.literal(true) });
const diffSchema = z.object({ proposedPolicy: policyConfigSchema.optional() });

export function parseToolArguments(
  name: PeffleToolName,
  args: unknown
): Record<string, unknown> {
  if (typeof args !== "object" || args === null) {
    throw new ToolArgumentError(name, "arguments must be an object");
  }
  const raw = args as Record<string, unknown>;
  switch (name) {
    case "getPolicy":
    case "listPendingApprovals":
    case "listKnownActions":
    case "validatePolicy":
      return {};
    case "proposePolicyChange": {
      const r = proposeSchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, r.error.message);
      return r.data;
    }
    case "getPolicyDiff": {
      const r = diffSchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, r.error.message);
      return r.data;
    }
    case "applyPolicy": {
      const r = applySchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, "applyPolicy requires confirm: true");
      return r.data;
    }
    case "approveAction":
    case "denyAction": {
      const r = eventIdSchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, "eventId required");
      return r.data;
    }
    case "killAgent":
    case "reviveAgent":
    case "getAgentStatus": {
      const r = agentIdSchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, "agentId required");
      return r.data;
    }
    case "getLedger": {
      const r = ledgerSchema.safeParse(raw);
      if (!r.success) throw new ToolArgumentError(name, r.error.message);
      return r.data;
    }
    default:
      throw new ToolArgumentError(name, "unsupported tool");
  }
}

export class ToolArgumentError extends Error {
  constructor(
    readonly tool: PeffleToolName,
    message: string
  ) {
    super(`Invalid ${tool} arguments: ${message}`);
    this.name = "ToolArgumentError";
  }
}

export function isPeffleToolName(name: string): name is PeffleToolName {
  return (PEFFLE_TOOL_NAMES as string[]).includes(name);
}
