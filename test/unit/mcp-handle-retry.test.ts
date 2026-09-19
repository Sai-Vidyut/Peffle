import { describe, expect, it, vi } from "vitest";
import { guardTool } from "../../src/mcp/adapter.js";
import { peekMcpRedemptionHandle } from "../../src/mcp/redemption-registry.js";
import { memoryRightAuth, testPolicy, agent } from "../helpers.js";

describe("MCP redemption handle retry", () => {
  it("keeps handle after budget exhaustion then redeems on retry", async () => {
    const ra = memoryRightAuth(
      testPolicy({
        budgets: [{ id: "cap", scope: "global", window: "total", limit: 10 }],
        actions: [
          { id: "pay", match: { action: "pay" }, effect: "allow" },
          { id: "inv", match: { action: "send_invoice" }, effect: "require_approval" },
        ],
      })
    );
    const handler = vi.fn(() => ({ sent: true }));
    const wrapped = guardTool(handler, "send_invoice", {
      rightauth: ra,
      agentId: agent.agentId,
    });

    const first = await wrapped({ amount: 8 });
    expect(first).toMatchObject({ rightauthApprovalRequired: true });
    const { eventId, redemptionHandle } = first as {
      eventId: string;
      redemptionHandle: string;
    };
    ra.approve(eventId);

    let releasePay!: () => void;
    const payGate = new Promise<void>((resolve) => {
      releasePay = resolve;
    });
    const payRun = ra.guard({ agent, action: "pay", amount: 3 }, async () => {
      await payGate;
      throw new Error("abort pay");
    });

    await new Promise((r) => setTimeout(r, 20));

    const fail = await wrapped({
      amount: 8,
      rightauthApproval: { handle: redemptionHandle },
    });
    expect(fail).toMatchObject({ isError: true });
    expect(String((fail as { content: { text: string }[] }).content[0].text)).toMatch(
      /Budget exceeded/
    );
    expect(handler).not.toHaveBeenCalled();
    expect(peekMcpRedemptionHandle(redemptionHandle)).toEqual(
      expect.objectContaining({ eventId })
    );

    releasePay();
    await expect(payRun).rejects.toThrow("abort pay");

    const ok = await wrapped({
      amount: 8,
      rightauthApproval: { handle: redemptionHandle },
    });
    expect(ok).toEqual({ sent: true });
    expect(handler).toHaveBeenCalledOnce();
    expect(peekMcpRedemptionHandle(redemptionHandle)).toBeUndefined();

    ra.close();
  });
});
