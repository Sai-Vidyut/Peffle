import { createRightAuth, loadPolicyFromJson } from "../../dist/core/index.js";
import { readFileSync } from "node:fs";

const dbPath = process.argv.at(-3);
const policyPath = process.argv.at(-2);
const amountStr = process.argv.at(-1);
if (!dbPath || !policyPath || !amountStr) process.exit(2);

const policy = loadPolicyFromJson(readFileSync(policyPath, "utf8"));
const ra = createRightAuth({ storagePath: dbPath, policy });
const agent = { agentId: "race-agent" };

try {
  await ra.guard({ agent, action: "pay", amount: Number(amountStr) }, async () => "ok");
  console.log("OK");
  process.exit(0);
} catch (e) {
  console.log("ERR", (e as Error).name);
  process.exit(1);
} finally {
  ra.close();
}
