import { describe, expect, it, vi } from "vitest";
import { AgentKilledError } from "../../src/core/index.js";
import { memoryPeffle, testPolicy, agent } from "../helpers.js";

describe("checkPolicy advisory pattern", () => {
  it("checkPolicy allow does not bypass kill switch in guard", async () => {
    const ra = memoryPeffle(testPolicy());
    expect(ra.checkPolicy({ agent, action: "read_docs" }).outcome).toBe("allow");
    ra.kill(agent.agentId);
    expect(ra.checkPolicy({ agent, action: "read_docs" }).outcome).toBe("deny");
    const fn = vi.fn(() => "blocked");
    await expect(ra.guard({ agent, action: "read_docs" }, fn)).rejects.toBeInstanceOf(
      AgentKilledError
    );
    expect(fn).not.toHaveBeenCalled();
    ra.close();
  });

  it("documented correct pattern uses guard for side effects", async () => {
    const ra = memoryPeffle(testPolicy());
    const fn = vi.fn(() => "done");
    const decision = ra.checkPolicy({ agent, action: "read_docs" });
    expect(decision.outcome).toBe("allow");
    const result = await ra.guard({ agent, action: "read_docs" }, fn);
    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledOnce();
    ra.close();
  });
});
