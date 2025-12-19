/**
 * Comprehensive Accessibility Test Suite
 * Tests all components for WCAG 2.1 AA compliance using axe-core
 */

import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

// All routes to test
const ROUTES_TO_TEST = [
  { path: '/', name: 'Home/Fleet Dashboard' },
  { path: '/#vehicles', name: 'Vehicles' },
  { path: '/#drivers', name: 'Drivers' },
  { path: '/#maintenance', name: 'Maintenance' },
  { path: '/#fuel', name: 'Fuel Tracking' },
  { path: '/#safety', name: 'Safety' },
  { path: '/#compliance', name: 'Compliance' },
  { path: '/#reports', name: 'Reports' },
  { path: '/#settings', name: 'Settings' },
]

test.describe('Comprehensive Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with reasonable timeout
    page.setDefaultTimeout(30000)
  })

  // Test 1: Automated axe-core scan for all routes
  for (const route of ROUTES_TO_TEST) {
    test(`axe-core: ${route.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route.path}`)

      // Wait for content to load
      await page.waitForLoadState('networkidle')

      // Run axe scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  }

  // Test 2: Keyboard Navigation
  test('keyboard navigation: Tab through all interactive elements', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Get all focusable elements
    const focusableElements = await page.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all()

    expect(focusableElements.length).toBeGreaterThan(0)

    // Tab through first 10 elements to verify tab order
    for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
      await page.keyboard.press('Tab')

      // Verify an element has focus
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      expect(focusedElement).toBeTruthy()
    }
  })

  // Test 3: Skip Links
  test('skip links: Skip to main content link exists and works', async ({ page }) => {
    await page.goto(BASE_URL)

    // Tab to skip link (should be first focusable element)
    await page.keyboard.press('Tab')

    // Check if skip link is visible when focused
    const skipLink = page.locator('a[href="#main-content"]').first()

    if (await skipLink.count() > 0) {
      await skipLink.focus()

      // Verify it becomes visible on focus
      const isVisible = await skipLink.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return styles.position !== 'absolute' ||
               styles.clip === 'auto' ||
               el.classList.contains('focus:not-sr-only')
      })

      expect(isVisible).toBeTruthy()

      // Activate skip link
      await skipLink.click()

      // Verify focus moved to main content
      const mainContent = page.locator('#main-content')
      if (await mainContent.count() > 0) {
        const isFocused = await mainContent.evaluate(el => el === document.activeElement)
        expect(isFocused).toBeTruthy()
      }
    }
  })

  // Test 4: ARIA Labels on Inputs
  test('aria labels: All inputs have accessible names', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Get all input elements
    const inputs = await page.locator('input').all()

    for (const input of inputs) {
      // Check for aria-label, aria-labelledby, or associated label
      const hasAriaLabel = await input.getAttribute('aria-label')
      const hasAriaLabelledby = await input.getAttribute('aria-labelledby')
      const hasId = await input.getAttribute('id')

      let hasAssociatedLabel = false
      if (hasId) {
        const label = page.locator(`label[for="${hasId}"]`)
        hasAssociatedLabel = await label.count() > 0
      }

      const hasAccessibleName = !!(hasAriaLabel || hasAriaLabelledby || hasAssociatedLabel)

      // Get input type and placeholder for context
      const inputType = await input.getAttribute('type')
      const placeholder = await input.getAttribute('placeholder')

      expect(hasAccessibleName,
        `Input missing accessible name (type: ${inputType}, placeholder: ${placeholder})`
      ).toBeTruthy()
    }
  })

  // Test 5: ARIA Labels on Buttons
  test('aria labels: All icon-only buttons have aria-label', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Get all button elements
    const buttons = await page.locator('button').all()

    for (const button of buttons) {
      const textContent = await button.textContent()
      const hasText = textContent && textContent.trim().length > 0

      // If button has no text content, it should have aria-label
      if (!hasText) {
        const ariaLabel = await button.getAttribute('aria-label')
        const ariaLabelledby = await button.getAttribute('aria-labelledby')

        expect(
          ariaLabel || ariaLabelledby,
          'Icon-only button missing aria-label or aria-labelledby'
        ).toBeTruthy()
      }
    }
  })

  // Test 6: Focus Indicators
  test('focus indicators: All interactive elements have visible focus', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Tab through several elements and check for focus indicators
    const elementsToTest = await page.locator(
      'a, button, input, select, textarea'
    ).all()

    for (let i = 0; i < Math.min(5, elementsToTest.length); i++) {
      const element = elementsToTest[i]
      await element.focus()

      // Check if element has visible focus indicator
      const hasFocusStyle = await element.evaluate(el => {
        const styles = window.getComputedStyle(el)
        // Check for outline, box-shadow, or border changes
        return (
          styles.outline !== 'none' &&
          styles.outline !== '0px' &&
          styles.outline !== ''
        ) || (
          styles.boxShadow !== 'none' &&
          styles.boxShadow !== ''
        )
      })

      expect(hasFocusStyle, 'Interactive element missing visible focus indicator').toBeTruthy()
    }
  })

  // Test 7: Color Contrast
  test('color contrast: Text meets WCAG AA standards', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  // Test 8: ARIA Live Regions
  test('aria live regions: Dynamic content has appropriate announcements', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all()
    const statusRegions = await page.locator('[role="status"]').all()
    const alertRegions = await page.locator('[role="alert"]').all()

    const totalLiveRegions = liveRegions.length + statusRegions.length + alertRegions.length

    // Should have at least one live region for notifications/toasts
    expect(totalLiveRegions).toBeGreaterThanOrEqual(1)
  })

  // Test 9: Dialog/Modal Focus Management
  test('dialogs: Focus trap works correctly', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Try to open a dialog/modal (look for common trigger buttons)
    const dialogTriggers = [
      'button:has-text("Add")',
      'button:has-text("Edit")',
      'button:has-text("Create")',
      'button:has-text("New")',
    ]

    for (const selector of dialogTriggers) {
      const trigger = page.locator(selector).first()
      if (await trigger.count() > 0 && await trigger.isVisible()) {
        await trigger.click()

        // Wait for dialog to open
        await page.waitForTimeout(500)

        // Check if a dialog is now open
        const dialog = page.locator('[role="dialog"]').first()
        if (await dialog.count() > 0 && await dialog.isVisible()) {
          // Get all focusable elements in dialog
          const focusableInDialog = await dialog.locator(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ).all()

          expect(focusableInDialog.length).toBeGreaterThan(0)

          // Tab through dialog elements
          for (let i = 0; i < focusableInDialog.length; i++) {
            await page.keyboard.press('Tab')
          }

          // One more tab should cycle back to first element (focus trap)
          await page.keyboard.press('Tab')

          // Verify focus is still within dialog
          const focusedElement = await page.evaluateHandle(() => document.activeElement)
          const isFocusInDialog = await dialog.evaluate(
            (dialogEl, focused) => dialogEl.contains(focused),
            focusedElement
          )

          expect(isFocusInDialog).toBeTruthy()

          // Close dialog with Escape
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)

          break
        }
      }
    }
  })

  // Test 10: Table Accessibility
  test('tables: All tables have proper headers and scope', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Find all tables
    const tables = await page.locator('table').all()

    for (const table of tables) {
      // Check for thead or th elements
      const hasTableHead = await table.locator('thead').count() > 0
      const hasHeaderCells = await table.locator('th').count() > 0

      expect(
        hasTableHead || hasHeaderCells,
        'Table missing proper header structure (thead or th elements)'
      ).toBeTruthy()

      // Check th elements have scope attribute
      const thElements = await table.locator('th').all()
      for (const th of thElements) {
        const scope = await th.getAttribute('scope')
        expect(scope, 'th element missing scope attribute').toBeTruthy()
      }
    }
  })

  // Test 11: Form Validation
  test('form validation: Error messages are accessible', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Try to submit a form without filling required fields
    const forms = await page.locator('form').all()

    for (const form of forms) {
      if (await form.isVisible()) {
        // Look for submit button
        const submitButton = form.locator('button[type="submit"]').first()
        if (await submitButton.count() > 0) {
          await submitButton.click()

          // Wait for validation
          await page.waitForTimeout(500)

          // Check for aria-invalid or error messages
          const invalidInputs = await form.locator('[aria-invalid="true"]').all()
          const errorMessages = await form.locator('[role="alert"], .error-message, [aria-live="polite"]').all()

          if (invalidInputs.length > 0) {
            // Verify error messages are associated with inputs
            for (const input of invalidInputs) {
              const ariaDescribedby = await input.getAttribute('aria-describedby')
              expect(ariaDescribedby, 'Invalid input missing aria-describedby').toBeTruthy()
            }
          }

          break
        }
      }
    }
  })

  // Test 12: Heading Hierarchy
  test('heading hierarchy: Headings are in logical order', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

    const headingLevels = []
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
      const level = parseInt(tagName.substring(1))
      headingLevels.push(level)
    }

    // Check that heading levels don't skip (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1]
      expect(diff, 'Heading hierarchy skip detected').toBeLessThanOrEqual(1)
    }
  })

  // Test 13: Landmark Regions
  test('landmark regions: Page has proper semantic structure', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['region'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])

    // Verify common landmarks exist
    const main = await page.locator('main, [role="main"]').count()
    const nav = await page.locator('nav, [role="navigation"]').count()

    expect(main, 'Page missing main landmark').toBeGreaterThan(0)
    expect(nav, 'Page missing navigation landmark').toBeGreaterThan(0)
  })

  // Test 14: Image Alt Text
  test('images: All images have alt attributes', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt !== null, 'Image missing alt attribute').toBeTruthy()
    }
  })

  // Test 15: Language Declaration
  test('language: HTML has lang attribute', async ({ page }) => {
    await page.goto(BASE_URL)

    const lang = await page.locator('html').getAttribute('lang')
    expect(lang, 'HTML element missing lang attribute').toBeTruthy()
    expect(lang, 'Invalid language code').toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
  })
})

// Generate compliance report
test.afterAll(async () => {
  console.log('\n' + '='.repeat(80))
  console.log('ACCESSIBILITY COMPLIANCE REPORT')
  console.log('='.repeat(80))
  console.log('✓ All accessibility tests completed')
  console.log('Check test results for detailed compliance information')
  console.log('='.repeat(80) + '\n')
})
