import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadPeffleEnvFiles } from "../../src/cli/load-env.js";
import { createPeffleAIProviderFromEnv } from "../../src/ai/provider.js";

describe("loadPeffleEnvFiles", () => {
  let dir: string;
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "peffle-load-env-"));
    for (const k of ["PEFFLE_AI_PROVIDER", "GEMINI_API_KEY", "GROQ_API_KEY"]) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ["PEFFLE_AI_PROVIDER", "GEMINI_API_KEY", "GROQ_API_KEY"]) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    rmSync(dir, { recursive: true, force: true });
  });

  it("loads keys from .env for auto provider", () => {
    writeFileSync(
      join(dir, ".env"),
      "PEFFLE_AI_PROVIDER=auto\nGEMINI_API_KEY=g-test\nGROQ_API_KEY=gsk-test\n"
    );
    loadPeffleEnvFiles(dir);
    expect(process.env.GEMINI_API_KEY).toBe("g-test");
    expect(createPeffleAIProviderFromEnv()?.id).toBe("auto");
  });

  it("does not override existing process.env", () => {
    process.env.GEMINI_API_KEY = "from-shell";
    writeFileSync(join(dir, ".env"), "GEMINI_API_KEY=from-file\n");
    loadPeffleEnvFiles(dir);
    expect(process.env.GEMINI_API_KEY).toBe("from-shell");
  });
});
