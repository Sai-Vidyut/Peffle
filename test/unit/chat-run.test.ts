import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runPeffleChat } from "../../src/chat/run.js";
import { createMockProvider } from "../../src/ai/providers/mock-provider.js";
import { tryNaturalLanguageRoute } from "../../src/chat/nl-fallback.js";
import { ChatSession } from "../../src/chat/session.js";
import { ProviderUnavailableError, createPeffleAIProviderFromEnv } from "../../src/ai/provider.js";

async function linesFromInput(inputs: string[], opts?: { provider?: ReturnType<typeof createMockProvider> }) {
  async function* gen() {
    for (const l of inputs) yield l;
  }
  const dir = mkdtempSync(join(tmpdir(), "peffle-chat-run-"));
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
  const result = await runPeffleChat({
    skipBanner: true,
    storagePath: db,
    policyPath,
    provider: opts?.provider ?? null,
    input: gen(),
    output: { write: () => true },
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

describe("peffle chat", () => {
  it("starts and exits gracefully", async () => {
    const r = await linesFromInput(["/exit"]);
    expect(r.exitCode).toBe(0);
    expect(r.lines.some((l) => l.includes("Goodbye"))).toBe(true);
  });

  it("runPeffleChat returns after /exit (input iterable completes)", async () => {
    let yieldedAfterExit = false;
    async function* gen() {
      yield "/exit";
      yieldedAfterExit = true;
    }
    const dir = mkdtempSync(join(tmpdir(), "peffle-chat-exit-"));
    const db = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [],
        actions: [],
      })
    );
    const result = await runPeffleChat({
      skipBanner: true,
      storagePath: db,
      policyPath,
      provider: null,
      input: gen(),
      output: { write: () => true },
    });
    rmSync(dir, { recursive: true, force: true });
    expect(result.exitCode).toBe(0);
    expect(yieldedAfterExit).toBe(false);
  });

  it("provider unavailable when misconfigured", () => {
    const prev = process.env.PEFFLE_AI_PROVIDER;
    process.env.PEFFLE_AI_PROVIDER = "openai";
    delete process.env.PEFFLE_AI_API_KEY;
    expect(() => createPeffleAIProviderFromEnv()).toThrow(ProviderUnavailableError);
    process.env.PEFFLE_AI_PROVIDER = prev;
  });

  it("mock provider tool calls go through tool layer", async () => {
    const provider = createMockProvider((_input, ctx) => ({
      message: "Here is the policy",
      toolCalls: [{ name: "getPolicy", arguments: {} }],
    }));
    const r = await linesFromInput(["show policy please", "/exit"], { provider });
    expect(r.exitCode).toBe(0);
  });

  it("natural language pending route", () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-nl-"));
    const db = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [],
        actions: [],
      })
    );
    const session = new ChatSession({ storagePath: db, policyPath });
    try {
      const r = tryNaturalLanguageRoute(session, "show me what's waiting for approval");
      expect(r.handled).toBe(true);
    } finally {
      session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
