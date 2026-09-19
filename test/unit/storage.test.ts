import { describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RightAuthStorage } from "../../src/core/storage.js";

describe("storage", () => {
  it("creates schema on fresh :memory: db", () => {
    const s = new RightAuthStorage(":memory:");
    const row = s.db
      .prepare(`SELECT value FROM schema_meta WHERE key = 'schema_version'`)
      .get() as { value: string };
    expect(row.value).toBe("2");
    s.close();
  });

  it("persists data across reopen", () => {
    const dir = mkdtempSync(join(tmpdir(), "rightauth-store-"));
    const path = join(dir, "ledger.db");
    const a = new RightAuthStorage(path);
    a.upsertKill("agent-x", "test");
    a.close();
    const b = new RightAuthStorage(path);
    expect(b.getAgentStatus("agent-x")).toBe("killed");
    b.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates db file with 0600 on unix", () => {
    if (process.platform === "win32") return;
    const dir = mkdtempSync(join(tmpdir(), "rightauth-perm-"));
    const path = join(dir, "ledger.db");
    const s = new RightAuthStorage(path);
    s.close();
    const mode = statSync(path).mode & 0o777;
    expect(mode).toBe(0o600);
    rmSync(dir, { recursive: true, force: true });
  });
});
