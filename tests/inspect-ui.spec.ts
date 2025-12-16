import { test } from '@playwright/test'

test('Capture all dashboards', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(3000)
  
  // Homepage
  await page.screenshot({ path: '/tmp/fleet-0-homepage.png' })
  console.log('📸 Homepage captured')
  
  // Click Fleet Dashboard sidebar
  try {
    await page.click('text=Fleet Dashboard', { timeout: 5000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: '/tmp/fleet-comparison-view.png' })
    console.log('📸 Comparison view captured')
  } catch (e) {
    console.log('Could not click sidebar')
  }
  
  // Click dashboard buttons
  const dashboards = [1, 2, 3, 4]
  for (const num of dashboards) {
    try {
      await page.click(`button:has-text("#${num}")`, { timeout: 3000 })
      await page.waitForTimeout(3000)
      await page.screenshot({ path: `/tmp/fleet-dashboard-${num}.png` })
      console.log(`📸 Dashboard ${num} captured`)
    } catch (e) {
      console.log(`Could not capture dashboard ${num}`)
    }
  }
})
