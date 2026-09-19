import type { ActionEvent } from "./types.js";
import type { RightAuthStorage } from "./storage.js";
import {
  ApprovalAlreadyResolvedError,
  ApprovalAlreadyConsumedError,
  ApprovalDeniedError,
  ApprovalNotFoundError,
  ApprovalTimeoutError,
  AgentKilledError,
} from "./errors.js";
import { isAgentEffectivelyKilled } from "./policy.js";

const DEFAULT_POLL_MS = 250;

export function approveEvent(
  storage: RightAuthStorage,
  eventId: string,
  ttlMs: number,
  note?: string
): void {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  storage.transactionImmediate(() => {
    const event = storage.getEvent(eventId);
    if (!event) throw new ApprovalNotFoundError(eventId);
    const killed = isAgentEffectivelyKilled(storage, event.agent);
    if (killed.killed) {
      throw new AgentKilledError(killed.agentId ?? event.agent.agentId);
    }

    const approval = storage.getApproval(eventId);
    if (!approval) throw new ApprovalNotFoundError(eventId);
    if (approval.status !== "pending") {
      throw new ApprovalAlreadyResolvedError(eventId);
    }
    const ok = storage.approvePending(eventId, expiresAt, note);
    if (!ok) throw new ApprovalAlreadyResolvedError(eventId);
  });
}

export function denyEvent(
  storage: RightAuthStorage,
  eventId: string,
  note?: string
): void {
  const approval = storage.getApproval(eventId);
  if (!approval) throw new ApprovalNotFoundError(eventId);
  if (approval.status !== "pending") {
    throw new ApprovalAlreadyResolvedError(eventId);
  }
  const ok = storage.denyPending(eventId, note);
  if (!ok) throw new ApprovalAlreadyResolvedError(eventId);
}

export function revokeApprovedEvent(
  storage: RightAuthStorage,
  eventId: string,
  note?: string
): void {
  storage.transactionImmediate(() => {
    const approval = storage.getApproval(eventId);
    if (!approval) throw new ApprovalNotFoundError(eventId);
    if (approval.status === "consumed") {
      throw new ApprovalAlreadyConsumedError(eventId);
    }
    if (approval.status !== "approved") {
      throw new ApprovalAlreadyResolvedError(eventId);
    }
    const ok = storage.revokeApproved(eventId, note);
    if (!ok) throw new ApprovalAlreadyResolvedError(eventId);
  });
}

export async function waitForApprovalEvent(
  storage: RightAuthStorage,
  eventId: string,
  timeoutMs = 30_000
): Promise<ActionEvent> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const approval = storage.getApproval(eventId);
    if (!approval) throw new ApprovalNotFoundError(eventId);
    if (approval.status === "approved") {
      const event = storage.getEvent(eventId);
      if (!event) throw new ApprovalNotFoundError(eventId);
      return event;
    }
    if (approval.status === "denied") {
      throw new ApprovalDeniedError(eventId, approval.note ?? undefined);
    }
    if (approval.status === "consumed") {
      throw new ApprovalAlreadyConsumedError(eventId);
    }
    await new Promise((r) => setTimeout(r, DEFAULT_POLL_MS));
  }
  throw new ApprovalTimeoutError(eventId);
}
