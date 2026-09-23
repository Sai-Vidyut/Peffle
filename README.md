# Peffle

**Stop an AI agent before it spends your money.**

A local kill switch, spend cap, and human-approval gate for tool calls.
No SaaS. No telemetry. One `npm install`.

Peffle runs inside your agent process. There is no external service required for enforcement.

## Demo

<video controls playsinline poster="brag-output-2026-09-20-012936/brag.jpg" src="brag-output-2026-09-20-012936/brag.mp4" width="100%"></video>

**[Open the demo video](brag-output-2026-09-20-012936/brag.mp4)** · [Poster frame](brag-output-2026-09-20-012936/brag.jpg)

[![npm](https://img.shields.io/npm/v/peffle)](https://www.npmjs.com/package/peffle)
[![license](https://img.shields.io/npm/l/peffle)](./LICENSE)

Repository: [github.com/Sai-Vidyut/Peffle](https://github.com/Sai-Vidyut/Peffle) · Requires **Node.js 18+** (uses a native SQLite binding via `better-sqlite3`).

The marketing site (Next.js) lives in [`peffle-website/`](./peffle-website/). Deploy it on Vercel with **Root Directory** set to `peffle-website` — see that folder’s README.

Prompt instructions are not enforcement. If an agent can call a tool, the tool call needs a real execution-time boundary.

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

peffle.kill("my-agent"); // block subsequent guarded calls
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

Approval handles are process-local. Peffle guards MCP tool handlers; it does not authenticate MCP clients. Details: [docs/mcp-integration.md](https://github.com/Sai-Vidyut/Peffle/blob/main/docs/mcp-integration.md).

## CLI

```bash
npx peffle init
npx peffle chat
npx peffle pending
npx peffle approve <eventId>
npx peffle deny <eventId>
npx peffle kill <agentId>
npx peffle ledger --json
```

Run `npx peffle --help` for `revoke`, `revive`, `status`, and storage/policy flags.

`npx peffle chat` is an interactive operator console (policies, approvals, natural language when AI is configured). Use `npx` from any project directory; Peffle does not require API keys in each app’s `.env`.

### AI providers (chat)

Configure Gemini and/or Groq **once** for the CLI. Keys belong to Peffle, not your application repo.

```bash
mkdir -p ~/.config/peffle
cp .env.example ~/.config/peffle/.env   # from a git clone, or create the file by hand
# Edit ~/.config/peffle/.env — set PEFFLE_AI_PROVIDER and API keys (never commit this file)
npx peffle chat
```

| Variable | Values | Notes |
|----------|--------|--------|
| `PEFFLE_AI_PROVIDER` | `auto`, `gemini`, `groq`, `none` | `auto` tries Gemini, then Groq |
| `GEMINI_API_KEY` | — | Required for `gemini` / first leg of `auto` |
| `GROQ_API_KEY` | — | Required for `groq` / fallback in `auto` |

Optional: `PEFFLE_AI_MODEL`, `PEFFLE_GROQ_MODEL`. Override config directory with `PEFFLE_CONFIG_DIR` (advanced).

**Precedence** (highest wins): shell environment → project `.env.local` → project `.env` → `~/.config/peffle/.env` (or `$XDG_CONFIG_HOME/peffle/.env`). Project files are optional overrides; user config is enough to run chat from any working directory.

Without keys, chat still works via slash commands (`/help`, `/policy`, approvals, kill switch). Set `PEFFLE_AI_PROVIDER=none` to disable AI explicitly.

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
