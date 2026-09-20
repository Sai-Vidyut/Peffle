import type { PeffleAIProvider, PeffleAIResponse, PeffleContext } from "../types.js";
import { PEFFLE_SYSTEM_PROMPT } from "../prompts.js";
import { contextForPrompt } from "../context.js";
import { parseModelPayload } from "../parse-model.js";
import { PEFFLE_TOOL_NAMES } from "../tool-schemas.js";

export interface OpenAICompatibleConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class OpenAICompatibleProvider implements PeffleAIProvider {
  readonly id = "openai-compatible";

  constructor(private readonly config: OpenAICompatibleConfig) {}

  async chat(input: string, context: PeffleContext): Promise<PeffleAIResponse> {
    const base = this.config.baseUrl?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
    const url = `${base}/chat/completions`;
    const toolDoc = PEFFLE_TOOL_NAMES.map((n) => `- ${n}`).join("\n");

    const body = {
      model: this.config.model,
      temperature: 0.2,
      response_format: { type: "json_object" as const },
      messages: [
        {
          role: "system",
          content: `${PEFFLE_SYSTEM_PROMPT}\n\nTools:\n${toolDoc}\n\nRespond with JSON: { "message": string, "toolCalls"?: [{ "name": string, "arguments": object }] }\n\nContext:\n${contextForPrompt(context)}`,
        },
        { role: "user", content: input },
      ],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI provider HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned empty content");
    return parseModelPayload(content);
  }
}
