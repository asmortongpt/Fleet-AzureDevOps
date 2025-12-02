import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * WORK HUB & PEOPLE HUB VALIDATION TEST
 * Agent 5: Complete validation of all Work and People Hub modules
 *
 * WORK HUB MODULES (6):
 * 1. Task Management
 * 2. Maintenance Scheduling
 * 3. Route Planning/Management
 * 4. Enhanced Tasks
 * 5. Maintenance Requests
 * 6. Work Orders (via Garage Service)
 *
 * PEOPLE HUB MODULES (6):
 * 1. People Management
 * 2. Driver Performance
 * 3. Driver Scorecard
 * 4. Mobile Employee Dashboard
 * 5. Mobile Manager View
 * 6. Training & Compliance (if available)
 */

interface ModuleValidationResult {
  moduleId: string
  moduleName: string
  hub: 'Work Hub' | 'People Hub'
  passed: boolean
  errors: string[]
  warnings: string[]
  screenshot: string
  timestamp: string
  loadTime: number
  consoleErrors: string[]
  elementsFound: number
  interactiveElementsWorking: boolean
  dataDisplayed: boolean
}

const results: ModuleValidationResult[] = []

// Work Hub Modules
const WORK_HUB_MODULES = [
  { id: 'task-management', name: 'Task Management' },
  { id: 'maintenance-scheduling', name: 'Maintenance Scheduling' },
  { id: 'routes', name: 'Route Management' },
  { id: 'route-optimization', name: 'Advanced Route Optimization' },
  { id: 'maintenance-request', name: 'Maintenance Request' },
  { id: 'garage', name: 'Garage & Service (Work Orders)' }
]

// People Hub Modules
const PEOPLE_HUB_MODULES = [
  { id: 'people', name: 'People Management' },
  { id: 'driver-mgmt', name: 'Driver Performance' },
  { id: 'driver-scorecard', name: 'Driver Scorecard' },
  // Note: Mobile dashboards may not be in navigation but should exist as components
]

async function waitForModuleLoad(page: Page, timeout = 8000) {
  const startTime = Date.now()
  await Promise.race([
    page.waitForSelector('[data-testid*="loading"]', { state: 'detached', timeout }),
    page.waitForTimeout(2000) // Give modules time to render
  ]).catch(() => {})

  // Additional wait for common UI elements
  await Promise.race([
    page.waitForSelector('h2, h1, [role="heading"]', { timeout: 3000 }),
    page.waitForTimeout(1000)
  ]).catch(() => {})

  return Date.now() - startTime
}

function setupConsoleErrorCapture(page: Page): string[] {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' &&
        !msg.text().includes('Download the React DevTools') &&
        !msg.text().includes('Lit is in dev mode')) {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}\n${error.stack || ''}`)
  })
  return consoleErrors
}

async function captureModuleScreenshot(
  page: Page,
  moduleId: string,
  hub: string
): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'work-people-hub-validation')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
  const fileName = `${hub.replace(' ', '-')}-${moduleId}.png`
  const screenshotPath = path.join(screenshotDir, fileName)
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  })
  return screenshotPath
}

async function checkForCriticalErrors(page: Page): Promise<string[]> {
  const criticalErrors: string[] = []

  // Check for white screen of death
  const bodyText = await page.evaluate(() => document.body.innerText)
  if (!bodyText || bodyText.trim().length < 20) {
    criticalErrors.push('CRITICAL: White screen - no content rendered')
  }

  // Check for React error boundaries
  const errorBoundary = await page.locator('text=/Something went wrong|Error|Oops/i').count()
  if (errorBoundary > 0) {
    const errorText = await page.locator('text=/Something went wrong|Error|Oops/i').first().textContent()
    criticalErrors.push(`Error Boundary Triggered: ${errorText}`)
  }

  // Check for null reference errors in console
  const consoleText = await page.evaluate(() => {
    // @ts-ignore - accessing console history
    return window.__consoleErrors || []
  }).catch(() => [])

  return criticalErrors
}

async function validateModule(
  page: Page,
  moduleId: string,
  moduleName: string,
  hub: 'Work Hub' | 'People Hub'
): Promise<ModuleValidationResult> {
  const result: ModuleValidationResult = {
    moduleId,
    moduleName,
    hub,
    passed: true,
    errors: [],
    warnings: [],
    screenshot: '',
    timestamp: new Date().toISOString(),
    loadTime: 0,
    consoleErrors: [],
    elementsFound: 0,
    interactiveElementsWorking: false,
    dataDisplayed: false
  }

  const consoleErrors = setupConsoleErrorCapture(page)

  try {
    console.log(`\n🔍 Validating [${hub}] ${moduleName} (${moduleId})...`)

    // Click the sidebar button for this module
    const sidebarButton = page.locator(`button:has-text("${moduleName}")`).first()
    const buttonExists = await sidebarButton.count() > 0

    if (!buttonExists) {
      result.errors.push(`❌ Module button not found in sidebar`)
      result.passed = false
      return result
    }

    await sidebarButton.click()
    console.log(`  ✅ Clicked module button`)

    // Wait for module to load
    result.loadTime = await waitForModuleLoad(page)
    console.log(`  ⏱️  Load time: ${result.loadTime}ms`)

    // Wait a bit more for dynamic content
    await page.waitForTimeout(1500)

    // Check for critical errors
    const criticalErrors = await checkForCriticalErrors(page)
    if (criticalErrors.length > 0) {
      result.errors.push(...criticalErrors)
      result.passed = false
    }

    // Capture screenshot
    result.screenshot = await captureModuleScreenshot(page, moduleId, hub)
    console.log(`  📸 Screenshot saved: ${result.screenshot}`)

    // Count visible elements
    const headings = await page.locator('h1, h2, h3, h4').count()
    const cards = await page.locator('[class*="card"], [class*="Card"]').count()
    const tables = await page.locator('table, [role="table"]').count()
    const buttons = await page.locator('button:visible').count()
    const inputs = await page.locator('input, textarea, select').count()

    result.elementsFound = headings + cards + tables + buttons + inputs
    console.log(`  📊 Elements found: ${result.elementsFound} (h:${headings}, cards:${cards}, tables:${tables}, btns:${buttons}, inputs:${inputs})`)

    if (result.elementsFound < 5) {
      result.warnings.push(`⚠️ Low element count (${result.elementsFound}) - possible rendering issue`)
    }

    // Check if module displays data or proper "no data" state
    const hasDataElements = await page.locator('table tbody tr, [class*="data"], [class*="list"]').count() > 0
    const hasNoDataMessage = await page.locator('text=/No .* found|No data|Empty|Add your first/i').count() > 0
    result.dataDisplayed = hasDataElements || hasNoDataMessage

    if (!result.dataDisplayed) {
      result.warnings.push('⚠️ No data elements or "no data" message found')
    } else {
      console.log(`  📋 Data display: ${hasDataElements ? 'Data shown' : 'No data message shown'}`)
    }

    // Test interactive elements
    try {
      // Try to find and hover over a button (don't click to avoid side effects)
      const firstButton = page.locator('button:visible').first()
      if (await firstButton.count() > 0) {
        await firstButton.hover({ timeout: 2000 })
        result.interactiveElementsWorking = true
        console.log(`  🖱️  Interactive elements: Working`)
      }
    } catch (e) {
      result.warnings.push('⚠️ Could not interact with buttons')
    }

    // Check for module-specific indicators
    if (moduleId.includes('task')) {
      const taskElements = await page.locator('text=/task|priority|status|assigned/i').count()
      console.log(`  📝 Task-related elements: ${taskElements}`)
      if (taskElements === 0) {
        result.warnings.push('⚠️ No task-specific content found')
      }
    }

    if (moduleId.includes('driver') || moduleId.includes('people')) {
      const peopleElements = await page.locator('text=/driver|employee|performance|score/i').count()
      console.log(`  👥 People-related elements: ${peopleElements}`)
      if (peopleElements === 0) {
        result.warnings.push('⚠️ No people-specific content found')
      }
    }

    if (moduleId.includes('maintenance') || moduleId.includes('garage')) {
      const maintenanceElements = await page.locator('text=/maintenance|service|repair|vehicle/i').count()
      console.log(`  🔧 Maintenance-related elements: ${maintenanceElements}`)
      if (maintenanceElements === 0) {
        result.warnings.push('⚠️ No maintenance-specific content found')
      }
    }

    if (moduleId.includes('route')) {
      const routeElements = await page.locator('text=/route|waypoint|optimize|distance|map/i').count()
      console.log(`  🗺️  Route-related elements: ${routeElements}`)
      if (routeElements === 0) {
        result.warnings.push('⚠️ No route-specific content found')
      }
    }

    // Capture console errors
    result.consoleErrors = [...consoleErrors]
    if (result.consoleErrors.length > 0) {
      console.log(`  ⚠️  Console errors: ${result.consoleErrors.length}`)
      result.consoleErrors.forEach(err => {
        console.log(`     - ${err.substring(0, 100)}`)
      })

      // Critical console errors fail the test
      const hasCriticalError = result.consoleErrors.some(err =>
        err.includes('undefined') ||
        err.includes('null') ||
        err.includes('TypeError') ||
        err.includes('is not a function')
      )

      if (hasCriticalError) {
        result.errors.push('❌ Critical console errors detected')
        result.passed = false
      } else {
        result.warnings.push('⚠️ Non-critical console warnings present')
      }
    }

    // Final pass/fail determination
    if (result.errors.length === 0 && result.elementsFound >= 5) {
      result.passed = true
      console.log(`  ✅ Module PASSED`)
    } else {
      result.passed = false
      console.log(`  ❌ Module FAILED`)
    }

  } catch (error: any) {
    result.passed = false
    result.errors.push(`Exception during validation: ${error.message}`)
    console.log(`  ❌ EXCEPTION: ${error.message}`)

    try {
      result.screenshot = await captureModuleScreenshot(page, moduleId, hub)
    } catch (screenshotError) {
      console.log(`  ⚠️  Could not capture screenshot`)
    }
  }

  results.push(result)
  return result
}

function generateValidationReport() {
  const reportDir = path.join(process.cwd(), 'test-results', 'work-people-hub-validation')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const workHubResults = results.filter(r => r.hub === 'Work Hub')
  const peopleHubResults = results.filter(r => r.hub === 'People Hub')

  const workHubPassed = workHubResults.filter(r => r.passed).length
  const peopleHubPassed = peopleHubResults.filter(r => r.passed).length

  const totalPassed = results.filter(r => r.passed).length
  const totalTests = results.length
  const passPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0'

  let report = `# Work Hub & People Hub Validation Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Modules Tested**: ${totalTests}
- **Passed**: ${totalPassed}
- **Failed**: ${totalTests - totalPassed}
- **Pass Rate**: ${passPercentage}%

### Work Hub (6 modules expected)
- **Tested**: ${workHubResults.length}
- **Passed**: ${workHubPassed}
- **Failed**: ${workHubResults.length - workHubPassed}
- **Pass Rate**: ${workHubResults.length > 0 ? ((workHubPassed / workHubResults.length) * 100).toFixed(1) : '0'}%

### People Hub (6 modules expected)
- **Tested**: ${peopleHubResults.length}
- **Passed**: ${peopleHubPassed}
- **Failed**: ${peopleHubResults.length - peopleHubPassed}
- **Pass Rate**: ${peopleHubResults.length > 0 ? ((peopleHubPassed / peopleHubResults.length) * 100).toFixed(1) : '0'}%

---

## Work Hub Module Results

`

  workHubResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    report += `\n### ${status} ${result.moduleName}\n`
    report += `- **Module ID**: ${result.moduleId}\n`
    report += `- **Load Time**: ${result.loadTime}ms\n`
    report += `- **Elements Found**: ${result.elementsFound}\n`
    report += `- **Interactive**: ${result.interactiveElementsWorking ? 'Yes' : 'No'}\n`
    report += `- **Data Displayed**: ${result.dataDisplayed ? 'Yes' : 'No'}\n`
    report += `- **Screenshot**: \`${path.basename(result.screenshot)}\`\n`

    if (result.errors.length > 0) {
      report += `\n**Errors:**\n`
      result.errors.forEach(err => report += `- ${err}\n`)
    }

    if (result.warnings.length > 0) {
      report += `\n**Warnings:**\n`
      result.warnings.forEach(warn => report += `- ${warn}\n`)
    }

    if (result.consoleErrors.length > 0) {
      report += `\n**Console Errors (${result.consoleErrors.length}):**\n`
      result.consoleErrors.slice(0, 5).forEach(err => {
        report += `\`\`\`\n${err.substring(0, 200)}\n\`\`\`\n`
      })
      if (result.consoleErrors.length > 5) {
        report += `\n... and ${result.consoleErrors.length - 5} more errors\n`
      }
    }

    report += `\n`
  })

  report += `\n---

## People Hub Module Results

`

  peopleHubResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    report += `\n### ${status} ${result.moduleName}\n`
    report += `- **Module ID**: ${result.moduleId}\n`
    report += `- **Load Time**: ${result.loadTime}ms\n`
    report += `- **Elements Found**: ${result.elementsFound}\n`
    report += `- **Interactive**: ${result.interactiveElementsWorking ? 'Yes' : 'No'}\n`
    report += `- **Data Displayed**: ${result.dataDisplayed ? 'Yes' : 'No'}\n`
    report += `- **Screenshot**: \`${path.basename(result.screenshot)}\`\n`

    if (result.errors.length > 0) {
      report += `\n**Errors:**\n`
      result.errors.forEach(err => report += `- ${err}\n`)
    }

    if (result.warnings.length > 0) {
      report += `\n**Warnings:**\n`
      result.warnings.forEach(warn => report += `- ${warn}\n`)
    }

    if (result.consoleErrors.length > 0) {
      report += `\n**Console Errors (${result.consoleErrors.length}):**\n`
      result.consoleErrors.slice(0, 5).forEach(err => {
        report += `\`\`\`\n${err.substring(0, 200)}\n\`\`\`\n`
      })
      if (result.consoleErrors.length > 5) {
        report += `\n... and ${result.consoleErrors.length - 5} more errors\n`
      }
    }

    report += `\n`
  })

  report += `\n---

## Critical Issues Found

`

  const criticalIssues = results.filter(r => !r.passed)
  if (criticalIssues.length === 0) {
    report += `✅ No critical issues found! All modules passed validation.\n`
  } else {
    criticalIssues.forEach(issue => {
      report += `\n### ❌ ${issue.moduleName} (${issue.hub})\n`
      issue.errors.forEach(err => report += `- ${err}\n`)
    })
  }

  report += `\n---

## Recommendations

`

  if (passPercentage === '100.0') {
    report += `🎉 **Excellent!** All modules passed validation. No immediate action required.\n`
  } else if (parseFloat(passPercentage) >= 80) {
    report += `✅ **Good!** Most modules are working. Focus on fixing the ${totalTests - totalPassed} failing module(s).\n`
  } else if (parseFloat(passPercentage) >= 50) {
    report += `⚠️ **Needs Attention!** Several modules have issues. Priority fixes needed.\n`
  } else {
    report += `🚨 **Critical!** Majority of modules failing. Immediate investigation required.\n`
  }

  // Common issues analysis
  const nullRefErrors = results.filter(r =>
    r.consoleErrors.some(e => e.includes('null') || e.includes('undefined'))
  ).length

  if (nullRefErrors > 0) {
    report += `\n- **${nullRefErrors} modules** have null/undefined reference errors - check FleetDashboard data prop handling\n`
  }

  const lowElementCount = results.filter(r => r.elementsFound < 5).length
  if (lowElementCount > 0) {
    report += `- **${lowElementCount} modules** have suspiciously low element counts - possible rendering failures\n`
  }

  report += `\n---

## Next Steps

1. Review failed modules and their error logs
2. Fix critical console errors (null references, TypeErrors)
3. Ensure all modules receive proper data props
4. Re-run validation after fixes
5. Check screenshots for visual confirmation

---

**Test Run**: ${new Date().toLocaleString()}
**Environment**: http://localhost:5173
**Agent**: Agent 5 - Work & People Hub Validator
`

  const reportPath = path.join(reportDir, 'validation-report.md')
  fs.writeFileSync(reportPath, report)

  // Also save JSON for programmatic access
  const jsonPath = path.join(reportDir, 'validation-results.json')
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2))

  console.log(`\n📊 Validation report saved to: ${reportPath}`)
  console.log(`📊 JSON results saved to: ${jsonPath}`)

  return report
}

test.describe('Work Hub & People Hub Validation', () => {
  test.setTimeout(300000) // 5 minute timeout for complete validation

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Ensure sidebar is open
    const sidebarOpen = await page.locator('aside').isVisible()
    if (!sidebarOpen) {
      await page.locator('button[title*="sidebar"]').click()
    }
  })

  test('Validate all Work Hub modules', async ({ page }) => {
    console.log('\n🏗️  STARTING WORK HUB VALIDATION\n')

    for (const module of WORK_HUB_MODULES) {
      await validateModule(page, module.id, module.name, 'Work Hub')
      // Small delay between modules
      await page.waitForTimeout(500)
    }

    const workHubResults = results.filter(r => r.hub === 'Work Hub')
    const passed = workHubResults.filter(r => r.passed).length

    console.log(`\n✅ Work Hub: ${passed}/${workHubResults.length} modules passed\n`)
  })

  test('Validate all People Hub modules', async ({ page }) => {
    console.log('\n👥 STARTING PEOPLE HUB VALIDATION\n')

    for (const module of PEOPLE_HUB_MODULES) {
      await validateModule(page, module.id, module.name, 'People Hub')
      // Small delay between modules
      await page.waitForTimeout(500)
    }

    const peopleHubResults = results.filter(r => r.hub === 'People Hub')
    const passed = peopleHubResults.filter(r => r.passed).length

    console.log(`\n✅ People Hub: ${passed}/${peopleHubResults.length} modules passed\n`)
  })

  test.afterAll(async () => {
    const report = generateValidationReport()
    console.log('\n' + '='.repeat(80))
    console.log(report)
    console.log('='.repeat(80) + '\n')

    // Assertion to fail the test if pass rate is below 80%
    const totalPassed = results.filter(r => r.passed).length
    const totalTests = results.length
    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

    expect(passRate, `Pass rate (${passRate.toFixed(1)}%) should be at least 80%`).toBeGreaterThanOrEqual(80)
  })
})
