import { test } from '@playwright/test'

/**
 * Manual Visual Testing Script
 *
 * This script logs in and navigates through all hubs, taking screenshots
 * Uses credentials from API documentation
 */

test('Manual visual test: All hubs with screenshots', async ({ page }) => {
  // Set longer timeout for manual testing
  test.setTimeout(300000) // 5 minutes

  console.log('Starting manual visual test...')

  // Navigate to login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.screenshot({ path: '/tmp/screenshots/00-login-page.png', fullPage: true })

  // Try login with demo credentials
  await page.fill('input[type="email"]', 'admin@demofleet.com')
  await page.fill('input[type="password"]', 'Demo@123')
  await page.screenshot({ path: '/tmp/screenshots/01-login-filled.png', fullPage: true })

  await page.click('button[type="submit"]:has-text("Sign in")')
  await page.waitForTimeout(3000)

  // Capture dashboard
  await page.screenshot({ path: '/tmp/screenshots/02-dashboard.png', fullPage: true })
  console.log('Dashboard screenshot captured')

  // List of hubs to test
  const hubs = [
    { name: 'Financial Hub', url: '/financial', screenshot: '03-financial-hub.png' },
    { name: 'Fleet Hub', url: '/fleet', screenshot: '04-fleet-hub.png' },
    { name: 'Maintenance Hub', url: '/maintenance', screenshot: '05-maintenance-hub.png' },
    { name: 'Procurement Hub', url: '/procurement', screenshot: '06-procurement-hub.png' },
    { name: 'Operations Hub', url: '/operations', screenshot: '07-operations-hub.png' },
    { name: 'Drivers Hub', url: '/drivers', screenshot: '08-drivers-hub.png' },
    { name: 'Safety Hub', url: '/safety', screenshot: '09-safety-hub.png' },
    { name: 'Compliance Hub', url: '/compliance', screenshot: '10-compliance-hub.png' },
    { name: 'Analytics Hub', url: '/analytics', screenshot: '11-analytics-hub.png' },
  ]

  // Navigate to each hub directly via URL
  for (const hub of hubs) {
    try {
      console.log(`Testing ${hub.name}...`)
      await page.goto(`http://localhost:5173${hub.url}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `/tmp/screenshots/${hub.screenshot}`, fullPage: true })
      console.log(`✓ ${hub.name} screenshot captured`)
    } catch (e) {
      console.log(`✗ Could not access ${hub.name}: ${e}`)
      // Take screenshot of error state
      await page.screenshot({ path: `/tmp/screenshots/${hub.screenshot.replace('.png', '-error.png')}`, fullPage: true })
    }
  }

  console.log('All screenshots captured in /tmp/screenshots/')
})
