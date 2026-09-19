import { randomBytes } from "node:crypto";
import type { GuardApproval } from "../core/types.js";

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const DEFAULT_MAX_PENDING = 10_000;

interface PendingEntry {
  creds: GuardApproval;
  expiresAtMs: number;
}

const pending = new Map<string, PendingEntry>();

let configuredTtlMs = DEFAULT_TTL_MS;
let maxPendingHandles = DEFAULT_MAX_PENDING;

/** Configure in-process MCP redemption handle TTL and capacity (MVP: module-global). */
export function configureMcpRedemptionRegistry(opts: {
  ttlMs?: number;
  maxPending?: number;
}): void {
  if (opts.ttlMs !== undefined) configuredTtlMs = opts.ttlMs;
  if (opts.maxPending !== undefined) maxPendingHandles = opts.maxPending;
}

function purgeExpired(nowMs = Date.now()): void {
  for (const [handle, entry] of pending) {
    if (entry.expiresAtMs <= nowMs) {
      pending.delete(handle);
    }
  }
}

function enforceCapacity(): void {
  purgeExpired();
  if (pending.size < maxPendingHandles) return;
  const oldest = pending.keys().next().value;
  if (oldest !== undefined) pending.delete(oldest);
}

/** In-process only: maps opaque handle → redemption credentials for MCP follow-up calls. */
export function issueMcpRedemptionHandle(
  eventId: string,
  token: string,
  ttlMs = configuredTtlMs
): string {
  enforceCapacity();
  const handle = randomBytes(24).toString("base64url");
  pending.set(handle, {
    creds: { eventId, token },
    expiresAtMs: Date.now() + ttlMs,
  });
  return handle;
}

/** Read handle credentials without consuming (for retry after transient guard failures). */
export function peekMcpRedemptionHandle(handle: string): GuardApproval | undefined {
  purgeExpired();
  const entry = pending.get(handle);
  if (!entry) return undefined;
  if (entry.expiresAtMs <= Date.now()) {
    pending.delete(handle);
    return undefined;
  }
  return entry.creds;
}

/** Remove handle after successful redemption. */
export function consumeMcpRedemptionHandle(handle: string): void {
  pending.delete(handle);
}

/** Remove handle after terminal approval/guard outcomes (invalid, consumed, denied, etc.). */
export function discardMcpRedemptionHandle(handle: string): void {
  pending.delete(handle);
}

/** @deprecated Use peek + consume/discard. Kept for tests that assert handle contents. */
export function takeMcpRedemptionHandle(handle: string): GuardApproval | undefined {
  const creds = peekMcpRedemptionHandle(handle);
  if (creds) pending.delete(handle);
  return creds;
}

/** Test helper: clear registry and reset config defaults. */
export function resetMcpRedemptionRegistryForTests(): void {
  pending.clear();
  configuredTtlMs = DEFAULT_TTL_MS;
  maxPendingHandles = DEFAULT_MAX_PENDING;
}

export function getMcpRedemptionRegistryStatsForTests(): { size: number } {
  purgeExpired();
  return { size: pending.size };
}
