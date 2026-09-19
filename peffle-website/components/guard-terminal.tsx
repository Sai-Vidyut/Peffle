import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TerminalLine =
  | { type: "input"; text: string }
  | { type: "output"; text: string; tone?: "ok" | "blocked" }
  | { type: "comment"; text: string };

interface GuardTerminalProps {
  title: string;
  lines: TerminalLine[];
  className?: string;
  welcome?: ReactNode;
}

function lineClass(line: TerminalLine): string {
  if (line.type === "input") return "text-[var(--text)]";
  if (line.type === "comment") return "text-[var(--muted)]/70";
  if (line.type === "output" && line.tone === "ok") return "text-[var(--allow)]";
  if (line.type === "output" && line.tone === "blocked") return "text-[var(--deny)]";
  return "text-[var(--muted)]";
}

export function GuardTerminal({ title, lines, className, welcome }: GuardTerminalProps) {
  return (
    <div className={cn("border border-[var(--border)] bg-[var(--panel)]", className)}>
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2.5">
        {/* Chrome dots stay neutral — state colors are for output only */}
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/70" />
        <span className="ml-1.5 text-[11px] tracking-wide text-[var(--muted)]">{title}</span>
      </div>
      <div className="space-y-0.5 p-4">
        {welcome}
        {lines.map((line, i) => (
          <p
            key={i}
            className={cn(
              "text-[13px] leading-[1.9] break-words whitespace-pre-wrap",
              lineClass(line),
              line.type !== "input" && "pl-[1.1em]"
            )}
          >
            {line.type === "input" && <span className="text-[var(--muted)]">{"> "}</span>}
            {line.text}
          </p>
        ))}
        <p className="blink text-[13px] text-[var(--text)]">{"> "}</p>
      </div>
    </div>
  );
}
