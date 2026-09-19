import { describe, expect, it, afterAll } from "vitest";
import { InvalidAmountError } from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("amount validation", () => {
  const ra = memoryPeffle(
    testPolicy({
      budgets: [{ id: "b", scope: "global", window: "total", limit: 10 }],
      actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
    })
  );

  afterAll(() => ra.close());

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
    ["negative", -1],
  ])("rejects %s", async (_label, amount) => {
    await expect(ra.guard({ agent, action: "pay", amount }, async () => "x")).rejects.toBeInstanceOf(
      InvalidAmountError
    );
    expect(() => ra.checkPolicy({ agent, action: "pay", amount })).toThrow(InvalidAmountError);
  });

  it("allows zero and positive amounts", async () => {
    await expect(ra.guard({ agent, action: "pay", amount: 0 }, async () => "ok")).resolves.toBe(
      "ok"
    );
    await expect(ra.guard({ agent, action: "pay", amount: 3 }, async () => "ok")).resolves.toBe(
      "ok"
    );
  });

  it("NaN cannot poison budget accounting", async () => {
    const poison = memoryPeffle(
      testPolicy({
        budgets: [{ id: "b", scope: "global", window: "total", limit: 5 }],
        actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
      })
    );
    await expect(
      poison.guard({ agent, action: "pay", amount: NaN }, async () => "x")
    ).rejects.toBeInstanceOf(InvalidAmountError);
    await poison.guard({ agent, action: "pay", amount: 5 }, async () => "x");
    await expect(
      poison.guard({ agent, action: "pay", amount: 1 }, async () => "x")
    ).rejects.toThrow();
    poison.close();
  });
});
