# Peffle

**Stop an AI agent before it spends your money.**

A local kill switch, spend cap, and human-approval gate for tool calls.
No SaaS. No telemetry. One `npm install`.

[![npm](https://img.shields.io/npm/v/peffle)](https://www.npmjs.com/package/peffle)
[![license](https://img.shields.io/npm/l/peffle)](./LICENSE)

Repository: [github.com/Sai-Vidyut/Peffle](https://github.com/Sai-Vidyut/Peffle) · Requires **Node.js 18+** (uses a native SQLite binding via `better-sqlite3`).

Prompt instructions are not enforcement. Agents have already [sent $12,431 in fake invoices](https://www.samcodeman.com/writing/ai-agents-real-businesses-fake-invoices) and [run up ~$50,000 in API bills](https://www.helpnetsecurity.com/2026/09/16/google-mandiant-enterprise-ai-security-risks-report/) after routing around caps.

## Try it (from npm)

```bash
npm install peffle
```

Save as `spend-cap.mjs` and run with `node spend-cap.mjs`:

```js
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

async function charge(dollars) {
  await peffle.guard(
    { agent: { agentId: "shopper" }, action: "charge_card", amount: dollars },
    () => console.log(`CHARGED $${dollars}`)
  );
}

async function main() {
  await charge(8);
  try {
    await charge(5);
  } catch (e) {
    if (e instanceof BudgetExceededError) console.log("BLOCKED", e.message);
  } finally {
    peffle.close();
  }
}

main();
```

Expected output:

```
CHARGED $8
BLOCKED Budget exceeded: spent 13 would exceed limit 10
```

**From a git clone** (examples and docs live in the repo, not in the npm tarball):

```bash
git clone https://github.com/Sai-Vidyut/Peffle.git && cd Peffle
npm install && npm run example
```

## Enforcement rule

**Every side effect** (spend, send, write, call a paid API) must run **inside** `peffle.guard(request, () => …)`.

`checkPolicy()` is a preview only — it does not reserve budget, enforce the kill switch at execution time, or authorize work.

## Wrap a tool call

```ts
await peffle.guard(
  { agent: { agentId: "my-agent" }, action: "send_email", amount: 1 },
  () => sendEmail()
);

peffle.kill("my-agent"); // instant local kill switch
```

## MCP

Peffle can **wrap MCP tool handlers** with the same enforcement as `guard()`. It does **not** authenticate MCP clients or replace server OAuth.

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

Approval handles are process-local. Details: [MCP integration](https://github.com/Sai-Vidyut/Peffle/blob/main/docs/mcp-integration.md).

## CLI

```bash
npx peffle init
npx peffle pending
npx peffle approve <eventId>
npx peffle deny <eventId>
npx peffle kill <agentId>
npx peffle ledger --json
```

Run `npx peffle --help` for `revoke`, `revive`, `status`, and storage/policy flags.

When policy says `require_approval`, `guard()` throws `ApprovalRequiredError` with a one-time `{ eventId, token }`. Approve via CLI (or `peffle.approve(eventId)`), then retry `guard()` with `{ approval: { eventId, token } }`. The token is never stored in the ledger.

## Examples (repository)

- [blocked-spend.ts](https://github.com/Sai-Vidyut/Peffle/blob/main/examples/blocked-spend.ts) — agent tries to overspend, Peffle blocks it
- [mcp-email-agent](https://github.com/Sai-Vidyut/Peffle/tree/main/examples/mcp-email-agent) — budget + approval + kill switch

Policy schema: [docs/policy-schema.md](https://github.com/Sai-Vidyut/Peffle/blob/main/docs/policy-schema.md).

## What this is NOT

- Not a hosted service (v0.1 is local SQLite)
- Not OAuth / MCP auth / cryptographic identity
- Not a payments rail or enterprise IAM
- No telemetry or network calls in the core library

**Trust boundaries:** `agentId` and `principal` are asserted by your app (not cryptographically verified). Any code path that skips `guard()` bypasses Peffle. MCP approval handles are process-local and do not survive a server restart.

## License

Apache-2.0

If this is useful, star the repo or open an issue: “does this work with X?” That’s how we decide what to build next.
