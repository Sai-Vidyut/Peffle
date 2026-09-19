import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  ApprovalAlreadyConsumedError,
  ApprovalRequiredError,
  BudgetExceededError,
  createPeffle,
  getApprovalRedemption,
} from "../../src/core/index.js";
import { loadPolicyFromJson } from "../../src/core/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const policy = loadPolicyFromJson(
  readFileSync(join(__dirname, "peffle.policy.json"), "utf8")
);

const agent = { agentId: "email-demo" };

async function main() {
  const demoDir = mkdtempSync(join(tmpdir(), "peffle-email-demo-"));
  const storagePath = join(demoDir, "ledger.db");
  const ra = createPeffle({ storagePath, policy });

  try {
    console.log("Sending emails until budget cap...");
    for (let i = 0; i < 15; i++) {
      try {
        const r = await ra.guard({ agent, action: "send_email", amount: 1 }, async () => "email-sent");
        console.log(i + 1, r);
      } catch (e) {
        if (e instanceof BudgetExceededError) {
          console.log("Budget cap hit:", e.message);
          break;
        }
        throw e;
      }
    }

    console.log("Attempting invoice (requires approval)...");
    let eventId = "";
    let token = "";
    try {
      await ra.guard({ agent, action: "send_invoice", amount: 49 }, async () => "invoice-49");
    } catch (e) {
      if (e instanceof ApprovalRequiredError) {
        const creds = getApprovalRedemption(e);
        eventId = creds.eventId;
        token = creds.token;
        console.log("Pending approval:", eventId);
        console.log("Run: peffle approve", eventId);
        ra.approve(eventId);
      } else {
        throw e;
      }
    }

    if (eventId && token) {
      const result = await ra.guard(
        { agent, action: "send_invoice", amount: 49 },
        async () => "invoice-49",
        { approval: { eventId, token } }
      );
      console.log("Redeemed:", result);
      try {
        await ra.guard(
          { agent, action: "send_invoice", amount: 49 },
          async () => "invoice-49",
          { approval: { eventId, token } }
        );
      } catch (e2) {
        if (e2 instanceof ApprovalAlreadyConsumedError) {
          console.log("Second redemption blocked (expected):", e2.code);
        } else {
          throw e2;
        }
      }
    }

    ra.kill(agent.agentId, { reason: "demo complete" });
    try {
      await ra.guard({ agent, action: "send_email", amount: 1 }, async () => "email-sent");
    } catch {
      console.log("Kill switch blocked further email sends.");
    }
  } finally {
    ra.close();
    rmSync(demoDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
