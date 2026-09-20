"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "rounded-full border border-[var(--border)] px-5 py-2 text-xs text-[var(--muted)] transition-colors hover:border-[var(--text)] hover:text-[var(--text)]",
        copied && "border-[var(--text)] text-[var(--text)]",
        className
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
