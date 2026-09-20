import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const bin = join(process.cwd(), "dist/cli/bin.js");

describe("peffle chat cli", () => {
  it("npx peffle chat starts and exits on /exit", () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-chat-cli-"));
    const db = join(dir, "ledger.db");
    const policy = join(dir, "policy.json");
    writeFileSync(
      policy,
      JSON.stringify({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [],
        actions: [{ id: "a", match: { action: "*" }, effect: "allow" }],
      })
    );
    const proc = spawnSync(process.execPath, [bin, "chat"], {
      env: { ...process.env, PEFFLE_STORAGE: db, PEFFLE_POLICY: policy, PEFFLE_AI_PROVIDER: "none" },
      cwd: dir,
      input: "/exit\n",
      encoding: "utf8",
      timeout: 15_000,
    });
    expect(proc.status).toBe(0);
    expect(proc.stdout).toContain("Goodbye");
    rmSync(dir, { recursive: true, force: true });
  });

  it("chat subprocess stdout on /exit", () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-chat-cli-out-"));
    const db = join(dir, "ledger.db");
    const policy = join(dir, "policy.json");
    writeFileSync(
      policy,
      JSON.stringify({
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [],
        actions: [],
      })
    );
    const out = execFileSync(process.execPath, [bin, "chat"], {
      env: { ...process.env, PEFFLE_STORAGE: db, PEFFLE_POLICY: policy, PEFFLE_AI_PROVIDER: "none" },
      cwd: dir,
      input: "/exit\n",
      encoding: "utf8",
      timeout: 15_000,
    });
    expect(out).toContain("Goodbye");
    rmSync(dir, { recursive: true, force: true });
  });
});
