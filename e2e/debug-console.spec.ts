import { test } from '@playwright/test'

test('Debug: Capture console errors on load', async ({ page }) => {
  const errors: string[] = []
  const logs: string[] = []

  page.on('console', msg => {
    const text = msg.text()
    console.log(`[${msg.type()}] ${text}`)
    if (msg.type() === 'error') {
      errors.push(text)
    }
    logs.push(`[${msg.type()}] ${text}`)
  })

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message)
    errors.push(`PAGE ERROR: ${error.message}`)
  })

  console.log('\n=== Loading http://localhost:5173/login ===\n')

  try {
    await page.goto('http://localhost:5173/login', { timeout: 30000 })
    await page.waitForTimeout(5000)
  } catch (e) {
    console.log('Navigation error:', e)
  }

  console.log('\n=== Console Errors ===')
  errors.forEach((err, i) => console.log(`${i + 1}. ${err}`))

  console.log('\n=== All Console Logs ===')
  logs.slice(-20).forEach(log => console.log(log))

  // Take screenshot
  await page.screenshot({ path: '/tmp/debug-console-screenshot.png', fullPage: true })
  console.log('\nScreenshot saved to /tmp/debug-console-screenshot.png')
})
