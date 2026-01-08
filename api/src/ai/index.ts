import { registerServer } from "./mcp/toolRouter";
import { policyMcpServer } from "./mcp/servers/policyMcp";
import { fleetCoreMcpServer } from "./mcp/servers/fleetCoreMcp";
import { documentsMcpServer } from "./mcp/servers/documentsMcp";

let initialized = false;

export function initAIPlatform() {
  if (initialized) return;
  registerServer(policyMcpServer);
  registerServer(fleetCoreMcpServer);
  registerServer(documentsMcpServer);
  initialized = true;
}
