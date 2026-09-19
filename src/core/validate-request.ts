import type { ActionRequest } from "./types.js";
import { InvalidAmountError } from "./errors.js";

export function assertValidAmount(amount: number | undefined): void {
  if (amount === undefined) return;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new InvalidAmountError(amount);
  }
}

export function normalizeActionRequest(request: ActionRequest): ActionRequest {
  assertValidAmount(request.amount);
  return request;
}
