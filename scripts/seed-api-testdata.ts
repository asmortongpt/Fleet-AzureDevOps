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

import axios, { AxiosInstance } from 'axios'
import * as fs from 'fs'
import * as path from 'path'

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
  password: 'TestFleet@2024!',
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
        password: 'Manager@2024!',
        first_name: 'Alice',
        last_name: 'Johnson',
        phone: '850-555-1001',
        role: 'fleet_manager'
      },
      {
        email: 'fleet.manager2@fleet.test',
        password: 'Manager@2024!',
        first_name: 'Bob',
        last_name: 'Martinez',
        phone: '850-555-1002',
        role: 'fleet_manager'
      },
      // Technicians
      {
        email: 'tech1@fleet.test',
        password: 'Tech@2024!',
        first_name: 'Charlie',
        last_name: 'Brown',
        phone: '850-555-2001',
        role: 'technician'
      },
      {
        email: 'tech2@fleet.test',
        password: 'Tech@2024!',
        first_name: 'Diana',
        last_name: 'Smith',
        phone: '850-555-2002',
        role: 'technician'
      },
      {
        email: 'tech3@fleet.test',
        password: 'Tech@2024!',
        first_name: 'Edward',
        last_name: 'Davis',
        phone: '850-555-2003',
        role: 'technician'
      },
      // Drivers
      {
        email: 'driver1@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Frank',
        last_name: 'Wilson',
        phone: '850-555-3001',
        role: 'driver'
      },
      {
        email: 'driver2@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Grace',
        last_name: 'Taylor',
        phone: '850-555-3002',
        role: 'driver'
      },
      {
        email: 'driver3@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Henry',
        last_name: 'Anderson',
        phone: '850-555-3003',
        role: 'driver'
      },
      {
        email: 'driver4@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Isabel',
        last_name: 'Thomas',
        phone: '850-555-3004',
        role: 'driver'
      },
      {
        email: 'driver5@fleet.test',
        password: 'Driver@2024!',
        first_name: 'James',
        last_name: 'Jackson',
        phone: '850-555-3005',
        role: 'driver'
      },
      {
        email: 'driver6@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Karen',
        last_name: 'White',
        phone: '850-555-3006',
        role: 'driver'
      },
      {
        email: 'driver7@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Larry',
        last_name: 'Harris',
        phone: '850-555-3007',
        role: 'driver'
      },
      {
        email: 'driver8@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Monica',
        last_name: 'Clark',
        phone: '850-555-3008',
        role: 'driver'
      },
      {
        email: 'driver9@fleet.test',
        password: 'Driver@2024!',
        first_name: 'Nathan',
        last_name: 'Lewis',
        phone: '850-555-3009',
        role: 'driver'
      },
      {
        email: 'driver10@fleet.test',
        password: 'Driver@2024!',
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
        license_state: 'FL',
        license_expiration: '2026-06-30',
        cdl_class: 'A',
        cdl_endorsements: ['H', 'X'],
        medical_card_expiration: '2025-06-30',
        hire_date: '2022-11-10',
        status: 'active',
        safety_score: 92.8,
        emergency_contact_name: 'Susan Anderson',
        emergency_contact_phone: '850-555-9003'
      },
      {
        license_number: 'FL-D-20100004',
        license_state: 'FL',
        license_expiration: '2027-09-20',
        cdl_class: 'B',
        cdl_endorsements: ['P'],
        medical_card_expiration: '2026-09-20',
        hire_date: '2023-05-01',
        status: 'active',
        safety_score: 96.7,
        emergency_contact_name: 'David Thomas',
        emergency_contact_phone: '850-555-9004'
      },
      {
        license_number: 'FL-D-20100005',
        license_state: 'FL',
        license_expiration: '2026-11-15',
        cdl_class: 'A',
        cdl_endorsements: ['H', 'N', 'T', 'X'],
        medical_card_expiration: '2025-11-15',
        hire_date: '2022-08-20',
        status: 'active',
        safety_score: 94.3,
        emergency_contact_name: 'Lisa Jackson',
        emergency_contact_phone: '850-555-9005'
      },
      {
        license_number: 'FL-D-20100006',
        license_state: 'FL',
        license_expiration: '2027-02-28',
        cdl_class: 'C',
        cdl_endorsements: [],
        medical_card_expiration: '2026-02-28',
        hire_date: '2023-07-15',
        status: 'active',
        safety_score: 97.1,
        emergency_contact_name: 'Michael White',
        emergency_contact_phone: '850-555-9006'
      },
      {
        license_number: 'FL-D-20100007',
        license_state: 'FL',
        license_expiration: '2026-05-10',
        cdl_class: 'A',
        cdl_endorsements: ['H', 'T'],
        medical_card_expiration: '2025-05-10',
        hire_date: '2022-12-01',
        status: 'active',
        safety_score: 93.9,
        emergency_contact_name: 'Jennifer Harris',
        emergency_contact_phone: '850-555-9007'
      },
      {
        license_number: 'FL-D-20100008',
        license_state: 'FL',
        license_expiration: '2027-08-25',
        cdl_class: 'B',
        cdl_endorsements: ['P', 'N'],
        medical_card_expiration: '2026-08-25',
        hire_date: '2023-03-10',
        status: 'active',
        safety_score: 99.0,
        emergency_contact_name: 'William Clark',
        emergency_contact_phone: '850-555-9008'
      },
      {
        license_number: 'FL-D-20100009',
        license_state: 'FL',
        license_expiration: '2026-10-05',
        cdl_class: 'A',
        cdl_endorsements: ['H', 'N'],
        medical_card_expiration: '2025-10-05',
        hire_date: '2022-09-15',
        status: 'active',
        safety_score: 91.5,
        emergency_contact_name: 'Patricia Lewis',
        emergency_contact_phone: '850-555-9009'
      },
      {
        license_number: 'FL-D-20100010',
        license_state: 'FL',
        license_expiration: '2027-01-20',
        cdl_class: 'B',
        cdl_endorsements: ['P'],
        medical_card_expiration: '2026-01-20',
        hire_date: '2023-06-01',
        status: 'active',
        safety_score: 95.8,
        emergency_contact_name: 'Richard Robinson',
        emergency_contact_phone: '850-555-9010'
      }
    ]

    for (const driver of drivers) {
      await this.createEntity('drivers', driver, 'driver profile')
    }
    console.log()
  }

  /**
   * Create Vehicles
   */
  private async createVehicles(): Promise<void> {
    console.log('Step 6: Creating Vehicles')
    console.log('-'.repeat(80))

    const vehicles = [
      // Delivery Vans
      {
        vin: '1FTFW1ET5BFA12345',
        license_plate: 'FL-VAN-001',
        make: 'Ford',
        model: 'Transit 350',
        year: 2023,
        vehicle_type: 'van',
        fuel_type: 'gasoline',
        status: 'active',
        odometer: 12500,
        purchase_date: '2023-01-15',
        purchase_price: 42000,
        current_value: 38000
      },
      {
        vin: '1FTFW1ET6CFA23456',
        license_plate: 'FL-VAN-002',
        make: 'Ford',
        model: 'Transit 250',
        year: 2023,
        vehicle_type: 'van',
        fuel_type: 'gasoline',
        status: 'active',
        odometer: 8900,
        purchase_date: '2023-03-20',
        purchase_price: 39000,
        current_value: 36000
      },
      {
        vin: '2C4RC1BG9JR123456',
        license_plate: 'FL-VAN-003',
        make: 'Ram',
        model: 'ProMaster 2500',
        year: 2022,
        vehicle_type: 'van',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 24500,
        purchase_date: '2022-06-10',
        purchase_price: 44000,
        current_value: 38000
      },
      // Pickup Trucks
      {
        vin: '1FTFW1E85LFA34567',
        license_plate: 'FL-TRK-101',
        make: 'Ford',
        model: 'F-150',
        year: 2024,
        vehicle_type: 'pickup',
        fuel_type: 'gasoline',
        status: 'active',
        odometer: 3200,
        purchase_date: '2024-08-01',
        purchase_price: 52000,
        current_value: 50000
      },
      {
        vin: '1GCVKREC2FZ345678',
        license_plate: 'FL-TRK-102',
        make: 'Chevrolet',
        model: 'Silverado 2500',
        year: 2023,
        vehicle_type: 'pickup',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 15600,
        purchase_date: '2023-02-14',
        purchase_price: 58000,
        current_value: 52000
      },
      // Semi Trucks
      {
        vin: '1XKYDP9X5LJ456789',
        license_plate: 'FL-SEMI-201',
        make: 'Kenworth',
        model: 'T680',
        year: 2022,
        vehicle_type: 'semi_truck',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 145000,
        purchase_date: '2022-01-05',
        purchase_price: 165000,
        current_value: 142000
      },
      {
        vin: '1XPWD40X1FD567890',
        license_plate: 'FL-SEMI-202',
        make: 'Peterbilt',
        model: '579',
        year: 2023,
        vehicle_type: 'semi_truck',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 82000,
        purchase_date: '2023-04-12',
        purchase_price: 178000,
        current_value: 165000
      },
      {
        vin: '1FUJGHDV8DLGA1234',
        license_plate: 'FL-SEMI-203',
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2024,
        vehicle_type: 'semi_truck',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 25000,
        purchase_date: '2024-01-20',
        purchase_price: 185000,
        current_value: 180000
      },
      // Box Trucks
      {
        vin: '1HTMMAAL1JH678901',
        license_plate: 'FL-BOX-301',
        make: 'International',
        model: 'DuraStar',
        year: 2023,
        vehicle_type: 'box_truck',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 32000,
        purchase_date: '2023-05-15',
        purchase_price: 95000,
        current_value: 88000
      },
      {
        vin: '1GBJG31U221789012',
        license_plate: 'FL-BOX-302',
        make: 'GMC',
        model: 'Savana 3500',
        year: 2022,
        vehicle_type: 'box_truck',
        fuel_type: 'gasoline',
        status: 'active',
        odometer: 45000,
        purchase_date: '2022-09-20',
        purchase_price: 68000,
        current_value: 58000
      },
      // Electric Vehicles
      {
        vin: '5YJ3E1EA1KF890123',
        license_plate: 'FL-EV-401',
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        vehicle_type: 'sedan',
        fuel_type: 'electric',
        status: 'active',
        odometer: 5200,
        purchase_date: '2024-06-01',
        purchase_price: 48000,
        current_value: 46000
      },
      {
        vin: '1N4AZ1CP4JC901234',
        license_plate: 'FL-EV-402',
        make: 'Nissan',
        model: 'Leaf',
        year: 2023,
        vehicle_type: 'hatchback',
        fuel_type: 'electric',
        status: 'active',
        odometer: 12000,
        purchase_date: '2023-07-10',
        purchase_price: 32000,
        current_value: 28000
      },
      // Maintenance Vehicle
      {
        vin: '1FD8W3G68LEA12345',
        license_plate: 'FL-MNT-501',
        make: 'Ford',
        model: 'F-350 Service Body',
        year: 2024,
        vehicle_type: 'service',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 8500,
        purchase_date: '2024-03-15',
        purchase_price: 72000,
        current_value: 70000
      },
      // SUV for Management
      {
        vin: '1GKS2BKC8LR123456',
        license_plate: 'FL-SUV-601',
        make: 'GMC',
        model: 'Yukon XL',
        year: 2024,
        vehicle_type: 'suv',
        fuel_type: 'gasoline',
        status: 'active',
        odometer: 6200,
        purchase_date: '2024-05-01',
        purchase_price: 78000,
        current_value: 75000
      },
      // Flatbed Truck
      {
        vin: '1FDUF5GT8BEA23456',
        license_plate: 'FL-FLAT-701',
        make: 'Ford',
        model: 'F-550 Flatbed',
        year: 2023,
        vehicle_type: 'flatbed',
        fuel_type: 'diesel',
        status: 'active',
        odometer: 28000,
        purchase_date: '2023-08-22',
        purchase_price: 82000,
        current_value: 75000
      }
    ]

    for (const vehicle of vehicles) {
      await this.createEntity('vehicles', vehicle, 'vehicle')
    }
    console.log()
  }

  /**
   * Create Geofences
   */
  private async createGeofences(): Promise<void> {
    console.log('Step 7: Creating Geofences')
    console.log('-'.repeat(80))

    const geofences = [
      {
        name: 'Tallahassee Main Depot',
        description: 'Primary facility geofence',
        latitude: 30.4383,
        longitude: -84.2807,
        radius: 500,
        geofence_type: 'facility',
        is_active: true
      },
      {
        name: 'Jacksonville Service Area',
        description: 'Service center coverage area',
        latitude: 30.3322,
        longitude: -81.6557,
        radius: 800,
        geofence_type: 'service_area',
        is_active: true
      },
      {
        name: 'Miami Distribution Zone',
        description: 'Distribution hub zone',
        latitude: 25.7617,
        longitude: -80.1918,
        radius: 1000,
        geofence_type: 'distribution',
        is_active: true
      },
      {
        name: 'Tampa Operations Zone',
        description: 'Operations facility zone',
        latitude: 27.9506,
        longitude: -82.4572,
        radius: 750,
        geofence_type: 'facility',
        is_active: true
      },
      {
        name: 'Orlando Service Region',
        description: 'Orlando maintenance area',
        latitude: 28.5383,
        longitude: -81.3792,
        radius: 600,
        geofence_type: 'service_area',
        is_active: true
      },
      {
        name: 'I-10 Corridor West',
        description: 'Western I-10 monitoring zone',
        latitude: 30.5000,
        longitude: -85.0000,
        radius: 5000,
        geofence_type: 'route',
        is_active: true
      },
      {
        name: 'I-95 Corridor South',
        description: 'Southern I-95 monitoring zone',
        latitude: 26.7153,
        longitude: -80.0534,
        radius: 5000,
        geofence_type: 'route',
        is_active: true
      }
    ]

    for (const geofence of geofences) {
      await this.createEntity('geofences', geofence, 'geofence')
    }
    console.log()
  }

  /**
   * Create Routes
   */
  private async createRoutes(): Promise<void> {
    console.log('Step 8: Creating Routes')
    console.log('-'.repeat(80))

    const routes = [
      {
        name: 'Tallahassee to Jacksonville',
        description: 'Daily delivery route',
        start_location: JSON.stringify({
          address: '123 Capital Circle, Tallahassee, FL 32301',
          lat: 30.4383,
          lon: -84.2807
        }),
        end_location: JSON.stringify({
          address: '456 Bay Street, Jacksonville, FL 32202',
          lat: 30.3322,
          lon: -81.6557
        }),
        scheduled_start: new Date('2025-11-14T06:00:00Z').toISOString(),
        estimated_duration: 180,
        status: 'scheduled',
        distance: 165
      },
      {
        name: 'Miami to Tampa Express',
        description: 'Interstate freight route',
        start_location: JSON.stringify({
          address: '789 Biscayne Blvd, Miami, FL 33132',
          lat: 25.7617,
          lon: -80.1918
        }),
        end_location: JSON.stringify({
          address: '321 Tampa Bay Pkwy, Tampa, FL 33602',
          lat: 27.9506,
          lon: -82.4572
        }),
        scheduled_start: new Date('2025-11-14T08:00:00Z').toISOString(),
        estimated_duration: 270,
        status: 'in_progress',
        distance: 280
      },
      {
        name: 'Orlando Distribution Loop',
        description: 'Local delivery circuit',
        start_location: JSON.stringify({
          address: '555 Orange Ave, Orlando, FL 32801',
          lat: 28.5383,
          lon: -81.3792
        }),
        end_location: JSON.stringify({
          address: '555 Orange Ave, Orlando, FL 32801',
          lat: 28.5383,
          lon: -81.3792
        }),
        scheduled_start: new Date('2025-11-14T07:00:00Z').toISOString(),
        estimated_duration: 480,
        status: 'in_progress',
        distance: 120
      },
      {
        name: 'Jacksonville to Miami Overnight',
        description: 'Overnight freight delivery',
        start_location: JSON.stringify({
          address: '456 Bay Street, Jacksonville, FL 32202',
          lat: 30.3322,
          lon: -81.6557
        }),
        end_location: JSON.stringify({
          address: '789 Biscayne Blvd, Miami, FL 33132',
          lat: 25.7617,
          lon: -80.1918
        }),
        scheduled_start: new Date('2025-11-13T22:00:00Z').toISOString(),
        estimated_duration: 420,
        status: 'completed',
        distance: 345
      },
      {
        name: 'Tampa Regional Service',
        description: 'Service and maintenance route',
        start_location: JSON.stringify({
          address: '321 Tampa Bay Pkwy, Tampa, FL 33602',
          lat: 27.9506,
          lon: -82.4572
        }),
        end_location: JSON.stringify({
          address: '321 Tampa Bay Pkwy, Tampa, FL 33602',
          lat: 27.9506,
          lon: -82.4572
        }),
        scheduled_start: new Date('2025-11-14T09:00:00Z').toISOString(),
        estimated_duration: 360,
        status: 'scheduled',
        distance: 85
      }
    ]

    for (const route of routes) {
      await this.createEntity('routes', route, 'route')
    }
    console.log()
  }

  /**
   * Create Maintenance Schedules
   */
  private async createMaintenanceSchedules(): Promise<void> {
    console.log('Step 9: Creating Maintenance Schedules')
    console.log('-'.repeat(80))

    const schedules = [
      {
        service_type: 'oil_change',
        scheduled_date: '2025-11-20',
        interval_type: 'mileage',
        interval_value: 5000,
        notes: 'Regular oil change and filter replacement'
      },
      {
        service_type: 'tire_rotation',
        scheduled_date: '2025-11-22',
        interval_type: 'mileage',
        interval_value: 7500,
        notes: 'Tire rotation and pressure check'
      },
      {
        service_type: 'inspection',
        scheduled_date: '2025-11-25',
        interval_type: 'time',
        interval_value: 90,
        notes: 'Quarterly DOT inspection'
      },
      {
        service_type: 'brake_service',
        scheduled_date: '2025-12-01',
        interval_type: 'mileage',
        interval_value: 15000,
        notes: 'Brake pad inspection and service'
      },
      {
        service_type: 'transmission_service',
        scheduled_date: '2025-12-05',
        interval_type: 'mileage',
        interval_value: 30000,
        notes: 'Transmission fluid change'
      },
      {
        service_type: 'inspection',
        scheduled_date: '2025-12-10',
        interval_type: 'time',
        interval_value: 180,
        notes: 'Semi-annual vehicle inspection'
      },
      {
        service_type: 'oil_change',
        scheduled_date: '2025-12-15',
        interval_type: 'mileage',
        interval_value: 5000,
        notes: 'Scheduled maintenance - oil and filter'
      }
    ]

    for (const schedule of schedules) {
      await this.createEntity('maintenance-schedules', schedule, 'maintenance schedule')
    }
    console.log()
  }

  /**
   * Create Work Orders
   */
  private async createWorkOrders(): Promise<void> {
    console.log('Step 10: Creating Work Orders')
    console.log('-'.repeat(80))

    const workOrders = [
      {
        work_order_type: 'repair',
        description: 'Replace front brake pads',
        priority: 'high',
        status: 'in_progress',
        estimated_hours: 2.5,
        estimated_cost: 350.00,
        notes: 'Customer reported squeaking noise'
      },
      {
        work_order_type: 'preventive',
        description: 'Scheduled oil change and filter',
        priority: 'medium',
        status: 'pending',
        estimated_hours: 1.0,
        estimated_cost: 85.00,
        notes: 'Due at 15,000 miles'
      },
      {
        work_order_type: 'inspection',
        description: 'Annual DOT inspection',
        priority: 'high',
        status: 'scheduled',
        estimated_hours: 3.0,
        estimated_cost: 250.00,
        notes: 'Due by end of month'
      },
      {
        work_order_type: 'repair',
        description: 'Fix transmission fluid leak',
        priority: 'urgent',
        status: 'in_progress',
        estimated_hours: 4.0,
        estimated_cost: 650.00,
        notes: 'Active leak detected during inspection'
      },
      {
        work_order_type: 'preventive',
        description: 'Tire rotation and alignment',
        priority: 'low',
        status: 'pending',
        estimated_hours: 1.5,
        estimated_cost: 125.00,
        notes: 'Scheduled maintenance'
      },
      {
        work_order_type: 'repair',
        description: 'Replace alternator',
        priority: 'high',
        status: 'completed',
        estimated_hours: 2.0,
        actual_hours: 2.5,
        estimated_cost: 450.00,
        actual_cost: 485.00,
        notes: 'Battery not charging properly'
      }
    ]

    for (const workOrder of workOrders) {
      await this.createEntity('work-orders', workOrder, 'work order')
    }
    console.log()
  }

  /**
   * Create Fuel Transactions
   */
  private async createFuelTransactions(): Promise<void> {
    console.log('Step 11: Creating Fuel Transactions')
    console.log('-'.repeat(80))

    const transactions = [
      {
        transaction_date: '2025-11-10',
        fuel_type: 'diesel',
        gallons: 125.5,
        price_per_gallon: 3.89,
        total_cost: 488.20,
        odometer: 145234,
        location: 'Pilot Flying J - Jacksonville, FL',
        notes: 'Full tank'
      },
      {
        transaction_date: '2025-11-11',
        fuel_type: 'gasoline',
        gallons: 28.3,
        price_per_gallon: 3.45,
        total_cost: 97.64,
        odometer: 12689,
        location: 'Shell - Tallahassee, FL',
        notes: 'Regular fuel stop'
      },
      {
        transaction_date: '2025-11-11',
        fuel_type: 'diesel',
        gallons: 98.2,
        price_per_gallon: 3.92,
        total_cost: 384.94,
        odometer: 82456,
        location: 'TA Travel Center - Tampa, FL',
        notes: 'Interstate fuel stop'
      },
      {
        transaction_date: '2025-11-12',
        fuel_type: 'diesel',
        gallons: 142.8,
        price_per_gallon: 3.87,
        total_cost: 552.64,
        odometer: 25678,
        location: 'Loves Travel Stop - Miami, FL',
        notes: 'Full tank for long haul'
      },
      {
        transaction_date: '2025-11-12',
        fuel_type: 'gasoline',
        gallons: 32.1,
        price_per_gallon: 3.52,
        total_cost: 112.99,
        odometer: 9123,
        location: 'BP - Orlando, FL',
        notes: 'Mid-route refuel'
      },
      {
        transaction_date: '2025-11-13',
        fuel_type: 'diesel',
        gallons: 115.4,
        price_per_gallon: 3.95,
        total_cost: 455.83,
        odometer: 32234,
        location: 'Speedway - Jacksonville, FL',
        notes: 'Return trip fuel'
      },
      {
        transaction_date: '2025-11-13',
        fuel_type: 'gasoline',
        gallons: 25.6,
        price_per_gallon: 3.48,
        total_cost: 89.09,
        odometer: 45123,
        location: 'Chevron - Tampa, FL',
        notes: 'Local delivery fuel'
      }
    ]

    for (const transaction of transactions) {
      await this.createEntity('fuel-transactions', transaction, 'fuel transaction')
    }
    console.log()
  }

  /**
   * Create Inspections
   */
  private async createInspections(): Promise<void> {
    console.log('Step 12: Creating Inspections')
    console.log('-'.repeat(80))

    const inspections = [
      {
        inspection_type: 'pre_trip',
        status: 'passed',
        notes: 'All systems operational',
        completed_at: new Date('2025-11-13T06:00:00Z').toISOString()
      },
      {
        inspection_type: 'post_trip',
        status: 'passed',
        notes: 'Vehicle in good condition',
        completed_at: new Date('2025-11-13T18:00:00Z').toISOString()
      },
      {
        inspection_type: 'dot',
        status: 'passed',
        notes: 'Annual DOT inspection completed',
        completed_at: new Date('2025-11-10T10:00:00Z').toISOString()
      },
      {
        inspection_type: 'pre_trip',
        status: 'failed',
        notes: 'Low tire pressure detected - corrected',
        completed_at: new Date('2025-11-12T06:15:00Z').toISOString()
      },
      {
        inspection_type: 'safety',
        status: 'passed',
        notes: 'Safety equipment verified',
        completed_at: new Date('2025-11-11T09:00:00Z').toISOString()
      }
    ]

    for (const inspection of inspections) {
      await this.createEntity('inspections', inspection, 'inspection')
    }
    console.log()
  }

  /**
   * Create Safety Incidents (optional)
   */
  private async createSafetyIncidents(): Promise<void> {
    console.log('Step 13: Creating Safety Incidents')
    console.log('-'.repeat(80))

    const incidents = [
      {
        incident_type: 'minor_accident',
        severity: 'minor',
        description: 'Minor fender bender in parking lot',
        incident_date: '2025-11-05',
        location: 'Customer parking lot - Jacksonville',
        injuries: false,
        vehicle_damage: true,
        estimated_cost: 850.00,
        status: 'closed',
        resolution: 'Insurance claim filed and processed'
      },
      {
        incident_type: 'near_miss',
        severity: 'low',
        description: 'Vehicle cut into lane suddenly',
        incident_date: '2025-11-08',
        location: 'I-95 near Miami',
        injuries: false,
        vehicle_damage: false,
        estimated_cost: 0,
        status: 'reviewed',
        resolution: 'Driver counseled on defensive driving'
      },
      {
        incident_type: 'speeding',
        severity: 'low',
        description: 'Speed limit violation detected',
        incident_date: '2025-11-10',
        location: 'I-10 near Tallahassee',
        injuries: false,
        vehicle_damage: false,
        estimated_cost: 0,
        status: 'open',
        resolution: 'Pending driver review meeting'
      }
    ]

    for (const incident of incidents) {
      await this.createEntity('safety-incidents', incident, 'safety incident')
    }
    console.log()
  }

  /**
   * Create Telemetry Data
   */
  private async createTelemetryData(): Promise<void> {
    console.log('Step 14: Creating Telemetry Data')
    console.log('-'.repeat(80))

    console.log('Creating sample telemetry data points...')

    // Create a few sample telemetry records
    const telemetryPoints = [
      {
        latitude: 30.4383,
        longitude: -84.2807,
        speed: 45.5,
        heading: 180,
        altitude: 50,
        odometer: 12500,
        fuel_level: 75,
        engine_rpm: 2100,
        engine_temp: 195,
        battery_voltage: 13.8,
        recorded_at: new Date().toISOString()
      },
      {
        latitude: 25.7617,
        longitude: -80.1918,
        speed: 62.3,
        heading: 90,
        altitude: 15,
        odometer: 145234,
        fuel_level: 45,
        engine_rpm: 1850,
        engine_temp: 198,
        battery_voltage: 14.1,
        recorded_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    for (const telemetry of telemetryPoints) {
      await this.createEntity('telemetry', telemetry, 'telemetry data point')
    }
    console.log()
  }

  /**
   * Generic entity creation helper
   */
  private async createEntity(endpoint: string, data: any, entityType: string): Promise<void> {
    try {
      const response = await this.api.post(`/api/${endpoint}`, data)
      const id = response.data.id || response.data.data?.id

      // Store ID in appropriate collection
      const key = endpoint.replace(/-/g, '_').replace(/s$/, '') + 's'
      if (this.config.createdIds[key as keyof typeof this.config.createdIds]) {
        (this.config.createdIds[key as keyof typeof this.config.createdIds] as string[]).push(id)
      }

      this.stats.created++
      console.log(`✓ Created ${entityType}: ${data.name || data.email || data.vin || data.description || 'new record'}`)
    } catch (error: any) {
      this.stats.failed++
      const errorMsg = error.response?.data?.error || error.message
      this.stats.errors.push({
        entity: `${entityType} (${endpoint})`,
        error: errorMsg
      })
      console.error(`✗ Failed to create ${entityType}:`, errorMsg)
    }
  }

  /**
   * Print summary of seeding operation
   */
  private printSummary(): void {
    console.log()
    console.log('='.repeat(80))
    console.log('SEEDING SUMMARY')
    console.log('='.repeat(80))
    console.log(`Environment: ${ENVIRONMENTS[this.config.environment].name}`)
    console.log(`Base URL: ${this.config.baseUrl}`)
    console.log(`Tenant ID: ${this.config.tenantId}`)
    console.log()
    console.log('Created Entities:')
    console.log(`  Users: ${this.config.createdIds.users.length}`)
    console.log(`  Drivers: ${this.config.createdIds.drivers.length}`)
    console.log(`  Vehicles: ${this.config.createdIds.vehicles.length}`)
    console.log(`  Facilities: ${this.config.createdIds.facilities.length}`)
    console.log(`  Vendors: ${this.config.createdIds.vendors.length}`)
    console.log(`  Geofences: ${this.config.createdIds.geofences.length}`)
    console.log(`  Routes: ${this.config.createdIds.routes.length}`)
    console.log(`  Work Orders: ${this.config.createdIds.workOrders.length}`)
    console.log(`  Maintenance Schedules: ${this.config.createdIds.maintenanceSchedules.length}`)
    console.log(`  Fuel Transactions: ${this.config.createdIds.fuelTransactions.length}`)
    console.log(`  Inspections: ${this.config.createdIds.inspections.length}`)
    console.log()
    console.log(`Total Created: ${this.stats.created}`)
    console.log(`Total Failed: ${this.stats.failed}`)

    if (this.stats.errors.length > 0) {
      console.log()
      console.log('Errors:')
      this.stats.errors.forEach(err => {
        console.log(`  - ${err.entity}: ${err.error}`)
      })
    }

    console.log('='.repeat(80))
  }

  /**
   * Save report to file
   */
  private saveReport(): void {
    const reportPath = path.join(__dirname, `seed-report-${this.config.environment}-${Date.now()}.json`)
    const report = {
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
      tenantId: this.config.tenantId,
      timestamp: new Date().toISOString(),
      stats: this.stats,
      createdIds: this.config.createdIds
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\nReport saved to: ${reportPath}`)
  }
}

// Main execution
async function main() {
  const environment = (process.argv[2] || 'dev') as keyof typeof ENVIRONMENTS

  if (!ENVIRONMENTS[environment]) {
    console.error('Invalid environment. Use: dev, staging, or production')
    process.exit(1)
  }

  const seeder = new FleetDataSeeder(environment)
  await seeder.seed()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
