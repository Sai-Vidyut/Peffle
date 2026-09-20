import readline from "node:readline";
import { formatPromptPrefix } from "./present.js";

export interface ChatInputHandle {
  lines: AsyncIterable<string>;
  close: () => void;
}

/** Readline with history, SIGINT reprompt, `\` multiline continuation, and explicit close. */
export function createChatInput(): ChatInputHandle {
  const prompt = formatPromptPrefix();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt,
    historySize: 512,
    removeHistoryDuplicates: true,
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    rl.close();
  };

  rl.on("SIGINT", () => {
    rl.write("\n");
    if (!closed) rl.prompt();
  });

  const lines = (async function* () {
    let buffer = "";
    rl.prompt();
    try {
      for await (const line of rl) {
        if (line.endsWith("\\")) {
          buffer += `${line.slice(0, -1)}\n`;
          if (!closed) rl.prompt();
          continue;
        }
        const merged = (buffer + line).trim();
        buffer = "";
        if (merged) yield merged;
        if (!closed) rl.prompt();
      }
    } finally {
      close();
    }
  })();

  return { lines, close };
}

/** Test helper: in-memory input without readline. */
export function createStaticInput(values: string[]): ChatInputHandle {
  async function* gen() {
    for (const v of values) yield v;
  }
  return { lines: gen(), close: () => {} };
}
