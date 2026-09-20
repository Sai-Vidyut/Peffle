"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuardTerminal, type TerminalLine } from "@/components/guard-terminal";

export type TerminalTab = {
  id: string;
  label: string;
  title: string;
  lines: TerminalLine[];
  /** Play Checking policy → Reserving budget before each decision output */
  animateDecisions?: boolean;
  welcome?: ReactNode;
};

type Phase = "idle" | "checking" | "reserving" | "done";

const PANEL_HEIGHT = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDecision(line: TerminalLine): boolean {
  return line.type === "output" && (line.tone === "ok" || line.tone === "blocked");
}

function useDecisionReveal(lines: TerminalLine[], animate: boolean, resetKey: string) {
  const [visibleCount, setVisibleCount] = useState(() =>
    animate ? 0 : lines.length
  );
  const [phase, setPhase] = useState<Phase>(() => (animate ? "idle" : "done"));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!animate || prefersReducedMotion()) {
      setVisibleCount(lines.length);
      setPhase("done");
      setPending(false);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    setVisibleCount(0);
    setPhase("idle");
    setPending(false);

    function revealFrom(start: number) {
      if (cancelled) return;

      let i = start;
      while (i < lines.length && !isDecision(lines[i]!)) {
        i += 1;
      }
      setVisibleCount(i);

      if (i >= lines.length) {
        setPhase("done");
        setPending(false);
        return;
      }

      setPending(true);
      setPhase("checking");
      later(() => {
        if (cancelled) return;
        setPhase("reserving");
        later(() => {
          if (cancelled) return;
          setPhase("done");
          setPending(false);
          setVisibleCount(i + 1);
          later(() => revealFrom(i + 1), 160);
        }, 300);
      }, 400);
    }

    later(() => revealFrom(0), 60);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [lines, animate, resetKey]);

  return { visibleCount, phase, pending };
}

export function TabbedGuardTerminal({
  tabs,
  className,
  defaultTabId,
  height = PANEL_HEIGHT,
}: {
  tabs: TerminalTab[];
  className?: string;
  defaultTabId?: string;
  height?: number;
}) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]!.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]!;
  const animate = Boolean(active.animateDecisions);
  const { visibleCount, phase, pending } = useDecisionReveal(active.lines, animate, active.id);
  const termScrollRef = useRef<HTMLDivElement>(null);

  const shown = animate ? active.lines.slice(0, visibleCount) : active.lines;

  useEffect(() => {
    if (termScrollRef.current) termScrollRef.current.scrollTop = 0;
  }, [active.id]);

  const afterLines =
    pending && phase === "checking" ? (
      <p className="pl-[1.1em] text-[13px] leading-[1.9] text-[var(--pending)]">
        Checking policy…
      </p>
    ) : pending && phase === "reserving" ? (
      <p className="pl-[1.1em] text-[13px] leading-[1.9] text-[var(--pending)]">
        Reserving budget…
      </p>
    ) : null;

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Peffle CLI views"
        className="mb-2 flex flex-wrap gap-1"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-[13px] transition-colors",
                selected
                  ? "bg-[var(--surface-panel)] text-[var(--text)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-border-btn)] hover:text-[var(--text)]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <GuardTerminal
        title={active.title}
        lines={shown}
        welcome={active.welcome}
        afterLines={afterLines}
        height={height}
        scrollRef={termScrollRef}
      />
    </div>
  );
}
