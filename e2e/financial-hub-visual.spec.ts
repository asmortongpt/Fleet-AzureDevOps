import { test } from '@playwright/test'

test('Visual check: Professional Financial Hub redesign', async ({ page }) => {
  // Navigate to login and authenticate
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 })

  // Fill in credentials (pre-filled in DEV mode)
  await page.fill('input[type="email"]', 'admin@fleet.local')
  await page.fill('input[type="password"]', 'demo123')
  await page.click('button[type="submit"]:has-text("Sign in")')

  // Wait for navigation to dashboard/hub
  await page.waitForURL(/\/(dashboard|fleet-hub|financial-hub)/, { timeout: 15000 })

  // Navigate to Financial Hub
  await page.click('text=/Financial.*Hub/i')
  await page.waitForSelector('text=/Budget.*Monitoring/i', { timeout: 10000 })

  // Click on Budget Monitoring tab
  await page.click('text=/Budget.*Monitoring/i')
  await page.waitForTimeout(2000) // Let charts render

  // Take full-page screenshot
  await page.screenshot({
    path: '/tmp/financial-hub-professional.png',
    fullPage: true
  })

  console.log('Screenshot saved to: /tmp/financial-hub-professional.png')
})
