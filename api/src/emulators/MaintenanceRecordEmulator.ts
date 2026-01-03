/**
 * Maintenance Record Emulator
 * Generates realistic maintenance records dynamically
 * No hardcoded data - all generated from patterns
 */

import { faker } from '@faker-js/faker'

export interface EmulatedMaintenanceRecord {
  id: number
  vehicleId: number
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  serviceDate: Date
  serviceType: 'scheduled' | 'unscheduled'
  category: string
  description: string
  mileageAtService: number
  nextServiceDue: number
  technician: string
  vendorId: string
  vendorName: string
  laborHours: number
  laborRate: number
  laborCost: number
  parts: MaintenancePart[]
  partsCost: number
  totalCost: number
  warranty: boolean
  warrantyExpiryDate?: Date
  status: 'completed' | 'in-progress' | 'scheduled'
  notes?: string
}

interface MaintenancePart {
  name: string
  partNumber: string
  quantity: number
  unitCost: number
  totalCost: number
}

const SERVICE_CATEGORIES = {
  oilChange: {
    name: 'Oil Change',
    interval: 5000,
    laborHours: { min: 0.5, max: 1.0 },
    partsCost: { min: 30, max: 80 }
  },
  tireRotation: {
    name: 'Tire Rotation',
    interval: 7500,
    laborHours: { min: 0.5, max: 1.0 },
    partsCost: { min: 0, max: 20 }
  },
  brakes: {
    name: 'Brake Service',
    interval: 30000,
    laborHours: { min: 2.0, max: 4.0 },
    partsCost: { min: 200, max: 600 }
  },
  inspection: {
    name: 'Vehicle Inspection',
    interval: 10000,
    laborHours: { min: 1.0, max: 2.0 },
    partsCost: { min: 0, max: 50 }
  },
  transmission: {
    name: 'Transmission Service',
    interval: 50000,
    laborHours: { min: 3.0, max: 6.0 },
    partsCost: { min: 150, max: 400 }
  },
  airFilter: {
    name: 'Air Filter Replacement',
    interval: 15000,
    laborHours: { min: 0.25, max: 0.5 },
    partsCost: { min: 20, max: 60 }
  },
  battery: {
    name: 'Battery Replacement',
    interval: 40000,
    laborHours: { min: 0.5, max: 1.0 },
    partsCost: { min: 100, max: 250 }
  }
}

const UNSCHEDULED_SERVICES = [
  { name: 'Alternator Repair', laborHours: { min: 2.0, max: 4.0 }, partsCost: { min: 300, max: 800 } },
  { name: 'Starter Motor Replacement', laborHours: { min: 1.5, max: 3.0 }, partsCost: { min: 250, max: 600 } },
  { name: 'Suspension Repair', laborHours: { min: 3.0, max: 6.0 }, partsCost: { min: 400, max: 1200 } },
  { name: 'Exhaust System Repair', laborHours: { min: 2.0, max: 4.0 }, partsCost: { min: 200, max: 700 } },
  { name: 'Radiator Replacement', laborHours: { min: 3.0, max: 5.0 }, partsCost: { min: 400, max: 900 } },
  { name: 'Coolant System Flush', laborHours: { min: 1.0, max: 2.0 }, partsCost: { min: 50, max: 150 } },
  { name: 'Electrical System Repair', laborHours: { min: 2.0, max: 5.0 }, partsCost: { min: 150, max: 500 } },
  { name: 'AC Compressor Replacement', laborHours: { min: 3.0, max: 5.0 }, partsCost: { min: 500, max: 1200 } }
]

const VENDORS = [
  'Jiffy Lube',
  'Midas Auto Service',
  'Firestone Complete Auto Care',
  'Pep Boys',
  'AutoZone Service Center',
  'Precision Tune Auto Care',
  'Valvoline Instant Oil Change',
  'Goodyear Auto Service',
  'Tire Kingdom',
  'NTB - National Tire & Battery'
]

const TECHNICIAN_NAMES = [
  'Mike Johnson',
  'Sarah Williams',
  'Robert Martinez',
  'Jennifer Davis',
  'David Thompson',
  'Lisa Anderson',
  'James Wilson',
  'Maria Garcia',
  'John Taylor',
  'Patricia Brown'
]

export class MaintenanceRecordEmulator {
  private static instance: MaintenanceRecordEmulator
  private records: Map<number, EmulatedMaintenanceRecord> = new Map()
  private nextId = 1

  // NOTE: Hardcoded for emulator/demo mode only - $95/hour
  // PRODUCTION: Should query labor_rates table from database
  // SELECT rate FROM labor_rates WHERE vendor_id = $1 AND service_category = $2
  private readonly LABOR_RATE = 95

  private constructor() {
    this.generateInitialRecords(100)
  }

  static getInstance(): MaintenanceRecordEmulator {
    if (!MaintenanceRecordEmulator.instance) {
      MaintenanceRecordEmulator.instance = new MaintenanceRecordEmulator()
    }
    return MaintenanceRecordEmulator.instance
  }

  private generateParts(category: string, targetCost: number, partsCount: number = 0): MaintenancePart[] {
    const parts: MaintenancePart[] = []
    const count = partsCount || faker.number.int({ min: 1, max: 4 })

    for (let i = 0; i < count; i++) {
      const unitCost = targetCost / count
      const part: MaintenancePart = {
        name: `${category} Part ${i + 1}`,
        partNumber: `PN-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
        quantity: 1,
        unitCost: Number(unitCost.toFixed(2)),
        totalCost: Number(unitCost.toFixed(2))
      }
      parts.push(part)
    }

    return parts
  }

  private generateRecord(id: number): EmulatedMaintenanceRecord {
    const serviceDate = faker.date.past({ years: 2 })
    const isScheduled = Math.random() > 0.3 // 70% scheduled, 30% unscheduled

    let category: string
    let description: string
    let laborHoursRange: { min: number; max: number }
    let partsCostRange: { min: number; max: number }
    let interval = 5000

    if (isScheduled) {
      const categoryKeys = Object.keys(SERVICE_CATEGORIES)
      const categoryKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)]
      const serviceDef = SERVICE_CATEGORIES[categoryKey as keyof typeof SERVICE_CATEGORIES]

      category = categoryKey
      description = serviceDef.name
      laborHoursRange = serviceDef.laborHours
      partsCostRange = serviceDef.partsCost
      interval = serviceDef.interval
    } else {
      const unscheduled = UNSCHEDULED_SERVICES[Math.floor(Math.random() * UNSCHEDULED_SERVICES.length)]
      category = 'unscheduled'
      description = unscheduled.name
      laborHoursRange = unscheduled.laborHours
      partsCostRange = unscheduled.partsCost
    }

    const laborHours = Number((Math.random() * (laborHoursRange.max - laborHoursRange.min) + laborHoursRange.min).toFixed(2))
    const laborCost = Number((laborHours * this.LABOR_RATE).toFixed(2))
    const partsCost = Number((Math.random() * (partsCostRange.max - partsCostRange.min) + partsCostRange.min).toFixed(2))
    const parts = this.generateParts(description, partsCost)
    const totalCost = Number((laborCost + partsCost).toFixed(2))

    const vehicleId = faker.number.int({ min: 1, max: 50 })
    const mileageAtService = faker.number.int({ min: 5000, max: 150000 })
    const warranty = Math.random() > 0.6 // 40% have warranty
    const vendorName = VENDORS[Math.floor(Math.random() * VENDORS.length)]
    const vendorId = `V-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`

    const statuses: Array<'completed' | 'in-progress' | 'scheduled'> = ['completed', 'completed', 'completed', 'completed', 'in-progress', 'scheduled']
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    return {
      id,
      vehicleId,
      vehicleNumber: `V-${String(vehicleId).padStart(3, '0')}`,
      vehicleMake: faker.vehicle.manufacturer(),
      vehicleModel: faker.vehicle.model(),
      serviceDate,
      serviceType: isScheduled ? 'scheduled' : 'unscheduled',
      category,
      description,
      mileageAtService,
      nextServiceDue: mileageAtService + interval,
      technician: TECHNICIAN_NAMES[Math.floor(Math.random() * TECHNICIAN_NAMES.length)],
      vendorId,
      vendorName,
      laborHours,
      laborRate: this.LABOR_RATE,
      laborCost,
      parts,
      partsCost,
      totalCost,
      warranty,
      warrantyExpiryDate: warranty ? faker.date.future({ years: 1 }) : undefined,
      status,
      notes: Math.random() > 0.7 ? faker.lorem.sentence() : undefined
    }
  }

  private generateInitialRecords(count: number): void {
    for (let i = 0; i < count; i++) {
      const record = this.generateRecord(this.nextId)
      this.records.set(this.nextId, record)
      this.nextId++
    }
  }

  getAll(): EmulatedMaintenanceRecord[] {
    return Array.from(this.records.values()).sort((a, b) =>
      b.serviceDate.getTime() - a.serviceDate.getTime()
    )
  }

  getById(id: number): EmulatedMaintenanceRecord | undefined {
    return this.records.get(id)
  }

  getByVehicleId(vehicleId: number): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r => r.vehicleId === vehicleId)
  }

  create(data: Partial<EmulatedMaintenanceRecord>): EmulatedMaintenanceRecord {
    const newRecord = this.generateRecord(this.nextId)
    const record = { ...newRecord, ...data, id: this.nextId }
    this.records.set(this.nextId, record)
    this.nextId++
    return record
  }

  update(id: number, data: Partial<EmulatedMaintenanceRecord>): EmulatedMaintenanceRecord | null {
    const record = this.records.get(id)
    if (!record) {
return null
}

    const updated = { ...record, ...data, id }
    this.records.set(id, updated)
    return updated
  }

  delete(id: number): boolean {
    return this.records.delete(id)
  }

  search(query: string): EmulatedMaintenanceRecord[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(r =>
      r.vehicleNumber.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.technician.toLowerCase().includes(lowerQuery) ||
      r.vendorName.toLowerCase().includes(lowerQuery) ||
      r.category.toLowerCase().includes(lowerQuery)
    )
  }

  filterByServiceType(serviceType: string): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r => r.serviceType === serviceType)
  }

  filterByStatus(status: string): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r => r.status === status)
  }

  filterByCategory(category: string): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r => r.category === category)
  }

  filterByVehicle(vehicleNumber: string): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r => r.vehicleNumber === vehicleNumber)
  }

  filterByDateRange(startDate: Date, endDate: Date): EmulatedMaintenanceRecord[] {
    return this.getAll().filter(r =>
      r.serviceDate >= startDate && r.serviceDate <= endDate
    )
  }

  // Emulate real-time maintenance updates
  emulateRealTimeUpdates(): void {
    setInterval(() => {
      const records = this.getAll().filter(r => r.status === 'in-progress')
      if (records.length === 0) {
return
}

      const randomRecord = records[Math.floor(Math.random() * records.length)]

      // Simulate completing in-progress maintenance
      if (Math.random() > 0.5) {
        randomRecord.status = 'completed'
        this.records.set(randomRecord.id, randomRecord)
      }

      // Occasionally add a new maintenance record
      if (Math.random() > 0.9) {
        const newRecord = this.generateRecord(this.nextId)
        newRecord.status = 'in-progress'
        this.records.set(this.nextId, newRecord)
        this.nextId++
      }
    }, 60000) // Update every minute
  }
}

export const maintenanceRecordEmulator = MaintenanceRecordEmulator.getInstance()
maintenanceRecordEmulator.emulateRealTimeUpdates()
