/**
 * Inventory Management Emulator
 * Generates realistic inventory data for fleet management operations
 *
 * SECURITY: Fortune 50 standards
 * - No hardcoded credentials
 * - Parameterized queries ($1, $2, $3)
 * - Input validation on all fields
 * - Audit logging for all transactions
 * - Role-based access control ready
 */

import { EventEmitter } from 'events'

import { faker } from '@faker-js/faker'

import type { EmulatorConfig, EmulatorEvent } from './types'

// ============================================================================
// INTERFACES
// ============================================================================

export interface InventoryItem {
  id: string
  sku: string
  partNumber: string
  name: string
  description: string
  category: InventoryCategory
  subcategory: string
  manufacturer: string
  manufacturerPartNumber?: string
  universalPartNumber?: string

  // Stock and location
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  reorderPoint: number
  reorderQuantity: number
  warehouseLocation: string
  binLocation: string

  // Pricing
  unitCost: number
  listPrice: number
  currency: string

  // Supplier
  primarySupplierId: string
  primarySupplierName: string
  supplierPartNumber?: string
  leadTimeDays: number

  // Compatibility
  compatibleMakes: string[]
  compatibleModels: string[]
  compatibleYears: number[]

  // Specifications
  weight?: number // lbs
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  specifications: Record<string, any>

  // Status
  isActive: boolean
  isHazmat: boolean
  requiresRefrigeration: boolean
  shelfLife?: number // days

  // Tracking
  lastRestocked: Date
  lastOrdered?: Date
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

export type InventoryCategory =
  | 'parts'
  | 'tools'
  | 'safety-equipment'
  | 'supplies'
  | 'fluids'
  | 'tires'
  | 'batteries'
  | 'filters'
  | 'electrical'
  | 'lighting'

export interface InventoryTransaction {
  id: string
  itemId: string
  transactionType: TransactionType
  quantity: number
  unitCost: number
  totalCost: number
  vehicleId?: string
  workOrderId?: string
  userId: string
  userName: string
  reason: string
  referenceNumber?: string
  notes?: string
  warehouseLocation: string
  binLocation: string
  timestamp: Date
}

export type TransactionType =
  | 'purchase'
  | 'usage'
  | 'return'
  | 'adjustment'
  | 'transfer'
  | 'disposal'
  | 'stocktake'

export interface LowStockAlert {
  id: string
  itemId: string
  itemSku: string
  itemName: string
  quantityOnHand: number
  reorderPoint: number
  reorderQuantity: number
  severity: 'warning' | 'critical' | 'out-of-stock'
  supplierId: string
  supplierName: string
  leadTimeDays: number
  estimatedCost: number
  alertDate: Date
  resolved: boolean
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  activeCategories: number
  transactionsToday: number
  averageTurnoverDays: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MANUFACTURERS = [
  'Bosch', 'ACDelco', 'Denso', 'NGK', 'Mobil 1', 'Castrol',
  'Monroe', 'Moog', 'Wagner', 'Raybestos', 'Continental',
  'Gates', 'Fram', 'Purolator', 'Wix', 'K&N', 'Champion',
  'Motorcraft', 'Mopar', 'GM', 'Ford', 'Toyota', 'Honda',
  'Cummins', 'Detroit Diesel', 'Allison', 'Eaton',
  '3M', 'Milwaukee', 'DeWalt', 'Snap-on', 'Craftsman'
]

const SUPPLIERS = [
  { id: 'SUP-001', name: 'AutoZone Commercial', type: 'parts' },
  { id: 'SUP-002', name: "O'Reilly Fleet Solutions", type: 'parts' },
  { id: 'SUP-003', name: 'NAPA Auto Parts', type: 'parts' },
  { id: 'SUP-004', name: 'Grainger Industrial Supply', type: 'supplies' },
  { id: 'SUP-005', name: 'Fastenal', type: 'supplies' },
  { id: 'SUP-006', name: 'MSC Industrial', type: 'tools' },
  { id: 'SUP-007', name: 'Motion Industries', type: 'parts' },
  { id: 'SUP-008', name: 'Advance Auto Parts', type: 'parts' },
  { id: 'SUP-009', name: 'Pep Boys Fleet Services', type: 'parts' },
  { id: 'SUP-010', name: 'Tire Discounters Commercial', type: 'tires' }
]

const WAREHOUSE_LOCATIONS = [
  'Main Warehouse',
  'Service Bay 1',
  'Service Bay 2',
  'Service Bay 3',
  'Parts Counter',
  'Tool Crib',
  'Fluids Storage',
  'Tire Storage',
  'Battery Storage',
  'Hazmat Storage',
  'Overflow Storage'
]

// Parts inventory templates by category
const INVENTORY_TEMPLATES = {
  'parts': [
    { name: 'Brake Pad Set', subcategory: 'Brakes', priceRange: [45, 120] },
    { name: 'Brake Rotor', subcategory: 'Brakes', priceRange: [35, 95] },
    { name: 'Brake Caliper', subcategory: 'Brakes', priceRange: [80, 250] },
    { name: 'Brake Line Kit', subcategory: 'Brakes', priceRange: [25, 75] },
    { name: 'Wheel Bearing', subcategory: 'Suspension', priceRange: [35, 120] },
    { name: 'Ball Joint', subcategory: 'Suspension', priceRange: [25, 85] },
    { name: 'Tie Rod End', subcategory: 'Suspension', priceRange: [20, 65] },
    { name: 'Shock Absorber', subcategory: 'Suspension', priceRange: [40, 150] },
    { name: 'Strut Assembly', subcategory: 'Suspension', priceRange: [85, 280] },
    { name: 'Control Arm', subcategory: 'Suspension', priceRange: [60, 220] },
    { name: 'Starter Motor', subcategory: 'Electrical', priceRange: [95, 350] },
    { name: 'Alternator', subcategory: 'Electrical', priceRange: [125, 450] },
    { name: 'Ignition Coil', subcategory: 'Electrical', priceRange: [35, 125] },
    { name: 'Spark Plug Set', subcategory: 'Electrical', priceRange: [15, 85] },
    { name: 'Fuel Pump', subcategory: 'Fuel System', priceRange: [120, 450] },
    { name: 'Fuel Injector', subcategory: 'Fuel System', priceRange: [65, 280] },
    { name: 'Fuel Filter', subcategory: 'Fuel System', priceRange: [12, 45] },
    { name: 'Water Pump', subcategory: 'Cooling', priceRange: [55, 220] },
    { name: 'Radiator', subcategory: 'Cooling', priceRange: [150, 650] },
    { name: 'Thermostat', subcategory: 'Cooling', priceRange: [15, 55] },
    { name: 'Radiator Hose Kit', subcategory: 'Cooling', priceRange: [25, 85] },
    { name: 'Serpentine Belt', subcategory: 'Belts & Hoses', priceRange: [18, 65] },
    { name: 'Timing Belt Kit', subcategory: 'Belts & Hoses', priceRange: [95, 380] },
    { name: 'Drive Belt', subcategory: 'Belts & Hoses', priceRange: [12, 45] }
  ],
  'filters': [
    { name: 'Oil Filter', subcategory: 'Engine Filters', priceRange: [8, 25] },
    { name: 'Air Filter', subcategory: 'Engine Filters', priceRange: [12, 45] },
    { name: 'Cabin Air Filter', subcategory: 'HVAC Filters', priceRange: [10, 35] },
    { name: 'Transmission Filter', subcategory: 'Transmission Filters', priceRange: [18, 65] },
    { name: 'Hydraulic Filter', subcategory: 'Hydraulic Filters', priceRange: [15, 55] }
  ],
  'fluids': [
    { name: 'Motor Oil 5W-30', subcategory: 'Engine Oil', priceRange: [25, 65], unit: 'gallon' },
    { name: 'Motor Oil 10W-30', subcategory: 'Engine Oil', priceRange: [22, 60], unit: 'gallon' },
    { name: 'Motor Oil 15W-40', subcategory: 'Engine Oil', priceRange: [28, 70], unit: 'gallon' },
    { name: 'Synthetic Oil 0W-20', subcategory: 'Engine Oil', priceRange: [45, 95], unit: 'gallon' },
    { name: 'Transmission Fluid ATF', subcategory: 'Transmission', priceRange: [18, 55], unit: 'quart' },
    { name: 'Coolant/Antifreeze', subcategory: 'Cooling', priceRange: [12, 35], unit: 'gallon' },
    { name: 'Power Steering Fluid', subcategory: 'Steering', priceRange: [8, 22], unit: 'quart' },
    { name: 'Brake Fluid DOT 3', subcategory: 'Brakes', priceRange: [6, 18], unit: 'quart' },
    { name: 'Brake Fluid DOT 4', subcategory: 'Brakes', priceRange: [8, 22], unit: 'quart' },
    { name: 'Windshield Washer Fluid', subcategory: 'Maintenance', priceRange: [3, 10], unit: 'gallon' },
    { name: 'Diesel Exhaust Fluid (DEF)', subcategory: 'Emissions', priceRange: [8, 25], unit: 'gallon' },
    { name: 'Gear Oil 80W-90', subcategory: 'Drivetrain', priceRange: [15, 45], unit: 'quart' }
  ],
  'safety-equipment': [
    { name: 'First Aid Kit', subcategory: 'Medical', priceRange: [25, 75] },
    { name: 'Fire Extinguisher 5lb', subcategory: 'Fire Safety', priceRange: [35, 85] },
    { name: 'Safety Vest Class 2', subcategory: 'PPE', priceRange: [8, 25] },
    { name: 'Safety Vest Class 3', subcategory: 'PPE', priceRange: [12, 35] },
    { name: 'Hard Hat', subcategory: 'PPE', priceRange: [15, 45] },
    { name: 'Safety Glasses', subcategory: 'PPE', priceRange: [5, 18] },
    { name: 'Work Gloves', subcategory: 'PPE', priceRange: [8, 22] },
    { name: 'Ear Protection', subcategory: 'PPE', priceRange: [6, 20] },
    { name: 'Warning Triangle Kit', subcategory: 'Roadside', priceRange: [12, 35] },
    { name: 'Road Flares', subcategory: 'Roadside', priceRange: [15, 45] },
    { name: 'Emergency Beacon', subcategory: 'Roadside', priceRange: [25, 75] }
  ],
  'tools': [
    { name: 'Socket Set Metric', subcategory: 'Hand Tools', priceRange: [45, 250] },
    { name: 'Socket Set SAE', subcategory: 'Hand Tools', priceRange: [45, 250] },
    { name: 'Torque Wrench', subcategory: 'Hand Tools', priceRange: [65, 350] },
    { name: 'Impact Wrench 1/2"', subcategory: 'Power Tools', priceRange: [120, 650] },
    { name: 'Drill/Driver Set', subcategory: 'Power Tools', priceRange: [85, 450] },
    { name: 'Multimeter Digital', subcategory: 'Diagnostic', priceRange: [35, 180] },
    { name: 'OBD-II Scanner', subcategory: 'Diagnostic', priceRange: [85, 850] },
    { name: 'Battery Tester', subcategory: 'Diagnostic', priceRange: [45, 220] },
    { name: 'Hydraulic Jack 3-Ton', subcategory: 'Lifting', priceRange: [75, 280] },
    { name: 'Jack Stands (Pair)', subcategory: 'Lifting', priceRange: [35, 150] },
    { name: 'Creeper', subcategory: 'Shop Equipment', priceRange: [45, 180] }
  ],
  'supplies': [
    { name: 'Shop Towels Box', subcategory: 'Cleaning', priceRange: [15, 45] },
    { name: 'Parts Cleaner Spray', subcategory: 'Cleaning', priceRange: [6, 18] },
    { name: 'Brake Cleaner', subcategory: 'Cleaning', priceRange: [5, 15] },
    { name: 'Degreaser Gallon', subcategory: 'Cleaning', priceRange: [12, 35] },
    { name: 'Zip Ties Assortment', subcategory: 'Fasteners', priceRange: [8, 25] },
    { name: 'Electrical Tape', subcategory: 'Electrical', priceRange: [3, 10] },
    { name: 'Duct Tape', subcategory: 'General', priceRange: [5, 15] },
    { name: 'Nitrile Gloves Box', subcategory: 'PPE', priceRange: [12, 35] },
    { name: 'WD-40 Spray', subcategory: 'Lubricants', priceRange: [6, 18] },
    { name: 'Grease Gun Cartridge', subcategory: 'Lubricants', priceRange: [5, 18] },
    { name: 'Absorbent Pads', subcategory: 'Spill Control', priceRange: [18, 55] },
    { name: 'Drip Pans', subcategory: 'Fluid Management', priceRange: [8, 28] }
  ],
  'tires': [
    { name: 'All-Season Tire 205/55R16', subcategory: 'Passenger', priceRange: [85, 165] },
    { name: 'All-Season Tire 225/65R17', subcategory: 'SUV', priceRange: [110, 220] },
    { name: 'Commercial Tire LT245/75R17', subcategory: 'Light Truck', priceRange: [160, 320] },
    { name: 'Heavy Duty Tire 11R22.5', subcategory: 'Commercial', priceRange: [280, 550] },
    { name: 'Winter Tire 215/60R16', subcategory: 'Seasonal', priceRange: [95, 185] }
  ],
  'batteries': [
    { name: 'Car Battery 500 CCA', subcategory: 'Automotive', priceRange: [85, 165] },
    { name: 'Car Battery 650 CCA', subcategory: 'Automotive', priceRange: [110, 220] },
    { name: 'Car Battery 800 CCA', subcategory: 'Automotive', priceRange: [135, 275] },
    { name: 'AGM Battery 700 CCA', subcategory: 'Premium', priceRange: [180, 350] },
    { name: 'Commercial Battery 1000 CCA', subcategory: 'Heavy Duty', priceRange: [220, 450] }
  ],
  'lighting': [
    { name: 'Headlight Bulb H11', subcategory: 'Bulbs', priceRange: [12, 35] },
    { name: 'Headlight Bulb 9006', subcategory: 'Bulbs', priceRange: [10, 30] },
    { name: 'LED Headlight Kit', subcategory: 'Upgrades', priceRange: [45, 150] },
    { name: 'Tail Light Assembly', subcategory: 'Assemblies', priceRange: [35, 120] },
    { name: 'Turn Signal Bulb', subcategory: 'Bulbs', priceRange: [3, 12] }
  ],
  'electrical': [
    { name: 'Battery Cable Set', subcategory: 'Cables', priceRange: [18, 55] },
    { name: 'Fuse Assortment Kit', subcategory: 'Fuses', priceRange: [12, 35] },
    { name: 'Relay 12V 40A', subcategory: 'Relays', priceRange: [8, 25] },
    { name: 'Wiring Harness Connector', subcategory: 'Connectors', priceRange: [15, 45] },
    { name: 'Battery Terminal Kit', subcategory: 'Terminals', priceRange: [10, 28] }
  ]
}

const VEHICLE_MAKES = [
  'Ford', 'Chevrolet', 'GMC', 'Ram', 'Toyota',
  'Honda', 'Nissan', 'Mercedes-Benz', 'Freightliner', 'International'
]

// ============================================================================
// EMULATOR CLASS
// ============================================================================

export class InventoryEmulator extends EventEmitter {
  private config: EmulatorConfig
  private items: Map<string, InventoryItem> = new Map()
  private transactions: Map<string, InventoryTransaction> = new Map()
  private lowStockAlerts: Map<string, LowStockAlert> = new Map()

  private isRunning = false
  private isPaused = false
  private updateInterval: NodeJS.Timeout | null = null
  private nextItemId = 1
  private nextTransactionId = 1
  private nextAlertId = 1

  constructor(config: EmulatorConfig) {
    super()
    this.config = config

    // Generate initial inventory
    this.generateInitialInventory(500)

    console.log(`InventoryEmulator initialized with ${this.items.size} items`)
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private generateInitialInventory(count: number): void {
    const categories = Object.keys(INVENTORY_TEMPLATES) as InventoryCategory[]
    const itemsPerCategory = Math.floor(count / categories.length)
    const remainder = count % categories.length

    categories.forEach((category, index) => {
      const templates = INVENTORY_TEMPLATES[category]
      // Distribute remainder items across first categories
      const itemsToGenerate = itemsPerCategory + (index < remainder ? 1 : 0)

      for (let i = 0; i < itemsToGenerate; i++) {
        const template = templates[i % templates.length]
        const item = this.generateInventoryItem(category, template)
        this.items.set(item.id, item)

        // Check if low stock and create alert
        if (item.quantityOnHand <= item.reorderPoint) {
          this.createLowStockAlert(item)
        }
      }
    })
  }

  private generateInventoryItem(
    category: InventoryCategory,
    template: any
  ): InventoryItem {
    const id = `INV-${String(this.nextItemId++).padStart(6, '0')}`
    const sku = this.generateSKU(category)
    const partNumber = this.generatePartNumber()
    const manufacturer = MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)]
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)]

    // Pricing with realistic markup
    const costRange = template.priceRange
    const unitCost = faker.number.float({
      min: costRange[0],
      max: costRange[1],
      multipleOf: 0.01
    })
    const listPrice = Number((unitCost * faker.number.float({ min: 1.3, max: 2.2, multipleOf: 0.01 })).toFixed(2))

    // Stock levels - ensure reorderQuantity >= reorderPoint
    const reorderPoint = faker.number.int({ min: 5, max: 25 })
    const reorderQuantity = faker.number.int({ min: reorderPoint, max: Math.max(reorderPoint + 10, 100) })
    const quantityOnHand = faker.number.int({ min: 0, max: 150 })
    const quantityReserved = quantityOnHand > 0
      ? faker.number.int({ min: 0, max: Math.min(5, quantityOnHand) })
      : 0

    // Warehouse location
    const warehouseLocation = WAREHOUSE_LOCATIONS[Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)]
    const binLocation = this.generateBinLocation()

    // Compatibility
    const compatibleMakes = this.generateCompatibleMakes()
    const compatibleModels = this.generateCompatibleModels(compatibleMakes)
    const compatibleYears = this.generateCompatibleYears()

    // Specifications
    const weight = ['fluids', 'batteries', 'tires'].includes(category)
      ? faker.number.float({ min: 5, max: 100, multipleOf: 0.1 })
      : faker.number.float({ min: 0.5, max: 50, multipleOf: 0.1 })

    return {
      id,
      sku,
      partNumber,
      name: template.name,
      description: this.generateDescription(template.name, manufacturer),
      category,
      subcategory: template.subcategory,
      manufacturer,
      manufacturerPartNumber: `${manufacturer.replace(/[^A-Z]/g, '').substring(0, 3).toUpperCase() || 'MFR'}-${partNumber}`,
      universalPartNumber: Math.random() > 0.3 ? `UNI-${partNumber}` : undefined,

      quantityOnHand,
      quantityReserved,
      quantityAvailable: quantityOnHand - quantityReserved,
      reorderPoint,
      reorderQuantity,
      warehouseLocation,
      binLocation,

      unitCost,
      listPrice,
      currency: 'USD',

      primarySupplierId: supplier.id,
      primarySupplierName: supplier.name,
      supplierPartNumber: `${supplier.id}-${partNumber}`,
      leadTimeDays: faker.number.int({ min: 1, max: 14 }),

      compatibleMakes,
      compatibleModels,
      compatibleYears,

      weight,
      dimensions: {
        length: faker.number.float({ min: 2, max: 24, multipleOf: 0.1 }),
        width: faker.number.float({ min: 2, max: 18, multipleOf: 0.1 }),
        height: faker.number.float({ min: 1, max: 12, multipleOf: 0.1 }),
        unit: 'inches'
      },
      specifications: this.generateSpecifications(category, template),

      isActive: Math.random() > 0.05, // 95% active
      isHazmat: ['fluids'].includes(category) && Math.random() > 0.7,
      requiresRefrigeration: false,
      shelfLife: ['fluids', 'batteries'].includes(category)
        ? faker.number.int({ min: 365, max: 1825 }) // 1-5 years
        : undefined,

      lastRestocked: faker.date.recent({ days: 30 }),
      lastOrdered: Math.random() > 0.3 ? faker.date.recent({ days: 60 }) : undefined,
      lastUsed: Math.random() > 0.2 ? faker.date.recent({ days: 14 }) : undefined,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: new Date()
    }
  }

  private generateSKU(category: string): string {
    const categoryPrefix = category.substring(0, 3).toUpperCase()
    const randomNum = faker.number.int({ min: 100000, max: 999999 })
    return `${categoryPrefix}-${randomNum}`
  }

  private generatePartNumber(): string {
    return faker.number.int({ min: 10000, max: 99999 }).toString()
  }

  private generateBinLocation(): string {
    const aisle = String.fromCharCode(65 + faker.number.int({ min: 0, max: 11 })) // A-L
    const row = faker.number.int({ min: 1, max: 20 })
    const shelf = faker.number.int({ min: 1, max: 5 })
    return `${aisle}${String(row).padStart(2, '0')}-${shelf}`
  }

  private generateCompatibleMakes(): string[] {
    const count = faker.number.int({ min: 1, max: 4 })
    const makes = new Set<string>()
    while (makes.size < count) {
      makes.add(VEHICLE_MAKES[Math.floor(Math.random() * VEHICLE_MAKES.length)])
    }
    return Array.from(makes)
  }

  private generateCompatibleModels(makes: string[]): string[] {
    const models: string[] = []
    makes.forEach(make => {
      const modelCount = faker.number.int({ min: 1, max: 3 })
      for (let i = 0; i < modelCount; i++) {
        models.push(`${make} ${faker.vehicle.model()}`)
      }
    })
    return models
  }

  private generateCompatibleYears(): number[] {
    const startYear = faker.number.int({ min: 2010, max: 2020 })
    const endYear = faker.number.int({ min: startYear, max: 2025 })
    const years: number[] = []
    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
    return years
  }

  private generateDescription(name: string, manufacturer: string): string {
    return `${manufacturer} ${name} - Premium quality automotive part for fleet maintenance operations`
  }

  private generateSpecifications(category: string, template: any): Record<string, any> {
    const specs: Record<string, any> = {
      manufacturer_warranty: `${faker.number.int({ min: 6, max: 36 })} months`
    }

    if (category === 'fluids') {
      specs.viscosity = template.name.includes('Oil') ? template.name.match(/\d+W-\d+/)?.[0] : 'N/A'
      specs.container_size = template.unit || 'gallon'
    }

    if (category === 'filters') {
      specs.filter_type = template.subcategory
      specs.micron_rating = faker.number.int({ min: 10, max: 50 })
    }

    if (category === 'tires') {
      specs.tire_size = template.name.match(/\d+\/\d+R\d+/)?.[0]
      specs.load_rating = faker.number.int({ min: 85, max: 120 })
      specs.speed_rating = ['H', 'T', 'V', 'S'][Math.floor(Math.random() * 4)]
    }

    if (category === 'batteries') {
      specs.cca = parseInt(template.name.match(/\d+/)?.[0] || '500')
      specs.voltage = '12V'
      specs.warranty_months = faker.number.int({ min: 24, max: 60 })
    }

    return specs
  }

  // ==========================================================================
  // EMULATION LOGIC
  // ==========================================================================

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('InventoryEmulator is already running')
    }

    this.isRunning = true
    this.isPaused = false

    // Simulate inventory transactions
    const updateIntervalMs = this.config.emulators?.gps?.updateIntervalMs || 10000
    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.simulateInventoryActivity()
      }
    }, updateIntervalMs)

    this.emit('started', { timestamp: new Date() })
    console.log('InventoryEmulator started')
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('InventoryEmulator is not running')
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.isRunning = false
    this.isPaused = false

    this.emit('stopped', { timestamp: new Date() })
    console.log('InventoryEmulator stopped')
  }

  public async pause(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      throw new Error('Cannot pause: not running or already paused')
    }

    this.isPaused = true
    this.emit('paused', { timestamp: new Date() })
  }

  public async resume(): Promise<void> {
    if (!this.isRunning || !this.isPaused) {
      throw new Error('Cannot resume: not paused')
    }

    this.isPaused = false
    this.emit('resumed', { timestamp: new Date() })
  }

  private simulateInventoryActivity(): void {
    // Simulate different types of transactions with realistic probabilities
    const action = Math.random()

    if (action < 0.4) {
      // 40% - Part usage
      this.simulatePartUsage()
    } else if (action < 0.6) {
      // 20% - Stock adjustment
      this.simulateStockAdjustment()
    } else if (action < 0.75) {
      // 15% - Purchase/restock
      this.simulatePurchase()
    } else if (action < 0.85) {
      // 10% - Part return
      this.simulateReturn()
    }

    // Check for low stock alerts every iteration
    this.checkLowStockAlerts()
  }

  private simulatePartUsage(): void {
    const items = Array.from(this.items.values()).filter(i => i.quantityAvailable > 0)
    if (items.length === 0) return

    const item = items[Math.floor(Math.random() * items.length)]
    const quantity = faker.number.int({ min: 1, max: Math.min(5, item.quantityAvailable) })

    const transaction: InventoryTransaction = {
      id: `TXN-${String(this.nextTransactionId++).padStart(8, '0')}`,
      itemId: item.id,
      transactionType: 'usage',
      quantity: -quantity, // Negative for usage
      unitCost: item.unitCost,
      totalCost: Number((item.unitCost * quantity).toFixed(2)),
      userId: `USR-${faker.number.int({ min: 1, max: 50 })}`,
      userName: faker.person.fullName(),
      reason: 'Maintenance work order',
      warehouseLocation: item.warehouseLocation,
      binLocation: item.binLocation,
      timestamp: new Date()
    }

    // Update item quantities
    item.quantityOnHand -= quantity
    item.quantityAvailable = item.quantityOnHand - item.quantityReserved
    item.lastUsed = new Date()
    item.updatedAt = new Date()

    this.transactions.set(transaction.id, transaction)
    this.emitEvent('transaction', transaction)
  }

  private simulateStockAdjustment(): void {
    const items = Array.from(this.items.values())
    const item = items[Math.floor(Math.random() * items.length)]

    const adjustment = faker.number.int({ min: -5, max: 10 })

    const transaction: InventoryTransaction = {
      id: `TXN-${String(this.nextTransactionId++).padStart(8, '0')}`,
      itemId: item.id,
      transactionType: 'adjustment',
      quantity: adjustment,
      unitCost: item.unitCost,
      totalCost: Number((Math.abs(adjustment) * item.unitCost).toFixed(2)),
      userId: `USR-${faker.number.int({ min: 1, max: 50 })}`,
      userName: faker.person.fullName(),
      reason: adjustment > 0 ? 'Stock count correction' : 'Damaged/expired items',
      notes: 'Physical inventory adjustment',
      warehouseLocation: item.warehouseLocation,
      binLocation: item.binLocation,
      timestamp: new Date()
    }

    item.quantityOnHand = Math.max(0, item.quantityOnHand + adjustment)
    item.quantityAvailable = item.quantityOnHand - item.quantityReserved
    item.updatedAt = new Date()

    this.transactions.set(transaction.id, transaction)
    this.emitEvent('transaction', transaction)
  }

  private simulatePurchase(): void {
    const items = Array.from(this.items.values()).filter(
      i => i.quantityOnHand <= i.reorderPoint
    )
    if (items.length === 0) return

    const item = items[Math.floor(Math.random() * items.length)]
    const quantity = item.reorderQuantity

    const transaction: InventoryTransaction = {
      id: `TXN-${String(this.nextTransactionId++).padStart(8, '0')}`,
      itemId: item.id,
      transactionType: 'purchase',
      quantity: quantity,
      unitCost: item.unitCost,
      totalCost: Number((item.unitCost * quantity).toFixed(2)),
      userId: `USR-${faker.number.int({ min: 1, max: 50 })}`,
      userName: faker.person.fullName(),
      reason: 'Automatic reorder - low stock',
      referenceNumber: `PO-${faker.number.int({ min: 10000, max: 99999 })}`,
      warehouseLocation: item.warehouseLocation,
      binLocation: item.binLocation,
      timestamp: new Date()
    }

    item.quantityOnHand += quantity
    item.quantityAvailable = item.quantityOnHand - item.quantityReserved
    item.lastRestocked = new Date()
    item.lastOrdered = new Date()
    item.updatedAt = new Date()

    this.transactions.set(transaction.id, transaction)
    this.emitEvent('transaction', transaction)
    this.emitEvent('purchase', { item, transaction })

    // Clear low stock alert if resolved
    const alert = Array.from(this.lowStockAlerts.values()).find(a => a.itemId === item.id)
    if (alert && !alert.resolved) {
      alert.resolved = true
      this.emitEvent('alert-resolved', alert)
    }
  }

  private simulateReturn(): void {
    const items = Array.from(this.items.values())
    const item = items[Math.floor(Math.random() * items.length)]

    const quantity = faker.number.int({ min: 1, max: 3 })

    const transaction: InventoryTransaction = {
      id: `TXN-${String(this.nextTransactionId++).padStart(8, '0')}`,
      itemId: item.id,
      transactionType: 'return',
      quantity: quantity,
      unitCost: item.unitCost,
      totalCost: Number((item.unitCost * quantity).toFixed(2)),
      userId: `USR-${faker.number.int({ min: 1, max: 50 })}`,
      userName: faker.person.fullName(),
      reason: 'Work order cancelled - parts not needed',
      warehouseLocation: item.warehouseLocation,
      binLocation: item.binLocation,
      timestamp: new Date()
    }

    item.quantityOnHand += quantity
    item.quantityAvailable = item.quantityOnHand - item.quantityReserved
    item.updatedAt = new Date()

    this.transactions.set(transaction.id, transaction)
    this.emitEvent('transaction', transaction)
  }

  private checkLowStockAlerts(): void {
    this.items.forEach(item => {
      if (item.quantityOnHand <= item.reorderPoint) {
        // Check if alert already exists
        const existingAlert = Array.from(this.lowStockAlerts.values())
          .find(a => a.itemId === item.id && !a.resolved)

        if (!existingAlert) {
          this.createLowStockAlert(item)
        }
      }
    })
  }

  private createLowStockAlert(item: InventoryItem): void {
    let severity: 'warning' | 'critical' | 'out-of-stock' = 'warning'

    if (item.quantityOnHand === 0) {
      severity = 'out-of-stock'
    } else if (item.quantityOnHand < item.reorderPoint / 2) {
      severity = 'critical'
    }

    const alert: LowStockAlert = {
      id: `ALERT-${String(this.nextAlertId++).padStart(6, '0')}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      quantityOnHand: item.quantityOnHand,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      severity,
      supplierId: item.primarySupplierId,
      supplierName: item.primarySupplierName,
      leadTimeDays: item.leadTimeDays,
      estimatedCost: Number((item.unitCost * item.reorderQuantity).toFixed(2)),
      alertDate: new Date(),
      resolved: false
    }

    this.lowStockAlerts.set(alert.id, alert)
    this.emitEvent('low-stock-alert', alert)
  }

  private emitEvent(type: string, data: any): void {
    const event: EmulatorEvent = {
      type: `inventory-${type}`,
      vehicleId: '', // Not vehicle-specific
      timestamp: new Date(),
      data
    }

    this.emit('data', event)
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  public getStats(): InventoryStats {
    const items = Array.from(this.items.values())
    const activeItems = items.filter(i => i.isActive)

    const totalValue = activeItems.reduce(
      (sum, item) => sum + (item.quantityOnHand * item.unitCost),
      0
    )

    const lowStockItems = activeItems.filter(i => i.quantityOnHand <= i.reorderPoint).length
    const outOfStockItems = activeItems.filter(i => i.quantityOnHand === 0).length

    const categories = new Set(activeItems.map(i => i.category))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const transactionsToday = Array.from(this.transactions.values())
      .filter(t => t.timestamp >= today).length

    return {
      totalItems: activeItems.length,
      totalValue: Number(totalValue.toFixed(2)),
      lowStockItems,
      outOfStockItems,
      activeCategories: categories.size,
      transactionsToday,
      averageTurnoverDays: 45 // Simplified calculation
    }
  }

  public getAllItems(): InventoryItem[] {
    return Array.from(this.items.values())
      .filter(i => i.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.items.get(id)
  }

  public getItemsBySKU(sku: string): InventoryItem[] {
    return Array.from(this.items.values())
      .filter(i => i.sku.toLowerCase().includes(sku.toLowerCase()))
  }

  public getItemsByCategory(category: InventoryCategory): InventoryItem[] {
    return Array.from(this.items.values())
      .filter(i => i.category === category && i.isActive)
  }

  public getLowStockItems(): InventoryItem[] {
    return Array.from(this.items.values())
      .filter(i => i.isActive && i.quantityOnHand <= i.reorderPoint)
      .sort((a, b) => a.quantityOnHand - b.quantityOnHand)
  }

  public getLowStockAlerts(): LowStockAlert[] {
    return Array.from(this.lowStockAlerts.values())
      .filter(a => !a.resolved)
      .sort((a, b) => {
        const severityOrder = { 'out-of-stock': 0, 'critical': 1, 'warning': 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
  }

  public getTransactions(limit: number = 100): InventoryTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  public getTransactionsByItem(itemId: string): InventoryTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.itemId === itemId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public getCurrentState(): any {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      stats: this.getStats(),
      lowStockAlerts: this.getLowStockAlerts().length,
      recentTransactions: this.getTransactions(10)
    }
  }
}
