import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ApprovalRequiredError,
  createPeffle,
  getApprovalRedemption,
} from "../../src/core/index.js";
import type { PolicyConfig } from "../../src/core/types.js";

const policy: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [{ id: "cap", scope: "global", window: "total", limit: 100 }],
  actions: [{ id: "pay", match: { action: "pay" }, effect: "require_approval" }],
};

function runChild(
  childScript: string,
  dbPath: string,
  policyPath: string,
  eventId: string,
  token: string,
  amount: number
): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["tsx", childScript, dbPath, policyPath, eventId, token, String(amount)],
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

describe("cross-process budget race", () => {
  it("only one of two concurrent redemptions can exceed shared cap", async () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-xproc-"));
    const dbPath = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(policy));
    const childScript = join(dirname(fileURLToPath(import.meta.url)), "budget-race-child.ts");

    const ra = createPeffle({ storagePath: dbPath, policy });
    const agent = { agentId: "race-agent" };
    const creds: { eventId: string; token: string }[] = [];

    for (let i = 0; i < 2; i++) {
      try {
        await ra.guard({ agent, action: "pay", amount: 60 }, async () => "x");
      } catch (e) {
        creds.push(getApprovalRedemption(e as ApprovalRequiredError));
      }
    }
    ra.approve(creds[0].eventId);
    ra.approve(creds[1].eventId);
    ra.close();

    const [a, b] = await Promise.all([
      runChild(childScript, dbPath, policyPath, creds[0].eventId, creds[0].token, 60),
      runChild(childScript, dbPath, policyPath, creds[1].eventId, creds[1].token, 60),
    ]);

    const outcomes = [a, b].map((r) => (r.out.includes("OK") ? "ok" : "fail"));
    expect(outcomes.filter((o) => o === "ok")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "fail")).toHaveLength(1);
    expect(a.out + b.out).toMatch(/BudgetExceeded|ERR/);

    rmSync(dir, { recursive: true, force: true });
  }, 30_000);
});
