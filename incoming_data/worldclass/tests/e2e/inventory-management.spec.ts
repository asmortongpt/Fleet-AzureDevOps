/**
 * Inventory Management E2E Tests
 *
 * Tests cover:
 * - Parts inventory management
 * - Per-vehicle inventory tracking
 * - Stock level monitoring
 * - Inventory transactions
 * - Low stock alerts
 * - Inventory search and filtering
 * - Supplier management
 * - Inventory reports
 */

import { test, expect } from '@playwright/test'

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to Inventory
    await page.click('text=Inventory')
    await page.waitForURL('**/inventory')
  })

  test.describe('Parts Inventory', () => {
    test('should display parts inventory list', async ({ page }) => {
      // Verify inventory table visible
      await expect(page.locator('[data-testid="inventory-list"]')).toBeVisible()

      // Verify table headers
      await expect(page.locator('th:has-text("Part Number")')).toBeVisible()
      await expect(page.locator('th:has-text("Description")')).toBeVisible()
      await expect(page.locator('th:has-text("Quantity")')).toBeVisible()
      await expect(page.locator('th:has-text("Location")')).toBeVisible()
    })

    test('should add new inventory item', async ({ page }) => {
      // Click add item button
      await page.click('button:has-text("Add Item")')

      // Fill form
      await page.fill('[name="partNumber"]', 'PART-12345')
      await page.fill('[name="description"]', 'Oil Filter - Premium Grade')
      await page.fill('[name="quantity"]', '50')
      await page.selectOption('[name="category"]', 'filters')
      await page.fill('[name="unitCost"]', '12.50')
      await page.fill('[name="location"]', 'Warehouse A - Shelf 5')
      await page.fill('[name="minStockLevel"]', '10')
      await page.fill('[name="reorderPoint"]', '15')

      // Submit
      await page.click('button:has-text("Add to Inventory")')

      // Verify success
      await expect(page.locator('text=Item added successfully')).toBeVisible()
      await expect(page.locator('text=PART-12345')).toBeVisible()
    })

    test('should update inventory quantity', async ({ page }) => {
      // Click on item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Click adjust quantity
      await page.click('button:has-text("Adjust Quantity")')

      // Add quantity
      await page.click('text=Add Stock')
      await page.fill('[name="quantity"]', '25')
      await page.fill('[name="reason"]', 'Received shipment')
      await page.fill('[name="referenceNumber"]', 'PO-2025-001')

      // Submit
      await page.click('button:has-text("Update")')

      // Verify updated
      await expect(page.locator('text=Quantity updated')).toBeVisible()
    })

    test('should remove stock from inventory', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Adjust quantity
      await page.click('button:has-text("Adjust Quantity")')

      // Remove stock
      await page.click('text=Remove Stock')
      await page.fill('[name="quantity"]', '5')
      await page.fill('[name="reason"]', 'Used for vehicle repair')
      await page.fill('[name="vehicleId"]', 'VEH-001')

      // Submit
      await page.click('button:has-text("Update")')

      // Verify transaction logged
      await page.click('text=History')
      await expect(page.locator('text=Remove Stock')).toBeVisible()
    })

    test('should edit inventory item details', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Click edit
      await page.click('button:has-text("Edit")')

      // Update fields
      await page.fill('[name="description"]', 'Updated Description')
      await page.fill('[name="unitCost"]', '15.00')

      // Save
      await page.click('button:has-text("Save Changes")')

      // Verify updated
      await expect(page.locator('text=Updated Description')).toBeVisible()
    })

    test('should delete inventory item', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:last-child')

      // Delete
      await page.click('button:has-text("Delete")')

      // Confirm
      await page.click('button:has-text("Confirm Delete")')

      // Verify deleted
      await expect(page.locator('text=Item deleted successfully')).toBeVisible()
    })
  })

  test.describe('Per-Vehicle Inventory', () => {
    test('should view vehicle-specific inventory', async ({ page }) => {
      // Click vehicle inventory tab
      await page.click('[data-testid="vehicle-inventory-tab"]')

      // Select vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.fill('[placeholder="Search vehicles"]', 'VEH-001')
      await page.click('text=VEH-001')

      // Verify vehicle inventory displayed
      await expect(page.locator('[data-testid="vehicle-inventory-list"]')).toBeVisible()
    })

    test('should assign parts to vehicle', async ({ page }) => {
      // Go to vehicle inventory
      await page.click('[data-testid="vehicle-inventory-tab"]')
      await page.click('[data-testid="vehicle-select"]')
      await page.click('text=VEH-001')

      // Click assign part
      await page.click('button:has-text("Assign Part")')

      // Select part
      await page.fill('[placeholder="Search parts"]', 'Oil Filter')
      await page.click('[data-testid="part-result"]:first-child')

      // Set quantity
      await page.fill('[name="quantity"]', '2')

      // Assign
      await page.click('button:has-text("Assign to Vehicle")')

      // Verify assigned
      await expect(page.locator('text=Part assigned to vehicle')).toBeVisible()
    })

    test('should remove parts from vehicle', async ({ page }) => {
      // Navigate to vehicle inventory
      await page.click('[data-testid="vehicle-inventory-tab"]')
      await page.click('[data-testid="vehicle-select"]')
      await page.click('text=VEH-001')

      // Select part
      await page.click('[data-testid="vehicle-part-row"]:first-child')

      // Remove
      await page.click('button:has-text("Remove")')

      // Specify reason
      await page.fill('[name="reason"]', 'Part used during maintenance')

      // Confirm
      await page.click('button:has-text("Confirm")')

      // Verify removed
      await expect(page.locator('text=Part removed from vehicle')).toBeVisible()
    })

    test('should transfer parts between vehicles', async ({ page }) => {
      // Go to vehicle inventory
      await page.click('[data-testid="vehicle-inventory-tab"]')
      await page.click('[data-testid="vehicle-select"]')
      await page.click('text=VEH-001')

      // Select part
      await page.click('[data-testid="vehicle-part-row"]:first-child')

      // Click transfer
      await page.click('button:has-text("Transfer")')

      // Select destination vehicle
      await page.click('[data-testid="destination-vehicle-select"]')
      await page.click('text=VEH-002')

      // Set quantity
      await page.fill('[name="quantity"]', '1')

      // Transfer
      await page.click('button:has-text("Transfer Part")')

      // Verify transfer
      await expect(page.locator('text=Part transferred successfully')).toBeVisible()
    })

    test('should view vehicle inventory history', async ({ page }) => {
      // Navigate to vehicle inventory
      await page.click('[data-testid="vehicle-inventory-tab"]')
      await page.click('[data-testid="vehicle-select"]')
      await page.click('text=VEH-001')

      // Open history
      await page.click('text=History')

      // Verify transaction log
      await expect(page.locator('[data-testid="transaction-history"]')).toBeVisible()
      await expect(page.locator('[data-testid="transaction-row"]')).toHaveCount({ min: 0 })
    })
  })

  test.describe('Stock Level Monitoring', () => {
    test('should show low stock alerts', async ({ page }) => {
      // Check alerts section
      const alerts = page.locator('[data-testid="low-stock-alert"]')

      if (await alerts.count() > 0) {
        // Verify alert details
        await expect(alerts.first()).toBeVisible()
        await expect(alerts.first().locator('[data-testid="part-number"]')).toBeVisible()
        await expect(alerts.first().locator('[data-testid="current-quantity"]')).toBeVisible()
      }
    })

    test('should filter items below reorder point', async ({ page }) => {
      // Click filter
      await page.click('[data-testid="filter-dropdown"]')

      // Select below reorder point
      await page.click('text=Below Reorder Point')

      // Verify filtered results
      const items = page.locator('[data-testid="inventory-row"]')
      const count = await items.count()

      // All items should be below reorder point
      for (let i = 0; i < count; i++) {
        const quantityText = await items.nth(i).locator('[data-testid="quantity"]').textContent()
        const reorderText = await items.nth(i).locator('[data-testid="reorder-point"]').textContent()

        expect(parseInt(quantityText || '0')).toBeLessThan(parseInt(reorderText || '999'))
      }
    })

    test('should generate reorder report', async ({ page }) => {
      // Click reports
      await page.click('button:has-text("Reports")')

      // Select reorder report
      await page.click('text=Reorder Report')

      // Verify report displayed
      await expect(page.locator('[data-testid="reorder-report"]')).toBeVisible()

      // Verify items listed
      await expect(page.locator('[data-testid="reorder-item"]')).toHaveCount({ min: 0 })
    })

    test('should set reorder alerts', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Edit
      await page.click('button:has-text("Edit")')

      // Set reorder point
      await page.fill('[name="reorderPoint"]', '20')

      // Enable alerts
      await page.check('[name="enableAlerts"]')

      // Save
      await page.click('button:has-text("Save")')

      // Verify alert settings saved
      await expect(page.locator('text=Alert settings updated')).toBeVisible()
    })
  })

  test.describe('Inventory Search and Filtering', () => {
    test('should search inventory by part number', async ({ page }) => {
      // Enter search query
      await page.fill('[data-testid="inventory-search"]', 'PART-12345')

      // Verify filtered results
      await expect(page.locator('[data-testid="inventory-row"]')).toContainText('PART-12345')
    })

    test('should filter by category', async ({ page }) => {
      // Open category filter
      await page.click('[data-testid="category-filter"]')

      // Select category
      await page.click('text=Filters')

      // Verify filtered
      const items = page.locator('[data-testid="inventory-row"]')
      const count = await items.count()

      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toContainText('Filter')
      }
    })

    test('should filter by location', async ({ page }) => {
      // Open location filter
      await page.click('[data-testid="location-filter"]')

      // Select location
      await page.click('text=Warehouse A')

      // Verify results
      const items = page.locator('[data-testid="inventory-row"]')
      await expect(items.first().locator('[data-testid="location"]')).toContainText('Warehouse A')
    })

    test('should sort inventory by quantity', async ({ page }) => {
      // Click quantity header
      await page.click('th:has-text("Quantity")')

      // Verify sorted ascending
      const firstQty = await page.locator('[data-testid="inventory-row"]:first-child [data-testid="quantity"]').textContent()
      const lastQty = await page.locator('[data-testid="inventory-row"]:last-child [data-testid="quantity"]').textContent()

      expect(parseInt(firstQty || '0')).toBeLessThanOrEqual(parseInt(lastQty || '999'))

      // Click again for descending
      await page.click('th:has-text("Quantity")')

      // Verify sorted descending
      const firstQtyDesc = await page.locator('[data-testid="inventory-row"]:first-child [data-testid="quantity"]').textContent()
      const lastQtyDesc = await page.locator('[data-testid="inventory-row"]:last-child [data-testid="quantity"]').textContent()

      expect(parseInt(firstQtyDesc || '999')).toBeGreaterThanOrEqual(parseInt(lastQtyDesc || '0'))
    })
  })

  test.describe('Inventory Transactions', () => {
    test('should record inventory transaction', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:first-child')

      // New transaction
      await page.click('button:has-text("New Transaction")')

      // Fill transaction details
      await page.selectOption('[name="transactionType"]', 'addition')
      await page.fill('[name="quantity"]', '10')
      await page.fill('[name="notes"]', 'Received from supplier')
      await page.fill('[name="referenceNumber"]', 'INV-2025-001')

      // Submit
      await page.click('button:has-text("Record Transaction")')

      // Verify recorded
      await expect(page.locator('text=Transaction recorded')).toBeVisible()
    })

    test('should view transaction history', async ({ page }) => {
      // Select item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Open history tab
      await page.click('text=Transaction History')

      // Verify history displayed
      await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible()

      // Verify transaction details
      const transactions = page.locator('[data-testid="transaction-row"]')
      if (await transactions.count() > 0) {
        await expect(transactions.first().locator('[data-testid="transaction-type"]')).toBeVisible()
        await expect(transactions.first().locator('[data-testid="transaction-date"]')).toBeVisible()
      }
    })

    test('should export transaction history', async ({ page }) => {
      // Go to reports
      await page.click('button:has-text("Reports")')

      // Select transaction report
      await page.click('text=Transaction History')

      // Set date range
      await page.fill('[name="startDate"]', '2025-01-01')
      await page.fill('[name="endDate"]', '2025-12-31')

      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export CSV")')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('transactions')
    })
  })

  test.describe('Supplier Management', () => {
    test('should add supplier', async ({ page }) => {
      // Go to suppliers tab
      await page.click('[data-testid="suppliers-tab"]')

      // Add supplier
      await page.click('button:has-text("Add Supplier")')

      // Fill form
      await page.fill('[name="supplierName"]', 'Premium Auto Parts Inc')
      await page.fill('[name="contactEmail"]', 'sales@premiumauto.com')
      await page.fill('[name="contactPhone"]', '555-0123')
      await page.fill('[name="address"]', '123 Supply St, City, ST 12345')

      // Submit
      await page.click('button:has-text("Add Supplier")')

      // Verify added
      await expect(page.locator('text=Premium Auto Parts Inc')).toBeVisible()
    })

    test('should link part to supplier', async ({ page }) => {
      // Select inventory item
      await page.click('[data-testid="inventory-row"]:first-child')

      // Edit
      await page.click('button:has-text("Edit")')

      // Select supplier
      await page.click('[data-testid="supplier-select"]')
      await page.click('text=Premium Auto Parts Inc')

      // Set supplier part number
      await page.fill('[name="supplierPartNumber"]', 'SUP-12345')

      // Save
      await page.click('button:has-text("Save")')

      // Verify linked
      await expect(page.locator('text=Premium Auto Parts Inc')).toBeVisible()
    })

    test('should create purchase order', async ({ page }) => {
      // Go to purchase orders
      await page.click('[data-testid="purchase-orders-tab"]')

      // Create PO
      await page.click('button:has-text("Create Purchase Order")')

      // Select supplier
      await page.click('[data-testid="supplier-select"]')
      await page.click('text=Premium Auto Parts Inc')

      // Add items
      await page.click('button:has-text("Add Item")')
      await page.fill('[name="partNumber"]', 'PART-12345')
      await page.fill('[name="quantity"]', '50')

      // Submit
      await page.click('button:has-text("Create PO")')

      // Verify created
      await expect(page.locator('text=Purchase order created')).toBeVisible()
    })
  })

  test.describe('Inventory Reports', () => {
    test('should generate stock valuation report', async ({ page }) => {
      // Go to reports
      await page.click('button:has-text("Reports")')

      // Select valuation report
      await page.click('text=Stock Valuation')

      // Verify report displays
      await expect(page.locator('[data-testid="valuation-report"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-value"]')).toBeVisible()
    })

    test('should generate turnover report', async ({ page }) => {
      // Reports
      await page.click('button:has-text("Reports")')

      // Turnover report
      await page.click('text=Inventory Turnover')

      // Set period
      await page.selectOption('[name="period"]', 'last-quarter')

      // Generate
      await page.click('button:has-text("Generate")')

      // Verify report
      await expect(page.locator('[data-testid="turnover-report"]')).toBeVisible()
    })

    test('should export inventory to Excel', async ({ page }) => {
      // Export button
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export")')
      await page.click('text=Export to Excel')

      // Verify download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
    })
  })

  test.describe('Performance', () => {
    test('should load inventory list quickly', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/inventory')
      await page.waitForSelector('[data-testid="inventory-list"]')

      const loadTime = Date.now() - startTime

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })

    test('should handle large inventory efficiently', async ({ page }) => {
      // Should paginate large datasets
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible()

      // Should show items per page
      await expect(page.locator('[data-testid="items-per-page"]')).toBeVisible()
    })
  })
})
