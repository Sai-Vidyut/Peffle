"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How it works" },
  { id: "how-to-use", label: "How to use" },
  { id: "install", label: "Install" },
  { id: "credits", label: "Credits" },
];

export function ScrollspyNav() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="ml-auto flex max-w-full items-center justify-end gap-5.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {links.map((l) => (
        <a
          key={l.id}
          href={`#${l.id}`}
          className={cn(
            "whitespace-nowrap border-b border-transparent pb-0.5 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]",
            active === l.id && "border-[var(--text)] text-[var(--text)]"
          )}
        >
          {l.label}
        </a>
      ))}
      <a
        href="https://github.com/Sai-Vidyut/Peffle"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] transition-colors hover:border-[var(--info)] hover:text-[var(--info)]"
      >
        GitHub
      </a>
    </nav>
  );
}
