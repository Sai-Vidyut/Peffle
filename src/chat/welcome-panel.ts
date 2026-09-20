import chalk from "chalk";
import { colors } from "./theme.js";
import { renderPeffleWordmark, renderVersionLine } from "./wordmark.js";

export const LEFT_MARGIN = 2;

export function visibleLength(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, "").length;
}

export function padVisible(text: string, width: number): string {
  const pad = Math.max(0, width - visibleLength(text));
  return text + " ".repeat(pad);
}

function indent(line: string): string {
  return " ".repeat(LEFT_MARGIN) + line;
}

const edge = (s: string) => chalk.hex(colors.accent)(s);
const accent = chalk.hex(colors.accent);
const dim = chalk.hex(colors.dim);
const primary = chalk.hex(colors.text);

type Row = { left: string; right: string };

function styleLeft(plain: string): string {
  if (!plain) return "";
  if (plain.startsWith("Welcome")) return primary.bold(plain);
  return dim(plain);
}

function styleRight(plain: string): string {
  if (!plain) return "";
  if (plain === "Tips for getting started" || plain === "Recent activity") return accent.bold(plain);
  return dim(plain);
}

function topBorder(title: string, width: number): string {
  const head = `╭─ ${title} `;
  const tail = "╮";
  const dashes = Math.max(0, width - visibleLength(head) - visibleLength(tail));
  return edge(`${head}${"─".repeat(dashes)}${tail}`);
}

function bottomBorder(width: number): string {
  return edge(`╰${"─".repeat(Math.max(0, width - 2))}╯`);
}

function bodyRow(left: string, right: string, leftW: number, rightW: number): string {
  const l = padVisible(left, leftW);
  const r = padVisible(right, rightW);
  return `${edge("│")} ${l} ${edge("│")} ${r} ${edge("│")}`;
}

function stackedRow(text: string, innerW: number): string {
  return `${edge("│")} ${padVisible(text, innerW)} ${edge("│")}`;
}

function buildRows(recentActivity: string[]): Row[] {
  const activity = recentActivity[0] ?? "No recent activity";
  return [
    { left: "Welcome to Peffle!", right: "Tips for getting started" },
    { left: "Control what your AI agents can do,", right: "Ask Peffle to define" },
    { left: "spend, and execute.", right: "policies for your agents." },
    { left: "", right: "Recent activity" },
    { left: "", right: activity },
  ];
}

function panelWidthForRows(rows: Row[], maxPanel: number): {
  leftW: number;
  rightW: number;
  width: number;
} {
  let leftW = 0;
  let rightW = 0;
  for (const row of rows) {
    leftW = Math.max(leftW, visibleLength(row.left));
    rightW = Math.max(rightW, visibleLength(row.right));
  }
  leftW = Math.max(leftW, 10);
  rightW = Math.max(rightW, 10);
  const width = leftW + rightW + 7;
  const capped = Math.min(width, maxPanel);
  if (capped >= width) return { leftW, rightW, width };
  const shrink = width - capped;
  return { leftW, rightW: Math.max(10, rightW - shrink), width: leftW + Math.max(10, rightW - shrink) + 7 };
}

function layoutMetrics(terminalWidth: number, rows: Row[]): {
  panelW: number;
  leftW: number;
  rightW: number;
} {
  const termW = Math.max(terminalWidth, 52);
  const maxPanel = Math.min(96, termW - LEFT_MARGIN - 2);
  const { leftW, rightW, width } = panelWidthForRows(rows, maxPanel);
  return { panelW: width, leftW, rightW };
}

function renderPanelBox(terminalWidth: number, recentActivity: string[]): string {
  const termW = Math.max(terminalWidth, 52);
  const rows = buildRows(recentActivity);
  const stacked = termW < 80;
  const { panelW, leftW, rightW } = layoutMetrics(termW, rows);

  const panelLines: string[] = [];
  if (stacked) {
    const innerW = panelW - 4;
    panelLines.push(topBorder("Peffle", panelW));
    for (const row of rows) {
      if (row.left) panelLines.push(stackedRow(styleLeft(row.left), innerW));
      if (row.right) panelLines.push(stackedRow(styleRight(row.right), innerW));
    }
    panelLines.push(bottomBorder(panelW));
  } else {
    panelLines.push(topBorder("Peffle", panelW));
    for (const row of rows) {
      panelLines.push(bodyRow(styleLeft(row.left), styleRight(row.right), leftW, rightW));
    }
    panelLines.push(bottomBorder(panelW));
  }
  return panelLines.map(indent).join("\n");
}

export function renderStartupScreen(
  version: string,
  terminalWidth: number,
  recentActivity: string[]
): string {
  const tagline = primary("Control what your AI agents can do, spend, and execute.");
  const wordmark = renderPeffleWordmark(terminalWidth - LEFT_MARGIN).map(indent);
  return [
    indent(renderVersionLine(version)),
    "",
    ...wordmark,
    "",
    indent(tagline),
    "",
    renderPanelBox(terminalWidth, recentActivity),
  ].join("\n");
}

export function renderWelcomePanel(
  version: string,
  terminalWidth: number,
  recentActivity: string[]
): string {
  return renderStartupScreen(version, terminalWidth, recentActivity);
}

export function formatContextHint(terminalWidth: number): string {
  void terminalWidth;
  return indent(dim("Try /policy or ask Peffle in plain language."));
}

export function formatAIProviderHint(label: string | null | undefined): string {
  if (!label) return "";
  return indent(dim(`AI: ${label}`));
}

export function formatShortcutsHint(terminalWidth: number): string {
  void terminalWidth;
  return indent(dim("? for shortcuts"));
}

export function formatInputDivider(terminalWidth: number): string {
  const rows = buildRows(["No recent activity"]);
  const { panelW } = layoutMetrics(terminalWidth, rows);
  return indent(dim("─".repeat(panelW)));
}

export function horizontalRule(terminalWidth: number): string {
  return formatInputDivider(terminalWidth);
}

/** ANSI: clear visible screen and move cursor home (once at chat startup). */
export function writeTerminalClear(out: Pick<NodeJS.WriteStream, "write"> & { isTTY?: boolean }): void {
  if (out.isTTY) out.write("\x1b[2J\x1b[H");
}
