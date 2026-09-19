import { readFileSync } from "node:fs";
import { createPeffle, loadPolicyFromJson } from "../../dist/core/index.js";

const dbPath = process.argv.at(-5);
const policyPath = process.argv.at(-4);
const eventId = process.argv.at(-3);
const token = process.argv.at(-2);
const amountStr = process.argv.at(-1);
if (!dbPath || !policyPath || !eventId || !token || !amountStr) {
  process.exit(2);
}

const policy = loadPolicyFromJson(readFileSync(policyPath!, "utf8"));
const ra = createPeffle({ storagePath: dbPath, policy });
const agent = { agentId: "race-agent" };

try {
  await ra.guard(
    { agent, action: "pay", amount: Number(amountStr) },
    async () => "ok",
    { approval: { eventId, token } }
  );
  console.log("OK");
  process.exit(0);
} catch (e) {
  console.log("ERR", (e as Error).name);
  process.exit(1);
} finally {
  ra.close();
}
