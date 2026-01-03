# Vehicle Inventory Emulator - Integration Instructions

## Overview
The Vehicle Inventory Emulator tracks per-vehicle equipment, manages expiration dates, handles inspections, and generates compliance alerts for all 50 fleet vehicles.

## Files Created

1. **VehicleInventoryEmulator.ts** - Main emulator class
2. **VehicleInventoryEmulator.test.ts** - Comprehensive test suite
3. **003_vehicle_inventory.sql** - Database migration
4. **INTEGRATION_INSTRUCTIONS.md** - This file

## Integration Steps

### Step 1: Update EmulatorOrchestrator.ts

Add the import at the top of the file (around line 33):

```typescript
import { VehicleInventoryEmulator } from './inventory/VehicleInventoryEmulator'
```

Add the private property (around line 52):

```typescript
private inventoryEmulator: VehicleInventoryEmulator | null = null
```

Add the initialization method after `initializeDispatchEmulator()` (around line 142):

```typescript
/**
 * Initialize the Vehicle Inventory Emulator
 */
private initializeInventoryEmulator(): void {
  this.inventoryEmulator = new VehicleInventoryEmulator(this.config)

  // Listen for inventory events
  this.inventoryEmulator.on('inventory-initialized', (data) => {
    this.emit('inventory', {
      type: 'inventory',
      event: 'initialized',
      vehicleId: data.vehicleId,
      timestamp: new Date(),
      data
    })
  })

  this.inventoryEmulator.on('compliance-alert', (alert) => {
    this.emit('inventory', {
      type: 'inventory',
      event: 'compliance-alert',
      vehicleId: alert.vehicleId,
      timestamp: new Date(),
      data: alert
    })
  })

  this.inventoryEmulator.on('inspection-completed', (inspection) => {
    this.emit('inventory', {
      type: 'inventory',
      event: 'inspection-completed',
      vehicleId: inspection.vehicleId,
      timestamp: new Date(),
      data: inspection
    })
  })

  console.log('Vehicle Inventory Emulator initialized')
}
```

Call the initialization in the constructor (around line 104):

```typescript
// Initialize Dispatch Emulator (system-wide, not per-vehicle)
this.initializeDispatchEmulator()

// Initialize Vehicle Inventory Emulator (system-wide)
this.initializeInventoryEmulator()
```

Update the `setupEventListeners()` method to include 'inventory' (around line 229):

```typescript
const eventTypes = [
  'gps', 'obd2', 'fuel', 'maintenance',
  'driver', 'route', 'cost', 'iot', 'radio', 'dispatch', 'dispatch-emergency', 'inventory'
]
```

Add inventory emulator to the `start()` method (around line 280):

```typescript
// Start inventory emulator
if (this.inventoryEmulator) {
  await this.inventoryEmulator.start()
}
```

Add inventory initialization for each vehicle in `startVehicleEmulators()` (around line 470):

```typescript
// Initialize vehicle inventory
if (this.inventoryEmulator && !this.inventoryEmulator.getVehicleInventory(vehicleId).length) {
  const vehicleType = vehicle.type || 'sedan'
  this.inventoryEmulator.initializeVehicleInventory(vehicleId, vehicleType, vehicle.vin)
}
```

Add to the `stop()` and `stopAllEmulators()` methods:

```typescript
// Stop inventory emulator
if (this.inventoryEmulator) {
  await this.inventoryEmulator.stop()
}
```

Add to `getStatus()` method:

```typescript
emulators: {
  // ... existing emulators ...
  inventory: this.inventoryEmulator?.getCurrentState().status || 'idle'
}
```

### Step 2: Run Database Migration

Execute the SQL migration:

```bash
psql -U your_db_user -d fleet_management -f /Users/andrewmorton/Documents/GitHub/fleet-local/api/database/migrations/003_vehicle_inventory.sql
```

Or use your migration tool:

```bash
npm run migrate:up
```

### Step 3: Run Tests

Execute the test suite:

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
npm test src/emulators/inventory/__tests__/VehicleInventoryEmulator.test.ts
```

Or run all tests:

```bash
npm test
```

## Usage Examples

### Initialize Inventory for All Vehicles

```typescript
import { EmulatorOrchestrator } from './EmulatorOrchestrator'
import { VehicleEmulator } from './VehicleEmulator'

const orchestrator = new EmulatorOrchestrator()
const vehicleEmulator = VehicleEmulator.getInstance()

// Get all vehicles
const vehicles = vehicleEmulator.getAll()

// The inventory emulator will automatically initialize when vehicles are started
await orchestrator.start()
```

### Get Vehicle Inventory

```typescript
const vehicleId = 'vehicle-001'
const inventory = orchestrator.inventoryEmulator?.getVehicleInventory(vehicleId)

console.log(`Vehicle ${vehicleId} has ${inventory.length} items`)
inventory.forEach(item => {
  console.log(`- ${item.equipmentType}: ${item.complianceStatus}`)
})
```

### Get Compliance Summary

```typescript
const summary = orchestrator.inventoryEmulator?.getVehicleSummary('vehicle-001')

console.log(`Compliance Rate: ${summary?.complianceRate}%`)
console.log(`Expiring within 30 days: ${summary?.expiringWithin30Days}`)
console.log(`Active Alerts: ${summary?.activeAlerts}`)
```

### Conduct Inspection

```typescript
const inspection = orchestrator.inventoryEmulator?.conductInspection(
  'vehicle-001',
  'inspector-123',
  'John Smith',
  'annual'
)

console.log(`Inspection Complete: ${inspection?.overallCompliance}% compliant`)
console.log(`Findings: ${inspection?.findings.length}`)
```

### Get Compliance Alerts

```typescript
const alerts = orchestrator.inventoryEmulator?.getVehicleAlerts('vehicle-001')

alerts?.forEach(alert => {
  console.log(`[${alert.severity}] ${alert.message}`)
  console.log(`  Due: ${alert.dueDate.toLocaleDateString()}`)
})
```

### Listen to Events

```typescript
orchestrator.on('inventory', (event) => {
  switch (event.event) {
    case 'initialized':
      console.log(`Inventory initialized for vehicle ${event.vehicleId}`)
      break
    case 'compliance-alert':
      console.log(`Compliance alert: ${event.data.message}`)
      break
    case 'inspection-completed':
      console.log(`Inspection completed for vehicle ${event.vehicleId}`)
      break
  }
})
```

## API Endpoints to Create

### GET /api/vehicles/:vehicleId/inventory
Returns all inventory items for a vehicle.

```typescript
app.get('/api/vehicles/:vehicleId/inventory', (req, res) => {
  const inventory = orchestrator.inventoryEmulator?.getVehicleInventory(req.params.vehicleId)
  res.json(inventory)
})
```

### GET /api/vehicles/:vehicleId/inventory/summary
Returns inventory summary and compliance metrics.

```typescript
app.get('/api/vehicles/:vehicleId/inventory/summary', (req, res) => {
  const summary = orchestrator.inventoryEmulator?.getVehicleSummary(req.params.vehicleId)
  res.json(summary)
})
```

### GET /api/vehicles/:vehicleId/inventory/alerts
Returns active compliance alerts.

```typescript
app.get('/api/vehicles/:vehicleId/inventory/alerts', (req, res) => {
  const alerts = orchestrator.inventoryEmulator?.getVehicleAlerts(req.params.vehicleId)
  res.json(alerts)
})
```

### POST /api/vehicles/:vehicleId/inventory/inspect
Conduct an inventory inspection.

```typescript
app.post('/api/vehicles/:vehicleId/inventory/inspect', (req, res) => {
  const { inspectorId, inspectorName, inspectionType } = req.body
  const inspection = orchestrator.inventoryEmulator?.conductInspection(
    req.params.vehicleId,
    inspectorId,
    inspectorName,
    inspectionType
  )
  res.json(inspection)
})
```

### GET /api/vehicles/:vehicleId/inventory/inspections
Returns inspection history.

```typescript
app.get('/api/vehicles/:vehicleId/inventory/inspections', (req, res) => {
  const inspections = orchestrator.inventoryEmulator?.getVehicleInspections(req.params.vehicleId)
  res.json(inspections)
})
```

## Security Notes

1. **Parameterized Queries**: All database operations use parameterized queries ($1, $2, etc.)
2. **Input Validation**: Validate all user inputs before processing
3. **Access Control**: Implement role-based access control for inspection and alert acknowledgment
4. **Audit Logging**: All changes are logged with user ID, timestamp, and IP address
5. **Data Encryption**: Sensitive data should be encrypted at rest and in transit

## Testing

The emulator includes comprehensive tests covering:
- Lifecycle management (start, stop, pause, resume)
- Inventory initialization for all vehicle types
- Equipment property generation
- Compliance tracking
- Inspection workflows
- Alert system
- Multi-vehicle management
- Edge cases

Run tests with:
```bash
npm test src/emulators/inventory/__tests__/VehicleInventoryEmulator.test.ts
```

## Database Schema

The migration creates the following tables:
- `vehicle_inventory_items` - Equipment items per vehicle
- `vehicle_inventory_inspections` - Inspection records
- `vehicle_inventory_findings` - Inspection findings
- `vehicle_inventory_corrective_actions` - Corrective action tracking
- `vehicle_inventory_alerts` - Compliance alerts

Plus views and functions for common queries and compliance calculations.

## Next Steps

1. Integrate with EmulatorOrchestrator as shown above
2. Run database migration
3. Run tests to verify functionality
4. Create API endpoints
5. Build UI components for inventory management
6. Set up automated compliance alerts
7. Configure scheduled compliance checks (daily/weekly)

## Support

For questions or issues, refer to:
- VehicleInventoryEmulator.ts - Main implementation
- VehicleInventoryEmulator.test.ts - Usage examples
- 003_vehicle_inventory.sql - Database schema
