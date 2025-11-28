/**
 * Quick test script to demonstrate Inventory Emulator functionality
 * Run with: npx tsx src/emulators/test-inventory-emulator.ts
 */

import { InventoryEmulator } from './InventoryEmulator'
import type { EmulatorConfig } from './types'

async function main() {
  console.log('🚀 Starting Inventory Emulator Test\n')

  // Create test configuration
  const config: EmulatorConfig = {
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

  // Initialize emulator
  console.log('📦 Initializing Inventory Emulator...')
  const emulator = new InventoryEmulator(config)

  // Get initial stats
  const stats = emulator.getStats()
  console.log('\n📊 Inventory Statistics:')
  console.log(`   Total Items: ${stats.totalItems}`)
  console.log(`   Total Value: $${stats.totalValue.toFixed(2)}`)
  console.log(`   Low Stock Items: ${stats.lowStockItems}`)
  console.log(`   Out of Stock: ${stats.outOfStockItems}`)
  console.log(`   Active Categories: ${stats.activeCategories}`)

  // Show items by category
  console.log('\n📂 Items by Category:')
  const categories = ['parts', 'fluids', 'tools', 'safety-equipment', 'supplies']
  categories.forEach(category => {
    const items = emulator.getItemsByCategory(category as any)
    console.log(`   ${category}: ${items.length} items`)
  })

  // Show low stock alerts
  const alerts = emulator.getLowStockAlerts()
  console.log(`\n⚠️  Low Stock Alerts: ${alerts.length}`)
  if (alerts.length > 0) {
    console.log('\n   Top 5 Alerts:')
    alerts.slice(0, 5).forEach(alert => {
      console.log(`   - [${alert.severity.toUpperCase()}] ${alert.itemName}`)
      console.log(`     Stock: ${alert.quantityOnHand} (reorder at ${alert.reorderPoint})`)
      console.log(`     Supplier: ${alert.supplierName} (${alert.leadTimeDays} days)`)
      console.log(`     Est. Cost: $${alert.estimatedCost.toFixed(2)}`)
    })
  }

  // Show sample items
  const allItems = emulator.getAllItems()
  console.log('\n🔧 Sample Inventory Items:')
  allItems.slice(0, 5).forEach(item => {
    console.log(`\n   ${item.name}`)
    console.log(`     SKU: ${item.sku}`)
    console.log(`     Category: ${item.category} / ${item.subcategory}`)
    console.log(`     Manufacturer: ${item.manufacturer}`)
    console.log(`     Stock: ${item.quantityOnHand} (${item.quantityAvailable} available)`)
    console.log(`     Price: $${item.unitCost} cost / $${item.listPrice} list`)
    console.log(`     Location: ${item.warehouseLocation} / ${item.binLocation}`)
    console.log(`     Supplier: ${item.primarySupplierName}`)
  })

  // Start emulator to demonstrate events
  console.log('\n▶️  Starting emulator for 5 seconds...')

  let eventCount = 0
  emulator.on('data', (event) => {
    eventCount++
    if (event.type === 'inventory-transaction') {
      console.log(`   📝 Transaction: ${event.data.transactionType} - ${event.data.quantity} units`)
    } else if (event.type === 'inventory-purchase') {
      console.log(`   🛒 Purchase: ${event.data.item.name} - ${event.data.transaction.quantity} units`)
    } else if (event.type === 'inventory-low-stock-alert') {
      console.log(`   ⚠️  Alert: ${event.data.itemName} - ${event.data.severity}`)
    }
  })

  await emulator.start()

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000))

  await emulator.stop()

  console.log(`\n✅ Emulator stopped. Generated ${eventCount} events.`)

  // Final stats
  const finalStats = emulator.getStats()
  console.log('\n📈 Final Statistics:')
  console.log(`   Transactions Today: ${finalStats.transactionsToday}`)
  console.log(`   Total Value: $${finalStats.totalValue.toFixed(2)}`)

  console.log('\n✨ Inventory Emulator Test Complete!\n')
}

// Run the test
main().catch(console.error)
