import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test data
const testFuelTransaction = {
  date: '2024-01-15',
  vehicle: 'Toyota Camry - ABC123',
  driver: 'John Doe',
  station: 'Shell Station #123',
  gallons: '15.5',
  pricePerGallon: '3.45',
  totalCost: '53.48',
  odometer: '45678',
  paymentMethod: 'Fleet Card',
  fuelType: 'Regular'
}

// Helper functions
async function navigateToFuelTracking(page: Page) {
  await page.goto('/fuel', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="fuel-tracking-container"]', { timeout: 30000 })
}

async function fillFuelForm(page: Page, fuelData: any) {
  await page.fill('[data-testid="fuel-date"]', fuelData.date)
  await page.selectOption('[data-testid="fuel-vehicle"]', { label: fuelData.vehicle })
  await page.selectOption('[data-testid="fuel-driver"]', { label: fuelData.driver })
  await page.fill('[data-testid="fuel-station"]', fuelData.station)
  await page.fill('[data-testid="fuel-gallons"]', fuelData.gallons)
  await page.fill('[data-testid="fuel-price-per-gallon"]', fuelData.pricePerGallon)
  await page.fill('[data-testid="fuel-odometer"]', fuelData.odometer)
  await page.selectOption('[data-testid="fuel-payment-method"]', fuelData.paymentMethod)
  await page.selectOption('[data-testid="fuel-type"]', fuelData.fuelType)
}

test.describe('Fuel Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFuelTracking(page)
  })

  test('Fuel transactions list displays', async ({ page }) => {
    // Check main container is visible
    await expect(page.locator('[data-testid="fuel-tracking-container"]')).toBeVisible()

    // Check summary cards
    await expect(page.locator('[data-testid="total-fuel-cost"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-gallons"]')).toBeVisible()
    await expect(page.locator('[data-testid="average-mpg"]')).toBeVisible()
    await expect(page.locator('[data-testid="average-price"]')).toBeVisible()

    // Verify summary values are numbers
    const totalCost = await page.locator('[data-testid="total-fuel-cost-value"]').textContent()
    expect(totalCost).toMatch(/[\d,]+\.?\d*/)

    // Check transactions table
    await expect(page.locator('[data-testid="fuel-transactions-table"]')).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Date")')).toBeVisible()
    await expect(page.locator('th:has-text("Vehicle")')).toBeVisible()
    await expect(page.locator('th:has-text("Driver")')).toBeVisible()
    await expect(page.locator('th:has-text("Station")')).toBeVisible()
    await expect(page.locator('th:has-text("Gallons")')).toBeVisible()
    await expect(page.locator('th:has-text("Total Cost")')).toBeVisible()
    await expect(page.locator('th:has-text("MPG")')).toBeVisible()
    await expect(page.locator('th:has-text("Payment")')).toBeVisible()

    // Check if transactions are present
    const transactionRows = page.locator('[data-testid="fuel-transaction-row"]')
    const rowCount = await transactionRows.count()

    if (rowCount > 0) {
      // Verify first row has data
      const firstRow = transactionRows.first()
      await expect(firstRow.locator('[data-testid="transaction-date"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="transaction-vehicle"]')).toBeVisible()
      await expect(firstRow.locator('[data-testid="transaction-cost"]')).toBeVisible()

      // Check cost format
      const cost = await firstRow.locator('[data-testid="transaction-cost"]').textContent()
      expect(cost).toMatch(/\$[\d,]+\.?\d*/)
    }
  })

  test('Filter by payment method', async ({ page }) => {
    // Open payment method filter
    await page.locator('[data-testid="payment-method-filter"]').click()

    // Get available payment methods
    const paymentOptions = page.locator('[data-testid="payment-method-option"]')
    const optionsCount = await paymentOptions.count()

    if (optionsCount > 0) {
      // Select first payment method
      const firstOption = await paymentOptions.first().textContent()
      await paymentOptions.first().click()

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // Verify filtered results
      const filteredRows = await page.locator('[data-testid="fuel-transaction-row"]').all()
      for (const row of filteredRows) {
        const paymentMethod = await row.locator('[data-testid="transaction-payment"]').textContent()
        expect(paymentMethod).toBe(firstOption)
      }

      // Check filter badge appears
      await expect(page.locator('[data-testid="active-filter-badge"]')).toBeVisible()
      await expect(page.locator('[data-testid="active-filter-badge"]')).toContainText(firstOption || '')
    }

    // Test multiple payment method selection
    await page.locator('[data-testid="payment-method-filter"]').click()

    const creditCardOption = page.locator('[data-testid="payment-method-option"]:has-text("Credit Card")')
    const fleetCardOption = page.locator('[data-testid="payment-method-option"]:has-text("Fleet Card")')

    if (await creditCardOption.isVisible() && await fleetCardOption.isVisible()) {
      await creditCardOption.click()
      await fleetCardOption.click()

      // Apply filter
      await page.locator('[data-testid="apply-filter"]').click()
      await page.waitForTimeout(500)

      // Verify results include both payment methods
      const multiFilteredRows = await page.locator('[data-testid="fuel-transaction-row"]').all()
      for (const row of multiFilteredRows) {
        const payment = await row.locator('[data-testid="transaction-payment"]').textContent()
        expect(['Credit Card', 'Fleet Card']).toContain(payment)
      }
    }

    // Clear filter
    await page.locator('[data-testid="clear-payment-filter"]').click()
    await page.waitForTimeout(500)
  })

  test('Filter by date range', async ({ page }) => {
    // Open date range picker
    await page.locator('[data-testid="date-range-picker"]').click()

    // Select preset range - Last 30 days
    await page.locator('[data-testid="date-range-last-30"]').click()
    await page.waitForTimeout(500)

    // Verify date range is applied
    await expect(page.locator('[data-testid="date-range-display"]')).toBeVisible()
    const dateRangeText = await page.locator('[data-testid="date-range-display"]').textContent()
    expect(dateRangeText).toContain('Last 30 days')

    // Check all transactions are within date range
    const dateFilteredRows = await page.locator('[data-testid="fuel-transaction-row"]').all()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    for (const row of dateFilteredRows) {
      const dateText = await row.locator('[data-testid="transaction-date"]').textContent()
      const transactionDate = new Date(dateText || '')
      expect(transactionDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime())
    }

    // Test custom date range
    await page.locator('[data-testid="date-range-picker"]').click()
    await page.locator('[data-testid="date-range-custom"]').click()

    // Set custom dates
    await page.fill('[data-testid="date-from"]', '2024-01-01')
    await page.fill('[data-testid="date-to"]', '2024-01-31')
    await page.locator('[data-testid="apply-date-range"]').click()
    await page.waitForTimeout(500)

    // Verify custom range is applied
    const customRangeText = await page.locator('[data-testid="date-range-display"]').textContent()
    expect(customRangeText).toContain('Jan 01, 2024')
    expect(customRangeText).toContain('Jan 31, 2024')

    // Test this year preset
    await page.locator('[data-testid="date-range-picker"]').click()
    await page.locator('[data-testid="date-range-this-year"]').click()
    await page.waitForTimeout(500)

    // Verify updated summary statistics
    const yearTotalCost = await page.locator('[data-testid="total-fuel-cost-value"]').textContent()
    expect(yearTotalCost).toBeTruthy()

    // Clear date filter
    await page.locator('[data-testid="clear-date-filter"]').click()
    await page.waitForTimeout(500)
  })

  test('Export fuel report', async ({ page }) => {
    // Click export button
    await page.locator('[data-testid="export-fuel-report"]').click()

    // Check export options modal
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()

    // Check available export formats
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-excel"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-csv"]')).toBeVisible()

    // Select report options
    await page.locator('[data-testid="include-summary"]').check()
    await page.locator('[data-testid="include-charts"]').check()
    await page.locator('[data-testid="include-details"]').check()

    // Set date range for export
    await page.fill('[data-testid="export-date-from"]', '2024-01-01')
    await page.fill('[data-testid="export-date-to"]', '2024-12-31')

    // Select vehicles to include
    const vehicleSelector = page.locator('[data-testid="export-vehicle-select"]')
    if (await vehicleSelector.isVisible()) {
      await vehicleSelector.click()
      await page.locator('[data-testid="select-all-vehicles"]').click()
    }

    // Test PDF export
    await page.locator('[data-testid="export-pdf"]').click()

    // Wait for download notification
    await expect(page.locator('[data-testid="download-started"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-started"]')).toContainText('Generating PDF report')

    // Wait for completion
    await expect(page.locator('[data-testid="download-complete"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="download-complete"]')).toContainText('Report downloaded')

    // Test Excel export
    await page.locator('[data-testid="export-fuel-report"]').click()
    await page.locator('[data-testid="export-excel"]').click()

    // Verify Excel specific options
    await expect(page.locator('[data-testid="excel-include-formulas"]')).toBeVisible()
    await page.locator('[data-testid="excel-include-formulas"]').check()

    await page.locator('[data-testid="confirm-export"]').click()
    await expect(page.locator('[data-testid="download-complete"]')).toBeVisible({ timeout: 15000 })

    // Test CSV export
    await page.locator('[data-testid="export-fuel-report"]').click()
    await page.locator('[data-testid="export-csv"]').click()
    await page.locator('[data-testid="confirm-export"]').click()
    await expect(page.locator('[data-testid="download-complete"]')).toBeVisible({ timeout: 15000 })
  })

  test('Fuel analytics charts render', async ({ page }) => {
    // Navigate to analytics tab
    await page.locator('[data-testid="fuel-analytics-tab"]').click()
    await expect(page.locator('[data-testid="analytics-container"]')).toBeVisible()

    // Check consumption trend chart
    await expect(page.locator('[data-testid="consumption-trend-chart"]')).toBeVisible()

    // Verify chart has data
    const chartCanvas = page.locator('[data-testid="consumption-trend-chart"] canvas')
    await expect(chartCanvas).toBeVisible()

    // Check cost analysis chart
    await expect(page.locator('[data-testid="cost-analysis-chart"]')).toBeVisible()

    // Check MPG comparison chart
    await expect(page.locator('[data-testid="mpg-comparison-chart"]')).toBeVisible()

    // Check fuel type distribution
    await expect(page.locator('[data-testid="fuel-type-distribution"]')).toBeVisible()

    // Check top consumers
    await expect(page.locator('[data-testid="top-consumers-list"]')).toBeVisible()

    const topConsumers = page.locator('[data-testid="top-consumer-item"]')
    const consumerCount = await topConsumers.count()

    if (consumerCount > 0) {
      // Check first consumer details
      const firstConsumer = topConsumers.first()
      await expect(firstConsumer.locator('[data-testid="consumer-vehicle"]')).toBeVisible()
      await expect(firstConsumer.locator('[data-testid="consumer-gallons"]')).toBeVisible()
      await expect(firstConsumer.locator('[data-testid="consumer-cost"]')).toBeVisible()
    }

    // Test chart period selector
    await page.locator('[data-testid="chart-period-selector"]').selectOption('quarterly')
    await page.waitForTimeout(1000)

    // Verify charts updated
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-loading"]')).not.toBeVisible({ timeout: 10000 })

    // Test chart type toggle
    const chartTypeToggle = page.locator('[data-testid="chart-type-toggle"]')
    if (await chartTypeToggle.isVisible()) {
      await chartTypeToggle.click()
      await page.locator('[data-testid="chart-type-bar"]').click()
      await page.waitForTimeout(500)

      // Verify chart type changed
      await expect(page.locator('[data-testid="consumption-trend-chart"].bar-chart')).toBeVisible()
    }

    // Test comparison mode
    await page.locator('[data-testid="enable-comparison"]').click()
    await page.locator('[data-testid="comparison-period"]').selectOption('previous-year')
    await page.waitForTimeout(1000)

    // Verify comparison data appears
    await expect(page.locator('[data-testid="comparison-legend"]')).toBeVisible()
    await expect(page.locator('[data-testid="comparison-legend"]')).toContainText('Previous Year')
  })

  test('Add new fuel transaction', async ({ page }) => {
    // Click add transaction button
    await page.locator('[data-testid="add-fuel-transaction"]').click()

    // Wait for form modal
    await page.waitForSelector('[data-testid="fuel-transaction-form"]', { timeout: 10000 })

    // Fill the form
    await fillFuelForm(page, testFuelTransaction)

    // Upload receipt (optional)
    const receiptInput = page.locator('[data-testid="fuel-receipt"]')
    if (await receiptInput.isVisible()) {
      await receiptInput.setInputFiles({
        name: 'fuel-receipt.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
    }

    // Calculate total automatically
    const totalField = page.locator('[data-testid="fuel-total-cost"]')
    const calculatedTotal = await totalField.inputValue()
    expect(parseFloat(calculatedTotal)).toBeCloseTo(15.5 * 3.45, 2)

    // Add notes
    await page.fill('[data-testid="fuel-notes"]', 'Regular weekly fill-up')

    // Submit form
    await page.locator('[data-testid="submit-fuel-transaction"]').click()

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Fuel transaction added')

    // Verify transaction appears in list
    await page.waitForTimeout(1000)
    const newTransaction = page.locator(`[data-testid="fuel-transaction-row"]:has-text("${testFuelTransaction.station}")`)
    await expect(newTransaction).toBeVisible()
  })

  test('Fuel efficiency alerts', async ({ page }) => {
    // Check for efficiency alerts section
    const alertsSection = page.locator('[data-testid="efficiency-alerts"]')

    if (await alertsSection.isVisible()) {
      // Check alert types
      const lowMpgAlerts = page.locator('[data-testid="low-mpg-alert"]')
      const highCostAlerts = page.locator('[data-testid="high-cost-alert"]')
      const anomalyAlerts = page.locator('[data-testid="anomaly-alert"]')

      // Check if any alerts exist
      const alertCount = await lowMpgAlerts.count() + await highCostAlerts.count() + await anomalyAlerts.count()

      if (alertCount > 0) {
        // Check first alert details
        const firstAlert = page.locator('[data-testid*="-alert"]').first()
        await expect(firstAlert.locator('[data-testid="alert-vehicle"]')).toBeVisible()
        await expect(firstAlert.locator('[data-testid="alert-message"]')).toBeVisible()
        await expect(firstAlert.locator('[data-testid="alert-action"]')).toBeVisible()

        // Test alert action
        await firstAlert.locator('[data-testid="alert-action"]').click()

        // Should navigate to vehicle details or open investigation modal
        await expect(page.locator('[data-testid="alert-investigation"]')).toBeVisible()
      }
    }

    // Check threshold settings
    await page.locator('[data-testid="alert-settings"]').click()
    await expect(page.locator('[data-testid="alert-settings-modal"]')).toBeVisible()

    // Verify threshold inputs
    await expect(page.locator('[data-testid="mpg-threshold"]')).toBeVisible()
    await expect(page.locator('[data-testid="cost-threshold"]')).toBeVisible()
    await expect(page.locator('[data-testid="anomaly-sensitivity"]')).toBeVisible()

    // Update thresholds
    await page.fill('[data-testid="mpg-threshold"]', '20')
    await page.fill('[data-testid="cost-threshold"]', '100')
    await page.selectOption('[data-testid="anomaly-sensitivity"]', 'high')

    // Save settings
    await page.locator('[data-testid="save-alert-settings"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Alert settings updated')
  })

  test('Fuel card management', async ({ page }) => {
    // Navigate to fuel cards tab
    await page.locator('[data-testid="fuel-cards-tab"]').click()
    await expect(page.locator('[data-testid="fuel-cards-container"]')).toBeVisible()

    // Check fuel cards list
    await expect(page.locator('[data-testid="fuel-cards-list"]')).toBeVisible()

    const fuelCards = page.locator('[data-testid="fuel-card-item"]')
    const cardCount = await fuelCards.count()

    if (cardCount > 0) {
      // Check card details
      const firstCard = fuelCards.first()
      await expect(firstCard.locator('[data-testid="card-number"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="card-holder"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="card-status"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="card-limit"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="card-balance"]')).toBeVisible()

      // Test card actions
      await firstCard.locator('[data-testid="card-actions"]').click()
      await expect(page.locator('[data-testid="card-action-menu"]')).toBeVisible()
      await expect(page.locator('[data-testid="view-transactions"]')).toBeVisible()
      await expect(page.locator('[data-testid="update-limit"]')).toBeVisible()
      await expect(page.locator('[data-testid="block-card"]')).toBeVisible()
    }

    // Add new fuel card
    await page.locator('[data-testid="add-fuel-card"]').click()
    await page.waitForSelector('[data-testid="fuel-card-form"]', { timeout: 10000 })

    // Fill card details
    await page.fill('[data-testid="card-number-input"]', '4111111111111111')
    await page.selectOption('[data-testid="card-type"]', 'Fleet Card')
    await page.selectOption('[data-testid="card-provider"]', 'WEX')
    await page.selectOption('[data-testid="assign-to-driver"]', { index: 1 })
    await page.fill('[data-testid="monthly-limit"]', '500')

    // Submit
    await page.locator('[data-testid="submit-fuel-card"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Fuel card added')
  })
})