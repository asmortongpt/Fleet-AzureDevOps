# Fleet CTA MCP Server - Quick Start Guide

Get up and running with the Fleet CTA MCP Server in 5 minutes.

## Prerequisites

- Node.js >= 18.0.0
- Fleet CTA API running on http://localhost:3001 (or configure different URL)

## Installation

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/mcp-server
npm install
npm run build
```

## Test the Server

```bash
# Start the server
npm start

# In another terminal, list available tools:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Configure Claude Desktop

1. Open Claude Desktop configuration:
   ```bash
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add Fleet CTA server:
   ```json
   {
     "mcpServers": {
       "fleet-cta": {
         "command": "node",
         "args": ["/Users/andrewmorton/Documents/GitHub/Fleet-CTA/mcp-server/dist/index.js"],
         "env": {
           "FLEET_API_URL": "http://localhost:3001/api"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

4. Test by asking Claude: "List all vehicles in the fleet"

## Example Tool Calls

### List Vehicles
```typescript
{
  "name": "fleet_list_vehicles",
  "arguments": {
    "status": "active",
    "pageSize": 10,
    "response_format": "json"
  }
}
```

### Get Vehicle Details
```typescript
{
  "name": "fleet_get_vehicle",
  "arguments": {
    "vehicle_id": 1,
    "response_format": "json"
  }
}
```

### Get Fleet Statistics
```typescript
{
  "name": "fleet_get_fleet_stats",
  "arguments": {
    "response_format": "json"
  }
}
```

### Create Work Order
```typescript
{
  "name": "fleet_create_work_order",
  "arguments": {
    "vehicle_id": 1,
    "description": "Replace brake pads",
    "priority": "high",
    "scheduled_date": "2026-02-15",
    "response_format": "json"
  }
}
```

## Environment Variables

```bash
# Fleet CTA API base URL (default: http://localhost:3001/api)
export FLEET_API_URL="http://localhost:3001/api"

# API timeout in milliseconds (default: 30000)
export FLEET_API_TIMEOUT=30000
```

## Available Tools (23 Total)

### Vehicle Management
- fleet_list_vehicles
- fleet_get_vehicle
- fleet_get_vehicle_location
- fleet_get_vehicle_status
- fleet_get_vehicle_telemetry

### Driver Management
- fleet_list_drivers
- fleet_get_driver
- fleet_get_driver_schedule
- fleet_get_driver_safety_score

### Maintenance
- fleet_list_maintenance_schedules
- fleet_get_maintenance_history
- fleet_get_service_recommendations
- fleet_create_work_order

### Compliance
- fleet_get_compliance_status
- fleet_list_inspections
- fleet_get_violations

### Analytics
- fleet_get_fleet_stats
- fleet_get_cost_analysis
- fleet_get_utilization_report
- fleet_get_fuel_efficiency

### Routes
- fleet_list_routes
- fleet_get_route_details
- fleet_optimize_route

## Troubleshooting

### Server won't start
```bash
# Check if API is running
curl http://localhost:3001/api/stats

# Check Node version
node --version  # Should be >= 18.0.0

# Rebuild
npm run build
```

### Tool returns errors
```bash
# Check API connectivity
curl http://localhost:3001/api/vehicles

# Check environment variables
echo $FLEET_API_URL

# View server logs (stderr)
npm start 2>&1 | tee server.log
```

### Claude Desktop doesn't see the server
1. Check configuration path is absolute
2. Restart Claude Desktop completely
3. Check server builds without errors: `npm run build`
4. Test server manually: `node dist/index.js`

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- Browse tool implementations in `src/tools/`
- Test with MCP Inspector: `npm run inspector`

## Support

For issues, refer to:
- README.md - Comprehensive documentation
- IMPLEMENTATION_SUMMARY.md - Technical implementation details
- src/ directory - Source code with comments
