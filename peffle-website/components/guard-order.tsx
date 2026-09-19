import { Power, ListChecks, Wallet, ScrollText, Play, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  id?: string;
}

const steps: Step[] = [
  {
    icon: Power,
    title: "Kill switch",
    body: "Checked first. If the agent (or everything) has been killed, the call stops here — nothing else runs.",
  },
  {
    icon: ListChecks,
    title: "Policy",
    body: "The action is matched against your JSON rules: allow, deny, or require approval. No matching rule means deny by default.",
  },
  {
    icon: Wallet,
    title: "Budgets",
    body: "Spend against the matched budget is checked and reserved inside a SQLite transaction, safe across processes sharing a database file.",
  },
  {
    icon: ScrollText,
    title: "Ledger",
    body: "The decision — allowed, denied, or pending approval — is written as an audit event before your function runs.",
  },
  {
    icon: Play,
    title: "Your function",
    body: "Only now does your handler run. If it throws, the budget reservation is released — failed runs don't count.",
    id: "your-function",
  },
];

export function GuardOrder({ className }: { className?: string }) {
  return (
    <ol
      className={cn(
        "relative flex flex-col gap-4.5 border-l border-dashed border-[var(--border)] pl-10",
        className
      )}
    >
      {steps.map((step, i) => (
        <li key={step.title} id={step.id} className="relative">
          <span className="absolute -left-[57px] top-0 flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-[var(--panel-2)] text-[11px] font-bold text-[var(--muted)]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex items-start gap-3 border border-[var(--border)] bg-[var(--panel)] p-4">
            <step.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
            <div>
              <h4 className="mb-1 text-[13.5px] font-semibold text-[var(--text)]">{step.title}</h4>
              <p className="m-0 text-[12.5px] text-[var(--muted)]">{step.body}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
