import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadPeffleEnvFiles,
  parseEnvFileContent,
  resolvePeffleUserConfigDir,
  resolvePeffleUserEnvFilePath,
} from "../../src/cli/load-env.js";
import { createPeffleAIProviderFromEnv } from "../../src/ai/provider.js";
import { FallbackChainProvider } from "../../src/ai/providers/fallback-chain.js";
import { handleNaturalLanguage } from "../../src/chat/nl-fallback.js";
import { ChatSession } from "../../src/chat/session.js";

const ENV_KEYS = [
  "PEFFLE_AI_PROVIDER",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "PEFFLE_CONFIG_DIR",
  "XDG_CONFIG_HOME",
] as const;

function saveEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) snap[k] = process.env[k];
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe("loadPeffleEnvFiles", () => {
  let snap: Record<string, string | undefined>;
  let projectDir: string;
  let userConfigDir: string;

  beforeEach(() => {
    snap = saveEnv();
    for (const k of ENV_KEYS) delete process.env[k];
    projectDir = mkdtempSync(join(tmpdir(), "peffle-proj-"));
    userConfigDir = mkdtempSync(join(tmpdir(), "peffle-usercfg-"));
    process.env.PEFFLE_CONFIG_DIR = userConfigDir;
  });

  afterEach(() => {
    restoreEnv(snap);
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(userConfigDir, { recursive: true, force: true });
  });

  function writeUserEnv(content: string): void {
    writeFileSync(join(userConfigDir, ".env"), content);
  }

  it("no configuration leaves provider null for auto mode", () => {
    process.env.PEFFLE_AI_PROVIDER = "auto";
    loadPeffleEnvFiles(projectDir);
    expect(createPeffleAIProviderFromEnv()).toBeNull();
  });

  it("loads user-level Peffle configuration from any cwd", () => {
    writeUserEnv("PEFFLE_AI_PROVIDER=auto\nGEMINI_API_KEY=u-gemini\nGROQ_API_KEY=u-groq\n");
    loadPeffleEnvFiles(projectDir);
    expect(process.env.GEMINI_API_KEY).toBe("u-gemini");
    expect(createPeffleAIProviderFromEnv()?.id).toBe("auto");
  });

  it("project .env overrides user config", () => {
    writeUserEnv("GEMINI_API_KEY=user-key\nGROQ_API_KEY=user-groq\n");
    writeFileSync(join(projectDir, ".env"), "GEMINI_API_KEY=project-key\n");
    loadPeffleEnvFiles(projectDir);
    expect(process.env.GEMINI_API_KEY).toBe("project-key");
  });

  it("project .env.local overrides project .env", () => {
    writeUserEnv("GEMINI_API_KEY=user-key\n");
    writeFileSync(join(projectDir, ".env"), "GEMINI_API_KEY=project-key\n");
    writeFileSync(join(projectDir, ".env.local"), "GEMINI_API_KEY=local-key\n");
    loadPeffleEnvFiles(projectDir);
    expect(process.env.GEMINI_API_KEY).toBe("local-key");
  });

  it("explicit process.env beats all files", () => {
    process.env.GEMINI_API_KEY = "shell-key";
    writeUserEnv("GEMINI_API_KEY=user-key\n");
    writeFileSync(join(projectDir, ".env"), "GEMINI_API_KEY=project-key\n");
    loadPeffleEnvFiles(projectDir);
    expect(process.env.GEMINI_API_KEY).toBe("shell-key");
  });

  it("gemini-only from user config", () => {
    writeUserEnv("PEFFLE_AI_PROVIDER=gemini\nGEMINI_API_KEY=g-only\n");
    loadPeffleEnvFiles(projectDir);
    expect(createPeffleAIProviderFromEnv()?.id).toBe("gemini");
  });

  it("groq-only from user config", () => {
    writeUserEnv("PEFFLE_AI_PROVIDER=groq\nGROQ_API_KEY=gsk-only\n");
    loadPeffleEnvFiles(projectDir);
    expect(createPeffleAIProviderFromEnv()?.id).toBe("groq");
  });

  it("PEFFLE_AI_PROVIDER=none yields null provider", () => {
    writeUserEnv("PEFFLE_AI_PROVIDER=none\nGEMINI_API_KEY=x\n");
    loadPeffleEnvFiles(projectDir);
    expect(createPeffleAIProviderFromEnv()).toBeNull();
  });

  it("resolvePeffleUserEnvFilePath uses PEFFLE_CONFIG_DIR", () => {
    expect(resolvePeffleUserConfigDir()).toBe(userConfigDir);
    expect(resolvePeffleUserEnvFilePath()).toBe(join(userConfigDir, ".env"));
  });

  it("invalid gemini path falls back to groq when keys loaded from user config", async () => {
    writeUserEnv(
      "PEFFLE_AI_PROVIDER=auto\nGEMINI_API_KEY=g-test\nGROQ_API_KEY=gsk-test\n"
    );
    loadPeffleEnvFiles(projectDir);
    const chain = new FallbackChainProvider(
      {
        id: "gemini",
        chat: async () => {
          throw new Error("HTTP 503");
        },
      },
      {
        id: "groq",
        chat: async () => ({ message: "groq ok" }),
      }
    );
    const r = await chain.chat("hi", {} as never);
    expect(r.message).toBe("groq ok");
  });

  it("missing credentials message never echoes env key values", async () => {
    process.env.GEMINI_API_KEY = "super-secret-gemini";
    const session = new ChatSession();
    try {
      const lines = await handleNaturalLanguage(session, "hello world unique", null);
      const blob = lines.join("\n");
      expect(blob).not.toContain("super-secret-gemini");
      expect(blob).toContain("~/.config/peffle/.env");
    } finally {
      session.close();
    }
  });
});

describe("parseEnvFileContent", () => {
  it("ignores comments and blank lines", () => {
    expect(parseEnvFileContent("# comment\n\nFOO=bar\n")).toEqual({ FOO: "bar" });
  });
});
