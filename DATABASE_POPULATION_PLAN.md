# Fleet Local - Database Population Plan

**Generated**: 2025-11-27
**Purpose**: Populate database with realistic sample data for development and testing
**Target**: Production-quality data across all entities

---

## Overview

Currently, the application uses mock data generated on the frontend. This plan outlines the strategy for creating a comprehensive, realistic database with:

- 150 vehicles across multiple categories
- 200 drivers with varying statuses and certifications
- 1,000+ fuel transactions over 6 months
- 500+ maintenance schedules (past, current, future)
- 300+ parts in inventory
- 500+ documents
- 50+ assets (non-vehicle equipment)
- 100+ routes
- 200+ task assignments
- 50+ incidents

**Total Records**: ~3,000+ across 15+ tables

---

## Entity 1: Vehicles (Target: 150 vehicles)

### Schema Reference
```sql
-- From /api/src/routes/vehicles.ts
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  license_plate VARCHAR(20),
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30),
  current_mileage INTEGER,
  status VARCHAR(20), -- active, idle, charging, service, emergency, sold, retired
  acquired_date DATE,
  disposition_date DATE,
  purchase_price DECIMAL(10,2),
  residual_value DECIMAL(10,2),
  -- Multi-asset fields from migration 032
  asset_category VARCHAR(50),
  asset_type VARCHAR(50),
  power_type VARCHAR(30),
  operational_status VARCHAR(30),
  primary_metric VARCHAR(30),
  is_road_legal BOOLEAN,
  location_id UUID,
  group_id UUID,
  fleet_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
)
```

### Data Distribution

**By Type** (asset_category):
- Sedan: 30 vehicles (20%)
- SUV: 35 vehicles (23%)
- Truck: 40 vehicles (27%)
- Van: 25 vehicles (17%)
- Emergency: 10 vehicles (7%)
- Specialty: 10 vehicles (7%)

**By Region**:
- North: 30 vehicles
- South: 30 vehicles
- East: 30 vehicles
- West: 30 vehicles
- Central: 30 vehicles

**By Status**:
- Active: 90 vehicles (60%)
- Idle: 30 vehicles (20%)
- Charging: 12 vehicles (8%)
- Service: 15 vehicles (10%)
- Emergency: 3 vehicles (2%)

**By Power Type**:
- Gasoline: 90 vehicles (60%)
- Diesel: 30 vehicles (20%)
- Electric: 20 vehicles (13%)
- Hybrid: 10 vehicles (7%)

### Realistic Data Patterns

**Makes & Models** (weighted distribution):
```typescript
const vehicleTemplates = [
  // Sedans
  { make: 'Toyota', model: 'Camry', type: 'sedan', power: 'gasoline', years: [2020-2024] },
  { make: 'Honda', model: 'Accord', type: 'sedan', power: 'gasoline', years: [2019-2024] },
  { make: 'Tesla', model: 'Model 3', type: 'sedan', power: 'electric', years: [2021-2024] },

  // SUVs
  { make: 'Ford', model: 'Explorer', type: 'suv', power: 'gasoline', years: [2018-2024] },
  { make: 'Chevrolet', model: 'Tahoe', type: 'suv', power: 'gasoline', years: [2019-2024] },
  { make: 'Tesla', model: 'Model Y', type: 'suv', power: 'electric', years: [2021-2024] },

  // Trucks
  { make: 'Ford', model: 'F-150', type: 'truck', power: 'gasoline', years: [2017-2024] },
  { make: 'Chevrolet', model: 'Silverado', type: 'truck', power: 'diesel', years: [2018-2024] },
  { make: 'Ram', model: '1500', type: 'truck', power: 'diesel', years: [2019-2024] },

  // Vans
  { make: 'Ford', model: 'Transit', type: 'van', power: 'diesel', years: [2018-2024] },
  { make: 'Mercedes', model: 'Sprinter', type: 'van', power: 'diesel', years: [2019-2024] },

  // Emergency
  { make: 'Chevrolet', model: 'Tahoe SSV', type: 'emergency', power: 'gasoline', years: [2020-2024] },
  { make: 'Ford', model: 'Police Interceptor', type: 'emergency', power: 'gasoline', years: [2019-2024] },
]
```

**VIN Generation** (realistic format):
```typescript
function generateVIN(make: string, year: number, index: number): string {
  const makeCodes = {
    'Ford': '1FA',
    'Chevrolet': '1GC',
    'Toyota': '4T1',
    'Honda': '1HG',
    'Tesla': '5YJ',
    'Ram': '1C6',
    'Mercedes': 'WD3'
  }
  const code = makeCodes[make] || '1XX'
  const yearCode = (year - 1980).toString(36).toUpperCase()
  const serial = index.toString().padStart(6, '0')
  return `${code}${yearCode}P${serial}${randomChar()}${randomChar()}`
}
```

**Mileage Calculation** (realistic aging):
```typescript
function calculateMileage(year: number, status: string): number {
  const age = 2025 - year
  const baseAnnualMiles = status === 'emergency' ? 25000 : 15000
  const variance = (Math.random() * 0.3) - 0.15 // ±15%
  return Math.floor(age * baseAnnualMiles * (1 + variance))
}
```

**Fuel Level** (realistic distribution):
```typescript
function generateFuelLevel(status: string): number {
  if (status === 'active') return Math.floor(Math.random() * 60) + 40 // 40-100%
  if (status === 'idle') return Math.floor(Math.random() * 100) // 0-100%
  if (status === 'charging') return Math.floor(Math.random() * 30) // 0-30%
  if (status === 'service') return Math.floor(Math.random() * 50) // 0-50%
  return Math.floor(Math.random() * 100)
}
```

### Sample Data Script

```typescript
// File: /api/src/scripts/seed-vehicles.ts
import pool from '../config/database'
import { faker } from '@faker-js/faker'

async function seedVehicles(tenantId: string, count: number = 150) {
  const vehicles = []

  for (let i = 0; i < count; i++) {
    const template = selectWeightedTemplate()
    const year = faker.helpers.arrayElement(template.years)
    const status = selectWeightedStatus()
    const region = faker.helpers.arrayElement(['North', 'South', 'East', 'West', 'Central'])

    vehicles.push({
      tenant_id: tenantId,
      vin: generateVIN(template.make, year, i),
      license_plate: generateLicensePlate(region),
      make: template.make,
      model: template.model,
      year,
      color: faker.vehicle.color(),
      current_mileage: calculateMileage(year, status),
      status,
      acquired_date: faker.date.past({ years: 2025 - year }),
      purchase_price: calculatePurchasePrice(template, year),
      residual_value: calculateResidualValue(template, year),
      asset_category: template.type,
      asset_type: template.type,
      power_type: template.power,
      operational_status: mapStatusToOperational(status),
      primary_metric: template.power === 'electric' ? 'battery_level' : 'fuel_level',
      is_road_legal: template.type !== 'specialty'
    })
  }

  // Batch insert
  const query = `
    INSERT INTO vehicles (
      tenant_id, vin, license_plate, make, model, year, color,
      current_mileage, status, acquired_date, purchase_price, residual_value,
      asset_category, asset_type, power_type, operational_status,
      primary_metric, is_road_legal
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `

  for (const vehicle of vehicles) {
    await pool.query(query, Object.values(vehicle))
  }

  console.log(`✅ Seeded ${count} vehicles`)
}
```

---

## Entity 2: Drivers (Target: 200 drivers)

### Schema Reference
```sql
-- From /api/src/routes/drivers.ts (uses users table)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(50), -- driver, supervisor, admin
  is_active BOOLEAN DEFAULT true,
  phone VARCHAR(20),
  -- Driver-specific fields
  license_class VARCHAR(10), -- A, B, C, D
  license_number VARCHAR(30),
  license_expiry DATE,
  safety_score INTEGER, -- 0-100
  hours_this_week DECIMAL(5,2),
  next_shift TIMESTAMP,
  experience_years INTEGER,
  violations_count INTEGER,
  certifications JSONB,
  photo_url VARCHAR(255), -- Microsoft AD profile photo
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Data Distribution

**By Status**:
- Active: 140 drivers (70%)
- On-Duty: 30 drivers (15%)
- Off-Duty: 20 drivers (10%)
- On-Leave: 10 drivers (5%)

**By License Class**:
- Class A (Heavy): 40 drivers (20%)
- Class B (Medium): 60 drivers (30%)
- Class C (Standard): 80 drivers (40%)
- Class D (Passenger): 20 drivers (10%)

**By Experience**:
- 0-2 years: 40 drivers (20%)
- 2-5 years: 60 drivers (30%)
- 5-10 years: 60 drivers (30%)
- 10+ years: 40 drivers (20%)

### Realistic Data Patterns

**Safety Score Distribution** (bell curve centered at 85):
```typescript
function generateSafetyScore(experience: number, violations: number): number {
  let base = 85
  base += Math.min(experience, 10) * 0.5 // +5 for 10 years
  base -= violations * 5 // -5 per violation
  base += (Math.random() * 20) - 10 // ±10 variance
  return Math.max(0, Math.min(100, Math.floor(base)))
}
```

**Hours Tracking** (realistic weekly hours):
```typescript
function generateHoursThisWeek(status: string): number {
  if (status === 'on-leave') return 0
  if (status === 'on-duty') return Math.random() * 20 + 30 // 30-50 hours
  if (status === 'off-duty') return Math.random() * 40 // 0-40 hours
  return Math.random() * 40 + 20 // 20-60 hours (active)
}
```

**Certifications** (weighted by experience):
```typescript
function generateCertifications(experience: number, licenseClass: string): string[] {
  const all = [
    'Defensive Driving',
    'First Aid/CPR',
    'Hazmat',
    'Tanker',
    'Doubles/Triples',
    'Passenger Transport',
    'Air Brakes',
    'Forklift Operator'
  ]

  const count = Math.min(experience, 4) + Math.floor(Math.random() * 2)
  return faker.helpers.arrayElements(all, count)
}
```

**Microsoft AD Photo URLs**:
```typescript
// Use Microsoft Graph API to fetch real photos
// For seed data, use placeholder images with initials
function getPhotoUrl(firstName: string, lastName: string): string {
  const initials = `${firstName[0]}${lastName[0]}`
  return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=128`
}
```

### Sample Data Script

```typescript
// File: /api/src/scripts/seed-drivers.ts
import pool from '../config/database'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'

async function seedDrivers(tenantId: string, count: number = 200) {
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName })
    const experience = weightedExperience()
    const violations = generateViolations(experience)
    const licenseClass = selectWeightedLicenseClass()
    const status = selectWeightedDriverStatus()

    await pool.query(`
      INSERT INTO users (
        tenant_id, email, first_name, last_name, role, is_active,
        phone, license_class, license_number, license_expiry,
        safety_score, hours_this_week, experience_years, violations_count,
        certifications, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      tenantId,
      email,
      firstName,
      lastName,
      'driver',
      status !== 'on-leave',
      faker.phone.number(),
      licenseClass,
      faker.string.alphanumeric(10).toUpperCase(),
      faker.date.future({ years: 2 }),
      generateSafetyScore(experience, violations),
      generateHoursThisWeek(status),
      experience,
      violations,
      JSON.stringify(generateCertifications(experience, licenseClass)),
      getPhotoUrl(firstName, lastName)
    ])
  }

  console.log(`✅ Seeded ${count} drivers`)
}
```

---

## Entity 3: Fuel Transactions (Target: 1,000+ transactions)

### Schema
```sql
CREATE TABLE fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID REFERENCES users(id),
  date TIMESTAMP NOT NULL,
  station VARCHAR(100),
  gallons DECIMAL(6,2) NOT NULL,
  price_per_gallon DECIMAL(5,2) NOT NULL,
  total_cost DECIMAL(8,2) NOT NULL,
  mpg DECIMAL(5,2),
  odometer_reading INTEGER,
  payment_method VARCHAR(30), -- fleet-card, credit, cash
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Data Generation Strategy

**Timeline**: Last 6 months (180 days)
**Frequency**: 5-7 transactions per vehicle (avg 6)
**Total**: 150 vehicles × 6 = 900 transactions

**Price Variation** (realistic gas prices):
```typescript
function generateGasPrice(date: Date, powerType: string): number {
  if (powerType === 'diesel') {
    const base = 3.85
    const monthFactor = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.30 // seasonal
    const dayVariance = (Math.random() * 0.20) - 0.10
    return base + monthFactor + dayVariance
  }
  // gasoline
  const base = 3.45
  const monthFactor = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.25
  const dayVariance = (Math.random() * 0.15) - 0.075
  return base + monthFactor + dayVariance
}
```

**Station Names** (realistic brands):
```typescript
const stations = [
  'Shell', 'Exxon', 'BP', 'Chevron', 'Mobil', 'Sunoco',
  'Wawa', '7-Eleven', 'Circle K', 'Pilot', 'TA Travel Centers'
]
```

**MPG Calculation** (vehicle-specific):
```typescript
function calculateMPG(vehicleType: string, drivingConditions: string): number {
  const baseMP G = {
    'sedan': 28,
    'suv': 22,
    'truck': 18,
    'van': 20,
    'emergency': 16
  }[vehicleType] || 20

  const variance = (Math.random() * 4) - 2 // ±2 MPG
  return Math.max(1, baseMP G + variance)
}
```

### Sample Data Script

```typescript
// File: /api/src/scripts/seed-fuel-transactions.ts
async function seedFuelTransactions(tenantId: string) {
  const vehicles = await pool.query(`
    SELECT id, asset_type, power_type, current_mileage
    FROM vehicles
    WHERE tenant_id = $1 AND power_type IN ('gasoline', 'diesel')
  `, [tenantId])

  const drivers = await pool.query(`
    SELECT id FROM users
    WHERE tenant_id = $1 AND role = 'driver'
  `, [tenantId])

  for (const vehicle of vehicles.rows) {
    const transactionCount = Math.floor(Math.random() * 3) + 5 // 5-7
    let currentOdometer = vehicle.current_mileage - (transactionCount * 300)

    for (let i = 0; i < transactionCount; i++) {
      const daysAgo = Math.floor((180 / transactionCount) * i)
      const date = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
      const gallons = Math.random() * 10 + 10 // 10-20 gallons
      const pricePerGallon = generateGasPrice(date, vehicle.power_type)
      const milesSinceLastFill = Math.floor(Math.random() * 150) + 200 // 200-350 miles
      currentOdometer += milesSinceLastFill

      await pool.query(`
        INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, driver_id, date, station, gallons,
          price_per_gallon, total_cost, mpg, odometer_reading, payment_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        tenantId,
        vehicle.id,
        faker.helpers.arrayElement(drivers.rows).id,
        date,
        faker.helpers.arrayElement(stations),
        gallons,
        pricePerGallon,
        gallons * pricePerGallon,
        calculateMPG(vehicle.asset_type, 'highway'),
        currentOdometer,
        faker.helpers.weightedArrayElement([
          { value: 'fleet-card', weight: 0.7 },
          { value: 'credit', weight: 0.2 },
          { value: 'cash', weight: 0.1 }
        ])
      ])
    }
  }

  console.log(`✅ Seeded fuel transactions`)
}
```

---

## Entity 4: Maintenance Schedules (Target: 500+ schedules)

### Data Distribution

**By Status**:
- Scheduled (future): 200 (40%)
- In-Progress: 50 (10%)
- Completed (past): 200 (40%)
- Overdue: 50 (10%)

**By Service Type**:
- Oil Change: 150 (30%)
- Tire Rotation: 100 (20%)
- Brake Inspection: 75 (15%)
- Annual Inspection: 50 (10%)
- Transmission Service: 40 (8%)
- Engine Tune-Up: 35 (7%)
- Other: 50 (10%)

**By Priority**:
- Low: 200 (40%)
- Medium: 200 (40%)
- High: 75 (15%)
- Critical: 25 (5%)

### Sample Script

```typescript
// File: /api/src/scripts/seed-maintenance.ts
async function seedMaintenanceSchedules(tenantId: string) {
  const vehicles = await pool.query(`
    SELECT id, current_mileage
    FROM vehicles
    WHERE tenant_id = $1
  `, [tenantId])

  for (const vehicle of vehicles.rows) {
    // Generate 3-4 maintenance records per vehicle
    const count = Math.floor(Math.random() * 2) + 3

    for (let i = 0; i < count; i++) {
      const serviceType = faker.helpers.weightedArrayElement([
        { value: 'Oil Change', weight: 0.3 },
        { value: 'Tire Rotation', weight: 0.2 },
        { value: 'Brake Inspection', weight: 0.15 },
        { value: 'Annual Inspection', weight: 0.1 },
        { value: 'Transmission Service', weight: 0.08 },
        { value: 'Engine Tune-Up', weight: 0.07 },
        { value: 'Battery Replacement', weight: 0.05 },
        { value: 'Coolant Flush', weight: 0.05 }
      ])

      const daysOffset = (Math.random() * 180) - 90 // -90 to +90 days
      const nextDue = new Date(Date.now() + (daysOffset * 24 * 60 * 60 * 1000))
      const status = nextDue < new Date() ? 'overdue' : 'scheduled'

      await pool.query(`
        INSERT INTO maintenance_schedules (
          tenant_id, vehicle_id, service_type, next_due, priority,
          status, estimated_cost, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        tenantId,
        vehicle.id,
        serviceType,
        nextDue,
        calculatePriority(serviceType, status),
        status,
        calculateCost(serviceType),
        generateMaintenanceNotes(serviceType)
      ])
    }
  }

  console.log(`✅ Seeded maintenance schedules`)
}
```

---

## Master Seed Script

```typescript
// File: /api/src/scripts/seed-all.ts
import { seedVehicles } from './seed-vehicles'
import { seedDrivers } from './seed-drivers'
import { seedFuelTransactions } from './seed-fuel-transactions'
import { seedMaintenanceSchedules } from './seed-maintenance'
import { seedPartsInventory } from './seed-parts'
import { seedDocuments } from './seed-documents'
import { seedAssets } from './seed-assets'
import { seedIncidents } from './seed-incidents'
import pool from '../config/database'

async function seedAll() {
  console.log('🌱 Starting database seeding...\n')

  // Get or create default tenant
  const tenantResult = await pool.query(`
    INSERT INTO tenants (name, slug)
    VALUES ('Demo Fleet', 'demo-fleet')
    ON CONFLICT (slug) DO UPDATE SET name = 'Demo Fleet'
    RETURNING id
  `)
  const tenantId = tenantResult.rows[0].id

  try {
    // Clear existing data (optional)
    if (process.env.CLEAR_DATA === 'true') {
      console.log('🗑️  Clearing existing data...')
      await pool.query('DELETE FROM fuel_transactions WHERE tenant_id = $1', [tenantId])
      await pool.query('DELETE FROM maintenance_schedules WHERE tenant_id = $1', [tenantId])
      await pool.query('DELETE FROM parts_inventory WHERE tenant_id = $1', [tenantId])
      await pool.query('DELETE FROM documents WHERE tenant_id = $1', [tenantId])
      await pool.query('DELETE FROM users WHERE tenant_id = $1 AND role = \'driver\'', [tenantId])
      await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [tenantId])
      console.log('✅ Data cleared\n')
    }

    // Seed in dependency order
    await seedVehicles(tenantId, 150)
    await seedDrivers(tenantId, 200)
    await seedFuelTransactions(tenantId)
    await seedMaintenanceSchedules(tenantId)
    await seedPartsInventory(tenantId, 300)
    await seedDocuments(tenantId, 500)
    await seedAssets(tenantId, 50)
    await seedIncidents(tenantId, 50)

    console.log('\n🎉 Database seeding complete!')
    console.log('\n📊 Summary:')
    console.log('   - 150 vehicles')
    console.log('   - 200 drivers')
    console.log('   - 900+ fuel transactions')
    console.log('   - 500+ maintenance schedules')
    console.log('   - 300 parts')
    console.log('   - 500 documents')
    console.log('   - 50 assets')
    console.log('   - 50 incidents')
    console.log('   = ~2,500 total records\n')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
}

export { seedAll }
```

### Usage

```bash
# Install faker for realistic data
cd api
npm install --save-dev @faker-js/faker

# Run seeding
npm run seed

# Or with options
CLEAR_DATA=true npm run seed

# Add to package.json
{
  "scripts": {
    "seed": "npx tsx src/scripts/seed-all.ts"
  }
}
```

---

## Azure Agent Assignment

### Agent #4: Database Populator (OpenAI GPT-4)
**Assigned Tasks**:
1. Implement all seed scripts
2. Add @faker-js/faker dependency
3. Create realistic data generation functions
4. Test with different tenant IDs
5. Verify data integrity
6. Generate sample reports

**Estimated Completion**: 16 hours

---

## Verification Checklist

After seeding:
- [ ] All vehicle VINs are unique and valid format
- [ ] All driver emails are unique
- [ ] Fuel transactions have valid vehicle/driver references
- [ ] Maintenance schedules span past, present, and future
- [ ] Safety scores follow bell curve distribution
- [ ] Gas prices are realistic and vary over time
- [ ] Mileage increases chronologically
- [ ] No orphaned records (foreign key integrity)
- [ ] Tenant isolation works (multi-tenant test)
- [ ] Performance acceptable (< 5s to seed all)

---

**Next Step**: Deploy Database Populator agent to Azure VM and execute seeding
