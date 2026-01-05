import { test } from '@playwright/test'

test('Visual check: Professional Login page', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:5173/login', {
    waitUntil: 'networkidle',
    timeout: 30000
  })

  // Wait for the page to fully load
  await page.waitForSelector('text=Fleet Manager', { timeout: 10000 })
  await page.waitForTimeout(1000) // Let any transitions complete

  // Take full-page screenshot
  await page.screenshot({
    path: '/tmp/login-professional-redesign.png',
    fullPage: true
  })

  console.log('Screenshot saved to: /tmp/login-professional-redesign.png')
})
