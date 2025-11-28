import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test data
const testMaintenanceRecord = {
  date: '2024-01-20',
  vehicle: 'Toyota Camry - ABC123',
  serviceType: 'Oil Change',
  provider: 'Quick Lube Service Center',
  cost: '45.99',
  odometer: '45000',
  nextServiceDue: '48000',
  technician: 'Mike Johnson',
  laborHours: '0.5',
  description: 'Regular oil change and filter replacement'
}

// Helper functions
async function navigateToMaintenance(page: Page) {
  await page.goto('/maintenance', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="maintenance-container"]', { timeout: 30000 })
}

async function fillMaintenanceForm(page: Page, maintenanceData: any) {
  await page.fill('[data-testid="maintenance-date"]', maintenanceData.date)
  await page.selectOption('[data-testid="maintenance-vehicle"]', { label: maintenanceData.vehicle })
  await page.selectOption('[data-testid="service-type"]', maintenanceData.serviceType)
  await page.fill('[data-testid="service-provider"]', maintenanceData.provider)
  await page.fill('[data-testid="maintenance-cost"]', maintenanceData.cost)
  await page.fill('[data-testid="maintenance-odometer"]', maintenanceData.odometer)
  await page.fill('[data-testid="next-service-due"]', maintenanceData.nextServiceDue)
  await page.fill('[data-testid="technician-name"]', maintenanceData.technician)
  await page.fill('[data-testid="labor-hours"]', maintenanceData.laborHours)
  await page.fill('[data-testid="maintenance-description"]', maintenanceData.description)
}

test.describe('Maintenance Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMaintenance(page)
  })

  test('Maintenance records display', async ({ page }) => {
    // Check main container
    await expect(page.locator('[data-testid="maintenance-container"]')).toBeVisible()

    // Check summary cards
    await expect(page.locator('[data-testid="upcoming-maintenance"]')).toBeVisible()
    await expect(page.locator('[data-testid="overdue-maintenance"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-maintenance-cost"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicles-serviced"]')).toBeVisible()

    // Verify summary values
    const upcomingCount = await page.locator('[data-testid="upcoming-count"]').textContent()
    expect(upcomingCount).toMatch(/\d+/)

    const overdueCount = await page.locator('[data-testid="overdue-count"]').textContent()
    if (parseInt(overdueCount || '0') > 0) {
      // Check for overdue alert
      await expect(page.locator('[data-testid="overdue-alert"]')).toBeVisible()
      await expect(page.locator('[data-testid="overdue-alert"]')).toHaveClass(/alert|warning/)
    }

    // Check maintenance table
    await expect(page.locator('[data-testid="maintenance-table"]')).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible()
    await expect(page.locator('th:has-text("Vehicle")')).toBeVisible()
    await expect(page.locator('th:has-text("Service Type")')).toBeVisible()
    await expect(page.locator('th:has-text("Provider")')).toBeVisible()
    await expect(page.locator('th:has-text("Cost")')).toBeVisible()
    await expect(page.locator('th:has-text("Odometer")')).toBeVisible()
    await expect(page.locator('th:has-text("Next Due")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()

    // Check maintenance records
    const maintenanceRows = page.locator('[data-testid="maintenance-row"]')
    const rowCount = await maintenanceRows.count()

    if (rowCount > 0) {
      // Verify first row
      const firstRow = maintenanceRows.first()
      await expect(firstRow.locator('[data-testid="maintenance-date"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="maintenance-vehicle"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="maintenance-service"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="maintenance-cost-value"]')).toBeVisible()

      // Check cost format
      const cost = await firstRow.locator('[data-testid="maintenance-cost-value"]').textContent()
      expect(cost).toMatch(/\$[\d,]+\.?\d*/)

      // Check status badge
      const statusBadge = firstRow.locator('[data-testid="maintenance-status"]')
      await expect(statusBadge).toBeVisible()
      const status = await statusBadge.textContent()
      expect(['Completed', 'Scheduled', 'In Progress', 'Overdue']).toContain(status)
    }
  })

  test('Filter by service type', async ({ page }) => {
    // Open service type filter
    await page.locator('[data-testid="service-type-filter"]').click()

    // Get available service types
    const serviceOptions = page.locator('[data-testid="service-type-option"]')
    const optionsCount = await serviceOptions.count()

    if (optionsCount > 0) {
      // Common service types to test
      const serviceTypes = ['Oil Change', 'Tire Rotation', 'Brake Service', 'Inspection']

      for (const serviceType of serviceTypes) {
        const option = page.locator(`[data-testid="service-type-option"]:has-text("${serviceType}")`)

        if (await option.isVisible()) {
          await option.click()
          await page.waitForTimeout(500)

          // Verify filtered results
          const filteredRows = await page.locator('[data-testid="maintenance-row"]').all()
          for (const row of filteredRows) {
            const service = await row.locator('[data-testid="maintenance-service"]').textContent()
            expect(service).toContain(serviceType)
          }

          // Clear filter
          await page.locator('[data-testid="clear-service-filter"]').click()
          await page.waitForTimeout(500)
          break
        }
      }
    }

    // Test multiple service type selection
    await page.locator('[data-testid="service-type-filter"]').click()

    const oilChange = page.locator('[data-testid="service-type-option"]:has-text("Oil Change")')
    const tireRotation = page.locator('[data-testid="service-type-option"]:has-text("Tire Rotation")')

    if (await oilChange.isVisible() && await tireRotation.isVisible()) {
      await oilChange.click()
      await tireRotation.click()
      await page.locator('[data-testid="apply-service-filter"]').click()
      await page.waitForTimeout(500)

      // Verify results include both service types
      const multiFilteredRows = await page.locator('[data-testid="maintenance-row"]').all()
      for (const row of multiFilteredRows) {
        const service = await row.locator('[data-testid="maintenance-service"]').textContent()
        expect(['Oil Change', 'Tire Rotation'].some(type => service?.includes(type))).toBeTruthy()
      }
    }
  })

  test('Create new maintenance record', async ({ page }) => {
    // Click add maintenance button
    await page.locator('[data-testid="add-maintenance-btn"]').click()

    // Wait for form modal
    await page.waitForSelector('[data-testid="maintenance-form"]', { timeout: 10000 })

    // Fill the form
    await fillMaintenanceForm(page, testMaintenanceRecord)

    // Add parts if applicable
    const addPartButton = page.locator('[data-testid="add-part-btn"]')
    if (await addPartButton.isVisible()) {
      await addPartButton.click()

      // Fill part details
      await page.fill('[data-testid="part-name-0"]', 'Oil Filter')
      await page.fill('[data-testid="part-number-0"]', 'OF-12345')
      await page.fill('[data-testid="part-quantity-0"]', '1')
      await page.fill('[data-testid="part-cost-0"]', '12.99')
    }

    // Upload invoice/receipt
    const invoiceInput = page.locator('[data-testid="maintenance-invoice"]')
    if (await invoiceInput.isVisible()) {
      await invoiceInput.setInputFiles({
        name: 'service-invoice.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake-pdf-data')
      })
    }

    // Set reminder for next service
    await page.locator('[data-testid="enable-reminder"]').check()
    await page.selectOption('[data-testid="reminder-type"]', 'mileage')
    await page.fill('[data-testid="reminder-value"]', '3000')

    // Submit form
    await page.locator('[data-testid="submit-maintenance"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Maintenance record added')

    // Verify record appears in list
    await page.waitForTimeout(1000)
    const newRecord = page.locator(`[data-testid="maintenance-row"]:has-text("${testMaintenanceRecord.provider}")`)
    await expect(newRecord).toBeVisible()

    // Verify reminder was set
    await expect(page.locator('[data-testid="reminder-set-notification"]')).toBeVisible()
  })

  test('View maintenance history for vehicle', async ({ page }) => {
    // Select a vehicle from dropdown
    const vehicleSelector = page.locator('[data-testid="vehicle-selector"]')
    await vehicleSelector.click()

    const vehicleOptions = page.locator('[data-testid="vehicle-option"]')
    const vehicleCount = await vehicleOptions.count()

    if (vehicleCount > 0) {
      // Select first vehicle
      const firstVehicle = vehicleOptions.first()
      const vehicleName = await firstVehicle.textContent()
      await firstVehicle.click()
      await page.waitForTimeout(500)

      // Verify filtered by vehicle
      await expect(page.locator('[data-testid="vehicle-filter-badge"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-filter-badge"]')).toContainText(vehicleName || '')

      // Check vehicle-specific summary
      await expect(page.locator('[data-testid="vehicle-maintenance-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-total-services"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-total-cost"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-last-service"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-next-due"]')).toBeVisible()

      // Check maintenance timeline
      await page.locator('[data-testid="view-timeline-btn"]').click()
      await expect(page.locator('[data-testid="maintenance-timeline"]')).toBeVisible()

      const timelineItems = page.locator('[data-testid="timeline-item"]')
      const timelineCount = await timelineItems.count()

      if (timelineCount > 0) {
        // Check timeline item details
        const firstTimelineItem = timelineItems.first()
        await expect(firstTimelineItem.locator('[data-testid="timeline-date"]')).toBeVisible()
        await expect(firstTimelineItem.locator('[data-testid="timeline-service"]')).toBeVisible()
        await expect(firstTimelineItem.locator('[data-testid="timeline-mileage"]')).toBeVisible()
      }

      // Check service intervals
      await page.locator('[data-testid="service-intervals-tab"]').click()
      await expect(page.locator('[data-testid="service-intervals-table"]')).toBeVisible()

      // Verify interval recommendations
      await expect(page.locator('[data-testid="oil-change-interval"]')).toBeVisible()
      await expect(page.locator('[data-testid="tire-rotation-interval"]')).toBeVisible()
      await expect(page.locator('[data-testid="brake-inspection-interval"]')).toBeVisible()
    }
  })

  test('Cost breakdown displays correctly', async ({ page }) => {
    // Navigate to cost analysis tab
    await page.locator('[data-testid="cost-analysis-tab"]').click()
    await expect(page.locator('[data-testid="cost-analysis-container"]')).toBeVisible()

    // Check cost summary cards
    await expect(page.locator('[data-testid="total-maintenance-spend"]')).toBeVisible()
    await expect(page.locator('[data-testid="average-cost-per-vehicle"]')).toBeVisible()
    await expect(page.locator('[data-testid="cost-per-mile"]')).toBeVisible()
    await expect(page.locator('[data-testid="year-over-year-change"]')).toBeVisible()

    // Check cost by service type chart
    await expect(page.locator('[data-testid="cost-by-service-chart"]')).toBeVisible()

    // Check cost by provider chart
    await expect(page.locator('[data-testid="cost-by-provider-chart"]')).toBeVisible()

    // Check monthly cost trend
    await expect(page.locator('[data-testid="monthly-cost-trend"]')).toBeVisible()

    // Test period selector
    await page.locator('[data-testid="cost-period-selector"]').selectOption('last-quarter')
    await page.waitForTimeout(1000)

    // Verify data updated
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({ timeout: 10000 })

    // Check top cost drivers
    await expect(page.locator('[data-testid="top-cost-drivers"]')).toBeVisible()

    const costDrivers = page.locator('[data-testid="cost-driver-item"]')
    const driverCount = await costDrivers.count()

    if (driverCount > 0) {
      // Check first cost driver
      const firstDriver = costDrivers.first()
      await expect(firstDriver.locator('[data-testid="driver-vehicle"]')).toBeVisible()
      await expect(firstDriver.locator('[data-testid="driver-total-cost"]')).toBeVisible()
      await expect(firstDriver.locator('[data-testid="driver-service-count"]')).toBeVisible()

      // Click for details
      await firstDriver.click()
      await expect(page.locator('[data-testid="cost-driver-details"]')).toBeVisible()
    }

    // Test cost comparison
    await page.locator('[data-testid="enable-cost-comparison"]').click()
    await page.selectOption('[data-testid="comparison-period"]', 'previous-year')
    await page.waitForTimeout(1000)

    // Verify comparison data
    await expect(page.locator('[data-testid="comparison-indicator"]')).toBeVisible()
    const indicator = await page.locator('[data-testid="comparison-indicator"]').textContent()
    expect(indicator).toMatch(/[+-]\d+\.?\d*%/)
  })

  test('Maintenance schedules and reminders', async ({ page }) => {
    // Navigate to schedules tab
    await page.locator('[data-testid="schedules-tab"]').click()
    await expect(page.locator('[data-testid="schedules-container"]')).toBeVisible()

    // Check scheduled maintenance list
    await expect(page.locator('[data-testid="scheduled-maintenance-list"]')).toBeVisible()

    const scheduledItems = page.locator('[data-testid="scheduled-item"]')
    const scheduledCount = await scheduledItems.count()

    if (scheduledCount > 0) {
      // Check first scheduled item
      const firstScheduled = scheduledItems.first()
      await expect(firstScheduled.locator('[data-testid="scheduled-vehicle"]')).toBeVisible()
      await expect(firstScheduled.locator('[data-testid="scheduled-service"]')).toBeVisible()
      await expect(firstScheduled.locator('[data-testid="scheduled-date"]')).toBeVisible()
      await expect(firstScheduled.locator('[data-testid="scheduled-status"]')).toBeVisible()

      // Test reschedule
      await firstScheduled.locator('[data-testid="reschedule-btn"]').click()
      await page.waitForSelector('[data-testid="reschedule-modal"]', { timeout: 10000 })

      await page.fill('[data-testid="new-schedule-date"]', '2024-02-01')
      await page.fill('[data-testid="reschedule-reason"]', 'Vehicle unavailable on original date')
      await page.locator('[data-testid="confirm-reschedule"]').click()

      await expect(page.locator('[data-testid="success-message"]')).toContainText('rescheduled')
    }

    // Check reminder settings
    await page.locator('[data-testid="reminder-settings-btn"]').click()
    await expect(page.locator('[data-testid="reminder-settings-modal"]')).toBeVisible()

    // Configure reminders
    await page.locator('[data-testid="email-reminders"]').check()
    await page.locator('[data-testid="sms-reminders"]').check()
    await page.locator('[data-testid="in-app-reminders"]').check()

    // Set reminder timing
    await page.selectOption('[data-testid="reminder-timing"]', '7-days')
    await page.selectOption('[data-testid="reminder-frequency"]', 'daily')

    // Add custom reminder rule
    await page.locator('[data-testid="add-custom-rule"]').click()
    await page.selectOption('[data-testid="rule-service-type"]', 'Oil Change')
    await page.fill('[data-testid="rule-mileage-interval"]', '5000')
    await page.fill('[data-testid="rule-time-interval"]', '90')

    // Save settings
    await page.locator('[data-testid="save-reminder-settings"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Reminder settings saved')
  })

  test('Maintenance warranty tracking', async ({ page }) => {
    // Navigate to warranties section
    await page.locator('[data-testid="warranties-tab"]').click()
    await expect(page.locator('[data-testid="warranties-container"]')).toBeVisible()

    // Check warranty list
    const warrantyItems = page.locator('[data-testid="warranty-item"]')
    const warrantyCount = await warrantyItems.count()

    if (warrantyCount > 0) {
      // Check warranty details
      const firstWarranty = warrantyItems.first()
      await expect(firstWarranty.locator('[data-testid="warranty-vehicle"]')).toBeVisible()
      await expect(firstWarranty.locator('[data-testid="warranty-type"]')).toBeVisible()
      await expect(firstWarranty.locator('[data-testid="warranty-expiry"]')).toBeVisible()
      await expect(firstWarranty.locator('[data-testid="warranty-coverage"]')).toBeVisible()

      // Check for expiring warranties
      const expiryDate = await firstWarranty.locator('[data-testid="warranty-expiry"]').textContent()
      const daysUntilExpiry = await firstWarranty.locator('[data-testid="days-until-expiry"]').textContent()

      if (parseInt(daysUntilExpiry || '365') <= 30) {
        await expect(firstWarranty.locator('[data-testid="expiry-warning"]')).toBeVisible()
      }
    }

    // Add new warranty
    await page.locator('[data-testid="add-warranty-btn"]').click()
    await page.waitForSelector('[data-testid="warranty-form"]', { timeout: 10000 })

    // Fill warranty details
    await page.selectOption('[data-testid="warranty-vehicle-select"]', { index: 1 })
    await page.selectOption('[data-testid="warranty-type-select"]', 'Extended Warranty')
    await page.fill('[data-testid="warranty-provider"]', 'AutoProtect Plus')
    await page.fill('[data-testid="warranty-start-date"]', '2024-01-01')
    await page.fill('[data-testid="warranty-end-date"]', '2027-01-01')
    await page.fill('[data-testid="warranty-mileage-limit"]', '100000')
    await page.fill('[data-testid="warranty-deductible"]', '100')

    // Select covered items
    await page.locator('[data-testid="coverage-engine"]').check()
    await page.locator('[data-testid="coverage-transmission"]').check()
    await page.locator('[data-testid="coverage-electrical"]').check()

    // Upload warranty document
    const warrantyDoc = page.locator('[data-testid="warranty-document"]')
    await warrantyDoc.setInputFiles({
      name: 'warranty-contract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-data')
    })

    // Submit
    await page.locator('[data-testid="submit-warranty"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Warranty added')
  })

  test('Export maintenance reports', async ({ page }) => {
    // Click export button
    await page.locator('[data-testid="export-maintenance-btn"]').click()
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()

    // Select report type
    await page.selectOption('[data-testid="report-type"]', 'detailed')

    // Set date range
    await page.fill('[data-testid="export-from-date"]', '2024-01-01')
    await page.fill('[data-testid="export-to-date"]', '2024-12-31')

    // Select vehicles
    await page.locator('[data-testid="select-all-vehicles"]').check()

    // Select data to include
    await page.locator('[data-testid="include-costs"]').check()
    await page.locator('[data-testid="include-parts"]').check()
    await page.locator('[data-testid="include-labor"]').check()
    await page.locator('[data-testid="include-warranties"]').check()
    await page.locator('[data-testid="include-schedules"]').check()

    // Export as PDF
    await page.locator('[data-testid="export-format-pdf"]').check()
    await page.locator('[data-testid="confirm-export"]').click()

    // Wait for export
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="export-complete"]')).toContainText('Report ready')
  })
})