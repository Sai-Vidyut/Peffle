import chalk from "chalk";
import type { PeffleAIProvider } from "../ai/types.js";
import { ProviderUnavailableError } from "../ai/provider.js";
import { ChatSession, readPackageVersion, renderBanner } from "./session.js";
import {
  formatContextHint,
  formatAIProviderHint,
  formatInputDivider,
  formatShortcutsHint,
  writeTerminalClear,
} from "./welcome-panel.js";
import { handleSlashCommand, handleConfirmation } from "./commands.js";
import { handleNaturalLanguage } from "./nl-fallback.js";
import { createChatInput, type ChatInputHandle } from "./input.js";
import {
  clearStatusLine,
  formatAssistantOutputCombined,
  formatConversationOutputCombined,
  formatPromptPrefix,
  formatStatus,
  pickStatusForInput,
} from "./present.js";
import { colors } from "./theme.js";

export interface ChatRunOptions {
  storagePath?: string;
  policyPath?: string;
  provider?: PeffleAIProvider | null;
  skipBanner?: boolean;
  input?: AsyncIterable<string>;
  output?: Pick<NodeJS.WriteStream, "write">;
}

export interface ChatRunResult {
  lines: string[];
  exitCode: number;
}

function termWidth(): number {
  const env = process.env.COLUMNS;
  if (env && /^\d+$/.test(env)) return Number(env);
  return process.stdout.columns || 80;
}

function recentActivityLines(session: ChatSession): string[] {
  try {
    const events = session.peffle.query({ limit: 2 });
    if (events.length === 0) return ["No recent activity"];
    return events.map((e) => {
      const amt = e.amount != null ? ` · $${e.amount}` : "";
      return `${e.agent.agentId} · ${e.action} · ${e.status}${amt}`;
    });
  } catch {
    return ["No recent activity"];
  }
}

export async function runPeffleChat(opts: ChatRunOptions = {}): Promise<ChatRunResult> {
  const out = opts.output ?? process.stdout;
  const lines: string[] = [];
  const write = (s: string) => {
    lines.push(s);
    out.write(s + (s.endsWith("\n") ? "" : "\n"));
  };

  if (!opts.skipBanner && out === process.stdout) {
    writeTerminalClear(out);
  }

  let inputHandle: ChatInputHandle | null = null;
  const stopInput = () => {
    inputHandle?.close();
    inputHandle = null;
  };

  let provider = opts.provider;
  let aiLabel: string | null = null;
  if (provider === undefined) {
    try {
      const { createPeffleAIProviderFromEnv, getAIProviderStartupLabel } = await import("../ai/provider.js");
      provider = createPeffleAIProviderFromEnv();
      aiLabel = getAIProviderStartupLabel();
    } catch (e) {
      if (e instanceof ProviderUnavailableError) {
        write(chalk.hex(colors.red)(`  ${e.message}`));
        write(chalk.hex(colors.dim)("  Slash commands work offline. Set PEFFLE_AI_PROVIDER for natural language."));
        provider = null;
      } else {
        throw e;
      }
    }
  }

  const session = new ChatSession({
    storagePath: opts.storagePath,
    policyPath: opts.policyPath,
  });

  const finish = (exitCode: number): ChatRunResult => {
    stopInput();
    return { lines, exitCode };
  };

  try {
    const w = termWidth();
    if (!opts.skipBanner) {
      write(renderBanner(readPackageVersion(), w, recentActivityLines(session)));
      write(formatContextHint(w));
      const providerHint = formatAIProviderHint(aiLabel);
      if (providerHint) write(providerHint);
      write(formatInputDivider(w));
      write(formatShortcutsHint(w));
    }

    const inputIterable =
      opts.input ??
      (() => {
        inputHandle = createChatInput();
        return inputHandle.lines;
      })();

    for await (const raw of inputIterable) {
      const line = raw.trim();
      if (!line) continue;

      if (line === "?" || line === "/?") {
        const help = handleSlashCommand(session, "/help");
        if (help?.lines.some(Boolean)) write(formatAssistantOutputCombined(help.lines, w));
        continue;
      }

      if (line === "/exit" || line === "/quit") {
        write("");
        write(chalk.hex(colors.dim)("  Goodbye."));
        return finish(0);
      }

      const confirm = handleConfirmation(session, line);
      if (confirm) {
        if (confirm.clear) write("\u001bc");
        if (confirm.lines.some(Boolean)) {
          write(formatAssistantOutputCombined(confirm.lines, termWidth()));
        }
        if (confirm.exit) {
          write(chalk.hex(colors.dim)("  Goodbye."));
          return finish(0);
        }
        continue;
      }

      const slash = handleSlashCommand(session, line);
      if (slash) {
        if (slash.clear) write("\u001bc");
        if (slash.lines.some(Boolean)) {
          write(formatAssistantOutputCombined(slash.lines, termWidth()));
        }
        if (slash.exit) {
          if (!slash.lines.some((l) => l.includes("Goodbye"))) {
            write(chalk.hex(colors.dim)("  Goodbye."));
          }
          return finish(0);
        }
        continue;
      }

      const statusLine = formatStatus(pickStatusForInput(line));
      write(statusLine);
      try {
        const responses = await handleNaturalLanguage(session, line, provider);
        clearStatusLine(out, lines, statusLine);
        if (responses.length) {
          write(formatConversationOutputCombined(responses, termWidth()));
        }
      } catch (e) {
        clearStatusLine(out, lines, statusLine);
        write(
          formatConversationOutputCombined(
            [`Couldn't reach the AI provider: ${(e as Error).message}`, "Try /help or a slash command."],
            termWidth()
          )
        );
      }
      write("");
    }

    return finish(0);
  } finally {
    stopInput();
    session.close();
  }
}

export { formatPromptPrefix };
