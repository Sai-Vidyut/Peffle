import chalk from "chalk";
import { colors } from "./theme.js";
import {
  formatContextHint,
  formatInputDivider,
  formatShortcutsHint,
  renderWelcomePanel,
} from "./welcome-panel.js";

export function visibleLength(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, "").length;
}

export function padVisible(text: string, width: number): string {
  const pad = Math.max(0, width - visibleLength(text));
  return text + " ".repeat(pad);
}

export function horizontalRule(terminalWidth: number): string {
  const w = Math.min(Math.max(terminalWidth, 48), 140);
  return chalk.hex(colors.dim)(`  ${"─".repeat(w - 2)}`);
}

export {
  renderWelcomePanel,
  formatContextHint,
  formatShortcutsHint,
  formatInputDivider,
};

export function renderBanner(
  version: string,
  terminalWidth: number,
  recentActivity: string[] = ["No recent activity"]
): string {
  return renderWelcomePanel(version, terminalWidth, recentActivity);
}

export function renderWelcomeFooter(_terminalWidth: number): string {
  return "";
}
