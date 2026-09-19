import { InvalidAmountError } from "../core/errors.js";
import { assertValidAmount } from "../core/validate-request.js";

export function parseMcpNumericField(
  record: Record<string, unknown>,
  keys: ("amount" | "cost")[]
): number | undefined {
  let raw: unknown;
  for (const key of keys) {
    if (record[key] !== undefined) {
      raw = record[key];
      break;
    }
  }
  if (raw === undefined) return undefined;
  if (typeof raw !== "number") {
    throw new InvalidAmountError(raw);
  }
  assertValidAmount(raw);
  return raw;
}
