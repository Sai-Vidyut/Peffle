# Peffle

**Stop an AI agent before it spends your money.**

Peffle is a **local** enforcement layer for AI agents: JSON policy, transactional spend budgets, human approval gates, a per-agent kill switch, and an audit ledger. It runs in your Node process—**no SaaS, no telemetry, no hosted control plane**.

Use it as an npm library (`peffle`, `peffle/mcp`) or operate it from the **`peffle` CLI** and **`peffle chat`** console.

[![npm](https://img.shields.io/npm/v/peffle)](https://www.npmjs.com/package/peffle)
[![license](https://img.shields.io/npm/l/peffle)](./LICENSE)

**Node.js 18+** (native SQLite via `better-sqlite3`). Repo: [github.com/Sai-Vidyut/Peffle](https://github.com/Sai-Vidyut/Peffle).

Prompt instructions are not enforcement. If an agent can call a tool, the tool call needs a real **execution-time** boundary—`peffle.guard()`.

## Demo

<video controls playsinline poster="brag-output-2026-09-20-012936/brag.jpg" src="brag-output-2026-09-20-012936/brag.mp4" width="100%"></video>

**[Open the demo video](brag-output-2026-09-20-012936/brag.mp4)** · [Poster frame](brag-output-2026-09-20-012936/brag.jpg)

## Features

### Core library (`peffle`)

| Capability | Description |
|------------|-------------|
| **`guard(request, handler)`** | Runs policy, budgets, kill switch, and approvals **before** your side-effect handler. |
| **`checkPolicy()`** | Read-only preview—does **not** reserve budget or enforce at execution time. |
| **JSON policy** | Action rules (`allow`, `deny`, `require_approval`), defaults, optional action globs on budgets. |
| **Budgets** | Daily / rolling caps with transactional reservation (SQLite). |
| **Approvals** | One-time `{ eventId, token }` redemption; fingerprinted grants; revoke/deny flows. |
| **Kill switch** | Block an `agentId` (and descendants) until revived. |
| **Ledger** | Queryable audit trail of decisions and outcomes. |
| **Storage** | Local SQLite (`better-sqlite3`, WAL). Default paths under `./.peffle/`. |

Exports include typed errors (`BudgetExceededError`, `ApprovalRequiredError`, `AgentKilledError`, …), `loadPolicyFromJson`, and `DEFAULT_POLICY_EXAMPLE`.

### MCP adapter (`peffle/mcp`)

- **`guardTool(handler, toolName, { peffle, agentId })`** — same enforcement as `guard()` for MCP tool handlers.
- Peffle does **not** authenticate MCP clients or replace server OAuth.

Details: [docs/mcp-integration.md](./docs/mcp-integration.md).

### CLI (`npx peffle`)

| Command | Purpose |
|---------|---------|
| `init` | Write starter `peffle.policy.json`. |
| `status` | Quick ledger/agent status. |
| `ledger` | Audit events (`--json`, filters: `--agent`, `--status`, `--since`, `--limit`). |
| `pending` | List approval events awaiting a decision. |
| `approve` / `deny` / `revoke` | Resolve or revoke approvals. |
| `kill` / `revive` | Kill switch control. |
| **`chat`** | Interactive operator console (see below). |

Global flags: `--storage <path>`, `--policy <path>` (or `PEFFLE_STORAGE`, `PEFFLE_POLICY`).

### Interactive chat (`npx peffle chat`)

Terminal UI for operators: policy inspection, approvals, kill switch, ledger, and **natural language** when AI is configured.

**Slash commands** (always available):

| Command | Action |
|---------|--------|
| `/help` | Command list |
| `/show`, `/policy` | View / edit policy context |
| `/pending`, `/approve`, `/deny` | Approval workflow |
| `/kill`, `/revive` | Kill switch |
| `/ledger` | Recent audit events |
| `/diff`, `/validate` | Policy proposal diff and validation |
| `/clear`, `/reset`, `/exit` | UI / session control |

**AI-assisted tools** (when a provider is configured): propose and apply policy changes, list pending approvals, approve/deny, ledger queries, kill/revive, agent status, and related operations—with confirmation before destructive writes.

**Offline NL shortcuts** still route simple phrases (e.g. “show policy”, “pending approvals”) without calling a model when patterns match.

### AI providers (chat only)

Configure **once** for the CLI—not per application repo.

```bash
mkdir -p ~/.config/peffle
cp .env.example ~/.config/peffle/.env   # from a git clone, or create manually
# Set PEFFLE_AI_PROVIDER and API keys (never commit this file)
npx peffle chat
```

| Variable | Values | Notes |
|----------|--------|--------|
| `PEFFLE_AI_PROVIDER` | `auto`, `gemini`, `groq`, `none` | `auto` = Gemini, then Groq fallback |
| `GEMINI_API_KEY` | — | For `gemini` / primary in `auto` |
| `GROQ_API_KEY` | — | For `groq` / fallback in `auto` |

Optional: `PEFFLE_AI_MODEL`, `PEFFLE_GROQ_MODEL`, `PEFFLE_CONFIG_DIR`.

**Env precedence** (highest wins): shell → project `.env.local` → project `.env` → `~/.config/peffle/.env` (or `$XDG_CONFIG_HOME/peffle/.env`).

Without keys, chat works via slash commands only. Set `PEFFLE_AI_PROVIDER=none` to disable AI explicitly.

### Marketing site

The Next.js site in [`peffle-website/`](./peffle-website/) is **not** published to npm. Deploy on Vercel with **Root Directory** = `peffle-website` (see that README).

## Try it (from npm)

```bash
npm install peffle
# or: npx peffle@latest chat
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

**From a git clone** (examples and docs are in the repo, not in the npm tarball):

```bash
git clone https://github.com/Sai-Vidyut/Peffle.git && cd Peffle
npm install && npm run example
```

## Enforcement rule

**Every side effect** (spend, send, write, call a paid API) must run **inside** `peffle.guard(request, () => …)`.

```ts
await peffle.guard(
  { agent: { agentId: "my-agent" }, action: "send_email", amount: 1 },
  () => sendEmail()
);

peffle.kill("my-agent"); // block subsequent guarded calls for that agent
```

When policy requires approval, `guard()` throws **`ApprovalRequiredError`** with a one-time `{ eventId, token }`. Approve via CLI or `peffle.approve(eventId)`, then retry `guard()` with `{ approval: { eventId, token } }`. The token is not stored in the ledger.

## MCP example

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

## Policy

Evaluation order:

1. Kill switch (agent or ancestor)
2. First matching action rule
3. Budget rules
4. Default when no rule matched

Redemption with a valid approval skips action rules and re-checks kill switch + budgets only.

Schema and examples: [docs/policy-schema.md](./docs/policy-schema.md).

## Development (repository)

```bash
npm test              # vitest
npm run typecheck
npm run build         # tsup → dist/
npm run verify:dist   # prepublish guard
```

Publish flow runs `prepublishOnly`: build + verify. The npm package ships **`dist/`**, `README.md`, and `LICENSE` only.

## Examples

- [examples/blocked-spend.ts](./examples/blocked-spend.ts) — overspend blocked by daily cap
- [examples/mcp-email-agent](./examples/mcp-email-agent) — budget, approval, kill switch over MCP

## What this is NOT

- Not a hosted service (v0.1.x is local SQLite)
- Not OAuth / MCP auth / cryptographic identity
- Not a payments rail or enterprise IAM
- No telemetry or network calls in the **core** library (chat AI providers call external APIs only when you configure keys)

**Trust boundaries:** `agentId` and `principal` are asserted by your app (not cryptographically verified). Any code path that skips `guard()` bypasses Peffle. MCP approval handles are process-local and do not survive a server restart.

## License

Apache-2.0

If this is useful, star the repo or open an issue: “does this work with X?” That’s how we decide what to build next.
