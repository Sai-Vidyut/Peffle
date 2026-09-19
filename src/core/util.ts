import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { ActionRequest } from "./types.js";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function nowIso(): string {
  return new Date().toISOString();
}

export function newEventId(): string {
  const time = Date.now();
  const rand = randomBytes(10);
  let id = "";
  let t = time;
  for (let i = 0; i < 10; i++) {
    id = CROCKFORD[t % 32] + id;
    t = Math.floor(t / 32);
  }
  for (let i = 0; i < 16; i++) {
    id += CROCKFORD[rand[i] % 32];
  }
  return id;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function secureCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function newApprovalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function canonicalFingerprintPayload(request: ActionRequest): Record<string, unknown> {
  return {
    agentId: request.agent.agentId,
    principal: request.agent.principal ?? null,
    action: request.action,
    resource: request.resource ?? null,
    amount: request.amount ?? null,
  };
}

export function requestFingerprint(request: ActionRequest): string {
  const p = canonicalFingerprintPayload(request);
  const canonical = JSON.stringify({
    agentId: p.agentId,
    principal: p.principal,
    action: p.action,
    resource: p.resource,
    amount: p.amount,
  });
  return sha256Hex(canonical);
}

/** Simple glob: * matches any substring */
export function globMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped.replace(/\*/g, ".*")}$`);
  return regex.test(value);
}

export function matchActionRule(
  match: { action?: string; resource?: string },
  action: string,
  resource?: string
): boolean {
  if (match.action !== undefined && !globMatch(match.action, action)) {
    return false;
  }
  if (match.resource !== undefined) {
    const res = resource ?? "";
    if (!globMatch(match.resource, res)) return false;
  }
  return match.action !== undefined || match.resource !== undefined;
}

export function utcDayStartIso(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

/** Escape `%` and `_` for SQL LIKE with ESCAPE '\\'. */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
