import { test } from '@playwright/test'

test('Fleet app loads and API calls work', async ({ page }) => {
  // Listen for console messages
  const consoleMessages: string[] = []
  const apiCalls: { url: string; status: number }[] = []

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
  })

  // Listen for API responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status()
      })
    }
  })

  // Navigate to the app
  await page.goto('http://172.168.57.73')

  // Wait for app to load
  await page.waitForTimeout(5000)

  // Check if Fleet Dashboard is visible
  const title = await page.textContent('h1, h2, [class*="title"]').catch(() => null)
  console.log('Page title/heading:', title)

  // Log all API calls
  console.log('\n=== API Calls ===')
  apiCalls.forEach(call => {
    console.log(`${call.status} ${call.url}`)
  })

  // Log console errors
  console.log('\n=== Console Errors ===')
  const errors = consoleMessages.filter(msg => msg.startsWith('error:'))
  errors.forEach(error => console.log(error))

  // Check for 404 errors
  const failedCalls = apiCalls.filter(call => call.status === 404)
  console.log('\n=== Failed API Calls (404) ===')
  failedCalls.forEach(call => console.log(call.url))

  // Take screenshot
  await page.screenshot({ path: '/tmp/fleet-app-screenshot.png', fullPage: true })
  console.log('\nScreenshot saved to /tmp/fleet-app-screenshot.png')
})
