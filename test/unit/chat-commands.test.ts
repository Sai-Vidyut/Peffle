import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ChatSession } from "../../src/chat/session.js";
import { handleSlashCommand, handleConfirmation } from "../../src/chat/commands.js";

function makeSession() {
  const dir = mkdtempSync(join(tmpdir(), "peffle-chat-cmd-"));
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
  return { dir, session };
}

describe("chat slash commands", () => {
  it("/help and /show", () => {
    const { dir, session } = makeSession();
    try {
      expect(handleSlashCommand(session, "/help")?.lines.join("\n")).toContain("/pending");
      expect(handleSlashCommand(session, "/show")?.lines.join("\n")).toContain("ACTIONS");
    } finally {
      session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("/kill requires confirmation", () => {
    const { dir, session } = makeSession();
    try {
      handleSlashCommand(session, "/kill shopper");
      expect(session.pendingKillAgentId).toBe("shopper");
      const applied = handleConfirmation(session, "y");
      expect(applied?.lines.join("\n")).toContain("Killed agent shopper");
    } finally {
      session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("policy change requires explicit y", () => {
    const { dir, session } = makeSession();
    try {
      session.pendingProposedPolicy = {
        version: 1,
        defaults: { onNoMatchingRule: "deny" },
        budgets: [{ id: "b", scope: "global", window: "daily", limit: 5 }],
        actions: [],
      };
      const no = handleConfirmation(session, "n");
      expect(no?.lines[0]).toContain("cancelled");
      expect(session.pendingProposedPolicy).toBeNull();
    } finally {
      session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("/exit sets exit flag", () => {
    const { dir, session } = makeSession();
    try {
      expect(handleSlashCommand(session, "/exit")?.exit).toBe(true);
    } finally {
      session.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
