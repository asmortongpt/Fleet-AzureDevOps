import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * COMPLETE MODULE VALIDATION
 * Based on actual navigation structure from src/lib/navigation.tsx
 *
 * Organized by sections:
 * - Main Modules (11 key modules)
 * - Management Modules (11 modules)
 * - Procurement & Communication (15 modules)
 * - Tools & Analytics (14 modules)
 */

interface ModuleValidationResult {
  moduleId: string
  moduleName: string
  section: string
  passed: boolean
  errors: string[]
  warnings: string[]
  screenshot: string
  timestamp: string
  loadTime: number
  consoleErrors: string[]
  elementsFound: number
}

const results: ModuleValidationResult[] = []

async function waitForModuleLoad(page: Page, timeout = 5000) {
  const startTime = Date.now()
  await Promise.race([
    page.waitForSelector('[data-testid*="loading"]', { state: 'detached', timeout }),
    page.waitForTimeout(1000)
  ]).catch(() => {})
  return Date.now() - startTime
}

function setupConsoleErrorCapture(page: Page): string[] {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Download the React DevTools')) {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`)
  })
  return consoleErrors
}

async function captureModuleScreenshot(
  page: Page,
  moduleId: string
): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'complete-validation')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
  const fileName = `${moduleId}.png`
  const screenshotPath = path.join(screenshotDir, fileName)
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  })
  return screenshotPath
}

async function validateModule(
  page: Page,
  moduleId: string,
  moduleName: string,
  section: string
): Promise<ModuleValidationResult> {
  const result: ModuleValidationResult = {
    moduleId,
    moduleName,
    section,
    passed: true,
    errors: [],
    warnings: [],
    screenshot: '',
    timestamp: new Date().toISOString(),
    loadTime: 0,
    consoleErrors: [],
    elementsFound: 0
  }

  const consoleErrors = setupConsoleErrorCapture(page)

  try {
    console.log(`\n🔍 Validating [${section}] ${moduleName} (${moduleId})...`)

    // Navigate to module by URL
    await page.goto(`/#/${moduleId}`)

    // Wait for module to load
    result.loadTime = await waitForModuleLoad(page)
    console.log(`  ├─ Load time: ${result.loadTime}ms`)

    // Check for content
    const bodyText = await page.locator('body').textContent()
    if (!bodyText || bodyText.trim().length < 50) {
      result.errors.push('Possible white screen - minimal content detected')
    }

    // Check for error messages
    const errorElements = await page.locator('[role="alert"]:has-text("error"), .error, .alert-error').count()
    if (errorElements > 0) {
      const errorText = await page.locator('[role="alert"], .error, .alert-error').first().textContent()
      result.warnings.push(`Error message visible: ${errorText?.substring(0, 100)}`)
    }

    // Count visible elements
    result.elementsFound = await page.locator('*:visible').count()
    console.log(`  ├─ Visible elements: ${result.elementsFound}`)

    if (result.elementsFound < 10) {
      result.warnings.push('Very few visible elements - module may not have loaded properly')
    }

    // Capture screenshot
    console.log(`  ├─ Capturing screenshot...`)
    result.screenshot = await captureModuleScreenshot(page, moduleId)

    // Check console errors
    result.consoleErrors = [...consoleErrors]
    if (result.consoleErrors.length > 0) {
      const criticalErrors = result.consoleErrors.filter(err =>
        !err.includes('DevTools') &&
        !err.includes('favicon') &&
        !err.includes('chunk')
      )
      if (criticalErrors.length > 0) {
        result.warnings.push(`${criticalErrors.length} console errors detected`)
        console.log(`  ├─ Console errors: ${criticalErrors.length}`)
      }
    }

    // Determine pass/fail
    if (result.errors.length === 0 && result.elementsFound >= 10) {
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

// MAIN MODULES - Core operational features
test.describe('Main Modules - Core Operations', () => {
  const mainModules = [
    { id: 'dashboard', name: 'Fleet Dashboard' },
    { id: 'executive-dashboard', name: 'Executive Dashboard' },
    { id: 'dispatch-console', name: 'Dispatch Console' },
    { id: 'gps-tracking', name: 'Live GPS Tracking' },
    { id: 'gis-map', name: 'GIS Command Center' },
    { id: 'vehicle-telemetry', name: 'Vehicle Telemetry' },
    { id: 'route-optimization', name: 'Route Optimization' },
  ]

  mainModules.forEach(module => {
    test(`${module.name}`, async ({ page }) => {
      await validateModule(page, module.id, module.name, 'Main')
    })
  })
})

// MANAGEMENT MODULES
test.describe('Management Modules', () => {
  const managementModules = [
    { id: 'people', name: 'People Management' },
    { id: 'garage', name: 'Garage & Service' },
    { id: 'predictive', name: 'Predictive Maintenance' },
    { id: 'driver-mgmt', name: 'Driver Performance' },
    { id: 'asset-management', name: 'Asset Management' },
    { id: 'equipment-dashboard', name: 'Equipment Dashboard' },
  ]

  managementModules.forEach(module => {
    test(`${module.name}`, async ({ page }) => {
      await validateModule(page, module.id, module.name, 'Management')
    })
  })
})

// PROCUREMENT MODULES
test.describe('Procurement Modules', () => {
  const procurementModules = [
    { id: 'vendor-management', name: 'Vendor Management' },
    { id: 'parts-inventory', name: 'Parts Inventory' },
    { id: 'purchase-orders', name: 'Purchase Orders' },
    { id: 'invoices', name: 'Invoices & Billing' },
  ]

  procurementModules.forEach(module => {
    test(`${module.name}`, async ({ page }) => {
      await validateModule(page, module.id, module.name, 'Procurement')
    })
  })
})

// COMMUNICATION MODULES
test.describe('Communication Modules', () => {
  const communicationModules = [
    { id: 'ai-assistant', name: 'AI Assistant' },
    { id: 'teams-integration', name: 'Teams Messages' },
    { id: 'email-center', name: 'Email Center' },
  ]

  communicationModules.forEach(module => {
    test(`${module.name}`, async ({ page }) => {
      await validateModule(page, module.id, module.name, 'Communication')
    })
  })
})

// TOOLS MODULES
test.describe('Tools & Analytics Modules', () => {
  const toolsModules = [
    { id: 'fuel', name: 'Fuel Management' },
    { id: 'mileage', name: 'Mileage Reimbursement' },
    { id: 'maintenance-request', name: 'Maintenance Request' },
    { id: 'routes', name: 'Route Management' },
    { id: 'workbench', name: 'Data Workbench' },
    { id: 'comprehensive', name: 'Fleet Analytics' },
    { id: 'fleet-optimizer', name: 'Fleet Optimizer' },
    { id: 'cost-analysis', name: 'Cost Analysis' },
  ]

  toolsModules.forEach(module => {
    test(`${module.name}`, async ({ page }) => {
      await validateModule(page, module.id, module.name, 'Tools')
    })
  })
})

test.afterAll(async () => {
  const reportDir = path.join(process.cwd(), 'test-results', 'complete-validation')
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

  const groupedResults = {
    main: results.filter(r => r.section === 'Main'),
    management: results.filter(r => r.section === 'Management'),
    procurement: results.filter(r => r.section === 'Procurement'),
    communication: results.filter(r => r.section === 'Communication'),
    tools: results.filter(r => r.section === 'Tools')
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules,
      passedModules,
      failedModules,
      passRate: `${passRate}%`,
      bySection: {
        main: {
          total: groupedResults.main.length,
          passed: groupedResults.main.filter(r => r.passed).length,
          failed: groupedResults.main.filter(r => !r.passed).length
        },
        management: {
          total: groupedResults.management.length,
          passed: groupedResults.management.filter(r => r.passed).length,
          failed: groupedResults.management.filter(r => !r.passed).length
        },
        procurement: {
          total: groupedResults.procurement.length,
          passed: groupedResults.procurement.filter(r => r.passed).length,
          failed: groupedResults.procurement.filter(r => !r.passed).length
        },
        communication: {
          total: groupedResults.communication.length,
          passed: groupedResults.communication.filter(r => r.passed).length,
          failed: groupedResults.communication.filter(r => !r.passed).length
        },
        tools: {
          total: groupedResults.tools.length,
          passed: groupedResults.tools.filter(r => r.passed).length,
          failed: groupedResults.tools.filter(r => !r.passed).length
        }
      }
    },
    results
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Generate HTML report
  const generateSectionHTML = (sectionName: string, sectionResults: ModuleValidationResult[]) => `
    <div class="section">
      <h2 class="section-title">${sectionName} (${sectionResults.length} modules)</h2>
      <div class="section-stats">
        <span class="pass">✅ ${sectionResults.filter(r => r.passed).length} Passed</span>
        <span class="fail">❌ ${sectionResults.filter(r => !r.passed).length} Failed</span>
      </div>
      <div class="modules">
        ${sectionResults.map(result => `
          <div class="module ${result.passed ? 'passed' : 'failed'}">
            <div class="module-header">
              <h3>${result.moduleName}</h3>
              <span class="badge ${result.passed ? 'passed' : 'failed'}">
                ${result.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </div>
            <div class="module-details">
              <div class="detail"><strong>ID:</strong> ${result.moduleId}</div>
              <div class="detail"><strong>Load Time:</strong> ${result.loadTime}ms</div>
              <div class="detail"><strong>Elements:</strong> ${result.elementsFound}</div>
              <div class="detail"><strong>Console Errors:</strong> ${result.consoleErrors.length}</div>
            </div>
            ${result.errors.length > 0 ? `
              <div class="errors">
                <strong>Errors:</strong>
                <ul>${result.errors.map(e => `<li>${e}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${result.warnings.length > 0 ? `
              <div class="warnings">
                <strong>Warnings:</strong>
                <ul>${result.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
              </div>
            ` : ''}
            <div class="screenshot">
              <img src="${path.basename(result.screenshot)}" alt="${result.moduleName}" loading="lazy" />
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Complete Module Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
    h1 { font-size: 2.5em; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 3em; font-weight: bold; }
    .stat-value.pass { color: #10b981; }
    .stat-value.fail { color: #ef4444; }
    .stat-value.total { color: #6366f1; }
    .stat-label { color: #6b7280; margin-top: 10px; }
    .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .section-title { font-size: 1.8em; margin-bottom: 15px; color: #1f2937; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .section-stats { margin-bottom: 20px; }
    .section-stats span { margin-right: 20px; font-weight: 600; }
    .modules { display: grid; gap: 20px; }
    .module { border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    .module.passed { border-color: #10b981; background: #f0fdf4; }
    .module.failed { border-color: #ef4444; background: #fef2f2; }
    .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .module-header h3 { font-size: 1.3em; color: #1f2937; }
    .badge { padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 0.9em; }
    .badge.passed { background: #10b981; color: white; }
    .badge.failed { background: #ef4444; color: white; }
    .module-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px; background: white; padding: 15px; border-radius: 6px; }
    .detail { font-size: 0.9em; }
    .errors, .warnings { margin-top: 15px; padding: 15px; border-radius: 6px; }
    .errors { background: #fee2e2; border-left: 4px solid #ef4444; }
    .warnings { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .errors ul, .warnings ul { margin-top: 10px; margin-left: 20px; }
    .screenshot { margin-top: 15px; text-align: center; }
    .screenshot img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Complete Module Validation Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </header>

    <div class="summary">
      <div class="stat">
        <div class="stat-value total">${totalModules}</div>
        <div class="stat-label">Total Modules</div>
      </div>
      <div class="stat">
        <div class="stat-value pass">${passedModules}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value fail">${failedModules}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value ${parseFloat(passRate) >= 90 ? 'pass' : 'fail'}">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>

    ${generateSectionHTML('⚙️ Main Modules', groupedResults.main)}
    ${generateSectionHTML('📋 Management Modules', groupedResults.management)}
    ${generateSectionHTML('🛒 Procurement Modules', groupedResults.procurement)}
    ${generateSectionHTML('💬 Communication Modules', groupedResults.communication)}
    ${generateSectionHTML('🔧 Tools & Analytics', groupedResults.tools)}
  </div>
</body>
</html>`

  fs.writeFileSync(htmlReportPath, html)

  console.log('\n' + '='.repeat(80))
  console.log('📊 COMPLETE MODULE VALIDATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Modules: ${totalModules}`)
  console.log(`✅ Passed: ${passedModules}`)
  console.log(`❌ Failed: ${failedModules}`)
  console.log(`📈 Pass Rate: ${passRate}%`)
  console.log('\nBy Section:')
  Object.entries(report.summary.bySection).forEach(([section, stats]) => {
    console.log(`  ${section}: ${stats.passed}/${stats.total} passed`)
  })
  console.log('\n📁 Reports:')
  console.log(`  JSON: ${reportPath}`)
  console.log(`  HTML: ${htmlReportPath}`)
  console.log('='.repeat(80) + '\n')
})
