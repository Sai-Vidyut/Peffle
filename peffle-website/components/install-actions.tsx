"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/** Primary off-white pill that copies the install command. */
export function InstallPrimaryButton({
  value = "npm install peffle",
  className,
}: {
  value?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={cn(
        "rounded-full bg-[var(--surface-offwhite)] px-6 py-2.5 text-[14px] font-medium text-[var(--surface-base)] transition-opacity hover:opacity-90",
        className
      )}
    >
      {copied ? "Copied" : value}
    </button>
  );
}

/** Monospace install chip with copy icon (for catches CTA row). */
export function InstallChip({
  value = "npm install peffle",
  className,
}: {
  value?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      aria-label={copied ? "Copied" : `Copy ${value}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 font-mono text-[12.5px] text-[var(--text)] transition-colors hover:border-[var(--muted)]",
        className
      )}
    >
      <span>{copied ? "Copied" : value}</span>
      <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
    </button>
  );
}
