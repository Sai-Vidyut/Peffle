import type { PolicyConfig } from "./types.js";

export const DEFAULT_POLICY_EXAMPLE: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [
    { id: "daily-spend-cap", scope: "global", window: "daily", limit: 50 },
    { id: "per-agent-cap", scope: "agent", window: "total", limit: 500 },
  ],
  actions: [
    {
      id: "block-invoices",
      match: { action: "send_invoice" },
      effect: "require_approval",
      reason: "Invoices always need a human to confirm.",
    },
    { id: "allow-reads", match: { action: "read_*" }, effect: "allow" },
    {
      id: "deny-wire-transfer",
      match: { action: "wire_transfer" },
      effect: "deny",
      reason: "Not permitted for any agent in this MVP.",
    },
  ],
};
