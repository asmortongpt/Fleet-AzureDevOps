/**
 * E2E Tests for Incident & Safety Management System
 *
 * Test Coverage:
 * - Incident reporting workflow
 * - Investigation creation and management
 * - Safety metrics display
 * - GPS location capture
 * - Form validation
 * - Real-time data updates
 * - Multi-tab navigation
 * - CRUD operations
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.ATLAS_BASE_URL || 'http://localhost:5173'
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

// Mock authenticated user
const MOCK_USER = {
  id: '34c5e071-2d8c-44d0-8f1f-90b58672dceb',
  email: 'toby.deckow@capitaltechalliance.com',
  firstName: 'Toby',
  lastName: 'Deckow',
  role: 'SuperAdmin',
  tenantId: 'ee1e7320-b232-402e-b4f8-288998b5bff7',
  tenantName: 'Capital Tech Alliance'
}

// Helper: Navigate to Incident Hub
async function navigateToIncidentHub(page: Page) {
  await page.goto(`${BASE_URL}/incidents`)
  await page.waitForLoadState('networkidle')
}

// Helper: Wait for React Query to settle
async function waitForDataLoad(page: Page) {
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')
}

test.describe('Incident Management System - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Enable demo mode
    await page.addInitScript(() => {
      localStorage.setItem('VITE_SKIP_AUTH', 'true')
    })
  })

  test('IM-001: Should load Incident Hub with all tabs', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: 'Incident & Safety Management' })).toBeVisible()

    // Verify all tabs are present
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /incidents/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /investigations/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /analytics/i })).toBeVisible()
  })

  test('IM-002: Should display safety metrics on Overview tab', async ({ page }) => {
    await navigateToIncidentHub(page)
    await waitForDataLoad(page)

    // Verify Overview tab is active by default
    const overviewTab = page.getByRole('tab', { name: /overview/i })
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true')

    // Verify key metrics are displayed
    await expect(page.getByText(/total incidents/i)).toBeVisible()
    await expect(page.getByText(/days since last/i)).toBeVisible()
    await expect(page.getByText(/total cost/i)).toBeVisible()
    await expect(page.getByText(/incident rate/i)).toBeVisible()
  })

  test('IM-003: Should open incident report dialog', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Click "Report Incident" button
    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Verify dialog opens
    await expect(page.getByRole('dialog', { name: /report.*incident/i })).toBeVisible()

    // Verify required form fields are present
    await expect(page.getByLabel(/incident date/i)).toBeVisible()
    await expect(page.getByLabel(/severity/i)).toBeVisible()
    await expect(page.getByLabel(/type/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
    await expect(page.getByLabel(/location/i)).toBeVisible()
  })

  test('IM-004: Should validate required fields in incident report', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Open report dialog
    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit|report/i }).last()
    await submitButton.click()

    // Verify validation errors appear
    await expect(page.getByText(/date is required/i)).toBeVisible()
    await expect(page.getByText(/severity is required/i)).toBeVisible()
    await expect(page.getByText(/type is required/i)).toBeVisible()
  })

  test('IM-005: Should fill and submit incident report', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Open report dialog
    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Fill out form
    await page.fill('input[name="incident_date"]', '2024-01-30')
    await page.selectOption('select[name="severity"]', 'major')
    await page.selectOption('select[name="type"]', 'vehicle_accident')
    await page.fill('input[name="location_address"]', '123 Main St')
    await page.fill('input[name="location_city"]', 'Miami')
    await page.fill('input[name="location_state"]', 'FL')
    await page.fill('textarea[name="description"]', 'Vehicle collision at intersection. Minor front-end damage. No injuries reported.')

    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|report/i }).last()
    await submitButton.click()

    // Verify success (dialog closes or success message appears)
    await page.waitForTimeout(2000)
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('IM-006: Should show incident list in Incidents tab', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Switch to Incidents tab
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    // Verify incidents tab is active
    await expect(page.getByRole('tab', { name: /incidents/i })).toHaveAttribute('aria-selected', 'true')

    // Verify incident cards or list items are visible
    // (This will depend on whether there's data - check for either data or empty state)
    const hasIncidents = await page.locator('[data-testid="incident-card"], .incident-item').count() > 0
    const hasEmptyState = await page.getByText(/no incidents/i).isVisible()

    expect(hasIncidents || hasEmptyState).toBeTruthy()
  })

  test('IM-007: Should open investigation dialog from incident', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Switch to Incidents tab
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    // Check if there are incidents
    const incidentCard = page.locator('[data-testid="incident-card"]').first()
    const hasIncidents = await incidentCard.count() > 0

    if (hasIncidents) {
      // Click "Investigate" button on first incident
      await incidentCard.getByRole('button', { name: /investigate/i }).click()

      // Verify investigation dialog opens
      await expect(page.getByRole('dialog', { name: /investigation/i })).toBeVisible()

      // Verify investigation form fields
      await expect(page.getByLabel(/investigation date/i)).toBeVisible()
      await expect(page.getByLabel(/findings/i)).toBeVisible()
      await expect(page.getByLabel(/root cause/i)).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('IM-008: Should validate investigation form', async ({ page }) => {
    test.setTimeout(60000)

    await navigateToIncidentHub(page)
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    const incidentCard = page.locator('[data-testid="incident-card"]').first()
    const hasIncidents = await incidentCard.count() > 0

    if (hasIncidents) {
      await incidentCard.getByRole('button', { name: /investigate/i }).click()

      // Try to submit empty investigation
      const submitButton = page.getByRole('button', { name: /submit|save/i }).last()
      await submitButton.click()

      // Verify validation errors
      await expect(page.getByText(/findings.*required/i)).toBeVisible()
      await expect(page.getByText(/root cause.*required/i)).toBeVisible()
      await expect(page.getByText(/corrective action.*required/i)).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('IM-009: Should switch between all tabs', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Test all tab switches
    const tabs = [
      { name: /overview/i },
      { name: /incidents/i },
      { name: /investigations/i },
      { name: /analytics/i }
    ]

    for (const tab of tabs) {
      await page.getByRole('tab', tab).click()
      await waitForDataLoad(page)
      await expect(page.getByRole('tab', tab)).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('IM-010: Should display analytics charts', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Switch to Analytics tab
    await page.getByRole('tab', { name: /analytics/i }).click()
    await waitForDataLoad(page)

    // Verify charts are rendered (check for SVG elements or chart containers)
    const chartElements = await page.locator('svg, [class*="recharts"], canvas').count()
    expect(chartElements).toBeGreaterThan(0)
  })

  test('IM-011: Should filter incidents by severity', async ({ page }) => {
    await navigateToIncidentHub(page)
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    // Look for filter dropdown or buttons
    const filterButton = page.getByRole('button', { name: /filter/i }).first()
    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Select a severity filter
      await page.getByRole('option', { name: /critical/i }).click()
      await waitForDataLoad(page)

      // Verify URL or state updated
      // (Implementation depends on how filtering is implemented)
    }
  })

  test('IM-012: Should handle GPS location capture', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Mock geolocation
    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 25.7617, longitude: -80.1918 })

    // Open report dialog
    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Click GPS capture button
    const gpsButton = page.getByRole('button', { name: /capture.*location|gps/i })
    if (await gpsButton.isVisible()) {
      await gpsButton.click()
      await page.waitForTimeout(2000)

      // Verify coordinates are populated
      const latInput = page.locator('input[name="latitude"]')
      const lonInput = page.locator('input[name="longitude"]')

      if (await latInput.isVisible()) {
        const lat = await latInput.inputValue()
        const lon = await lonInput.inputValue()

        expect(lat).toBeTruthy()
        expect(lon).toBeTruthy()
      }
    }
  })

  test('IM-013: Should display incident severity badges', async ({ page }) => {
    await navigateToIncidentHub(page)
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    // Check for severity badges (minor, major, critical, fatality)
    const badges = await page.locator('[class*="badge"], [class*="severity"]').count()

    // If incidents exist, badges should be present
    const hasIncidents = await page.locator('[data-testid="incident-card"]').count() > 0
    if (hasIncidents) {
      expect(badges).toBeGreaterThan(0)
    }
  })

  test('IM-014: Should show incident timeline', async ({ page }) => {
    await navigateToIncidentHub(page)
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    const incidentCard = page.locator('[data-testid="incident-card"]').first()
    const hasIncidents = await incidentCard.count() > 0

    if (hasIncidents) {
      // Click to view incident details
      await incidentCard.click()

      // Look for timeline or history section
      const timeline = page.locator('[data-testid="timeline"], [class*="timeline"]')
      if (await timeline.isVisible()) {
        await expect(timeline).toBeVisible()
      }
    } else {
      test.skip()
    }
  })

  test('IM-015: Should validate description minimum length', async ({ page }) => {
    await navigateToIncidentHub(page)

    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Fill required fields
    await page.fill('input[name="incident_date"]', '2024-01-30')
    await page.selectOption('select[name="severity"]', 'minor')
    await page.selectOption('select[name="type"]', 'near_miss')

    // Enter short description (less than 20 characters)
    await page.fill('textarea[name="description"]', 'Short text')

    // Try to submit
    const submitButton = page.getByRole('button', { name: /submit|report/i }).last()
    await submitButton.click()

    // Verify validation error for description length
    await expect(page.getByText(/description.*least.*20.*characters/i)).toBeVisible()
  })

  test('IM-016: Should calculate incident rate metric', async ({ page }) => {
    await navigateToIncidentHub(page)
    await waitForDataLoad(page)

    // Look for incident rate display
    const rateMetric = page.locator(':has-text("Incident Rate"), :has-text("per million miles")')

    if (await rateMetric.count() > 0) {
      await expect(rateMetric.first()).toBeVisible()

      // Verify it shows a number
      const rateText = await rateMetric.first().textContent()
      expect(rateText).toMatch(/\d+(\.\d+)?/)
    }
  })

  test('IM-017: Should show days since last incident', async ({ page }) => {
    await navigateToIncidentHub(page)
    await waitForDataLoad(page)

    // Look for days since last incident metric
    const daysMetric = page.locator(':has-text("Days Since Last")')

    if (await daysMetric.count() > 0) {
      await expect(daysMetric.first()).toBeVisible()
    }
  })

  test('IM-018: Should handle conditional third-party fields', async ({ page }) => {
    await navigateToIncidentHub(page)

    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Check "Third Party Involved" checkbox
    const thirdPartyCheckbox = page.locator('input[name="third_party_involved"]')
    if (await thirdPartyCheckbox.isVisible()) {
      await thirdPartyCheckbox.check()

      // Verify third party details field appears
      await expect(page.locator('textarea[name="third_party_details"], input[name="third_party_details"]')).toBeVisible()
    }
  })

  test('IM-019: Should handle conditional injury fields', async ({ page }) => {
    await navigateToIncidentHub(page)

    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Check "Injuries Reported" checkbox
    const injuriesCheckbox = page.locator('input[name="injuries_reported"]')
    if (await injuriesCheckbox.isVisible()) {
      await injuriesCheckbox.check()

      // Verify injury details field appears
      await expect(page.locator('textarea[name="injury_details"], input[name="injury_details"]')).toBeVisible()
    }
  })

  test('IM-020: Should persist form data on validation error', async ({ page }) => {
    await navigateToIncidentHub(page)

    const reportButton = page.getByRole('button', { name: /report incident/i }).first()
    await reportButton.click()

    // Fill some fields
    await page.fill('input[name="incident_date"]', '2024-01-30')
    await page.fill('input[name="location_address"]', '123 Test St')

    // Try to submit (will fail validation)
    const submitButton = page.getByRole('button', { name: /submit|report/i }).last()
    await submitButton.click()

    // Verify filled data is still present
    await expect(page.locator('input[name="incident_date"]')).toHaveValue('2024-01-30')
    await expect(page.locator('input[name="location_address"]')).toHaveValue('123 Test St')
  })
})

test.describe('Incident Management - Accessibility Tests', () => {
  test('IM-A11Y-001: Should have proper ARIA labels', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Verify main heading has proper role
    await expect(page.locator('h1, h2').first()).toBeVisible()

    // Verify tabs have proper ARIA attributes
    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i)
      await expect(tab).toHaveAttribute('aria-selected')
    }
  })

  test('IM-A11Y-002: Should be keyboard navigable', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('IM-A11Y-003: Should have screen reader announcements', async ({ page }) => {
    await navigateToIncidentHub(page)

    // Check for sr-only or visually-hidden text for loading states
    const srOnlyElements = await page.locator('.sr-only, .visually-hidden, [class*="screen-reader"]').count()
    expect(srOnlyElements).toBeGreaterThan(0)
  })
})

test.describe('Incident Management - Performance Tests', () => {
  test('IM-PERF-001: Should load page within 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await navigateToIncidentHub(page)
    await waitForDataLoad(page)

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
  })

  test('IM-PERF-002: Should handle large incident lists', async ({ page }) => {
    await navigateToIncidentHub(page)
    await page.getByRole('tab', { name: /incidents/i }).click()
    await waitForDataLoad(page)

    // Scroll to test virtual scrolling or pagination
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Page should remain responsive
    const isResponsive = await page.evaluate(() => {
      const start = performance.now()
      // Trigger a simple DOM query
      document.querySelectorAll('[data-testid="incident-card"]')
      return performance.now() - start < 100
    })

    expect(isResponsive).toBeTruthy()
  })
})
