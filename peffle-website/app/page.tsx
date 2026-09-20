import { Mascot } from "@/components/mascot";
import { GuardTerminal } from "@/components/guard-terminal";
import { GuardOrder } from "@/components/guard-order";
import { ScrollspyNav } from "@/components/scrollspy-nav";
import { VideoPlaceholder } from "@/components/video-placeholder";
import { CodeBlock } from "@/components/code-block";
import { HowToWalkthrough } from "@/components/how-to-walkthrough";
import { TabbedGuardTerminal, type TerminalTab } from "@/components/tabbed-guard-terminal";
import { InstallPrimaryButton } from "@/components/install-actions";
import { WhatGuardCatches } from "@/components/what-guard-catches";
import type { TerminalLine } from "@/components/guard-terminal";

const heroGuardLines: TerminalLine[] = [
  { type: "input", text: 'peffle.guard({ action: "charge_card", amount: 8 }, handler)' },
  {
    type: "output",
    tone: "ok",
    text: 'ALLOW — policy "spend" matched, budget 8/10 daily',
  },
  { type: "input", text: 'peffle.guard({ action: "charge_card", amount: 5 }, handler)' },
  {
    type: "output",
    tone: "blocked",
    text: "DENY — BudgetExceededError: 13 would exceed limit 10",
  },
  { type: "comment", text: "# event written to ledger.db either way" },
];

const heroLedgerLines: TerminalLine[] = [
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

const heroApproveLines: TerminalLine[] = [
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

const heroTabs: TerminalTab[] = [
  {
    id: "guard",
    label: "guard()",
    title: "guard() session",
    lines: heroGuardLines,
    animateDecisions: true,
    welcome: (
      <div className="mb-3.5 flex items-center gap-2.5 border-b border-dashed border-[var(--border)] pb-3.5">
        <span className="h-1.5 w-1.5 shrink-0 bg-[var(--text)]" aria-hidden="true" />
        <div className="font-sans text-xs text-[var(--muted)]">
          <strong className="text-[var(--text)]">Peffle v0.1.1</strong>
          {": local enforcement layer. No network calls, no hosted service."}
        </div>
      </div>
    ),
  },
  {
    id: "ledger",
    label: "ledger",
    title: "shell",
    lines: heroLedgerLines,
  },
  {
    id: "approve",
    label: "approve",
    title: "shell",
    lines: heroApproveLines,
  },
];

const channels = [
  {
    label: "npm",
    href: "https://www.npmjs.com/package/peffle",
    external: true,
  },
  { label: "CLI", href: "#how-to-use", external: false },
  {
    label: "GitHub",
    href: "https://github.com/Sai-Vidyut/Peffle",
    external: true,
  },
  { label: "MCP", href: "#mcp", external: false },
  {
    label: "Source",
    href: "https://github.com/Sai-Vidyut/Peffle",
    external: true,
  },
] as const;

const demoLines: TerminalLine[] = [
  { type: "comment", text: '# daily budget: $10, action "charge_card" allowed by policy' },
  { type: "input", text: "node demo.mjs" },
  { type: "output", tone: "ok", text: "CHARGED $8" },
  {
    type: "output",
    tone: "blocked",
    text: "BLOCKED Budget exceeded: spent 13 would exceed limit 10",
  },
];

const createProjectCode = `mkdir my-agent && cd my-agent
npm init -y`;

const fromSourceCode = `git clone https://github.com/Sai-Vidyut/Peffle
npm install
npm run example`;

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(20,20,19,0.92)] backdrop-blur-sm">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-3.5">
          <a
            href="#top"
            className="font-display flex shrink-0 items-center gap-2 text-[17px] font-semibold leading-none text-[var(--text)]"
          >
            <span>peffle</span>
            <span
              className="blink h-[0.85em] w-[10px] shrink-0 bg-[var(--allow)]"
              aria-hidden="true"
            />
          </a>
          <ScrollspyNav />
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-6">
        {/* HERO */}
        <section
          id="top"
          aria-label="Hero"
          className="pt-16 pb-12 md:pt-20 md:pb-16"
        >
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col items-start text-left">
              <Mascot className="mb-6" />
              <h1 className="mb-4 text-[clamp(40px,7vw,64px)] font-semibold leading-[1.05] tracking-tight text-[var(--text)]">
                Peffle
          </h1>
              <p className="mb-7 max-w-[28ch] text-lg text-[var(--muted)] md:text-xl">
                Local policy enforcement for AI agent tool calls
              </p>

              <div className="mb-5 flex flex-wrap items-center gap-3">
                <InstallPrimaryButton />
                <a
                  href="https://github.com/Sai-Vidyut/Peffle/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-border-btn)] px-6 py-2.5 text-[14px] font-medium text-[var(--text)] transition-opacity hover:opacity-90"
                >
                  Read documentation
                </a>
              </div>

              <p className="text-[13px] text-[var(--muted)]">
                Works with Node 18+ on macOS, Linux, and Windows.
              </p>
            </div>

            <TabbedGuardTerminal tabs={heroTabs} defaultTabId="guard" />
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {channels.map((ch) => (
              <a
                key={ch.label}
                href={ch.href}
                {...(ch.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-3.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:border-[var(--muted)]"
              >
                {ch.label}
              </a>
            ))}
          </div>
        </section>

        <WhatGuardCatches />

        {/* OVERVIEW */}
        <section id="overview" className="border-t border-[var(--border)] py-24 md:py-28">
          <p className="eyebrow mb-3">Overview</p>
          <h2 className="mb-4 text-[clamp(28px,4vw,36px)] font-semibold tracking-tight">
            The guard() order
          </h2>
          <p className="mb-10 max-w-[48ch] text-[15px] text-[var(--muted)]">
            Every call runs these five checks, in order, before your handler.
          </p>
          <GuardOrder />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-[var(--border)] py-24 md:py-28">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="mb-5 text-[clamp(28px,4vw,36px)] font-semibold tracking-tight">
            Prompt instructions are not enforcement
          </h2>
          <p className="mb-10 max-w-[58ch] text-base text-[var(--text)]">
            A system prompt that lists allowed tools is advisory. Jailbreaks, bad tool responses,
            and long context windows can ignore it. Peffle runs the check in code between the
            agent&apos;s decision and the side effect.
          </p>

          <h3 className="mb-3 text-[22px] font-semibold tracking-tight md:text-[24px]">See it</h3>
          <p className="mb-5 max-w-[48ch] text-[var(--muted)]">
            The $10 daily budget demo from the README, run end to end.
          </p>
          <GuardTerminal title="demo.mjs" lines={demoLines} className="mb-14" />

          <h3 className="mb-3 text-[22px] font-semibold tracking-tight md:text-[24px]">
            Approval flow
          </h3>
          <p className="mb-10 max-w-[58ch] text-[var(--muted)]">
            When a policy rule requires approval, <code className="font-mono">guard()</code> throws
            an <code className="font-mono">ApprovalRequiredError</code> with a one-time{" "}
            <code className="font-mono">{"{ eventId, token }"}</code> pair. Approve it out of band,
            then retry with that pair.
          </p>

          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              id="policy"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--allow)]" />
                Policy
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                JSON rules match an action to allow, deny, or require approval. No match means deny.
              </p>
            </div>
            <div
              id="budgets"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--allow)]" />
                Budgets
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                Scoped spend limits, checked and reserved in a SQLite transaction so shared DB files
                don&apos;t double-spend.
              </p>
            </div>
            <div
              id="approval"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--pending)]" />
                Approval
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                Tied to a SHA-256 fingerprint of the exact request. Single-use, TTL-bound — can&apos;t
                be replayed against a different call.
              </p>
            </div>
            <div
              id="kill-switch"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--deny)]" />
                Kill switch
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                A hard stop for one agent or everything, checked before policy or budgets.{" "}
                <code className="font-mono">npx peffle kill &lt;agentId&gt;</code>
              </p>
            </div>
            <div
              id="ledger"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--info)]" />
                Ledger
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                Every <code className="font-mono">guard()</code> call writes an audit event —
                allowed, denied, or pending.{" "}
                <code className="font-mono">npx peffle ledger --json</code>
              </p>
            </div>
            <div
              id="mcp"
              className="detail-card rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-5"
            >
              <h4 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 rounded-sm bg-[var(--info)]" />
                MCP
              </h4>
              <p className="m-0 text-[14px] text-[var(--muted)]">
                Optional <code className="font-mono">guardTool</code> wrapper for MCP servers.
                Requires <code className="font-mono">@modelcontextprotocol/sdk</code> as a peer
                dependency.
              </p>
            </div>
          </div>

          <h3 className="mb-3 text-[22px] font-semibold tracking-tight md:text-[24px]">
            What Peffle is not
          </h3>
          <ul className="mb-10 list-disc space-y-2 pl-[18px] text-[14px] text-[var(--muted)] marker:text-[var(--muted)]">
            <li>Not a hosted service — it runs locally, next to your agent.</li>
            <li>
              Not OAuth or a crypto identity system — agent IDs are just strings you assign.
            </li>
            <li>
              Not a sandbox — it decides whether your function runs, it doesn&apos;t isolate what
              that function can do.
            </li>
          </ul>

          <h3 className="mb-3 text-[22px] font-semibold tracking-tight md:text-[24px]">
            Before you rely on it
          </h3>
          <ul className="list-disc space-y-2 pl-[18px] text-[14px] text-[var(--muted)] marker:text-[var(--deny)]">
            <li>
              Agent IDs and delegation chains are self-asserted, not cryptographically verified.
            </li>
            <li>
              It can&apos;t protect against something bypassing{" "}
              <code className="font-mono">guard()</code> itself, or a compromised host or database.
            </li>
            <li>MCP redemption handles live in memory and don&apos;t survive a restart.</li>
            <li>
              A failed handler run doesn&apos;t count toward budgets — a retry can re-enter and
              spend again.
            </li>
          </ul>
        </section>

        {/* HOW TO USE */}
        <section id="how-to-use" className="border-t border-[var(--border)] py-24 md:py-28">
          <p className="eyebrow mb-3">How to use</p>
          <h2 className="mb-5 text-[clamp(28px,4vw,36px)] font-semibold tracking-tight">
            Wire it into an agent
          </h2>
          <p className="mb-14 max-w-[52ch] text-[var(--muted)]">
            Create an instance, wrap side effects in <code className="font-mono">guard()</code>,
            handle approvals when a rule requires them, and operate from the CLI.
          </p>
          <HowToWalkthrough />
        </section>

        {/* INSTALL */}
        <section id="install" className="border-t border-[var(--border)] py-24 md:py-28">
          <p className="eyebrow mb-3">Install</p>
          <h2 className="mb-5 text-[clamp(28px,4vw,36px)] font-semibold tracking-tight">
            Get running in a few minutes
          </h2>
          <p className="mb-5 max-w-[52ch] text-base text-[var(--text)]">
            Everything below runs in a Mac terminal against a fresh project.
          </p>
          <VideoPlaceholder />

          <div className="mt-4">
            <div className="border-t border-[var(--border)] py-8 first:border-t-0">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">01</span>
                Check Node
              </h4>
              <p className="mb-4 max-w-[68ch] text-[var(--muted)]">
                Peffle needs Node 18 or later.
              </p>
              <CodeBlock code="node -v" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Below 18, or missing? <code className="font-mono">brew install node</code>, or grab
                the installer from nodejs.org.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-8">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">02</span>
                Create a project
              </h4>
              <CodeBlock code={createProjectCode} />
            </div>

            <div className="border-t border-[var(--border)] py-8">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">03</span>
                Install Peffle
              </h4>
              <CodeBlock code="npm install peffle" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Peffle depends on <code className="font-mono">better-sqlite3</code>, a native module.
                It normally pulls a prebuilt binary. If it compiles instead, run{" "}
                <code className="font-mono">xcode-select --install</code> first.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-8">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">04</span>
                Run the $10 budget demo
              </h4>
              <p className="mb-4 max-w-[68ch] text-[var(--muted)]">
                Save the snippet from the README as <code className="font-mono">demo.mjs</code>,
                then:
              </p>
              <CodeBlock code="node demo.mjs" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Expect <code className="font-mono">CHARGED $8</code> followed by a blocked second
                charge.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-8">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">05</span>
                Optional: MCP
              </h4>
              <CodeBlock code="npm install @modelcontextprotocol/sdk" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Then <code className="font-mono">{'import { guardTool } from "peffle/mcp"'}</code>.
                The SDK is an optional peer dependency.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-8">
              <h4 className="mb-3 flex items-baseline gap-2.5 text-[15px] font-semibold">
                <span className="text-xs text-[var(--muted)]">06</span>
                From source
              </h4>
              <CodeBlock code={fromSourceCode} />
            </div>
          </div>
        </section>

        {/* CREDITS */}
        <footer id="credits" className="border-t border-[var(--border)] py-20 pb-24">
          <div className="flex flex-wrap items-start justify-between gap-7">
            <div>
              <p className="eyebrow mb-2">Credits</p>
              <p className="m-0 max-w-[40ch] text-[var(--muted)]">
                Built by Sai Vidyut, Josh Jiby, and Fathima Rinaya C. Released under
                Apache-2.0.
              </p>
        </div>
            <div className="flex flex-col gap-2 text-[13px]">
              <a
                href="https://github.com/Sai-Vidyut/Peffle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--muted)] transition-colors hover:text-[var(--info)]"
              >
                GitHub repository
              </a>
              <a
                href="https://www.npmjs.com/package/peffle"
            target="_blank"
            rel="noopener noreferrer"
                className="text-[var(--muted)] transition-colors hover:text-[var(--info)]"
              >
                npm package
          </a>
          <a
                href="https://github.com/Sai-Vidyut/Peffle/issues"
            target="_blank"
            rel="noopener noreferrer"
                className="text-[var(--muted)] transition-colors hover:text-[var(--info)]"
          >
                Open an issue
          </a>
        </div>
            <div className="flex flex-col gap-2 text-[13px]">
              <a
                href="/privacy"
                className="text-[var(--muted)] transition-colors hover:text-[var(--info)]"
              >
                Privacy policy
              </a>
              <a
                href="/terms"
                className="text-[var(--muted)] transition-colors hover:text-[var(--info)]"
              >
                Terms
              </a>
            </div>
          </div>
          <p className="mt-10 text-xs text-[var(--muted)]/70">
            npm may lag the GitHub repo&apos;s version. Run{" "}
            <code className="font-mono">npm view peffle version</code> to check what you&apos;ll
            actually get from <code className="font-mono">npm install</code>.
          </p>
        </footer>
      </main>
    </>
  );
}
