"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export function VideoPlaceholder() {
  const [show, setShow] = useState(false);

  function trigger() {
    setShow(true);
    setTimeout(() => setShow(false), 1800);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Play install walkthrough"
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        }
      }}
      className="relative my-5 flex aspect-video cursor-pointer flex-col items-center justify-center gap-3.5 border border-[var(--border)] bg-[var(--panel)]"
    >
      <div className="flex h-13 w-13 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-2)] transition-transform hover:scale-105">
        <Play className="ml-0.5 h-4.5 w-4.5 fill-[var(--text)] text-[var(--text)]" />
      </div>
      <span className="text-xs text-[var(--muted)]">Install walkthrough — 60–90s</span>
      <span
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[var(--text)] transition-opacity ${
          show ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Video coming soon
      </span>
    </div>
  );
}
