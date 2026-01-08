import { callTool } from "../mcp/toolRouter";

export async function executeStep(step: any, userCtx: any) {
  if (!step.toolCall) return { ok: true, result: "No tool call" };
  return callTool(step.toolCall.tool, step.toolCall.args, userCtx);
}
