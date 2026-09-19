export abstract class RightAuthError extends Error {
  abstract readonly code: string;
}

export class ConfigValidationError extends RightAuthError {
  readonly code = "CONFIG_INVALID";
  constructor(
    message: string,
    readonly issues: unknown[]
  ) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

export class AgentKilledError extends RightAuthError {
  readonly code = "AGENT_KILLED";
  constructor(
    readonly agentId: string,
    readonly reason?: string
  ) {
    super(reason ? `Agent ${agentId} is killed: ${reason}` : `Agent ${agentId} is killed`);
    this.name = "AgentKilledError";
  }
}

export class PolicyDeniedError extends RightAuthError {
  readonly code = "POLICY_DENIED";
  constructor(
    message: string,
    readonly eventId: string,
    readonly ruleId?: string
  ) {
    super(message);
    this.name = "PolicyDeniedError";
  }
}

export class BudgetExceededError extends RightAuthError {
  readonly code = "BUDGET_EXCEEDED";
  constructor(
    readonly limit: number,
    readonly spent: number,
    readonly eventId: string,
    readonly ruleId?: string
  ) {
    super(`Budget exceeded: spent ${spent} would exceed limit ${limit}`);
    this.name = "BudgetExceededError";
  }
}

const approvalRedemptionTokens = new WeakMap<ApprovalRequiredError, string>();

export class ApprovalRequiredError extends RightAuthError {
  readonly code = "APPROVAL_REQUIRED";
  constructor(readonly eventId: string, token: string) {
    super(`Approval required for event ${eventId}`);
    this.name = "ApprovalRequiredError";
    approvalRedemptionTokens.set(this, token);
  }
}

/** Redemption credential for trusted callers; not enumerable on the error object. */
export function getApprovalRedemption(err: ApprovalRequiredError): {
  eventId: string;
  token: string;
} {
  const token = approvalRedemptionTokens.get(err);
  if (!token) {
    throw new Error("Approval redemption credentials are unavailable");
  }
  return { eventId: err.eventId, token };
}

export class InvalidAmountError extends RightAuthError {
  readonly code = "INVALID_AMOUNT";
  constructor(readonly amount: unknown) {
    super("Action amount must be a finite non-negative number");
    this.name = "InvalidAmountError";
  }
}

export class PrincipalRequiredError extends RightAuthError {
  readonly code = "PRINCIPAL_REQUIRED";
  constructor(readonly budgetRuleId: string) {
    super(`Agent principal is required for budget rule ${budgetRuleId}`);
    this.name = "PrincipalRequiredError";
  }
}

export class ApprovalTimeoutError extends RightAuthError {
  readonly code = "APPROVAL_TIMEOUT";
  constructor(readonly eventId: string) {
    super(`Approval timed out for event ${eventId}`);
    this.name = "ApprovalTimeoutError";
  }
}

export class ApprovalDeniedError extends RightAuthError {
  readonly code = "APPROVAL_DENIED";
  constructor(
    readonly eventId: string,
    readonly reason?: string
  ) {
    super(reason ?? `Approval denied for event ${eventId}`);
    this.name = "ApprovalDeniedError";
  }
}

export class ApprovalNotFoundError extends RightAuthError {
  readonly code = "APPROVAL_NOT_FOUND";
  constructor(readonly eventId: string) {
    super(`Approval not found for event ${eventId}`);
    this.name = "ApprovalNotFoundError";
  }
}

export class ApprovalNotYetGrantedError extends RightAuthError {
  readonly code = "APPROVAL_NOT_YET_GRANTED";
  constructor(readonly eventId: string) {
    super(`Approval not yet granted for event ${eventId}`);
    this.name = "ApprovalNotYetGrantedError";
  }
}

export class ApprovalAlreadyResolvedError extends RightAuthError {
  readonly code = "APPROVAL_ALREADY_RESOLVED";
  constructor(readonly eventId: string) {
    super(`Approval already resolved for event ${eventId}`);
    this.name = "ApprovalAlreadyResolvedError";
  }
}

export class ApprovalAlreadyConsumedError extends RightAuthError {
  readonly code = "APPROVAL_ALREADY_CONSUMED";
  constructor(readonly eventId: string) {
    super(`Approval already consumed for event ${eventId}`);
    this.name = "ApprovalAlreadyConsumedError";
  }
}

export class ApprovalExpiredError extends RightAuthError {
  readonly code = "APPROVAL_EXPIRED";
  constructor(
    readonly eventId: string,
    readonly expiresAt: string
  ) {
    super(`Approval expired for event ${eventId} at ${expiresAt}`);
    this.name = "ApprovalExpiredError";
  }
}

export class ApprovalFingerprintMismatchError extends RightAuthError {
  readonly code = "APPROVAL_FINGERPRINT_MISMATCH";
  constructor(readonly eventId: string) {
    super(`Request fingerprint does not match approved action for event ${eventId}`);
    this.name = "ApprovalFingerprintMismatchError";
  }
}

export class ApprovalTokenInvalidError extends RightAuthError {
  readonly code = "APPROVAL_TOKEN_INVALID";
  constructor(readonly eventId: string) {
    super(`Invalid approval token for event ${eventId}`);
    this.name = "ApprovalTokenInvalidError";
  }
}

export class StorageError extends RightAuthError {
  readonly code = "STORAGE_ERROR";
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}
