/**
 * FuelMaster Emulator API
 *
 * Realistic simulation of FuelMaster fueling infrastructure and transaction feeds
 *
 * Features:
 * - Fueling transaction management (pull/push)
 * - Vehicle-to-Equipment mapping
 * - Product-to-FuelType mapping
 * - Sites/tanks/hoses infrastructure simulation
 * - Hose→product constraint validation
 * - Common exception scenarios (unmapped vehicles/products, duplicates, sensor faults)
 *
 * @see Documentation: Section 2 - FuelMaster Emulator API
 */

import { Router, Request, Response } from 'express'

// ==================== TYPE DEFINITIONS ====================

export interface FuelSite {
  site_id: string
  name: string
  address: string
  is_active: boolean
}

export interface FuelTank {
  tank_id: number
  site_id: string
  product_id: number
  capacity_gallons: number
  current_gallons: number
}

export interface FuelHose {
  site_id: string
  tank_id: number
  hose_id: number
  hose_code: string
  product_id: number
  meter_reading: number
  is_active: boolean
}

export interface FuelProduct {
  product_id: number
  code: string
  description: string
  group_code: string
  unit: string
  default_unit_cost: number
}

export interface FuelMasterVehicle {
  fuelmaster_vehicle_id: string
  vehicle_tag: string
  status: 'ACTIVE' | 'INACTIVE'
  linked_equipment_key?: string
  linked_ams_equipment_id?: number
  last_odometer?: number
}

export interface VehicleMappingRequest {
  fuelmaster_vehicle_id: string
  ams_equipment_id: number
  equipment_key: string
}

export interface FuelTransaction {
  transaction_id: string
  site_id: string
  tank_id: number
  hose_id: number
  product_id: number
  fuelmaster_vehicle_id: string
  driver_id?: string
  odometer?: number
  engine_hours?: number
  quantity: number
  unit_cost: number
  total_cost: number
  transaction_time: string
  is_voided: boolean
}

export interface TransactionPushRequest {
  transactions: FuelTransaction[]
}

export interface TransactionPushResponse {
  accepted: number
  rejected: number
  errors: TransactionError[]
}

export interface TransactionError {
  transaction_id: string
  code: string
  message: string
  details?: Record<string, any>
}

export interface EmulatorScenario {
  scenario: string
  enabled: boolean
  params?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// ==================== FUELMASTER EMULATOR CLASS ====================

export class FuelMasterEmulator {
  private sites: Map<string, FuelSite> = new Map()
  private tanks: Map<number, FuelTank> = new Map()
  private hoses: Map<number, FuelHose> = new Map()
  private products: Map<number, FuelProduct> = new Map()
  private vehicles: Map<string, FuelMasterVehicle> = new Map()
  private transactions: Map<string, FuelTransaction> = new Map()
  private scenarios: Map<string, EmulatorScenario> = new Map()
  private transactionCounter: number = 1
  private tankCounter: number = 101
  private hoseCounter: number = 1

  constructor() {
    this.seedReferenceData()
    this.initializeScenarios()
  }

  // ==================== SEED DATA ====================

  private seedReferenceData(): void {
    // Import Tallahassee fuel seed data
    const {
      TALLAHASSEE_FUEL_SITES,
      TALLAHASSEE_FUEL_PRODUCTS,
      TALLAHASSEE_FUEL_TANKS,
      TALLAHASSEE_FUEL_HOSES,
      TALLAHASSEE_FLEET_VEHICLES,
      generateSampleTransactions
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    } = require('./tallahassee-fuel-seed-data')

    // Load Sites
    TALLAHASSEE_FUEL_SITES.forEach((site: FuelSite) => {
      this.sites.set(site.site_id, site)
    })

    // Load Products
    TALLAHASSEE_FUEL_PRODUCTS.forEach((product: FuelProduct) => {
      this.products.set(product.product_id, product)
    })

    // Load Tanks
    TALLAHASSEE_FUEL_TANKS.forEach((tank: FuelTank) => {
      this.tanks.set(tank.tank_id, tank)
    })

    // Load Hoses
    TALLAHASSEE_FUEL_HOSES.forEach((hose: FuelHose) => {
      this.hoses.set(hose.hose_id, hose)
    })

    // Load Vehicles
    TALLAHASSEE_FLEET_VEHICLES.forEach((vehicle: FuelMasterVehicle) => {
      this.vehicles.set(vehicle.fuelmaster_vehicle_id, vehicle)
    })

    // Generate realistic 30-day transaction history
    const sampleTransactions = generateSampleTransactions(500)
    sampleTransactions.forEach((tx: FuelTransaction) => {
      this.transactions.set(tx.transaction_id, tx)
    })

    console.log(`[FuelMaster Emulator] Loaded City of Tallahassee data:`)
    console.log(`  - ${this.sites.size} fuel sites`)
    console.log(`  - ${this.products.size} fuel products`)
    console.log(`  - ${this.tanks.size} storage tanks`)
    console.log(`  - ${this.hoses.size} fuel hoses`)
    console.log(`  - ${this.vehicles.size} fleet vehicles`)
    console.log(`  - ${this.transactions.size} historical transactions`)
  }

  private createSampleTransaction(
    vehicleId: string,
    siteId: string,
    tankId: number,
    hoseId: number,
    productId: number,
    quantity: number,
    odometer?: number
  ): void {
    const product = this.products.get(productId)
    if (!product) return

    const txId = `TX-${String(this.transactionCounter++).padStart(6, '0')}`

    this.transactions.set(txId, {
      transaction_id: txId,
      site_id: siteId,
      tank_id: tankId,
      hose_id: hoseId,
      product_id: productId,
      fuelmaster_vehicle_id: vehicleId,
      driver_id: 'EMP-9921',
      odometer,
      engine_hours: 553.2,
      quantity,
      unit_cost: product.default_unit_cost,
      total_cost: quantity * product.default_unit_cost,
      transaction_time: new Date().toISOString(),
      is_voided: false
    })
  }

  private initializeScenarios(): void {
    this.scenarios.set('UNMAPPED_VEHICLE', { scenario: 'UNMAPPED_VEHICLE', enabled: false })
    this.scenarios.set('UNMAPPED_PRODUCT', { scenario: 'UNMAPPED_PRODUCT', enabled: false })
    this.scenarios.set('DUPLICATE_TRANSACTION', { scenario: 'DUPLICATE_TRANSACTION', enabled: false })
    this.scenarios.set('VOID_TRANSACTION', { scenario: 'VOID_TRANSACTION', enabled: false })
    this.scenarios.set('SENSOR_FAULT', { scenario: 'SENSOR_FAULT', enabled: false })
    this.scenarios.set('COST_SPIKE', { scenario: 'COST_SPIKE', enabled: false })
    this.scenarios.set('ODOMETER_ROLLBACK', { scenario: 'ODOMETER_ROLLBACK', enabled: false })
    this.scenarios.set('OUT_OF_SERVICE_HOSE', { scenario: 'OUT_OF_SERVICE_HOSE', enabled: false })
  }

  // ==================== SITE METHODS ====================

  getSites(): FuelSite[] {
    return Array.from(this.sites.values())
  }

  getSite(site_id: string): FuelSite | null {
    return this.sites.get(site_id) || null
  }

  getTanksForSite(site_id: string): FuelTank[] {
    return Array.from(this.tanks.values()).filter(tank => tank.site_id === site_id)
  }

  getHosesForSite(site_id: string): FuelHose[] {
    return Array.from(this.hoses.values()).filter(hose => hose.site_id === site_id)
  }

  // ==================== PRODUCT METHODS ====================

  getProducts(): FuelProduct[] {
    return Array.from(this.products.values())
  }

  getProduct(product_id: number): FuelProduct | null {
    return this.products.get(product_id) || null
  }

  // ==================== VEHICLE METHODS ====================

  getVehicle(fuelmaster_vehicle_id: string): FuelMasterVehicle | null {
    return this.vehicles.get(fuelmaster_vehicle_id) || null
  }

  mapVehicle(request: VehicleMappingRequest): { status: string } {
    const vehicle = this.vehicles.get(request.fuelmaster_vehicle_id)

    if (vehicle) {
      vehicle.linked_ams_equipment_id = request.ams_equipment_id
      vehicle.linked_equipment_key = request.equipment_key
    } else {
      this.vehicles.set(request.fuelmaster_vehicle_id, {
        fuelmaster_vehicle_id: request.fuelmaster_vehicle_id,
        vehicle_tag: request.equipment_key,
        status: 'ACTIVE',
        linked_equipment_key: request.equipment_key,
        linked_ams_equipment_id: request.ams_equipment_id
      })
    }

    return { status: 'SUCCESS' }
  }

  // ==================== TRANSACTION METHODS ====================

  pullTransactions(params: {
    start?: string
    end?: string
    site_id?: string
    page?: number
    pageSize?: number
  }): PaginatedResponse<FuelTransaction> {
    let transactions = Array.from(this.transactions.values())

    // Filter by date range
    if (params.start) {
      const startDate = new Date(params.start)
      transactions = transactions.filter(tx => new Date(tx.transaction_time) >= startDate)
    }

    if (params.end) {
      const endDate = new Date(params.end)
      transactions = transactions.filter(tx => new Date(tx.transaction_time) <= endDate)
    }

    // Filter by site
    if (params.site_id) {
      transactions = transactions.filter(tx => tx.site_id === params.site_id)
    }

    // Pagination
    const page = params.page || 1
    const pageSize = params.pageSize || 100
    const totalItems = transactions.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize

    return {
      items: transactions.slice(startIdx, endIdx),
      page,
      pageSize,
      totalItems,
      totalPages
    }
  }

  pushTransactions(request: TransactionPushRequest): TransactionPushResponse {
    const errors: TransactionError[] = []
    let accepted = 0
    let rejected = 0

    for (const tx of request.transactions) {
      const validationError = this.validateTransaction(tx)

      if (validationError) {
        errors.push(validationError)
        rejected++
      } else {
        this.transactions.set(tx.transaction_id, tx)
        accepted++
      }
    }

    return {
      accepted,
      rejected,
      errors
    }
  }

  private validateTransaction(tx: FuelTransaction): TransactionError | null {
    // Check for unmapped vehicle scenario
    if (this.scenarios.get('UNMAPPED_VEHICLE')?.enabled) {
      return {
        transaction_id: tx.transaction_id,
        code: 'UNMAPPED_VEHICLE',
        message: 'Vehicle not mapped',
        details: { fuelmaster_vehicle_id: tx.fuelmaster_vehicle_id }
      }
    }

    // Check if vehicle exists and is mapped
    const vehicle = this.vehicles.get(tx.fuelmaster_vehicle_id)
    if (!vehicle || !vehicle.linked_ams_equipment_id) {
      return {
        transaction_id: tx.transaction_id,
        code: 'UNMAPPED_VEHICLE',
        message: 'Vehicle not mapped to AMS equipment',
        details: { fuelmaster_vehicle_id: tx.fuelmaster_vehicle_id }
      }
    }

    // Check for unmapped product scenario
    if (this.scenarios.get('UNMAPPED_PRODUCT')?.enabled) {
      return {
        transaction_id: tx.transaction_id,
        code: 'UNMAPPED_PRODUCT',
        message: 'Product not mapped',
        details: { product_id: tx.product_id }
      }
    }

    // Check if product exists
    const product = this.products.get(tx.product_id)
    if (!product) {
      return {
        transaction_id: tx.transaction_id,
        code: 'UNMAPPED_PRODUCT',
        message: 'Product not found',
        details: { product_id: tx.product_id }
      }
    }

    // Check for duplicate transaction
    if (this.transactions.has(tx.transaction_id) && !this.scenarios.get('DUPLICATE_TRANSACTION')?.enabled) {
      return {
        transaction_id: tx.transaction_id,
        code: 'DUPLICATE_TRANSACTION',
        message: 'Transaction already exists'
      }
    }

    // Check hose-product mismatch
    const hose = this.hoses.get(tx.hose_id)
    if (hose && hose.product_id !== tx.product_id) {
      return {
        transaction_id: tx.transaction_id,
        code: 'INVALID_HOSE_PRODUCT',
        message: 'Hose product mismatch',
        details: {
          hose_product_id: hose.product_id,
          transaction_product_id: tx.product_id
        }
      }
    }

    // Check for negative quantity
    if (tx.quantity <= 0) {
      return {
        transaction_id: tx.transaction_id,
        code: 'NEGATIVE_QUANTITY',
        message: 'Quantity must be positive'
      }
    }

    // Check for sensor fault scenario
    if (this.scenarios.get('SENSOR_FAULT')?.enabled && Math.random() < 0.1) {
      return {
        transaction_id: tx.transaction_id,
        code: 'SENSOR_FAULT',
        message: 'Sensor fault detected'
      }
    }

    return null
  }

  // ==================== SCENARIO CONTROL ====================

  setScenario(scenarioRequest: EmulatorScenario): void {
    this.scenarios.set(scenarioRequest.scenario, scenarioRequest)
  }

  getScenario(scenario: string): EmulatorScenario | undefined {
    return this.scenarios.get(scenario)
  }

  getAllScenarios(): EmulatorScenario[] {
    return Array.from(this.scenarios.values())
  }
}

// ==================== EXPRESS ROUTER ====================

export function createFuelMasterRouter(): Router {
  const router = Router()
  const emulator = new FuelMasterEmulator()

  // Middleware for API key authentication
  const apiKeyAuth = (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key']

    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key required'
        }
      })
    }

    // In a real system, validate the API key
    next()
  }

  router.use(apiKeyAuth)

  // ==================== SITE ENDPOINTS ====================

  router.get('/v1/sites', (req: Request, res: Response) => {
    try {
      const sites = emulator.getSites()
      res.json(sites)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.get('/v1/sites/:site_id', (req: Request, res: Response) => {
    try {
      const site = emulator.getSite(req.params.site_id)

      if (!site) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found'
          }
        })
      }

      res.json(site)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.get('/v1/sites/:site_id/tanks', (req: Request, res: Response) => {
    try {
      const tanks = emulator.getTanksForSite(req.params.site_id)
      res.json(tanks)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.get('/v1/sites/:site_id/hoses', (req: Request, res: Response) => {
    try {
      const hoses = emulator.getHosesForSite(req.params.site_id)
      res.json(hoses)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== PRODUCT ENDPOINTS ====================

  router.get('/v1/products', (req: Request, res: Response) => {
    try {
      const products = emulator.getProducts()
      res.json(products)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.get('/v1/products/:product_id', (req: Request, res: Response) => {
    try {
      const product = emulator.getProduct(parseInt(req.params.product_id))

      if (!product) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found'
          }
        })
      }

      res.json(product)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== VEHICLE ENDPOINTS ====================

  router.get('/v1/vehicles/:fuelmaster_vehicle_id', (req: Request, res: Response) => {
    try {
      const vehicle = emulator.getVehicle(req.params.fuelmaster_vehicle_id)

      if (!vehicle) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Vehicle not found'
          }
        })
      }

      res.json(vehicle)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.post('/v1/vehicles/map', (req: Request, res: Response) => {
    try {
      const result = emulator.mapVehicle(req.body)
      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== TRANSACTION ENDPOINTS ====================

  router.get('/v1/transactions', (req: Request, res: Response) => {
    try {
      const params = {
        start: req.query.start as string | undefined,
        end: req.query.end as string | undefined,
        site_id: req.query.site_id as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      }

      const result = emulator.pullTransactions(params)
      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  router.post('/v1/transactions/push', (req: Request, res: Response) => {
    try {
      const result = emulator.pushTransactions(req.body)
      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== EMULATOR CONTROL ====================

  router.post('/v1/emulator/control', (req: Request, res: Response) => {
    try {
      emulator.setScenario(req.body)
      res.json({ status: 'SUCCESS', scenario: req.body.scenario })
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to set scenario'
        }
      })
    }
  })

  router.get('/v1/emulator/control', (req: Request, res: Response) => {
    try {
      const scenarios = emulator.getAllScenarios()
      res.json({ scenarios })
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get scenarios'
        }
      })
    }
  })

  router.get('/v1/emulator/control/:scenario', (req: Request, res: Response) => {
    try {
      const scenario = emulator.getScenario(req.params.scenario)

      if (!scenario) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          }
        })
      }

      res.json(scenario)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get scenario'
        }
      })
    }
  })

  return router
}

export default {
  FuelMasterEmulator,
  createFuelMasterRouter
}
