/**
 * PDCA Full Module Verification Test Suite
 * Tests ALL management modules for 100% confidence
 */

import { test, expect } from '@playwright/test'

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://fleet.capitaltechalliance.com'

// All modules to test organized by category
const ALL_MODULES = {
  // Fleet Management
  fleet: [
    'people-management',
    'garage-service',
    'virtual-garage-3d',
    'predictive-maintenance',
    'driver-performance',
    'asset-management',
    'equipment-dashboard',
    'task-management',
    'incident-management',
    'alerts-notifications',
    'document-management',
    'document-qa'
  ],
  // Procurement
  procurement: [
    'vendor-management',
    'parts-inventory',
    'purchase-orders',
    'invoices-billing'
  ],
  // Communication
  communication: [
    'push-notifications',
    'ai-assistant',
    'teams-messages',
    'email-center',
    'maintenance-calendar',
    'receipt-processing',
    'communication-log',
    'osha-safety-forms',
    'policy-engine',
    'video-telematics',
    'ev-charging',
    'custom-form-builder'
  ],
  // Tools
  tools: [
    'arcgis-integration',
    'map-provider-settings',
    'mileage-reimbursement',
    'personal-use',
    'personal-use-policy',
    'reimbursement-queue',
    'charges-billing',
    'maintenance-request',
    'fuel-management',
    'route-management',
    'data-workbench',
    'fleet-analytics',
    'driver-scorecard',
    'fleet-optimizer',
    'cost-analysis',
    'fuel-purchasing',
    'custom-report-builder'
  ]
}

// Flatten all modules for testing
const flatModules = [
  ...ALL_MODULES.fleet,
  ...ALL_MODULES.procurement,
  ...ALL_MODULES.communication,
  ...ALL_MODULES.tools
]

test.describe('PDCA: Fleet Management Modules', () => {
  for (const module of ALL_MODULES.fleet) {
    test(`Fleet: ${module} loads without critical errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto(`${PRODUCTION_URL}?module=${module}`)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      // Check for critical JS errors
      const criticalErrors = errors.filter(e =>
        e.includes('toFixed') ||
        e.includes('Cannot read prop') ||
        e.includes('is not a function') ||
        e.includes('is not defined')
      )

      // Check for error boundary
      const errorBoundary = await page.locator('text=Something went wrong').count()

      console.log(`[${module}] JS errors: ${errors.length}, Critical: ${criticalErrors.length}, Error boundary: ${errorBoundary}`)

      expect(criticalErrors).toHaveLength(0)
      expect(errorBoundary).toBe(0)
    })
  }
})

test.describe('PDCA: Procurement Modules', () => {
  for (const module of ALL_MODULES.procurement) {
    test(`Procurement: ${module} loads without critical errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto(`${PRODUCTION_URL}?module=${module}`)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      const criticalErrors = errors.filter(e =>
        e.includes('toFixed') ||
        e.includes('Cannot read prop') ||
        e.includes('is not a function')
      )

      const errorBoundary = await page.locator('text=Something went wrong').count()

      console.log(`[${module}] JS errors: ${errors.length}, Critical: ${criticalErrors.length}, Error boundary: ${errorBoundary}`)

      expect(criticalErrors).toHaveLength(0)
      expect(errorBoundary).toBe(0)
    })
  }
})

test.describe('PDCA: Communication Modules', () => {
  for (const module of ALL_MODULES.communication) {
    test(`Communication: ${module} loads without critical errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto(`${PRODUCTION_URL}?module=${module}`)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      const criticalErrors = errors.filter(e =>
        e.includes('toFixed') ||
        e.includes('Cannot read prop') ||
        e.includes('is not a function')
      )

      const errorBoundary = await page.locator('text=Something went wrong').count()

      // Special check for AI Assistant - should NOT show "Coming Soon"
      if (module === 'ai-assistant') {
        const comingSoon = await page.locator('text=Coming Soon').count()
        expect(comingSoon).toBe(0)
      }

      console.log(`[${module}] JS errors: ${errors.length}, Critical: ${criticalErrors.length}, Error boundary: ${errorBoundary}`)

      expect(criticalErrors).toHaveLength(0)
      expect(errorBoundary).toBe(0)
    })
  }
})

test.describe('PDCA: Tools Modules', () => {
  for (const module of ALL_MODULES.tools) {
    test(`Tools: ${module} loads without critical errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))

      await page.goto(`${PRODUCTION_URL}?module=${module}`)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      const criticalErrors = errors.filter(e =>
        e.includes('toFixed') ||
        e.includes('Cannot read prop') ||
        e.includes('is not a function')
      )

      const errorBoundary = await page.locator('text=Something went wrong').count()

      console.log(`[${module}] JS errors: ${errors.length}, Critical: ${criticalErrors.length}, Error boundary: ${errorBoundary}`)

      expect(criticalErrors).toHaveLength(0)
      expect(errorBoundary).toBe(0)
    })
  }
})

// Final comprehensive check
test('PDCA FINAL: All Modules Summary', async ({ page }) => {
  const results: Record<string, { passed: boolean; error?: string }> = {}

  for (const module of flatModules) {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    try {
      await page.goto(`${PRODUCTION_URL}?module=${module}`, { timeout: 15000 })
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1500)

      const criticalErrors = errors.filter(e =>
        e.includes('toFixed') ||
        e.includes('Cannot read prop')
      )

      const errorBoundary = await page.locator('text=Something went wrong').count()

      results[module] = {
        passed: criticalErrors.length === 0 && errorBoundary === 0
      }

      if (!results[module].passed) {
        results[module].error = criticalErrors.join('; ') || 'Error boundary triggered'
      }
    } catch (err: any) {
      results[module] = { passed: false, error: err.message }
    }
  }

  // Print final report
  console.log('\n' + '='.repeat(70))
  console.log('PDCA FULL MODULE VERIFICATION REPORT')
  console.log('='.repeat(70))

  let passCount = 0
  let failCount = 0

  for (const [module, result] of Object.entries(results)) {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${module.padEnd(30)} ${result.passed ? 'PASS' : 'FAIL'}`)
    if (!result.passed && result.error) {
      console.log(`   └─ Error: ${result.error.substring(0, 50)}...`)
    }
    if (result.passed) passCount++
    else failCount++
  }

  console.log('='.repeat(70))
  console.log(`TOTAL: ${passCount} passed, ${failCount} failed out of ${flatModules.length}`)
  console.log(`CONFIDENCE: ${Math.round((passCount / flatModules.length) * 100)}%`)
  console.log('='.repeat(70))

  // For 100% confidence, all must pass
  expect(failCount).toBe(0)
})
