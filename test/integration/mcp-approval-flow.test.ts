import { describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { memoryRightAuth, testPolicy, agent } from "../helpers.js";

describe("MCP approval flow", () => {
  it("require_approval → approve → redeem executes once", async () => {
    const ra = memoryRightAuth(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    const handler = vi.fn(() => ({ sent: true }));
    const wrapped = guardTool(handler, "send_invoice", {
      rightauth: ra,
      agentId: agent.agentId,
    });

    const first = await wrapped({ amount: 12 });
    expect(first).toMatchObject({
      isError: true,
      rightauthApprovalRequired: true,
      eventId: expect.any(String),
      redemptionHandle: expect.any(String),
    });
    expect(handler).not.toHaveBeenCalled();

    const { eventId, redemptionHandle } = first as {
      eventId: string;
      redemptionHandle: string;
    };
    ra.approve(eventId);

    const second = await wrapped({
      amount: 12,
      rightauthApproval: { handle: redemptionHandle },
    });
    expect(second).toEqual({ sent: true });
    expect(handler).toHaveBeenCalledOnce();

    const third = await wrapped({
      amount: 12,
      rightauthApproval: { handle: redemptionHandle },
    });
    expect(third).toMatchObject({ isError: true });
    expect(handler).toHaveBeenCalledOnce();

    ra.close();
  });
});
