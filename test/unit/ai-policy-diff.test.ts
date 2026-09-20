import { describe, expect, it } from "vitest";
import { computePolicyDiff, formatPolicyDiffHuman } from "../../src/ai/policy-diff.js";
import type { PolicyConfig } from "../../src/core/types.js";

const base: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [{ id: "daily", scope: "global", window: "daily", limit: 10 }],
  actions: [{ id: "a1", match: { action: "read_*" }, effect: "allow" }],
};

describe("policy diff", () => {
  it("detects budget and action changes", () => {
    const next: PolicyConfig = {
      ...base,
      budgets: [{ id: "daily", scope: "global", window: "daily", limit: 100 }],
      actions: [
        ...base.actions,
        { id: "deny-del", match: { action: "delete_*" }, effect: "deny" },
      ],
    };
    const lines = computePolicyDiff(base, next);
    expect(lines.some((l) => l.kind === "change" && l.label.includes("daily"))).toBe(true);
    expect(lines.some((l) => l.kind === "add")).toBe(true);
    expect(formatPolicyDiffHuman(lines)).toContain("Policy changes");
  });

  it("reports no changes", () => {
    expect(formatPolicyDiffHuman(computePolicyDiff(base, base))).toContain("No policy changes");
  });
});
