import { describe, expect, it, vi } from "vitest";
import {
  ApprovalRequiredError,
  BudgetExceededError,
  PolicyDeniedError,
  PrincipalRequiredError,
} from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("guard", () => {
  it("executes fn on allow", async () => {
    const ra = memoryPeffle(testPolicy());
    const fn = vi.fn(() => "ok");
    const result = await ra.guard({ agent, action: "read_x" }, fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
    ra.close();
  });

  it("does not call fn on deny", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "d", match: { action: "bad" }, effect: "deny" }],
      })
    );
    const fn = vi.fn();
    await expect(ra.guard({ agent, action: "bad" }, fn)).rejects.toBeInstanceOf(
      PolicyDeniedError
    );
    expect(fn).not.toHaveBeenCalled();
    ra.close();
  });

  it("require_approval throws without running fn", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [
          { id: "inv", match: { action: "send_invoice" }, effect: "require_approval" },
        ],
      })
    );
    const fn = vi.fn();
    await expect(
      ra.guard({ agent, action: "send_invoice", amount: 10 }, fn)
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
    expect(fn).not.toHaveBeenCalled();
    ra.close();
  });

  it("throws PrincipalRequiredError for principal-scoped budget without principal", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [{ id: "p-cap", scope: "principal", window: "total", limit: 100 }],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    await expect(ra.guard({ agent, action: "pay", amount: 1 }, async () => "x")).rejects.toBeInstanceOf(
      PrincipalRequiredError
    );
    ra.close();
  });

  it("budget concurrency allows only one of two overspend calls", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [{ id: "b", scope: "global", window: "total", limit: 100 }],
        actions: [{ id: "a", match: { action: "*" }, effect: "allow" }],
      })
    );
    const req = { agent, action: "pay", amount: 60 };
    const results = await Promise.allSettled([
      ra.guard(req, async () => "a"),
      ra.guard(req, async () => "b"),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BudgetExceededError);
    ra.close();
  });
});
