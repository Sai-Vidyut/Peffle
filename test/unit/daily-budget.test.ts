import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRightAuth } from "../../src/core/index.js";
import { RightAuthStorage } from "../../src/core/storage.js";
import { evaluateBudgets } from "../../src/core/policy.js";
import type { PolicyConfig } from "../../src/core/types.js";

const policy: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [{ id: "daily", scope: "global", window: "daily", limit: 10 }],
  actions: [{ id: "a", match: { action: "pay" }, effect: "allow" }],
};

describe("daily budget uses executed_at", () => {
  it("counts redemption on execution day not request day", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rightauth-daily-"));
    const dbPath = join(dir, "ledger.db");
    const storage = new RightAuthStorage(dbPath);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const today = new Date().toISOString();

    storage.db
      .prepare(
        `INSERT INTO events (id, agent_id, action, amount, status, created_at, updated_at, executed_at)
         VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`
      )
      .run("evt-old", "agent-1", "pay", 8, yesterday, yesterday, today);

    const block = evaluateBudgets(storage, policy, {
      agent: { agentId: "agent-1" },
      action: "pay",
      amount: 3,
    });
    expect(block?.outcome).toBe("deny");

    storage.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
