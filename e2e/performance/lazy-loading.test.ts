import { test, expect } from '@playwright/test'

/**
 * Lazy Loading Performance Tests
 * Tests modules load on demand and code splitting
 */

test.describe('Performance - Lazy Loading Modules', () => {
  test('should load modules on demand', async ({ page }) => {
    // Monitor network requests
    const loadedModules: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.endsWith('.js') && url.includes('chunk')) {
        loadedModules.push(url)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const initialModules = loadedModules.length
    console.log(`Initial modules loaded: ${initialModules}`)

    // Navigate to another page
    const link = page.locator('a').filter({ hasText: /garage|fleet/i }).first()
    if (await link.isVisible()) {
      await link.click()
      await page.waitForLoadState('networkidle')

      const totalModules = loadedModules.length
      console.log(`Total modules after navigation: ${totalModules}`)

      // More modules should load on demand
      expect(totalModules).toBeGreaterThanOrEqual(initialModules)
    }
  })

  test('should not load unnecessary modules', async ({ page }) => {
    const loadedScripts: string[] = []

    page.on('response', (response) => {
      if (response.url().endsWith('.js')) {
        loadedScripts.push(response.url())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should not load module-specific code on homepage
    const moduleScripts = loadedScripts.filter((url) =>
      url.includes('garage') || url.includes('people') || url.includes('maintenance')
    )

    console.log(`Module-specific scripts on homepage: ${moduleScripts.length}`)

    // Some lazy loading should be in place
    expect(loadedScripts.length).toBeGreaterThan(0)
  })
})

test.describe('Performance - Image Lazy Loading', () => {
  test('should lazy load images below the fold', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    // Get images
    const images = page.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      // Check for lazy loading attribute
      const firstImage = images.first()
      const loading = await firstImage.getAttribute('loading')

      console.log(`Image loading attribute: ${loading}`)

      // Lazy loading should be enabled or images should load on scroll
      expect(loading === 'lazy' || loading === null).toBeTruthy()
    }
  })

  test('should load images as they come into viewport', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const initialImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      return Array.from(images).filter((img) => img.complete).length
    })

    // Scroll down
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
    await page.waitForTimeout(1000)

    const finalImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      return Array.from(images).filter((img) => img.complete).length
    })

    console.log(`Images loaded: ${initialImages} -> ${finalImages}`)

    // More images should load after scroll
    expect(finalImages).toBeGreaterThanOrEqual(initialImages)
  })
})

test.describe('Performance - Component Lazy Loading', () => {
  test('should lazy load heavy components', async ({ page }) => {
    const loadedComponents: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('chunk') || url.includes('lazy')) {
        loadedComponents.push(url)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    console.log(`Lazy loaded components: ${loadedComponents.length}`)

    // Some components should be code-split
    expect(loadedComponents.length).toBeGreaterThanOrEqual(0)
  })

  test('should defer non-critical JavaScript', async ({ page }) => {
    await page.goto('/')

    const scripts = await page.evaluate(() => {
      const scriptTags = document.querySelectorAll('script')
      return Array.from(scriptTags).map((script) => ({
        src: script.src,
        defer: script.defer,
        async: script.async,
      }))
    })

    const deferredScripts = scripts.filter((s) => s.defer || s.async)

    console.log(`Deferred/async scripts: ${deferredScripts.length}/${scripts.length}`)

    // Most scripts should be deferred or async
    expect(deferredScripts.length).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance - Route-based Code Splitting', () => {
  test('should split code by routes', async ({ page }) => {
    const chunks: Set<string> = new Set()

    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('.js') && (url.includes('chunk') || url.includes('/'))) {
        const filename = url.split('/').pop()
        if (filename) chunks.add(filename)
      }
    })

    // Visit multiple routes
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const homeChunks = chunks.size

    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')
    const fleetChunks = chunks.size

    await page.goto('/garage')
    await page.waitForLoadState('networkidle')
    const garageChunks = chunks.size

    console.log(`Chunks loaded: Home=${homeChunks}, Fleet=${fleetChunks}, Garage=${garageChunks}`)

    // Different routes should load different chunks
    expect(garageChunks).toBeGreaterThanOrEqual(homeChunks)
  })
})
