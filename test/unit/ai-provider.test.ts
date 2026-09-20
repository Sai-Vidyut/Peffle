import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createPeffleAIProviderFromEnv,
  getAIProviderStartupLabel,
  ProviderUnavailableError,
} from "../../src/ai/provider.js";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  GEMINI_OPENAI_BASE_URL,
  GROQ_OPENAI_BASE_URL,
  describeAIProviderLabel,
} from "../../src/ai/provider-env.js";
import { OpenAICompatibleProvider } from "../../src/ai/providers/openai-compatible.js";
import { FallbackChainProvider, AllProvidersFailedError } from "../../src/ai/providers/fallback-chain.js";
import { executeToolCall } from "../../src/ai/tools.js";
import { parseModelPayload, ModelResponseError } from "../../src/ai/parse-model.js";
import type { PeffleContext } from "../../src/ai/types.js";
import { handleNaturalLanguage } from "../../src/chat/nl-fallback.js";
import { ChatSession } from "../../src/chat/session.js";

function providerWithId(
  id: string,
  handler: (input: string, ctx: ReturnType<typeof minimalContext>) => { message: string }
): import("../../src/ai/types.js").PeffleAIProvider {
  return {
    id,
    chat: async (input, ctx) => handler(input, ctx as never),
  };
}

const ENV_KEYS = [
  "PEFFLE_AI_PROVIDER",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "PEFFLE_AI_MODEL",
  "PEFFLE_GROQ_MODEL",
  "PEFFLE_AI_API_KEY",
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

function okCompletion(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
    text: async () => "",
  };
}

describe("AI provider env", () => {
  let snap: Record<string, string | undefined>;

  beforeEach(() => {
    snap = saveEnv();
    for (const k of ENV_KEYS) delete process.env[k];
  });

  afterEach(() => {
    restoreEnv(snap);
    vi.unstubAllGlobals();
  });

  it("configures Gemini provider id from env", () => {
    process.env.PEFFLE_AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "g-test";
    const p = createPeffleAIProviderFromEnv();
    expect(p!.id).toBe("gemini");
  });

  it("Gemini provider uses expected base URL and default model", async () => {
    process.env.GEMINI_API_KEY = "g-test";
    const fetchMock = vi.fn().mockResolvedValue(
      okCompletion(JSON.stringify({ message: "hi", toolCalls: [] }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const p = new OpenAICompatibleProvider({
      apiKey: "g-test",
      model: DEFAULT_GEMINI_MODEL,
      baseUrl: GEMINI_OPENAI_BASE_URL,
      providerId: "gemini",
    });
    await p.chat("hello", minimalContext());
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toBe(`${GEMINI_OPENAI_BASE_URL}/chat/completions`);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.model).toBe(DEFAULT_GEMINI_MODEL);
  });

  it("Gemini failure falls back to Groq", async () => {
    const primary = providerWithId("gemini", () => {
      throw new Error("HTTP 503");
    });
    const secondary = providerWithId("groq", () => ({ message: "from groq" }));
    const notices: string[] = [];
    const chain = new FallbackChainProvider(primary, secondary, (m) => notices.push(m), "auto");
    const r = await chain.chat("x", minimalContext());
    expect(r.message).toBe("from groq");
    expect(notices).toEqual(["Gemini unavailable · trying Groq"]);
  });

  it("Gemini + Groq failure yields AllProvidersFailedError", async () => {
    const primary = providerWithId("gemini", () => {
      throw new Error("network");
    });
    const secondary = providerWithId("groq", () => {
      throw new Error("rate limit");
    });
    const chain = new FallbackChainProvider(primary, secondary);
    await expect(chain.chat("x", minimalContext())).rejects.toBeInstanceOf(AllProvidersFailedError);
  });

  it("handleNaturalLanguage uses deterministic fallback when all providers fail", async () => {
    const session = makeSession();
    try {
      const chain = new FallbackChainProvider(
        providerWithId("gemini", () => {
          throw new Error("down");
        }),
        null
      );
      const lines = await handleNaturalLanguage(session, "something obscure xyz", chain);
      expect(lines).toEqual(
        expect.arrayContaining([
          "AI providers are unavailable. Slash commands and simple offline phrases still work.",
        ])
      );
    } finally {
      session.close();
    }
  });

  it("Gemini request success returns parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okCompletion(
        JSON.stringify({
          message: "Checking",
          toolCalls: [{ name: "getPolicy", arguments: {} }],
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const p = new OpenAICompatibleProvider({
      apiKey: "g-test",
      model: DEFAULT_GEMINI_MODEL,
      baseUrl: GEMINI_OPENAI_BASE_URL,
      providerId: "gemini",
    });
    const r = await p.chat("show policy", minimalContext());
    expect(r.message).toBe("Checking");
    expect(r.toolCalls?.[0]?.name).toBe("getPolicy");
  });

  it("Groq-only configuration", () => {
    process.env.PEFFLE_AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "gsk_test";
    const p = createPeffleAIProviderFromEnv() as OpenAICompatibleProvider;
    expect(p.id).toBe("groq");
    expect(getAIProviderStartupLabel()).toBe("Groq");
  });

  it("no API keys → null provider and no startup label", () => {
    expect(createPeffleAIProviderFromEnv()).toBeNull();
    expect(getAIProviderStartupLabel()).toBeNull();
  });

  it("auto default when Gemini key present", () => {
    process.env.GEMINI_API_KEY = "g-test";
    const p = createPeffleAIProviderFromEnv();
    expect(p).not.toBeNull();
    expect(p!.id).toBe("gemini");
    expect(describeAIProviderLabel("auto")).toBe("Gemini");
  });

  it("auto with both keys shows Gemini → Groq label", () => {
    process.env.GEMINI_API_KEY = "g";
    process.env.GROQ_API_KEY = "q";
    expect(getAIProviderStartupLabel()).toBe("Gemini → Groq");
    const p = createPeffleAIProviderFromEnv();
    expect(p!.id).toBe("auto");
  });

  it("provider errors do not mutate Peffle policy state", async () => {
    const session = makeSession();
    const before = JSON.stringify(session.getPolicy());
    try {
      const chain = new FallbackChainProvider(
        providerWithId("gemini", () => {
          throw new Error("provider down");
        }),
        null
      );
      await handleNaturalLanguage(session, "no local route match qwerty", chain);
      expect(JSON.stringify(session.getPolicy())).toBe(before);
    } finally {
      session.close();
    }
  });

  it("malformed model output does not trigger Groq fallback", async () => {
    const primary = providerWithId("gemini", () => {
      throw new ModelResponseError("Invalid tool");
    });
    const secondary = providerWithId("groq", () => ({ message: "should not run" }));
    const chain = new FallbackChainProvider(primary, secondary);
    await expect(chain.chat("x", minimalContext())).rejects.toBeInstanceOf(ModelResponseError);
  });

  it("Gemini HTTP success parses through tool validation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okCompletion(
        JSON.stringify({
          message: "nope",
          toolCalls: [{ name: "deleteEverything", arguments: {} }],
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const p = new OpenAICompatibleProvider({
      apiKey: "k",
      model: DEFAULT_GEMINI_MODEL,
      baseUrl: GEMINI_OPENAI_BASE_URL,
      providerId: "gemini",
    });
    await expect(p.chat("x", minimalContext())).rejects.toBeInstanceOf(ModelResponseError);
  });

  it("AI cannot execute non-allowlisted tools via parseModelPayload", () => {
    expect(() =>
      parseModelPayload(JSON.stringify({ message: "x", toolCalls: [{ name: "rmRf", arguments: {} }] }))
    ).toThrow(ModelResponseError);
  });

  it("policy enforcement remains deterministic via tool layer", () => {
    const session = makeSession();
    try {
      const r = executeToolCall(session, {
        name: "applyPolicy",
        arguments: {},
      });
      expect(r.ok).toBe(false);
      expect(r.message).toContain("confirm");
    } finally {
      session.close();
    }
  });

  it("requires GEMINI_API_KEY when provider is gemini", () => {
    process.env.PEFFLE_AI_PROVIDER = "gemini";
    expect(() => createPeffleAIProviderFromEnv()).toThrow(ProviderUnavailableError);
  });

  it("Groq OpenAI-compatible request uses default model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okCompletion(JSON.stringify({ message: "ok" }))
    );
    vi.stubGlobal("fetch", fetchMock);
    const p = new OpenAICompatibleProvider({
      apiKey: "gsk",
      model: DEFAULT_GROQ_MODEL,
      baseUrl: GROQ_OPENAI_BASE_URL,
      providerId: "groq",
    });
    await p.chat("hi", minimalContext());
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.model).toBe(DEFAULT_GROQ_MODEL);
  });
});

function minimalContext(): PeffleContext {
  return {
    policyPath: "/tmp/policy.json",
    storagePath: "/tmp/db",
    policy: {
      version: 1,
      defaults: { onNoMatchingRule: "deny" },
      budgets: [],
      actions: [],
    },
    pendingApprovals: [],
    recentLedger: [],
    knownActions: [],
    agentStatuses: [],
    capabilities: [],
  };
}

function makeSession(): ChatSession {
  const dir = mkdtempSync(join(tmpdir(), "peffle-ai-prov-"));
  const db = join(dir, "ledger.db");
  const policyPath = join(dir, "policy.json");
  writeFileSync(
    policyPath,
    JSON.stringify({
      version: 1,
      defaults: { onNoMatchingRule: "deny" },
      budgets: [],
      actions: [{ id: "a", match: { action: "*" }, effect: "allow" }],
    })
  );
  const session = new ChatSession({ storagePath: db, policyPath });
  (session as unknown as { _tmpdir: string })._tmpdir = dir;
  return session;
}
