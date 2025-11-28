# Vehicle Inventory Emulator

A comprehensive per-vehicle inventory management and compliance tracking system for fleet operations, compliant with Fortune 50 security standards.

## Features

### Core Functionality
- **Per-Vehicle Inventory Tracking**: Manages equipment assignments for all 50 vehicles
- **Expiration Management**: Tracks expiration dates for time-sensitive equipment
- **Inspection Scheduling**: Automated inspection interval tracking
- **Compliance Monitoring**: Real-time compliance status for regulatory requirements
- **Alert System**: Proactive alerts for expiring items and overdue inspections
- **Inspection Workflows**: Complete inspection recording with findings and corrective actions

### Equipment Categories
- **Safety**: Fire extinguishers, safety cones, reflective triangles, safety vests
- **Emergency**: Flares, flashlights, emergency blankets, roadside kits
- **Medical**: First aid kits (basic, comprehensive, industrial)
- **Tools**: Jumper cables, tool kits, tire pressure gauges
- **Communication**: Radio equipment, emergency beacons
- **Specialty**: Vehicle-specific equipment (EV charging cables, tow straps, cargo straps)

### Vehicle Type Templates
The emulator includes pre-configured equipment templates for:
- **Sedan**: 8 standard items
- **SUV**: 10 items including roadside emergency kit
- **Truck**: 14 items with DOT/FMCSA compliance requirements
- **Van**: 11 items optimized for cargo operations
- **EV**: 10 items including specialized charging equipment

### Regulatory Compliance
Tracks compliance with:
- DOT (Department of Transportation)
- FMCSA (Federal Motor Carrier Safety Administration)
- OSHA (Occupational Safety and Health Administration)
- EPA (Environmental Protection Agency)

## Architecture

### Data Models

#### EquipmentItem
```typescript
{
  id: string
  vehicleId: string
  equipmentType: string
  category: EquipmentCategory
  manufacturer: string
  modelNumber: string
  serialNumber: string
  quantity: number
  unitCost: number
  totalValue: number
  purchaseDate: Date
  installDate: Date
  warrantyExpiration?: Date
  condition: EquipmentCondition
  location: string
  hasExpiration: boolean
  expirationDate?: Date
  requiresInspection: boolean
  lastInspectionDate?: Date
  nextInspectionDate?: Date
  inspectionIntervalDays?: number
  complianceStatus: ComplianceStatus
  requiredByRegulation?: string[]
  isRequired: boolean
  lastCheckedBy?: string
  lastCheckedDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

#### InventoryInspection
```typescript
{
  id: string
  vehicleId: string
  inspectorId: string
  inspectorName: string
  inspectionDate: Date
  inspectionType: 'routine' | 'annual' | 'incident' | 'audit'
  itemsInspected: number
  itemsCompliant: number
  itemsNonCompliant: number
  itemsMissing: number
  overallCompliance: number
  findings: InventoryFinding[]
  correctiveActions: CorrectiveAction[]
  signatureData?: string
  status: 'completed' | 'pending_review' | 'approved'
  approvedBy?: string
  approvedDate?: Date
  nextInspectionDue: Date
  createdAt: Date
}
```

#### ComplianceAlert
```typescript
{
  id: string
  vehicleId: string
  equipmentId: string
  alertType: 'expiration_warning' | 'inspection_due' | 'missing_equipment' | 'regulatory_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  dueDate: Date
  daysUntilDue: number
  notificationsSent: number
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedDate?: Date
  createdAt: Date
}
```

#### VehicleInventorySummary
```typescript
{
  vehicleId: string
  vehicleVin: string
  totalItems: number
  totalValue: number
  complianceRate: number
  itemsByCategory: Record<EquipmentCategory, number>
  itemsByCondition: Record<EquipmentCondition, number>
  expiringWithin30Days: number
  expiringWithin90Days: number
  inspectionsDue: number
  activeAlerts: number
  criticalAlerts: number
  lastInspectionDate?: Date
  nextInspectionDate?: Date
  updatedAt: Date
}
```

## Usage

### Basic Setup

```typescript
import { VehicleInventoryEmulator } from './inventory/VehicleInventoryEmulator'
import { EmulatorConfig } from '../types'

const config: EmulatorConfig = {
  // ... configuration
}

const emulator = new VehicleInventoryEmulator(config)
await emulator.start()
```

### Initialize Vehicle Inventory

```typescript
const vehicleId = 'vehicle-001'
const vehicleType = 'truck'
const vehicleVin = '1FTFW1ET5DFC10312'

const items = emulator.initializeVehicleInventory(vehicleId, vehicleType, vehicleVin)
console.log(`Initialized ${items.length} inventory items`)
```

### Retrieve Inventory

```typescript
const inventory = emulator.getVehicleInventory('vehicle-001')
inventory.forEach(item => {
  console.log(`${item.equipmentType}: ${item.complianceStatus}`)
  if (item.expirationDate) {
    console.log(`  Expires: ${item.expirationDate.toLocaleDateString()}`)
  }
})
```

### Get Compliance Summary

```typescript
const summary = emulator.getVehicleSummary('vehicle-001')
console.log(`Compliance Rate: ${summary?.complianceRate}%`)
console.log(`Total Value: $${summary?.totalValue.toFixed(2)}`)
console.log(`Items expiring within 30 days: ${summary?.expiringWithin30Days}`)
console.log(`Active alerts: ${summary?.activeAlerts}`)
```

### Conduct Inspection

```typescript
const inspection = emulator.conductInspection(
  'vehicle-001',
  'inspector-123',
  'John Doe',
  'annual'
)

console.log(`Overall Compliance: ${inspection.overallCompliance}%`)
console.log(`Items Inspected: ${inspection.itemsInspected}`)
console.log(`Non-Compliant Items: ${inspection.itemsNonCompliant}`)

inspection.findings.forEach(finding => {
  console.log(`[${finding.severity}] ${finding.description}`)
  console.log(`  Action: ${finding.requiredAction}`)
})
```

### Monitor Alerts

```typescript
const alerts = emulator.getVehicleAlerts('vehicle-001')
alerts.forEach(alert => {
  if (alert.severity === 'critical') {
    console.log(`🚨 CRITICAL: ${alert.message}`)
  } else {
    console.log(`⚠️  ${alert.severity}: ${alert.message}`)
  }
  console.log(`   Due: ${alert.dueDate.toLocaleDateString()} (${alert.daysUntilDue} days)`)
})
```

### Event Handling

```typescript
// Inventory initialized
emulator.on('inventory-initialized', (data) => {
  console.log(`Inventory initialized for ${data.vehicleId}`)
  console.log(`${data.itemCount} items, value: $${data.totalValue}`)
})

// Compliance alert
emulator.on('compliance-alert', (alert) => {
  if (alert.severity === 'critical') {
    sendNotification(alert)
  }
  logAlert(alert)
})

// Inspection completed
emulator.on('inspection-completed', (inspection) => {
  console.log(`Inspection ${inspection.id} completed`)
  console.log(`Compliance: ${inspection.overallCompliance}%`)
  if (inspection.findings.length > 0) {
    generateReport(inspection)
  }
})
```

## Database Integration

The emulator works with the following database tables (created by migration):

- `vehicle_inventory_items`
- `vehicle_inventory_inspections`
- `vehicle_inventory_findings`
- `vehicle_inventory_corrective_actions`
- `vehicle_inventory_alerts`

See `003_vehicle_inventory.sql` for complete schema.

## Testing

Comprehensive test suite covers:
- ✅ Lifecycle management (start, stop, pause, resume)
- ✅ Inventory initialization for all vehicle types
- ✅ Equipment property generation (manufacturer, serial numbers, etc.)
- ✅ Expiration date tracking
- ✅ Inspection date management
- ✅ Compliance status calculation
- ✅ Alert generation
- ✅ Inspection workflows
- ✅ Multi-vehicle support
- ✅ Edge cases and error handling

Run tests:
```bash
npm test src/emulators/inventory/__tests__/VehicleInventoryEmulator.test.ts
```

## Security

### Implemented Security Features
- ✅ Parameterized queries (no SQL injection)
- ✅ Input validation on all public methods
- ✅ Type safety with TypeScript
- ✅ Audit trail for all changes
- ✅ No hardcoded secrets
- ✅ Role-based access control ready
- ✅ Data encryption support

### Security Best Practices
1. Always validate user input before processing
2. Use environment variables for sensitive configuration
3. Implement proper authentication/authorization
4. Log all inspection and alert acknowledgments
5. Encrypt sensitive data at rest and in transit
6. Follow least privilege principle for database access

## Performance

### Optimizations
- Efficient in-memory data structures (Map-based)
- Lazy loading of inventory data
- Batch compliance checks
- Configurable update intervals
- Event-driven architecture for real-time updates

### Scalability
- Supports 50+ vehicles without performance degradation
- Can handle 1000+ inventory items efficiently
- Designed for horizontal scaling
- Database-backed for persistence

## Compliance Alerts

### Alert Severity Levels
- **Low**: Informational, no immediate action required
- **Medium**: Attention needed within 2 weeks
- **High**: Urgent, action required within 1 week
- **Critical**: Immediate action required

### Alert Types
1. **Expiration Warning**: Item approaching or past expiration
2. **Inspection Due**: Inspection interval exceeded or approaching
3. **Missing Equipment**: Required equipment not present
4. **Regulatory Violation**: Non-compliance with regulations

### Alert Thresholds
- Critical: Item expired or >30 days overdue
- High: Expires within 30 days or inspection overdue
- Medium: Expires within 90 days or inspection due within 14 days
- Low: Informational reminders

## Equipment Condition States

- **New**: Recently purchased, unused
- **Good**: Normal wear, fully functional
- **Fair**: Some wear, still functional
- **Needs Replacement**: Near end of life, plan replacement
- **Expired**: Past expiration date, must replace

## Inspection Types

- **Routine**: Regular scheduled inspection (quarterly)
- **Annual**: Yearly comprehensive inspection
- **Incident**: Inspection after accident or incident
- **Audit**: Compliance audit inspection

## Future Enhancements

- [ ] Mobile app for field inspections
- [ ] Barcode/QR code scanning for quick inventory
- [ ] Automatic reordering for expiring items
- [ ] Integration with procurement system
- [ ] Photo attachment for inspections
- [ ] Digital signature capture
- [ ] Bulk import/export functionality
- [ ] Custom equipment templates
- [ ] Predictive analytics for equipment replacement
- [ ] Integration with maintenance scheduling

## License

Part of the Fleet Management System - Capital Tech Alliance

## Support

For issues or questions, contact the development team or refer to:
- INTEGRATION_INSTRUCTIONS.md - Integration guide
- VehicleInventoryEmulator.test.ts - Usage examples
- 003_vehicle_inventory.sql - Database schema
