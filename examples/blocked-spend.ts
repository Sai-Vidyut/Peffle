import { BudgetExceededError, createPeffle } from "../src/core/index.js";

const peffle = createPeffle({
  storagePath: ":memory:",
  policy: {
    version: 1,
    defaults: { onNoMatchingRule: "deny" },
    budgets: [{ id: "daily", scope: "global", window: "daily", limit: 10 }],
    actions: [{ id: "spend", match: { action: "charge_card" }, effect: "allow" }],
  },
});

async function charge(dollars: number) {
  await peffle.guard(
    { agent: { agentId: "shopper" }, action: "charge_card", amount: dollars },
    () => console.log(`CHARGED $${dollars}`)
  );
}

async function main() {
  await charge(8);
  try {
    await charge(5);
    console.error("peffle failed to block overspend");
    process.exitCode = 1;
  } catch (e) {
    if (e instanceof BudgetExceededError) {
      console.log("BLOCKED", e.message);
    } else {
      throw e;
    }
  } finally {
    peffle.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
