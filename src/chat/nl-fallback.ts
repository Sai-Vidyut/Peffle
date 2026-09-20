import type { PeffleAIProvider } from "../ai/types.js";
import { AllProvidersFailedError } from "../ai/provider.js";
import { FallbackChainProvider } from "../ai/providers/fallback-chain.js";
import { buildPeffleContext } from "../ai/context.js";
import { executeToolCall } from "../ai/tools.js";
import type { ChatSession } from "./session.js";
import { handleSlashCommand, handleConfirmation } from "./commands.js";

export function deterministicNlFallbackLines(): string[] {
  return [
    "AI providers are unavailable. Slash commands and simple offline phrases still work.",
    "Try /help, /policy, or set GEMINI_API_KEY / GROQ_API_KEY for natural language.",
  ];
}

export function tryNaturalLanguageRoute(
  session: ChatSession,
  input: string
): { handled: boolean; lines: string[] } {
  const q = input.trim().toLowerCase();

  if (/pending|waiting for approval|approvals/.test(q)) {
    const r = executeToolCall(session, { name: "listPendingApprovals", arguments: {} });
    return { handled: true, lines: [r.message] };
  }
  if (/^(show|what is).*(policy|rules)/.test(q) || q === "show policy") {
    const r = executeToolCall(session, { name: "getPolicy", arguments: {} });
    return { handled: true, lines: [r.message] };
  }
  if (/ledger|audit|log/.test(q) && !/blog/.test(q)) {
    const r = executeToolCall(session, { name: "getLedger", arguments: { limit: 20 } });
    return { handled: true, lines: [r.message] };
  }
  const killMatch = q.match(/kill\s+(?:my\s+)?(?:agent\s+)?([a-z0-9_-]+)/);
  if (killMatch) {
    const r = executeToolCall(session, {
      name: "killAgent",
      arguments: { agentId: killMatch[1]! },
    });
    return { handled: true, lines: [r.message] };
  }
  const approveMatch = q.match(/approve\s+([a-z0-9_-]+)/i);
  if (approveMatch) {
    const r = executeToolCall(session, {
      name: "approveAction",
      arguments: { eventId: approveMatch[1]! },
    });
    return { handled: true, lines: [r.message] };
  }

  return { handled: false, lines: [] };
}

export async function handleNaturalLanguage(
  session: ChatSession,
  input: string,
  provider: PeffleAIProvider | null
): Promise<string[]> {
  const local = tryNaturalLanguageRoute(session, input);
  if (local.handled) return local.lines;

  if (!provider) {
    return [
      "No AI provider configured. Use slash commands (/help) or set PEFFLE_AI_PROVIDER.",
      "Set GEMINI_API_KEY / GROQ_API_KEY in the environment or in .env (current directory).",
    ];
  }

  const ctx = buildPeffleContext(
    session.peffle,
    session.policyPath,
    session.storagePath,
    session.getPolicy()
  );

  let response;
  try {
    response = await provider.chat(input, ctx);
  } catch (e) {
    if (e instanceof AllProvidersFailedError) {
      const lines = [...e.notices];
      lines.push(...deterministicNlFallbackLines());
      return lines;
    }
    throw e;
  }
  const lines: string[] = [];
  if (provider instanceof FallbackChainProvider) {
    lines.push(...provider.drainNotices());
  }
  if (response.message) lines.push(response.message);

  if (response.toolCalls?.length) {
    for (const call of response.toolCalls) {
      if (call.name === "applyPolicy") {
        lines.push("Policy apply requires explicit confirmation — reply [y] after reviewing the proposal.");
        continue;
      }
      const result = executeToolCall(session, call);
      lines.push(result.message);
    }
  }
  return lines;
}
