# Fleet CTA MCP Server

A comprehensive Model Context Protocol (MCP) server that exposes Fleet CTA's enterprise fleet management capabilities through well-designed tools.

## Overview

This MCP server provides programmatic access to Fleet CTA's backend API, enabling AI assistants and LLMs to interact with fleet management data including vehicles, drivers, maintenance, compliance, analytics, and routing.

**Features:**
- 23 production-ready tools organized into 6 categories
- Full TypeScript type safety
- Comprehensive error handling
- Support for both JSON and Markdown response formats
- Pagination support for large datasets
- Environment-based configuration

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Fleet CTA API running (default: http://localhost:3001/api)

### Install Dependencies

```bash
cd mcp-server
npm install
```

### Build

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript in `dist/`
- Generate type declarations
- Make the binary executable

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Fleet CTA API URL (default: http://localhost:3001/api)
FLEET_API_URL=http://localhost:3001/api

# API timeout in milliseconds (default: 30000)
FLEET_API_TIMEOUT=30000
```

## Usage

### Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Or use the binary directly
./dist/index.js
```

### Using with MCP Inspector

Test your server with the MCP Inspector tool:

```bash
npm run inspector
```

### Claude Desktop Integration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fleet-cta": {
      "command": "node",
      "args": ["/path/to/Fleet-CTA/mcp-server/dist/index.js"],
      "env": {
        "FLEET_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

## Available Tools

### Vehicle Management (5 tools)

#### `fleet_list_vehicles`
List all vehicles with filtering and pagination.

**Parameters:**
- `status` (optional): Filter by status (active, maintenance, retired, reserved)
- `type` (optional): Filter by vehicle type
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 50, max: 500)
- `response_format` (optional): json or markdown (default: json)

**Example:**
```json
{
  "status": "active",
  "page": 1,
  "pageSize": 20,
  "response_format": "json"
}
```

#### `fleet_get_vehicle`
Get detailed information about a specific vehicle.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

#### `fleet_get_vehicle_location`
Get real-time GPS location for a vehicle.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

#### `fleet_get_vehicle_status`
Get current operational status of a vehicle.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

#### `fleet_get_vehicle_telemetry`
Get telematics data (fuel, diagnostics, sensors).

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

### Driver Management (4 tools)

#### `fleet_list_drivers`
List all drivers with filtering.

**Parameters:**
- `status` (optional): active, inactive, suspended
- `page` (optional): Page number
- `pageSize` (optional): Results per page
- `response_format` (optional): json or markdown

#### `fleet_get_driver`
Get detailed driver information.

**Parameters:**
- `driver_id` (required): Driver ID
- `response_format` (optional): json or markdown

#### `fleet_get_driver_schedule`
Get driver assignments and schedule.

**Parameters:**
- `driver_id` (required): Driver ID
- `response_format` (optional): json or markdown

#### `fleet_get_driver_safety_score`
Get safety metrics and violation history.

**Parameters:**
- `driver_id` (required): Driver ID
- `response_format` (optional): json or markdown

### Maintenance (4 tools)

#### `fleet_list_maintenance_schedules`
List upcoming maintenance schedules.

**Parameters:**
- `vehicle_id` (optional): Filter by vehicle
- `status` (optional): scheduled, completed, overdue, cancelled
- `upcoming_days` (optional): Filter by upcoming days (max: 365)
- `response_format` (optional): json or markdown

#### `fleet_get_maintenance_history`
Get complete maintenance history for a vehicle.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

#### `fleet_get_service_recommendations`
Get AI-powered maintenance predictions.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `response_format` (optional): json or markdown

#### `fleet_create_work_order`
Create a new maintenance work order.

**Parameters:**
- `vehicle_id` (required): Vehicle ID
- `description` (required): Work order description (1-1000 chars)
- `priority` (required): low, medium, high, critical
- `scheduled_date` (optional): Date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

### Compliance (3 tools)

#### `fleet_get_compliance_status`
Get overall fleet compliance dashboard.

**Parameters:**
- `response_format` (optional): json or markdown

#### `fleet_list_inspections`
List vehicle inspections.

**Parameters:**
- `vehicle_id` (optional): Filter by vehicle
- `status` (optional): scheduled, completed, failed, pending
- `from_date` (optional): Start date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

#### `fleet_get_violations`
Get safety and compliance violations.

**Parameters:**
- `vehicle_id` (optional): Filter by vehicle
- `driver_id` (optional): Filter by driver
- `from_date` (optional): Start date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

### Analytics & Reporting (4 tools)

#### `fleet_get_fleet_stats`
Get high-level fleet statistics.

**Parameters:**
- `response_format` (optional): json or markdown

#### `fleet_get_cost_analysis`
Get detailed cost breakdown.

**Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `vehicle_id` (optional): Filter by specific vehicle
- `response_format` (optional): json or markdown

#### `fleet_get_utilization_report`
Get vehicle utilization metrics.

**Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

#### `fleet_get_fuel_efficiency`
Get fuel consumption analysis.

**Parameters:**
- `vehicle_id` (optional): Filter by vehicle
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

### Route & Dispatch (3 tools)

#### `fleet_list_routes`
List active routes.

**Parameters:**
- `status` (optional): scheduled, in_progress, completed, cancelled
- `driver_id` (optional): Filter by driver
- `date` (optional): Filter by date in YYYY-MM-DD format
- `response_format` (optional): json or markdown

#### `fleet_get_route_details`
Get detailed route information.

**Parameters:**
- `route_id` (required): Route ID
- `response_format` (optional): json or markdown

#### `fleet_optimize_route`
Get route optimization suggestions.

**Parameters:**
- `start_location` (required): Starting address or coordinates
- `end_location` (required): Ending address or coordinates
- `waypoints` (optional): Array of intermediate stops
- `response_format` (optional): json or markdown

## API Endpoint Mapping

| Tool | Fleet CTA API Endpoint |
|------|----------------------|
| `fleet_list_vehicles` | `GET /api/vehicles` |
| `fleet_get_vehicle` | `GET /api/vehicles/:id` |
| `fleet_get_vehicle_location` | `GET /api/vehicles/:id` (location field) |
| `fleet_get_vehicle_status` | `GET /api/vehicles/:id` (status field) |
| `fleet_get_vehicle_telemetry` | `GET /api/vehicles/:id/telemetry` |
| `fleet_list_drivers` | `GET /api/drivers` |
| `fleet_get_driver` | `GET /api/drivers/:id` |
| `fleet_get_driver_schedule` | `GET /api/drivers/:id/schedule` |
| `fleet_get_driver_safety_score` | `GET /api/drivers/:id` (safety_score) |
| `fleet_list_maintenance_schedules` | `GET /api/maintenance-schedules` |
| `fleet_get_maintenance_history` | `GET /api/vehicles/:id/maintenance-history` |
| `fleet_get_service_recommendations` | `GET /api/vehicles/:id/service-recommendations` |
| `fleet_create_work_order` | `POST /api/work-orders` |
| `fleet_get_compliance_status` | `GET /api/compliance/status` |
| `fleet_list_inspections` | `GET /api/inspections` |
| `fleet_get_violations` | `GET /api/compliance/violations` |
| `fleet_get_fleet_stats` | `GET /api/stats` |
| `fleet_get_cost_analysis` | `GET /api/analytics/costs` |
| `fleet_get_utilization_report` | `GET /api/analytics/utilization` |
| `fleet_get_fuel_efficiency` | `GET /api/analytics/fuel-efficiency` |
| `fleet_list_routes` | `GET /api/routes` |
| `fleet_get_route_details` | `GET /api/routes/:id` |
| `fleet_optimize_route` | `POST /api/routes/optimize` |

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts              # Server initialization
│   ├── constants.ts          # Configuration constants
│   ├── types.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── api-client.ts     # Fleet CTA API client
│   │   └── error-handler.ts  # Error handling utilities
│   ├── schemas/
│   │   └── common.ts         # Zod schemas
│   └── tools/
│       ├── vehicles.ts       # Vehicle management tools
│       ├── drivers.ts        # Driver management tools
│       ├── maintenance.ts    # Maintenance tools
│       ├── compliance.ts     # Compliance tools
│       ├── analytics.ts      # Analytics tools
│       └── routes.ts         # Route tools
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Type Checking

```bash
npm run typecheck
```

### Adding New Tools

1. Define the tool function and schema in appropriate `tools/*.ts` file
2. Export the function and schema
3. Register the tool in `src/index.ts` using `server.registerTool()`
4. Update this README with tool documentation

## Error Handling

All tools include comprehensive error handling:

- Network errors are caught and returned as formatted error messages
- HTTP errors include status codes and API error messages
- All errors are returned in the requested format (JSON or Markdown)
- Validation errors from Zod schemas provide clear feedback

## Testing

### Prerequisites

Ensure Fleet CTA API is running:

```bash
# In Fleet-CTA root directory
cd api
npm start
```

### Test with MCP Inspector

```bash
npm run inspector
```

### Manual Testing

```bash
# Start server
npm run dev

# In another terminal, test with stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## License

MIT

## Author

Capital Technology Alliance

## Support

For issues and questions, please refer to the main Fleet CTA documentation or contact the development team.
