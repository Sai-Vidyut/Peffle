import { describe, expect, it } from "vitest";
import { parseModelPayload, ModelResponseError } from "../../src/ai/parse-model.js";

describe("parseModelPayload", () => {
  it("accepts plain text", () => {
    expect(parseModelPayload("Hello")).toEqual({ message: "Hello" });
  });

  it("parses message and toolCalls", () => {
    const r = parseModelPayload(
      JSON.stringify({
        message: "Checking policy",
        toolCalls: [{ name: "getPolicy", arguments: {} }],
      })
    );
    expect(r.toolCalls?.[0]?.name).toBe("getPolicy");
  });

  it("rejects invalid tool names", () => {
    expect(() =>
      parseModelPayload(JSON.stringify({ message: "x", toolCalls: [{ name: "rmRf", arguments: {} }] }))
    ).toThrow(ModelResponseError);
  });

  it("rejects malformed JSON object without message", () => {
    expect(() => parseModelPayload(JSON.stringify({ toolCalls: [] }))).toThrow(ModelResponseError);
  });
});
