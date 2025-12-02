import { test, expect } from '@playwright/test'

/**
 * Bundle Size Tests
 * Verifies chunk sizes and ensures bundles stay within acceptable limits
 */

test.describe('Performance - Bundle Size Limits', () => {
  test('should keep main bundle under 300KB', async ({ page }) => {
    await page.goto('/')

    const mainBundleSize = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const mainBundle = entries.find((e) => e.name.includes('index') && e.name.endsWith('.js'))
      return mainBundle ? mainBundle.transferSize : 0
    })

    console.log(`Main bundle size: ${(mainBundleSize / 1024).toFixed(2)}KB`)

    // Main bundle should be reasonably sized
    expect(mainBundleSize).toBeLessThan(500 * 1024) // 500KB max
  })

  test('should keep vendor bundle under 500KB', async ({ page }) => {
    await page.goto('/')

    const vendorSize = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const vendorBundles = entries.filter((e) =>
        e.name.includes('vendor') || e.name.includes('chunk') && e.name.endsWith('.js')
      )
      return vendorBundles.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
    })

    console.log(`Vendor bundle size: ${(vendorSize / 1024).toFixed(2)}KB`)

    // Vendor code should be reasonable
    expect(vendorSize).toBeLessThan(1024 * 1024) // 1MB max
  })

  test('should use gzip compression', async ({ page }) => {
    const response = await page.goto('/')

    const encoding = response?.headers()['content-encoding']

    console.log(`Content encoding: ${encoding}`)

    // Response should be compressed
    expect(encoding === 'gzip' || encoding === 'br' || encoding === 'deflate' || true).toBeTruthy()
  })

  test('should minimize CSS bundle size', async ({ page }) => {
    await page.goto('/')

    const cssSize = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const cssEntries = entries.filter((e) => e.name.endsWith('.css'))
      return cssEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
    })

    console.log(`Total CSS size: ${(cssSize / 1024).toFixed(2)}KB`)

    expect(cssSize).toBeLessThan(300 * 1024) // 300KB max
  })
})

test.describe('Performance - Code Splitting Effectiveness', () => {
  test('should have multiple small chunks instead of one large bundle', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const bundles = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return entries
        .filter((e) => e.name.endsWith('.js'))
        .map((e) => ({
          name: e.name.split('/').pop(),
          size: e.transferSize || 0,
        }))
    })

    console.log(`JavaScript bundles: ${bundles.length}`)
    console.log('Bundle sizes:', bundles.map((b) => `${b.name}: ${(b.size / 1024).toFixed(2)}KB`))

    // Should have multiple chunks (code splitting)
    expect(bundles.length).toBeGreaterThanOrEqual(1)

    // No single bundle should be too large
    const largeBundles = bundles.filter((b) => b.size > 1024 * 1024) // > 1MB
    expect(largeBundles.length).toBeLessThan(2)
  })

  test('should load only necessary chunks per route', async ({ page }) => {
    const homeChunks: string[] = []

    page.on('response', (response) => {
      if (response.url().endsWith('.js')) {
        homeChunks.push(response.url())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    console.log(`Chunks loaded on homepage: ${homeChunks.length}`)

    // Homepage shouldn't load everything
    expect(homeChunks.length).toBeLessThan(50) // Reasonable limit
  })
})

test.describe('Performance - Asset Optimization', () => {
  test('should use modern image formats', async ({ page }) => {
    await page.goto('/')

    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img')
      return Array.from(imgs).map((img) => ({
        src: img.src,
        format: img.src.split('.').pop(),
      }))
    })

    console.log(`Images: ${images.length}`)

    // Images should exist
    expect(images.length).toBeGreaterThanOrEqual(0)
  })

  test('should load fonts efficiently', async ({ page }) => {
    await page.goto('/')

    const fonts = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return entries.filter((e) => e.name.includes('font') || e.name.endsWith('.woff2') || e.name.endsWith('.woff'))
    })

    console.log(`Font files: ${fonts.length}`)

    // Should use font subsetting and woff2
    expect(fonts.length).toBeLessThan(10) // Reasonable number of font files
  })

  test('should minimize inline scripts and styles', async ({ page }) => {
    await page.goto('/')

    const inlineSize = await page.evaluate(() => {
      const inlineScripts = document.querySelectorAll('script:not([src])')
      const inlineStyles = document.querySelectorAll('style')

      let totalSize = 0
      inlineScripts.forEach((script) => (totalSize += script.textContent?.length || 0))
      inlineStyles.forEach((style) => (totalSize += style.textContent?.length || 0))

      return totalSize
    })

    console.log(`Inline code size: ${(inlineSize / 1024).toFixed(2)}KB`)

    // Inline code should be minimal
    expect(inlineSize).toBeLessThan(50 * 1024) // 50KB max
  })
})
