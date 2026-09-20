import type { ActionEvent, PolicyConfig } from "../core/types.js";

export type PeffleToolName =
  | "getPolicy"
  | "proposePolicyChange"
  | "validatePolicy"
  | "getPolicyDiff"
  | "applyPolicy"
  | "listPendingApprovals"
  | "approveAction"
  | "denyAction"
  | "getLedger"
  | "killAgent"
  | "reviveAgent"
  | "getAgentStatus"
  | "listKnownActions";

export interface PeffleToolCall {
  name: PeffleToolName;
  arguments: Record<string, unknown>;
}

export interface PeffleContext {
  policyPath: string;
  storagePath: string;
  policy: PolicyConfig;
  pendingApprovals: ActionEvent[];
  recentLedger: ActionEvent[];
  knownActions: string[];
  agentStatuses: { agentId: string; status: "active" | "killed" | "unknown" }[];
  capabilities: string[];
}

export interface PeffleAIResponse {
  message: string;
  toolCalls?: PeffleToolCall[];
}

export interface PeffleAIProvider {
  readonly id: string;
  chat(input: string, context: PeffleContext): Promise<PeffleAIResponse>;
}

export interface ProposedPolicyChange {
  policy: PolicyConfig;
  summary: string;
}
