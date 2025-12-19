/**
 * Vehicle Inventory Emulator
 * Generates realistic per-vehicle equipment and inventory assignments
 * Tracks expiration dates, inspection schedules, and compliance
 * Fortune 50 security standards with full audit trail
 */

import { EventEmitter } from 'events'

import { faker } from '@faker-js/faker'

import { EmulatorConfig, EmulatorStatus } from '../types'

/**
 * Equipment Category Enumeration
 */
export enum EquipmentCategory {
  SAFETY = 'safety',
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  TOOLS = 'tools',
  COMMUNICATION = 'communication',
  SPECIALTY = 'specialty'
}

/**
 * Equipment Condition Status
 */
export enum EquipmentCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  NEEDS_REPLACEMENT = 'needs_replacement',
  EXPIRED = 'expired'
}

/**
 * Compliance Status for Equipment
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  WARNING = 'warning',
  EXPIRED = 'expired',
  MISSING = 'missing'
}

/**
 * Equipment Item Definition
 */
export interface EquipmentItem {
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
  location: string // Location within vehicle (e.g., "glove box", "trunk", "under seat")

  // Expiration/Inspection Tracking
  hasExpiration: boolean
  expirationDate?: Date
  requiresInspection: boolean
  lastInspectionDate?: Date
  nextInspectionDate?: Date
  inspectionIntervalDays?: number

  // Compliance
  complianceStatus: ComplianceStatus
  requiredByRegulation?: string[] // e.g., ["DOT", "OSHA", "FMCSA"]
  isRequired: boolean

  // Audit Trail
  lastCheckedBy?: string
  lastCheckedDate?: Date
  notes?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Inventory Inspection Record
 */
export interface InventoryInspection {
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
  overallCompliance: number // percentage
  findings: InventoryFinding[]
  correctiveActions: CorrectiveAction[]
  signatureData?: string
  status: 'completed' | 'pending_review' | 'approved'
  approvedBy?: string
  approvedDate?: Date
  nextInspectionDue: Date
  createdAt: Date
}

/**
 * Inspection Finding
 */
export interface InventoryFinding {
  equipmentId: string
  equipmentType: string
  findingType: 'expired' | 'missing' | 'damaged' | 'insufficient_quantity' | 'non_compliant'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  requiredAction: string
  dueDate: Date
}

/**
 * Corrective Action
 */
export interface CorrectiveAction {
  id: string
  findingId: string
  action: string
  assignedTo: string
  dueDate: Date
  completedDate?: Date
  status: 'open' | 'in_progress' | 'completed' | 'overdue'
  cost?: number
  notes?: string
}

/**
 * Compliance Alert
 */
export interface ComplianceAlert {
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

/**
 * Vehicle Inventory Summary
 */
export interface VehicleInventorySummary {
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

/**
 * Equipment Templates by Vehicle Type
 */
const EQUIPMENT_TEMPLATES = {
  sedan: [
    { type: 'First Aid Kit - Basic', category: EquipmentCategory.MEDICAL, quantity: 1, hasExpiration: true, expirationMonths: 36, requiresInspection: true, inspectionDays: 180 },
    { type: 'Fire Extinguisher - 2.5 lb ABC', category: EquipmentCategory.SAFETY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Reflective Triangles', category: EquipmentCategory.EMERGENCY, quantity: 3, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Flares', category: EquipmentCategory.EMERGENCY, quantity: 6, hasExpiration: true, expirationMonths: 48, requiresInspection: false },
    { type: 'Jumper Cables', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Flashlight with Batteries', category: EquipmentCategory.EMERGENCY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Emergency Blanket', category: EquipmentCategory.EMERGENCY, quantity: 2, hasExpiration: false, requiresInspection: false },
    { type: 'Basic Tool Kit', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
  ],
  suv: [
    { type: 'First Aid Kit - Comprehensive', category: EquipmentCategory.MEDICAL, quantity: 1, hasExpiration: true, expirationMonths: 36, requiresInspection: true, inspectionDays: 180 },
    { type: 'Fire Extinguisher - 5 lb ABC', category: EquipmentCategory.SAFETY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Reflective Triangles', category: EquipmentCategory.EMERGENCY, quantity: 3, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Flares', category: EquipmentCategory.EMERGENCY, quantity: 12, hasExpiration: true, expirationMonths: 48, requiresInspection: false },
    { type: 'Safety Cones - 18 inch', category: EquipmentCategory.SAFETY, quantity: 4, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Jumper Cables - Heavy Duty', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Flashlight with Batteries', category: EquipmentCategory.EMERGENCY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Emergency Blanket', category: EquipmentCategory.EMERGENCY, quantity: 4, hasExpiration: false, requiresInspection: false },
    { type: 'Tow Strap - 20 ft', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Roadside Emergency Kit', category: EquipmentCategory.EMERGENCY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
  ],
  truck: [
    { type: 'First Aid Kit - Industrial', category: EquipmentCategory.MEDICAL, quantity: 1, hasExpiration: true, expirationMonths: 36, requiresInspection: true, inspectionDays: 180, requiredByRegulation: ['DOT', 'OSHA'] },
    { type: 'Fire Extinguisher - 10 lb ABC', category: EquipmentCategory.SAFETY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 365, requiredByRegulation: ['DOT', 'FMCSA'] },
    { type: 'Emergency Reflective Triangles', category: EquipmentCategory.EMERGENCY, quantity: 3, hasExpiration: false, requiresInspection: true, inspectionDays: 365, requiredByRegulation: ['DOT', 'FMCSA'] },
    { type: 'Emergency Flares', category: EquipmentCategory.EMERGENCY, quantity: 12, hasExpiration: true, expirationMonths: 48, requiresInspection: false },
    { type: 'Safety Cones - 28 inch', category: EquipmentCategory.SAFETY, quantity: 6, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Spill Kit - Oil/Fuel', category: EquipmentCategory.SAFETY, quantity: 1, hasExpiration: true, expirationMonths: 60, requiresInspection: true, inspectionDays: 180, requiredByRegulation: ['EPA', 'OSHA'] },
    { type: 'Jumper Cables - Commercial Grade', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Flashlight with Batteries', category: EquipmentCategory.EMERGENCY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Emergency Blanket', category: EquipmentCategory.EMERGENCY, quantity: 4, hasExpiration: false, requiresInspection: false },
    { type: 'Tow Chain - 30 ft Grade 70', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Safety Vest - High Visibility', category: EquipmentCategory.SAFETY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 180, requiredByRegulation: ['DOT'] },
    { type: 'Tire Pressure Gauge - Digital', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Load Straps - Ratchet Type', category: EquipmentCategory.SPECIALTY, quantity: 6, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Wheel Chocks', category: EquipmentCategory.SAFETY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 365, requiredByRegulation: ['DOT'] },
  ],
  van: [
    { type: 'First Aid Kit - Comprehensive', category: EquipmentCategory.MEDICAL, quantity: 1, hasExpiration: true, expirationMonths: 36, requiresInspection: true, inspectionDays: 180 },
    { type: 'Fire Extinguisher - 5 lb ABC', category: EquipmentCategory.SAFETY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Reflective Triangles', category: EquipmentCategory.EMERGENCY, quantity: 3, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Flares', category: EquipmentCategory.EMERGENCY, quantity: 12, hasExpiration: true, expirationMonths: 48, requiresInspection: false },
    { type: 'Safety Cones - 18 inch', category: EquipmentCategory.SAFETY, quantity: 6, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Jumper Cables - Heavy Duty', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Flashlight with Batteries', category: EquipmentCategory.EMERGENCY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Emergency Blanket', category: EquipmentCategory.EMERGENCY, quantity: 6, hasExpiration: false, requiresInspection: false },
    { type: 'Tow Strap - 20 ft', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Safety Vest - High Visibility', category: EquipmentCategory.SAFETY, quantity: 4, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Cargo Straps', category: EquipmentCategory.SPECIALTY, quantity: 8, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
  ],
  ev: [
    { type: 'First Aid Kit - Comprehensive', category: EquipmentCategory.MEDICAL, quantity: 1, hasExpiration: true, expirationMonths: 36, requiresInspection: true, inspectionDays: 180 },
    { type: 'Fire Extinguisher - Class ABC/D', category: EquipmentCategory.SAFETY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Reflective Triangles', category: EquipmentCategory.EMERGENCY, quantity: 3, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Emergency Flares', category: EquipmentCategory.EMERGENCY, quantity: 6, hasExpiration: true, expirationMonths: 48, requiresInspection: false },
    { type: 'EV Charging Cable - Level 2', category: EquipmentCategory.SPECIALTY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
    { type: 'Portable Charging Adapter', category: EquipmentCategory.SPECIALTY, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'Flashlight with Batteries', category: EquipmentCategory.EMERGENCY, quantity: 1, hasExpiration: false, requiresInspection: true, inspectionDays: 180 },
    { type: 'Emergency Blanket', category: EquipmentCategory.EMERGENCY, quantity: 2, hasExpiration: false, requiresInspection: false },
    { type: 'Basic Tool Kit', category: EquipmentCategory.TOOLS, quantity: 1, hasExpiration: false, requiresInspection: false },
    { type: 'High Voltage Warning Signs', category: EquipmentCategory.SAFETY, quantity: 2, hasExpiration: false, requiresInspection: true, inspectionDays: 365 },
  ],
}

/**
 * Vehicle Inventory Emulator Class
 */
export class VehicleInventoryEmulator extends EventEmitter {
  private config: EmulatorConfig
  private status: EmulatorStatus = 'idle'
  private updateInterval: NodeJS.Timeout | null = null

  // Data storage (in production, this would be database-backed)
  private inventory: Map<string, EquipmentItem[]> = new Map()
  private inspections: Map<string, InventoryInspection[]> = new Map()
  private alerts: Map<string, ComplianceAlert[]> = new Map()
  private summaries: Map<string, VehicleInventorySummary> = new Map()

  // Tracking
  private startTime: Date | null = null
  private eventsGenerated: number = 0

  constructor(config: EmulatorConfig) {
    super()
    this.config = config
  }

  /**
   * Start the inventory emulator
   */
  async start(): Promise<void> {
    if (this.status === 'running') {
      console.warn('VehicleInventoryEmulator is already running')
      return
    }

    console.log('Starting VehicleInventoryEmulator...')
    this.status = 'running'
    this.startTime = new Date()

    // Start periodic compliance checks
    const checkInterval = this.config.performance?.updateInterval || 86400000 // Daily by default
    this.updateInterval = setInterval(() => {
      this.performComplianceCheck()
    }, checkInterval)

    this.emit('started', { timestamp: new Date() })
    console.log('VehicleInventoryEmulator started successfully')
  }

  /**
   * Stop the emulator
   */
  async stop(): Promise<void> {
    if (this.status !== 'running') {
      console.warn('VehicleInventoryEmulator is not running')
      return
    }

    console.log('Stopping VehicleInventoryEmulator...')

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.status = 'idle'
    this.emit('stopped', { timestamp: new Date(), eventsGenerated: this.eventsGenerated })
    console.log('VehicleInventoryEmulator stopped')
  }

  /**
   * Pause the emulator
   */
  async pause(): Promise<void> {
    if (this.status !== 'running') {
      console.warn('Cannot pause: VehicleInventoryEmulator is not running')
      return
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.status = 'paused'
    this.emit('paused', { timestamp: new Date() })
  }

  /**
   * Resume the emulator
   */
  async resume(): Promise<void> {
    if (this.status !== 'paused') {
      console.warn('Cannot resume: VehicleInventoryEmulator is not paused')
      return
    }

    this.status = 'running'

    const checkInterval = this.config.performance?.updateInterval || 86400000
    this.updateInterval = setInterval(() => {
      this.performComplianceCheck()
    }, checkInterval)

    this.emit('resumed', { timestamp: new Date() })
  }

  /**
   * Initialize inventory for a vehicle
   */
  initializeVehicleInventory(
    vehicleId: string,
    vehicleType: 'sedan' | 'suv' | 'truck' | 'van' | 'ev',
    vehicleVin: string
  ): EquipmentItem[] {
    const template = EQUIPMENT_TEMPLATES[vehicleType] || EQUIPMENT_TEMPLATES.sedan
    const items: EquipmentItem[] = []

    const purchaseDate = faker.date.between({ from: '2020-01-01', to: new Date() })

    template.forEach((templateItem, index) => {
      const item = this.generateEquipmentItem(
        vehicleId,
        templateItem,
        purchaseDate,
        index
      )
      items.push(item)
    })

    this.inventory.set(vehicleId, items)
    this.updateVehicleSummary(vehicleId, vehicleVin)
    this.generateComplianceAlerts(vehicleId)

    this.emit('inventory-initialized', {
      vehicleId,
      itemCount: items.length,
      totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
      timestamp: new Date()
    })

    return items
  }

  /**
   * Generate a single equipment item from template
   */
  private generateEquipmentItem(
    vehicleId: string,
    template: any,
    purchaseDate: Date,
    index: number
  ): EquipmentItem {
    const now = new Date()
    const installDate = new Date(purchaseDate.getTime() + faker.number.int({ min: 0, max: 30 }) * 86400000)

    // Calculate expiration date if applicable
    let expirationDate: Date | undefined
    if (template.hasExpiration && template.expirationMonths) {
      const monthsToAdd = template.expirationMonths
      expirationDate = new Date(installDate)
      expirationDate.setMonth(expirationDate.getMonth() + monthsToAdd)
    }

    // Calculate next inspection date if applicable
    let nextInspectionDate: Date | undefined
    let lastInspectionDate: Date | undefined
    if (template.requiresInspection && template.inspectionDays) {
      lastInspectionDate = faker.date.recent({ days: template.inspectionDays })
      nextInspectionDate = new Date(lastInspectionDate)
      nextInspectionDate.setDate(nextInspectionDate.getDate() + template.inspectionDays)
    }

    // Determine condition based on age and expiration
    let condition = EquipmentCondition.GOOD
    const ageMonths = (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (expirationDate && now > expirationDate) {
      condition = EquipmentCondition.EXPIRED
    } else if (ageMonths > 36) {
      condition = faker.helpers.arrayElement([EquipmentCondition.FAIR, EquipmentCondition.GOOD])
    } else if (ageMonths > 24) {
      condition = EquipmentCondition.GOOD
    } else {
      condition = faker.helpers.arrayElement([EquipmentCondition.NEW, EquipmentCondition.GOOD])
    }

    // Determine compliance status
    let complianceStatus = ComplianceStatus.COMPLIANT
    if (condition === EquipmentCondition.EXPIRED) {
      complianceStatus = ComplianceStatus.EXPIRED
    } else if (expirationDate) {
      const daysUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysUntilExpiration <= 30) {
        complianceStatus = ComplianceStatus.WARNING
      }
    } else if (nextInspectionDate && now > nextInspectionDate) {
      complianceStatus = ComplianceStatus.WARNING
    }

    const unitCost = faker.number.float({ min: 10, max: 500, precision: 0.01 })
    const totalValue = unitCost * template.quantity

    const locations = [
      'Glove Box',
      'Center Console',
      'Under Driver Seat',
      'Under Passenger Seat',
      'Trunk',
      'Cargo Area',
      'Side Compartment',
      'Overhead Storage',
      'Rear Cargo',
      'Tool Box'
    ]

    return {
      id: `${vehicleId}-equipment-${index}`,
      vehicleId,
      equipmentType: template.type,
      category: template.category,
      manufacturer: faker.company.name(),
      modelNumber: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
      serialNumber: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
      quantity: template.quantity,
      unitCost,
      totalValue,
      purchaseDate,
      installDate,
      warrantyExpiration: template.hasExpiration
        ? new Date(installDate.getTime() + 365 * 86400000)
        : undefined,
      condition,
      location: faker.helpers.arrayElement(locations),

      hasExpiration: template.hasExpiration,
      expirationDate,
      requiresInspection: template.requiresInspection,
      lastInspectionDate,
      nextInspectionDate,
      inspectionIntervalDays: template.inspectionDays,

      complianceStatus,
      requiredByRegulation: template.requiredByRegulation || [],
      isRequired: (template.requiredByRegulation?.length || 0) > 0,

      lastCheckedBy: faker.person.fullName(),
      lastCheckedDate: faker.date.recent({ days: 90 }),
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : undefined,

      createdAt: installDate,
      updatedAt: now
    }
  }

  /**
   * Get inventory for a vehicle
   */
  getVehicleInventory(vehicleId: string): EquipmentItem[] {
    return this.inventory.get(vehicleId) || []
  }

  /**
   * Get vehicle inventory summary
   */
  getVehicleSummary(vehicleId: string): VehicleInventorySummary | undefined {
    return this.summaries.get(vehicleId)
  }

  /**
   * Update vehicle inventory summary
   */
  private updateVehicleSummary(vehicleId: string, vehicleVin: string): void {
    const items = this.inventory.get(vehicleId) || []
    const now = new Date()

    const itemsByCategory: Record<EquipmentCategory, number> = {
      [EquipmentCategory.SAFETY]: 0,
      [EquipmentCategory.EMERGENCY]: 0,
      [EquipmentCategory.MEDICAL]: 0,
      [EquipmentCategory.TOOLS]: 0,
      [EquipmentCategory.COMMUNICATION]: 0,
      [EquipmentCategory.SPECIALTY]: 0,
    }

    const itemsByCondition: Record<EquipmentCondition, number> = {
      [EquipmentCondition.NEW]: 0,
      [EquipmentCondition.GOOD]: 0,
      [EquipmentCondition.FAIR]: 0,
      [EquipmentCondition.NEEDS_REPLACEMENT]: 0,
      [EquipmentCondition.EXPIRED]: 0,
    }

    let expiringWithin30Days = 0
    let expiringWithin90Days = 0
    let inspectionsDue = 0
    let compliantItems = 0

    items.forEach(item => {
      itemsByCategory[item.category]++
      itemsByCondition[item.condition]++

      if (item.complianceStatus === ComplianceStatus.COMPLIANT) {
        compliantItems++
      }

      if (item.expirationDate) {
        const daysUntilExpiration = (item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
          expiringWithin30Days++
        }
        if (daysUntilExpiration <= 90 && daysUntilExpiration > 0) {
          expiringWithin90Days++
        }
      }

      if (item.nextInspectionDate && now >= item.nextInspectionDate) {
        inspectionsDue++
      }
    })

    const vehicleAlerts = this.alerts.get(vehicleId) || []
    const activeAlerts = vehicleAlerts.filter(a => !a.acknowledged).length
    const criticalAlerts = vehicleAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length

    const vehicleInspections = this.inspections.get(vehicleId) || []
    const lastInspection = vehicleInspections.length > 0
      ? vehicleInspections.sort((a, b) => b.inspectionDate.getTime() - a.inspectionDate.getTime())[0]
      : undefined

    const summary: VehicleInventorySummary = {
      vehicleId,
      vehicleVin,
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
      complianceRate: items.length > 0 ? (compliantItems / items.length) * 100 : 100,
      itemsByCategory,
      itemsByCondition,
      expiringWithin30Days,
      expiringWithin90Days,
      inspectionsDue,
      activeAlerts,
      criticalAlerts,
      lastInspectionDate: lastInspection?.inspectionDate,
      nextInspectionDate: lastInspection?.nextInspectionDue,
      updatedAt: now
    }

    this.summaries.set(vehicleId, summary)
  }

  /**
   * Generate compliance alerts for a vehicle
   */
  private generateComplianceAlerts(vehicleId: string): void {
    const items = this.inventory.get(vehicleId) || []
    const alerts: ComplianceAlert[] = []
    const now = new Date()

    items.forEach(item => {
      // Expiration alerts
      if (item.expirationDate) {
        const daysUntilExpiration = Math.floor((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiration < 0) {
          alerts.push({
            id: `alert-${vehicleId}-${item.id}-expired`,
            vehicleId,
            equipmentId: item.id,
            alertType: 'expiration_warning',
            severity: 'critical',
            message: `${item.equipmentType} has EXPIRED (${Math.abs(daysUntilExpiration)} days ago)`,
            dueDate: item.expirationDate,
            daysUntilDue: daysUntilExpiration,
            notificationsSent: 0,
            acknowledged: false,
            createdAt: now
          })
        } else if (daysUntilExpiration <= 30) {
          alerts.push({
            id: `alert-${vehicleId}-${item.id}-expiring-30`,
            vehicleId,
            equipmentId: item.id,
            alertType: 'expiration_warning',
            severity: 'high',
            message: `${item.equipmentType} expires in ${daysUntilExpiration} days`,
            dueDate: item.expirationDate,
            daysUntilDue: daysUntilExpiration,
            notificationsSent: 0,
            acknowledged: false,
            createdAt: now
          })
        } else if (daysUntilExpiration <= 90) {
          alerts.push({
            id: `alert-${vehicleId}-${item.id}-expiring-90`,
            vehicleId,
            equipmentId: item.id,
            alertType: 'expiration_warning',
            severity: 'medium',
            message: `${item.equipmentType} expires in ${daysUntilExpiration} days`,
            dueDate: item.expirationDate,
            daysUntilDue: daysUntilExpiration,
            notificationsSent: 0,
            acknowledged: false,
            createdAt: now
          })
        }
      }

      // Inspection alerts
      if (item.nextInspectionDate) {
        const daysUntilInspection = Math.floor((item.nextInspectionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilInspection < 0) {
          alerts.push({
            id: `alert-${vehicleId}-${item.id}-inspection-overdue`,
            vehicleId,
            equipmentId: item.id,
            alertType: 'inspection_due',
            severity: 'high',
            message: `${item.equipmentType} inspection is OVERDUE (${Math.abs(daysUntilInspection)} days)`,
            dueDate: item.nextInspectionDate,
            daysUntilDue: daysUntilInspection,
            notificationsSent: 0,
            acknowledged: false,
            createdAt: now
          })
        } else if (daysUntilInspection <= 14) {
          alerts.push({
            id: `alert-${vehicleId}-${item.id}-inspection-due`,
            vehicleId,
            equipmentId: item.id,
            alertType: 'inspection_due',
            severity: 'medium',
            message: `${item.equipmentType} inspection due in ${daysUntilInspection} days`,
            dueDate: item.nextInspectionDate,
            daysUntilDue: daysUntilInspection,
            notificationsSent: 0,
            acknowledged: false,
            createdAt: now
          })
        }
      }
    })

    this.alerts.set(vehicleId, alerts)

    // Emit alert events
    alerts.forEach(alert => {
      this.emit('compliance-alert', alert)
      this.eventsGenerated++
    })
  }

  /**
   * Perform compliance check across all vehicles
   */
  private performComplianceCheck(): void {
    console.log('Performing compliance check across all vehicles...')

    this.inventory.forEach((items, vehicleId) => {
      this.generateComplianceAlerts(vehicleId)
      const summary = this.summaries.get(vehicleId)
      if (summary) {
        this.updateVehicleSummary(vehicleId, summary.vehicleVin)
      }
    })

    this.emit('compliance-check-completed', {
      vehiclesChecked: this.inventory.size,
      timestamp: new Date()
    })
  }

  /**
   * Conduct inventory inspection
   */
  conductInspection(
    vehicleId: string,
    inspectorId: string,
    inspectorName: string,
    inspectionType: 'routine' | 'annual' | 'incident' | 'audit' = 'routine'
  ): InventoryInspection {
    const items = this.inventory.get(vehicleId) || []
    const now = new Date()

    const findings: InventoryFinding[] = []
    let compliantCount = 0
    let nonCompliantCount = 0

    items.forEach(item => {
      if (item.complianceStatus === ComplianceStatus.COMPLIANT) {
        compliantCount++
      } else {
        nonCompliantCount++

        let findingType: InventoryFinding['findingType'] = 'non_compliant'
        let severity: InventoryFinding['severity'] = 'medium'

        if (item.complianceStatus === ComplianceStatus.EXPIRED) {
          findingType = 'expired'
          severity = 'high'
        } else if (item.complianceStatus === ComplianceStatus.MISSING) {
          findingType = 'missing'
          severity = 'critical'
        }

        findings.push({
          equipmentId: item.id,
          equipmentType: item.equipmentType,
          findingType,
          severity,
          description: `${item.equipmentType} - Status: ${item.complianceStatus}`,
          requiredAction: findingType === 'expired'
            ? 'Replace equipment immediately'
            : 'Inspect and update as needed',
          dueDate: new Date(now.getTime() + 7 * 86400000) // 7 days
        })
      }
    })

    const overallCompliance = items.length > 0
      ? (compliantCount / items.length) * 100
      : 100

    const inspection: InventoryInspection = {
      id: `inspection-${vehicleId}-${Date.now()}`,
      vehicleId,
      inspectorId,
      inspectorName,
      inspectionDate: now,
      inspectionType,
      itemsInspected: items.length,
      itemsCompliant: compliantCount,
      itemsNonCompliant: nonCompliantCount,
      itemsMissing: 0,
      overallCompliance,
      findings,
      correctiveActions: [],
      status: 'completed',
      nextInspectionDue: new Date(now.getTime() + 365 * 86400000), // 1 year
      createdAt: now
    }

    const vehicleInspections = this.inspections.get(vehicleId) || []
    vehicleInspections.push(inspection)
    this.inspections.set(vehicleId, vehicleInspections)

    this.emit('inspection-completed', inspection)
    this.eventsGenerated++

    return inspection
  }

  /**
   * Get compliance alerts for a vehicle
   */
  getVehicleAlerts(vehicleId: string): ComplianceAlert[] {
    return this.alerts.get(vehicleId) || []
  }

  /**
   * Get inspection history for a vehicle
   */
  getVehicleInspections(vehicleId: string): InventoryInspection[] {
    return this.inspections.get(vehicleId) || []
  }

  /**
   * Get current emulator state
   */
  getCurrentState(): any {
    return {
      status: this.status,
      startTime: this.startTime,
      vehiclesTracked: this.inventory.size,
      totalItems: Array.from(this.inventory.values()).reduce((sum, items) => sum + items.length, 0),
      totalInspections: Array.from(this.inspections.values()).reduce((sum, insp) => sum + insp.length, 0),
      totalAlerts: Array.from(this.alerts.values()).reduce((sum, alerts) => sum + alerts.length, 0),
      eventsGenerated: this.eventsGenerated,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
    }
  }

  /**
   * Get all vehicle summaries
   */
  getAllSummaries(): VehicleInventorySummary[] {
    return Array.from(this.summaries.values())
  }
}

export default VehicleInventoryEmulator
