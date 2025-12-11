```typescript
#!/usr/bin/env ts-node
/**
 * Fleet Management System - API-Based Test Data Seeder
 *
 * Creates comprehensive test data using API endpoints for realistic testing
 * Usage:
 *   ts-node seed-api-testdata.ts [dev|staging|production]
 *   npm run seed:api -- dev
 *
 * Features:
 * - Uses actual API endpoints (not direct DB access)
 * - Multi-tenant support
 * - Realistic data across all entities
 * - Proper authentication flow
 * - Error handling and retry logic
 */

// Required environment variables for test user credentials
// TEST_ADMIN_PASSWORD: Password for the admin test user
// TEST_MANAGER_PASSWORD: Password for fleet manager test users
// TEST_TECH_PASSWORD: Password for technician test users
// TEST_DRIVER_PASSWORD: Password for driver test users

import * as fs from 'fs'
import * as path from 'path'

import axios, { AxiosInstance } from 'axios'

// Environment Configuration
const ENVIRONMENTS = {
  dev: {
    baseUrl: 'https://fleet-dev.capitaltechalliance.com',
    name: 'Development'
  },
  staging: {
    baseUrl: 'https://fleet-staging.capitaltechalliance.com',
    name: 'Staging'
  },
  production: {
    baseUrl: 'https://fleet.capitaltechalliance.com',
    name: 'Production'
  }
}

// Test user credentials (will be created if not exists)
const ADMIN_USER = {
  email: 'testadmin@fleet.test',
  password: process.env.TEST_ADMIN_PASSWORD || 'temp-admin-password',
  first_name: 'Test',
  last_name: 'Administrator',
  phone: '850-555-0000',
  role: 'admin'
}

interface SeedConfig {
  environment: keyof typeof ENVIRONMENTS
  baseUrl: string
  token?: string
  tenantId?: string
  createdIds: {
    users: string[]
    drivers: string[]
    vehicles: string[]
    facilities: string[]
    vendors: string[]
    routes: string[]
    workOrders: string[]
    fuelTransactions: string[]
    maintenanceSchedules: string[]
    inspections: string[]
    geofences: string[]
  }
}

class FleetDataSeeder {
  private config: SeedConfig
  private api: AxiosInstance
  private stats = {
    created: 0,
    failed: 0,
    errors: [] as Array<{ entity: string; error: string }>
  }

  constructor(environment: keyof typeof ENVIRONMENTS) {
    const env = ENVIRONMENTS[environment]
    this.config = {
      environment,
      baseUrl: env.baseUrl,
      createdIds: {
        users: [],
        drivers: [],
        vehicles: [],
        facilities: [],
        vendors: [],
        routes: [],
        workOrders: [],
        fuelTransactions: [],
        maintenanceSchedules: [],
        inspections: [],
        geofences: []
      }
    }

    this.api = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          console.error(`API Error: ${error.response.status} - ${error.response.data?.error || error.message}`)
        }
        throw error
      }
    )
  }

  /**
   * Main seeding workflow
   */
  async seed(): Promise<void> {
    console.log('='.repeat(80))
    console.log(`Fleet Management System - API Test Data Seeder`)
    console.log(`Environment: ${ENVIRONMENTS[this.config.environment].name}`)
    console.log(`Base URL: ${this.config.baseUrl}`)
    console.log('='.repeat(80))
    console.log()

    try {
      // Step 1: Authenticate
      await this.authenticate()

      // Step 2: Create Facilities (needed for vehicles)
      await this.createFacilities()

      // Step 3: Create Vendors
      await this.createVendors()

      // Step 4: Create Users
      await this.createUsers()

      // Step 5: Create Drivers (depends on users)
      await this.createDrivers()

      // Step 6: Create Vehicles
      await this.createVehicles()

      // Step 7: Create Geofences
      await this.createGeofences()

      // Step 8: Create Routes
      await this.createRoutes()

      // Step 9: Create Maintenance Schedules
      await this.createMaintenanceSchedules()

      // Step 10: Create Work Orders
      await this.createWorkOrders()

      // Step 11: Create Fuel Transactions
      await this.createFuelTransactions()

      // Step 12: Create Inspections
      await this.createInspections()

      // Step 13: Create Safety Incidents (optional)
      await this.createSafetyIncidents()

      // Step 14: Create Telemetry Data
      await this.createTelemetryData()

      // Final Summary
      this.printSummary()
      this.saveReport()
    } catch (error) {
      console.error('Fatal error during seeding:', error)
      process.exit(1)
    }
  }

  /**
   * Authenticate and get JWT token
   */
  private async authenticate(): Promise<void> {
    console.log('Step 1: Authentication')
    console.log('-'.repeat(80))

    try {
      // Try to login with existing admin account
      console.log(`Attempting login as ${ADMIN_USER.email}...`)
      const loginResponse = await this.api.post('/api/auth/login', {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
      })

      this.config.token = loginResponse.data.token
      this.config.tenantId = loginResponse.data.user.tenant_id

      console.log(`✓ Login successful`)
      console.log(`  Token: ${this.config.token.substring(0, 20)}...`)
      console.log(`  Tenant ID: ${this.config.tenantId}`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        // User doesn't exist, try to register
        console.log(`Login failed. Attempting to register new admin user...`)

        try {
          const registerResponse = await this.api.post('/api/auth/register', ADMIN_USER)
          console.log(`✓ User registered: ${registerResponse.data.user.email}`)

          // Now login
          const loginResponse = await this.api.post('/api/auth/login', {
            email: ADMIN_USER.email,
            password: ADMIN_USER.password
          })

          this.config.token = loginResponse.data.token
          this.config.tenantId = loginResponse.data.user.tenant_id

          console.log(`✓ Login successful`)
          console.log(`  Token: ${this.config.token.substring(0, 20)}...`)
          console.log(`  Tenant ID: ${this.config.tenantId}`)
        } catch (regError: any) {
          console.error('Failed to register admin user:', regError.response?.data || regError.message)
          throw regError
        }
      } else {
        throw error
      }
    }

    // Set auth header for all subsequent requests
    this.api.defaults.headers.common['Authorization'] = `Bearer ${this.config.token}`
    console.log()
  }

  /**
   * Create Facilities
   */
  private async createFacilities(): Promise<void> {
    console.log('Step 2: Creating Facilities')
    console.log('-'.repeat(80))

    const facilities = [
      {
        name: 'Main Depot - Tallahassee',
        facility_type: 'headquarters',
        address: '123 Capital Circle',
        city: 'Tallahassee',
        state: 'FL',
        zip_code: '32301',
        latitude: 30.4383,
        longitude: -84.2807,
        phone: '850-555-1000',
        capacity: 50,
        service_bays: 10,
        is_active: true
      },
      {
        name: 'Jacksonville Service Center',
        facility_type: 'service_center',
        address: '456 Bay Street',
        city: 'Jacksonville',
        state: 'FL',
        zip_code: '32202',
        latitude: 30.3322,
        longitude: -81.6557,
        phone: '904-555-2000',
        capacity: 30,
        service_bays: 6,
        is_active: true
      },
      {
        name: 'Miami Distribution Hub',
        facility_type: 'distribution',
        address: '789 Biscayne Blvd',
        city: 'Miami',
        state: 'FL',
        zip_code: '33132',
        latitude: 25.7617,
        longitude: -80.1918,
        phone: '305-555-3000',
        capacity: 40,
        service_bays: 8,
        is_active: true
      },
      {
        name: 'Tampa Operations',
        facility_type: 'operations',
        address: '321 Tampa Bay Pkwy',
        city: 'Tampa',
        state: 'FL',
        zip_code: '33602',
        latitude: 27.9506,
        longitude: -82.4572,
        phone: '813-555-4000',
        capacity: 35,
        service_bays: 7,
        is_active: true
      },
      {
        name: 'Orlando Maintenance Facility',
        facility_type: 'maintenance',
        address: '555 Orange Ave',
        city: 'Orlando',
        state: 'FL',
        zip_code: '32801',
        latitude: 28.5383,
        longitude: -81.3792,
        phone: '407-555-5000',
        capacity: 25,
        service_bays: 5,
        is_active: true
      }
    ]

    for (const facility of facilities) {
      await this.createEntity('facilities', facility, 'facility')
    }
    console.log()
  }

  /**
   * Create Vendors
   */
  private async createVendors(): Promise<void> {
    console.log('Step 3: Creating Vendors')
    console.log('-'.repeat(80))

    const vendors = [
      {
        name: 'AutoZone Fleet Services',
        vendor_type: 'parts',
        contact_name: 'John Smith',
        contact_email: 'fleet@autozone.com',
        contact_phone: '850-555-6000',
        address: '100 Auto Plaza',
        city: 'Tallahassee',
        state: 'FL',
        zip_code: '32301',
        is_active: true,
        notes: 'Primary parts supplier'
      },
      {
        name: 'Express Tire & Service',
        vendor_type: 'service',
        contact_name: 'Maria Garcia',
        contact_email: 'service@expresstire.com',
        contact_phone: '904-555-7000',
        address: '200 Service Road',
        city: 'Jacksonville',
        state: 'FL',
        zip_code: '32202',
        is_active: true,
        notes: 'Tire and brake specialist'
      },
      {
        name: 'Shell Fleet Fuel',
        vendor_type: 'fuel',
        contact_name: 'Robert Johnson',
        contact_email: 'fleet@shell.com',
        contact_phone: '800-555-8000',
        address: '300 Fuel Station Blvd',
        city: 'Miami',
        state: 'FL',
        zip_code: '33132',
        is_active: true,
        notes: 'Corporate fuel card program'
      },
      {
        name: 'FleetCare Insurance',
        vendor_type: 'insurance',
        contact_name: 'Sarah Williams',
        contact_email: 'claims@fleetcare.com',
        contact_phone: '877-555-9000',
        address: '400 Insurance Plaza',
        city: 'Tampa',
        state: 'FL',
        zip_code: '33602',
        is_active: true,
        notes: 'Primary insurance provider'
      }
    ]

    for (const vendor of vendors) {
      await this.createEntity('vendors', vendor, 'vendor')
    }
    console.log()
  }

  /**
   * Create Users
   */
  private async createUsers(): Promise<void> {
    console.log('Step 4: Creating Users')
    console.log('-'.repeat(80))

    const users = [
      // Fleet Managers
      {
        email: 'fleet.manager1@fleet.test',
        password: process.env.TEST_MANAGER_PASSWORD || 'temp-manager-password',
        first_name: 'Alice',
        last_name: 'Johnson',
        phone: '850-555-1001',
        role: 'fleet_manager'
      },
      {
        email: 'fleet.manager2@fleet.test',
        password: process.env.TEST_MANAGER_PASSWORD || 'temp-manager-password',
        first_name: 'Bob',
        last_name: 'Martinez',
        phone: '850-555-1002',
        role: 'fleet_manager'
      },
      // Technicians
      {
        email: 'tech1@fleet.test',
        password: process.env.TEST_TECH_PASSWORD || 'temp-tech-password',
        first_name: 'Charlie',
        last_name: 'Brown',
        phone: '850-555-2001',
        role: 'technician'
      },
      {
        email: 'tech2@fleet.test',
        password: process.env.TEST_TECH_PASSWORD || 'temp-tech-password',
        first_name: 'Diana',
        last_name: 'Smith',
        phone: '850-555-2002',
        role: 'technician'
      },
      {
        email: 'tech3@fleet.test',
        password: process.env.TEST_TECH_PASSWORD || 'temp-tech-password',
        first_name: 'Edward',
        last_name: 'Davis',
        phone: '850-555-2003',
        role: 'technician'
      },
      // Drivers
      {
        email: 'driver1@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Frank',
        last_name: 'Wilson',
        phone: '850-555-3001',
        role: 'driver'
      },
      {
        email: 'driver2@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Grace',
        last_name: 'Taylor',
        phone: '850-555-3002',
        role: 'driver'
      },
      {
        email: 'driver3@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Henry',
        last_name: 'Anderson',
        phone: '850-555-3003',
        role: 'driver'
      },
      {
        email: 'driver4@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Isabel',
        last_name: 'Thomas',
        phone: '850-555-3004',
        role: 'driver'
      },
      {
        email: 'driver5@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'James',
        last_name: 'Jackson',
        phone: '850-555-3005',
        role: 'driver'
      },
      {
        email: 'driver6@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Karen',
        last_name: 'White',
        phone: '850-555-3006',
        role: 'driver'
      },
      {
        email: 'driver7@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Larry',
        last_name: 'Harris',
        phone: '850-555-3007',
        role: 'driver'
      },
      {
        email: 'driver8@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Monica',
        last_name: 'Clark',
        phone: '850-555-3008',
        role: 'driver'
      },
      {
        email: 'driver9@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Nathan',
        last_name: 'Lewis',
        phone: '850-555-3009',
        role: 'driver'
      },
      {
        email: 'driver10@fleet.test',
        password: process.env.TEST_DRIVER_PASSWORD || 'temp-driver-password',
        first_name: 'Olivia',
        last_name: 'Robinson',
        phone: '850-555-3010',
        role: 'driver'
      }
    ]

    for (const user of users) {
      try {
        const response = await this.api.post('/api/auth/register', user)
        this.config.createdIds.users.push(response.data.user.id)
        this.stats.created++
        console.log(`✓ Created user: ${user.email} (${user.role})`)
      } catch (error: any) {
        if (error.response?.status === 409) {
          // User already exists, try to get their ID
          console.log(`  User already exists: ${user.email}`)
        } else {
          this.stats.failed++
          this.stats.errors.push({
            entity: `user ${user.email}`,
            error: error.response?.data?.error || error.message
          })
          console.error(`✗ Failed to create user ${user.email}:`, error.response?.data?.error || error.message)
        }
      }
    }
    console.log()
  }

  /**
   * Create Drivers (extended profiles for driver users)
   */
  private async createDrivers(): Promise<void> {
    console.log('Step 5: Creating Driver Profiles')
    console.log('-'.repeat(80))

    const drivers = [
      {
        license_number: 'FL-D-20100001',
        license_state: 'FL',
        license_expiration: '2026-12-31',
        cdl_class: 'A',
        cdl_endorsements: ['H', 'N', 'T'],
        medical_card_expiration: '2025-12-31',
        hire_date: '2023-01-15',
        status: 'active',
        safety_score: 95.5,
        emergency_contact_name: 'Mary Wilson',
        emergency_contact_phone: '850-555-9001'
      },
      {
        license_number: 'FL-D-20100002',
        license_state: 'FL',
        license_expiration: '2027-03-15',
        cdl_class: 'B',
        cdl_endorsements: ['P', 'N'],
        medical_card_expiration: '2026-03-15',
        hire_date: '2023-02-20',
        status: 'active',
        safety_score: 98.2,
        emergency_contact_name: 'Robert Taylor',
        emergency_contact_phone: '850-555-9002'
      },
      {
        license_number: 'FL-D-20100003',
        license_state: 'FL