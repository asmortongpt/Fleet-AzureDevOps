import { test, expect } from '@playwright/test'

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
  })

  test('should toggle between dark and light themes', async ({ page }) => {
    // Find the theme toggle button
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    expect(themeToggleButton).toBeTruthy()

    // Check initial state (should be dark)
    let htmlElement = page.locator('html')
    let darkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))
    expect(darkClass).toBe(true)

    // Click to open menu
    await themeToggleButton.click()

    // Click light theme option
    const lightOption = page.getByRole('menuitemcheckbox', { name: /^Light$/ })
    await lightOption.click()

    // Wait for theme to change
    await page.waitForTimeout(300)

    // Verify light theme is applied
    htmlElement = page.locator('html')
    const lightClass = await htmlElement.evaluate((el) => el.classList.contains('light'))
    expect(lightClass).toBe(true)

    // Verify dark class is removed
    darkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))
    expect(darkClass).toBe(false)
  })

  test('should switch to dark theme', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Switch to light first
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Now switch to dark
    await themeToggleButton.click()
    const darkOption = page.getByRole('menuitemcheckbox', { name: /^Dark$/ })
    await darkOption.click()

    await page.waitForTimeout(300)

    // Verify dark theme
    const htmlElement = page.locator('html')
    const darkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))
    expect(darkClass).toBe(true)
  })

  test('should support system theme preference', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Click to open menu
    await themeToggleButton.click()

    // Click system theme option
    const systemOption = page.getByRole('menuitemcheckbox', { name: /^System$/ })
    await systemOption.click()

    // Verify localStorage is set to 'system'
    const themeInStorage = await page.evaluate(() => {
      return localStorage.getItem('ctafleet-theme')
    })
    expect(themeInStorage).toBe('system')
  })

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Switch to light theme
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Check localStorage
    const themeInStorage = await page.evaluate(() => {
      return localStorage.getItem('ctafleet-theme')
    })
    expect(themeInStorage).toBe('light')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify light theme persists
    const htmlElement = page.locator('html')
    const lightClass = await htmlElement.evaluate((el) => el.classList.contains('light'))
    expect(lightClass).toBe(true)
  })

  test('should mark current theme as checked', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Open menu
    await themeToggleButton.click()

    // Dark should be checked (default)
    const darkOption = page.getByRole('menuitemcheckbox', { name: /^Dark$/ })
    const darkState = await darkOption.getAttribute('data-state')
    expect(darkState).toBe('checked')

    // Switch to light
    const lightOption = page.getByRole('menuitemcheckbox', { name: /^Light$/ })
    await lightOption.click()
    await page.waitForTimeout(300)

    // Open menu again
    await themeToggleButton.click()

    // Now light should be checked
    const updatedLightState = await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).getAttribute('data-state')
    expect(updatedLightState).toBe('checked')
  })

  test('should update data-appearance attribute on root element', async ({ page }) => {
    const htmlElement = page.locator('html')

    // Check initial state
    let appearance = await htmlElement.getAttribute('data-appearance')
    expect(appearance).toBe('dark')

    // Switch to light
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Check updated state
    appearance = await htmlElement.getAttribute('data-appearance')
    expect(appearance).toBe('light')
  })

  test('should apply correct background color in dark mode', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Ensure we're in dark mode
    const htmlElement = page.locator('html')
    let isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'))

    if (!isDark) {
      await themeToggleButton.click()
      await page.getByRole('menuitemcheckbox', { name: /^Dark$/ }).click()
      await page.waitForTimeout(300)
    }

    // Check background color via CSS variables
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    })

    // Should be dark background
    expect(bgColor).toContain('0A0E27') // MIDNIGHT color
  })

  test('should apply correct background color in light mode', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Switch to light mode
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Check background color via CSS variables
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    })

    // Should be light background
    expect(bgColor).toContain('FFFFFF') // White
  })

  test('should close dropdown menu after theme selection', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })

    // Open menu
    await themeToggleButton.click()

    // Verify menu is open
    let lightOption = page.getByRole('menuitemcheckbox', { name: /^Light$/ })
    expect(await lightOption.isVisible()).toBe(true)

    // Select option
    await lightOption.click()
    await page.waitForTimeout(300)

    // Open menu again to verify previous options are gone
    await themeToggleButton.click()

    // Now the menu should be open again
    lightOption = page.getByRole('menuitemcheckbox', { name: /^Light$/ })
    expect(await lightOption.isVisible()).toBe(true)
  })
})

test.describe('Dark Mode Color Contrast', () => {
  test('should have WCAG AAA compliant contrast in dark mode', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Ensure dark mode
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    const htmlElement = page.locator('html')

    const isDark = await htmlElement.evaluate((el) => el.classList.contains('dark'))
    if (!isDark) {
      await themeToggleButton.click()
      await page.getByRole('menuitemcheckbox', { name: /^Dark$/ }).click()
      await page.waitForTimeout(300)
    }

    // Check primary text contrast (white on dark background)
    const bgColor = await page.evaluate(() => {
      const root = document.documentElement
      const bg = getComputedStyle(root).getPropertyValue('--background').trim()
      const fg = getComputedStyle(root).getPropertyValue('--foreground').trim()
      return { bg, fg }
    })

    // White foreground on dark background should have excellent contrast
    expect(bgColor.fg).toContain('FFFFFF') // White text
    expect(bgColor.bg).toContain('0A0E27') // Dark background
  })

  test('should have WCAG AAA compliant contrast in light mode', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Switch to light mode
    const themeToggleButton = page.getByRole('button', { name: /toggle theme/i })
    await themeToggleButton.click()
    await page.getByRole('menuitemcheckbox', { name: /^Light$/ }).click()
    await page.waitForTimeout(300)

    // Check primary text contrast
    const colorVars = await page.evaluate(() => {
      const root = document.documentElement
      const bg = getComputedStyle(root).getPropertyValue('--background').trim()
      const fg = getComputedStyle(root).getPropertyValue('--foreground').trim()
      return { bg, fg }
    })

    // Dark text on white background should have excellent contrast
    expect(colorVars.fg).toContain('0F172A') // Dark text
    expect(colorVars.bg).toContain('FFFFFF') // White background
  })
})
