import { documentsMcpServer } from "./mcp/servers/documentsMcp";
import { fleetCoreMcpServer } from "./mcp/servers/fleetCoreMcp";
import { policyMcpServer } from "./mcp/servers/policyMcp";
import { registerServer } from "./mcp/toolRouter";

let initialized = false;

export function initAIPlatform() {
  if (initialized) return;
  registerServer(policyMcpServer);
  registerServer(fleetCoreMcpServer);
  registerServer(documentsMcpServer);
  initialized = true;
}
