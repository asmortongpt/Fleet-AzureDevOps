import { test } from '@playwright/test'

test('Fleet Dashboard - Visual Screenshot', async ({ page }) => {
  // Go to local dev server
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 60000 })

  // Wait for main content
  await page.waitForSelector('h1:has-text("Fleet Management")', { timeout: 10000 })

  // Take full page screenshot
  await page.screenshot({
    path: '/tmp/fleet-dashboard-current.png',
    fullPage: true
  })

  // Get metric values
  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[aria-label*=":"]'))
    return cards.map(card => card.getAttribute('aria-label'))
  })

  console.log('\n===== CURRENT DASHBOARD METRICS =====')
  metrics.forEach(metric => console.log(metric))
  console.log('======================================\n')

  // Check if all zeros (the problem)
  const hasData = await page.evaluate(() => {
    const numbers = Array.from(document.querySelectorAll('.text-2xl, .text-3xl'))
    return numbers.some(el => {
      const text = el.textContent || ''
      return text.match(/[1-9]/) !== null
    })
  })

  console.log(`Dashboard has real data: ${hasData}`)
  console.log(`Screenshot saved to: /tmp/fleet-dashboard-current.png`)
})
