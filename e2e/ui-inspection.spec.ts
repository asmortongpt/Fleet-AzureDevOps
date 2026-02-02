import { test } from '@playwright/test'

test('UI Inspection - Capture current state for analysis', async ({ page }) => {
  test.setTimeout(60000)

  console.log('Navigating to application...')

  // Go directly to the app (may redirect to login)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Capture current page
  await page.screenshot({
    path: '/tmp/ui-inspection-current.png',
    fullPage: true
  })

  console.log('Screenshot captured: /tmp/ui-inspection-current.png')

  // Get page title and URL
  const title = await page.title()
  const url = page.url()

  console.log('Page Title:', title)
  console.log('Page URL:', url)

  // Check for any visible errors
  const errorElements = await page.locator('[class*="error"], [role="alert"]').count()
  console.log('Error elements found:', errorElements)
})
