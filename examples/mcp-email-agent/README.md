# MCP email agent demo

Scripted agent that exercises Peffle budgets, approval, and kill switch.

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
