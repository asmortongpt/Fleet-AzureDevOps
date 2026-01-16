import { test, expect } from '@playwright/test'

test('FleetHub UI Visual Check', async ({ page }) => {
  // Navigate to FleetHub
  await page.goto('http://localhost:5174/fleet-hub', {
    waitUntil: 'networkidle',
    timeout: 30000
  })

  // Wait for page to render
  await page.waitForTimeout(3000)

  // Take screenshot
  await page.screenshot({
    path: 'test-results/fleet-hub-current-state.png',
    fullPage: true
  })

  // Log page title
  const title = await page.title()
  console.log('Page title:', title)

  // Check if there are any visible errors
  const bodyText = await page.locator('body').textContent()
  console.log('Body contains error:', bodyText?.includes('error') || bodyText?.includes('Error'))

  // Log console messages
  page.on('console', msg => console.log('Browser console:', msg.text()))
})
