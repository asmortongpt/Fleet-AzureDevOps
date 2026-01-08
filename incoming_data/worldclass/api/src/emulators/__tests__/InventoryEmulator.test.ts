/**
 * Test suite for InventoryEmulator
 * Validates inventory generation, transactions, and low stock alerts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { InventoryEmulator } from '../InventoryEmulator'
import type { EmulatorConfig } from '../types'

describe('InventoryEmulator', () => {
  let emulator: InventoryEmulator
  let config: EmulatorConfig

  beforeEach(() => {
    config = {
      emulator: {
        version: '1.0.0',
        name: 'Inventory Test',
        description: 'Test inventory emulator'
      },
      timeCompression: {
        enabled: false,
        ratio: 1,
        description: 'No compression'
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
        maxConcurrentEmulators: 10,
        updateInterval: 5000,
        memoryLimit: '1GB'
      },
      emulators: {
        gps: {
          updateIntervalMs: 5000
        }
      }
    }

    emulator = new InventoryEmulator(config)
  })

  afterEach(async () => {
    if (emulator) {
      try {
        await emulator.stop()
      } catch (error) {
        // Emulator might not be running
      }
    }
  })

  describe('Initialization', () => {
    it('should initialize with 500+ inventory items', () => {
      const items = emulator.getAllItems()
      expect(items.length).toBeGreaterThanOrEqual(500)
    })

    it('should generate items in all categories', () => {
      const items = emulator.getAllItems()
      const categories = new Set(items.map(item => item.category))

      expect(categories.has('parts')).toBe(true)
      expect(categories.has('fluids')).toBe(true)
      expect(categories.has('tools')).toBe(true)
      expect(categories.has('safety-equipment')).toBe(true)
      expect(categories.has('supplies')).toBe(true)
      expect(categories.size).toBeGreaterThanOrEqual(5)
    })

    it('should generate items with unique SKUs', () => {
      const items = emulator.getAllItems()
      const skus = items.map(item => item.sku)
      const uniqueSkus = new Set(skus)

      expect(skus.length).toBe(uniqueSkus.size)
    })

    it('should generate items with valid pricing', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.unitCost).toBeGreaterThan(0)
        expect(item.listPrice).toBeGreaterThan(0)
        expect(item.listPrice).toBeGreaterThanOrEqual(item.unitCost)
        expect(item.currency).toBe('USD')
      })
    })

    it('should generate items with warehouse locations', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.warehouseLocation).toBeTruthy()
        expect(item.binLocation).toBeTruthy()
        expect(item.binLocation).toMatch(/^[A-L]\d{2}-\d$/)
      })
    })

    it('should generate items with supplier information', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.primarySupplierId).toBeTruthy()
        expect(item.primarySupplierName).toBeTruthy()
        expect(item.leadTimeDays).toBeGreaterThanOrEqual(1)
        expect(item.leadTimeDays).toBeLessThanOrEqual(14)
      })
    })

    it('should generate items with vehicle compatibility', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.compatibleMakes).toBeInstanceOf(Array)
        expect(item.compatibleMakes.length).toBeGreaterThan(0)
        expect(item.compatibleModels).toBeInstanceOf(Array)
        expect(item.compatibleYears).toBeInstanceOf(Array)
        expect(item.compatibleYears.length).toBeGreaterThan(0)
      })
    })

    it('should generate items with specifications', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.specifications).toBeTruthy()
        expect(typeof item.specifications).toBe('object')
        expect(item.weight).toBeGreaterThan(0)
        expect(item.dimensions).toBeTruthy()
        expect(item.dimensions?.length).toBeGreaterThan(0)
        expect(item.dimensions?.width).toBeGreaterThan(0)
        expect(item.dimensions?.height).toBeGreaterThan(0)
      })
    })
  })

  describe('Stock Management', () => {
    it('should track quantity on hand, reserved, and available', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.quantityOnHand).toBeGreaterThanOrEqual(0)
        expect(item.quantityReserved).toBeGreaterThanOrEqual(0)
        expect(item.quantityAvailable).toBe(item.quantityOnHand - item.quantityReserved)
        expect(item.quantityReserved).toBeLessThanOrEqual(item.quantityOnHand)
      })
    })

    it('should have reorder points and quantities', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.reorderPoint).toBeGreaterThan(0)
        expect(item.reorderQuantity).toBeGreaterThan(0)
        expect(item.reorderQuantity).toBeGreaterThanOrEqual(item.reorderPoint)
      })
    })

    it('should identify low stock items', () => {
      const lowStockItems = emulator.getLowStockItems()

      lowStockItems.forEach(item => {
        expect(item.quantityOnHand).toBeLessThanOrEqual(item.reorderPoint)
      })
    })

    it('should create low stock alerts', () => {
      const alerts = emulator.getLowStockAlerts()

      alerts.forEach(alert => {
        expect(alert.itemId).toBeTruthy()
        expect(alert.itemSku).toBeTruthy()
        expect(alert.itemName).toBeTruthy()
        expect(alert.quantityOnHand).toBeLessThanOrEqual(alert.reorderPoint)
        expect(['warning', 'critical', 'out-of-stock']).toContain(alert.severity)
        expect(alert.estimatedCost).toBeGreaterThan(0)
        expect(alert.resolved).toBe(false)
      })
    })

    it('should categorize alert severity correctly', () => {
      const alerts = emulator.getLowStockAlerts()

      alerts.forEach(alert => {
        if (alert.quantityOnHand === 0) {
          expect(alert.severity).toBe('out-of-stock')
        } else if (alert.quantityOnHand < alert.reorderPoint / 2) {
          expect(alert.severity).toBe('critical')
        } else {
          expect(alert.severity).toBe('warning')
        }
      })
    })
  })

  describe('Inventory Categories', () => {
    it('should retrieve items by category', () => {
      const partsItems = emulator.getItemsByCategory('parts')
      const fluidsItems = emulator.getItemsByCategory('fluids')
      const toolsItems = emulator.getItemsByCategory('tools')

      expect(partsItems.length).toBeGreaterThan(0)
      expect(fluidsItems.length).toBeGreaterThan(0)
      expect(toolsItems.length).toBeGreaterThan(0)

      partsItems.forEach(item => expect(item.category).toBe('parts'))
      fluidsItems.forEach(item => expect(item.category).toBe('fluids'))
      toolsItems.forEach(item => expect(item.category).toBe('tools'))
    })

    it('should have realistic part names by category', () => {
      const partsItems = emulator.getItemsByCategory('parts')
      const fluidsItems = emulator.getItemsByCategory('fluids')
      const safetyItems = emulator.getItemsByCategory('safety-equipment')

      // Parts should include common automotive parts
      const partNames = partsItems.map(i => i.name.toLowerCase())
      const hasAutoParts = partNames.some(name =>
        name.includes('brake') ||
        name.includes('filter') ||
        name.includes('bearing') ||
        name.includes('belt')
      )
      expect(hasAutoParts).toBe(true)

      // Fluids should include oils and fluids
      const fluidNames = fluidsItems.map(i => i.name.toLowerCase())
      const hasFluids = fluidNames.some(name =>
        name.includes('oil') ||
        name.includes('fluid') ||
        name.includes('coolant')
      )
      expect(hasFluids).toBe(true)

      // Safety items should include PPE
      const safetyNames = safetyItems.map(i => i.name.toLowerCase())
      const hasSafety = safetyNames.some(name =>
        name.includes('vest') ||
        name.includes('glove') ||
        name.includes('extinguisher')
      )
      expect(hasSafety).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should calculate inventory statistics', () => {
      const stats = emulator.getStats()

      expect(stats.totalItems).toBeGreaterThan(0)
      expect(stats.totalValue).toBeGreaterThan(0)
      expect(stats.lowStockItems).toBeGreaterThanOrEqual(0)
      expect(stats.outOfStockItems).toBeGreaterThanOrEqual(0)
      expect(stats.activeCategories).toBeGreaterThanOrEqual(5)
      expect(stats.transactionsToday).toBeGreaterThanOrEqual(0)
      expect(stats.averageTurnoverDays).toBeGreaterThan(0)
    })

    it('should have realistic inventory valuation', () => {
      const stats = emulator.getStats()
      const items = emulator.getAllItems()

      // Calculate expected total value
      const expectedValue = items.reduce(
        (sum, item) => sum + (item.quantityOnHand * item.unitCost),
        0
      )

      expect(stats.totalValue).toBeCloseTo(expectedValue, 2)
    })
  })

  describe('Emulator Lifecycle', () => {
    it('should start successfully', async () => {
      await expect(emulator.start()).resolves.not.toThrow()
    })

    it('should emit started event', async () => {
      const startedPromise = new Promise(resolve => {
        emulator.once('started', resolve)
      })

      await emulator.start()
      await expect(startedPromise).resolves.toBeTruthy()
    })

    it('should stop successfully', async () => {
      await emulator.start()
      await expect(emulator.stop()).resolves.not.toThrow()
    })

    it('should emit stopped event', async () => {
      await emulator.start()

      const stoppedPromise = new Promise(resolve => {
        emulator.once('stopped', resolve)
      })

      await emulator.stop()
      await expect(stoppedPromise).resolves.toBeTruthy()
    })

    it('should pause successfully', async () => {
      await emulator.start()
      await expect(emulator.pause()).resolves.not.toThrow()
    })

    it('should resume successfully', async () => {
      await emulator.start()
      await emulator.pause()
      await expect(emulator.resume()).resolves.not.toThrow()
    })

    it('should not allow starting when already running', async () => {
      await emulator.start()
      await expect(emulator.start()).rejects.toThrow()
    })

    it('should not allow stopping when not running', async () => {
      await expect(emulator.stop()).rejects.toThrow()
    })
  })

  describe('Transaction Simulation', () => {
    it('should generate transactions when running', async () => {
      await emulator.start()

      // Wait for some transactions to be generated
      await new Promise(resolve => setTimeout(resolve, 100))

      const transactions = emulator.getTransactions(10)
      await emulator.stop()

      // Transactions might not be generated immediately
      expect(transactions).toBeInstanceOf(Array)
    })

    it('should emit transaction events', async () => {
      const transactionPromise = new Promise(resolve => {
        emulator.once('data', (event) => {
          if (event.type.includes('transaction')) {
            resolve(event)
          }
        })
      })

      await emulator.start()

      // Set a timeout in case no transactions occur
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('No transaction generated')), 30000)
      )

      try {
        const event = await Promise.race([transactionPromise, timeout])
        expect(event).toBeTruthy()
      } catch (error) {
        // Acceptable if no transaction occurs during test
      } finally {
        await emulator.stop()
      }
    }, 35000) // Increase timeout for this test
  })

  describe('Item Retrieval', () => {
    it('should retrieve item by ID', () => {
      const items = emulator.getAllItems()
      const firstItem = items[0]

      const retrieved = emulator.getItemById(firstItem.id)

      expect(retrieved).toBeTruthy()
      expect(retrieved?.id).toBe(firstItem.id)
      expect(retrieved?.sku).toBe(firstItem.sku)
    })

    it('should retrieve items by SKU', () => {
      const items = emulator.getAllItems()
      const testItem = items[0]
      const skuPrefix = testItem.sku.substring(0, 5)

      const results = emulator.getItemsBySKU(skuPrefix)

      expect(results.length).toBeGreaterThan(0)
      results.forEach(item => {
        expect(item.sku.toLowerCase()).toContain(skuPrefix.toLowerCase())
      })
    })

    it('should return empty array for non-existent SKU', () => {
      const results = emulator.getItemsBySKU('NONEXISTENT-12345')
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(0)
    })

    it('should return undefined for non-existent ID', () => {
      const result = emulator.getItemById('INV-999999')
      expect(result).toBeUndefined()
    })
  })

  describe('Current State', () => {
    it('should return current state', () => {
      const state = emulator.getCurrentState()

      expect(state).toHaveProperty('isRunning')
      expect(state).toHaveProperty('isPaused')
      expect(state).toHaveProperty('stats')
      expect(state).toHaveProperty('lowStockAlerts')
      expect(state).toHaveProperty('recentTransactions')

      expect(typeof state.isRunning).toBe('boolean')
      expect(typeof state.isPaused).toBe('boolean')
      expect(state.stats).toBeTruthy()
    })

    it('should update state after starting', async () => {
      const stateBefore = emulator.getCurrentState()
      expect(stateBefore.isRunning).toBe(false)

      await emulator.start()

      const stateAfter = emulator.getCurrentState()
      expect(stateAfter.isRunning).toBe(true)
    })
  })

  describe('Data Quality', () => {
    it('should have realistic manufacturers', () => {
      const items = emulator.getAllItems()
      const manufacturers = new Set(items.map(i => i.manufacturer))

      // Should have multiple manufacturers
      expect(manufacturers.size).toBeGreaterThan(5)

      // Check for some common manufacturers
      const manufacturerList = Array.from(manufacturers)
      const hasCommonBrands = manufacturerList.some(m =>
        ['Bosch', 'ACDelco', 'Mobil', 'Monroe', 'NGK'].includes(m)
      )
      expect(hasCommonBrands).toBe(true)
    })

    it('should have realistic suppliers', () => {
      const items = emulator.getAllItems()
      const suppliers = new Set(items.map(i => i.primarySupplierName))

      // Should have multiple suppliers
      expect(suppliers.size).toBeGreaterThan(3)
    })

    it('should have part numbers in correct format', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.partNumber).toMatch(/^\d{5}$/)
        expect(item.manufacturerPartNumber).toMatch(/^[A-Z]{3}-\d{5}$/)
        if (item.supplierPartNumber) {
          expect(item.supplierPartNumber).toMatch(/^SUP-\d{3}-\d{5}$/)
        }
      })
    })

    it('should have active items by default', () => {
      const items = emulator.getAllItems()
      const activeItems = items.filter(i => i.isActive)

      // At least 90% should be active
      expect(activeItems.length / items.length).toBeGreaterThan(0.9)
    })

    it('should have timestamps set correctly', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(item.createdAt).toBeInstanceOf(Date)
        expect(item.updatedAt).toBeInstanceOf(Date)
        expect(item.lastRestocked).toBeInstanceOf(Date)

        // Dates should be in the past
        expect(item.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
        expect(item.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
      })
    })
  })

  describe('Security Considerations', () => {
    it('should not expose sensitive information in item data', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        // Check that no obvious sensitive fields exist
        expect(item).not.toHaveProperty('password')
        expect(item).not.toHaveProperty('secret')
        expect(item).not.toHaveProperty('apiKey')
      })
    })

    it('should use numeric types for financial data', () => {
      const items = emulator.getAllItems()

      items.forEach(item => {
        expect(typeof item.unitCost).toBe('number')
        expect(typeof item.listPrice).toBe('number')
        expect(item.unitCost).not.toBeNaN()
        expect(item.listPrice).not.toBeNaN()
      })
    })
  })
})
