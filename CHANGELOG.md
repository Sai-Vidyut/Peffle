# Changelog

All notable changes to this project will be documented in this file.

## 0.1.1 — 2026-09-19

### Changed

- README and npm metadata lead with the spend-cap value proposition and a copy-pasteable blocked-spend example.

### Added

- `examples/blocked-spend.ts` (`npm run example`) — agent charges $8, then $5, daily $10 cap blocks it.
- `npm run pulse` — npm downloads + GitHub stars/forks/issues.

## 0.1.0 — 2026-03-21

### Added

- Core SDK: `createPeffle`, `checkPolicy`, `guard`, kill switch, ledger query.
- Single-use approval binding with fingerprinted redemption (`GuardApproval`).
- SQLite ledger (`better-sqlite3`) with WAL and busy timeout.
- CLI: `init`, `status`, `ledger`, `pending`, `approve`, `deny`, `kill`, `revive`.
- MCP adapter (`peffle/mcp`): `guardTool`.
- Example MCP email agent under `examples/mcp-email-agent`.
