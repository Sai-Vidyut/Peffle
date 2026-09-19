import { describe, expect, it } from "vitest";
import { ApprovalRequiredError, getApprovalRedemption } from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("kill switch", () => {
  it("denies killed agent", () => {
    const ra = memoryPeffle(testPolicy({ actions: [{ id: "a", match: { action: "*" }, effect: "allow" }] }));
    ra.kill(agent.agentId);
    expect(ra.checkPolicy({ agent, action: "x" }).outcome).toBe("deny");
    ra.close();
  });

  it("kill is idempotent", () => {
    const ra = memoryPeffle(testPolicy());
    ra.kill(agent.agentId, { reason: "one" });
    ra.kill(agent.agentId, { reason: "two" });
    expect(ra.checkPolicy({ agent, action: "x" }).outcome).toBe("deny");
    ra.close();
  });

  it("killed ancestor denies descendant", () => {
    const ra = memoryPeffle(testPolicy({ actions: [{ id: "a", match: { action: "*" }, effect: "allow" }] }));
    ra.kill("parent");
    const child = { agentId: "child", delegationChain: ["parent"] };
    expect(ra.checkPolicy({ agent: child, action: "x" }).outcome).toBe("deny");
    ra.close();
  });

  it("revive parent does not revive independently killed child", () => {
    const ra = memoryPeffle(testPolicy({ actions: [{ id: "a", match: { action: "*" }, effect: "allow" }] }));
    ra.kill("parent");
    ra.kill("child");
    ra.revive("parent");
    expect(ra.checkPolicy({ agent: { agentId: "child" }, action: "x" }).outcome).toBe("deny");
    ra.close();
  });

  it("ancestor kill voids descendant pending approval in ledger", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    const child = { agentId: "child", delegationChain: ["parent"] };
    let eventId = "";
    try {
      await ra.guard({ agent: child, action: "send_invoice", amount: 1 }, () => {});
    } catch (e) {
      eventId = getApprovalRedemption(e as ApprovalRequiredError).eventId;
    }
    ra.kill("parent");
    const events = ra.query({ status: "approval_denied" });
    expect(events.some((e) => e.id === eventId)).toBe(true);
    ra.close();
  });

  it("kill with LIKE metacharacters does not void unrelated delegation matches", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    const exactChild = { agentId: "child-exact", delegationChain: ["p_a"] };
    const lookalikeChild = { agentId: "child-look", delegationChain: ["p1a"] };
    let exactEventId = "";
    let lookEventId = "";
    try {
      await ra.guard({ agent: exactChild, action: "send_invoice", amount: 1 }, () => {});
    } catch (e) {
      exactEventId = getApprovalRedemption(e as ApprovalRequiredError).eventId;
    }
    try {
      await ra.guard({ agent: lookalikeChild, action: "send_invoice", amount: 1 }, () => {});
    } catch (e) {
      lookEventId = getApprovalRedemption(e as ApprovalRequiredError).eventId;
    }
    ra.kill("p_a");
    const denied = ra.query({ status: "approval_denied" }).map((e) => e.id);
    expect(denied).toContain(exactEventId);
    expect(denied).not.toContain(lookEventId);
    ra.close();
  });

  it("kill voids pending approvals", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    let eventId = "";
    try {
      await ra.guard({ agent, action: "send_invoice", amount: 1 }, () => {});
    } catch (e) {
      eventId = getApprovalRedemption(e as ApprovalRequiredError).eventId;
    }
    ra.kill(agent.agentId);
    const events = ra.query({ status: "approval_denied" });
    expect(events.some((e) => e.id === eventId)).toBe(true);
    ra.close();
  });
});
