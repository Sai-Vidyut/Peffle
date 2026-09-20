import chalk from "chalk";
import { horizontalRule, padVisible, visibleLength } from "./banner.js";
import { colors } from "./theme.js";

const accent = chalk.hex(colors.accent);
const dim = chalk.hex(colors.dim);
const body = chalk.hex(colors.text);
const green = chalk.hex(colors.green);
const warn = chalk.hex("#e6b84d");
const err = chalk.hex(colors.red);

export function formatPromptPrefix(): string {
  return chalk.hex(colors.dim)("> ");
}

export type StatusKind = "thinking" | "reading" | "preparing";

export function formatStatus(kind: StatusKind): string {
  const labels: Record<StatusKind, string> = {
    thinking: "Thinking...",
    reading: "Reading policy...",
    preparing: "Preparing policy change...",
  };
  return dim(`  ◌ ${labels[kind]}`);
}

export function formatStatusDone(message: string): string {
  return `  ${green("✓")} ${body(message)}`;
}

export function clearStatusLine(
  out: Pick<NodeJS.WriteStream, "write">,
  captured: string[],
  statusLine: string
): void {
  if (out === process.stdout && process.stdout.isTTY) {
    out.write("\r\u001b[K");
    return;
  }
  if (captured.at(-1) === statusLine) captured.pop();
}

export function pickStatusForInput(line: string): StatusKind {
  const q = line.toLowerCase();
  if (/^\/?show\b|policy|rules|budget|limit|spend/.test(q)) return "preparing";
  if (/pending|approval|ledger|audit/.test(q)) return "reading";
  return "thinking";
}

function parseDiffRows(diffText: string | undefined): { kind: string; label: string; detail: string }[] {
  if (!diffText) return [];
  const rows: { kind: string; label: string; detail: string }[] = [];
  for (const line of diffText.split("\n")) {
    const m = line.match(/^\s*([+\-~])\s+(.+?)\s{2,}(.+)\s*$/);
    if (m) rows.push({ kind: m[1]!, label: m[2]!.trim(), detail: m[3]!.trim() });
  }
  return rows;
}

function indentBlock(lines: string[], indent = 4): string {
  const pad = " ".repeat(indent);
  return lines.map((l) => (l ? pad + l : "")).join("\n");
}

function renderKeyValues(rows: [string, string][], labelWidth: number): string[] {
  return rows.map(([k, v]) => `${dim(padVisible(k, labelWidth))}  ${body(v)}`);
}

function groupedPolicyProposal(diffRows: { kind: string; label: string; detail: string }[]): string {
  const budgets: [string, string][] = [];
  const actions: [string, string][] = [];
  const other: string[] = [];

  for (const row of diffRows) {
    const prefix = row.kind === "add" ? green("+") : row.kind === "remove" ? err("-") : warn("~");
    if (/^budget/i.test(row.label)) {
      const amt = row.detail.match(/\$(\d+(?:\.\d+)?)/);
      budgets.push([row.label.replace(/^budget\s+/i, "Daily"), amt ? `$${amt[1]}` : row.detail]);
    } else if (/^rule|^default/i.test(row.label)) {
      other.push(`${prefix} ${row.label}: ${row.detail}`);
    } else {
      actions.push([row.label, row.detail.toUpperCase().replace(/_/g, " ")]);
    }
  }

  const sections: string[] = [];
  if (budgets.length) {
    const lw = Math.max(...budgets.map(([k]) => visibleLength(k)), 6);
    sections.push(body("    Budget"), indentBlock(renderKeyValues(budgets, lw), 6));
  }
  if (actions.length) {
    const lw = Math.max(...actions.map(([k]) => visibleLength(k)), 6);
    sections.push(body("    Actions"), indentBlock(renderKeyValues(actions, lw), 6));
  }
  if (other.length) {
    sections.push(indentBlock(other, 4));
  }
  return sections.join("\n");
}

function parseHelpLine(line: string): [string, string] | null {
  const t = line.trim();
  if (!t.startsWith("/")) return null;
  const splitAt = t.search(/\s{2,}/);
  if (splitAt === -1) return null;
  return [t.slice(0, splitAt).trim(), t.slice(splitAt).trim()];
}

function formatHelpMessage(message: string, width: number): string {
  const rows: [string, string][] = [];
  for (const line of message.split("\n")) {
    const parsed = parseHelpLine(line);
    if (parsed) rows.push(parsed);
  }
  if (rows.length === 0) return formatPlainMessage(message);
  const cmdW = width >= 100 ? 14 : 12;
  const lines = rows.map(([cmd, desc]) => {
    const c = accent(padVisible(cmd, cmdW));
    return `    ${c} ${dim(desc)}`;
  });
  return ["", accent.bold("  Commands"), "", ...lines, ""].join("\n");
}

function formatPolicySummary(message: string): string {
  const budgets: [string, string][] = [];
  const actions: [string, string][] = [];
  let unmatched = "";
  let section: "budgets" | "actions" | null = null;

  for (const line of message.split("\n")) {
    if (line === "BUDGETS") {
      section = "budgets";
      continue;
    }
    if (line === "ACTIONS") {
      section = "actions";
      continue;
    }
    if (line.startsWith("Default when unmatched:")) {
      unmatched = line.replace("Default when unmatched: ", "");
      continue;
    }
    if (!line.trim() || line.includes("(none)")) continue;
    const trimmed = line.trim();
    if (section === "budgets") budgets.push(["Budget", trimmed]);
    if (section === "actions") {
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 2) actions.push([parts[0]!, parts[1]!.toLowerCase()]);
    }
  }

  const sections: string[] = ["", body("  Current policy"), ""];
  if (budgets.length) {
    const lw = Math.max(...budgets.map(([k]) => visibleLength(k)), 6);
    sections.push(body("    Budget"), indentBlock(renderKeyValues(budgets, lw), 6), "");
  }
  if (actions.length) {
    const lw = Math.max(...actions.map(([k]) => visibleLength(k)), 6);
    sections.push(body("    Actions"), indentBlock(renderKeyValues(actions, lw), 6), "");
  }
  if (unmatched) {
    sections.push(body("    Defaults"), indentBlock([`${dim("Unmatched")}  ${body(unmatched)}`], 6));
  }
  return sections.join("\n");
}

function formatSuccess(message: string): string | null {
  const t = message.trim();
  if (t === "Policy applied and saved.") {
    return `\n  ${green("✓")} Policy applied.\n`;
  }
  if (/^Approved /.test(t)) return `\n${formatStatusDone(t)}\n`;
  if (/^Revived agent/.test(t)) return `\n${formatStatusDone(t)}\n`;
  if (/^Killed agent/.test(t)) return `\n${formatStatusDone(t)}\n`;
  if (/^Denied /.test(t)) return `\n${formatStatusDone(t)}\n`;
  if (t === "Policy change cancelled.") return `\n  ${dim(t)}\n`;
  if (t === "Pending proposals cleared.") return `\n  ${dim(t)}\n`;
  return null;
}

function formatProposal(message: string): string | null {
  if (!message.includes("Apply these changes?")) return null;
  const [head] = message.split(/\n\nNo changes have been made yet\.\n/);
  if (!head) return null;

  const chunks = head.split("\n\nPolicy changes:\n\n");
  const summary = (chunks[0] ?? "").trim();
  const diffRows = parseDiffRows(chunks[1]);
  const changeCount = diffRows.length;

  const parts: string[] = ["", body("  Proposed policy"), ""];
  if (summary) parts.push(`  ${body(summary)}`, "");
  if (diffRows.length) {
    parts.push(groupedPolicyProposal(diffRows), "");
    parts.push(`  ${dim(`${changeCount} change${changeCount === 1 ? "" : "s"}`)}`);
  }
  parts.push(`  ${dim("Apply this policy?")} ${accent("[y/N]")}`, "");
  return parts.join("\n");
}

function formatPolicyDiffOnly(message: string): string | null {
  if (!message.trim().startsWith("Policy changes:")) return null;
  const diffRows = parseDiffRows(message);
  if (!diffRows.length) return `\n  ${dim("No policy changes.")}\n`;
  const count = diffRows.length;
  return [
    "",
    body("  Proposed changes"),
    "",
    groupedPolicyProposal(diffRows),
    "",
    `  ${dim(`${count} change${count === 1 ? "" : "s"}`)}`,
    "",
  ].join("\n");
}

function formatKillConfirm(message: string): string | null {
  const m = message.match(/^Kill agent "(.+)"\?(.+)/s);
  if (!m) return null;
  return [
    "",
    `  ${warn(`Kill agent "${m[1]}"?`)}`,
    `  ${dim(m[2]!.replace(/\[y\/N\].*/, "").trim())}`,
    "",
    `  ${dim("Confirm")} ${accent("[y/N]")}`,
    "",
  ].join("\n");
}

function formatPlainMessage(message: string): string {
  if (!message.trim()) return "";
  if (message.includes("\n")) {
    return `\n${message
      .split("\n")
      .map((l) => (l.trim() ? `  ${body(l)}` : ""))
      .join("\n")}\n`;
  }
  return `\n  ${body(message)}\n`;
}

function formatBody(message: string, width: number): string {
  if (message.trim().startsWith("Commands:")) return formatHelpMessage(message, width);

  const success = formatSuccess(message);
  if (success) return success;

  const proposal = formatProposal(message);
  if (proposal) return proposal;

  const kill = formatKillConfirm(message);
  if (kill) return kill;

  const diffOnly = formatPolicyDiffOnly(message);
  if (diffOnly) return diffOnly;

  if (message.trim().startsWith("BUDGETS\n")) return formatPolicySummary(message);

  if (/^Invalid policy|^No pending|^Nothing to apply|^Unknown command|^Usage:/.test(message.trim())) {
    return `\n  ${err(message.split("\n")[0])}${message.includes("\n") ? `\n  ${dim(message.split("\n").slice(1).join("\n"))}` : ""}\n`;
  }

  return formatPlainMessage(message);
}

export function formatAssistantOutput(message: string, width = 80): string {
  if (!message.trim()) return "";
  return formatBody(message, width);
}

export function formatAssistantOutputCombined(messages: string[], width = 80): string {
  return formatAssistantOutput(messages.filter(Boolean).join("\n\n"), width);
}

/** Natural-language turns: compact Peffle label, Claude-like conversation flow. */
export function formatConversationOutputCombined(messages: string[], width = 80): string {
  const content = formatAssistantOutputCombined(messages, width);
  if (!content.trim()) return "";
  return `\n  ${accent.bold("Peffle")}${content}`;
}

export function peffleSay(message: string, _state?: "idle" | "success" | "warning", width = 80): string {
  return formatAssistantOutput(message, width);
}

export function peffleSayCombined(messages: string[], width = 80): string {
  return formatAssistantOutputCombined(messages, width);
}

export function formatReply(message: string, width = 80): string {
  return formatAssistantOutput(message, width);
}

export function formatReplyCombined(messages: string[], width = 80): string {
  return formatAssistantOutputCombined(messages, width);
}

export function formatAssistantBody(message: string, width = 80): string {
  return formatBody(message, width);
}

export { horizontalRule };
