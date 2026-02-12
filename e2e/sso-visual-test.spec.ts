import { test } from '@playwright/test'

/**
 * SSO Visual Testing Script
 *
 * This script uses Microsoft SSO to login and navigates through all hubs
 * taking comprehensive screenshots for visual analysis
 */

test('SSO visual test: Login and capture all hubs', async ({ page }) => {
  test.setTimeout(300000) // 5 minutes

  console.log('Starting SSO visual test...')

  // Navigate to login page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.screenshot({ path: '/tmp/screenshots/00-login-page.png', fullPage: true })
  console.log('✓ Login page screenshot captured')

  // Click "Sign in with Microsoft" button
  try {
    const ssoButton = page.locator('button:has-text("Sign in with Microsoft")')
    await ssoButton.click()
    console.log('Clicked SSO button, waiting for Microsoft auth...')

    // Wait for redirect back to app after SSO (may take a while)
    await page.waitForURL(/localhost:5173/, { timeout: 60000 })
    await page.waitForTimeout(3000)

    // Capture dashboard after SSO login
    await page.screenshot({ path: '/tmp/screenshots/02-dashboard-sso.png', fullPage: true })
    console.log('✓ Dashboard screenshot captured after SSO login')
  } catch (e) {
    console.log('SSO login failed or not configured, error:', e)
    await page.screenshot({ path: '/tmp/screenshots/01-sso-error.png', fullPage: true })

    // If SSO fails, skip to direct navigation (assuming session exists or auth not required for dev)
  }

  // List of all hubs to test with direct URLs
  const hubs = [
    { name: 'Dashboard', url: '/', screenshot: '02-dashboard.png' },
    { name: 'Financial Hub', url: '/financial', screenshot: '03-financial-hub.png' },
    { name: 'Fleet Hub', url: '/fleet', screenshot: '04-fleet-hub.png' },
    { name: 'Maintenance Hub', url: '/maintenance', screenshot: '05-maintenance-hub.png' },
    { name: 'Procurement Hub', url: '/procurement', screenshot: '06-procurement-hub.png' },
    { name: 'Operations Hub', url: '/operations', screenshot: '07-operations-hub.png' },
    { name: 'Drivers Hub', url: '/drivers', screenshot: '08-drivers-hub.png' },
    { name: 'Safety Hub', url: '/safety', screenshot: '09-safety-hub.png' },
    { name: 'Compliance Hub', url: '/compliance', screenshot: '10-compliance-hub.png' },
    { name: 'Analytics Hub', url: '/analytics', screenshot: '11-analytics-hub.png' },
  ]

  // Navigate to each hub and capture screenshots
  for (const hub of hubs) {
    try {
      console.log(`\nTesting ${hub.name}...`)
      await page.goto(`http://localhost:5173${hub.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Wait for content to load
      await page.waitForTimeout(2000)

      // Take full page screenshot
      await page.screenshot({
        path: `/tmp/screenshots/${hub.screenshot}`,
        fullPage: true
      })

      console.log(`✓ ${hub.name} screenshot captured`)

      // Capture any console errors
      const errors = await page.evaluate(() => {
        const errors = (window as any).__capturedErrors || []
        return errors
      })

      if (errors.length > 0) {
        console.log(`  ⚠ ${errors.length} console errors detected`)
      }

    } catch (e) {
      console.log(`✗ Could not access ${hub.name}:`, e)

      // Capture error state
      try {
        await page.screenshot({
          path: `/tmp/screenshots/${hub.screenshot.replace('.png', '-error.png')}`,
          fullPage: true
        })
      } catch (screenshotError) {
        console.log('  Could not capture error screenshot')
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Visual testing complete!')
  console.log('Screenshots saved to: /tmp/screenshots/')
  console.log('='.repeat(60))
})
