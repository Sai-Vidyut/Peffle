import { describe, expect, it } from "vitest";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("principal-scoped budgets", () => {
  it("denies when principal is missing for principal scope", () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [{ id: "p-cap", scope: "principal", window: "total", limit: 100 }],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    const d = ra.checkPolicy({ agent, action: "pay", amount: 1 });
    expect(d.outcome).toBe("deny");
    if (d.outcome === "deny") expect(d.reason).toBe("principal_required");
    ra.close();
  });

  it("principal-less agent is not denied by appliesTo.principal rule for another org", () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [
          {
            id: "org-a-cap",
            scope: "principal",
            window: "total",
            limit: 50,
            appliesTo: { principal: "org-A" },
          },
        ],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    const d = ra.checkPolicy({ agent, action: "pay", amount: 1 });
    expect(d.outcome).toBe("allow");
    ra.close();
  });

  it("enforces appliesTo.principal when agent principal matches", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [
          {
            id: "org-a-cap",
            scope: "principal",
            window: "total",
            limit: 5,
            appliesTo: { principal: "org-A" },
          },
        ],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    const orgAgent = { agentId: "a-org", principal: "org-A" };
    await ra.guard({ agent: orgAgent, action: "pay", amount: 4 }, async () => "ok");
    await expect(
      ra.guard({ agent: orgAgent, action: "pay", amount: 2 }, async () => "x")
    ).rejects.toThrow();
    ra.close();
  });

  it("appliesTo.principal rule does not cap spend for a different principal", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [
          {
            id: "org-a-cap",
            scope: "principal",
            window: "total",
            limit: 5,
            appliesTo: { principal: "org-A" },
          },
        ],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    await ra.guard(
      { agent: { agentId: "a1", principal: "org-A" }, action: "pay", amount: 5 },
      async () => "ok"
    );
    await expect(
      ra.guard(
        { agent: { agentId: "b1", principal: "org-B" }, action: "pay", amount: 10 },
        async () => "ok"
      )
    ).resolves.toBe("ok");
    ra.close();
  });

  it("multiple principal rules evaluate independently", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [
          {
            id: "cap-a",
            scope: "principal",
            window: "total",
            limit: 3,
            appliesTo: { principal: "org-A" },
          },
          {
            id: "cap-b",
            scope: "principal",
            window: "total",
            limit: 3,
            appliesTo: { principal: "org-B" },
          },
        ],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    await ra.guard(
      { agent: { agentId: "a1", principal: "org-A" }, action: "pay", amount: 3 },
      async () => "ok"
    );
    await ra.guard(
      { agent: { agentId: "b1", principal: "org-B" }, action: "pay", amount: 3 },
      async () => "ok"
    );
    await expect(
      ra.guard(
        { agent: { agentId: "a1", principal: "org-A" }, action: "pay", amount: 1 },
        async () => "x"
      )
    ).rejects.toThrow();
    ra.close();
  });

  it("counts spend only for matching principal", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [{ id: "p-cap", scope: "principal", window: "total", limit: 5 }],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    const a1 = { agentId: "a1", principal: "org-1" };
    const a2 = { agentId: "a2", principal: "org-2" };
    await ra.guard({ agent: a1, action: "pay", amount: 4 }, async () => "ok");
    await expect(
      ra.guard({ agent: a1, action: "pay", amount: 2 }, async () => "x")
    ).rejects.toThrow();
    await expect(
      ra.guard({ agent: a2, action: "pay", amount: 4 }, async () => "ok")
    ).resolves.toBe("ok");
    ra.close();
  });
});
