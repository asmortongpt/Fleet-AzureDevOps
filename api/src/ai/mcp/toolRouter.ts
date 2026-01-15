import { MCPServer, MCPToolResult } from "./types";

const servers: MCPServer[] = [];

export function registerServer(server: MCPServer) {
  servers.push(server);
}

export function listAllTools(): string[] {
  return servers.flatMap((s) => s.listTools().map((t) => `${s.namespace}.${t}`));
}

export async function callTool(fullToolName: string, args: any, userCtx: any): Promise<MCPToolResult> {
  const [namespace, toolName] = fullToolName.split(".");
  const server = servers.find((s) => s.namespace === namespace);
  if (!server) return { ok: false, error: `Unknown tool namespace: ${namespace}` };
  return server.call(toolName, args, userCtx);
}
