import { describe, expect, it } from "vitest";
import { ConfigValidationError, DEFAULT_POLICY_EXAMPLE, parsePolicyConfig } from "../../src/core/index.js";

describe("schema", () => {
  it("parses example policy", () => {
    expect(parsePolicyConfig(DEFAULT_POLICY_EXAMPLE).version).toBe(1);
  });

  it("rejects invalid policy", () => {
    expect(() => parsePolicyConfig({ version: 2 })).toThrow(ConfigValidationError);
  });

  it("rejects action rule with empty match", () => {
    expect(() =>
      parsePolicyConfig({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [],
        actions: [{ id: "bad", match: {}, effect: "allow" }],
      })
    ).toThrow(ConfigValidationError);
  });
});
