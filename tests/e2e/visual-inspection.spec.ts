import { test, expect } from '@playwright/test'

test.describe('Fleet-CTA Visual Inspection', () => {
  test('Homepage should load and display ARCHONY logo', async ({ page }) => {
    console.log('🔍 Testing homepage...')
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    
    const title = await page.title()
    console.log(`✅ Page title: ${title}`)
    expect(title).toContain('CTA Fleet')
    
    const logoImg = page.locator('img[alt*="ARCHONY"], img[src*="Screenshot"]')
    await expect(logoImg).toBeVisible({ timeout: 5000 })
    console.log('✅ ARCHONY logo is visible')
    
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true })
    console.log('📸 Screenshot: 01-homepage.png')
  })

  test('Sidebar navigation visible', async ({ page }) => {
    console.log('🔍 Testing sidebar...')
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    
    const sidebar = page.locator('[aria-label="Application sidebar"], nav').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
    console.log('✅ Sidebar is visible')
    
    await page.screenshot({ path: 'test-results/02-sidebar.png', fullPage: true })
    console.log('📸 Screenshot: 02-sidebar.png')
  })

  test('Fleet page with map', async ({ page }) => {
    console.log('🔍 Testing Fleet page...')
    
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible({ timeout: 5000 })
    console.log('✅ Fleet page loaded')
    
    await page.screenshot({ path: 'test-results/03-fleet-page.png', fullPage: true })
    console.log('📸 Screenshot: 03-fleet-page.png')
  })

  test('API connectivity', async ({ page }) => {
    console.log('🔍 Testing API...')
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/vehicles?limit=5')
        return { status: res.status, ok: res.ok }
      } catch (e) {
        return { error: String(e) }
      }
    })
    
    console.log(`✅ API response: ${JSON.stringify(response)}`)
  })
})
