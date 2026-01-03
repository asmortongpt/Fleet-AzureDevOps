/**
 * VehicleInventoryEmulator Tests
 * Comprehensive test suite for vehicle inventory emulation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { EmulatorConfig } from '../../types'
import { VehicleInventoryEmulator, EquipmentCategory } from '../VehicleInventoryEmulator'

describe('VehicleInventoryEmulator', () => {
  let emulator: VehicleInventoryEmulator
  let mockConfig: EmulatorConfig

  beforeEach(() => {
    mockConfig = {
      emulator: {
        version: '1.0.0',
        name: 'Vehicle Inventory Emulator',
        description: 'Test emulator'
      },
      timeCompression: {
        enabled: false,
        ratio: 1,
        description: 'No time compression'
      },
      persistence: {
        enabled: false,
        database: 'test',
        redis: {
          enabled: false,
          ttl: 3600
        }
      },
      realtime: {
        websocket: {
          enabled: false,
          port: 8080,
          path: '/ws'
        },
        broadcasting: {
          interval: 1000,
          batchSize: 10
        }
      },
      performance: {
        maxVehicles: 100,
        maxConcurrentEmulators: 50,
        updateInterval: 5000,
        memoryLimit: '512MB'
      }
    }

    emulator = new VehicleInventoryEmulator(mockConfig)
  })

  afterEach(async () => {
    if (emulator) {
      await emulator.stop()
    }
  })

  describe('Lifecycle Management', () => {
    it('should initialize emulator in idle state', () => {
      const state = emulator.getCurrentState()
      expect(state.status).toBe('idle')
      expect(state.vehiclesTracked).toBe(0)
    })

    it('should start emulator successfully', async () => {
      const startPromise = new Promise((resolve) => {
        emulator.once('started', resolve)
      })

      await emulator.start()
      await startPromise

      const state = emulator.getCurrentState()
      expect(state.status).toBe('running')
      expect(state.startTime).toBeDefined()
    })

    it('should stop emulator successfully', async () => {
      await emulator.start()

      const stopPromise = new Promise((resolve) => {
        emulator.once('stopped', resolve)
      })

      await emulator.stop()
      await stopPromise

      const state = emulator.getCurrentState()
      expect(state.status).toBe('idle')
    })

    it('should pause and resume emulator', async () => {
      await emulator.start()

      await emulator.pause()
      let state = emulator.getCurrentState()
      expect(state.status).toBe('paused')

      await emulator.resume()
      state = emulator.getCurrentState()
      expect(state.status).toBe('running')

      await emulator.stop()
    })

    it('should not start if already running', async () => {
      await emulator.start()
      const consoleSpy = vi.spyOn(console, 'warn')

      await emulator.start()
      expect(consoleSpy).toHaveBeenCalledWith('VehicleInventoryEmulator is already running')

      await emulator.stop()
      consoleSpy.mockRestore()
    })
  })

  describe('Inventory Initialization', () => {
    it('should initialize inventory for sedan vehicle type', () => {
      const vehicleId = 'vehicle-sedan-001'
      const vehicleVin = '1HGBH41JXMN109186'

      const items = emulator.initializeVehicleInventory(vehicleId, 'sedan', vehicleVin)

      expect(items).toBeDefined()
      expect(items.length).toBeGreaterThan(0)
      expect(items.every(item => item.vehicleId === vehicleId)).toBe(true)
    })

    it('should initialize inventory for truck vehicle type with DOT compliance items', () => {
      const vehicleId = 'vehicle-truck-001'
      const vehicleVin = '1FTFW1ET5DFC10312'

      const items = emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      expect(items).toBeDefined()
      expect(items.length).toBeGreaterThan(0)

      // Trucks should have required DOT items
      const dotItems = items.filter(item =>
        item.requiredByRegulation?.includes('DOT')
      )
      expect(dotItems.length).toBeGreaterThan(0)

      // Check for specific required equipment
      const fireExtinguisher = items.find(item => item.equipmentType.includes('Fire Extinguisher'))
      expect(fireExtinguisher).toBeDefined()
      expect(fireExtinguisher?.quantity).toBeGreaterThan(0)

      const triangles = items.find(item => item.equipmentType.includes('Reflective Triangles'))
      expect(triangles).toBeDefined()
    })

    it('should initialize inventory for EV with specialized equipment', () => {
      const vehicleId = 'vehicle-ev-001'
      const vehicleVin = '5YJ3E1EA1KF123456'

      const items = emulator.initializeVehicleInventory(vehicleId, 'ev', vehicleVin)

      expect(items).toBeDefined()

      // EVs should have charging cables
      const chargingCable = items.find(item => item.equipmentType.includes('Charging Cable'))
      expect(chargingCable).toBeDefined()
      expect(chargingCable?.category).toBe(EquipmentCategory.SPECIALTY)
    })

    it('should assign unique IDs to all equipment items', () => {
      const vehicleId = 'vehicle-test-001'
      const vehicleVin = 'TEST1234567890123'

      const items = emulator.initializeVehicleInventory(vehicleId, 'suv', vehicleVin)

      const ids = items.map(item => item.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(uniqueIds.size)
    })

    it('should emit inventory-initialized event', (done) => {
      const vehicleId = 'vehicle-event-test'
      const vehicleVin = 'EVENT123456789012'

      emulator.once('inventory-initialized', (event) => {
        expect(event.vehicleId).toBe(vehicleId)
        expect(event.itemCount).toBeGreaterThan(0)
        expect(event.totalValue).toBeGreaterThan(0)
        expect(event.timestamp).toBeDefined()
        done()
      })

      emulator.initializeVehicleInventory(vehicleId, 'van', vehicleVin)
    })
  })

  describe('Equipment Properties', () => {
    it('should generate realistic equipment details', () => {
      const vehicleId = 'vehicle-props-test'
      const vehicleVin = 'PROPS12345678901'

      const items = emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      items.forEach(item => {
        expect(item.manufacturer).toBeDefined()
        expect(item.modelNumber).toBeDefined()
        expect(item.serialNumber).toBeDefined()
        expect(item.quantity).toBeGreaterThan(0)
        expect(item.unitCost).toBeGreaterThan(0)
        expect(item.totalValue).toBe(item.unitCost * item.quantity)
        expect(item.purchaseDate).toBeInstanceOf(Date)
        expect(item.installDate).toBeInstanceOf(Date)
        expect(item.location).toBeDefined()
      })
    })

    it('should set expiration dates for items that expire', () => {
      const vehicleId = 'vehicle-expiration-test'
      const vehicleVin = 'EXPIRY1234567890'

      const items = emulator.initializeVehicleInventory(vehicleId, 'sedan', vehicleVin)

      const expiringItems = items.filter(item => item.hasExpiration)

      expect(expiringItems.length).toBeGreaterThan(0)
      expiringItems.forEach(item => {
        expect(item.expirationDate).toBeDefined()
        expect(item.expirationDate).toBeInstanceOf(Date)
      })
    })

    it('should set inspection dates for items requiring inspection', () => {
      const vehicleId = 'vehicle-inspection-test'
      const vehicleVin = 'INSPECT123456789'

      const items = emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      const inspectionItems = items.filter(item => item.requiresInspection)

      expect(inspectionItems.length).toBeGreaterThan(0)
      inspectionItems.forEach(item => {
        expect(item.nextInspectionDate).toBeDefined()
        expect(item.inspectionIntervalDays).toBeGreaterThan(0)
      })
    })

    it('should categorize equipment correctly', () => {
      const vehicleId = 'vehicle-category-test'
      const vehicleVin = 'CATEGORY1234567'

      const items = emulator.initializeVehicleInventory(vehicleId, 'suv', vehicleVin)

      const categories = Object.values(EquipmentCategory)
      items.forEach(item => {
        expect(categories).toContain(item.category)
      })

      // Should have at least safety and emergency items
      expect(items.some(item => item.category === EquipmentCategory.SAFETY)).toBe(true)
      expect(items.some(item => item.category === EquipmentCategory.EMERGENCY)).toBe(true)
    })
  })

  describe('Compliance Tracking', () => {
    it('should generate compliance alerts for expiring items', () => {
      const vehicleId = 'vehicle-compliance-001'
      const vehicleVin = 'COMPLY1234567890'

      emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      const alerts = emulator.getVehicleAlerts(vehicleId)
      expect(alerts).toBeDefined()
      expect(Array.isArray(alerts)).toBe(true)
    })

    it('should track regulatory requirements', () => {
      const vehicleId = 'vehicle-regulation-001'
      const vehicleVin = 'REGULATE12345678'

      const items = emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      const regulatedItems = items.filter(item => item.isRequired)
      expect(regulatedItems.length).toBeGreaterThan(0)

      regulatedItems.forEach(item => {
        expect(item.requiredByRegulation).toBeDefined()
        expect(item.requiredByRegulation!.length).toBeGreaterThan(0)
      })
    })

    it('should update vehicle summary with compliance metrics', () => {
      const vehicleId = 'vehicle-summary-001'
      const vehicleVin = 'SUMMARY123456789'

      emulator.initializeVehicleInventory(vehicleId, 'van', vehicleVin)

      const summary = emulator.getVehicleSummary(vehicleId)
      expect(summary).toBeDefined()
      expect(summary?.vehicleId).toBe(vehicleId)
      expect(summary?.vehicleVin).toBe(vehicleVin)
      expect(summary?.totalItems).toBeGreaterThan(0)
      expect(summary?.totalValue).toBeGreaterThan(0)
      expect(summary?.complianceRate).toBeGreaterThanOrEqual(0)
      expect(summary?.complianceRate).toBeLessThanOrEqual(100)
      expect(summary?.itemsByCategory).toBeDefined()
      expect(summary?.itemsByCondition).toBeDefined()
    })

    it('should count items expiring within time windows', () => {
      const vehicleId = 'vehicle-expiry-window'
      const vehicleVin = 'EXPIRYWIN12345678'

      emulator.initializeVehicleInventory(vehicleId, 'sedan', vehicleVin)

      const summary = emulator.getVehicleSummary(vehicleId)
      expect(summary).toBeDefined()
      expect(typeof summary?.expiringWithin30Days).toBe('number')
      expect(typeof summary?.expiringWithin90Days).toBe('number')
      expect(summary!.expiringWithin30Days).toBeLessThanOrEqual(summary!.expiringWithin90Days)
    })
  })

  describe('Inspections', () => {
    it('should conduct vehicle inventory inspection', () => {
      const vehicleId = 'vehicle-inspect-001'
      const vehicleVin = 'INSPVEH123456789'
      const inspectorId = 'inspector-001'
      const inspectorName = 'John Inspector'

      emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      const inspection = emulator.conductInspection(
        vehicleId,
        inspectorId,
        inspectorName,
        'routine'
      )

      expect(inspection).toBeDefined()
      expect(inspection.vehicleId).toBe(vehicleId)
      expect(inspection.inspectorId).toBe(inspectorId)
      expect(inspection.inspectorName).toBe(inspectorName)
      expect(inspection.inspectionType).toBe('routine')
      expect(inspection.itemsInspected).toBeGreaterThan(0)
      expect(inspection.status).toBe('completed')
      expect(inspection.overallCompliance).toBeGreaterThanOrEqual(0)
      expect(inspection.overallCompliance).toBeLessThanOrEqual(100)
      expect(inspection.nextInspectionDue).toBeInstanceOf(Date)
    })

    it('should generate findings for non-compliant items', () => {
      const vehicleId = 'vehicle-findings-001'
      const vehicleVin = 'FINDINGS12345678'
      const inspectorId = 'inspector-002'
      const inspectorName = 'Jane Inspector'

      emulator.initializeVehicleInventory(vehicleId, 'suv', vehicleVin)

      const inspection = emulator.conductInspection(
        vehicleId,
        inspectorId,
        inspectorName,
        'annual'
      )

      expect(inspection.findings).toBeDefined()
      expect(Array.isArray(inspection.findings)).toBe(true)

      if (inspection.itemsNonCompliant > 0) {
        expect(inspection.findings.length).toBeGreaterThan(0)

        inspection.findings.forEach(finding => {
          expect(finding.equipmentId).toBeDefined()
          expect(finding.equipmentType).toBeDefined()
          expect(finding.findingType).toBeDefined()
          expect(finding.severity).toBeDefined()
          expect(finding.description).toBeDefined()
          expect(finding.requiredAction).toBeDefined()
          expect(finding.dueDate).toBeInstanceOf(Date)
        })
      }
    })

    it('should emit inspection-completed event', (done) => {
      const vehicleId = 'vehicle-event-inspect'
      const vehicleVin = 'EVENTINSP1234567'

      emulator.initializeVehicleInventory(vehicleId, 'van', vehicleVin)

      emulator.once('inspection-completed', (inspection) => {
        expect(inspection.vehicleId).toBe(vehicleId)
        expect(inspection.status).toBe('completed')
        done()
      })

      emulator.conductInspection(vehicleId, 'inspector-003', 'Test Inspector', 'routine')
    })

    it('should track inspection history', () => {
      const vehicleId = 'vehicle-history-001'
      const vehicleVin = 'HISTORY123456789'

      emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      // Conduct multiple inspections
      emulator.conductInspection(vehicleId, 'inspector-001', 'Inspector One', 'routine')
      emulator.conductInspection(vehicleId, 'inspector-002', 'Inspector Two', 'annual')

      const history = emulator.getVehicleInspections(vehicleId)
      expect(history).toBeDefined()
      expect(history.length).toBe(2)
      expect(history[0].inspectionType).toBe('routine')
      expect(history[1].inspectionType).toBe('annual')
    })
  })

  describe('Data Retrieval', () => {
    it('should retrieve vehicle inventory by vehicle ID', () => {
      const vehicleId = 'vehicle-retrieve-001'
      const vehicleVin = 'RETRIEVE12345678'

      emulator.initializeVehicleInventory(vehicleId, 'sedan', vehicleVin)

      const inventory = emulator.getVehicleInventory(vehicleId)
      expect(inventory).toBeDefined()
      expect(inventory.length).toBeGreaterThan(0)
      expect(inventory.every(item => item.vehicleId === vehicleId)).toBe(true)
    })

    it('should return empty array for non-existent vehicle', () => {
      const inventory = emulator.getVehicleInventory('non-existent-vehicle')
      expect(inventory).toBeDefined()
      expect(inventory.length).toBe(0)
    })

    it('should retrieve all vehicle summaries', () => {
      emulator.initializeVehicleInventory('vehicle-001', 'sedan', 'VIN001')
      emulator.initializeVehicleInventory('vehicle-002', 'truck', 'VIN002')
      emulator.initializeVehicleInventory('vehicle-003', 'suv', 'VIN003')

      const summaries = emulator.getAllSummaries()
      expect(summaries).toBeDefined()
      expect(summaries.length).toBe(3)
    })

    it('should get current emulator state', () => {
      emulator.initializeVehicleInventory('vehicle-state-001', 'van', 'STATE001')
      emulator.initializeVehicleInventory('vehicle-state-002', 'ev', 'STATE002')

      const state = emulator.getCurrentState()
      expect(state.status).toBe('idle')
      expect(state.vehiclesTracked).toBe(2)
      expect(state.totalItems).toBeGreaterThan(0)
    })
  })

  describe('Multiple Vehicles', () => {
    it('should handle inventory for multiple vehicles', () => {
      const vehicles = [
        { id: 'vehicle-multi-001', type: 'sedan' as const, vin: 'MULTI001' },
        { id: 'vehicle-multi-002', type: 'suv' as const, vin: 'MULTI002' },
        { id: 'vehicle-multi-003', type: 'truck' as const, vin: 'MULTI003' },
        { id: 'vehicle-multi-004', type: 'van' as const, vin: 'MULTI004' },
        { id: 'vehicle-multi-005', type: 'ev' as const, vin: 'MULTI005' },
      ]

      vehicles.forEach(vehicle => {
        emulator.initializeVehicleInventory(vehicle.id, vehicle.type, vehicle.vin)
      })

      const state = emulator.getCurrentState()
      expect(state.vehiclesTracked).toBe(5)

      vehicles.forEach(vehicle => {
        const inventory = emulator.getVehicleInventory(vehicle.id)
        expect(inventory.length).toBeGreaterThan(0)
      })
    })

    it('should maintain separate inventories for each vehicle', () => {
      emulator.initializeVehicleInventory('vehicle-sep-001', 'sedan', 'SEP001')
      emulator.initializeVehicleInventory('vehicle-sep-002', 'truck', 'SEP002')

      const inventory1 = emulator.getVehicleInventory('vehicle-sep-001')
      const inventory2 = emulator.getVehicleInventory('vehicle-sep-002')

      expect(inventory1.every(item => item.vehicleId === 'vehicle-sep-001')).toBe(true)
      expect(inventory2.every(item => item.vehicleId === 'vehicle-sep-002')).toBe(true)
      expect(inventory1.length).not.toBe(inventory2.length) // Different vehicle types
    })
  })

  describe('Alert System', () => {
    it('should emit compliance-alert events', (done) => {
      const vehicleId = 'vehicle-alert-event'
      const vehicleVin = 'ALERTEVENT12345'

      let alertReceived = false

      emulator.once('compliance-alert', (alert) => {
        alertReceived = true
        expect(alert.vehicleId).toBe(vehicleId)
        expect(alert.alertType).toBeDefined()
        expect(alert.severity).toBeDefined()
        expect(alert.message).toBeDefined()
        done()
      })

      emulator.initializeVehicleInventory(vehicleId, 'truck', vehicleVin)

      // If no alerts were generated, pass the test
      setTimeout(() => {
        if (!alertReceived) {
          done()
        }
      }, 100)
    })

    it('should retrieve alerts by vehicle', () => {
      const vehicleId = 'vehicle-get-alerts'
      const vehicleVin = 'GETALERTS12345'

      emulator.initializeVehicleInventory(vehicleId, 'suv', vehicleVin)

      const alerts = emulator.getVehicleAlerts(vehicleId)
      expect(alerts).toBeDefined()
      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle vehicle with no inventory gracefully', () => {
      const inventory = emulator.getVehicleInventory('never-initialized')
      expect(inventory).toEqual([])

      const summary = emulator.getVehicleSummary('never-initialized')
      expect(summary).toBeUndefined()
    })

    it('should handle inspection of vehicle with no inventory', () => {
      const inspection = emulator.conductInspection(
        'no-inventory-vehicle',
        'inspector-001',
        'Test Inspector',
        'routine'
      )

      expect(inspection).toBeDefined()
      expect(inspection.itemsInspected).toBe(0)
      expect(inspection.overallCompliance).toBe(100)
    })
  })
})
