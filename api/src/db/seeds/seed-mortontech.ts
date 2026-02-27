/**
 * Morton-Tech Single Tenant Seeding
 * Realistic fleet data for a small Tallahassee, FL company
 */

import { Pool } from 'pg'
import { v4 as uuid } from 'uuid'
import { hashPassword } from '../../utils/password'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fleet_user:fleet_test_pass@localhost:5432/fleet_test'
})

interface SeedContext {
  tenantId: string
  adminUserId: string
}

async function seedMortonTech(): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    console.log('🌱 Seeding Morton-Tech - Realistic Tallahassee Fleet Data\n')
    
    // 1. Create Single Tenant
    const tenantId = uuid()
    await client.query(
      `INSERT INTO tenants (id, name, slug, domain, settings, billing_email, subscription_tier, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        'Morton-Tech Solutions',
        'mortontech',
        'mortontech.tallahassee.com',
        JSON.stringify({
          timeZone: 'America/Chicago',
          location: 'Tallahassee, FL',
          industry: 'Technology Services & Fleet Logistics'
        }),
        'admin@mortontech.com',
        'professional',
        true
      ]
    )
    console.log('✅ Created tenant: Morton-Tech Solutions (Tallahassee, FL)')
    
    // 2. Create Admin User
    const adminUserId = uuid()
    const passwordHash = await hashPassword('MortonTech2026!')
    
    await client.query(
      `INSERT INTO users (id, tenant_id, email, name, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        adminUserId,
        tenantId,
        'andrew.morton@mortontech.com',
        'Andrew Morton',
        'admin',
        passwordHash,
        true
      ]
    )
    console.log('✅ Created admin user: andrew.morton@mortontech.com')
    
    // 3. Create Staff Users
    const staffEmails = [
      { email: 'fleet.manager@mortontech.com', name: 'Mike Johnson', role: 'manager' },
      { email: 'dispatcher@mortontech.com', name: 'Sarah Williams', role: 'user' },
      { email: 'maintenance@mortontech.com', name: 'Tom Richards', role: 'user' },
      { email: 'driver.smith@mortontech.com', name: 'James Smith', role: 'user' },
      { email: 'driver.brown@mortontech.com', name: 'Robert Brown', role: 'user' }
    ]
    
    const staffUserIds: string[] = []
    for (const staff of staffEmails) {
      const userId = uuid()
      const hash = await hashPassword('MortonTech2026!')
      await client.query(
        `INSERT INTO users (id, tenant_id, email, name, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, tenantId, staff.email, staff.name, staff.role, hash, true]
      )
      staffUserIds.push(userId)
    }
    console.log(`✅ Created 5 staff users`)
    
    // 4. Create Drivers (realistic crew for 50-vehicle fleet)
    const drivers = [
      { name: 'James Smith', license: 'FL123456789', phone: '(850) 555-0101', email: 'j.smith@mortontech.com' },
      { name: 'Robert Brown', license: 'FL987654321', phone: '(850) 555-0102', email: 'r.brown@mortontech.com' },
      { name: 'Michael Davis', license: 'FL456789123', phone: '(850) 555-0103', email: 'm.davis@mortontech.com' },
      { name: 'David Martinez', license: 'FL789123456', phone: '(850) 555-0104', email: 'd.martinez@mortontech.com' },
      { name: 'Christopher Lee', license: 'FL321654987', phone: '(850) 555-0105', email: 'c.lee@mortontech.com' },
      { name: 'Jason Wilson', license: 'FL654321987', phone: '(850) 555-0106', email: 'j.wilson@mortontech.com' },
      { name: 'Kevin Garcia', license: 'FL147258369', phone: '(850) 555-0107', email: 'k.garcia@mortontech.com' },
      { name: 'Anthony Rodriguez', license: 'FL258369147', phone: '(850) 555-0108', email: 'a.rodriguez@mortontech.com' },
      { name: 'Marcus Thomas', license: 'FL369147258', phone: '(850) 555-0109', email: 'm.thomas@mortontech.com' },
      { name: 'Brandon Jackson', license: 'FL741852963', phone: '(850) 555-0110', email: 'b.jackson@mortontech.com' },
      { name: 'Ryan White', license: 'FL852963741', phone: '(850) 555-0111', email: 'r.white@mortontech.com' },
      { name: 'Eric Harris', license: 'FL963741852', phone: '(850) 555-0112', email: 'e.harris@mortontech.com' },
      { name: 'Justin Martin', license: 'FL159357456', phone: '(850) 555-0113', email: 'j.martin@mortontech.com' },
      { name: 'Scott Clark', license: 'FL357159654', phone: '(850) 555-0114', email: 's.clark@mortontech.com' },
      { name: 'Patrick Lewis', license: 'FL456789012', phone: '(850) 555-0115', email: 'p.lewis@mortontech.com' },
      { name: 'Donald Walker', license: 'FL567890123', phone: '(850) 555-0116', email: 'd.walker@mortontech.com' },
      { name: 'Matthew Hall', license: 'FL678901234', phone: '(850) 555-0117', email: 'm.hall@mortontech.com' },
      { name: 'Mark Young', license: 'FL789012345', phone: '(850) 555-0118', email: 'm.young@mortontech.com' }
    ]
    
    const driverIds: string[] = []
    for (const driver of drivers) {
      const driverId = uuid()
      await client.query(
        `INSERT INTO drivers (id, tenant_id, name, license_number, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [driverId, tenantId, driver.name, driver.license, driver.phone, true]
      )
      driverIds.push(driverId)
    }
    console.log(`✅ Created ${drivers.length} professional drivers`)

    // 5. Create Vehicles (50 realistic vehicles for Tallahassee fleet - including large equipment)
    const vehicles = [
      // Vans (8 units)
      { plate: 'MTX001', make: 'Ford', model: 'Transit 250', year: 2023, vin: '1FTYE1ZM9FP00001', type: 'van' },
      { plate: 'MTX002', make: 'Ford', model: 'Transit 250', year: 2023, vin: '1FTYE1ZM9FP00002', type: 'van' },
      { plate: 'MTX003', make: 'Ford', model: 'Transit 350', year: 2022, vin: '1FTYE1ZM0FP00003', type: 'van' },
      { plate: 'MTX004', make: 'Chevrolet', model: 'Express 2500', year: 2023, vin: '1GB4G6C7XFE135004', type: 'van' },
      { plate: 'MTX005', make: 'Chevrolet', model: 'Express 3500', year: 2022, vin: '1GB4G6C78FE135005', type: 'van' },
      { plate: 'MTX006', make: 'Mercedes', model: 'Sprinter 2500', year: 2023, vin: 'WDAPF4CC5FB000006', type: 'van' },
      { plate: 'MTX007', make: 'Mercedes', model: 'Sprinter 3500', year: 2022, vin: 'WDAPF4CC5EB000007', type: 'van' },
      { plate: 'MTX008', make: 'Ram', model: 'ProMaster', year: 2023, vin: '3C6UR5DL8FG000008', type: 'van' },

      // Pickup Trucks (12 units)
      { plate: 'MTX009', make: 'Ford', model: 'F-150', year: 2023, vin: '1FTFW1E87DFP00009', type: 'truck' },
      { plate: 'MTX010', make: 'Ford', model: 'F-150', year: 2023, vin: '1FTFW1E87DFP00010', type: 'truck' },
      { plate: 'MTX011', make: 'Ford', model: 'F-250', year: 2022, vin: '1FT7W2BT9CFB00011', type: 'truck' },
      { plate: 'MTX012', make: 'Chevrolet', model: 'Silverado 1500', year: 2023, vin: '3G1CK14G930000012', type: 'truck' },
      { plate: 'MTX013', make: 'Chevrolet', model: 'Silverado 2500', year: 2023, vin: '3GTP1BE89FG000013', type: 'truck' },
      { plate: 'MTX014', make: 'RAM', model: 'Pickup 1500', year: 2023, vin: '1C6RR7FG5ES000014', type: 'truck' },
      { plate: 'MTX015', make: 'RAM', model: 'Pickup 2500', year: 2022, vin: '1C6RR7FB5ES000015', type: 'truck' },
      { plate: 'MTX016', make: 'GMC', model: 'Sierra 1500', year: 2023, vin: '3GTP1BE06FG000016', type: 'truck' },
      { plate: 'MTX017', make: 'GMC', model: 'Sierra 2500', year: 2022, vin: '3GTG6BE39FG000017', type: 'truck' },
      { plate: 'MTX018', make: 'Toyota', model: 'Tundra', year: 2023, vin: '5TDKRRFV5LS000018', type: 'truck' },
      { plate: 'MTX019', make: 'Nissan', model: 'Titan', year: 2023, vin: '1N6AA1F57FN000019', type: 'truck' },
      { plate: 'MTX020', make: 'Ford', model: 'F-350', year: 2022, vin: '1FT8W3BT6CFB00020', type: 'truck' },

      // SUVs (10 units)
      { plate: 'MTX021', make: 'Chevrolet', model: 'Suburban', year: 2023, vin: '3G1FB1E44DF000021', type: 'suv' },
      { plate: 'MTX022', make: 'Ford', model: 'Expedition', year: 2023, vin: '1FMQU6H97LUA00022', type: 'suv' },
      { plate: 'MTX023', make: 'GMC', model: 'Yukon', year: 2023, vin: '3GYB3GEJ0FF000023', type: 'suv' },
      { plate: 'MTX024', make: 'Toyota', model: '4Runner', year: 2022, vin: 'JT2FF10K000000024', type: 'suv' },
      { plate: 'MTX025', make: 'Nissan', model: 'Armada', year: 2023, vin: '5N1AA2B91FN000025', type: 'suv' },
      { plate: 'MTX026', make: 'Chevrolet', model: 'Tahoe', year: 2023, vin: '1G1FL1E83FF000026', type: 'suv' },
      { plate: 'MTX027', make: 'Ford', model: 'Explorer', year: 2023, vin: '1FM5K8D83LGA00027', type: 'suv' },
      { plate: 'MTX028', make: 'Toyota', model: 'Sequoia', year: 2022, vin: 'JT2FF10K000000028', type: 'suv' },
      { plate: 'MTX029', make: 'Dodge', model: 'Durango', year: 2023, vin: '1D8RR1CT1DS000029', type: 'suv' },

      // Sedans (10 units)
      { plate: 'MTX030', make: 'Toyota', model: 'Prius', year: 2023, vin: '5F1AF1FB640000030', type: 'sedan' },
      { plate: 'MTX031', make: 'Honda', model: 'Civic', year: 2023, vin: '19UUA66259L000031', type: 'sedan' },
      { plate: 'MTX032', make: 'Honda', model: 'Accord', year: 2023, vin: '1HGCV1F32LA000032', type: 'sedan' },
      { plate: 'MTX033', make: 'Toyota', model: 'Camry', year: 2023, vin: '2T1BF1K65CC000033', type: 'sedan' },
      { plate: 'MTX034', make: 'Nissan', model: 'Altima', year: 2023, vin: '1N4BL1CP5PC000034', type: 'sedan' },
      { plate: 'MTX035', make: 'Hyundai', model: 'Elantra', year: 2023, vin: 'KMHEC4A43EU000035', type: 'sedan' },
      { plate: 'MTX036', make: 'Kia', model: 'Forte', year: 2023, vin: 'KNAFU4A25D5000036', type: 'sedan' },
      { plate: 'MTX037', make: 'Chevrolet', model: 'Malibu', year: 2022, vin: '1G1YY22G965000037', type: 'sedan' },
      { plate: 'MTX038', make: 'Ford', model: 'Fusion', year: 2023, vin: '3FA6P0H79LR000038', type: 'sedan' },

      // Electric Vehicles (5 units)
      { plate: 'MTX039', make: 'Tesla', model: 'Model 3', year: 2023, vin: '5YJ3E1EA8LF000039', type: 'ev' },
      { plate: 'MTX040', make: 'Tesla', model: 'Model 3', year: 2023, vin: '5YJ3E1EA8LF000040', type: 'ev' },
      { plate: 'MTX041', make: 'Tesla', model: 'Model Y', year: 2023, vin: '5YJ3E1EA9MF000041', type: 'ev' },
      { plate: 'MTX042', make: 'Chevrolet', model: 'Bolt EV', year: 2023, vin: '1G1FY6E09F1000042', type: 'ev' },
      { plate: 'MTX043', make: 'Nissan', model: 'Leaf', year: 2023, vin: 'JN1AZ4EH8FM000043', type: 'ev' },

      // Specialized Equipment (5 units)
      { plate: 'MTX044', make: 'Caterpillar', model: '320 Excavator', year: 2022, vin: 'CAT0320DEMO44', type: 'equipment' },
      { plate: 'MTX045', make: 'JCB', model: '3CX Backhoe', year: 2023, vin: 'JCB3CXSPEC45', type: 'equipment' },
      { plate: 'MTX046', make: 'Volvo', model: 'A40F Dump Truck', year: 2022, vin: 'VOLVO400046', type: 'equipment' },
      { plate: 'MTX047', make: 'Bobcat', model: 'S570 Skid Steer', year: 2023, vin: 'BOBCAT570047', type: 'equipment' },
      { plate: 'MTX048', make: 'Kenworth', model: 'W990 Heavy Haul', year: 2022, vin: 'KWXW990048', type: 'equipment' },

      // Additional Commercial (2 units to reach 50)
      { plate: 'MTX049', make: 'Freightliner', model: 'Cascadia', year: 2023, vin: '3ALAC5EN9DF000049', type: 'truck' },
      { plate: 'MTX050', make: 'Peterbilt', model: '579', year: 2022, vin: '5ELJRVF41EL000050', type: 'truck' },
    ]
    
    const vehicleIds: string[] = []
    for (const vehicle of vehicles) {
      const vehicleId = uuid()
      await client.query(
        `INSERT INTO vehicles (id, tenant_id, license_plate, make, model, year, vin, vehicle_type, mileage, status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [vehicleId, tenantId, vehicle.plate, vehicle.make, vehicle.model, vehicle.year, vehicle.vin, vehicle.type, 
         Math.floor(Math.random() * 50000), 'active', true]
      )
      vehicleIds.push(vehicleId)
    }
    console.log(`✅ Created ${vehicles.length} vehicles`)
    
    // 6. Assign Drivers to Vehicles (some vehicles shared)
    for (let i = 0; i < vehicleIds.length; i++) {
      const driverId = driverIds[i % driverIds.length]
      await client.query(
        `INSERT INTO driver_vehicle_assignments (id, tenant_id, driver_id, vehicle_id, assignment_date, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuid(), tenantId, driverId, vehicleIds[i], new Date(), i % 2 === 0]
      )
    }
    console.log('✅ Assigned drivers to vehicles')
    
    // 7. Create Work Orders (maintenance for multiple vehicles)
    const maintenanceTasks = [
      'Oil and Filter Change',
      'Tire Rotation and Balance',
      'Brake Inspection and Service',
      'Engine Air Filter Replacement',
      'Cabin Air Filter Replacement',
      'Battery Health Check',
      'Transmission Fluid Service',
      'Coolant Flush and Refill',
      'Spark Plug Replacement',
      'Fuel Injector Cleaning'
    ]

    for (let i = 0; i < 50; i++) {
      const vehicleId = vehicleIds[i % vehicleIds.length]
      const statuses = ['open', 'in_progress', 'completed', 'scheduled']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const taskIndex = Math.floor(Math.random() * maintenanceTasks.length)

      await client.query(
        `INSERT INTO work_orders (id, tenant_id, vehicle_id, title, description, status, priority, assigned_to, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuid(), tenantId, vehicleId,
          maintenanceTasks[taskIndex],
          `Scheduled vehicle maintenance - ${maintenanceTasks[taskIndex]}`,
          status,
          ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          staffUserIds[i % staffUserIds.length],
          new Date(Date.now() + (Math.random() * 30) * 24 * 60 * 60 * 1000),
          adminUserId
        ]
      )
    }
    console.log('✅ Created 50 work orders')
    
    // Commit transaction
    await client.query('COMMIT')
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ MORTON-TECH SEEDING COMPLETED')
    console.log('='.repeat(50))
    console.log('\n📊 Summary:')
    console.log('  Company: Morton-Tech Solutions (Tallahassee, FL)')
    console.log('  Admin: andrew.morton@mortontech.com / MortonTech2026!')
    console.log('  Staff: 5 team members')
    console.log('  Drivers: 18 professional drivers')
    console.log('  Vehicles: 50 company vehicles')
    console.log('    ├─ Vans: 8')
    console.log('    ├─ Pickup Trucks: 12')
    console.log('    ├─ SUVs: 9')
    console.log('    ├─ Sedans: 9')
    console.log('    ├─ Electric Vehicles: 5')
    console.log('    └─ Specialized Equipment: 7')
    console.log('  Work Orders: 15 maintenance tasks')
    console.log('\n🚀 Ready for comprehensive fleet operations testing')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Password hashing utility (simplified for seed script)
async function hashPassword(password: string): Promise<string> {
  // Using bcrypt equivalent - for real production use bcrypt
  // This is just for seed script demonstration
  return Buffer.from(password).toString('base64')
}

seedMortonTech().catch(console.error)
