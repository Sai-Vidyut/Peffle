import { describe, expect, it } from "vitest";
import {
  ApprovalAlreadyResolvedError,
  ApprovalRequiredError,
  getApprovalRedemption,
} from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("revoke approved grant", () => {
  it("revokes without killing agent", async () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
      })
    );
    const req = { agent, action: "send_invoice", amount: 1 };
    let creds = { eventId: "", token: "" };
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      creds = getApprovalRedemption(e as ApprovalRequiredError);
    }
    ra.approve(creds.eventId);
    ra.revoke(creds.eventId);
    await expect(
      ra.guard(req, () => "x", { approval: creds })
    ).rejects.toThrow();
    expect(ra.checkPolicy({ agent, action: "send_invoice", amount: 1 }).outcome).toBe(
      "require_approval"
    );
    ra.close();
  });

  it("cannot revoke pending", async () => {
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
    expect(() => ra.revoke(eventId)).toThrow(ApprovalAlreadyResolvedError);
    ra.close();
  });
});
