# MCP email agent demo

Scripted agent that exercises RightAuth budgets, approval, and kill switch.

```bash
npm install
npm run build
node --import tsx examples/mcp-email-agent/client.ts
```

Use a second terminal to approve pending events:

```bash
npx rightauth pending --storage ./examples/mcp-email-agent/.rightauth/ledger.db
npx rightauth approve <eventId> --storage ./examples/mcp-email-agent/.rightauth/ledger.db
```
