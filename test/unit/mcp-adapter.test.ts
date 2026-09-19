import { describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("guardTool", () => {
  it("returns handler result when allowed", async () => {
    const ra = memoryPeffle(testPolicy());
    const wrapped = guardTool(
      (args: { x: number }) => args.x * 2,
      "double",
      { peffle: ra, agentId: agent.agentId }
    );
    const result = await wrapped({ x: 3 });
    expect(result).toBe(6);
    ra.close();
  });

  it("returns isError on deny", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "d", match: { action: "double" }, effect: "deny" }],
      })
    );
    const wrapped = guardTool(() => "ok", "double", { peffle: ra, agentId: agent.agentId });
    const result = await wrapped({});
    expect(result).toMatchObject({ isError: true });
    ra.close();
  });
});
