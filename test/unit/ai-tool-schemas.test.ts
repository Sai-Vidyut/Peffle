import { describe, expect, it } from "vitest";
import { parseToolArguments, ToolArgumentError, isPeffleToolName } from "../../src/ai/tool-schemas.js";

describe("tool schemas", () => {
  it("validates getPolicy empty args", () => {
    expect(parseToolArguments("getPolicy", {})).toEqual({});
  });

  it("rejects invalid proposePolicyChange", () => {
    expect(() => parseToolArguments("proposePolicyChange", { summary: "x" })).toThrow(
      ToolArgumentError
    );
  });

  it("rejects applyPolicy without confirm true", () => {
    expect(() => parseToolArguments("applyPolicy", { confirm: false })).toThrow(
      ToolArgumentError
    );
  });

  it("isPeffleToolName guards unknown tools", () => {
    expect(isPeffleToolName("getPolicy")).toBe(true);
    expect(isPeffleToolName("shell_exec")).toBe(false);
  });
});
