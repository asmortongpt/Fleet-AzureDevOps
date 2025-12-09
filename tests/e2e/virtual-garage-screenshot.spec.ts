/**
 * Virtual Garage - Screenshot Evidence Test
 *
 * Captures screenshot of working Virtual Garage component
 */

import { test, expect } from '@playwright/test'

test('capture Virtual Garage screenshot with demo data', async ({ page }) => {
  // Navigate to Virtual Garage
  await page.goto('http://localhost:5173')
  await page.waitForSelector('button:has-text("Virtual Garage")', { timeout: 10000 })
  await page.click('button:has-text("Virtual Garage")')
  await page.waitForSelector('h2:has-text("Virtual Garage")', { timeout: 10000 })

  // Wait for demo data to load
  await page.waitForTimeout(3000)

  // Verify assets are loaded
  const totalAssets = await page.locator('.text-2xl.font-bold').first().textContent()
  console.log('Total Assets:', totalAssets)

  // Take screenshot
  await page.screenshot({
    path: '/Users/andrewmorton/Documents/GitHub/Fleet/virtual-garage-working.png',
    fullPage: true
  })

  console.log('Screenshot saved to: /Users/andrewmorton/Documents/GitHub/Fleet/virtual-garage-working.png')

  expect(Number(totalAssets)).toBeGreaterThan(0)
})
