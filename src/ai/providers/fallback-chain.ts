import type { PeffleAIProvider, PeffleAIResponse, PeffleContext } from "../types.js";
import { ModelResponseError } from "../parse-model.js";

export class AllProvidersFailedError extends Error {
  readonly notices: readonly string[];

  constructor(message: string, notices: readonly string[] = []) {
    super(message);
    this.name = "AllProvidersFailedError";
    this.notices = notices;
  }
}

export type ProviderNoticeHandler = (message: string) => void;

function shouldFallback(error: unknown): boolean {
  return !(error instanceof ModelResponseError);
}

export class FallbackChainProvider implements PeffleAIProvider {
  readonly id: string;
  private pendingNotices: string[] = [];

  constructor(
    private readonly primary: PeffleAIProvider,
    private readonly secondary: PeffleAIProvider | null,
    private readonly onNotice?: ProviderNoticeHandler,
    id?: string
  ) {
    this.id = id ?? primary.id;
  }

  drainNotices(): string[] {
    const n = this.pendingNotices;
    this.pendingNotices = [];
    return n;
  }

  async chat(input: string, context: PeffleContext): Promise<PeffleAIResponse> {
    this.pendingNotices = [];
    const notices: string[] = [];
    const notice = (message: string) => {
      notices.push(message);
      this.pendingNotices.push(message);
      this.onNotice?.(message);
    };

    try {
      return await this.primary.chat(input, context);
    } catch (primaryError) {
      if (!shouldFallback(primaryError)) throw primaryError;
      if (!this.secondary) {
        throw new AllProvidersFailedError(
          primaryError instanceof Error ? primaryError.message : "Primary provider failed",
          notices
        );
      }
      notice(`${formatProviderName(this.primary.id)} unavailable · trying ${formatProviderName(this.secondary.id)}`);
      try {
        return await this.secondary.chat(input, context);
      } catch (secondaryError) {
        if (!shouldFallback(secondaryError)) throw secondaryError;
        throw new AllProvidersFailedError(
          secondaryError instanceof Error ? secondaryError.message : "Fallback provider failed",
          notices
        );
      }
    }
  }
}

function formatProviderName(id: string): string {
  if (id === "gemini") return "Gemini";
  if (id === "groq") return "Groq";
  if (id === "openai-compatible") return "OpenAI";
  return id;
}
