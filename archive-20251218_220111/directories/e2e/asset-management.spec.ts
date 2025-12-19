/**
 * E2E Tests for Asset Management
 * Tests complete user workflows using Playwright
 */

import { test, expect } from '@playwright/test'

const API_URL = process.env.API_URL || 'http://localhost:3000'
const APP_URL = process.env.APP_URL || 'http://localhost:5000'

test.describe('Asset Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_URL}/login`)

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard')
  })

  test('should navigate to asset management', async ({ page }) => {
    await page.click('text=Asset Management')

    await expect(page).toHaveURL(/.*asset-management/)
    await expect(page.locator('h1')).toContainText('Asset Management')
  })

  test('should create a new asset', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click add asset button
    await page.click('button:has-text("Add Asset")')

    // Fill out the form
    await page.fill('input[name="asset_name"]', 'E2E Test Vehicle')
    await page.selectOption('select[name="asset_type"]', 'vehicle')
    await page.fill('input[name="asset_tag"]', 'E2E-001')
    await page.fill('input[name="manufacturer"]', 'Test Manufacturer')
    await page.fill('input[name="model"]', 'Test Model')
    await page.fill('input[name="purchase_price"]', '50000')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for success message
    await expect(page.locator('text=Asset created successfully')).toBeVisible()

    // Verify asset appears in the list
    await expect(page.locator('text=E2E Test Vehicle')).toBeVisible()
  })

  test('should filter assets by type', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Open filter dropdown
    await page.click('button:has-text("Filter")')

    // Select vehicle type
    await page.click('text=Vehicle')

    // Verify URL includes filter parameter
    await expect(page).toHaveURL(/.*type=vehicle/)

    // Verify only vehicles are shown
    const assetTypes = await page.locator('[data-asset-type]').allTextContents()
    assetTypes.forEach(type => {
      expect(type.toLowerCase()).toContain('vehicle')
    })
  })

  test('should search for assets', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Enter search query
    await page.fill('input[placeholder*="Search"]', 'Test Vehicle')

    // Wait for search results
    await page.waitForTimeout(500) // Debounce delay

    // Verify search results
    const results = await page.locator('[data-asset-name]').allTextContents()
    results.forEach(name => {
      expect(name.toLowerCase()).toContain('test vehicle')
    })
  })

  test('should view asset details', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click on first asset
    await page.click('[data-asset-row]:first-child')

    // Verify details page loaded
    await expect(page).toHaveURL(/.*asset-management\/[a-zA-Z0-9-]+/)
    await expect(page.locator('h2')).toContainText('Asset Details')

    // Verify details are shown
    await expect(page.locator('text=Asset Information')).toBeVisible()
    await expect(page.locator('text=History')).toBeVisible()
  })

  test('should update asset status', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click on first asset
    await page.click('[data-asset-row]:first-child')

    // Click edit button
    await page.click('button:has-text("Edit")')

    // Change status
    await page.selectOption('select[name="status"]', 'maintenance')

    // Save changes
    await page.click('button:has-text("Save")')

    // Verify success message
    await expect(page.locator('text=Asset updated successfully')).toBeVisible()

    // Verify status changed
    await expect(page.locator('text=Maintenance')).toBeVisible()
  })

  test('should assign asset to user', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click on first asset
    await page.click('[data-asset-row]:first-child')

    // Click assign button
    await page.click('button:has-text("Assign")')

    // Select user
    await page.selectOption('select[name="assigned_to"]', { index: 1 })

    // Add notes
    await page.fill('textarea[name="notes"]', 'E2E test assignment')

    // Submit
    await page.click('button:has-text("Assign Asset")')

    // Verify success
    await expect(page.locator('text=Asset assigned successfully')).toBeVisible()
  })

  test('should generate QR code', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click on first asset
    await page.click('[data-asset-row]:first-child')

    // Click QR code button
    await page.click('button:has-text("QR Code")')

    // Verify QR code is displayed
    await expect(page.locator('canvas, img[alt*="QR"]')).toBeVisible()

    // Verify download button exists
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
  })

  test('should view asset analytics', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click analytics tab
    await page.click('button:has-text("Analytics")')

    // Verify charts are displayed
    await expect(page.locator('text=Total Assets')).toBeVisible()
    await expect(page.locator('text=By Status')).toBeVisible()
    await expect(page.locator('text=By Type')).toBeVisible()

    // Verify charts are rendered
    const charts = await page.locator('canvas, svg').count()
    expect(charts).toBeGreaterThan(0)
  })

  test('should handle pagination', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Check if pagination exists
    const nextButton = page.locator('button:has-text("Next")')

    if (await nextButton.isVisible()) {
      const firstPageAssets = await page.locator('[data-asset-row]').count()

      // Click next page
      await nextButton.click()

      // Verify URL changed
      await expect(page).toHaveURL(/.*page=2/)

      // Verify different assets are shown
      const secondPageAssets = await page.locator('[data-asset-row]').count()
      expect(secondPageAssets).toBeGreaterThan(0)
    }
  })

  test('should export asset data', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.click('button:has-text("Export")')

    // Wait for download
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/assets.*\.(csv|xlsx)/)
  })
})

test.describe('Asset Management - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/api/asset-management', route => {
      route.abort('failed')
    })

    await page.goto(`${APP_URL}/asset-management`)

    // Verify error message is shown
    await expect(page.locator('text=Failed to load assets')).toBeVisible()

    // Verify retry button exists
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto(`${APP_URL}/asset-management`)

    // Click add asset
    await page.click('button:has-text("Add Asset")')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Verify validation errors
    await expect(page.locator('text=Asset name is required')).toBeVisible()
    await expect(page.locator('text=Asset type is required')).toBeVisible()
  })
})
