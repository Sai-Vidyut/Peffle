# MCP integration

RightAuth ships `guardTool()` (`rightauth/mcp`) to wrap MCP tool handlers with the same enforcement as `guard()`.

## Approval-required responses

When policy requires approval, the wrapped tool returns a structured error (not a thrown exception) containing:

- `eventId` — ledger event to approve via CLI or `rightauth approve`
- `redemptionHandle` — opaque in-process credential for follow-up calls

Clients should retry the **same tool call** with:

```json
{ "rightauthApproval": { "handle": "<redemptionHandle>" } }
```

Alternatively, trusted callers in the same process may pass `{ "eventId", "token" }` from the initial `ApprovalRequiredError` (never log or serialize the token).

## Redemption handle semantics (MVP)

Redemption handles are **process-local**:

- A handle is valid only in the **same Node.js process** that issued it (the running MCP server instance).
- **Restarting** the MCP server before redemption invalidates all outstanding handles.
- **Multi-process** MCP deployments (multiple workers) must either:
  - route follow-up tool calls to the same worker (**session affinity**), or
  - use the documented **`eventId` + `token`** fallback when the client holds the token securely.

Handles are stored in an in-memory registry with a TTL (default 15 minutes, configurable via `redemptionHandleTtlMs` on `guardTool()`). Expired handles are removed automatically; the registry enforces a maximum pending-handle count to avoid unbounded memory growth.

There is **no** persistent encrypted handle store in v0.1 — this is an intentional MVP limitation.

## Handle consumption

Handles are **peeked** on retry, not deleted until redemption succeeds or a terminal outcome occurs (already consumed, denied, invalid token, etc.). Transient failures such as **budget exhaustion** leave the handle valid so the client can retry after conditions improve.

## Advisory `checkPolicy()`

`checkPolicy()` is for UI hints and diagnostics only. It does **not** reserve budget, write ledger events, enforce the kill switch at execution time, or authorize an action. **All side effects must use `guard()`.**

```typescript
// Wrong — checkPolicy allow does not execute safely
if (ra.checkPolicy(req).outcome === "allow") {
  await sendEmail(); // bypasses budget, kill switch, ledger
}

// Correct
await ra.guard(req, () => sendEmail());
```
