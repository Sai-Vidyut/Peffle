import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const bin = join(process.cwd(), "dist/cli/bin.js");

describe("cli", () => {
  it("kill then status runs without error", () => {
    const dir = mkdtempSync(join(tmpdir(), "rightauth-cli-"));
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
    execFileSync(process.execPath, [bin, "kill", "cli-agent", "--reason", "test"], {
      env: { ...process.env, RIGHTAUTH_STORAGE: db, RIGHTAUTH_POLICY: policy },
      cwd: dir,
    });
    const out = execFileSync(process.execPath, [bin, "status", "--agent", "cli-agent"], {
      env: { ...process.env, RIGHTAUTH_STORAGE: db, RIGHTAUTH_POLICY: policy },
      cwd: dir,
      encoding: "utf8",
    });
    expect(out).toContain("cli-agent");
    rmSync(dir, { recursive: true, force: true });
  });
});
