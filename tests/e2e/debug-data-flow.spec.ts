import { test } from '@playwright/test'

test('Debug Fleet data flow', async ({ page }) => {
  const logs: string[] = []
  const apiResponses: any[] = []

  // Capture all console messages
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`)
  })

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      try {
        const data = await response.json()
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          data: data
        })
      } catch (e) {
        // Not JSON
      }
    }
  })

  await page.goto('http://172.168.57.73')
  await page.waitForTimeout(8000) // Wait for all API calls

  console.log('\n=== API RESPONSES ===')
  for (const resp of apiResponses) {
    console.log(`\n${resp.status} ${resp.url}`)
    if (resp.url.includes('vehicles')) {
      console.log(`  Data keys: ${Object.keys(resp.data).join(', ')}`)
      console.log(`  Total vehicles: ${resp.data.total || 0}`)
      console.log(`  Vehicles in data array: ${resp.data.data?.length || 0}`)
      if (resp.data.data && resp.data.data.length > 0) {
        console.log(`  First vehicle: ${JSON.stringify(resp.data.data[0])}`)
      }
    }
  }

  console.log('\n=== CONSOLE LOGS ===')
  logs.forEach(log => console.log(log))

  // Check DOM state
  const vehicleCount = await page.locator('text=Total Vehicles').locator('..').locator('text=/\\d+/').textContent()
  console.log(`\n=== DOM STATE ===`)
  console.log(`Vehicle count in sidebar: ${vehicleCount}`)

  // Check table rows
  const tableRows = await page.locator('table tbody tr').count()
  console.log(`Table rows visible: ${tableRows}`)

  await page.screenshot({ path: '/tmp/debug-screenshot.png', fullPage: true })
})