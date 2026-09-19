import { describe, expect, it } from "vitest";
import util from "node:util";
import { ApprovalRequiredError, getApprovalRedemption } from "../../src/core/errors.js";

describe("approval token not exposed on error inspection", () => {
  it("util.inspect does not include plaintext token", () => {
    const secret = "super-secret-redemption-token-value";
    const err = new ApprovalRequiredError("evt-123", secret);
    const inspected = util.inspect(err);
    expect(inspected).not.toContain(secret);
    expect(inspected).toContain("evt-123");
    expect(getApprovalRedemption(err).token).toBe(secret);
  });

  it("JSON.stringify of error does not include token", () => {
    const secret = "another-secret-token";
    const err = new ApprovalRequiredError("evt-456", secret);
    expect(JSON.stringify(err)).not.toContain(secret);
  });
});
