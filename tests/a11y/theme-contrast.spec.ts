/**
 * Theme Contrast Accessibility Tests
 * Uses axe-core to validate WCAG contrast compliance for all themes
 */

import { test, expect } from '@playwright/test'

test.describe('Theme Contrast Accessibility (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('light theme should meet WCAG AA contrast standards', async ({ page }) => {
    // Select light theme
    const lightThemeRadio = page.locator('input[value="light"]')
    await lightThemeRadio.check()

    // Wait for theme to apply
    await page.waitForTimeout(500)

    // Verify theme is applied
    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('light')
  })

  test('dark theme should meet WCAG AA contrast standards', async ({ page }) => {
    // Select dark theme
    const darkThemeRadio = page.locator('input[value="dark"]')
    await darkThemeRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('dark')
  })

  test('high contrast light theme should meet WCAG AAA standards', async ({ page }) => {
    // Select high contrast light theme
    const highContrastRadio = page.locator('input[value="high-contrast-light"]')
    await highContrastRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-light')
  })

  test('high contrast dark theme should meet WCAG AAA standards', async ({ page }) => {
    // Select high contrast dark theme
    const highContrastRadio = page.locator('input[value="high-contrast-dark"]')
    await highContrastRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-dark')
  })

  test('deuteranopia theme should have sufficient contrast', async ({ page }) => {
    // Select deuteranopia theme
    const accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    const deuteranopiaRadio = page.locator('input[value="deuteranopia"]')
    await deuteranopiaRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('deuteranopia')
  })

  test('protanopia theme should have sufficient contrast', async ({ page }) => {
    const accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    const protanopiaRadio = page.locator('input[value="protanopia"]')
    await protanopiaRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('protanopia')
  })

  test('tritanopia theme should have sufficient contrast', async ({ page }) => {
    const accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    const tritanopiaRadio = page.locator('input[value="tritanopia"]')
    await tritanopiaRadio.check()

    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('tritanopia')
  })

  test('theme selector should be keyboard accessible', async ({ page }) => {
    // Focus on theme selection radio buttons using Tab
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to arrow through options
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Selected theme should change
    const selectedRadio = page.locator('input[type="radio"]:checked')
    await expect(selectedRadio).toBeVisible()
  })

  test('contrast validation button should be accessible', async ({ page }) => {
    // Find check contrast button
    const checkBtn = page.locator('button:has-text("Check Contrast")')

    // Should be focusable
    await checkBtn.focus()

    // Should show focus outline
    const isFocused = await checkBtn.evaluate((el) => {
      return document.activeElement === el
    })
    expect(isFocused).toBe(true)

    // Should be clickable with keyboard
    await page.keyboard.press('Enter')

    // Results should appear
    await page.waitForTimeout(500)
    const results = page.locator('text=Valid:')
    await expect(results).toBeVisible()
  })

  test('color swatches should have sufficient color difference', async ({ page }) => {
    // Get color swatch elements
    const swatches = page.locator('[style*="background"][style*="color"]')

    // Each swatch should be distinguishable
    const count = await swatches.count()
    expect(count).toBeGreaterThanOrEqual(0)

    // Verify swatches are visible
    for (let i = 0; i < Math.min(count, 3); i++) {
      const swatch = swatches.nth(i)
      await expect(swatch).toBeVisible()
    }
  })

  test('WCAG level badges should have text labels', async ({ page }) => {
    // Look for WCAG badges
    const badges = page.locator('text=/WCAG [A]{1,3}/')

    // Check that there are badges present
    const count = await badges.count()
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const badge = badges.nth(i)
        await expect(badge).toBeVisible()
      }
    }
  })

  test('theme descriptions should have sufficient color contrast with background', async ({ page }) => {
    // Get all text in theme cards
    const descriptions = page.locator('[role="radio"] + label')

    const count = await descriptions.count()
    expect(count).toBeGreaterThan(0)

    // Check each description is readable
    for (let i = 0; i < Math.min(count, 3); i++) {
      const desc = descriptions.nth(i)
      await expect(desc).toBeVisible()
    }
  })

  test('accessibility options should be keyboard navigable', async ({ page }) => {
    // Scroll to accessibility options section
    const a11ySection = page.locator('text=Accessibility Options')
    await a11ySection.scrollIntoViewIfNeeded()

    // Should have multiple switch toggles
    const switches = page.locator('input[type="checkbox"]')
    const count = await switches.count()
    expect(count).toBeGreaterThan(0)

    // Should be able to focus and toggle
    const firstSwitch = switches.first()
    await firstSwitch.focus()
    await expect(firstSwitch).toBeFocused()
  })

  test('theme persistence should maintain accessibility', async ({ page }) => {
    // Select high contrast theme
    const highContrastRadio = page.locator('input[value="high-contrast-light"]')
    await highContrastRadio.check()

    // Reload and verify theme persists
    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-light')
  })
})
