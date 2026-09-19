# Peffle

**Stop an AI agent before it spends your money.**

A local kill switch, spend cap, and human-approval gate for tool calls.
No SaaS. No telemetry. One `npm install`.

[![npm](https://img.shields.io/npm/v/peffle)](https://www.npmjs.com/package/peffle)
[![license](https://img.shields.io/npm/l/peffle)](./LICENSE)

Prompt instructions are not enforcement. Agents have already [sent $12,431 in fake invoices](https://www.samcodeman.com/writing/ai-agents-real-businesses-fake-invoices) and [run up ~$50,000 in API bills](https://www.helpnetsecurity.com/2026/09/16/google-mandiant-enterprise-ai-security-risks-report/) after routing around caps.

## Try it

```bash
npm install peffle
```

```ts
import { BudgetExceededError, createPeffle } from "peffle";

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

await charge(8); // ok — $8 of $10
try {
  await charge(5); // would be $13
} catch (e) {
  if (e instanceof BudgetExceededError) console.log("BLOCKED", e.message);
}

peffle.close();
```

```
CHARGED $8
BLOCKED Budget exceeded: spent 13 would exceed limit 10
```

Same script in this repo: `npm run example`

## Wrap a tool call

```ts
await peffle.guard(
  { agent: { agentId: "my-agent" }, action: "send_email", amount: 1 },
  () => sendEmail()
);

peffle.kill("my-agent"); // instant local kill switch
```

Side effects go **inside** `guard()`. `checkPolicy()` is a preview only — it does not reserve budget or authorize work.

## MCP

```ts
import { createPeffle } from "peffle";
import { guardTool } from "peffle/mcp";

const peffle = createPeffle({ policyPath: "./peffle.policy.json" });

const sendEmail = guardTool(
  async (args: { to: string }) => ({ ok: true, to: args.to }),
  "send_email",
  { peffle, agentId: "server-agent" }
);
```

Approval handles are process-local. Details: [docs/mcp-integration.md](./docs/mcp-integration.md).

## CLI

```bash
npx peffle init
npx peffle pending
npx peffle approve <eventId>
npx peffle kill <agentId>
npx peffle ledger --json
```

When policy says `require_approval`, `guard()` throws `ApprovalRequiredError` with a one-time `{ eventId, token }`. Approve via CLI (or `peffle.approve(eventId)`), then retry `guard()` with `{ approval: { eventId, token } }`. The token is never stored in the ledger.

## Examples

- [examples/blocked-spend.ts](./examples/blocked-spend.ts) — agent tries to overspend, Peffle blocks it
- [examples/mcp-email-agent](./examples/mcp-email-agent) — budget + approval + kill switch

## What this is NOT

- Not a hosted service (v0.1 is local SQLite)
- Not OAuth / MCP auth / cryptographic identity
- Not a payments rail or enterprise IAM
- No telemetry or network calls in the core library

## License

Apache-2.0

If this is useful, star the repo or open an issue: “does this work with X?” That’s how we decide what to build next.
