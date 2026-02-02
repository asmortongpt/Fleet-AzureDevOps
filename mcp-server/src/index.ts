#!/usr/bin/env node

/**
 * Fleet CTA MCP Server
 *
 * Model Context Protocol server providing Fleet CTA capabilities through well-designed tools.
 * Exposes vehicle management, driver management, maintenance, compliance, analytics, and routing.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';

// Vehicle Management Tools
import * as vehicleTools from './tools/vehicles.js';
// Driver Management Tools
import * as driverTools from './tools/drivers.js';
// Maintenance Tools
import * as maintenanceTools from './tools/maintenance.js';
// Compliance Tools
import * as complianceTools from './tools/compliance.js';
// Analytics Tools
import * as analyticsTools from './tools/analytics.js';
// Route Tools
import * as routeTools from './tools/routes.js';

// Create MCP server instance
const server = new McpServer(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Vehicle Management Tools
server.tool(
  'fleet_list_vehicles',
  'List all vehicles in the fleet with optional filtering by status, type, and pagination.',
  vehicleTools.listVehiclesSchema.shape,
  async (params: unknown) => {
    const result = await vehicleTools.listVehicles(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_vehicle',
  'Get detailed information about a specific vehicle by ID.',
  vehicleTools.getVehicleSchema.shape,
  async (params: unknown) => {
    const result = await vehicleTools.getVehicle(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_vehicle_location',
  'Get real-time GPS location for a specific vehicle.',
  vehicleTools.getVehicleLocationSchema.shape,
  async (params: unknown) => {
    const result = await vehicleTools.getVehicleLocation(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_vehicle_status',
  'Get current operational status of a vehicle (active, maintenance, reserved, retired).',
  vehicleTools.getVehicleStatusSchema.shape,
  async (params: unknown) => {
    const result = await vehicleTools.getVehicleStatus(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_vehicle_telemetry',
  'Get telematics data for a vehicle including fuel level, engine diagnostics, and sensor data.',
  vehicleTools.getVehicleTelemetrySchema.shape,
  async (params: unknown) => {
    const result = await vehicleTools.getVehicleTelemetry(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Register Driver Management Tools
server.tool(
  'fleet_list_drivers',
  'List all drivers with optional filtering by status and pagination.',
  driverTools.listDriversSchema.shape,
  async (params: unknown) => {
    const result = await driverTools.listDrivers(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_driver',
  'Get detailed information about a specific driver by ID.',
  driverTools.getDriverSchema.shape,
  async (params: unknown) => {
    const result = await driverTools.getDriver(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_driver_schedule',
  'Get driver assignments and schedule.',
  driverTools.getDriverScheduleSchema.shape,
  async (params: unknown) => {
    const result = await driverTools.getDriverSchedule(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_driver_safety_score',
  'Get safety metrics and violation history for a driver.',
  driverTools.getDriverSafetyScoreSchema.shape,
  async (params: unknown) => {
    const result = await driverTools.getDriverSafetyScore(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Register Maintenance Tools
server.tool(
  'fleet_list_maintenance_schedules',
  'List upcoming maintenance schedules with optional filtering.',
  maintenanceTools.listMaintenanceSchedulesSchema.shape,
  async (params: unknown) => {
    const result = await maintenanceTools.listMaintenanceSchedules(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_maintenance_history',
  'Get complete maintenance history for a vehicle.',
  maintenanceTools.getMaintenanceHistorySchema.shape,
  async (params: unknown) => {
    const result = await maintenanceTools.getMaintenanceHistory(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_service_recommendations',
  'Get AI-powered maintenance predictions and service recommendations for a vehicle.',
  maintenanceTools.getServiceRecommendationsSchema.shape,
  async (params: unknown) => {
    const result = await maintenanceTools.getServiceRecommendations(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_create_work_order',
  'Create a new maintenance work order for a vehicle.',
  maintenanceTools.createWorkOrderSchema.shape,
  async (params: unknown) => {
    const result = await maintenanceTools.createWorkOrder(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Register Compliance Tools
server.tool(
  'fleet_get_compliance_status',
  'Get overall fleet compliance dashboard.',
  complianceTools.getComplianceStatusSchema.shape,
  async (params: unknown) => {
    const result = await complianceTools.getComplianceStatus(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_list_inspections',
  'List vehicle inspections with optional filtering.',
  complianceTools.listInspectionsSchema.shape,
  async (params: unknown) => {
    const result = await complianceTools.listInspections(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_violations',
  'Get safety and compliance violations.',
  complianceTools.getViolationsSchema.shape,
  async (params: unknown) => {
    const result = await complianceTools.getViolations(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Register Analytics & Reporting Tools
server.tool(
  'fleet_get_fleet_stats',
  'Get high-level fleet statistics.',
  analyticsTools.getFleetStatsSchema.shape,
  async (params: unknown) => {
    const result = await analyticsTools.getFleetStats(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_cost_analysis',
  'Get detailed cost breakdown and analytics.',
  analyticsTools.getCostAnalysisSchema.shape,
  async (params: unknown) => {
    const result = await analyticsTools.getCostAnalysis(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_utilization_report',
  'Get vehicle utilization metrics.',
  analyticsTools.getUtilizationReportSchema.shape,
  async (params: unknown) => {
    const result = await analyticsTools.getUtilizationReport(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_fuel_efficiency',
  'Get fuel consumption analysis and efficiency metrics.',
  analyticsTools.getFuelEfficiencySchema.shape,
  async (params: unknown) => {
    const result = await analyticsTools.getFuelEfficiency(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Register Route & Dispatch Tools
server.tool(
  'fleet_list_routes',
  'List active routes with optional filtering.',
  routeTools.listRoutesSchema.shape,
  async (params: unknown) => {
    const result = await routeTools.listRoutes(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_get_route_details',
  'Get detailed information about a specific route.',
  routeTools.getRouteDetailsSchema.shape,
  async (params: unknown) => {
    const result = await routeTools.getRouteDetails(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'fleet_optimize_route',
  'Get route optimization suggestions for a trip.',
  routeTools.optimizeRouteSchema.shape,
  async (params: unknown) => {
    const result = await routeTools.optimizeRoute(params as never);
    return { content: [{ type: 'text', text: result }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fleet CTA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
