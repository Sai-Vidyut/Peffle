import { describe, expect, it } from "vitest";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("checkPolicy", () => {
  it("allows when default is allow and rule matches allow", () => {
    const ra = memoryPeffle(
      testPolicy({
        defaults: { onNoMatchingRule: "allow" },
        actions: [],
      })
    );
    expect(ra.checkPolicy({ agent, action: "read_docs" }).outcome).toBe("allow");
    ra.close();
  });

  it("denies when default is deny and no rule matches", () => {
    const ra = memoryPeffle(
      testPolicy({
        defaults: { onNoMatchingRule: "deny" },
        actions: [],
      })
    );
    const d = ra.checkPolicy({ agent, action: "anything" });
    expect(d.outcome).toBe("deny");
    ra.close();
  });

  it("first match wins for action rules", () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [
          { id: "deny-first", match: { action: "send_*" }, effect: "deny" },
          { id: "allow-second", match: { action: "send_*" }, effect: "allow" },
        ],
      })
    );
    expect(ra.checkPolicy({ agent, action: "send_email" }).outcome).toBe("deny");
    ra.close();
  });

  it("glob matches send_*", () => {
    const ra = memoryPeffle(
      testPolicy({
        actions: [{ id: "a", match: { action: "send_*" }, effect: "deny" }],
      })
    );
    expect(ra.checkPolicy({ agent, action: "send_invoice" }).outcome).toBe("deny");
    expect(ra.checkPolicy({ agent, action: "read_email" }).outcome).toBe("deny");
    ra.close();
  });

  it("denies killed agent", () => {
    const ra = memoryPeffle(testPolicy());
    ra.kill("agent-1");
    const d = ra.checkPolicy({ agent, action: "read_x" });
    expect(d.outcome).toBe("deny");
    if (d.outcome === "deny") expect(d.rule).toBe("kill-switch");
    ra.close();
  });

  it("denies when ancestor is killed", () => {
    const ra = memoryPeffle(testPolicy());
    ra.kill("parent");
    const d = ra.checkPolicy({
      agent: { agentId: "child", delegationChain: ["parent"] },
      action: "read_x",
    });
    expect(d.outcome).toBe("deny");
    ra.close();
  });
});
