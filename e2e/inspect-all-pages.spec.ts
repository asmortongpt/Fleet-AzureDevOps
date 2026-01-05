import { test, expect } from '@playwright/test'

test('Inspect all pages - Bypass auth and capture UI', async ({ page }) => {
  test.setTimeout(300000)

  console.log('Starting comprehensive UI inspection...\n')

  // Enable demo mode - this bypasses SSO auth (see AuthContext.tsx lines 71-88)
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })

  await page.evaluate(() => {
    localStorage.setItem('demo_mode', 'true')
    localStorage.setItem('demo_role', 'Admin')
  })

  // Reload to trigger demo mode auth
  await page.reload({ waitUntil: 'networkidle' })

  const pages = [
    { name: 'Dashboard', url: '/', file: 'dashboard' },
    { name: 'Financial Hub', url: '/financial', file: 'financial-hub' },
    { name: 'Fleet Hub', url: '/fleet', file: 'fleet-hub' },
    { name: 'Maintenance Hub', url: '/maintenance', file: 'maintenance-hub' },
    { name: 'Procurement Hub', url: '/procurement', file: 'procurement-hub' },
    { name: 'Operations Hub', url: '/operations', file: 'operations-hub' },
    { name: 'Drivers Hub', url: '/drivers', file: 'drivers-hub' },
    { name: 'Safety Hub', url: '/safety', file: 'safety-hub' },
    { name: 'Compliance Hub', url: '/compliance', file: 'compliance-hub' },
    { name: 'Analytics Hub', url: '/analytics', file: 'analytics-hub' },
  ]

  for (const pageInfo of pages) {
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Inspecting: ${pageInfo.name}`)
      console.log('='.repeat(60))

      await page.goto(`http://localhost:5173${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      await page.waitForTimeout(2000)

      // Capture full page screenshot
      await page.screenshot({
        path: `/tmp/ui-analysis-after-fix/${pageInfo.file}-full.png`,
        fullPage: true
      })

      // Capture viewport screenshot
      await page.screenshot({
        path: `/tmp/ui-analysis-after-fix/${pageInfo.file}-viewport.png`,
        fullPage: false
      })

      // Get page info
      const title = await page.title()
      const url = page.url()

      console.log(`Title: ${title}`)
      console.log(`URL: ${url}`)

      // Check for common UI issues
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor
      })

      const textColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).color
      })

      const fontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize
      })

      console.log(`Background: ${bodyBg}`)
      console.log(`Text Color: ${textColor}`)
      console.log(`Font Size: ${fontSize}`)

      // Check for error messages
      const errors = await page.locator('[class*="error"], [role="alert"]').count()
      if (errors > 0) {
        console.log(`⚠️  ${errors} error elements found`)
      }

      // Check for very small text (potential readability issue)
      const smallText = await page.locator('*').evaluateAll(elements => {
        let count = 0
        elements.forEach(el => {
          const fontSize = window.getComputedStyle(el).fontSize
          const size = parseInt(fontSize)
          if (size < 12 && el.textContent && el.textContent.trim().length > 0) {
            count++
          }
        })
        return count
      })

      if (smallText > 10) {
        console.log(`⚠️  ${smallText} elements with text smaller than 12px`)
      }

      // Check for low contrast (potential readability issue)
      const contrastIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        let lowContrast = 0
        elements.forEach(el => {
          const style = window.getComputedStyle(el)
          const color = style.color
          const bg = style.backgroundColor
          // Simple check for white on white or black on black
          if ((color === 'rgb(255, 255, 255)' && bg === 'rgb(255, 255, 255)') ||
              (color === 'rgb(0, 0, 0)' && bg === 'rgb(0, 0, 0)')) {
            lowContrast++
          }
        })
        return lowContrast
      })

      if (contrastIssues > 0) {
        console.log(`⚠️  ${contrastIssues} potential contrast issues`)
      }

      console.log(`✓ Screenshots captured`)

    } catch (error) {
      console.log(`✗ Failed to inspect ${pageInfo.name}:`, error)

      // Capture error state
      try {
        await page.screenshot({
          path: `/tmp/ui-analysis-after-fix/${pageInfo.file}-error.png`,
          fullPage: true
        })
      } catch (e) {
        console.log('Could not capture error screenshot')
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('UI Inspection Complete (AFTER ROUTING FIX)!')
  console.log('Screenshots saved to: /tmp/ui-analysis-after-fix/')
  console.log('='.repeat(60))
})
