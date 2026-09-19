import type { ActionRequest, GuardApproval, RightAuth } from "../core/types.js";
import {
  ApprovalAlreadyConsumedError,
  ApprovalDeniedError,
  ApprovalExpiredError,
  ApprovalFingerprintMismatchError,
  ApprovalNotFoundError,
  ApprovalNotYetGrantedError,
  ApprovalRequiredError,
  ApprovalTokenInvalidError,
  AgentKilledError,
  BudgetExceededError,
  InvalidAmountError,
  PolicyDeniedError,
  RightAuthError,
  getApprovalRedemption,
} from "../core/errors.js";
import { parseMcpNumericField } from "./amount.js";
import {
  consumeMcpRedemptionHandle,
  discardMcpRedemptionHandle,
  issueMcpRedemptionHandle,
  peekMcpRedemptionHandle,
} from "./redemption-registry.js";

export const RIGHTAUTH_APPROVAL_PROTOCOL = "rightauth/approval-required/v1";

const DEFAULT_APPROVAL_TTL_MS = 15 * 60 * 1000;

export interface McpGuardOptions<Args = unknown> {
  rightauth: RightAuth;
  agentId: string;
  principal?: string;
  delegationChain?: string[];
  /** TTL for in-process redemption handles (defaults to 15 minutes). */
  redemptionHandleTtlMs?: number;
  mapToAction?: (toolName: string, args: unknown) => Partial<ActionRequest>;
  approvalFromArgs?: (args: Args) => GuardApproval | undefined;
}

export type McpApprovalRequiredResult = {
  isError: true;
  rightauthApprovalRequired: true;
  eventId: string;
  redemptionHandle: string;
  content: { type: "text"; text: string }[];
};

export type McpToolErrorResult = {
  isError: true;
  content: { type: "text"; text: string }[];
};

export type McpGuardToolResult<T> = T | McpApprovalRequiredResult | McpToolErrorResult;

function defaultMapToAction(toolName: string, args: unknown): Partial<ActionRequest> {
  if (args && typeof args === "object") {
    const record = args as Record<string, unknown>;
    const amount = parseMcpNumericField(record, ["amount", "cost"]);
    return { action: toolName, amount };
  }
  return { action: toolName };
}

function extractApprovalFromArgs<Args>(
  args: Args
): { approval?: GuardApproval; handle?: string } {
  if (!args || typeof args !== "object") return {};
  const record = args as Record<string, unknown>;
  const raw = record.rightauthApproval;
  if (!raw || typeof raw !== "object") return {};
  const a = raw as Record<string, unknown>;
  if (typeof a.handle === "string") {
    const approval = peekMcpRedemptionHandle(a.handle);
    return { approval, handle: a.handle };
  }
  if (typeof a.eventId === "string" && typeof a.token === "string") {
    return { approval: { eventId: a.eventId, token: a.token } };
  }
  return {};
}

function isTransientRedemptionError(err: unknown): boolean {
  return err instanceof ApprovalNotYetGrantedError || err instanceof BudgetExceededError;
}

function isTerminalRedemptionError(err: unknown): boolean {
  if (!(err instanceof RightAuthError)) return false;
  if (isTransientRedemptionError(err)) return false;
  if (err instanceof ApprovalRequiredError) return false;
  if (err instanceof PolicyDeniedError) return false;
  if (err instanceof InvalidAmountError) return false;
  return (
    err instanceof ApprovalAlreadyConsumedError ||
    err instanceof ApprovalDeniedError ||
    err instanceof ApprovalExpiredError ||
    err instanceof ApprovalFingerprintMismatchError ||
    err instanceof ApprovalNotFoundError ||
    err instanceof ApprovalTokenInvalidError ||
    err instanceof AgentKilledError
  );
}

function finalizeRedemptionHandle(handle: string | undefined, err: unknown): void {
  if (!handle) return;
  if (err === undefined) {
    consumeMcpRedemptionHandle(handle);
    return;
  }
  if (isTerminalRedemptionError(err)) {
    discardMcpRedemptionHandle(handle);
  }
}

export function guardTool<Args, Result>(
  handler: (args: Args) => Promise<Result> | Result,
  toolName: string,
  opts: McpGuardOptions<Args>
): (args: Args) => Promise<McpGuardToolResult<Result>> {
  const handleTtlMs = opts.redemptionHandleTtlMs ?? DEFAULT_APPROVAL_TTL_MS;

  return async (args: Args) => {
    let mapped: Partial<ActionRequest>;
    try {
      mapped = opts.mapToAction?.(toolName, args) ?? defaultMapToAction(toolName, args);
    } catch (err) {
      if (err instanceof InvalidAmountError) {
        return {
          isError: true,
          content: [{ type: "text", text: err.message }],
        };
      }
      throw err;
    }

    const fromCustom = opts.approvalFromArgs?.(args);
    const fromArgs = fromCustom ? { approval: fromCustom } : extractApprovalFromArgs(args);
    const approval = fromArgs.approval;
    const redemptionHandle = fromArgs.handle;

    const request: ActionRequest = {
      agent: {
        agentId: opts.agentId,
        principal: opts.principal,
        delegationChain: opts.delegationChain,
      },
      action: mapped.action ?? toolName,
      resource: mapped.resource,
      amount: mapped.amount,
      metadata: mapped.metadata,
    };

    try {
      const result = await opts.rightauth.guard(
        request,
        () => handler(args),
        approval ? { approval } : undefined
      );
      finalizeRedemptionHandle(redemptionHandle, undefined);
      return result;
    } catch (err) {
      if (err instanceof ApprovalRequiredError) {
        const { eventId, token } = getApprovalRedemption(err);
        const issuedHandle = issueMcpRedemptionHandle(eventId, token, handleTtlMs);
        const payload = {
          protocol: RIGHTAUTH_APPROVAL_PROTOCOL,
          eventId,
          redemptionHandle: issuedHandle,
          message: `Approval required. Run: rightauth approve ${eventId}`,
        };
        return {
          isError: true,
          rightauthApprovalRequired: true,
          eventId,
          redemptionHandle: issuedHandle,
          content: [{ type: "text", text: JSON.stringify(payload) }],
        };
      }
      finalizeRedemptionHandle(redemptionHandle, err);
      if (err instanceof RightAuthError) {
        return {
          isError: true,
          content: [{ type: "text", text: err.message }],
        };
      }
      throw err;
    }
  };
}
