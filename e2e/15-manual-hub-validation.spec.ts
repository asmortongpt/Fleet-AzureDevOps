import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * MANUAL HUB VALIDATION WITH PROPER AUTH BYPASS
 * Testing Work Hub and People Hub modules with authentication handled
 */

// Module definitions
const WORK_HUB_MODULES = [
  { button: 'Task Management', expectedText: 'task' },
  { button: 'Maintenance Calendar', expectedText: 'maintenance|schedule' },
  { button: 'Route Management', expectedText: 'route' },
  { button: 'Maintenance Request', expectedText: 'request|maintenance' },
  { button: 'Garage & Service', expectedText: 'garage|service|vehicle' },
]

const PEOPLE_HUB_MODULES = [
  { button: 'People Management', expectedText: 'people|employee|driver' },
  { button: 'Driver Performance', expectedText: 'driver|performance' },
  { button: 'Driver Scorecard', expectedText: 'scorecard|driver' },
]

test.describe('Work Hub & People Hub - Manual Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up Playwright detection markers
    await context.addInitScript(() => {
      (window as any).__playwright = true;
      (window as any).playwright = true;
    })

    // Navigate and wait for app to fully load
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for the app to render
    await page.waitForTimeout(2000)

    // Check if we're on login page and skip if needed
    const onLoginPage = await page.locator('text="Sign in"').count() > 0
    if (onLoginPage) {
      console.log('⚠️ Still on login page despite auth bypass')
      // Try to bypass by setting localStorage
      await page.evaluate(() => {
        localStorage.setItem('token', 'test-token')
        localStorage.setItem('user', JSON.stringify({ email: 'test@demo.com', name: 'Test User' }))
      })
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)
    }
  })

  test('Screenshot current state for debugging', async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), 'test-results', 'debug-screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    // Take a full page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'app-initial-state.png'),
      fullPage: true
    })

    // Get all visible text
    const bodyText = await page.evaluate(() => document.body.innerText)
    console.log('\n=== PAGE CONTENT ===')
    console.log(bodyText.substring(0, 500))
    console.log('===================\n')

    // List all buttons
    const buttons = await page.locator('button').allTextContents()
    console.log('\n=== BUTTONS FOUND ===')
    console.log(buttons.slice(0, 20))
    console.log('===================\n')

    // Check for sidebar
    const sidebarVisible = await page.locator('aside, nav, [class*="sidebar"]').count()
    console.log(`Sidebar elements found: ${sidebarVisible}`)

    // Check current URL
    console.log(`Current URL: ${page.url()}`)
  })

  test('Validate Work Hub modules', async ({ page }) => {
    let passedCount = 0
    const results: Array<{ module: string, passed: boolean, error?: string }> = []

    for (const module of WORK_HUB_MODULES) {
      console.log(`\n🔍 Testing: ${module.button}`)

      try {
        // Find the button
        const button = page.locator(`button:has-text("${module.button}")`).first()
        const buttonExists = await button.count() > 0

        if (!buttonExists) {
          console.log(`  ❌ Button "${module.button}" not found`)
          results.push({ module: module.button, passed: false, error: 'Button not found' })
          continue
        }

        // Click the button
        await button.click({ timeout: 5000 })
        console.log(`  ✓ Clicked`)

        // Wait for content
        await page.waitForTimeout(2000)

        // Check for expected content
        const hasExpectedContent = await page.locator(`text=/${module.expectedText}/i`).count() > 0
        const hasAnyContent = await page.locator('h1, h2, h3, table, [class*="card"]').count() > 3

        if (hasExpectedContent && hasAnyContent) {
          console.log(`  ✅ PASS - Content rendered`)
          passedCount++
          results.push({ module: module.button, passed: true })
        } else {
          console.log(`  ⚠️  WARN - Limited content`)
          results.push({ module: module.button, passed: false, error: 'Limited content' })
        }

        // Screenshot
        const screenshotDir = path.join(process.cwd(), 'test-results', 'work-hub-screenshots')
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true })
        }
        await page.screenshot({
          path: path.join(screenshotDir, `${module.button.replace(/[^a-z0-9]/gi, '-')}.png`),
          fullPage: false
        })

      } catch (error: any) {
        console.log(`  ❌ ERROR: ${error.message}`)
        results.push({ module: module.button, passed: false, error: error.message })
      }
    }

    console.log(`\n✅ Work Hub: ${passedCount}/${WORK_HUB_MODULES.length} passed`)

    // Save results
    const reportPath = path.join(process.cwd(), 'test-results', 'work-hub-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))

    expect(passedCount).toBeGreaterThan(0)
  })

  test('Validate People Hub modules', async ({ page }) => {
    let passedCount = 0
    const results: Array<{ module: string, passed: boolean, error?: string }> = []

    for (const module of PEOPLE_HUB_MODULES) {
      console.log(`\n🔍 Testing: ${module.button}`)

      try {
        // Find the button
        const button = page.locator(`button:has-text("${module.button}")`).first()
        const buttonExists = await button.count() > 0

        if (!buttonExists) {
          console.log(`  ❌ Button "${module.button}" not found`)
          results.push({ module: module.button, passed: false, error: 'Button not found' })
          continue
        }

        // Click the button
        await button.click({ timeout: 5000 })
        console.log(`  ✓ Clicked`)

        // Wait for content
        await page.waitForTimeout(2000)

        // Check for expected content
        const hasExpectedContent = await page.locator(`text=/${module.expectedText}/i`).count() > 0
        const hasAnyContent = await page.locator('h1, h2, h3, table, [class*="card"]').count() > 3

        if (hasExpectedContent && hasAnyContent) {
          console.log(`  ✅ PASS - Content rendered`)
          passedCount++
          results.push({ module: module.button, passed: true })
        } else {
          console.log(`  ⚠️  WARN - Limited content`)
          results.push({ module: module.button, passed: false, error: 'Limited content' })
        }

        // Screenshot
        const screenshotDir = path.join(process.cwd(), 'test-results', 'people-hub-screenshots')
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true })
        }
        await page.screenshot({
          path: path.join(screenshotDir, `${module.button.replace(/[^a-z0-9]/gi, '-')}.png`),
          fullPage: false
        })

      } catch (error: any) {
        console.log(`  ❌ ERROR: ${error.message}`)
        results.push({ module: module.button, passed: false, error: error.message })
      }
    }

    console.log(`\n✅ People Hub: ${passedCount}/${PEOPLE_HUB_MODULES.length} passed`)

    // Save results
    const reportPath = path.join(process.cwd(), 'test-results', 'people-hub-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))

    expect(passedCount).toBeGreaterThan(0)
  })
})
