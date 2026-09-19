# MCP email agent demo

Longer scripted agent: budgets, approval, then kill switch.

For the 30-second version (agent tries to spend, Peffle blocks it), see [`../blocked-spend.ts`](../blocked-spend.ts).

```bash
npm install
npm run build
node --import tsx examples/mcp-email-agent/client.ts
```

Use a second terminal to approve pending events:

```bash
npx peffle pending --storage ./examples/mcp-email-agent/.peffle/ledger.db
npx peffle approve <eventId> --storage ./examples/mcp-email-agent/.peffle/ledger.db
```
