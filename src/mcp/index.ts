export {
  guardTool,
  PEFFLE_APPROVAL_PROTOCOL,
  type McpGuardOptions,
  type McpApprovalRequiredResult,
  type McpGuardToolResult,
} from "./adapter.js";
export {
  configureMcpRedemptionRegistry,
  consumeMcpRedemptionHandle,
  discardMcpRedemptionHandle,
  issueMcpRedemptionHandle,
  peekMcpRedemptionHandle,
  takeMcpRedemptionHandle,
} from "./redemption-registry.js";
