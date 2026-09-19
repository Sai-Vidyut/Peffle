# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 — 2026-03-21

### Added

- Core SDK: `createPeffle`, `checkPolicy`, `guard`, kill switch, ledger query.
- Single-use approval binding with fingerprinted redemption (`GuardApproval`).
- SQLite ledger (`better-sqlite3`) with WAL and busy timeout.
- CLI: `init`, `status`, `ledger`, `pending`, `approve`, `deny`, `kill`, `revive`.
- MCP adapter (`peffle/mcp`): `guardTool`.
- Example MCP email agent under `examples/mcp-email-agent`.
