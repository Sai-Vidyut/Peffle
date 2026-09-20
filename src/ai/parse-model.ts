import type { PeffleAIResponse, PeffleToolCall } from "./types.js";
import { isPeffleToolName } from "./tool-schemas.js";

export class ModelResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelResponseError";
  }
}

export function parseModelPayload(text: string): PeffleAIResponse {
  const trimmed = text.trim();
  if (!trimmed) throw new ModelResponseError("Empty model response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { message: trimmed };
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new ModelResponseError("Model response must be JSON object or plain text");
  }

  const obj = parsed as Record<string, unknown>;
  const message =
    typeof obj.message === "string" ? obj.message : typeof obj.content === "string" ? obj.content : "";

  const rawCalls = obj.toolCalls ?? obj.tools;
  if (rawCalls === undefined) {
    if (!message) throw new ModelResponseError("Missing message in JSON response");
    return { message };
  }

  if (!Array.isArray(rawCalls)) {
    throw new ModelResponseError("toolCalls must be an array");
  }

  if (!message && rawCalls.length === 0) {
    throw new ModelResponseError("Missing message in JSON response");
  }

  const toolCalls: PeffleToolCall[] = [];
  for (const item of rawCalls) {
    if (typeof item !== "object" || item === null) {
      throw new ModelResponseError("Invalid tool call entry");
    }
    const row = item as Record<string, unknown>;
    const name = row.name;
    if (typeof name !== "string" || !isPeffleToolName(name)) {
      throw new ModelResponseError(`Invalid or unsupported tool name: ${String(name)}`);
    }
    const args =
      row.arguments && typeof row.arguments === "object" && row.arguments !== null
        ? (row.arguments as Record<string, unknown>)
        : {};
    toolCalls.push({ name, arguments: args });
  }

  return { message: message || "OK.", toolCalls };
}
