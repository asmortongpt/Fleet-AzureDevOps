import { MCPServer } from "../types";

/**
 * Wire this to your policy engine (e.g., src/lib/policy-engine)
 * This stub keeps the interface stable.
 */
export const policyMcpServer: MCPServer = {
  namespace: "policy",
  listTools() {
    return ["search", "getControl", "validateAction"];
  },
  async call(toolName, args, userCtx) {
    if (toolName === "search") return { ok: true, result: { matches: [] } };
    if (toolName === "getControl") return { ok: true, result: { controlId: args.controlId, text: "TODO" } };
    if (toolName === "validateAction") return { ok: true, result: { allowed: true, reason: "TODO" } };
    return { ok: false, error: `Unknown tool: ${toolName}` };
  },
};
