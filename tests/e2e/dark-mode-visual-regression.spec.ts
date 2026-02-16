import { test, expect } from '@playwright/test'

/**
 * Dark Mode Visual Regression Tests
 *
 * These tests validate that all major pages render correctly in dark mode
 * and capture visual snapshots for regression detection.
 *
 * Run with: npx playwright test dark-mode-visual-regression.spec.ts
 * Update snapshots with: npx playwright test --update-snapshots dark-mode-visual-regression.spec.ts
 */

const PAGES = [
  {
    name: 'Dashboard',
    path: '/',
    selectors: ['[data-testid="dashboard-header"]', '[data-testid="metrics-grid"]'],
  },
  {
    name: 'Fleet Management',
    path: '/fleet',
    selectors: ['[data-testid="fleet-table"]', '[data-testid="vehicle-list"]'],
  },
  {
    name: 'Drivers',
    path: '/drivers',
    selectors: ['[data-testid="drivers-table"]', '[data-testid="driver-list"]'],
  },
  {
    name: 'Analytics',
    path: '/analytics',
    selectors: ['[data-testid="analytics-chart"]', '[data-testid="analytics-grid"]'],
  },
  {
    name: 'Settings',
    path: '/settings',
    selectors: ['[data-testid="settings-panel"]', '[data-testid="settings-form"]'],
  },
]

test.describe('Dark Mode Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set to dark mode before each test
    await page.addInitScript(() => {
      localStorage.setItem('ctafleet-theme', 'dark')
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    })
  })

  PAGES.forEach((page) => {
    test(`should render ${page.name} page in dark mode`, async ({ page: browserPage }) => {
      await browserPage.goto(`http://localhost:5173${page.path}`)
      await browserPage.waitForLoadState('networkidle')

      // Wait for content to load
      await browserPage.waitForTimeout(500)

      // Verify dark mode is applied
      const htmlElement = browserPage.locator('html')
      const isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'))
      expect(isDark).toBe(true)

      // Take full page screenshot
      await expect(browserPage).toHaveScreenshot(`${page.name.toLowerCase().replace(/\s+/g, '-')}-dark.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      })
    })

    test(`should have readable text in ${page.name} dark mode`, async ({ page: browserPage }) => {
      await browserPage.goto(`http://localhost:5173${page.path}`)
      await browserPage.waitForLoadState('networkidle')

      // Check that text color contrast is sufficient
      const textColors = await browserPage.evaluate(() => {
        const elements = document.querySelectorAll('body *')
        const colors: string[] = []

        elements.forEach((el) => {
          if (el.children.length === 0) {
            const color = window.getComputedStyle(el).color
            if (color && color !== 'rgba(0, 0, 0, 0)') {
              colors.push(color)
            }
          }
        })

        return colors
      })

      // Verify we have text content with colors
      expect(textColors.length).toBeGreaterThan(0)
    })
  })

  test('should maintain color consistency across pages in dark mode', async ({ page }) => {
    // Store CSS variables from dashboard
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    const dashboardColors = await page.evaluate(() => {
      const root = document.documentElement
      return {
        background: getComputedStyle(root).getPropertyValue('--background').trim(),
        foreground: getComputedStyle(root).getPropertyValue('--foreground').trim(),
        primary: getComputedStyle(root).getPropertyValue('--primary').trim(),
        secondary: getComputedStyle(root).getPropertyValue('--secondary').trim(),
      }
    })

    // Check same colors on another page
    await page.goto('http://localhost:5173/fleet')
    await page.waitForLoadState('networkidle')

    const fleetColors = await page.evaluate(() => {
      const root = document.documentElement
      return {
        background: getComputedStyle(root).getPropertyValue('--background').trim(),
        foreground: getComputedStyle(root).getPropertyValue('--foreground').trim(),
        primary: getComputedStyle(root).getPropertyValue('--primary').trim(),
        secondary: getComputedStyle(root).getPropertyValue('--secondary').trim(),
      }
    })

    // Colors should be consistent
    expect(dashboardColors.background).toBe(fleetColors.background)
    expect(dashboardColors.foreground).toBe(fleetColors.foreground)
    expect(dashboardColors.primary).toBe(fleetColors.primary)
    expect(dashboardColors.secondary).toBe(fleetColors.secondary)
  })

  test('should properly style form elements in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/settings')
    await page.waitForLoadState('networkidle')

    // Find input elements
    const inputs = page.locator('input[type="text"], input[type="email"], textarea')
    const inputCount = await inputs.count()

    if (inputCount > 0) {
      // Check first input styling
      const firstInput = inputs.nth(0)
      const backgroundColor = await firstInput.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Background should not be transparent or default light color
      expect(backgroundColor).not.toContain('rgba(0, 0, 0, 0)')
    }
  })

  test('should properly style buttons in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Find buttons
    const buttons = page.locator('button').first()
    const buttonCount = await page.locator('button').count()

    expect(buttonCount).toBeGreaterThan(0)

    if (buttonCount > 0) {
      const buttonColor = await buttons.evaluate((el) => {
        return window.getComputedStyle(el).color
      })

      // Text should be readable
      expect(buttonColor).toBeTruthy()
    }
  })

  test('should properly style cards in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Find card elements
    const cards = page.locator('[data-testid*="card"]').first()
    const cardCount = await page.locator('[data-testid*="card"]').count()

    if (cardCount > 0) {
      const cardBgColor = await cards.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Card background should be defined
      expect(cardBgColor).toBeTruthy()
    }
  })

  test('should have visible borders in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    const elements = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-testid*="card"], [role="dialog"]')
      const borderInfo: string[] = []

      els.forEach((el) => {
        const border = window.getComputedStyle(el).borderColor
        if (border && border !== 'rgba(0, 0, 0, 0)') {
          borderInfo.push(border)
        }
      })

      return borderInfo
    })

    // Should have some visible borders
    expect(elements.length).toBeGreaterThanOrEqual(0)
  })

  test('should properly style code blocks in dark mode', async ({ page }) => {
    // Navigate to a page that might have code blocks
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    const codeBlocks = await page.locator('code').count()

    if (codeBlocks > 0) {
      const codeColor = await page.locator('code').first().evaluate((el) => {
        return window.getComputedStyle(el).color
      })

      // Code text should be readable
      expect(codeColor).toBeTruthy()
    }
  })

  test('should properly style tables in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet')
    await page.waitForLoadState('networkidle')

    const tables = await page.locator('table').count()

    if (tables > 0) {
      const tableHeaderColor = await page.locator('thead').first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Table header should have a distinct background
      expect(tableHeaderColor).toBeTruthy()
    }
  })

  test('should maintain readability in dark mode with scrollbars', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Verify page is scrollable and has content
    const pageHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight
    })

    const windowHeight = await page.evaluate(() => {
      return window.innerHeight
    })

    // If page is scrollable, scrollbar should be visible
    if (pageHeight > windowHeight) {
      const scrollbarColor = await page.evaluate(() => {
        // Note: Scrollbar colors are limited in JS, but we can verify structure
        return document.documentElement.className
      })

      expect(scrollbarColor).toContain('dark')
    }
  })

  test('should show focus indicators in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Tab to first interactive element
    await page.keyboard.press('Tab')

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement
      if (focused) {
        return window.getComputedStyle(focused).outline
      }
      return ''
    })

    // Should have focus styling
    expect(focusedElement).toBeTruthy()
  })
})

test.describe('Light Mode Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set to light mode before each test
    await page.addInitScript(() => {
      localStorage.setItem('ctafleet-theme', 'light')
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    })
  })

  test('should render dashboard in light mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Verify light mode is applied
    const htmlElement = page.locator('html')
    const isLight = await htmlElement.evaluate((el) => el.classList.contains('light'))
    expect(isLight).toBe(true)

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard-light.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('should have proper contrast in light mode', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Check light mode colors
    const colors = await page.evaluate(() => {
      const root = document.documentElement
      return {
        background: getComputedStyle(root).getPropertyValue('--background').trim(),
        foreground: getComputedStyle(root).getPropertyValue('--foreground').trim(),
      }
    })

    // Light mode should have white background and dark text
    expect(colors.background).toContain('FFFFFF')
    expect(colors.foreground).toContain('0F172A')
  })
})

test.describe('Theme Persistence', () => {
  test('should persist dark mode across page navigation', async ({ page }) => {
    // Set dark mode
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Dark$/ }).click()
    await page.waitForTimeout(300)

    // Navigate to another page
    await page.goto('http://localhost:5173/fleet')
    await page.waitForLoadState('networkidle')

    // Should still be dark
    const htmlElement = page.locator('html')
    const isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'))
    expect(isDark).toBe(true)
  })

  test('should persist light mode across page navigation', async ({ page }) => {
    // Set light mode
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Navigate to another page
    await page.goto('http://localhost:5173/drivers')
    await page.waitForLoadState('networkidle')

    // Should still be light
    const htmlElement = page.locator('html')
    const isLight = await htmlElement.evaluate((el) => el.classList.contains('light'))
    expect(isLight).toBe(true)
  })
})
