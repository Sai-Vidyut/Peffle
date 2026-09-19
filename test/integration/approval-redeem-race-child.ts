import { createPeffle, loadPolicyFromJson } from "../../dist/core/index.js";
import { readFileSync } from "node:fs";

const dbPath = process.argv.at(-4);
const policyPath = process.argv.at(-3);
const eventId = process.argv.at(-2);
const token = process.argv.at(-1);
if (!dbPath || !policyPath || !eventId || !token) process.exit(2);

const policy = loadPolicyFromJson(readFileSync(policyPath, "utf8"));
const ra = createPeffle({ storagePath: dbPath, policy });
const agent = { agentId: "race-agent" };

try {
  const result = await ra.guard(
    { agent, action: "send_invoice", amount: 5 },
    async () => {
      console.log("HANDLER");
      return "ok";
    },
    { approval: { eventId, token } }
  );
  console.log("OK", result);
  process.exit(0);
} catch (e) {
  console.log("ERR", (e as Error).name, (e as Error).message);
  process.exit(1);
} finally {
  ra.close();
}
