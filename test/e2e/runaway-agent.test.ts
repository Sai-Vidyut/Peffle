import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ApprovalRequiredError,
  BudgetExceededError,
  createRightAuth,
  getApprovalRedemption,
} from "../../src/core/index.js";
import type { PolicyConfig } from "../../src/core/types.js";

const demoPolicy: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [
    { id: "email-cap", scope: "global", window: "daily", limit: 3, match: { action: "send_email" } },
  ],
  actions: [
    { id: "allow-email", match: { action: "send_email" }, effect: "allow" },
    { id: "invoice-approval", match: { action: "send_invoice" }, effect: "require_approval" },
  ],
};

describe("e2e runaway agent scenario", () => {
  it("caps email spend then gates invoices separately", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rightauth-e2e-"));
    const dbPath = join(dir, "ledger.db");
    const ra = createRightAuth({ storagePath: dbPath, policy: demoPolicy });
    const agent = { agentId: "demo-agent" };

    for (let i = 0; i < 3; i++) {
      await ra.guard({ agent, action: "send_email", amount: 1 }, async () => "sent");
    }
    await expect(
      ra.guard({ agent, action: "send_email", amount: 1 }, async () => "sent")
    ).rejects.toBeInstanceOf(BudgetExceededError);

    let token = "";
    let eventId = "";
    try {
      await ra.guard({ agent, action: "send_invoice", amount: 100 }, async () => "inv");
    } catch (e) {
      expect(e).toBeInstanceOf(ApprovalRequiredError);
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }

    ra.approve(eventId);
    await ra.guard(
      { agent, action: "send_invoice", amount: 100 },
      async () => "inv",
      { approval: { eventId, token } }
    );

    ra.kill(agent.agentId);
    await expect(
      ra.guard({ agent, action: "send_email", amount: 1 }, async () => "x")
    ).rejects.toThrow();

    ra.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
