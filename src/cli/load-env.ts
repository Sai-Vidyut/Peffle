import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load `.env` then `.env.local` from cwd; never override existing process.env. */
export function loadPeffleEnvFiles(cwd: string = process.cwd()): void {
  for (const name of [".env", ".env.local"]) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) continue;
    applyEnvFile(readFileSync(path, "utf8"));
  }
}

function applyEnvFile(content: string): void {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}
