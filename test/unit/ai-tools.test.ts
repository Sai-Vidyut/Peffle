import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ChatSession } from "../../src/chat/session.js";
import { executeToolCall } from "../../src/ai/tools.js";
import { parsePolicyConfig } from "../../src/core/schema.js";

function sessionDir() {
  const dir = mkdtempSync(join(tmpdir(), "peffle-chat-tools-"));
  const db = join(dir, "ledger.db");
  const policyPath = join(dir, "policy.json");
  writeFileSync(
    policyPath,
    JSON.stringify({
      version: 1,
      defaults: { onNoMatchingRule: "deny" },
      budgets: [{ id: "daily", scope: "global", window: "daily", limit: 10 }],
      actions: [{ id: "spend", match: { action: "charge_card" }, effect: "allow" }],
    })
  );
  return { dir, db, policyPath };
}

describe("Peffle tool layer", () => {
  it("rejects unknown tool names at execution boundary", () => {
    const { dir, db, policyPath } = sessionDir();
    const s = new ChatSession({ storagePath: db, policyPath });
    try {
      // @ts-expect-error intentional unsupported tool
      const bad = executeToolCall(s, { name: "runShell", arguments: {} });
      expect(bad.ok).toBe(false);
    } finally {
      s.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("cannot apply policy without pending proposal", () => {
    const { dir, db, policyPath } = sessionDir();
    const s = new ChatSession({ storagePath: db, policyPath });
    try {
      const r = executeToolCall(s, { name: "applyPolicy", arguments: { confirm: true } });
      expect(r.ok).toBe(false);
    } finally {
      s.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("propose then apply after validation", () => {
    const { dir, db, policyPath } = sessionDir();
    const s = new ChatSession({ storagePath: db, policyPath });
    try {
      const proposed = parsePolicyConfig({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [{ id: "daily", scope: "global", window: "daily", limit: 100 }],
        actions: [{ id: "spend", match: { action: "charge_card" }, effect: "allow" }],
      });
      executeToolCall(s, {
        name: "proposePolicyChange",
        arguments: { policy: proposed, summary: "Raise cap" },
      });
      expect(s.pendingProposedPolicy).not.toBeNull();
      const applied = executeToolCall(s, { name: "applyPolicy", arguments: { confirm: true } });
      expect(applied.ok).toBe(true);
      expect(s.getPolicy().budgets[0]!.limit).toBe(100);
    } finally {
      s.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects unsupported policy schema in propose", () => {
    const { dir, db, policyPath } = sessionDir();
    const s = new ChatSession({ storagePath: db, policyPath });
    try {
      const r = executeToolCall(s, {
        name: "proposePolicyChange",
        arguments: { policy: { version: 2 }, summary: "bad" },
      });
      expect(r.ok).toBe(false);
    } finally {
      s.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
