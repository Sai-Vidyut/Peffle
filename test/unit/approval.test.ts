import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ApprovalAlreadyConsumedError,
  ApprovalAlreadyResolvedError,
  ApprovalDeniedError,
  ApprovalExpiredError,
  ApprovalFingerprintMismatchError,
  ApprovalNotYetGrantedError,
  ApprovalRequiredError,
  getApprovalRedemption,
  ApprovalTokenInvalidError,
  AgentKilledError,
  BudgetExceededError,
  createPeffle,
} from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

const approvalPolicy = testPolicy({
  actions: [
    { id: "inv", match: { action: "send_invoice" }, effect: "require_approval" },
  ],
});

describe("approval redemption", () => {
  it("redeems once after approve", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 25 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => "nope");
    } catch (e) {
      expect(e).toBeInstanceOf(ApprovalRequiredError);
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    const fn = vi.fn(() => "done");
    const result = await ra.guard(req, fn, { approval: { eventId, token } });
    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledOnce();
    await expect(
      ra.guard(req, fn, { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalAlreadyConsumedError);
    expect(fn).toHaveBeenCalledOnce();
    ra.close();
  });

  it("approve returns void (no token in API)", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      eventId = (e as ApprovalRequiredError).eventId;
    }
    expect(ra.approve(eventId)).toBeUndefined();
    ra.close();
  });

  it("rejects wrong token", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      eventId = (e as ApprovalRequiredError).eventId;
    }
    ra.approve(eventId);
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token: "wrong-token" } })
    ).rejects.toBeInstanceOf(ApprovalTokenInvalidError);
    ra.close();
  });

  it("rejects fingerprint mismatch", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 5 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    await expect(
      ra.guard({ agent, action: "send_invoice", amount: 999 }, () => "x", {
        approval: { eventId, token },
      })
    ).rejects.toBeInstanceOf(ApprovalFingerprintMismatchError);
    ra.close();
  });

  it("pending redemption throws not yet granted", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalNotYetGrantedError);
    ra.close();
  });

  it("deny blocks redemption", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.deny(eventId);
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalDeniedError);
    ra.close();
  });

  it("double approve throws", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      eventId = (e as ApprovalRequiredError).eventId;
    }
    ra.approve(eventId);
    expect(() => ra.approve(eventId)).toThrow(ApprovalAlreadyResolvedError);
    ra.close();
  });

  it("rejects expired approval grant", async () => {
    const ra = memoryPeffle(approvalPolicy, { approvalRedeemTtlMs: 5 });
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    await new Promise((r) => setTimeout(r, 15));
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalExpiredError);
    ra.close();
  });

  it("concurrent redemption allows only one success", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 2 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    const fn = vi.fn(() => "ok");
    const results = await Promise.allSettled([
      ra.guard(req, fn, { approval: { eventId, token } }),
      ra.guard(req, fn, { approval: { eventId, token } }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const bad = results.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(bad).toHaveLength(1);
    expect((bad[0] as PromiseRejectedResult).reason).toBeInstanceOf(ApprovalAlreadyConsumedError);
    expect(fn).toHaveBeenCalledOnce();
    ra.close();
  });

  it("rejects redemption when budget exhausted since approval", async () => {
    const ra = memoryPeffle(
      testPolicy({
        budgets: [{ id: "cap", scope: "global", window: "total", limit: 10 }],
        actions: [
          { id: "pay", match: { action: "pay" }, effect: "allow" },
          { id: "inv", match: { action: "send_invoice" }, effect: "require_approval" },
        ],
      })
    );
    await ra.guard({ agent, action: "pay", amount: 4 }, async () => "p");
    const req = { agent, action: "send_invoice", amount: 3 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    await ra.guard({ agent, action: "pay", amount: 5 }, async () => "p");
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(BudgetExceededError);
    ra.close();
  });

  it("cross-process approve visible to waitForApproval", async () => {
    const dir = mkdtempSync(join(tmpdir(), "peffle-wal-"));
    const dbPath = join(dir, "ledger.db");
    const policy = approvalPolicy;
    const a = createPeffle({ storagePath: dbPath, policy });
    const b = createPeffle({ storagePath: dbPath, policy });
    const req = { agent, action: "send_invoice", amount: 1 };
    let eventId = "";
    try {
      await a.guard(req, () => {});
    } catch (e) {
      eventId = (e as ApprovalRequiredError).eventId;
    }
    const waitP = a.waitForApproval(eventId, { timeoutMs: 5000 });
    b.approve(eventId);
    await expect(waitP).resolves.toMatchObject({ id: eventId });
    a.close();
    b.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("waitForApproval rejects when already consumed", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    const creds = await (async () => {
      try {
        await ra.guard(req, () => {});
      } catch (e) {
        return getApprovalRedemption(e as ApprovalRequiredError);
      }
      throw new Error("expected approval");
    })();
    ra.approve(creds.eventId);
    await ra.guard(req, () => "ok", { approval: creds });
    await expect(ra.waitForApproval(creds.eventId, { timeoutMs: 500 })).rejects.toBeInstanceOf(
      ApprovalAlreadyConsumedError
    );
    ra.close();
  });

  it("approve after kill throws AgentKilledError", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      eventId = (e as ApprovalRequiredError).eventId;
    }
    ra.kill(agent.agentId);
    expect(() => ra.approve(eventId)).toThrow(AgentKilledError);
    ra.close();
  });

  it("revoke during redemption reports denied not consumed", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    ra.revoke(eventId);
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalDeniedError);
    ra.close();
  });

  it("consumeApproval uses timestamp captured inside immediate transaction", async () => {
    const { PeffleStorage } = await import("../../src/core/storage.js");
    const spy = vi.spyOn(PeffleStorage.prototype, "consumeApproval");
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    const before = Date.now();
    await new Promise((r) => setTimeout(r, 30));
    await ra.guard(req, () => "ok", { approval: { eventId, token } });
    expect(spy).toHaveBeenCalled();
    const consumedAt = spy.mock.calls.at(-1)?.[2] as string;
    expect(new Date(consumedAt).getTime()).toBeGreaterThanOrEqual(before);
    spy.mockRestore();
    ra.close();
  });

  it("kill voids approved redemption", async () => {
    const ra = memoryPeffle(approvalPolicy);
    const req = { agent, action: "send_invoice", amount: 1 };
    let token = "";
    let eventId = "";
    try {
      await ra.guard(req, () => {});
    } catch (e) {
      const creds = getApprovalRedemption(e as ApprovalRequiredError);
      token = creds.token;
      eventId = creds.eventId;
    }
    ra.approve(eventId);
    ra.kill("agent-1");
    await expect(
      ra.guard(req, () => "x", { approval: { eventId, token } })
    ).rejects.toBeInstanceOf(ApprovalDeniedError);
    ra.close();
  });
});
