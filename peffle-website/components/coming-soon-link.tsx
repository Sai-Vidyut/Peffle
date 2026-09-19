"use client";

import { useState } from "react";

export function ComingSoonLink({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const [label, setLabel] = useState(children);

  return (
    <a
      href="#"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        setLabel("Coming soon");
        setTimeout(() => setLabel(children), 1400);
      }}
    >
      {label}
    </a>
  );
}
