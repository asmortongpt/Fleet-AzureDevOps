import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test data
const testVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: '2023',
  plate: 'TEST123',
  vin: '1HGCM82633A123456',
  mileage: '15000',
  fuelType: 'Gasoline',
  status: 'Active'
}

const updatedVehicle = {
  model: 'Corolla',
  mileage: '20000',
  status: 'Maintenance'
}

// Helper functions
async function navigateToVehicles(page: Page) {
  await page.goto('/vehicles', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="vehicles-list"]', { timeout: 30000 })
}

async function fillVehicleForm(page: Page, vehicleData: any) {
  await page.fill('[data-testid="vehicle-make"]', vehicleData.make)
  await page.fill('[data-testid="vehicle-model"]', vehicleData.model)
  await page.fill('[data-testid="vehicle-year"]', vehicleData.year)
  await page.fill('[data-testid="vehicle-plate"]', vehicleData.plate)
  await page.fill('[data-testid="vehicle-vin"]', vehicleData.vin)
  await page.fill('[data-testid="vehicle-mileage"]', vehicleData.mileage)

  // Select fuel type
  await page.selectOption('[data-testid="vehicle-fuel-type"]', vehicleData.fuelType)

  // Select status
  await page.selectOption('[data-testid="vehicle-status"]', vehicleData.status)
}

test.describe('Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToVehicles(page)
  })

  test('Vehicle list displays with pagination', async ({ page }) => {
    // Check vehicles list is visible
    await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Make/Model")')).toBeVisible()
    await expect(page.locator('th:has-text("License Plate")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Mileage")')).toBeVisible()
    await expect(page.locator('th:has-text("Driver")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()

    // Check pagination controls if there are vehicles
    const vehicleRows = page.locator('[data-testid="vehicle-row"]')
    const rowCount = await vehicleRows.count()

    if (rowCount > 10) {
      // Check pagination is present
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
      await expect(page.locator('[data-testid="page-info"]')).toBeVisible()

      // Test pagination navigation
      await page.locator('[data-testid="next-page"]').click()
      await page.waitForTimeout(500)

      // Verify page changed
      const pageInfo = await page.locator('[data-testid="page-info"]').textContent()
      expect(pageInfo).toContain('2')

      // Go back to first page
      await page.locator('[data-testid="prev-page"]').click()
      await page.waitForTimeout(500)
    }

    // Test items per page selector
    const perPageSelector = page.locator('[data-testid="items-per-page"]')
    if (await perPageSelector.isVisible()) {
      await perPageSelector.selectOption('25')
      await page.waitForTimeout(500)

      const visibleRows = await page.locator('[data-testid="vehicle-row"]:visible').count()
      expect(visibleRows).toBeLessThanOrEqual(25)
    }
  })

  test('Create new vehicle form works', async ({ page }) => {
    // Click add vehicle button
    await page.locator('[data-testid="add-vehicle-btn"]').click()

    // Wait for modal/form to open
    await page.waitForSelector('[data-testid="vehicle-form"]', { timeout: 10000 })

    // Fill out the form
    await fillVehicleForm(page, testVehicle)

    // Upload vehicle image (optional)
    const fileInput = page.locator('[data-testid="vehicle-image"]')
    if (await fileInput.isVisible()) {
      // Create a test image file
      await fileInput.setInputFiles({
        name: 'test-vehicle.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
    }

    // Submit form
    await page.locator('[data-testid="submit-vehicle"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Vehicle added successfully')

    // Verify vehicle appears in list
    await page.waitForTimeout(1000)
    const newVehicle = page.locator(`[data-testid="vehicle-row"]:has-text("${testVehicle.plate}")`)
    await expect(newVehicle).toBeVisible()
  })

  test('Edit vehicle updates data correctly', async ({ page }) => {
    // Find a vehicle to edit (use first one)
    const firstVehicle = page.locator('[data-testid="vehicle-row"]').first()
    await expect(firstVehicle).toBeVisible()

    // Click edit button
    await firstVehicle.locator('[data-testid="edit-vehicle-btn"]').click()

    // Wait for edit form to open
    await page.waitForSelector('[data-testid="vehicle-form"]', { timeout: 10000 })

    // Update some fields
    await page.fill('[data-testid="vehicle-model"]', updatedVehicle.model)
    await page.fill('[data-testid="vehicle-mileage"]', updatedVehicle.mileage)
    await page.selectOption('[data-testid="vehicle-status"]', updatedVehicle.status)

    // Submit changes
    await page.locator('[data-testid="submit-vehicle"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Vehicle updated successfully')

    // Verify changes in list
    await page.waitForTimeout(1000)
    await expect(firstVehicle).toContainText(updatedVehicle.model)
    await expect(firstVehicle).toContainText(updatedVehicle.status)
  })

  test('Delete vehicle removes from list', async ({ page }) => {
    // Get initial vehicle count
    const initialCount = await page.locator('[data-testid="vehicle-row"]').count()

    if (initialCount > 0) {
      // Find vehicle to delete
      const vehicleToDelete = page.locator('[data-testid="vehicle-row"]').first()
      const vehiclePlate = await vehicleToDelete.locator('[data-testid="vehicle-plate"]').textContent()

      // Click delete button
      await vehicleToDelete.locator('[data-testid="delete-vehicle-btn"]').click()

      // Confirm deletion in modal
      await page.waitForSelector('[data-testid="confirm-delete-modal"]', { timeout: 10000 })
      await expect(page.locator('[data-testid="delete-warning"]')).toContainText('This action cannot be undone')

      // Confirm deletion
      await page.locator('[data-testid="confirm-delete"]').click()

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Vehicle deleted successfully')

      // Verify vehicle is removed from list
      await page.waitForTimeout(1000)
      const deletedVehicle = page.locator(`[data-testid="vehicle-row"]:has-text("${vehiclePlate}")`)
      await expect(deletedVehicle).not.toBeVisible()

      // Verify count decreased
      const newCount = await page.locator('[data-testid="vehicle-row"]').count()
      expect(newCount).toBe(initialCount - 1)
    }
  })

  test('Search and filter vehicles', async ({ page }) => {
    // Test search functionality
    const searchInput = page.locator('[data-testid="vehicle-search"]')
    await searchInput.fill('Toyota')
    await page.waitForTimeout(500) // Debounce delay

    // Verify filtered results
    const searchResults = await page.locator('[data-testid="vehicle-row"]').all()
    for (const row of searchResults) {
      const text = await row.textContent()
      expect(text?.toLowerCase()).toContain('toyota')
    }

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)

    // Test status filter
    await page.locator('[data-testid="status-filter"]').selectOption('Active')
    await page.waitForTimeout(500)

    // Verify filtered by status
    const activeVehicles = await page.locator('[data-testid="vehicle-row"]').all()
    for (const row of activeVehicles) {
      const statusBadge = row.locator('[data-testid="vehicle-status-badge"]')
      await expect(statusBadge).toContainText('Active')
    }

    // Test fuel type filter
    await page.locator('[data-testid="fuel-type-filter"]').selectOption('Electric')
    await page.waitForTimeout(500)

    // Verify filtered by fuel type
    const electricVehicles = await page.locator('[data-testid="vehicle-row"]').all()
    for (const row of electricVehicles) {
      const fuelType = row.locator('[data-testid="vehicle-fuel-type"]')
      await expect(fuelType).toContainText('Electric')
    }

    // Clear all filters
    await page.locator('[data-testid="clear-filters"]').click()
    await page.waitForTimeout(500)
  })

  test('Vehicle details page shows full information', async ({ page }) => {
    // Click on first vehicle to view details
    const firstVehicle = page.locator('[data-testid="vehicle-row"]').first()
    const vehiclePlate = await firstVehicle.locator('[data-testid="vehicle-plate"]').textContent()

    await firstVehicle.locator('[data-testid="view-vehicle-btn"]').click()

    // Wait for details page to load
    await page.waitForSelector('[data-testid="vehicle-details"]', { timeout: 10000 })

    // Verify URL changed
    expect(page.url()).toMatch(/\/vehicles\/[\w-]+/)

    // Check all sections are present
    await expect(page.locator('[data-testid="vehicle-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicle-specifications"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicle-performance"]')).toBeVisible()
    await expect(page.locator('[data-testid="maintenance-schedule"]')).toBeVisible()
    await expect(page.locator('[data-testid="fuel-economy"]')).toBeVisible()
    await expect(page.locator('[data-testid="cost-analysis"]')).toBeVisible()
    await expect(page.locator('[data-testid="documents"]')).toBeVisible()
    await expect(page.locator('[data-testid="location-history"]')).toBeVisible()

    // Verify vehicle info matches
    await expect(page.locator('[data-testid="detail-plate"]')).toContainText(vehiclePlate || '')

    // Check tabs functionality
    await page.locator('[data-testid="maintenance-tab"]').click()
    await expect(page.locator('[data-testid="maintenance-history"]')).toBeVisible()

    await page.locator('[data-testid="fuel-tab"]').click()
    await expect(page.locator('[data-testid="fuel-transactions"]')).toBeVisible()

    await page.locator('[data-testid="driver-tab"]').click()
    await expect(page.locator('[data-testid="driver-history"]')).toBeVisible()

    // Test action buttons
    await expect(page.locator('[data-testid="edit-vehicle-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="schedule-maintenance"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-fuel-record"]')).toBeVisible()
    await expect(page.locator('[data-testid="generate-report"]')).toBeVisible()

    // Test export functionality
    await page.locator('[data-testid="export-vehicle-data"]').click()
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-excel"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-csv"]')).toBeVisible()
  })

  test('Bulk actions on vehicles', async ({ page }) => {
    const vehicleRows = page.locator('[data-testid="vehicle-row"]')
    const rowCount = await vehicleRows.count()

    if (rowCount >= 3) {
      // Select multiple vehicles
      await page.locator('[data-testid="select-all-checkbox"]').check()

      // Verify bulk action bar appears
      await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible()

      const selectedCount = await page.locator('[data-testid="selected-count"]').textContent()
      expect(selectedCount).toContain(rowCount.toString())

      // Test bulk status update
      await page.locator('[data-testid="bulk-update-status"]').click()
      await page.locator('[data-testid="bulk-status-select"]').selectOption('Maintenance')
      await page.locator('[data-testid="apply-bulk-action"]').click()

      // Wait for confirmation
      await expect(page.locator('[data-testid="bulk-action-confirm"]')).toBeVisible()
      await page.locator('[data-testid="confirm-bulk"]').click()

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('vehicles updated')
    }
  })

  test('Vehicle form validation', async ({ page }) => {
    // Open add vehicle form
    await page.locator('[data-testid="add-vehicle-btn"]').click()
    await page.waitForSelector('[data-testid="vehicle-form"]', { timeout: 10000 })

    // Try to submit empty form
    await page.locator('[data-testid="submit-vehicle"]').click()

    // Check validation messages
    await expect(page.locator('[data-testid="make-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="make-error"]')).toContainText('required')

    await expect(page.locator('[data-testid="model-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="year-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="plate-error"]')).toBeVisible()

    // Test invalid inputs
    await page.fill('[data-testid="vehicle-year"]', 'abc')
    await page.fill('[data-testid="vehicle-mileage"]', '-100')
    await page.locator('[data-testid="submit-vehicle"]').click()

    await expect(page.locator('[data-testid="year-error"]')).toContainText('valid year')
    await expect(page.locator('[data-testid="mileage-error"]')).toContainText('positive number')

    // Test VIN validation
    await page.fill('[data-testid="vehicle-vin"]', '123') // Too short
    await page.locator('[data-testid="submit-vehicle"]').click()
    await expect(page.locator('[data-testid="vin-error"]')).toContainText('17 characters')
  })
})