import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * QUICK WORK HUB & PEOPLE HUB VALIDATION
 * Simplified validation focused on rapid module testing
 */

interface ModuleResult {
  name: string
  hub: string
  passed: boolean
  issues: string[]
  screenshot: string
}

const results: ModuleResult[] = []

// Combined module list for streamlined testing
const MODULES_TO_TEST = [
  // Work Hub
  { id: 'task-management', name: 'Task Management', hub: 'Work Hub' },
  { id: 'maintenance-scheduling', name: 'Maintenance Scheduling', hub: 'Work Hub' },
  { id: 'routes', name: 'Route Management', hub: 'Work Hub' },
  { id: 'route-optimization', name: 'Advanced Route Optimization', hub: 'Work Hub' },
  { id: 'maintenance-request', name: 'Maintenance Request', hub: 'Work Hub' },
  { id: 'garage', name: 'Garage & Service', hub: 'Work Hub' },
  // People Hub
  { id: 'people', name: 'People Management', hub: 'People Hub' },
  { id: 'driver-mgmt', name: 'Driver Performance', hub: 'People Hub' },
  { id: 'driver-scorecard', name: 'Driver Scorecard', hub: 'People Hub' },
]

async function quickValidate(page: Page, moduleId: string, moduleName: string, hub: string): Promise<ModuleResult> {
  const result: ModuleResult = {
    name: moduleName,
    hub,
    passed: false,
    issues: [],
    screenshot: ''
  }

  console.log(`\nTesting [${hub}] ${moduleName}...`)

  try {
    // Find and click module button
    const button = page.locator(`button:has-text("${moduleName}")`).first()
    const exists = await button.count() > 0

    if (!exists) {
      result.issues.push('Module button not found in sidebar')
      console.log(`  ❌ Button not found`)
      return result
    }

    await button.click({ timeout: 5000 })
    console.log(`  ✓ Clicked button`)

    // Wait for content to appear
    await page.waitForTimeout(2000)

    // Quick checks
    const hasHeading = await page.locator('h1, h2, h3').count() > 0
    const hasContent = await page.locator('button, table, input, [class*="card"]').count() > 3

    if (!hasHeading) {
      result.issues.push('No headings found')
    }

    if (!hasContent) {
      result.issues.push('No content rendered')
    }

    // Check for error messages
    const hasError = await page.locator('text=/error|failed|oops/i').count() > 0
    if (hasError) {
      result.issues.push('Error message visible')
    }

    // Capture screenshot
    const screenshotDir = path.join(process.cwd(), 'test-results', 'hub-screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
    result.screenshot = path.join(screenshotDir, `${hub.replace(' ', '-')}-${moduleId}.png`)
    await page.screenshot({ path: result.screenshot, fullPage: false })

    // Determine pass/fail
    result.passed = hasHeading && hasContent && !hasError
    console.log(`  ${result.passed ? '✅ PASS' : '❌ FAIL'} - Issues: ${result.issues.join(', ') || 'None'}`)

  } catch (error: any) {
    result.issues.push(`Error: ${error.message}`)
    console.log(`  ❌ Exception: ${error.message}`)
  }

  results.push(result)
  return result
}

function generateQuickReport() {
  const reportDir = path.join(process.cwd(), 'test-results')
  const workHub = results.filter(r => r.hub === 'Work Hub')
  const peopleHub = results.filter(r => r.hub === 'People Hub')
  const totalPassed = results.filter(r => r.passed).length
  const passRate = results.length > 0 ? ((totalPassed / results.length) * 100).toFixed(1) : '0'

  let report = `# Work Hub & People Hub Validation Report

## Summary
- Total Modules: ${results.length}
- Passed: ${totalPassed}
- Failed: ${results.length - totalPassed}
- Pass Rate: ${passRate}%

## Work Hub Results (${workHub.filter(r => r.passed).length}/${workHub.length} passed)

`

  workHub.forEach(r => {
    report += `### ${r.passed ? '✅' : '❌'} ${r.name}\n`
    if (r.issues.length > 0) {
      report += `Issues: ${r.issues.join(', ')}\n`
    }
    report += `Screenshot: ${path.basename(r.screenshot)}\n\n`
  })

  report += `## People Hub Results (${peopleHub.filter(r => r.passed).length}/${peopleHub.length} passed)

`

  peopleHub.forEach(r => {
    report += `### ${r.passed ? '✅' : '❌'} ${r.name}\n`
    if (r.issues.length > 0) {
      report += `Issues: ${r.issues.join(', ')}\n`
    }
    report += `Screenshot: ${path.basename(r.screenshot)}\n\n`
  })

  const reportPath = path.join(reportDir, 'hub-validation-quick-report.md')
  fs.writeFileSync(reportPath, report)
  console.log(`\n📊 Report saved: ${reportPath}\n`)

  return report
}

test.describe('Quick Hub Validation', () => {
  test('Validate all Work and People Hub modules', async ({ page }) => {
    // Navigate to app once
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Ensure sidebar is visible
    const sidebar = page.locator('aside')
    const sidebarVisible = await sidebar.isVisible()
    if (!sidebarVisible) {
      const menuButton = page.locator('button').filter({ hasText: /menu|list/i }).first()
      if (await menuButton.count() > 0) {
        await menuButton.click()
      }
    }

    // Test each module
    for (const module of MODULES_TO_TEST) {
      await quickValidate(page, module.id, module.name, module.hub)
      await page.waitForTimeout(500) // Brief pause between modules
    }

    // Generate report
    const report = generateQuickReport()
    console.log('\n' + '='.repeat(80))
    console.log(report)
    console.log('='.repeat(80) + '\n')

    // Assert minimum pass rate
    const passed = results.filter(r => r.passed).length
    const passRate = (passed / results.length) * 100

    expect(passRate, `Pass rate should be at least 70% (got ${passRate.toFixed(1)}%)`).toBeGreaterThanOrEqual(70)
  })
})
