export const GEMINI_OPENAI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";
export const GROQ_OPENAI_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export type PeffleAIProviderMode =
  | "none"
  | "off"
  | "openai"
  | "openai-compatible"
  | "gemini"
  | "groq"
  | "auto";

export function readGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function readGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

export function resolveProviderMode(): PeffleAIProviderMode | "unset" {
  const raw = (process.env.PEFFLE_AI_PROVIDER ?? "").trim().toLowerCase();
  if (!raw) return "unset";
  if (raw === "none" || raw === "off") return "none";
  if (
    raw === "openai" ||
    raw === "openai-compatible" ||
    raw === "gemini" ||
    raw === "groq" ||
    raw === "auto"
  ) {
    return raw;
  }
  return raw as PeffleAIProviderMode;
}

/** Startup label for the CLI (no secrets). */
export function describeAIProviderLabel(mode: PeffleAIProviderMode | "unset"): string | null {
  const gemini = readGeminiApiKey();
  const groq = readGroqApiKey();

  if (mode === "none" || mode === "off") return null;
  if (mode === "groq") return groq ? "Groq" : null;
  if (mode === "gemini") {
    if (!gemini) return null;
    return groq ? "Gemini → Groq" : "Gemini";
  }
  if (mode === "openai" || mode === "openai-compatible") return "OpenAI";

  if (mode === "auto" || mode === "unset") {
    if (gemini && groq) return "Gemini → Groq";
    if (gemini) return "Gemini";
    if (groq) return "Groq";
    return null;
  }

  return null;
}

export function effectiveProviderMode(): PeffleAIProviderMode | "unset" {
  const mode = resolveProviderMode();
  if (mode === "unset") {
    if (readGeminiApiKey() || readGroqApiKey()) return "auto";
    return "unset";
  }
  return mode;
}
