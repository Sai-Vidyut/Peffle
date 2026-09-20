import { Power, ListChecks, Wallet, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/copy-button";

type WalkStep = {
  id: string;
  n: string;
  title: string;
  body: string;
  code: string;
  highlightLines: number[];
  fileLabel: string;
};

const STEPS: WalkStep[] = [
  {
    id: "create",
    n: "01",
    title: "Create an instance",
    body: "Point storage at a SQLite file and load your JSON policy.",
    code: `import { createPeffle } from "peffle";

const peffle = createPeffle({
  storagePath: "./peffle.db",
  policy: { /* version, defaults, budgets, actions */ },
});`,
    highlightLines: [1, 3, 4, 5, 6],
    fileLabel: "agent.ts",
  },
  {
    id: "guard",
    n: "02",
    title: "Wrap a side effect",
    body: "Every spend, send, or write runs inside guard() — checks run before your handler.",
    code: `await peffle.guard(
  { agent: { agentId: "shopper" }, action: "charge_card", amount: 8 },
  async () => chargeCard(8)
);`,
    highlightLines: [1, 2, 3],
    fileLabel: "agent.ts",
  },
  {
    id: "approval",
    n: "03",
    title: "Handle an approval",
    body: "When a rule requires approval, guard() throws with a one-time eventId and token. Approve out of band, then retry.",
    code: `try {
  await peffle.guard(request, handler);
} catch (err) {
  if (err instanceof ApprovalRequiredError) {
    // err.eventId, err.token — approve out of band,
    // then retry guard() with { eventId, token }
    // (see the README for exactly where the pair goes)
  }
}`,
    highlightLines: [4, 5, 6, 7],
    fileLabel: "agent.ts",
  },
  {
    id: "cli",
    n: "04",
    title: "Operate from the CLI",
    body: "Inspect pending approvals, kill an agent, or dump the ledger from the terminal.",
    code: `npx peffle pending
npx peffle approve <eventId>
npx peffle kill <agentId>
npx peffle ledger --json`,
    highlightLines: [1, 2, 3, 4],
    fileLabel: "shell",
  },
];

type ProofCard = {
  id: string;
  title: string;
  body: string;
  icon: typeof Power;
  tone: "allow" | "pending" | "deny" | "info";
  proofLabel: string;
  proofLines: { text: string; tone?: "ok" | "blocked" | "muted" | "text" }[];
};

const PROOFS: ProofCard[] = [
  {
    id: "kill",
    title: "Kill switch",
    body: "Halt one agent or everything before policy or budgets run.",
    icon: Power,
    tone: "deny",
    proofLabel: "CLI",
    proofLines: [
      { text: "$ npx peffle kill <agentId>", tone: "text" },
      { text: "# checked before policy or budgets", tone: "muted" },
      { text: "# subsequent guard() calls stop here", tone: "muted" },
    ],
  },
  {
    id: "policy",
    title: "Policy",
    body: "JSON rules match actions to allow, deny, or require approval. Default when nothing matches: deny.",
    icon: ListChecks,
    tone: "allow",
    proofLabel: "policy",
    proofLines: [
      { text: "defaults: { onNoMatchingRule: \"deny\" }", tone: "text" },
      { text: "actions: [{ match: { action: \"charge_card\" },", tone: "muted" },
      { text: "  effect: \"allow\" }]", tone: "ok" },
    ],
  },
  {
    id: "budgets",
    title: "Budgets",
    body: "Spend is checked and reserved in a SQLite transaction so shared DB files don't double-spend.",
    icon: Wallet,
    tone: "allow",
    proofLabel: "demo.mjs",
    proofLines: [
      { text: "CHARGED $8", tone: "ok" },
      { text: "BLOCKED Budget exceeded:", tone: "blocked" },
      { text: "spent 13 would exceed limit 10", tone: "blocked" },
    ],
  },
  {
    id: "ledger",
    title: "Ledger",
    body: "Every guard() call writes an audit event — allowed, denied, or pending.",
    icon: ScrollText,
    tone: "info",
    proofLabel: "ledger",
    proofLines: [
      { text: "$ npx peffle ledger --json", tone: "text" },
      { text: "# allowed | denied | pending", tone: "muted" },
      { text: "# written before your handler runs", tone: "muted" },
    ],
  },
];

function toneDot(tone: ProofCard["tone"]) {
  if (tone === "allow") return "bg-[var(--allow)]";
  if (tone === "pending") return "bg-[var(--pending)]";
  if (tone === "deny") return "bg-[var(--deny)]";
  return "bg-[var(--info)]";
}

function lineToneClass(tone?: "ok" | "blocked" | "muted" | "text") {
  if (tone === "ok") return "text-[var(--allow)]";
  if (tone === "blocked") return "text-[var(--deny)]";
  if (tone === "text") return "text-[var(--text)]";
  return "text-[var(--muted)]/70";
}

function WalkthroughCode({ step }: { step: WalkStep }) {
  const lines = step.code.split("\n");

  return (
    <div className="evidence-shadow overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/70" />
        <span className="ml-1.5 font-sans text-[11px] tracking-wide text-[var(--muted)]">
          {step.fileLabel}
        </span>
      </div>
      <div className="relative overflow-x-auto px-4 py-3.5 font-mono text-[12.5px]">
        <CopyButton
          value={step.code}
          className="absolute top-2 right-2 z-10 bg-[var(--panel-2)] px-4 py-1.5 text-[11px]"
        />
        <pre className="m-0 pr-16 whitespace-pre">
          {lines.map((line, i) => {
            const n = i + 1;
            const active = step.highlightLines.includes(n);
            return (
              <span
                key={n}
                className={cn(
                  "block leading-[1.9]",
                  active ? "bg-[var(--panel-2)] text-[var(--text)]" : "text-[var(--muted)]"
                )}
              >
                <span className="inline-block w-6 pr-3 text-right text-[var(--muted)]/50 select-none">
                  {n}
                </span>
                {line.length === 0 ? " " : line}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export function HowToWalkthrough() {
  return (
    <div className="space-y-16">
      {STEPS.map((step, i) => {
        const reverse = i % 2 === 1;
        return (
          <div
            key={step.id}
            className={cn(
              "grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12",
              reverse && "md:[&>*:first-child]:order-2"
            )}
          >
            <div>
              <p className="mb-3 text-[11px] font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
                {step.n}
              </p>
              <h3 className="mb-3 text-[22px] font-semibold tracking-tight text-[var(--text)] md:text-[24px]">
                {step.title}
              </h3>
              <p className="m-0 max-w-[40ch] text-[15px] text-[var(--muted)]">{step.body}</p>
            </div>
            <WalkthroughCode step={step} />
          </div>
        );
      })}

      <div>
        <h3 className="mb-2 text-[22px] font-semibold tracking-tight md:text-[24px]">
          What guard() enforces
        </h3>
        <p className="mb-8 max-w-[68ch] text-[var(--muted)]">
          The same checks run on every call. Details match the How it works section.
        </p>
        <div className="space-y-4">
          {PROOFS.map((card) => (
            <div
              key={card.id}
              className="flex flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--panel)] md:flex-row"
            >
              <div className="flex flex-1 flex-col justify-center p-5 md:p-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className={cn("h-[7px] w-[7px] shrink-0 rounded-sm", toneDot(card.tone))} />
                  <card.icon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
                  <h4 className="text-[15px] font-semibold text-[var(--text)]">{card.title}</h4>
                </div>
                <p className="m-0 max-w-[42ch] text-[14px] text-[var(--muted)]">{card.body}</p>
              </div>
              <div className="flex flex-col border-t border-[var(--border)] bg-[var(--panel-2)] md:w-72 md:border-t-0 md:border-l">
                <div className="border-b border-[var(--border)] px-3.5 py-2">
                  <span className="text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">
                    {card.proofLabel}
                  </span>
                </div>
                <div className="space-y-0.5 p-3.5 font-mono text-[12px] leading-relaxed">
                  {card.proofLines.map((line, i) => (
                    <p key={i} className={cn("m-0 whitespace-pre-wrap", lineToneClass(line.tone))}>
                      {line.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
