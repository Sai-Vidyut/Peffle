import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "evidence-shadow relative my-3 overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--panel)] px-4 py-3.5 font-mono text-[12.5px]",
        className
      )}
    >
      <CopyButton
        value={code}
        className="absolute top-2 right-2 bg-[var(--panel-2)] px-4 py-1.5 text-[11px]"
      />
      <pre className="m-0 whitespace-pre pr-16">{code}</pre>
    </div>
  );
}
