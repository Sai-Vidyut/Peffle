import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** Override user config directory (tests / advanced). Default: $XDG_CONFIG_HOME/peffle or ~/.config/peffle */
export function resolvePeffleUserConfigDir(): string {
  const override = process.env.PEFFLE_CONFIG_DIR?.trim();
  if (override) return resolve(override);
  const xdg = process.env.XDG_CONFIG_HOME?.trim();
  const base = xdg ? resolve(xdg) : join(homedir(), ".config");
  return join(base, "peffle");
}

export function resolvePeffleUserEnvFilePath(): string {
  return join(resolvePeffleUserConfigDir(), ".env");
}

/** Parse KEY=VALUE lines; later entries in the same file win. */
export function parseEnvFileContent(content: string): Record<string, string> {
  const out: Record<string, string> = {};
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
    out[key] = value;
  }
  return out;
}

function loadEnvFile(path: string, merged: Record<string, string>): void {
  if (!existsSync(path)) return;
  const parsed = parseEnvFileContent(readFileSync(path, "utf8"));
  Object.assign(merged, parsed);
}

function snapshotExplicitEnvKeys(): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && value !== "") keys.add(key);
  }
  return keys;
}

/**
 * Load Peffle-related env with precedence (low → high among files):
 *   user ~/.config/peffle/.env → project .env → project .env.local
 * Shell / process.env values set before this call always win (non-empty).
 */
export function loadPeffleEnvFiles(cwd: string = process.cwd()): void {
  const explicit = snapshotExplicitEnvKeys();
  const merged: Record<string, string> = {};

  loadEnvFile(resolvePeffleUserEnvFilePath(), merged);
  loadEnvFile(resolve(cwd, ".env"), merged);
  loadEnvFile(resolve(cwd, ".env.local"), merged);

  for (const [key, value] of Object.entries(merged)) {
    if (explicit.has(key)) continue;
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}
