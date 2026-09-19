import { describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { memoryRightAuth, testPolicy, agent } from "../helpers.js";

describe("guardTool", () => {
  it("returns handler result when allowed", async () => {
    const ra = memoryRightAuth(testPolicy());
    const wrapped = guardTool(
      (args: { x: number }) => args.x * 2,
      "double",
      { rightauth: ra, agentId: agent.agentId }
    );
    const result = await wrapped({ x: 3 });
    expect(result).toBe(6);
    ra.close();
  });

  it("returns isError on deny", async () => {
    const ra = memoryRightAuth(
      testPolicy({
        actions: [{ id: "d", match: { action: "double" }, effect: "deny" }],
      })
    );
    const wrapped = guardTool(() => "ok", "double", { rightauth: ra, agentId: agent.agentId });
    const result = await wrapped({});
    expect(result).toMatchObject({ isError: true });
    ra.close();
  });
});
