import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test data
const testDriver = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  phone: '555-0123',
  licenseNumber: 'DL123456789',
  licenseExpiry: '2025-12-31',
  employeeId: 'EMP001',
  department: 'Operations'
}

const updatedDriver = {
  phone: '555-9876',
  department: 'Logistics'
}

// Helper functions
async function navigateToDrivers(page: Page) {
  await page.goto('/drivers', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="drivers-list"]', { timeout: 30000 })
}

async function fillDriverForm(page: Page, driverData: any) {
  await page.fill('[data-testid="driver-first-name"]', driverData.firstName)
  await page.fill('[data-testid="driver-last-name"]', driverData.lastName)
  await page.fill('[data-testid="driver-email"]', driverData.email)
  await page.fill('[data-testid="driver-phone"]', driverData.phone)
  await page.fill('[data-testid="driver-license-number"]', driverData.licenseNumber)
  await page.fill('[data-testid="driver-license-expiry"]', driverData.licenseExpiry)
  await page.fill('[data-testid="driver-employee-id"]', driverData.employeeId)
  await page.selectOption('[data-testid="driver-department"]', driverData.department)
}

test.describe('Driver Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDrivers(page)
  })

  test('Driver list displays correctly', async ({ page }) => {
    // Check drivers list is visible
    await expect(page.locator('[data-testid="drivers-list"]')).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Employee ID")')).toBeVisible()
    await expect(page.locator('th:has-text("License")')).toBeVisible()
    await expect(page.locator('th:has-text("Contact")')).toBeVisible()
    await expect(page.locator('th:has-text("Assigned Vehicle")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()

    // Check if driver rows are present
    const driverRows = page.locator('[data-testid="driver-row"]')
    const rowCount = await driverRows.count()

    if (rowCount > 0) {
      // Check first driver row has all required data
      const firstRow = driverRows.first()
      await expect(firstRow.locator('[data-testid="driver-name"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="driver-id"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="driver-license"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="driver-contact"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="driver-status-badge"]')).toBeVisible()
    }

    // Check for summary statistics
    await expect(page.locator('[data-testid="total-drivers"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-drivers"]')).toBeVisible()
    await expect(page.locator('[data-testid="available-drivers"]')).toBeVisible()
  })

  test('Create new driver with validation', async ({ page }) => {
    // Click add driver button
    await page.locator('[data-testid="add-driver-btn"]').click()

    // Wait for modal/form to open
    await page.waitForSelector('[data-testid="driver-form"]', { timeout: 10000 })

    // Test form validation - submit empty form
    await page.locator('[data-testid="submit-driver"]').click()

    // Check validation messages
    await expect(page.locator('[data-testid="first-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="last-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="license-error"]')).toBeVisible()

    // Test email validation
    await page.fill('[data-testid="driver-email"]', 'invalid-email')
    await page.locator('[data-testid="submit-driver"]').click()
    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email')

    // Test phone validation
    await page.fill('[data-testid="driver-phone"]', '123')
    await page.locator('[data-testid="submit-driver"]').click()
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('valid phone')

    // Fill valid data
    await fillDriverForm(page, testDriver)

    // Upload driver photo (optional)
    const photoInput = page.locator('[data-testid="driver-photo"]')
    if (await photoInput.isVisible()) {
      await photoInput.setInputFiles({
        name: 'driver-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
    }

    // Upload documents
    const documentsInput = page.locator('[data-testid="driver-documents"]')
    if (await documentsInput.isVisible()) {
      await documentsInput.setInputFiles([
        {
          name: 'license.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake-pdf-data')
        },
        {
          name: 'medical-cert.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('fake-pdf-data')
        }
      ])
    }

    // Submit form
    await page.locator('[data-testid="submit-driver"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Driver added successfully')

    // Verify driver appears in list
    await page.waitForTimeout(1000)
    const newDriver = page.locator(`[data-testid="driver-row"]:has-text("${testDriver.firstName}")`)
    await expect(newDriver).toBeVisible()
  })

  test('Edit driver information', async ({ page }) => {
    // Find first driver to edit
    const firstDriver = page.locator('[data-testid="driver-row"]').first()
    await expect(firstDriver).toBeVisible()

    // Get original values for comparison
    const originalName = await firstDriver.locator('[data-testid="driver-name"]').textContent()

    // Click edit button
    await firstDriver.locator('[data-testid="edit-driver-btn"]').click()

    // Wait for edit form to open
    await page.waitForSelector('[data-testid="driver-form"]', { timeout: 10000 })

    // Verify form is pre-filled
    const firstNameField = page.locator('[data-testid="driver-first-name"]')
    const firstNameValue = await firstNameField.inputValue()
    expect(firstNameValue).toBeTruthy()

    // Update some fields
    await page.fill('[data-testid="driver-phone"]', updatedDriver.phone)
    await page.selectOption('[data-testid="driver-department"]', updatedDriver.department)

    // Add a note
    await page.fill('[data-testid="driver-notes"]', 'Updated contact information')

    // Submit changes
    await page.locator('[data-testid="submit-driver"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Driver updated successfully')

    // Verify changes in list
    await page.waitForTimeout(1000)
    await expect(firstDriver).toContainText(updatedDriver.department)
  })

  test('Delete driver (with confirmation)', async ({ page }) => {
    // Get initial driver count
    const initialCount = await page.locator('[data-testid="driver-row"]').count()

    if (initialCount > 0) {
      // Find driver to delete
      const driverToDelete = page.locator('[data-testid="driver-row"]').first()
      const driverName = await driverToDelete.locator('[data-testid="driver-name"]').textContent()

      // Click delete button
      await driverToDelete.locator('[data-testid="delete-driver-btn"]').click()

      // Check confirmation modal
      await page.waitForSelector('[data-testid="confirm-delete-modal"]', { timeout: 10000 })
      await expect(page.locator('[data-testid="delete-warning"]')).toContainText('permanently delete')
      await expect(page.locator('[data-testid="driver-to-delete"]')).toContainText(driverName || '')

      // Check for reassignment warning if driver has vehicle
      const reassignWarning = page.locator('[data-testid="reassign-vehicle-warning"]')
      if (await reassignWarning.isVisible()) {
        await expect(reassignWarning).toContainText('assigned vehicle')
      }

      // Cancel deletion first to test cancel
      await page.locator('[data-testid="cancel-delete"]').click()
      await expect(page.locator('[data-testid="confirm-delete-modal"]')).not.toBeVisible()

      // Delete again and confirm
      await driverToDelete.locator('[data-testid="delete-driver-btn"]').click()
      await page.waitForSelector('[data-testid="confirm-delete-modal"]', { timeout: 10000 })
      await page.locator('[data-testid="confirm-delete"]').click()

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Driver deleted successfully')

      // Verify driver is removed
      await page.waitForTimeout(1000)
      const deletedDriver = page.locator(`[data-testid="driver-row"]:has-text("${driverName}")`)
      await expect(deletedDriver).not.toBeVisible()

      // Verify count decreased
      const newCount = await page.locator('[data-testid="driver-row"]').count()
      expect(newCount).toBe(initialCount - 1)
    }
  })

  test('Driver assignment to vehicles', async ({ page }) => {
    // Find an available driver
    const availableDriver = page.locator('[data-testid="driver-row"]:has([data-testid="driver-status-badge"]:has-text("Available"))').first()

    if (await availableDriver.isVisible()) {
      const driverName = await availableDriver.locator('[data-testid="driver-name"]').textContent()

      // Click assign vehicle button
      await availableDriver.locator('[data-testid="assign-vehicle-btn"]').click()

      // Wait for assignment modal
      await page.waitForSelector('[data-testid="assign-vehicle-modal"]', { timeout: 10000 })

      // Check available vehicles list
      await expect(page.locator('[data-testid="available-vehicles-list"]')).toBeVisible()

      const availableVehicles = page.locator('[data-testid="available-vehicle-option"]')
      const vehicleCount = await availableVehicles.count()

      if (vehicleCount > 0) {
        // Select first available vehicle
        const firstVehicle = availableVehicles.first()
        const vehicleInfo = await firstVehicle.textContent()

        await firstVehicle.locator('[data-testid="select-vehicle-radio"]').check()

        // Add assignment notes
        await page.fill('[data-testid="assignment-notes"]', 'Assigned for delivery routes')

        // Set assignment duration
        await page.fill('[data-testid="assignment-start-date"]', '2024-01-01')
        await page.fill('[data-testid="assignment-end-date"]', '2024-12-31')

        // Submit assignment
        await page.locator('[data-testid="confirm-assignment"]').click()

        // Wait for success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
        await expect(page.locator('[data-testid="success-message"]')).toContainText('Vehicle assigned successfully')

        // Verify assignment in driver row
        await page.waitForTimeout(1000)
        await expect(availableDriver.locator('[data-testid="assigned-vehicle"]')).toContainText(vehicleInfo || '')
        await expect(availableDriver.locator('[data-testid="driver-status-badge"]')).toContainText('Assigned')
      }
    }

    // Test unassignment
    const assignedDriver = page.locator('[data-testid="driver-row"]:has([data-testid="driver-status-badge"]:has-text("Assigned"))').first()

    if (await assignedDriver.isVisible()) {
      await assignedDriver.locator('[data-testid="unassign-vehicle-btn"]').click()

      // Confirm unassignment
      await page.waitForSelector('[data-testid="confirm-unassign-modal"]', { timeout: 10000 })
      await page.locator('[data-testid="confirm-unassign"]').click()

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Vehicle unassigned')

      // Verify status changed
      await page.waitForTimeout(1000)
      await expect(assignedDriver.locator('[data-testid="driver-status-badge"]')).toContainText('Available')
    }
  })

  test('Driver performance metrics display', async ({ page }) => {
    // Click on first driver to view details
    const firstDriver = page.locator('[data-testid="driver-row"]').first()
    await firstDriver.locator('[data-testid="view-driver-btn"]').click()

    // Wait for driver details page
    await page.waitForSelector('[data-testid="driver-details"]', { timeout: 10000 })

    // Check performance metrics section
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible()

    // Verify metrics cards
    await expect(page.locator('[data-testid="total-trips"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-miles"]')).toBeVisible()
    await expect(page.locator('[data-testid="fuel-efficiency"]')).toBeVisible()
    await expect(page.locator('[data-testid="safety-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="on-time-delivery"]')).toBeVisible()
    await expect(page.locator('[data-testid="incidents-count"]')).toBeVisible()

    // Check performance charts
    await expect(page.locator('[data-testid="trips-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="mileage-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="fuel-efficiency-chart"]')).toBeVisible()

    // Check time period selector
    await page.locator('[data-testid="period-selector"]').selectOption('last-30-days')
    await page.waitForTimeout(1000)

    // Verify data updated (check for loading indicator)
    await expect(page.locator('[data-testid="metrics-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="metrics-loading"]')).not.toBeVisible({ timeout: 10000 })

    // Check violations/incidents section
    await expect(page.locator('[data-testid="violations-section"]')).toBeVisible()

    const violations = page.locator('[data-testid="violation-item"]')
    const violationCount = await violations.count()

    if (violationCount > 0) {
      // Check violation details
      const firstViolation = violations.first()
      await expect(firstViolation.locator('[data-testid="violation-type"]')).toBeVisible()
      await expect(firstViolation.locator('[data-testid="violation-date"]')).toBeVisible()
      await expect(firstViolation.locator('[data-testid="violation-severity"]')).toBeVisible()
    }

    // Check certifications section
    await expect(page.locator('[data-testid="certifications-section"]')).toBeVisible()

    // Export performance report
    await page.locator('[data-testid="export-performance-btn"]').click()
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible()
    await page.locator('[data-testid="export-pdf-btn"]').click()

    // Verify download started (usually shows a toast/notification)
    await expect(page.locator('[data-testid="download-notification"]')).toBeVisible()
  })

  test('Driver search and filters', async ({ page }) => {
    // Test search by name
    await page.fill('[data-testid="driver-search"]', 'John')
    await page.waitForTimeout(500)

    // Verify filtered results
    const searchResults = await page.locator('[data-testid="driver-row"]').all()
    for (const row of searchResults) {
      const name = await row.locator('[data-testid="driver-name"]').textContent()
      expect(name?.toLowerCase()).toContain('john')
    }

    // Clear search
    await page.locator('[data-testid="clear-search"]').click()

    // Test status filter
    await page.locator('[data-testid="status-filter"]').selectOption('Available')
    await page.waitForTimeout(500)

    // Verify filtered by status
    const availableDrivers = await page.locator('[data-testid="driver-row"]').all()
    for (const row of availableDrivers) {
      const status = await row.locator('[data-testid="driver-status-badge"]').textContent()
      expect(status).toBe('Available')
    }

    // Test department filter
    await page.locator('[data-testid="department-filter"]').selectOption('Operations')
    await page.waitForTimeout(500)

    // Test license expiry filter
    await page.locator('[data-testid="expiry-filter"]').selectOption('expiring-soon')
    await page.waitForTimeout(500)

    // Check if warning badges appear for expiring licenses
    const expiringLicenses = page.locator('[data-testid="expiry-warning"]')
    if (await expiringLicenses.first().isVisible()) {
      await expect(expiringLicenses.first()).toHaveClass(/warning/)
    }

    // Clear all filters
    await page.locator('[data-testid="clear-all-filters"]').click()
    await page.waitForTimeout(500)
  })

  test('Driver documents management', async ({ page }) => {
    // Open first driver details
    const firstDriver = page.locator('[data-testid="driver-row"]').first()
    await firstDriver.locator('[data-testid="view-driver-btn"]').click()

    // Navigate to documents tab
    await page.locator('[data-testid="documents-tab"]').click()
    await expect(page.locator('[data-testid="documents-section"]')).toBeVisible()

    // Check document categories
    await expect(page.locator('[data-testid="license-documents"]')).toBeVisible()
    await expect(page.locator('[data-testid="medical-documents"]')).toBeVisible()
    await expect(page.locator('[data-testid="training-documents"]')).toBeVisible()

    // Upload new document
    await page.locator('[data-testid="upload-document-btn"]').click()
    await page.waitForSelector('[data-testid="upload-modal"]', { timeout: 10000 })

    // Select document type
    await page.selectOption('[data-testid="document-type"]', 'Medical Certificate')

    // Upload file
    const fileInput = page.locator('[data-testid="document-file"]')
    await fileInput.setInputFiles({
      name: 'medical-cert-2024.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data')
    })

    // Set expiry date
    await page.fill('[data-testid="document-expiry"]', '2025-12-31')

    // Submit upload
    await page.locator('[data-testid="upload-submit"]').click()

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Document uploaded')

    // Verify document appears in list
    await page.waitForTimeout(1000)
    const newDocument = page.locator('[data-testid="document-item"]:has-text("medical-cert-2024.pdf")')
    await expect(newDocument).toBeVisible()
  })
})