import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPeffle } from "../core/index.js";
import type { Peffle, PolicyConfig } from "../core/types.js";
import { parsePolicyConfig } from "../core/schema.js";
import type { ToolSession } from "../ai/tools.js";
import { loadPolicyFile } from "../ai/tools.js";

export interface ChatSessionOptions {
  storagePath?: string;
  policyPath?: string;
}

export class ChatSession implements ToolSession {
  peffle: Peffle;
  readonly policyPath: string;
  readonly storagePath: string;
  private policy: PolicyConfig;
  pendingProposedPolicy: PolicyConfig | null = null;
  pendingKillAgentId: string | null = null;

  constructor(opts: ChatSessionOptions = {}) {
    this.storagePath = resolve(opts.storagePath ?? process.env.PEFFLE_STORAGE ?? "./.peffle/ledger.db");
    this.policyPath = resolve(opts.policyPath ?? process.env.PEFFLE_POLICY ?? "./peffle.policy.json");
    this.policy = this.readPolicyFromDisk();
    this.peffle = createPeffle({
      storagePath: this.storagePath,
      policyPath: this.policyPath,
      policy: this.policy,
    });
  }

  getPolicy(): PolicyConfig {
    return this.policy;
  }

  setPolicy(policy: PolicyConfig): void {
    this.policy = policy;
  }

  reloadPeffle(): void {
    this.peffle.close();
    this.peffle = createPeffle({
      storagePath: this.storagePath,
      policyPath: this.policyPath,
      policy: this.policy,
    });
  }

  readPolicyFromDisk(): PolicyConfig {
    try {
      return loadPolicyFile(this.policyPath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        return parsePolicyConfig({
          version: 1,
          defaults: { onNoMatchingRule: "deny" },
          budgets: [],
          actions: [],
        });
      }
      throw e;
    }
  }

  refreshPolicyFromDisk(): void {
    this.policy = this.readPolicyFromDisk();
    this.reloadPeffle();
  }

  close(): void {
    this.peffle.close();
  }
}

export { renderBanner } from "./banner.js";
export { peffleSay } from "./present.js";

export function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.1.1";
  }
}
