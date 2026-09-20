import type { PeffleAIProvider } from "./types.js";
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export function createPeffleAIProviderFromEnv(): PeffleAIProvider | null {
  const id = (process.env.PEFFLE_AI_PROVIDER ?? "").trim().toLowerCase();
  if (!id || id === "none" || id === "off") return null;

  if (id === "openai" || id === "openai-compatible") {
    const apiKey = process.env.PEFFLE_AI_API_KEY?.trim();
    const model = process.env.PEFFLE_AI_MODEL?.trim() || "gpt-4o-mini";
    if (!apiKey) {
      throw new ProviderUnavailableError(
        "PEFFLE_AI_API_KEY is required when PEFFLE_AI_PROVIDER is set"
      );
    }
    return new OpenAICompatibleProvider({
      apiKey,
      model,
      baseUrl: process.env.PEFFLE_AI_BASE_URL,
    });
  }

  throw new ProviderUnavailableError(`Unknown PEFFLE_AI_PROVIDER: ${id}`);
}

export type { PeffleAIProvider } from "./types.js";
