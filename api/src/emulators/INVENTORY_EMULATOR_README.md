# Inventory Management Emulator

Complete inventory management system for fleet operations with 500+ realistic automotive parts, tools, safety equipment, supplies, and fluids.

## 📦 Overview

The Inventory Management Emulator generates realistic inventory data for fleet management operations, including:

- **500+ inventory items** across 10 categories
- **Automatic low stock alerts** (warning, critical, out-of-stock)
- **Real-time transaction simulation** (purchases, usage, returns, adjustments)
- **Warehouse management** (locations, bin tracking)
- **Supplier integration** (pricing, lead times, part numbers)
- **Vehicle compatibility tracking** (makes, models, years)
- **Fortune 50 security standards** (parameterized queries, audit logging)

## 🎯 Features

### Inventory Categories

1. **Parts** - Brake pads, rotors, bearings, belts, suspension components
2. **Fluids** - Motor oil, transmission fluid, coolant, brake fluid, DEF
3. **Filters** - Oil, air, cabin air, transmission, hydraulic filters
4. **Tools** - Socket sets, torque wrenches, diagnostic equipment
5. **Safety Equipment** - First aid kits, fire extinguishers, PPE, road flares
6. **Supplies** - Shop towels, cleaners, fasteners, gloves, tape
7. **Tires** - All-season, commercial, winter, heavy-duty tires
8. **Batteries** - Automotive batteries (500-1000 CCA), AGM batteries
9. **Lighting** - Headlight bulbs, LED kits, tail light assemblies
10. **Electrical** - Battery cables, fuses, relays, wiring harnesses

### Realistic Data Generation

Each inventory item includes:

- **Unique SKU and part numbers** (manufacturer, universal, supplier)
- **Stock tracking** (on-hand, reserved, available quantities)
- **Pricing** (unit cost, list price with realistic markups)
- **Warehouse location** (location + bin: A01-5 format)
- **Supplier information** (10+ major automotive suppliers)
- **Vehicle compatibility** (makes, models, years)
- **Physical specifications** (weight, dimensions, specifications)
- **Status flags** (active, hazmat, refrigeration required)
- **Timestamps** (last restocked, ordered, used)

### Transaction Simulation

The emulator simulates realistic inventory activity:

- **40% Part Usage** - Items used for maintenance work orders
- **20% Stock Adjustments** - Inventory corrections, damaged items
- **15% Purchases** - Automatic reordering when stock is low
- **10% Returns** - Cancelled work orders, unused parts

### Low Stock Alerts

Automatic alerts with severity levels:

- **Warning** - Stock at or below reorder point
- **Critical** - Stock below 50% of reorder point
- **Out of Stock** - Zero quantity on hand

Each alert includes:
- Item details and current stock level
- Supplier information and lead time
- Estimated reorder cost
- Recommended reorder quantity

## 🚀 Usage

### Initialize the Emulator

```typescript
import { InventoryEmulator } from './emulators/InventoryEmulator'
import type { EmulatorConfig } from './emulators/types'

const config: EmulatorConfig = {
  // ... your emulator configuration
}

const inventoryEmulator = new InventoryEmulator(config)
```

### Start/Stop the Emulator

```typescript
// Start simulation
await inventoryEmulator.start()

// Pause simulation
await inventoryEmulator.pause()

// Resume simulation
await inventoryEmulator.resume()

// Stop simulation
await inventoryEmulator.stop()
```

### Access Inventory Data

```typescript
// Get all active items
const allItems = inventoryEmulator.getAllItems()

// Get items by category
const parts = inventoryEmulator.getItemsByCategory('parts')
const fluids = inventoryEmulator.getItemsByCategory('fluids')
const tools = inventoryEmulator.getItemsByCategory('tools')

// Search by SKU
const items = inventoryEmulator.getItemsBySKU('PAR-123456')

// Get specific item
const item = inventoryEmulator.getItemById('INV-000001')

// Get low stock items
const lowStock = inventoryEmulator.getLowStockItems()

// Get active alerts
const alerts = inventoryEmulator.getLowStockAlerts()

// Get recent transactions
const transactions = inventoryEmulator.getTransactions(50)

// Get transactions for specific item
const itemTransactions = inventoryEmulator.getTransactionsByItem('INV-000001')

// Get statistics
const stats = inventoryEmulator.getStats()
// Returns:
// {
//   totalItems: 500,
//   totalValue: 125000.00,
//   lowStockItems: 15,
//   outOfStockItems: 3,
//   activeCategories: 10,
//   transactionsToday: 42,
//   averageTurnoverDays: 45
// }
```

### Listen to Events

```typescript
// Transaction events
inventoryEmulator.on('data', (event) => {
  if (event.type === 'inventory-transaction') {
    console.log('Transaction:', event.data)
  }
})

// Purchase events
inventoryEmulator.on('data', (event) => {
  if (event.type === 'inventory-purchase') {
    console.log('Purchase Order:', event.data)
  }
})

// Low stock alerts
inventoryEmulator.on('low-stock-alert', (alert) => {
  console.log(`Alert: ${alert.itemName} is ${alert.severity}`)
  console.log(`Quantity: ${alert.quantityOnHand} (reorder at ${alert.reorderPoint})`)
})

// Alert resolved
inventoryEmulator.on('alert-resolved', (alert) => {
  console.log(`Alert resolved for ${alert.itemName}`)
})
```

## 🔌 Integration with EmulatorOrchestrator

The Inventory Emulator is automatically initialized and managed by the EmulatorOrchestrator:

```typescript
import { EmulatorOrchestrator } from './emulators/EmulatorOrchestrator'

const orchestrator = new EmulatorOrchestrator()

// Start all emulators (including inventory)
await orchestrator.start()

// Access inventory data
const inventoryData = orchestrator.getInventoryData()
// Returns: { stats, lowStockItems, lowStockAlerts, recentTransactions, currentState }

// Get items by category
const parts = orchestrator.getInventoryByCategory('parts')

// Search inventory
const results = orchestrator.searchInventory('BRA')
```

## 💾 Database Schema

The migration creates the following tables:

### `inventory_items`
Master inventory catalog with all items, stock levels, pricing, and specifications.

**Key fields:**
- `id`, `sku`, `part_number`, `name`, `category`, `subcategory`
- `quantity_on_hand`, `quantity_reserved`, `quantity_available` (computed)
- `reorder_point`, `reorder_quantity`
- `unit_cost`, `list_price`
- `warehouse_location`, `bin_location`
- `primary_supplier_id`, `lead_time_days`
- `compatible_makes`, `compatible_models`, `compatible_years`
- RLS enabled for tenant isolation

### `inventory_transactions`
Complete audit trail of all inventory movements.

**Transaction types:**
- `purchase` - Items purchased from suppliers
- `usage` - Items used for maintenance/repairs
- `return` - Items returned to inventory
- `adjustment` - Manual stock corrections
- `transfer` - Transfers between locations
- `disposal` - Items disposed/scrapped
- `stocktake` - Physical count adjustments

### `inventory_low_stock_alerts`
Automatic alerts when inventory falls below reorder points.

**Severity levels:**
- `warning` - At reorder point
- `critical` - Below 50% of reorder point
- `out-of-stock` - Zero quantity

### `inventory_reservations`
Track inventory reserved for work orders and projects.

**Features:**
- Automatic quantity adjustment
- Expiration tracking
- Status management (active, fulfilled, released, expired)

### `inventory_audit_log`
Complete audit trail for compliance and security.

**Captures:**
- All INSERT, UPDATE, DELETE operations
- Old and new values (JSONB)
- User information and IP address
- Timestamp and reason

### Views

- `v_inventory_summary_by_category` - Aggregated stats by category
- `v_inventory_low_stock_items` - Items requiring action
- `v_inventory_valuation` - Inventory value calculations
- `v_inventory_transaction_summary` - Transaction analytics

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all inventory emulator tests
npm test -- InventoryEmulator.test.ts

# Run specific test suites
npm test -- --grep "Initialization"
npm test -- --grep "Stock Management"
npm test -- --grep "Transaction Simulation"
```

### Test Coverage

The test suite validates:

- ✅ Initialization with 500+ items
- ✅ All 10 inventory categories
- ✅ Unique SKU generation
- ✅ Realistic pricing and markups
- ✅ Warehouse location formatting
- ✅ Supplier assignment
- ✅ Vehicle compatibility
- ✅ Stock level tracking
- ✅ Low stock detection
- ✅ Alert severity calculation
- ✅ Transaction simulation
- ✅ Emulator lifecycle (start/stop/pause/resume)
- ✅ Event emission
- ✅ Data quality and validation
- ✅ Security considerations

## 🔒 Security Features (Fortune 50 Standards)

### Database Security

```sql
-- ✅ Parameterized queries only
-- Example: SELECT * FROM inventory_items WHERE id = $1

-- ✅ Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_items_tenant_isolation ON inventory_items
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ✅ Audit logging on all tables
CREATE TRIGGER trigger_audit_inventory_items
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION audit_inventory_changes();

-- ✅ Constraint validation
CONSTRAINT valid_reserved_quantity CHECK (quantity_reserved <= quantity_on_hand)
CONSTRAINT prevent_negative_stock CHECK (quantity_on_hand >= 0)
```

### Application Security

- ✅ No hardcoded credentials
- ✅ Input validation on all fields
- ✅ Type safety with TypeScript
- ✅ Immutable transaction history
- ✅ Encrypted API keys (in production)
- ✅ User tracking on all operations
- ✅ IP address logging

## 📊 Example Data

### Sample Inventory Item

```json
{
  "id": "INV-000123",
  "sku": "PAR-487562",
  "partNumber": "45821",
  "name": "Brake Pad Set",
  "description": "Bosch Brake Pad Set - Premium quality automotive part for fleet maintenance operations",
  "category": "parts",
  "subcategory": "Brakes",
  "manufacturer": "Bosch",
  "manufacturerPartNumber": "BOS-45821",
  "universalPartNumber": "UNI-45821",

  "quantityOnHand": 24,
  "quantityReserved": 2,
  "quantityAvailable": 22,
  "reorderPoint": 10,
  "reorderQuantity": 25,

  "warehouseLocation": "Main Warehouse",
  "binLocation": "C12-3",

  "unitCost": 67.50,
  "listPrice": 112.45,
  "currency": "USD",

  "primarySupplierId": "SUP-001",
  "primarySupplierName": "AutoZone Commercial",
  "supplierPartNumber": "SUP-001-45821",
  "leadTimeDays": 3,

  "compatibleMakes": ["Ford", "Chevrolet"],
  "compatibleModels": ["Ford F-150", "Chevrolet Silverado 1500"],
  "compatibleYears": [2018, 2019, 2020, 2021, 2022, 2023, 2024],

  "weight": 8.5,
  "dimensions": {
    "length": 12.5,
    "width": 8.2,
    "height": 3.1,
    "unit": "inches"
  },
  "specifications": {
    "manufacturer_warranty": "24 months"
  },

  "isActive": true,
  "isHazmat": false,
  "requiresRefrigeration": false,

  "lastRestocked": "2025-01-15T10:30:00Z",
  "lastOrdered": "2025-01-10T14:20:00Z",
  "lastUsed": "2025-01-20T09:15:00Z",
  "createdAt": "2023-06-01T00:00:00Z",
  "updatedAt": "2025-01-20T09:15:00Z"
}
```

### Sample Low Stock Alert

```json
{
  "id": "ALERT-000042",
  "itemId": "INV-000123",
  "itemSku": "PAR-487562",
  "itemName": "Brake Pad Set",
  "quantityOnHand": 4,
  "reorderPoint": 10,
  "reorderQuantity": 25,
  "severity": "critical",
  "supplierId": "SUP-001",
  "supplierName": "AutoZone Commercial",
  "leadTimeDays": 3,
  "estimatedCost": 1687.50,
  "alertDate": "2025-01-20T14:30:00Z",
  "resolved": false
}
```

### Sample Transaction

```json
{
  "id": "TXN-00012345",
  "itemId": "INV-000123",
  "transactionType": "usage",
  "quantity": -2,
  "unitCost": 67.50,
  "totalCost": 135.00,
  "vehicleId": "VEH-001",
  "workOrderId": "WO-12345",
  "userId": "USR-42",
  "userName": "John Smith",
  "reason": "Maintenance work order",
  "warehouseLocation": "Main Warehouse",
  "binLocation": "C12-3",
  "timestamp": "2025-01-20T09:15:00Z"
}
```

## 🎓 Best Practices

### For Development

1. **Start the emulator** before accessing inventory data
2. **Listen to events** for real-time updates
3. **Check current state** to monitor emulator status
4. **Use transactions** for stock changes (not direct modification)
5. **Monitor alerts** to prevent stockouts

### For Production

1. **Enable persistence** to save data to database
2. **Configure batch sizes** for optimal performance
3. **Set up monitoring** for low stock alerts
4. **Implement auto-reordering** based on lead times
5. **Regular backups** of transaction history

### For Testing

1. **Use test configuration** with disabled persistence
2. **Mock external APIs** (supplier integrations)
3. **Control time compression** for faster testing
4. **Verify event emissions** for all operations
5. **Clean up after tests** (stop emulator)

## 📝 Migration

Apply the database migration:

```bash
# Using psql
psql -U your_user -d your_database -f api/src/migrations/036_inventory_management_system.sql

# Using migration tool
npm run migrate
```

The migration includes:
- ✅ All table definitions
- ✅ Indexes for performance
- ✅ Triggers for automation
- ✅ Views for reporting
- ✅ RLS policies for security
- ✅ Audit logging
- ✅ Constraints for data integrity
- ✅ Comments for documentation

## 🔧 Configuration

Configure the emulator in your EmulatorConfig:

```typescript
const config: EmulatorConfig = {
  emulators: {
    inventory: {
      updateIntervalMs: 10000, // Transaction simulation frequency
      initialItemCount: 500,    // Number of items to generate
      enableAutoReorder: true,  // Automatically create purchase orders
      alertThresholds: {
        warning: 1.0,   // 100% of reorder point
        critical: 0.5,  // 50% of reorder point
        outOfStock: 0   // Zero quantity
      }
    }
  },
  persistence: {
    enabled: true,
    database: 'postgresql://...'
  }
}
```

## 📚 API Reference

See inline TypeScript documentation for complete API details:

```typescript
// Core types
export interface InventoryItem { /* ... */ }
export interface InventoryTransaction { /* ... */ }
export interface LowStockAlert { /* ... */ }
export interface InventoryStats { /* ... */ }

// Main class
export class InventoryEmulator extends EventEmitter {
  constructor(config: EmulatorConfig)

  // Lifecycle
  async start(): Promise<void>
  async stop(): Promise<void>
  async pause(): Promise<void>
  async resume(): Promise<void>

  // Data access
  getAllItems(): InventoryItem[]
  getItemById(id: string): InventoryItem | undefined
  getItemsBySKU(sku: string): InventoryItem[]
  getItemsByCategory(category: InventoryCategory): InventoryItem[]
  getLowStockItems(): InventoryItem[]
  getLowStockAlerts(): LowStockAlert[]
  getTransactions(limit?: number): InventoryTransaction[]
  getTransactionsByItem(itemId: string): InventoryTransaction[]
  getStats(): InventoryStats
  getCurrentState(): any
}
```

## 🤝 Contributing

When extending the inventory emulator:

1. Follow TypeScript best practices
2. Add tests for new features
3. Update this README
4. Follow Fortune 50 security standards
5. Use parameterized queries only
6. Validate all inputs
7. Add audit logging

## 📄 License

Part of the Fleet Management System - Capital Tech Alliance

---

**Created:** 2025-01-27
**Version:** 1.0.0
**Author:** Fleet Management System Team
