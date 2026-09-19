# Policy schema

See `rightauth.policy.json` and `DEFAULT_POLICY_EXAMPLE` in the package.

Evaluation order:

1. Kill switch (agent or ancestor killed)
2. First matching action rule
3. Budget rules
4. Default when no action rule matched

Redemption (`guard` with `approval`) skips action rules and re-checks kill switch + budgets only.

Budget rules may include optional `match.action` (glob) so caps apply only to matching actions (e.g. `send_email` daily limit without blocking invoices).
