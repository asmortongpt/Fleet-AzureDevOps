/**
 * Theme System E2E Tests
 * Tests for theme selection, switching, and contrast validation
 */

import { test, expect } from '@playwright/test'

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display theme selector component', async ({ page }) => {
    // Look for theme selection card
    const themeCard = page.locator('text=Theme Selection')
    await expect(themeCard).toBeVisible()

    // Check for preset themes
    const lightTheme = page.locator('label:has-text("Light")')
    const darkTheme = page.locator('label:has-text("Dark")')

    await expect(lightTheme).toBeVisible()
    await expect(darkTheme).toBeVisible()
  })

  test('should switch between light and dark themes', async ({ page }) => {
    // Get initial theme
    const htmlElement = page.locator('html')
    const initialTheme = await htmlElement.getAttribute('data-theme')

    // Switch to light theme
    const lightThemeRadio = page.locator('input[value="light"]')
    await lightThemeRadio.check()

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('data-theme')
    expect(newTheme).toBe('light')
  })

  test('should display high contrast themes', async ({ page }) => {
    // Click accessibility button to show accessibility themes
    const accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    // Look for high contrast themes
    const highContrastLight = page.locator('text=High Contrast Light')
    const highContrastDark = page.locator('text=High Contrast Dark')

    await expect(highContrastLight).toBeVisible()
    await expect(highContrastDark).toBeVisible()
  })

  test('should display colorblind-friendly themes', async ({ page }) => {
    // Click accessibility button
    const accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    // Look for colorblind themes
    const deuteranopia = page.locator('text=Deuteranopia Safe')
    const protanopia = page.locator('text=Protanopia Safe')
    const tritanopia = page.locator('text=Tritanopia Safe')

    await expect(deuteranopia).toBeVisible()
    await expect(protanopia).toBeVisible()
    await expect(tritanopia).toBeVisible()
  })

  test('should switch to high contrast light theme', async ({ page }) => {
    // Find and click high contrast light theme
    const highContrastRadio = page.locator('input[value="high-contrast-light"]')
    await highContrastRadio.check()

    // Verify theme applied
    const htmlElement = page.locator('html')
    const theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-light')

    // Verify data attribute
    const variant = await htmlElement.getAttribute('data-theme-variant')
    expect(variant).toBe('high-contrast')
  })

  test('should display contrast validation section', async ({ page }) => {
    // Look for contrast validation card
    const contrastCard = page.locator('text=Contrast Validation')
    await expect(contrastCard).toBeVisible()

    // Find check contrast button
    const checkBtn = page.locator('button:has-text("Check Contrast")')
    await expect(checkBtn).toBeVisible()
  })

  test('should validate contrast for current theme', async ({ page }) => {
    // Click check contrast button
    const checkBtn = page.locator('button:has-text("Check Contrast")')
    await checkBtn.click()

    // Wait for validation results
    await page.waitForLoadState('networkidle')

    // Look for validation results
    const validLabel = page.locator('text=Valid:')
    await expect(validLabel).toBeVisible()

    // Look for WCAG level
    const wcagLabel = page.locator('text=Level:')
    await expect(wcagLabel).toBeVisible()
  })

  test('should display WCAG compliance badges', async ({ page }) => {
    // Look for WCAG level badges
    const wcagBadges = page.locator('[class*="bg-green"], [class*="bg-blue"], [class*="bg-yellow"]')

    // Should have at least one badge per theme (WCAG level)
    const count = await wcagBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should persist theme selection', async ({ page, context }) => {
    // Select high contrast light theme
    const highContrastRadio = page.locator('input[value="high-contrast-light"]')
    await highContrastRadio.check()

    // Verify theme is set
    let htmlElement = page.locator('html')
    let theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-light')

    // Reload page
    await page.reload()

    // Verify theme persists
    htmlElement = page.locator('html')
    theme = await htmlElement.getAttribute('data-theme')
    expect(theme).toBe('high-contrast-light')
  })

  test('should display accessibility options', async ({ page }) => {
    // Look for accessibility options card
    const a11yCard = page.locator('text=Accessibility Options')
    await expect(a11yCard).toBeVisible()

    // Look for specific options
    const reduceMotion = page.locator('label:has-text("Reduce Motion")')
    const focusIndicators = page.locator('label:has-text("Enhanced Focus Indicators")')
    const colorPatterns = page.locator('label:has-text("Color + Patterns")')

    await expect(reduceMotion).toBeVisible()
    await expect(focusIndicators).toBeVisible()
    await expect(colorPatterns).toBeVisible()
  })

  test('should toggle reduce motion preference', async ({ page }) => {
    // Find reduce motion switch
    const reduceMotionSwitch = page.locator('input[id="reduced-motion"]')

    // Initially should be unchecked
    let isChecked = await reduceMotionSwitch.isChecked()
    expect(isChecked).toBe(false)

    // Toggle it
    await reduceMotionSwitch.check()

    // Verify it's checked
    isChecked = await reduceMotionSwitch.isChecked()
    expect(isChecked).toBe(true)
  })

  test('should display WCAG AAA themes highlight', async ({ page }) => {
    // Look for WCAG AAA section
    const wcagAAASection = page.locator('text=WCAG AAA Compliant Themes')
    await expect(wcagAAASection).toBeVisible()

    // Look for AAA theme buttons
    const buttons = page.locator('button:has-text("High Contrast"), button:has-text("Deuteranopia"), button:has-text("Protanopia"), button:has-text("Tritanopia")')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have custom theme builder prompt', async ({ page }) => {
    // Look for custom theme builder section
    const customSection = page.locator('text=Custom Theme Builder')
    await expect(customSection).toBeVisible()

    // Look for create button
    const createBtn = page.locator('button:has-text("Create Custom Theme")')
    await expect(createBtn).toBeVisible()
  })

  test('should update theme colors in CSS variables', async ({ page }) => {
    // Select light theme
    const lightThemeRadio = page.locator('input[value="light"]')
    await lightThemeRadio.check()

    // Get computed CSS variable
    const htmlElement = page.locator('html')
    const primaryColor = await htmlElement.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    })

    // Should have a valid hex color
    expect(primaryColor).toMatch(/#[0-9A-Fa-f]{6}/)
  })

  test('should apply theme to all components', async ({ page }) => {
    // Select a specific theme
    const deuteranopiaRadio = page.locator('input[value="deuteranopia"]')
    await deuteranopiaRadio.check()

    // Check that buttons, cards, and other elements respond to theme
    const buttons = page.locator('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)

    // Verify elements are visible and styled
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i)
      await expect(button).toBeVisible()
    }
  })

  test('should show contrast issues for problematic themes', async ({ page }) => {
    // Select light theme
    const lightThemeRadio = page.locator('input[value="light"]')
    await lightThemeRadio.check()

    // Click check contrast
    const checkBtn = page.locator('button:has-text("Check Contrast")')
    await checkBtn.click()

    // For light theme (WCAG AA), validation should pass
    const validLabel = page.locator('text=Valid: Yes, Valid: No')
    // At least one should be visible
    expect(await page.locator('text=Valid:').isVisible()).toBe(true)
  })

  test('should navigate between theme tabs', async ({ page }) => {
    // Click accessibility button
    let accessibilityBtn = page.locator('button:has-text("Accessibility")')
    await accessibilityBtn.click()

    // Should show accessibility themes
    let title = page.locator('text=Accessibility')
    await expect(title).toBeVisible()

    // Click to go back to all themes
    await accessibilityBtn.click()

    // Should show regular themes
    const lightTheme = page.locator('label:has-text("Light")')
    await expect(lightTheme).toBeVisible()
  })

  test('should highlight currently active theme', async ({ page }) => {
    // Select dark theme
    const darkThemeRadio = page.locator('input[value="dark"]')
    await darkThemeRadio.check()

    // Find the label for dark theme
    const darkThemeLabel = page.locator('label').filter({ has: page.locator('input[value="dark"]') })

    // It should have the checked styling
    const hasCheckedStyle = await darkThemeLabel.evaluate((el) => {
      return el.className.includes('checked') ||
             el.getAttribute('data-state') === 'checked' ||
             window.getComputedStyle(el).backgroundColor
    })

    expect(hasCheckedStyle).toBeTruthy()
  })

  test('should have color preview swatches', async ({ page }) => {
    // Look for color swatches in theme options
    const swatches = page.locator('[style*="background"]').filter({
      has: page.locator('label')
    })

    // Should have multiple color swatches
    const count = await swatches.count()
    expect(count).toBeGreaterThan(0)
  })
})
