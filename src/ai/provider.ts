import type { PeffleAIProvider } from "./types.js";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";
import { FallbackChainProvider } from "./providers/fallback-chain.js";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  GEMINI_OPENAI_BASE_URL,
  GROQ_OPENAI_BASE_URL,
  describeAIProviderLabel,
  effectiveProviderMode,
  readGeminiApiKey,
  readGroqApiKey,
  resolveProviderMode,
  type PeffleAIProviderMode,
} from "./provider-env.js";

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export { AllProvidersFailedError } from "./providers/fallback-chain.js";

function createGeminiProvider(): OpenAICompatibleProvider {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    throw new ProviderUnavailableError("GEMINI_API_KEY is required when PEFFLE_AI_PROVIDER=gemini");
  }
  const model = process.env.PEFFLE_AI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return new OpenAICompatibleProvider({
    apiKey,
    model,
    baseUrl: GEMINI_OPENAI_BASE_URL,
    providerId: "gemini",
  });
}

function createGroqProvider(): OpenAICompatibleProvider {
  const apiKey = readGroqApiKey();
  if (!apiKey) {
    throw new ProviderUnavailableError("GROQ_API_KEY is required when PEFFLE_AI_PROVIDER=groq");
  }
  const model = process.env.PEFFLE_GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  return new OpenAICompatibleProvider({
    apiKey,
    model,
    baseUrl: GROQ_OPENAI_BASE_URL,
    providerId: "groq",
  });
}

function createOpenAiCompatibleFromEnv(): OpenAICompatibleProvider {
  const apiKey = process.env.PEFFLE_AI_API_KEY?.trim();
  const model = process.env.PEFFLE_AI_MODEL?.trim() || "gpt-4o-mini";
  if (!apiKey) {
    throw new ProviderUnavailableError(
      "PEFFLE_AI_API_KEY is required when PEFFLE_AI_PROVIDER is openai"
    );
  }
  return new OpenAICompatibleProvider({
    apiKey,
    model,
    baseUrl: process.env.PEFFLE_AI_BASE_URL,
    providerId: "openai-compatible",
  });
}

function buildAutoProvider(): PeffleAIProvider | null {
  const geminiKey = readGeminiApiKey();
  const groqKey = readGroqApiKey();
  if (!geminiKey && !groqKey) return null;

  const primary = geminiKey
    ? new OpenAICompatibleProvider({
        apiKey: geminiKey,
        model: process.env.PEFFLE_AI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
        baseUrl: GEMINI_OPENAI_BASE_URL,
        providerId: "gemini",
      })
    : createGroqProvider();

  const secondary =
    geminiKey && groqKey
      ? new OpenAICompatibleProvider({
          apiKey: groqKey,
          model: process.env.PEFFLE_GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
          baseUrl: GROQ_OPENAI_BASE_URL,
          providerId: "groq",
        })
      : null;

  if (secondary) {
    return new FallbackChainProvider(primary, secondary, undefined, "auto");
  }
  return primary;
}

export function getAIProviderStartupLabel(): string | null {
  const mode = effectiveProviderMode();
  if (mode === "unset") return null;
  return describeAIProviderLabel(mode as PeffleAIProviderMode | "unset");
}

export function createPeffleAIProviderFromEnv(): PeffleAIProvider | null {
  const explicit = resolveProviderMode();
  const mode = explicit === "unset" ? effectiveProviderMode() : explicit;

  if (mode === "unset" || mode === "none" || mode === "off") return null;

  if (mode === "openai" || mode === "openai-compatible") {
    return createOpenAiCompatibleFromEnv();
  }

  if (mode === "groq") {
    return createGroqProvider();
  }

  if (mode === "gemini") {
    const gemini = createGeminiProvider();
    const groqKey = readGroqApiKey();
    if (!groqKey) return gemini;
    const groq = new OpenAICompatibleProvider({
      apiKey: groqKey,
      model: process.env.PEFFLE_GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
      baseUrl: GROQ_OPENAI_BASE_URL,
      providerId: "groq",
    });
    return new FallbackChainProvider(gemini, groq, undefined, "gemini");
  }

  if (mode === "auto") {
    return buildAutoProvider();
  }

  throw new ProviderUnavailableError(`Unknown PEFFLE_AI_PROVIDER: ${String(mode)}`);
}

export type { PeffleAIProvider } from "./types.js";
