import type { PolicyConfig, RightAuthConfig } from "../src/core/types.js";
import { createRightAuth } from "../src/core/index.js";

export function testPolicy(overrides?: Partial<PolicyConfig>): PolicyConfig {
  const base: PolicyConfig = {
    version: 1,
    defaults: { onNoMatchingRule: "deny" },
    budgets: [],
    actions: [{ id: "allow-all", match: { action: "*" }, effect: "allow" }],
  };
  return {
    ...base,
    ...overrides,
    defaults: overrides?.defaults ?? base.defaults,
    budgets: overrides?.budgets ?? base.budgets,
    actions: overrides?.actions ?? base.actions,
  };
}

export function memoryRightAuth(policy: PolicyConfig, config?: Omit<RightAuthConfig, "policy" | "storagePath">) {
  return createRightAuth({
    storagePath: ":memory:",
    policy,
    ...config,
  });
}

export const agent = { agentId: "agent-1" };
