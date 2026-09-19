import { describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { takeMcpRedemptionHandle } from "../../src/mcp/redemption-registry.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("MCP approval response serialization", () => {
  it("JSON.stringify of tool result does not include plaintext redemption token", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    const wrapped = guardTool(vi.fn(), "send_invoice", { peffle: ra, agentId: agent.agentId });

    const result = await wrapped({ amount: 1 });
    const serialized = JSON.stringify(result);
    expect(result).toMatchObject({
      redemptionHandle: expect.any(String),
    });
    expect(serialized).not.toMatch(/redemptionToken/);

    const creds = takeMcpRedemptionHandle(
      (result as { redemptionHandle: string }).redemptionHandle
    );
    expect(creds?.token.length).toBeGreaterThan(10);
    expect(serialized).not.toContain(creds!.token);

    ra.close();
  });
});
