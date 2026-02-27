import { Page, expect } from '@playwright/test'

/**
 * Visual Test Utilities
 *
 * Helper functions and utilities for visual regression testing.
 * Provides common patterns for testing components and pages.
 */

/**
 * Standard viewport sizes for responsive testing
 */
export const VIEWPORTS = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 375, height: 667, name: 'mobile' },
  mobileLandscape: { width: 667, height: 375, name: 'mobile-landscape' },
  tabletLandscape: { width: 1024, height: 768, name: 'tablet-landscape' },
} as const

/**
 * Brand colors for verification
 */
export const BRAND_COLORS = {
  orange: '#FF6B35',       // CTA Orange
  blue: '#41B2E3',         // Blue Skies
  golden: '#F0A000',       // Golden Hour
  red: '#DD3903',          // Noon Red
  navy: '#2F3359',         // Navy
  darkBg: '#1A1A1A',       // Dark mode background
  lightBg: '#FFFFFF',      // Light mode background
} as const

/**
 * Take screenshot with standard naming convention
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean; maxDiffPixels?: number } = {}
) {
  const { fullPage = false, maxDiffPixels = 100 } = options

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    maxDiffPixels,
  })
}

/**
 * Test component across all viewports
 */
export async function testComponentViewports(
  page: Page,
  componentName: string,
  navigationFn?: (page: Page) => Promise<void>
) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(viewport)

    if (navigationFn) {
      await navigationFn(page)
    }

    await takeScreenshot(page, `${componentName}-${viewportName}`, {
      maxDiffPixels: viewportName === 'desktop' ? 150 : 100,
    })
  }
}

/**
 * Test component states (hover, active, focus, disabled)
 */
export async function testComponentStates(
  page: Page,
  componentName: string,
  selector: string
) {
  const element = page.locator(selector).first()

  if (!await element.isVisible()) {
    console.warn(`Element ${selector} not found for ${componentName}`)
    return
  }

  // Default state
  await takeScreenshot(page, `${componentName}-default`)

  // Hover state
  await element.hover()
  await takeScreenshot(page, `${componentName}-hover`)

  // Focus state
  await element.focus()
  await takeScreenshot(page, `${componentName}-focus`)

  // Active/clicked state
  if (await element.isEnabled()) {
    await element.click()
    await page.waitForTimeout(200)
    await takeScreenshot(page, `${componentName}-active`)
  }

  // Disabled state (if applicable)
  const disabled = page.locator(`${selector}:disabled`).first()
  if (await disabled.isVisible()) {
    await takeScreenshot(page, `${componentName}-disabled`)
  }
}

/**
 * Wait for element to be fully rendered and stable
 */
export async function waitForRender(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible', timeout })

  // Wait for layout to stabilize
  await page.waitForTimeout(500)

  // Wait for any animations to start/complete
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    })
  })
}

/**
 * Verify brand color is present on page
 */
export async function verifyBrandColor(
  page: Page,
  color: keyof typeof BRAND_COLORS,
  shouldExist: boolean = true
) {
  const colorValue = BRAND_COLORS[color]

  const hasColor = await page.evaluate((hexColor) => {
    const elements = document.querySelectorAll('*')
    for (const el of elements) {
      const style = window.getComputedStyle(el)
      const bg = style.background
      const bgColor = style.backgroundColor
      const borderColor = style.borderColor
      const color = style.color

      // Check various CSS properties for color
      if (
        bg.includes(hexColor) ||
        bgColor.includes(hexColor) ||
        borderColor.includes(hexColor) ||
        color.includes(hexColor)
      ) {
        return true
      }
    }
    return false
  }, colorValue)

  if (shouldExist) {
    expect(hasColor).toBeTruthy()
  } else {
    expect(hasColor).toBeFalsy()
  }
}

/**
 * Test modal/dialog component lifecycle
 */
export async function testModalLifecycle(
  page: Page,
  componentName: string,
  triggerSelector: string,
  modalSelector: string = '[role="dialog"]'
) {
  // Closed state
  await takeScreenshot(page, `${componentName}-closed`)

  // Open modal
  const trigger = page.locator(triggerSelector).first()
  if (await trigger.isVisible()) {
    await trigger.click()
    await page.waitForTimeout(300)

    // Open state
    const modal = page.locator(modalSelector).first()
    if (await modal.isVisible()) {
      await takeScreenshot(page, `${componentName}-open`, { maxDiffPixels: 200 })

      // Close modal
      const closeBtn = page.locator(
        `${modalSelector} button[aria-label="Close"], ${modalSelector} button:has-text("Cancel")`
      ).first()

      if (await closeBtn.isVisible()) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }

      await page.waitForTimeout(300)

      // Closed again
      await takeScreenshot(page, `${componentName}-closed-after`)
    }
  }
}

/**
 * Test form component with input
 */
export async function testFormInput(
  page: Page,
  componentName: string,
  inputSelector: string,
  testValue: string = 'Test Value'
) {
  const input = page.locator(inputSelector).first()

  if (!await input.isVisible()) {
    console.warn(`Input ${inputSelector} not found for ${componentName}`)
    return
  }

  // Empty state
  await takeScreenshot(page, `${componentName}-empty`)

  // Focused state
  await input.focus()
  await takeScreenshot(page, `${componentName}-focus`)

  // Filled state
  await input.fill(testValue)
  await takeScreenshot(page, `${componentName}-filled`)

  // Error state (if applicable)
  const errorMsg = page.locator('[class*="error"], [role="alert"]').first()
  if (await errorMsg.isVisible()) {
    await takeScreenshot(page, `${componentName}-error`)
  }
}

/**
 * Test data table interactions
 */
export async function testDataTable(
  page: Page,
  componentName: string,
  tableSelector: string = 'table'
) {
  const table = page.locator(tableSelector).first()

  if (!await table.isVisible()) {
    console.warn(`Table ${tableSelector} not found for ${componentName}`)
    return
  }

  // Default view
  await takeScreenshot(page, `${componentName}-default`, { maxDiffPixels: 250 })

  // Column header hover
  const header = page.locator(`${tableSelector} th`).first()
  if (await header.isVisible()) {
    await header.hover()
    await takeScreenshot(page, `${componentName}-header-hover`, {
      maxDiffPixels: 250,
    })

    // Sort (click header)
    await header.click()
    await page.waitForTimeout(300)
    await takeScreenshot(page, `${componentName}-sorted`, { maxDiffPixels: 250 })
  }

  // Row selection
  const checkbox = page.locator(`${tableSelector} input[type="checkbox"]`).nth(1)
  if (await checkbox.isVisible()) {
    await checkbox.click()
    await takeScreenshot(page, `${componentName}-row-selected`, {
      maxDiffPixels: 250,
    })
  }
}

/**
 * Test navigation interaction
 */
export async function testNavigation(
  page: Page,
  componentName: string,
  navItemSelector: string
) {
  // Default state
  await takeScreenshot(page, `${componentName}-default`)

  // Hover nav item
  const navItem = page.locator(navItemSelector).first()
  if (await navItem.isVisible()) {
    await navItem.hover()
    await takeScreenshot(page, `${componentName}-hover`)

    // Click nav item
    await navItem.click()
    await page.waitForTimeout(300)
    await takeScreenshot(page, `${componentName}-active`)
  }
}

/**
 * Disable animations for consistent screenshots
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      * {
        animation: none !important;
        transition: none !important;
        animation-play-state: paused !important;
      }
    `,
  })
}

/**
 * Check text contrast for accessibility
 */
export async function checkContrast(page: Page) {
  return page.evaluate(() => {
    const issues: Array<{
      element: string
      issue: string
    }> = []

    const elements = document.querySelectorAll('*')
    elements.forEach((el) => {
      const style = window.getComputedStyle(el)
      const bg = style.backgroundColor
      const color = style.color

      if (el.textContent?.trim() && bg === color) {
        issues.push({
          element: el.tagName,
          issue: 'Background and text colors are identical',
        })
      }

      if (el.textContent?.trim() && style.opacity === '0') {
        issues.push({
          element: el.tagName,
          issue: 'Element is invisible but has text content',
        })
      }
    })

    return issues
  })
}

/**
 * Generate visual report summary
 */
export function generateReportSummary(results: {
  totalTests: number
  passed: number
  failed: number
  regressions: number
}) {
  const passRate = ((results.passed / results.totalTests) * 100).toFixed(1)

  return `
Visual Regression Test Summary
==============================
Total Tests: ${results.totalTests}
Passed: ${results.passed}
Failed: ${results.failed}
Regressions: ${results.regressions}
Pass Rate: ${passRate}%
  `
}

/**
 * Test responsive breakpoints
 */
export async function testResponsiveBreakpoints(
  page: Page,
  componentName: string,
  navigationFn: (page: Page) => Promise<void>
) {
  const breakpoints = [
    { width: 320, name: 'xs' },
    { width: 640, name: 'sm' },
    { width: 1024, name: 'md' },
    { width: 1280, name: 'lg' },
    { width: 1920, name: 'xl' },
  ]

  for (const bp of breakpoints) {
    await page.setViewportSize({ width: bp.width, height: 768 })
    await navigationFn(page)
    await takeScreenshot(page, `${componentName}-${bp.name}`, {
      maxDiffPixels: bp.width > 1200 ? 150 : 100,
    })
  }
}

/**
 * Wait for network idle after interaction
 */
export async function waitForInteraction(page: Page, timeout: number = 1000) {
  await page.waitForTimeout(timeout)
  await page.waitForLoadState('networkidle')
}
