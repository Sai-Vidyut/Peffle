import { ShieldCheck } from "lucide-react";
import { TabbedGuardTerminal, type TerminalTab } from "@/components/tabbed-guard-terminal";
import { InstallChip } from "@/components/install-actions";
import type { TerminalLine } from "@/components/guard-terminal";

const demoLines: TerminalLine[] = [
  { type: "comment", text: '# daily budget: $10, action "charge_card" allowed by policy' },
  { type: "input", text: "node demo.mjs" },
  { type: "output", tone: "ok", text: "CHARGED $8" },
  { type: "output", tone: "blocked", text: "BLOCKED Budget exceeded: spent 13 would exceed limit 10" },
];

const ledgerLines: TerminalLine[] = [
  { type: "input", text: "npx peffle ledger --json" },
  {
    type: "output",
    text: `[
  {
    "id": "evt_01h8k2",
    "agent": { "agentId": "shopper" },
    "action": "charge_card",
    "amount": 8,
    "status": "completed",
    "createdAt": "2026-03-14T10:02:11.000Z",
    "updatedAt": "2026-03-14T10:02:11.000Z"
  },
  {
    "id": "evt_01h8k3",
    "agent": { "agentId": "shopper" },
    "action": "charge_card",
    "amount": 5,
    "status": "denied",
    "createdAt": "2026-03-14T10:02:12.000Z",
    "updatedAt": "2026-03-14T10:02:12.000Z"
  }
]`,
  },
];

const approveLines: TerminalLine[] = [
  {
    type: "input",
    text: 'peffle.guard({ action: "wire_transfer", amount: 250 }, handler)',
  },
  {
    type: "output",
    tone: "blocked",
    text: "ApprovalRequiredError — approval required (eventId: evt_a1b2c3)",
  },
  { type: "input", text: "npx peffle approve evt_a1b2c3" },
  { type: "output", tone: "ok", text: "Approved evt_a1b2c3" },
  {
    type: "input",
    text: "peffle.guard(request, handler, { approval: { eventId, token } })",
  },
  { type: "output", tone: "ok", text: "ALLOW — approval redeemed, handler ran" },
];

const catchesTabs: TerminalTab[] = [
  {
    id: "demo",
    label: "guard()",
    title: "demo.mjs",
    lines: demoLines,
  },
  {
    id: "ledger",
    label: "ledger",
    title: "shell",
    lines: ledgerLines,
  },
  {
    id: "approve",
    label: "approve",
    title: "shell",
    lines: approveLines,
  },
];

const points = [
  {
    title: "Budgets are transactional",
    body: "Spend checks run inside a SQLite transaction, so two processes sharing a database file can't both approve the same money.",
  },
  {
    title: "Approvals expire",
    body: "A human approval is single-use and tied to a SHA-256 fingerprint of the exact request, with a TTL. It can't be replayed.",
  },
  {
    title: "The kill switch is checked first",
    body: "Before policy, before budgets. If an agent is killed, nothing else runs.",
  },
];

export function WhatGuardCatches() {
  return (
    <section id="what-guard-catches" className="border-t border-[var(--border)] py-24 md:py-28">
      <div className="mx-auto mb-14 flex max-w-[40rem] flex-col items-center text-center">
        <ShieldCheck
          className="mb-5 h-8 w-8 text-[var(--muted)]"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <h2 className="mb-4 text-[clamp(28px,4vw,36px)] font-semibold tracking-tight">
          What guard() catches
        </h2>
        <p className="mb-8 max-w-[42ch] text-[15px] text-[var(--muted)]">
          Real checks between the agent&apos;s decision and the side effect — budgets, approvals,
          and the kill switch — not prompt text hoping the model cooperates.
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/Sai-Vidyut/Peffle"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--surface-panel)] px-5 py-2.5 text-[14px] text-[var(--text)] transition-colors hover:bg-[var(--surface-border-btn)]"
          >
            View on GitHub
          </a>
          <InstallChip />
        </div>
        <a
          href="https://github.com/Sai-Vidyut/Peffle/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[14px] text-[var(--muted)] underline underline-offset-4 transition-colors hover:text-[var(--text)]"
        >
          Or read the documentation
        </a>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <TabbedGuardTerminal tabs={catchesTabs} defaultTabId="demo" />
        <div className="flex flex-col gap-10 pt-1">
          {points.map((p) => (
            <div key={p.title}>
              <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-[var(--text)]">
                {p.title}
              </h3>
              <p className="m-0 max-w-[42ch] text-[15px] text-[var(--muted)]">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
