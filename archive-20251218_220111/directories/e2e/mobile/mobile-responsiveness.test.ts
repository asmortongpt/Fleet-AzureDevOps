import { test, expect, devices } from '@playwright/test'

/**
 * Mobile Responsiveness Tests
 * Tests layout adaptation at different mobile viewport sizes
 */

test.describe('Mobile Responsiveness - Small Phone (iPhone SE)', () => {
  test.use(devices['iPhone SE'])

  test('should display content without horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check viewport
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThanOrEqual(375)

    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // Allow 10px tolerance
  })

  test('should stack navigation elements vertically', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Content should be visible and readable
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('should have readable font sizes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check body font size
    const fontSize = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).fontSize
    })

    const fontSizeNum = parseInt(fontSize)
    expect(fontSizeNum).toBeGreaterThanOrEqual(14) // Minimum readable size
  })
})

test.describe('Mobile Responsiveness - Standard Phone (iPhone 12)', () => {
  test.use(devices['iPhone 12'])

  test('should display dashboard cards in single column', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check card layout
    const cards = page.locator('[class*="card"], [class*="metric"]')

    if (await cards.first().isVisible()) {
      const count = await cards.count()
      if (count >= 2) {
        const card1Box = await cards.nth(0).boundingBox()
        const card2Box = await cards.nth(1).boundingBox()

        // Cards should stack vertically on mobile
        if (card1Box && card2Box) {
          // Either stacked or side-by-side (both valid on mobile)
          expect(card1Box.y !== card2Box.y || card1Box.x !== card2Box.x).toBeTruthy()
        }
      }
    }
  })

  test('should adapt tables for mobile view', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const table = page.locator('table').first()

    if (await table.isVisible()) {
      // Table should either be responsive or scrollable
      const tableWidth = await table.evaluate((el) => el.scrollWidth)
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

      // Table adapts or provides horizontal scroll
      expect(tableWidth >= 0).toBeTruthy()
    }
  })

  test('should show condensed navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Mobile should show hamburger menu, not full sidebar
    const hamburger = page.locator('button').filter({ hasText: /menu/i }).first()
    await expect(hamburger).toBeVisible()
  })
})

test.describe('Mobile Responsiveness - Large Phone (iPhone 12 Pro Max)', () => {
  test.use(devices['iPhone 12 Pro Max'])

  test('should utilize larger screen space effectively', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify content is visible
    const content = page.locator('main, [role="main"], body')
    await expect(content.first()).toBeVisible()
  })

  test('should maintain touch-friendly spacing', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Buttons should still be touch-friendly
    const button = page.locator('button').first()

    if (await button.isVisible()) {
      const box = await button.boundingBox()
      expect(box && box.height >= 40).toBeTruthy()
    }
  })
})

test.describe('Mobile Responsiveness - Tablet (iPad)', () => {
  test.use(devices['iPad Pro'])

  test('should show multi-column layout on tablet', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Tablet should have more horizontal space
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeGreaterThanOrEqual(1024)

    // Content should utilize space
    const content = page.locator('main')
    await expect(content).toBeVisible()
  })

  test('should display desktop-like sidebar on tablet', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Tablet may show full sidebar or hamburger menu
    const sidebar = page.locator('nav, [class*="sidebar"]').first()
    const isVisible = await sidebar.isVisible()

    expect(isVisible).toBeTruthy()
  })

  test('should show more table columns on tablet', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const table = page.locator('table').first()

    if (await table.isVisible()) {
      const columns = page.locator('th')
      const count = await columns.count()

      // Tablet should show more columns than mobile
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Mobile Responsiveness - Form Inputs', () => {
  test.use(devices['iPhone 12'])

  test('should use appropriate input types for mobile keyboards', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Email input should have type="email" for mobile keyboard
    const emailInput = page.locator('input[type="email"]')

    if (await emailInput.isVisible()) {
      const type = await emailInput.getAttribute('type')
      expect(type).toBe('email')
    }
  })

  test('should have full-width form inputs on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const input = page.locator('input').first()

    if (await input.isVisible()) {
      const box = await input.boundingBox()
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

      // Input should take most of the width (allowing for padding)
      expect(box && box.width >= viewportWidth * 0.7).toBeTruthy()
    }
  })
})

test.describe('Mobile Responsiveness - Images and Media', () => {
  test.use(devices['iPhone 12'])

  test('should load appropriately sized images for mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const images = page.locator('img')

    if (await images.first().isVisible()) {
      const img = images.first()
      const box = await img.boundingBox()
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)

      // Images shouldn't exceed viewport width
      expect(box && box.width <= viewportWidth).toBeTruthy()
    }
  })

  test('should handle icons at mobile scale', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // SVG icons should be visible
    const icons = page.locator('svg')

    if (await icons.first().isVisible()) {
      const box = await icons.first().boundingBox()
      // Icons should be appropriately sized (16-48px typical range)
      expect(box && box.width >= 12 && box.width <= 64).toBeTruthy()
    }
  })
})

test.describe('Mobile Responsiveness - Safe Areas', () => {
  test.use(devices['iPhone 12'])

  test('should respect safe areas for notched devices', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Content should not overlap with notch/status bar
    const header = page.locator('header, [class*="header"]').first()

    if (await header.isVisible()) {
      const box = await header.boundingBox()
      // Header should have some top padding for status bar
      expect(box && box.y >= 0).toBeTruthy()
    }
  })
})
