import { z } from "zod";
import type { PolicyConfig } from "./types.js";
import { ConfigValidationError } from "./errors.js";

const budgetRuleSchema = z.object({
  id: z.string().min(1),
  scope: z.enum(["global", "agent", "principal"]),
  window: z.enum(["total", "daily"]),
  limit: z.number().nonnegative(),
  appliesTo: z
    .object({
      agentId: z.string().optional(),
      principal: z.string().optional(),
    })
    .optional(),
  match: z
    .object({
      action: z.string().optional(),
    })
    .optional(),
});

const actionRuleSchema = z
  .object({
    id: z.string().min(1),
    match: z.object({
      action: z.string().optional(),
      resource: z.string().optional(),
    }),
    effect: z.enum(["allow", "deny", "require_approval"]),
    reason: z.string().optional(),
  })
  .refine((r) => r.match.action !== undefined || r.match.resource !== undefined, {
    message: "ActionRule.match must include action or resource",
    path: ["match"],
  });

export const policyConfigSchema = z.object({
  version: z.literal(1),
  defaults: z.object({
    onNoMatchingRule: z.enum(["allow", "deny"]),
  }),
  budgets: z.array(budgetRuleSchema),
  actions: z.array(actionRuleSchema),
});

export function parsePolicyConfig(raw: unknown): PolicyConfig {
  const result = policyConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigValidationError("Invalid policy configuration", result.error.issues);
  }
  return result.data;
}

export function loadPolicyFromJson(text: string): PolicyConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ConfigValidationError("Policy file is not valid JSON", []);
  }
  return parsePolicyConfig(parsed);
}
