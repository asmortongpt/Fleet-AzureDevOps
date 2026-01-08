import { MCPServer } from "../types";

/**
 * Wire this to your Drizzle tables/services for vehicles, work orders, etc.
 * This stub is safe-by-default (read-only tools should be implemented first).
 */
export const fleetCoreMcpServer: MCPServer = {
  namespace: "fleet",
  listTools() {
    return ["listVehicles", "getVehicle", "getWorkOrders", "createWorkOrder"];
  },
  async call(toolName, args, userCtx) {
    if (toolName === "listVehicles") return { ok: true, result: { vehicles: [] } };
    if (toolName === "getVehicle") return { ok: true, result: { vehicle: null } };
    if (toolName === "getWorkOrders") return { ok: true, result: { workOrders: [] } };
    if (toolName === "createWorkOrder") return { ok: true, result: { id: "TODO" } };
    return { ok: false, error: `Unknown tool: ${toolName}` };
  },
};
