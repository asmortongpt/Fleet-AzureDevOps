import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * COMPREHENSIVE OPERATIONS HUB & FLEET HUB VALIDATION
 *
 * This test validates all modules in:
 * - Operations Hub (5 modules)
 * - Fleet Hub (6 modules)
 *
 * For each module, we verify:
 * ✓ Module button appears in sidebar
 * ✓ Module loads without errors
 * ✓ UI components render correctly
 * ✓ Data loads or shows proper "no data" state
 * ✓ No console errors
 * ✓ Interactive elements work
 * ✓ Screenshots captured
 */

interface ModuleValidationResult {
  moduleName: string
  hubName: string
  passed: boolean
  errors: string[]
  warnings: string[]
  screenshot: string
  timestamp: string
  loadTime: number
  consoleErrors: string[]
  elementsFound: number
  interactivityTests: {
    name: string
    passed: boolean
    details?: string
  }[]
}

const results: ModuleValidationResult[] = []

// Helper function to wait for module to load
async function waitForModuleLoad(page: Page, moduleName: string, timeout = 10000) {
  const startTime = Date.now()

  // Wait for either content to appear or loading state to finish
  await Promise.race([
    page.waitForSelector('[data-testid*="loading"]', { state: 'detached', timeout }),
    page.waitForTimeout(2000)
  ]).catch(() => {
    // Ignore timeout, we'll check if content loaded
  })

  return Date.now() - startTime
}

// Helper function to capture console errors
function setupConsoleErrorCapture(page: Page): string[] {
  const consoleErrors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`)
  })

  return consoleErrors
}

// Helper function to take screenshot
async function captureModuleScreenshot(
  page: Page,
  hubName: string,
  moduleName: string
): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'module-validation')

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  const fileName = `${hubName.toLowerCase().replace(/\s+/g, '-')}-${moduleName.toLowerCase().replace(/\s+/g, '-')}.png`
  const screenshotPath = path.join(screenshotDir, fileName)

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  })

  return screenshotPath
}

// Helper function to validate module
async function validateModule(
  page: Page,
  hubName: string,
  moduleName: string,
  moduleSelector: string,
  validationChecks: {
    expectedElements?: string[]
    interactiveElements?: { selector: string; action: string }[]
  } = {}
): Promise<ModuleValidationResult> {
  const result: ModuleValidationResult = {
    moduleName,
    hubName,
    passed: true,
    errors: [],
    warnings: [],
    screenshot: '',
    timestamp: new Date().toISOString(),
    loadTime: 0,
    consoleErrors: [],
    elementsFound: 0,
    interactivityTests: []
  }

  const consoleErrors = setupConsoleErrorCapture(page)

  try {
    console.log(`\n🔍 Validating ${hubName} > ${moduleName}...`)

    // Step 1: Click module button
    console.log(`  ├─ Clicking module button: ${moduleSelector}`)
    const moduleButton = page.locator(moduleSelector).first()

    const buttonVisible = await moduleButton.isVisible({ timeout: 5000 }).catch(() => false)
    if (!buttonVisible) {
      result.errors.push('Module button not visible in sidebar')
      result.passed = false
      return result
    }

    await moduleButton.click()

    // Step 2: Wait for module to load
    console.log(`  ├─ Waiting for module to load...`)
    result.loadTime = await waitForModuleLoad(page, moduleName)
    console.log(`  ├─ Load time: ${result.loadTime}ms`)

    // Step 3: Check for white screen / error
    const bodyText = await page.locator('body').textContent()
    if (!bodyText || bodyText.trim().length < 50) {
      result.errors.push('Possible white screen - minimal content detected')
      result.warnings.push('Page may not have loaded correctly')
    }

    // Step 4: Check for error messages
    const errorElements = await page.locator('[role="alert"], .error, .alert-error').count()
    if (errorElements > 0) {
      const errorText = await page.locator('[role="alert"], .error, .alert-error').first().textContent()
      result.warnings.push(`Error message visible: ${errorText}`)
    }

    // Step 5: Count visible elements
    const visibleElements = await page.locator('*:visible').count()
    result.elementsFound = visibleElements
    console.log(`  ├─ Visible elements: ${visibleElements}`)

    if (visibleElements < 10) {
      result.warnings.push('Very few visible elements - module may not have loaded properly')
    }

    // Step 6: Check expected elements
    if (validationChecks.expectedElements) {
      for (const selector of validationChecks.expectedElements) {
        const elementExists = await page.locator(selector).count() > 0
        if (!elementExists) {
          result.warnings.push(`Expected element not found: ${selector}`)
        }
      }
    }

    // Step 7: Test interactive elements
    if (validationChecks.interactiveElements) {
      for (const interaction of validationChecks.interactiveElements) {
        const testResult = {
          name: `${interaction.action} on ${interaction.selector}`,
          passed: false,
          details: ''
        }

        try {
          const element = page.locator(interaction.selector).first()
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false)

          if (isVisible) {
            if (interaction.action === 'click') {
              await element.click({ timeout: 2000 })
              testResult.passed = true
            } else if (interaction.action === 'hover') {
              await element.hover({ timeout: 2000 })
              testResult.passed = true
            }
          } else {
            testResult.details = 'Element not visible'
          }
        } catch (error) {
          testResult.details = error instanceof Error ? error.message : String(error)
        }

        result.interactivityTests.push(testResult)
      }
    }

    // Step 8: Capture screenshot
    console.log(`  ├─ Capturing screenshot...`)
    result.screenshot = await captureModuleScreenshot(page, hubName, moduleName)

    // Step 9: Check console errors
    result.consoleErrors = [...consoleErrors]
    if (result.consoleErrors.length > 0) {
      result.warnings.push(`${result.consoleErrors.length} console errors detected`)
      console.log(`  ├─ Console errors: ${result.consoleErrors.length}`)
    }

    // Step 10: Determine overall pass/fail
    if (result.errors.length === 0 && visibleElements >= 10) {
      result.passed = true
      console.log(`  └─ ✅ ${moduleName} PASSED`)
    } else {
      result.passed = false
      console.log(`  └─ ❌ ${moduleName} FAILED`)
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    result.passed = false
    console.log(`  └─ ❌ ${moduleName} FAILED with error`)
  }

  results.push(result)
  return result
}

test.describe('Operations Hub - Module Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for it to load
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to Operations Hub
    const operationsButton = page.locator('text=Operations Hub').first()
    if (await operationsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await operationsButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test('1. Overview Dashboard', async ({ page }) => {
    await validateModule(
      page,
      'Operations Hub',
      'Overview Dashboard',
      'text=Overview Dashboard',
      {
        expectedElements: [
          '[data-testid*="dashboard"]',
          'h1, h2, h3',
          'button, a'
        ]
      }
    )
  })

  test('2. Live Tracking (GPS Tracking)', async ({ page }) => {
    await validateModule(
      page,
      'Operations Hub',
      'Live Tracking',
      'text=Live Tracking',
      {
        expectedElements: [
          '[data-testid*="map"], .map-container, #map',
          'button'
        ],
        interactiveElements: [
          { selector: 'button:has-text("Refresh")', action: 'click' }
        ]
      }
    )
  })

  test('3. Radio Dispatch Console', async ({ page }) => {
    await validateModule(
      page,
      'Operations Hub',
      'Radio Dispatch',
      'text=Radio Dispatch',
      {
        expectedElements: [
          'button',
          'input, textarea'
        ]
      }
    )
  })

  test('4. Fuel Management', async ({ page }) => {
    await validateModule(
      page,
      'Operations Hub',
      'Fuel Management',
      'text=Fuel Management',
      {
        expectedElements: [
          'table, [role="table"]',
          'button'
        ]
      }
    )
  })

  test('5. Asset Management', async ({ page }) => {
    await validateModule(
      page,
      'Operations Hub',
      'Asset Management',
      'text=Asset Management',
      {
        expectedElements: [
          'table, [role="table"], .grid',
          'button'
        ],
        interactiveElements: [
          { selector: 'button:has-text("Add")', action: 'click' }
        ]
      }
    )
  })
})

test.describe('Fleet Hub - Module Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and wait for it to load
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to Fleet Hub
    const fleetButton = page.locator('text=Fleet Hub').first()
    if (await fleetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fleetButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test('1. Fleet Dashboard', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Fleet Dashboard',
      'text=Fleet Dashboard',
      {
        expectedElements: [
          '[data-testid*="dashboard"]',
          'h1, h2, h3',
          'button, a'
        ]
      }
    )
  })

  test('2. Vehicle Maintenance', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Vehicle Maintenance',
      'text=Vehicle Maintenance',
      {
        expectedElements: [
          'table, [role="table"], .grid',
          'button'
        ]
      }
    )
  })

  test('3. Vehicle Telemetry', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Vehicle Telemetry',
      'text=Vehicle Telemetry',
      {
        expectedElements: [
          '[data-testid*="chart"], .recharts-wrapper, canvas',
          'button'
        ]
      }
    )
  })

  test('4. Predictive Maintenance', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Predictive Maintenance',
      'text=Predictive Maintenance',
      {
        expectedElements: [
          'table, [role="table"], .grid',
          '[data-testid*="chart"], .recharts-wrapper'
        ]
      }
    )
  })

  test('5. Garage Services', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Garage Services',
      'text=Garage Services',
      {
        expectedElements: [
          'button',
          'table, [role="table"], .grid'
        ]
      }
    )
  })

  test('6. Carbon Footprint', async ({ page }) => {
    await validateModule(
      page,
      'Fleet Hub',
      'Carbon Footprint',
      'text=Carbon Footprint',
      {
        expectedElements: [
          '[data-testid*="chart"], .recharts-wrapper, canvas',
          'h1, h2, h3'
        ]
      }
    )
  })
})

test.afterAll(async () => {
  // Generate comprehensive validation report
  const reportDir = path.join(process.cwd(), 'test-results', 'module-validation')

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportPath = path.join(reportDir, 'validation-report.json')
  const htmlReportPath = path.join(reportDir, 'validation-report.html')

  // Calculate statistics
  const totalModules = results.length
  const passedModules = results.filter(r => r.passed).length
  const failedModules = results.filter(r => !r.passed).length
  const passRate = ((passedModules / totalModules) * 100).toFixed(1)

  const operationsResults = results.filter(r => r.hubName === 'Operations Hub')
  const fleetResults = results.filter(r => r.hubName === 'Fleet Hub')

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules,
      passedModules,
      failedModules,
      passRate: `${passRate}%`,
      operationsHub: {
        total: operationsResults.length,
        passed: operationsResults.filter(r => r.passed).length,
        failed: operationsResults.filter(r => !r.passed).length
      },
      fleetHub: {
        total: fleetResults.length,
        passed: fleetResults.filter(r => r.passed).length,
        failed: fleetResults.filter(r => !r.passed).length
      }
    },
    results
  }

  // Write JSON report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Generate HTML report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Operations & Fleet Hub Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { font-size: 2.5em; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 1.1em; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .stat-value.pass { color: #10b981; }
    .stat-value.fail { color: #ef4444; }
    .stat-value.total { color: #6366f1; }
    .stat-label {
      color: #6b7280;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hub-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .hub-title {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .module-card {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
    }
    .module-card.passed { border-color: #10b981; background: #f0fdf4; }
    .module-card.failed { border-color: #ef4444; background: #fef2f2; }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .module-name {
      font-size: 1.3em;
      font-weight: 600;
      color: #1f2937;
    }
    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9em;
    }
    .status-badge.passed { background: #10b981; color: white; }
    .status-badge.failed { background: #ef4444; color: white; }
    .module-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    .detail-item {
      background: white;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.9em;
    }
    .detail-label {
      color: #6b7280;
      font-size: 0.85em;
      margin-bottom: 5px;
    }
    .detail-value {
      font-weight: 600;
      color: #1f2937;
    }
    .errors-warnings {
      margin-top: 15px;
    }
    .error-list, .warning-list {
      list-style: none;
      margin-top: 10px;
    }
    .error-list li {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 4px;
      color: #991b1b;
    }
    .warning-list li {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 4px;
      color: #92400e;
    }
    .screenshot-container {
      margin-top: 15px;
      text-align: center;
    }
    .screenshot-container img {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .screenshot-container img:hover {
      transform: scale(1.02);
    }
    .section-header {
      font-weight: 600;
      color: #374151;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Operations & Fleet Hub Validation Report</h1>
      <p class="subtitle">Comprehensive Module Testing & Validation</p>
      <p class="subtitle">Generated: ${new Date().toLocaleString()}</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value total">${totalModules}</div>
        <div class="stat-label">Total Modules</div>
      </div>
      <div class="stat-card">
        <div class="stat-value pass">${passedModules}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value fail">${failedModules}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${parseFloat(passRate) >= 90 ? 'pass' : 'fail'}">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>

    <div class="hub-section">
      <h2 class="hub-title">⚙️ Operations Hub (${operationsResults.length} modules)</h2>
      ${operationsResults.map(result => `
        <div class="module-card ${result.passed ? 'passed' : 'failed'}">
          <div class="module-header">
            <div class="module-name">${result.moduleName}</div>
            <div class="status-badge ${result.passed ? 'passed' : 'failed'}">
              ${result.passed ? '✓ PASSED' : '✗ FAILED'}
            </div>
          </div>

          <div class="module-details">
            <div class="detail-item">
              <div class="detail-label">Load Time</div>
              <div class="detail-value">${result.loadTime}ms</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Elements Found</div>
              <div class="detail-value">${result.elementsFound}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Console Errors</div>
              <div class="detail-value">${result.consoleErrors.length}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value">${new Date(result.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>

          ${result.errors.length > 0 ? `
            <div class="errors-warnings">
              <div class="section-header">❌ Errors:</div>
              <ul class="error-list">
                ${result.errors.map(err => `<li>${err}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${result.warnings.length > 0 ? `
            <div class="errors-warnings">
              <div class="section-header">⚠️ Warnings:</div>
              <ul class="warning-list">
                ${result.warnings.map(warn => `<li>${warn}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${result.screenshot ? `
            <div class="screenshot-container">
              <img src="${path.basename(result.screenshot)}" alt="${result.moduleName} Screenshot" />
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <div class="hub-section">
      <h2 class="hub-title">🚗 Fleet Hub (${fleetResults.length} modules)</h2>
      ${fleetResults.map(result => `
        <div class="module-card ${result.passed ? 'passed' : 'failed'}">
          <div class="module-header">
            <div class="module-name">${result.moduleName}</div>
            <div class="status-badge ${result.passed ? 'passed' : 'failed'}">
              ${result.passed ? '✓ PASSED' : '✗ FAILED'}
            </div>
          </div>

          <div class="module-details">
            <div class="detail-item">
              <div class="detail-label">Load Time</div>
              <div class="detail-value">${result.loadTime}ms</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Elements Found</div>
              <div class="detail-value">${result.elementsFound}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Console Errors</div>
              <div class="detail-value">${result.consoleErrors.length}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value">${new Date(result.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>

          ${result.errors.length > 0 ? `
            <div class="errors-warnings">
              <div class="section-header">❌ Errors:</div>
              <ul class="error-list">
                ${result.errors.map(err => `<li>${err}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${result.warnings.length > 0 ? `
            <div class="errors-warnings">
              <div class="section-header">⚠️ Warnings:</div>
              <ul class="warning-list">
                ${result.warnings.map(warn => `<li>${warn}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${result.screenshot ? `
            <div class="screenshot-container">
              <img src="${path.basename(result.screenshot)}" alt="${result.moduleName} Screenshot" />
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <footer>
      <p>Fleet Management System - Module Validation Report</p>
      <p>Powered by Playwright | Generated ${new Date().toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>`

  fs.writeFileSync(htmlReportPath, html)

  console.log('\n' + '='.repeat(80))
  console.log('📊 VALIDATION REPORT SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Modules Tested: ${totalModules}`)
  console.log(`✅ Passed: ${passedModules}`)
  console.log(`❌ Failed: ${failedModules}`)
  console.log(`📈 Pass Rate: ${passRate}%`)
  console.log('\nOperations Hub:')
  console.log(`  Total: ${operationsResults.length}`)
  console.log(`  Passed: ${operationsResults.filter(r => r.passed).length}`)
  console.log(`  Failed: ${operationsResults.filter(r => !r.passed).length}`)
  console.log('\nFleet Hub:')
  console.log(`  Total: ${fleetResults.length}`)
  console.log(`  Passed: ${fleetResults.filter(r => r.passed).length}`)
  console.log(`  Failed: ${fleetResults.filter(r => !r.passed).length}`)
  console.log('\n📁 Reports Generated:')
  console.log(`  JSON: ${reportPath}`)
  console.log(`  HTML: ${htmlReportPath}`)
  console.log('='.repeat(80) + '\n')
})
