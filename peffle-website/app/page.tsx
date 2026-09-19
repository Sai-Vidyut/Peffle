import { Mascot } from "@/components/mascot";
import { GuardTerminal } from "@/components/guard-terminal";
import { GuardOrder } from "@/components/guard-order";
import { GuardSequenceInline } from "@/components/guard-sequence-inline";
import { CopyButton } from "@/components/copy-button";
import { ScrollspyNav } from "@/components/scrollspy-nav";
import { VideoPlaceholder } from "@/components/video-placeholder";
import { CodeBlock } from "@/components/code-block";
import { ComingSoonLink } from "@/components/coming-soon-link";
import { HowToWalkthrough } from "@/components/how-to-walkthrough";

const heroLines = [
  { type: "input" as const, text: 'peffle.guard({ action: "charge_card", amount: 8 }, handler)' },
  { type: "output" as const, tone: "ok" as const, text: 'ALLOW — policy "spend" matched, budget 8/10 daily' },
  { type: "input" as const, text: 'peffle.guard({ action: "charge_card", amount: 5 }, handler)' },
  { type: "output" as const, tone: "blocked" as const, text: "DENY — BudgetExceededError: 13 would exceed limit 10" },
  { type: "comment" as const, text: "# event written to ledger.db either way" },
];

const demoLines = [
  { type: "comment" as const, text: '# daily budget: $10, action "charge_card" allowed by policy' },
  { type: "input" as const, text: "node demo.mjs" },
  { type: "output" as const, tone: "ok" as const, text: "CHARGED $8" },
  { type: "output" as const, tone: "blocked" as const, text: "BLOCKED Budget exceeded: spent 13 would exceed limit 10" },
];

const createProjectCode = `mkdir my-agent && cd my-agent
npm init -y`;

const fromSourceCode = `git clone https://github.com/Sai-Vidyut/Peffle
npm install
npm run example`;

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(16,21,26,0.92)] backdrop-blur-sm">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-3.5">
          <a
            href="#top"
            className="flex shrink-0 items-center gap-2 text-[15px] font-bold leading-none text-[var(--text)]"
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

      <main className="mx-auto max-w-[880px] px-6">
        {/* HERO */}
        <section id="top" aria-label="Hero" className="flex flex-col items-center pt-18 pb-10 text-center">
          <Mascot className="mb-5.5" />

          <h1 className="mb-4 text-[clamp(28px,6vw,40px)] font-bold leading-none tracking-tight text-[var(--text)]">
            Peffle
          </h1>

          <p className="mb-2 max-w-[46ch] text-base text-[var(--muted)]">
            Local policy enforcement for AI agent tool calls
          </p>
          <p className="mb-8.5 text-[13px] text-[var(--muted)]/70">~/agent-service</p>

          <div className="mb-2 flex flex-wrap items-center justify-center gap-2.5">
            <code className="min-w-[200px] border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-left text-[13px] text-[var(--text)] before:mr-1 before:content-['$_'] before:text-[var(--muted)]">
              npm install peffle
            </code>
            <CopyButton value="npm install peffle" />
          </div>

          <p className="mx-auto mb-8 max-w-[54ch] text-[15px] text-[var(--muted)]">
            Peffle wraps every agent tool call in <code>guard()</code>: a kill switch, JSON
            policy rules, transactional spend budgets, and a SQLite audit ledger. The check runs
            in your process before the handler. Local, Apache-2.0, zero telemetry.
          </p>

          <GuardTerminal
            title="guard() session"
            lines={heroLines}
            className="mb-10 w-full text-left"
            welcome={
              <div className="mb-3.5 flex items-center gap-2.5 border-b border-dashed border-[var(--border)] pb-3.5">
                <span className="h-1.5 w-1.5 shrink-0 bg-[var(--text)]" aria-hidden="true" />
                <div className="text-xs text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Peffle v0.1.1</strong>
                  {": local enforcement layer. No network calls, no hosted service."}
                </div>
              </div>
            }
          />
        </section>

        {/* OVERVIEW — compressed guard() order (links to detail blocks) */}
        <section id="overview" className="border-t border-[var(--border)] py-12">
          <p className="mb-2.5 text-center text-xs text-[var(--muted)]">Overview</p>
          <h2 className="mb-3 text-center text-[18px] font-semibold tracking-tight">
            The guard() order
          </h2>
          <p className="mx-auto mb-6 max-w-[52ch] text-center text-[13px] text-[var(--muted)]">
            Every call runs these five checks, in order, before your handler. Jump to a step for
            detail.
          </p>
          <GuardSequenceInline />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="border-t border-[var(--border)] py-16">
          <p className="mb-2.5 text-xs text-[var(--muted)]">How it works</p>
          <h2 className="mb-4 text-[22px] font-semibold tracking-tight">
            Prompt instructions are not enforcement
          </h2>
          <p className="mb-3.5 max-w-[62ch] text-base text-[var(--text)]">
            A system prompt that lists allowed tools is advisory. Jailbreaks, bad tool responses,
            and long context windows can ignore it. Peffle runs the check in code between the
            agent&apos;s decision and the side effect.
          </p>

          <h3 className="mt-8 mb-2 text-[15px] font-semibold">The guard() order</h3>
          <p className="mb-6 max-w-[68ch] text-[var(--muted)]">
            Every call runs through the same five checks, in this order, before your handler
            executes.
          </p>
          <GuardOrder className="mb-10" />

          <h3 className="mb-2 text-[15px] font-semibold">See it</h3>
          <p className="mb-4 max-w-[68ch] text-[var(--muted)]">
            The $10 daily budget demo from the README, run end to end.
          </p>
          <GuardTerminal title="demo.mjs" lines={demoLines} className="mb-10" />

          <h3 className="mt-10 mb-2 text-[15px] font-semibold">Approval flow</h3>
          <p className="mb-3.5 max-w-[68ch] text-[var(--muted)]">
            When a policy rule requires approval, <code>guard()</code> throws an{" "}
            <code>ApprovalRequiredError</code> carrying a one-time{" "}
            <code>{"{ eventId, token }"}</code> pair instead of running your handler. Approve it
            out of band, then retry <code>guard()</code> with that pair. See the README for
            exactly where it goes in the call.
          </p>

          <div className="mt-8 mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              id="policy"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--allow)]" />
                Policy
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                JSON rules with an action matcher and an effect — allow, deny, or require
                approval. A default rule decides what happens when nothing matches; Peffle&apos;s
                own default is deny.
              </p>
            </div>
            <div
              id="budgets"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--allow)]" />
                Budgets
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                Scoped spend limits (global or per-agent) over a window such as daily. Checked
                and reserved inside a SQLite transaction so concurrent processes sharing one
                database file don&apos;t double-spend.
              </p>
            </div>
            <div
              id="approval"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--pending)]" />
                Approval
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                A human approval is tied to a SHA-256 fingerprint of the exact request. It&apos;s
                single-use and expires after its TTL — it can&apos;t be replayed against a
                different call.
              </p>
            </div>
            <div
              id="kill-switch"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--deny)]" />
                Kill switch
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                A hard stop for one agent or everything, checked before policy or budgets.
                Reachable from the CLI: <code>npx peffle kill &lt;agentId&gt;</code>.
              </p>
            </div>
            <div
              id="ledger"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--info)]" />
                Ledger
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                Every <code>guard()</code> call writes an audit event to SQLite — allowed,
                denied, or pending — regardless of outcome. Read it back with{" "}
                <code>npx peffle ledger --json</code>.
              </p>
            </div>
            <div
              id="mcp"
              className="detail-card border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <h4 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
                <span className="h-[7px] w-[7px] shrink-0 bg-[var(--info)]" />
                MCP
              </h4>
              <p className="m-0 text-[13px] text-[var(--muted)]">
                An optional <code>guardTool</code> wrapper for Model Context Protocol servers.
                Requires <code>@modelcontextprotocol/sdk</code> as a peer dependency — it&apos;s
                not installed by default.
              </p>
            </div>
          </div>

          <h3 className="mt-10 mb-2 text-[15px] font-semibold">What Peffle is not</h3>
          <ul className="mb-3.5 list-disc space-y-1.5 pl-[18px] text-[13.5px] text-[var(--muted)] marker:text-[var(--muted)]">
            <li>Not a hosted service — it runs locally, next to your agent.</li>
            <li>
              Not OAuth or a crypto identity system — agent IDs are just strings you assign.
            </li>
            <li>
              Not a sandbox — it decides whether your function runs, it doesn&apos;t isolate what
              that function can do.
            </li>
          </ul>

          <h3 className="mb-2 text-[15px] font-semibold">Before you rely on it</h3>
          <ul className="mb-3.5 list-disc space-y-1.5 pl-[18px] text-[13.5px] text-[var(--muted)] marker:text-[var(--deny)]">
            <li>
              Agent IDs and delegation chains are self-asserted, not cryptographically verified.
            </li>
            <li>
              It can&apos;t protect against something bypassing <code>guard()</code> itself, or a
              compromised host or database.
            </li>
            <li>MCP redemption handles live in memory and don&apos;t survive a restart.</li>
            <li>
              A failed handler run doesn&apos;t count toward budgets — a retry can re-enter and
              spend again.
            </li>
          </ul>
        </section>

        {/* HOW TO USE */}
        <section id="how-to-use" className="border-t border-[var(--border)] py-16">
          <p className="mb-2.5 text-xs text-[var(--muted)]">How to use</p>
          <h2 className="mb-4 text-[22px] font-semibold tracking-tight">Wire it into an agent</h2>
          <p className="mb-8 max-w-[62ch] text-[var(--muted)]">
            Create an instance, wrap side effects in <code>guard()</code>, handle approvals when a
            rule requires them, and operate the kill switch and ledger from the CLI.
          </p>
          <HowToWalkthrough />
        </section>

        {/* INSTALL */}
        <section id="install" className="border-t border-[var(--border)] py-16">
          <p className="mb-2.5 text-xs text-[var(--muted)]">Install</p>
          <h2 className="mb-4 text-[22px] font-semibold tracking-tight">
            Get running in a few minutes
          </h2>
          <p className="mb-3.5 max-w-[62ch] text-base text-[var(--text)]">
            Everything below runs in a Mac terminal against a fresh project.
          </p>
          <VideoPlaceholder />

          <div className="mt-2">
            <div className="border-t border-[var(--border)] py-5 first:border-t-0">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">01</span>
                Check Node
              </h4>
              <p className="mb-3.5 max-w-[68ch] text-[var(--muted)]">
                Peffle needs Node 18 or later.
              </p>
              <CodeBlock code="node -v" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Below 18, or missing? <code>brew install node</code>, or grab the installer from
                nodejs.org.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-5">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">02</span>
                Create a project
              </h4>
              <CodeBlock code={createProjectCode} />
            </div>

            <div className="border-t border-[var(--border)] py-5">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">03</span>
                Install Peffle
              </h4>
              <CodeBlock code="npm install peffle" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Peffle depends on <code>better-sqlite3</code>, a native module. It normally pulls
                a prebuilt binary. If it compiles instead, run <code>xcode-select --install</code>{" "}
                first.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-5">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">04</span>
                Run the $10 budget demo
              </h4>
              <p className="mb-3.5 max-w-[68ch] text-[var(--muted)]">
                Save the snippet from the README as <code>demo.mjs</code>, then:
              </p>
              <CodeBlock code="node demo.mjs" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Expect <code>CHARGED $8</code> followed by a blocked second charge.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-5">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">05</span>
                Optional: MCP
              </h4>
              <CodeBlock code="npm install @modelcontextprotocol/sdk" />
              <p className="-mt-1.5 max-w-[68ch] text-[var(--muted)]">
                Then <code>{"import { guardTool } from \"peffle/mcp\""}</code>. The SDK is an
                optional peer dependency.
              </p>
            </div>

            <div className="border-t border-[var(--border)] py-5">
              <h4 className="mb-2.5 flex items-baseline gap-2.5 text-[13.5px] font-semibold">
                <span className="text-xs text-[var(--muted)]">06</span>
                From source
              </h4>
              <CodeBlock code={fromSourceCode} />
            </div>
          </div>
        </section>

        {/* CREDITS */}
        <footer id="credits" className="border-t border-[var(--border)] py-12 pb-20">
          <div className="flex flex-wrap items-start justify-between gap-7">
            <div>
              <p className="mb-1.5 text-xs text-[var(--muted)]">Credits</p>
              <p className="m-0 max-w-[40ch] text-[var(--muted)]">
                Built by Sai Vidyut. Released under Apache-2.0.
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
              <ComingSoonLink className="text-[var(--muted)] transition-colors hover:text-[var(--info)]">
                Privacy policy
              </ComingSoonLink>
              <ComingSoonLink className="text-[var(--muted)] transition-colors hover:text-[var(--info)]">
                Terms
              </ComingSoonLink>
            </div>
          </div>
          <p className="mt-8 text-xs text-[var(--muted)]/70">
            npm may lag the GitHub repo&apos;s version. Run <code>npm view peffle version</code>{" "}
            to check what you&apos;ll actually get from <code>npm install</code>.
          </p>
        </footer>
      </main>
    </>
  );
}
