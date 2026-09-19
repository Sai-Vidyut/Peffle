import { afterAll, describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { InvalidAmountError } from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("MCP amount parsing", () => {
  const ra = memoryPeffle(
    testPolicy({
      budgets: [{ id: "b", scope: "global", window: "total", limit: 1000 }],
      actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
    })
  );
  const wrapped = guardTool(vi.fn(() => "ok"), "pay", { peffle: ra, agentId: agent.agentId });

  afterAll(() => ra.close());

  it.each([
    ["string", "999"],
    ["boolean", true],
    ["object", { x: 1 }],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["negative", -1],
  ])("rejects %s amount", async (_label, amount) => {
    const result = await wrapped({ amount });
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "finite non-negative"
    );
  });

  it("allows valid positive number", async () => {
    const result = await wrapped({ amount: 5 });
    expect(result).toBe("ok");
  });

  it("rejects null amount", async () => {
    const result = await wrapped({ amount: null });
    expect(result).toMatchObject({ isError: true });
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "finite non-negative"
    );
  });
});
