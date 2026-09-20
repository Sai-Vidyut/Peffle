import chalk from "chalk";
import { colors } from "./theme.js";

/** Compact block “PEFFLE” (terminal-safe ASCII). */
const PEFFLE_LINES = [
  "██████╗ ███████╗███████╗███████╗██╗     ███████╗",
  "██╔══██╗██╔════╝██╔════╝██╔════╝██║     ██╔════╝",
  "██████╔╝█████╗  █████╗  █████╗  ██║     █████╗  ",
  "██╔═══╝ ██╔══╝  ██╔══╝  ██╔══╝  ██║     ██╔══╝  ",
  "██║     ███████╗██║     ██║     ███████╗███████╗",
  "╚═╝     ╚══════╝╚═╝     ╚═╝     ╚══════╝╚══════╝",
];

/** Narrower fallback if terminal is tight (plain bold text). */
const PEFFLE_FALLBACK = "PEFFLE";

export function renderPeffleWordmark(maxWidth: number): string[] {
  const accent = chalk.hex(colors.accent);
  const green = chalk.hex(colors.green);
  const widest = Math.max(...PEFFLE_LINES.map((l) => l.length));
  if (maxWidth >= widest + 4) {
    return PEFFLE_LINES.map((line, i) =>
      i % 2 === 0 ? accent(line) : green(line)
    );
  }
  return [accent.bold(PEFFLE_FALLBACK)];
}

export function renderVersionLine(version: string): string {
  const accent = chalk.hex(colors.accent);
  const dim = chalk.hex(colors.dim);
  return `${accent.bold("Peffle")}${dim(` v${version}`)}`;
}
