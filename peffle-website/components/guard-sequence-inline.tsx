import { cn } from "@/lib/utils";

const steps = [
  { href: "#kill-switch", label: "Kill switch" },
  { href: "#policy", label: "Policy" },
  { href: "#budgets", label: "Budgets" },
  { href: "#ledger", label: "Ledger" },
  { href: "#your-function", label: "Your function" },
] as const;

export function GuardSequenceInline({ className }: { className?: string }) {
  return (
    <nav
      aria-label="guard() execution order"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[13px]",
        className
      )}
    >
      {steps.map((step, i) => (
        <span key={step.href} className="inline-flex items-center gap-2">
          {i > 0 ? (
            <span className="text-[var(--border)]" aria-hidden="true">
              →
            </span>
          ) : null}
          <a
            href={step.href}
            className="border-b border-transparent text-[var(--muted)] transition-colors hover:border-[var(--text)] hover:text-[var(--text)]"
          >
            <span className="mr-1.5 text-[11px] text-[var(--muted)]/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            {step.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
