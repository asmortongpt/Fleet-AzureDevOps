import { test } from '@playwright/test'

test('Inspect UI rendering issue', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173')

  // Wait for app to load
  await page.waitForTimeout(3000)

  // Take a screenshot
  await page.screenshot({ path: '/tmp/fleet-ui.png', fullPage: true })

  // Check console errors
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`CONSOLE ERROR: ${msg.text()}`)
    }
  })

  // Log all text content
  const bodyText = await page.locator('body').innerText()
  console.log('BODY CONTENT:', bodyText.substring(0, 500))

  // Check if FleetMetricsBar is rendered
  const metricsBar = page.locator('[data-testid="fleet-metrics-bar"]').or(page.locator('text=Total Vehicles'))
  const metricsExists = await metricsBar.count()
  console.log('METRICS BAR ELEMENTS:', metricsExists)

  // Check if vehicle count is visible
  const vehicleCountVisible = await page.locator('text=/\\d+ Total Vehicles|Total Vehicles/i').isVisible().catch(() => false)
  console.log('VEHICLE COUNT VISIBLE:', vehicleCountVisible)

  // Get computed styles of key elements
  const card = page.locator('[data-slot="card"]').first()
  if (await card.count() > 0) {
    const styles = await card.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        position: computed.position,
        zIndex: computed.zIndex,
        width: computed.width,
        height: computed.height
      }
    })
    console.log('CARD STYLES:', JSON.stringify(styles, null, 2))
  }

  // Check for any React errors in DOM
  const reactError = await page.locator('text=/error|failed|undefined/i').count()
  console.log('REACT ERROR INDICATORS:', reactError)

  console.log('CONSOLE ERRORS:', logs.join('\n'))
})
