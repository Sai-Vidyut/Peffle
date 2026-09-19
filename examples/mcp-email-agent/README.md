# MCP email agent demo

Longer scripted agent: budgets, approval, then kill switch.

For the 30-second version (agent tries to spend, Peffle blocks it), see [blocked-spend.ts](https://github.com/Sai-Vidyut/Peffle/blob/main/examples/blocked-spend.ts).

## Client demo (self-contained)

Uses a temporary ledger directory; no second terminal required for approval (the script calls `approve()` in-process).

```bash
# from repository root
npm install
npm run build
npm run demo
```

## MCP server + CLI approval

The stdio server (`server.ts`) persists to `.peffle/ledger.db` next to this folder (or `PEFFLE_STORAGE`).

```bash
npm run build
PEFFLE_STORAGE=./examples/mcp-email-agent/.peffle/ledger.db node --import tsx examples/mcp-email-agent/server.ts
```

In another terminal, after a tool returns approval-required:

```bash
npx peffle pending --storage ./examples/mcp-email-agent/.peffle/ledger.db
npx peffle approve <eventId> --storage ./examples/mcp-email-agent/.peffle/ledger.db
```

Retry the MCP tool call with the redemption handle or `eventId` + `token` as documented in [MCP integration](https://github.com/Sai-Vidyut/Peffle/blob/main/docs/mcp-integration.md).
