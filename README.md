# RightAuth

Stop your AI agent before it drains your budget or spams your customers — a **local, free** kill switch, approval flow, and audit ledger for agent tool calls.

Real incidents that motivated this:

- [Bottleneck Labs agents sent $12,431 in fake invoices](https://www.samcodeman.com/writing/ai-agents-real-businesses-fake-invoices) after routing around email caps.
- [A runaway agent racked up ~$50,000 in cloud API charges](https://www.helpnetsecurity.com/2026/09/16/google-mandiant-enterprise-ai-security-risks-report/) in under an hour.

## Install

```bash
npm install rightauth
```

## Quick start

```typescript
import { createRightAuth } from "rightauth";

const ra = createRightAuth({
  policy: {
    version: 1,
    defaults: { onNoMatchingRule: "deny" },
    budgets: [{ id: "daily", scope: "global", window: "daily", limit: 50 }],
    actions: [
      { id: "invoices", match: { action: "send_invoice" }, effect: "require_approval" },
      { id: "reads", match: { action: "read_*" }, effect: "allow" },
    ],
  },
});

await ra.guard(
  { agent: { agentId: "my-agent" }, action: "read_docs" },
  async () => fetchDocs()
);

ra.kill("my-agent"); // instant local kill switch
```

### MCP tool wrapper

```typescript
import { createRightAuth } from "rightauth";
import { guardTool } from "rightauth/mcp";

const ra = createRightAuth({ policyPath: "./rightauth.policy.json" });

const sendEmail = guardTool(
  async (args: { to: string }) => ({ ok: true, to: args.to }),
  "send_email",
  { rightauth: ra, agentId: "server-agent" }
);
```

When approval is required, the tool response includes a **process-local** `redemptionHandle`. Retry with `{ rightauthApproval: { handle } }` on the **same MCP server process**, or pass `{ eventId, token }` when the client holds the token (multi-worker setups). Handles expire after the configured TTL; restarting the server invalidates outstanding handles. Details: [docs/mcp-integration.md](./docs/mcp-integration.md).

### Approval flow

When policy returns `require_approval`, `guard()` throws `ApprovalRequiredError` with a **one-time** `{ eventId, token }`. Approve by event ID (CLI or `ra.approve(eventId)`), then redeem:

```typescript
await ra.guard(request, fn, { approval: { eventId, token } });
```

The token is never stored in the ledger or returned from `approve()`.

### `checkPolicy()` is advisory only

`checkPolicy()` previews policy and budget math for UI or diagnostics. It does **not** reserve budget, write ledger events, enforce the kill switch at execution time, or authorize side effects. **Always execute real work through `guard()`.**

```typescript
// Correct: side effects only inside guard()
await ra.guard(request, () => doWork());

// Wrong: checkPolicy "allow" is not permission to act
if (ra.checkPolicy(request).outcome === "allow") await doWork();
```

See [docs/mcp-integration.md](./docs/mcp-integration.md) for MCP redemption handles (process-local, TTL, retries).

## CLI

```bash
npx rightauth init
npx rightauth pending
npx rightauth approve <eventId>
npx rightauth kill <agentId>
npx rightauth ledger --json
```

## Example

See [examples/mcp-email-agent](./examples/mcp-email-agent).

## What this is NOT

- Not a hosted service (v1 is local-first SQLite only)
- Not cryptographic identity / OAuth / MCP auth replacement
- Not a payments rail or enterprise IAM product
- No telemetry or network calls in the core library

## License

Apache-2.0
