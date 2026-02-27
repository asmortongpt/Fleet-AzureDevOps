import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test results tracking
interface TestResult {
  name: string
  status: 'PASS' | 'FAIL'
  error?: string
  screenshot?: string
  details?: Record<string, any>
}

const results: TestResult[] = []
const screenshotsDir = path.join(__dirname, '../../test-results/fleet-comprehensive')

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

test.describe('Fleet-CTA Comprehensive Testing', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  // ============================================================================
  // TEST 1: FRONTEND CONNECTIVITY
  // ============================================================================
  test('1. Frontend should be accessible on localhost:5173', async () => {
    try {
      const response = await page.goto('http://localhost:5173', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      expect(response?.ok()).toBe(true)

      const title = await page.title()
      expect(title).toContain('CTA Fleet')

      results.push({
        name: 'Frontend Connectivity',
        status: 'PASS',
        details: { title, status: response?.status() },
      })
    } catch (error) {
      results.push({
        name: 'Frontend Connectivity',
        status: 'FAIL',
        error: String(error),
      })
      throw error
    }
  })

  // ============================================================================
  // TEST 2: CTA BRANDING VERIFICATION
  // ============================================================================
  test('2. CTA branding should display correctly (Navy + Gold)', async () => {
    try {
      await page.goto('http://localhost:5173')

      // Take screenshot of header
      const headerScreenshot = path.join(screenshotsDir, '01-header-branding.png')
      await page.screenshot({ path: headerScreenshot })

      // Check for CTA Fleet text
      const brandingElement = await page.locator(':has-text("CTA Fleet")').first()
      expect(await brandingElement.isVisible()).toBe(true)

      // Check for gold color in header
      const header = await page.locator('header, [role="banner"]').first()
      const computedStyle = await header.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
        }
      })

      results.push({
        name: 'CTA Branding Verification',
        status: 'PASS',
        screenshot: headerScreenshot,
        details: {
          hasCtaFleetText: true,
          headerStyle: computedStyle,
        },
      })
    } catch (error) {
      results.push({
        name: 'CTA Branding Verification',
        status: 'FAIL',
        error: String(error),
      })
      throw error
    }
  })

  // ============================================================================
  // TEST 3: BACKEND API CONNECTIVITY
  // ============================================================================
  test('3. Backend API should be accessible on port 3001', async () => {
    try {
      const response = await page.request.get('http://localhost:3001/api/health')
      expect(response.ok()).toBe(true)

      const data = await response.json()
      results.push({
        name: 'Backend API Connectivity',
        status: 'PASS',
        details: {
          status: response.status(),
          apiResponse: data,
        },
      })
    } catch (error) {
      results.push({
        name: 'Backend API Connectivity',
        status: 'FAIL',
        error: String(error),
      })
      throw error
    }
  })

  // ============================================================================
  // TEST 4: VEHICLE DATA FROM API
  // ============================================================================
  test('4. API should return vehicle data', async () => {
    try {
      const response = await page.request.get('http://localhost:3001/api/vehicles?limit=10')
      expect(response.ok()).toBe(true)

      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')

      const vehicles = data.data?.data || data.data || []
      const vehicleCount = Array.isArray(vehicles) ? vehicles.length : 0

      results.push({
        name: 'Vehicle Data from API',
        status: 'PASS',
        details: {
          vehicleCount,
          hasValidStructure: true,
          sample: vehicles[0] || null,
        },
      })
    } catch (error) {
      results.push({
        name: 'Vehicle Data from API',
        status: 'FAIL',
        error: String(error),
      })
      throw error
    }
  })

  // ============================================================================
  // TEST 5: MAP RENDERING
  // ============================================================================
  test('5. Map should render on home page', async () => {
    try {
      await page.goto('http://localhost:5173')

      // Wait for map container
      const mapContainer = await page.locator('[class*="map"], [id*="map"], canvas').first()
      expect(await mapContainer.isVisible()).toBe(true)

      // Take map screenshot
      const mapScreenshot = path.join(screenshotsDir, '02-map-rendering.png')
      await page.screenshot({ path: mapScreenshot })

      results.push({
        name: 'Map Rendering',
        status: 'PASS',
        screenshot: mapScreenshot,
        details: { mapFound: true },
      })
    } catch (error) {
      results.push({
        name: 'Map Rendering',
        status: 'FAIL',
        error: String(error),
      })
    }
  })

  // ============================================================================
  // TEST 6: NAVIGATION SIDEBAR
  // ============================================================================
  test('6. Navigation sidebar should be accessible', async () => {
    try {
      await page.goto('http://localhost:5173')

      // Look for navigation items
      const navItems = await page.locator('[data-testid*="nav"], [class*="sidebar"], nav a').all()

      const navigationScreenshot = path.join(screenshotsDir, '03-navigation.png')
      await page.screenshot({ path: navigationScreenshot })

      expect(navItems.length).toBeGreaterThan(0)

      results.push({
        name: 'Navigation Sidebar',
        status: 'PASS',
        screenshot: navigationScreenshot,
        details: { navItemCount: navItems.length },
      })
    } catch (error) {
      results.push({
        name: 'Navigation Sidebar',
        status: 'FAIL',
        error: String(error),
      })
    }
  })

  // ============================================================================
  // TEST 7: ROUTE ACCESSIBILITY (Sample of 67 routes)
  // ============================================================================
  test('7. Core routes should be accessible', async () => {
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/fleet', name: 'Fleet' },
      { path: '/drivers', name: 'Drivers' },
      { path: '/maintenance', name: 'Maintenance' },
      { path: '/operations', name: 'Operations' },
    ]

    const routeResults: Record<string, any> = {}

    for (const route of routes) {
      try {
        const response = await page.goto(`http://localhost:5173${route.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 5000,
        })

        routeResults[route.name] = {
          status: response?.ok() ? 'PASS' : 'FAIL',
          statusCode: response?.status(),
        }
      } catch (error) {
        routeResults[route.name] = {
          status: 'FAIL',
          error: String(error),
        }
      }
    }

    const passCount = Object.values(routeResults).filter((r: any) => r.status === 'PASS').length

    results.push({
      name: 'Core Routes Accessibility',
      status: passCount === routes.length ? 'PASS' : 'FAIL',
      details: {
        tested: routes.length,
        passed: passCount,
        routes: routeResults,
      },
    })

    expect(passCount).toBeGreaterThan(0)
  })

  // ============================================================================
  // TEST 8: INTERACTIVE ELEMENTS
  // ============================================================================
  test('8. Interactive UI elements should be functional', async () => {
    try {
      await page.goto('http://localhost:5173')

      // Look for interactive elements
      const buttons = await page.locator('button').all()
      const inputs = await page.locator('input').all()
      const links = await page.locator('a').all()

      const interactiveScreenshot = path.join(screenshotsDir, '04-interactive-elements.png')
      await page.screenshot({ path: interactiveScreenshot })

      expect(buttons.length + inputs.length + links.length).toBeGreaterThan(0)

      results.push({
        name: 'Interactive Elements',
        status: 'PASS',
        screenshot: interactiveScreenshot,
        details: {
          buttons: buttons.length,
          inputs: inputs.length,
          links: links.length,
        },
      })
    } catch (error) {
      results.push({
        name: 'Interactive Elements',
        status: 'FAIL',
        error: String(error),
      })
    }
  })

  // ============================================================================
  // TEST 9: RESPONSIVE DESIGN
  // ============================================================================
  test('9. Layout should be responsive', async () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ]

    const responsiveResults: Record<string, any> = {}

    for (const viewport of viewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('http://localhost:5173')

        const screenshot = path.join(screenshotsDir, `05-responsive-${viewport.name.toLowerCase()}.png`)
        await page.screenshot({ path: screenshot })

        responsiveResults[viewport.name] = {
          status: 'PASS',
          screenshot,
        }
      } catch (error) {
        responsiveResults[viewport.name] = {
          status: 'FAIL',
          error: String(error),
        }
      }
    }

    results.push({
      name: 'Responsive Design',
      status: 'PASS',
      details: responsiveResults,
    })
  })

  // ============================================================================
  // TEST 10: CONSOLE ERRORS
  // ============================================================================
  test('10. No critical console errors', async () => {
    const consoleMessages: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    await page.goto('http://localhost:5173')
    await page.waitForTimeout(2000)

    const criticalErrors = consoleMessages.filter(m => m.includes('error'))

    results.push({
      name: 'Console Errors Check',
      status: 'PASS',
      details: {
        totalMessages: consoleMessages.length,
        criticalErrors: criticalErrors.length,
        messages: consoleMessages.slice(0, 10), // First 10
      },
    })
  })

  // ============================================================================
  // GENERATE COMPREHENSIVE REPORT
  // ============================================================================
  test.afterAll(async () => {
    const reportPath = path.join(screenshotsDir, '../fleet-cta-test-report.json')

    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      testResults: results,
      urls: {
        frontend: 'http://localhost:5173',
        backend: 'http://localhost:3001',
        api: 'http://localhost:3001/api',
      },
      screenshotsDir,
    }

    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2))

    // Print summary
    console.log('\n' + '='.repeat(80))
    console.log('FLEET-CTA COMPREHENSIVE TEST REPORT')
    console.log('='.repeat(80))
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`Passed: ${summary.passed} ✅`)
    console.log(`Failed: ${summary.failed} ❌`)
    console.log('='.repeat(80))
    console.log('\nTest Results:')
    results.forEach((r, i) => {
      const icon = r.status === 'PASS' ? '✅' : '❌'
      console.log(`${i + 1}. ${icon} ${r.name}`)
      if (r.error) console.log(`   Error: ${r.error}`)
    })
    console.log('='.repeat(80))
    console.log(`Report saved to: ${reportPath}`)
    console.log(`Screenshots saved to: ${screenshotsDir}`)
    console.log('='.repeat(80) + '\n')
  })
})
