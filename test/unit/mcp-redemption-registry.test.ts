import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureMcpRedemptionRegistry,
  getMcpRedemptionRegistryStatsForTests,
  issueMcpRedemptionHandle,
  peekMcpRedemptionHandle,
  resetMcpRedemptionRegistryForTests,
} from "../../src/mcp/redemption-registry.js";

describe("MCP redemption registry", () => {
  afterEach(() => {
    resetMcpRedemptionRegistryForTests();
    vi.useRealTimers();
  });

  it("expires handles after TTL", async () => {
    vi.useFakeTimers();
    configureMcpRedemptionRegistry({ ttlMs: 1000, maxPending: 100 });
    const handle = issueMcpRedemptionHandle("evt", "tok", 1000);
    expect(peekMcpRedemptionHandle(handle)).toEqual({ eventId: "evt", token: "tok" });
    vi.advanceTimersByTime(1001);
    expect(peekMcpRedemptionHandle(handle)).toBeUndefined();
  });

  it("enforces max pending handle limit", () => {
    configureMcpRedemptionRegistry({ ttlMs: 60_000, maxPending: 3 });
    issueMcpRedemptionHandle("a", "1");
    issueMcpRedemptionHandle("b", "2");
    issueMcpRedemptionHandle("c", "3");
    issueMcpRedemptionHandle("d", "4");
    expect(getMcpRedemptionRegistryStatsForTests().size).toBeLessThanOrEqual(3);
  });
});
