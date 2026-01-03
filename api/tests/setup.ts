/**
 * Test Setup and Configuration
 * Provides utilities and setup for testing the Fleet Management API
 */

import { Application } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

// Import emulators

// Create test app instance (lazy loaded)
let testApp: Application | null = null

/**
 * Get or create the test app instance
 */
export const getTestApp = async (): Promise<Application> => {
  if (!testApp) {
    // Import express dynamically to avoid initialization issues
    const express = (await import('express')).default
    const cors = (await import('cors')).default

    // Import routes
    const vehiclesRouter = (await import('../src/routes/vehicles')).default
    const driversRouter = (await import('../src/routes/drivers')).default
    const fuelRouter = (await import('../src/routes/fuel-transactions')).default
    const maintenanceRouter = (await import('../src/routes/maintenance')).default

    testApp = express()
    testApp.use(cors())
    testApp.use(express.json())

    // Health check
    testApp.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    // API routes
    testApp.use('/api/vehicles', vehiclesRouter)
    testApp.use('/api/drivers', driversRouter)
    testApp.use('/api/fuel-transactions', fuelRouter)
    testApp.use('/api/maintenance', maintenanceRouter)

    // GPS routes (to be implemented)
    testApp.get('/api/gps', (req, res) => {
      const positions = generateGPSPositions()
      res.json({ data: positions })
    })

    testApp.get('/api/gps/:vehicleId', (req, res) => {
      const position = generateGPSPosition(req.params.vehicleId)
      if (!position) return res.status(404).json({ error: 'Vehicle not found' })
      res.json({ data: position })
    })

    testApp.get('/api/gps/:vehicleId/history', (req, res) => {
      const history = generateGPSHistory(req.params.vehicleId)
      res.json({ data: history })
    })

    // Routes API (to be implemented)
    testApp.get('/api/routes', (req, res) => {
      const routes = generateRoutes()
      res.json({ data: routes })
    })

    // Cost API (to be implemented)
    testApp.get('/api/costs', (req, res) => {
      const costs = generateCosts()
      res.json({ data: costs })
    })

    testApp.get('/api/costs/analytics', (req, res) => {
      const analytics = generateCostAnalytics()
      res.json({ data: analytics })
    })

    testApp.get('/api/costs/budget', (req, res) => {
      const budget = generateBudgetTracking()
      res.json({ data: budget })
    })
  }

  return testApp
}

/**
 * Create test request helper
 */
export const makeRequest = async () => {
  const app = await getTestApp()
  return request(app)
}

/**
 * Reset all emulators to initial state
 */
export const resetEmulators = () => {
  // Emulators are singleton instances that maintain their state
  // Since they don't have reset methods, we'll work with their existing data
  // The emulators automatically generate data when accessed
}

/**
 * Setup hooks for tests
 */
export const setupTestHooks = () => {
  // Reset emulators before each test
  beforeEach(() => {
    resetEmulators()
  })

  // Cleanup after all tests
  afterAll(() => {
    testApp = null
  })
}

// Test data generators
export const generateTestVehicle = (overrides: any = {}) => ({
  vehicleNumber: overrides.vehicleNumber || `V-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  vin: overrides.vin || `1HGCM${Math.random().toString(36).substring(2, 13).toUpperCase()}`,
  licensePlate: overrides.licensePlate || `ABC${Math.floor(Math.random() * 9000) + 1000}`,
  make: overrides.make || 'Ford',
  model: overrides.model || 'F-150',
  year: overrides.year || 2022,
  status: overrides.status || 'active',
  ...overrides
})

export const generateTestDriver = (overrides: any = {}) => ({
  employeeId: overrides.employeeId || `EMP${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
  name: overrides.name || 'Test Driver',
  email: overrides.email || `driver${Date.now()}@test.com`,
  phone: overrides.phone || '555-0123',
  licenseNumber: overrides.licenseNumber || `DL${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  licenseExpiry: overrides.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: overrides.status || 'active',
  ...overrides
})

export const generateTestFuelTransaction = (overrides: any = {}) => ({
  vehicleId: overrides.vehicleId || 1,
  stationName: overrides.stationName || 'Shell Station',
  gallons: overrides.gallons || 15.5,
  pricePerGallon: overrides.pricePerGallon || 3.49,
  totalCost: overrides.totalCost || 54.10,
  paymentMethod: overrides.paymentMethod || 'credit_card',
  receiptNumber: overrides.receiptNumber || `RCP${Date.now()}`,
  transactionDate: overrides.transactionDate || new Date().toISOString(),
  ...overrides
})

export const generateTestMaintenanceRecord = (overrides: any = {}) => ({
  vehicleId: overrides.vehicleId || 1,
  serviceType: overrides.serviceType || 'scheduled',
  category: overrides.category || 'oil_change',
  description: overrides.description || 'Regular oil change',
  laborCost: overrides.laborCost || 50,
  partsCost: overrides.partsCost || 35,
  totalCost: overrides.totalCost || 85,
  status: overrides.status || 'completed',
  scheduledDate: overrides.scheduledDate || new Date().toISOString(),
  ...overrides
})

// Generate JWT token for testing
export const generateTestToken = (user: any = {}) => {
  const testUser = {
    id: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
    role: user.role || 'admin',
    ...user
  }
  const secret = process.env.JWT_SECRET || 'test-secret'
  return jwt.sign(testUser, secret, { expiresIn: '1h' })
}

// GPS data generators
export const generateGPSPosition = (vehicleId: string) => ({
  vehicleId,
  latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
  longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
  speed: Math.floor(Math.random() * 65),
  heading: Math.floor(Math.random() * 360),
  timestamp: new Date().toISOString(),
  accuracy: 5 + Math.random() * 10
})

export const generateGPSPositions = () => {
  return Array.from({ length: 10 }, (_, i) => generateGPSPosition(`V-${i.toString().padStart(3, '0')}`))
}

export const generateGPSHistory = (vehicleId: string) => {
  return Array.from({ length: 20 }, (_, i) => ({
    ...generateGPSPosition(vehicleId),
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString()
  }))
}

// Route data generators
export const generateRoute = () => ({
  routeId: `R-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  vehicleId: `V-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`,
  driverId: `D-${Math.floor(Math.random() * 30).toString().padStart(3, '0')}`,
  stops: Array.from({ length: 5 + Math.floor(Math.random() * 5) }, (_, i) => ({
    stopNumber: i + 1,
    address: `${100 + i * 10} Main St`,
    estimatedArrival: new Date(Date.now() + i * 30 * 60 * 1000).toISOString(),
    status: i === 0 ? 'in-progress' : 'pending'
  })),
  optimizationScore: 85 + Math.floor(Math.random() * 15),
  estimatedDuration: 120 + Math.floor(Math.random() * 60),
  status: 'active'
})

export const generateRoutes = () => {
  return Array.from({ length: 15 }, generateRoute)
}

// Cost data generators
export const generateCostEntry = () => ({
  entryId: `C-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
  category: ['fuel', 'maintenance', 'insurance', 'registration', 'other'][Math.floor(Math.random() * 5)],
  vehicleId: `V-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`,
  amount: Math.floor(Math.random() * 500) + 50,
  date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  description: 'Cost entry description',
  vendor: 'Vendor Name'
})

export const generateCosts = () => {
  return Array.from({ length: 100 }, generateCostEntry)
}

export const generateCostAnalytics = () => ({
  totalCosts: 125000,
  averageCostPerVehicle: 2500,
  costByCategory: {
    fuel: 45000,
    maintenance: 35000,
    insurance: 25000,
    registration: 10000,
    other: 10000
  },
  monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
    amount: 10000 + Math.floor(Math.random() * 5000)
  })),
  topExpenses: [
    { vehicle: 'V-001', amount: 5500 },
    { vehicle: 'V-015', amount: 4800 },
    { vehicle: 'V-023', amount: 4200 }
  ]
})

export const generateBudgetTracking = () => ({
  fiscalYear: 2024,
  totalBudget: 150000,
  spentToDate: 125000,
  remaining: 25000,
  percentUsed: 83.33,
  projectedOverage: 5000,
  budgetByCategory: {
    fuel: { budget: 50000, spent: 45000, remaining: 5000 },
    maintenance: { budget: 40000, spent: 35000, remaining: 5000 },
    insurance: { budget: 30000, spent: 25000, remaining: 5000 },
    registration: { budget: 15000, spent: 10000, remaining: 5000 },
    other: { budget: 15000, spent: 10000, remaining: 5000 }
  }
})

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Assertion helpers
export const expectValidVehicle = (vehicle: any) => {
  expect(vehicle).toHaveProperty('id')
  expect(vehicle).toHaveProperty('vehicleNumber')
  expect(vehicle).toHaveProperty('vin')
  expect(vehicle).toHaveProperty('status')
}

export const expectValidDriver = (driver: any) => {
  expect(driver).toHaveProperty('id')
  expect(driver).toHaveProperty('employeeId')
  expect(driver).toHaveProperty('name')
  expect(driver).toHaveProperty('licenseNumber')
  expect(driver).toHaveProperty('status')
}

export const expectValidFuelTransaction = (transaction: any) => {
  expect(transaction).toHaveProperty('id')
  expect(transaction).toHaveProperty('vehicleId')
  expect(transaction).toHaveProperty('gallons')
  expect(transaction).toHaveProperty('totalCost')
  expect(transaction).toHaveProperty('transactionDate')
}

export const expectValidMaintenanceRecord = (record: any) => {
  expect(record).toHaveProperty('id')
  expect(record).toHaveProperty('vehicleId')
  expect(record).toHaveProperty('serviceType')
  expect(record).toHaveProperty('category')
  expect(record).toHaveProperty('status')
}