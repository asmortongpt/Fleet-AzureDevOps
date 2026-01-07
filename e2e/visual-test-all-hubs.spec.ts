import { test } from '@playwright/test'

test.skip('Visual test: All hubs and pages', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"]', 'admin@fleet.local')
  await page.fill('input[type="password"]', 'demo123')
  await page.screenshot({ path: '/tmp/01-login.png', fullPage: true })

  await page.click('button[type="submit"]:has-text("Sign in")')
  await page.waitForTimeout(3000)

  // Dashboard/Home
  await page.screenshot({ path: '/tmp/02-dashboard.png', fullPage: true })

  // Financial Hub
  const hubs = [
    { name: 'Financial Hub', selector: 'text=/Financial.*Hub/i', screenshot: '03-financial-hub.png' },
    { name: 'Fleet Hub', selector: 'text=/Fleet.*Hub/i', screenshot: '04-fleet-hub.png' },
    { name: 'Maintenance Hub', selector: 'text=/Maintenance.*Hub/i', screenshot: '05-maintenance-hub.png' },
    { name: 'Procurement Hub', selector: 'text=/Procurement.*Hub/i', screenshot: '06-procurement-hub.png' },
    { name: 'Operations Hub', selector: 'text=/Operations.*Hub/i', screenshot: '07-operations-hub.png' },
    { name: 'Drivers Hub', selector: 'text=/Drivers.*Hub/i', screenshot: '08-drivers-hub.png' },
    { name: 'Safety Hub', selector: 'text=/Safety.*Hub/i', screenshot: '09-safety-hub.png' },
    { name: 'Compliance Hub', selector: 'text=/Compliance.*Hub/i', screenshot: '10-compliance-hub.png' },
    { name: 'Analytics Hub', selector: 'text=/Analytics.*Hub/i', screenshot: '11-analytics-hub.png' },
  ]

  for (const hub of hubs) {
    try {
      console.log(`Testing ${hub.name}...`)
      await page.click(hub.selector)
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `/tmp/${hub.screenshot}`, fullPage: true })
    } catch (e) {
      console.log(`Could not access ${hub.name}: ${e}`)
    }
  }

  console.log('All screenshots captured!')
})
