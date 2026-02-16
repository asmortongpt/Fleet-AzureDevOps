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
    
    // 4. Create Drivers (realistic for small company)
    const drivers = [
      { name: 'James Smith', license: 'FL123456789', phone: '(850) 555-0101' },
      { name: 'Robert Brown', license: 'FL987654321', phone: '(850) 555-0102' },
      { name: 'Michael Davis', license: 'FL456789123', phone: '(850) 555-0103' },
      { name: 'David Martinez', license: 'FL789123456', phone: '(850) 555-0104' },
      { name: 'Christopher Lee', license: 'FL321654987', phone: '(850) 555-0105' }
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
    console.log(`✅ Created ${drivers.length} drivers`)
    
    // 5. Create Vehicles (realistic for Tallahassee small company)
    const vehicles = [
      { plate: 'MTX001', make: 'Ford', model: 'Transit', year: 2023, vin: '1FTYE1ZM9FP00001', type: 'van' },
      { plate: 'MTX002', make: 'Ford', model: 'Transit', year: 2022, vin: '1FTYE1ZM0FP00002', type: 'van' },
      { plate: 'MTX003', make: 'Chevrolet', model: 'Silverado', year: 2023, vin: '3G1CK14G930000003', type: 'truck' },
      { plate: 'MTX004', make: 'Chevrolet', model: 'Silverado', year: 2022, vin: '3G1CK14G920000004', type: 'truck' },
      { plate: 'MTX005', make: 'Toyota', model: 'Prius', year: 2023, vin: '5F1AF1FB640000005', type: 'sedan' },
      { plate: 'MTX006', make: 'Honda', model: 'Civic', year: 2023, vin: '19UUA66259L000006', type: 'sedan' },
      { plate: 'MTX007', make: 'Tesla', model: 'Model 3', year: 2023, vin: '5YJ3E1EA8LF000007', type: 'ev' },
      { plate: 'MTX008', make: 'Ford', model: 'F-150', year: 2022, vin: '1FTFW1E87DFP00008', type: 'truck' }
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
    
    // 7. Create Work Orders (maintenance)
    for (let i = 0; i < 15; i++) {
      const vehicleId = vehicleIds[i % vehicleIds.length]
      const statuses = ['open', 'in_progress', 'completed']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      await client.query(
        `INSERT INTO work_orders (id, tenant_id, vehicle_id, title, description, status, priority, assigned_to, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuid(), tenantId, vehicleId,
          `Maintenance Task ${i + 1}`,
          'Regular maintenance and inspection',
          status,
          ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          staffUserIds[i % staffUserIds.length],
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          adminUserId
        ]
      )
    }
    console.log('✅ Created 15 work orders')
    
    // Commit transaction
    await client.query('COMMIT')
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ MORTON-TECH SEEDING COMPLETED')
    console.log('='.repeat(50))
    console.log('\n📊 Summary:')
    console.log('  Company: Morton-Tech Solutions (Tallahassee, FL)')
    console.log('  Admin: andrew.morton@mortontech.com / MortonTech2026!')
    console.log('  Staff: 5 team members')
    console.log('  Drivers: 5 active drivers')
    console.log('  Vehicles: 8 company vehicles')
    console.log('  Work Orders: 15 maintenance tasks')
    console.log('\n🚀 Ready for realistic fleet operations testing')
    
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
