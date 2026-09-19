import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ApprovalRequiredError,
  createRightAuth,
  getApprovalRedemption,
} from "../../src/core/index.js";
import { RightAuthStorage } from "../../src/core/storage.js";
import type { PolicyConfig } from "../../src/core/types.js";

const policy: PolicyConfig = {
  version: 1,
  defaults: { onNoMatchingRule: "deny" },
  budgets: [],
  actions: [{ id: "inv", match: { action: "send_invoice" }, effect: "require_approval" }],
};

function runRedeemChild(
  childScript: string,
  dbPath: string,
  policyPath: string,
  eventId: string,
  token: string
): Promise<{ code: number; out: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["tsx", childScript, dbPath, policyPath, eventId, token],
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

describe("cross-process approval redemption", () => {
  it("only one process redeems the same eventId+token", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rightauth-appr-xproc-"));
    const dbPath = join(dir, "ledger.db");
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(policy));
    const childScript = join(
      dirname(fileURLToPath(import.meta.url)),
      "approval-redeem-race-child.ts"
    );

    const parent = createRightAuth({ storagePath: dbPath, policy });
    const agent = { agentId: "race-agent" };
    let eventId = "";
    let token = "";
    try {
      await parent.guard({ agent, action: "send_invoice", amount: 5 }, () => "nope");
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      eventId = creds.eventId;
      token = creds.token;
    }
    parent.approve(eventId);
    parent.close();

    const a = runRedeemChild(childScript, dbPath, policyPath, eventId, token);
    const b = runRedeemChild(childScript, dbPath, policyPath, eventId, token);
    const [ra, rb] = await Promise.all([a, b]);

    const ok = [ra, rb].filter((r) => r.out.includes("OK ok"));
    const err = [ra, rb].filter((r) => r.out.includes("ERR"));
    expect(ok).toHaveLength(1);
    expect(err).toHaveLength(1);
    expect(err[0].out).toMatch(/ApprovalAlreadyConsumed|ApprovalDenied/);

    const handlerRuns = [ra.out, rb.out].filter((o) => o.includes("HANDLER")).length;
    expect(handlerRuns).toBeLessThanOrEqual(1);

    const storage = new RightAuthStorage(dbPath);
    const approval = storage.getApproval(eventId);
    storage.close();
    expect(approval?.status).toBe("consumed");

    rmSync(dir, { recursive: true, force: true });
  }, 30_000);
});
