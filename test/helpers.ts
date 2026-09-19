import type { PolicyConfig, PeffleConfig } from "../src/core/types.js";
import { createPeffle } from "../src/core/index.js";

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

export function memoryPeffle(policy: PolicyConfig, config?: Omit<PeffleConfig, "policy" | "storagePath">) {
  return createPeffle({
    storagePath: ":memory:",
    policy,
    ...config,
  });
}

export const agent = { agentId: "agent-1" };
