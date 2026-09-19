import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ApprovalAlreadyConsumedError,
  ApprovalRequiredError,
  BudgetExceededError,
  createRightAuth,
  getApprovalRedemption,
} from "../../src/core/index.js";
import { readFileSync } from "node:fs";
import { loadPolicyFromJson } from "../../src/core/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const storagePath = join(__dirname, ".rightauth/ledger.db");
const policy = loadPolicyFromJson(
  readFileSync(join(__dirname, "rightauth.policy.json"), "utf8")
);

const ra = createRightAuth({ storagePath, policy });
const agent = { agentId: "email-demo" };

async function sendEmail() {
  return ra.guard({ agent, action: "send_email", amount: 1 }, async () => "email-sent");
}

async function sendInvoice(amount: number, approval?: { eventId: string; token: string }) {
  return ra.guard(
    { agent, action: "send_invoice", amount },
    async () => `invoice-${amount}`,
    approval ? { approval } : undefined
  );
}

async function main() {
  console.log("Sending emails until budget cap...");
  for (let i = 0; i < 15; i++) {
    try {
      const r = await sendEmail();
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
    await sendInvoice(49);
  } catch (e) {
    if (e instanceof ApprovalRequiredError) {
      const creds = getApprovalRedemption(e);
      eventId = creds.eventId;
      token = creds.token;
      console.log("Pending approval:", eventId);
      console.log("Run: rightauth approve", eventId);
      ra.approve(eventId);
    } else {
      throw e;
    }
  }

  if (eventId && token) {
    const result = await sendInvoice(49, { eventId, token });
    console.log("Redeemed:", result);
    try {
      await sendInvoice(49, { eventId, token });
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
    await sendEmail();
  } catch {
    console.log("Kill switch blocked further email sends.");
  }

  ra.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
