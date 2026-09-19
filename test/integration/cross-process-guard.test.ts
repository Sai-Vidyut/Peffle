import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createPeffle } from "../../src/core/index.js";
import { PeffleStorage } from "../../src/core/storage.js";
import type { PolicyConfig } from "../../src/core/types.js";

const policy: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [{ id: "cap", scope: "global", window: "total", limit: 100 }],
  actions: [{ id: "pay", match: { action: "pay" }, effect: "allow" }],
};

function runChild(
  childScript: string,
  dbPath: string,
  policyPath: string,
  amount: number
): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["tsx", childScript, dbPath, policyPath, String(amount)],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: join(dirname(fileURLToPath(import.meta.url)), "../.."),
      }
    );
    let out = "";
    proc.stdout.on("data", (d) => {
      out += d.toString();
    });
    proc.stderr.on("data", (d) => {
      out += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

describe("cross-process normal guard budget race", () => {
  it("only one concurrent allowed guard can reserve spend over cap", async () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-guard-xproc-"));
    const dbPath = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(policy));
    const childScript = join(dirname(fileURLToPath(import.meta.url)), "guard-race-child.ts");

    const [a, b] = await Promise.all([
      runChild(childScript, dbPath, policyPath, 60),
      runChild(childScript, dbPath, policyPath, 60),
    ]);

    const okCount = [a, b].filter((r) => r.out.includes("OK")).length;
    expect(okCount).toBe(1);

    const storage = new PeffleStorage(dbPath);
    const spent = storage.sumBudgetSpend("global", "total", "race-agent");
    storage.close();
    expect(spent).toBeLessThanOrEqual(100);

    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("kill during concurrent guard prevents in_progress reservation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-kill-xproc-"));
    const dbPath = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(policy));
    const childScript = join(dirname(fileURLToPath(import.meta.url)), "guard-race-child.ts");

    const ra = createPeffle({ storagePath: dbPath, policy });
    ra.kill("race-agent");
    ra.close();

    const result = await runChild(childScript, dbPath, policyPath, 1);
    expect(result.out).toMatch(/ERR|AgentKilled/);

    rmSync(dir, { recursive: true, force: true });
  }, 30_000);
});
