import { test, expect } from '@playwright/test'

test.describe('Logo Loading Diagnostics', () => {
  test('diagnose logo image loading issues', async ({ page }) => {
    const consoleMessages: string[] = []
    const networkRequests: { url: string; status?: number; error?: string }[] = []

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
    })

    page.on('response', response => {
      const url = response.url()
      if (url.includes('logos') || url.includes('Screenshot') || url.includes('.png')) {
        networkRequests.push({ url, status: response.status() })
      }
    })

    page.on('requestfailed', request => {
      const url = request.url()
      if (url.includes('logos') || url.includes('Screenshot') || url.includes('.png')) {
        networkRequests.push({ url, error: request.failure()?.errorText })
      }
    })

    console.log('📍 Loading homepage...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

    // Check for all images
    console.log('\n📸 Checking all images on page...')
    const images = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        offsetHeight: img.offsetHeight,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }))
    )

    console.log(`Found ${images.length} images:`)
    images.forEach((img, i) => {
      console.log(`  [${i}] src="${img.src}"`)
      console.log(`       alt="${img.alt}", visible=${img.offsetHeight > 0}px, complete=${img.complete}`)
    })

    // Try direct fetch
    console.log('\n🔗 Testing direct fetch of logo file...')
    const fetchResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/logos/approved-branding/Screenshot 2026-02-15 at 4.05.10 PM.png')
        return {
          status: response.status,
          ok: response.ok,
          url: response.url,
          contentLength: response.headers.get('content-length')
        }
      } catch (e) {
        return { error: (e as Error).message }
      }
    })

    console.log('Fetch result:', JSON.stringify(fetchResult, null, 2))

    // Check for ARCHONY logo specifically
    console.log('\n🔎 Searching for ARCHONY logo element...')
    const archonyImg = page.locator('img[alt*="ARCHONY"], img[src*="Screenshot"]')
    const count = await archonyImg.count()
    console.log(`ARCHONY image elements found: ${count}`)

    if (count > 0) {
      const src = await archonyImg.first().getAttribute('src')
      console.log(`Logo src: ${src}`)
      const visible = await archonyImg.first().isVisible()
      console.log(`Logo visible: ${visible}`)
    }

    // Check what's in the sidebar
    console.log('\n📌 Checking sidebar content...')
    const sidebar = page.locator('[aria-label="Application sidebar"], nav')
    const sidebarVisible = await sidebar.first().isVisible({ timeout: 1000 }).catch(() => false)
    console.log(`Sidebar visible: ${sidebarVisible}`)

    // Network activity summary
    console.log('\n🌐 Network requests for logos:', networkRequests.length)
    networkRequests.forEach(req => {
      if (req.error) {
        console.log(`  ❌ ${req.url} - ERROR: ${req.error}`)
      } else {
        console.log(`  ✅ ${req.url} - Status: ${req.status}`)
      }
    })

    // Take screenshot
    console.log('\n📷 Taking screenshot...')
    await page.screenshot({ path: 'test-results/debug-logo-loading.png', fullPage: true })
    console.log('Screenshot saved to test-results/debug-logo-loading.png')

    // Print console messages
    console.log('\n📝 Browser console messages (first 10):')
    consoleMessages.slice(0, 10).forEach(msg => console.log(`  ${msg}`))
  })
})
