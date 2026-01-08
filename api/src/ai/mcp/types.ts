export type MCPToolCall = {
  tool: string; // e.g. "policy.search"
  args: Record<string, any>;
};

export type MCPToolResult = {
  ok: boolean;
  result?: any;
  error?: string;
};

export type MCPServer = {
  namespace: string;
  listTools(): string[];
  call(toolName: string, args: any, userCtx: any): Promise<MCPToolResult>;
};
