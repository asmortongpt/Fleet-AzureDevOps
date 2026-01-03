# Fleet Mobile App Simulator

Simulates all data that would be submitted from the mobile fleet management app, including:

- **Fuel receipts** with photos
- **Damage reports** with incident photos
- **Vehicle inspections** (pre-trip, post-trip)
- **Motion sensor events** (harsh braking, acceleration, impacts)

## Components

### PhotoGenerator
Generates placeholder images with metadata:
- Fuel receipt photos with vendor/pricing info
- Damage photos with severity indicators
- Inspection photos for checklist items
- Includes GPS, EXIF data, device info

### FuelReceiptGenerator
Creates realistic fuel transactions:
- 5 gas stations across Tallahassee
- Regional pricing ($3.15-$3.65/gal)
- Fleet card transactions
- Receipt photos
- Odometer readings and MPG calculation

### DamageReportGenerator
Generates vehicle damage incidents:
- Minor (scratches, small dents): 70%
- Moderate (broken lights, bumper): 20%
- Severe (collisions, frame damage): 10%
- Multiple photos per incident
- Estimated repair costs
- Linked work orders

### InspectionGenerator
Creates DOT-compliant inspections:
- Pre-trip: 35-item DOT checklist
- Post-trip: 8-item condition check
- Photos for failed items
- Pass/fail/pass-with-defects status
- Linked work orders for defects

### MotionSensorSimulator
Generates driver behavior events:
- Harsh braking (most common)
- Rapid acceleration
- Sharp turns
- Impacts (rare)
- G-force measurements

## Quick Start

```typescript
import { MobileAppSimulator } from './mobile/MobileAppSimulator'

const simulator = new MobileAppSimulator({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'fleetdb',
    user: 'fleetadmin',
    password: 'password'
  },
  simulation: {
    fuelReceiptsPerDay: 20,      // Across 500-vehicle fleet
    damageReportsPerDay: 5,       // 1% incident rate
    preTripInspectionRate: 0.6,   // 60% compliance
    motionEventsPerHour: 50       // 1 per 10 vehicles/hour
  }
})

await simulator.start()
```

## Database Tables

Data is saved to existing tables:

- `fuel_transactions` - Fuel receipts
- `damage_reports` - Damage incidents
- `inspections` - Vehicle inspections
- `driver_behavior_events` - Motion events

## Realistic Data Patterns

**Daily Activity** (500-vehicle fleet):
- Fuel transactions: 20/day (4% of fleet)
- Damage reports: 5/day (1% incident rate)
- Pre-trip inspections: 300/day (60% compliance)
- Motion events: 1,200/day (harsh braking, etc.)

**Time Distribution**:
- 6am-10am: Peak (pre-trips, fueling, morning accidents)
- 10am-5pm: Moderate (operations, incidents)
- 5pm-10pm: Light (post-trips, end-of-shift)
- 10pm-6am: Minimal (night shift only)

## Deployment

### Standalone Mode
```bash
cd api/src/emulators/mobile
npm run build
node dist/mobile/index.js
```

### Integrated with Fleet API
```typescript
import { MobileAppSimulator } from '@/emulators/mobile/MobileAppSimulator'

// Start alongside other emulators
const mobileSimulator = new MobileAppSimulator(config)
await mobileSimulator.start()
```

### Docker/Kubernetes
Set environment variables:
```
DB_HOST=fleet-postgres
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<secret>
```

## Events

The simulator emits events for monitoring:

```typescript
simulator.on('fuel-receipt-generated', (transaction) => {
  console.log(`Fuel: $${transaction.total_cost}`)
})

simulator.on('damage-report-generated', (report) => {
  console.log(`Damage: ${report.damage_severity}`)
})

simulator.on('inspection-generated', (inspection) => {
  console.log(`Inspection: ${inspection.overall_result}`)
})

simulator.on('motion-event-generated', (event) => {
  console.log(`Motion: ${event.event_type}`)
})
```

## Future Enhancements

- [ ] Actual image generation (vs placeholders)
- [ ] Azure Blob Storage integration
- [ ] Driver check-in/check-out events
- [ ] Offline queue simulation
- [ ] Network delay/retry logic
- [ ] Photo OCR text extraction
- [ ] AI damage assessment results

## License

Part of the Fleet Management System
