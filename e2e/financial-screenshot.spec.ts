import { test } from '@playwright/test'

test('Capture Financial Hub screenshot', async ({ page }) => {
  // Start at the homepage to set up demo mode
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 })

  // Enable demo mode
  await page.evaluate(() => {
    localStorage.setItem('demo_mode', 'true')
  })

  // Now navigate to the financial page
  await page.goto('http://localhost:5173/financial', { waitUntil: 'networkidle', timeout: 30000 })

  // Wait for the page to fully load - wait for any key elements
  await page.waitForSelector('[data-testid="stat-card"], .stat-card, [class*="card"]', { timeout: 10000 }).catch(() => {
    console.log('Stat cards not found, continuing anyway')
  })

  // Wait a bit for charts to render
  await page.waitForTimeout(3000)

  // Take full-page screenshot
  await page.screenshot({
    path: '/tmp/financial-hub-current.png',
    fullPage: true
  })

  console.log('Screenshot saved to: /tmp/financial-hub-current.png')
})
