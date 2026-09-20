import type { PeffleAIProvider, PeffleAIResponse, PeffleContext } from "../types.js";
import { parseModelPayload } from "../parse-model.js";

/** Deterministic provider for tests and offline NL routing. */
export class MockPeffleAIProvider implements PeffleAIProvider {
  readonly id = "mock";

  constructor(private readonly handler: (input: string, ctx: PeffleContext) => PeffleAIResponse) {}

  async chat(input: string, context: PeffleContext): Promise<PeffleAIResponse> {
    return this.handler(input, context);
  }
}

export function createMockProvider(
  handler: (input: string, ctx: PeffleContext) => PeffleAIResponse
): PeffleAIProvider {
  return new MockPeffleAIProvider(handler);
}

export function jsonProviderResponse(payload: unknown): PeffleAIProvider {
  return createMockProvider(() => parseModelPayload(JSON.stringify(payload)));
}
