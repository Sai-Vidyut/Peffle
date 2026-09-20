import type { ActionRule, BudgetRule, PolicyConfig } from "../core/types.js";

function budgetKey(b: BudgetRule): string {
  return `${b.id}:${b.scope}:${b.window}:${b.limit}:${b.match?.action ?? ""}`;
}

function actionKey(a: ActionRule): string {
  return `${a.id}:${a.match.action ?? ""}:${a.match.resource ?? ""}:${a.effect}`;
}

export interface PolicyDiffLine {
  kind: "add" | "remove" | "change";
  label: string;
  detail: string;
}

export function computePolicyDiff(before: PolicyConfig, after: PolicyConfig): PolicyDiffLine[] {
  const lines: PolicyDiffLine[] = [];

  const bBudgets = new Map(before.budgets.map((b) => [b.id, b]));
  const aBudgets = new Map(after.budgets.map((b) => [b.id, b]));
  for (const [id, b] of aBudgets) {
    const prev = bBudgets.get(id);
    if (!prev) {
      lines.push({
        kind: "add",
        label: `budget ${id}`,
        detail: `${b.window} limit $${b.limit}`,
      });
    } else if (budgetKey(prev) !== budgetKey(b)) {
      lines.push({
        kind: "change",
        label: `budget ${id}`,
        detail: `$${prev.limit} → $${b.limit} (${b.window})`,
      });
    }
  }
  for (const id of bBudgets.keys()) {
    if (!aBudgets.has(id)) {
      lines.push({ kind: "remove", label: `budget ${id}`, detail: "removed" });
    }
  }

  const bActions = new Map(before.actions.map((a) => [a.id, a]));
  const aActions = new Map(after.actions.map((a) => [a.id, a]));
  for (const [id, a] of aActions) {
    const prev = bActions.get(id);
    const match = a.match.action ?? a.match.resource ?? "*";
    if (!prev) {
      lines.push({
        kind: "add",
        label: match,
        detail: a.effect.toUpperCase().replace("_", " "),
      });
    } else if (actionKey(prev) !== actionKey(a)) {
      lines.push({
        kind: "change",
        label: match,
        detail: `${prev.effect} → ${a.effect}`,
      });
    }
  }
  for (const id of bActions.keys()) {
    if (!aActions.has(id)) {
      lines.push({ kind: "remove", label: `rule ${id}`, detail: "removed" });
    }
  }

  if (before.defaults.onNoMatchingRule !== after.defaults.onNoMatchingRule) {
    lines.push({
      kind: "change",
      label: "default rule",
      detail: `${before.defaults.onNoMatchingRule} → ${after.defaults.onNoMatchingRule}`,
    });
  }

  return lines;
}

export function formatPolicyDiffHuman(lines: PolicyDiffLine[]): string {
  if (lines.length === 0) return "No policy changes.";
  const body = lines
    .map((l) => {
      const prefix = l.kind === "add" ? "+" : l.kind === "remove" ? "-" : "~";
      return `  ${prefix} ${l.label.padEnd(22)} ${l.detail}`;
    })
    .join("\n");
  return `Policy changes:\n\n${body}\n\n  ${lines.length} change${lines.length === 1 ? "" : "s"}`;
}
