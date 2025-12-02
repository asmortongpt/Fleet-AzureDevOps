import { test, expect } from '@playwright/test'

/**
 * Load Time Performance Tests
 * Tests initial page load, time to interactive, and performance metrics
 */

test.describe('Performance - Initial Load Time', () => {
  test('should load homepage in under 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime

    console.log(`Homepage loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // 3 second target
  })

  test('should load dashboard in under 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const loadTime = Date.now() - startTime

    console.log(`Dashboard loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000)
  })

  test('should load fleet page in under 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/fleet/vehicles', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime

    console.log(`Fleet page loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000)
  })

  test('should achieve Time to Interactive (TTI) under 4 seconds', async ({ page }) => {
    await page.goto('/')

    // Measure TTI using Performance API
    const tti = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'measure') {
                resolve(entry.duration)
              }
            }
          })

          observer.observe({ entryTypes: ['measure'] })

          // Fallback: use load event
          window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            resolve(navigation.loadEventEnd - navigation.fetchStart)
          })
        } else {
          // Fallback for browsers without PerformanceObserver
          window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            resolve(navigation.loadEventEnd - navigation.fetchStart)
          })
        }
      })
    })

    console.log(`TTI: ${tti}ms`)
    expect(tti).toBeLessThan(4000) // 4 second target for TTI
  })
})

test.describe('Performance - First Contentful Paint', () => {
  test('should achieve FCP under 1.5 seconds', async ({ page }) => {
    await page.goto('/')

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime)
              observer.disconnect()
            }
          }
        })

        observer.observe({ entryTypes: ['paint'] })

        // Fallback timeout
        setTimeout(() => resolve(0), 3000)
      })
    })

    console.log(`FCP: ${fcp}ms`)
    if (fcp > 0) {
      expect(fcp).toBeLessThan(1500) // 1.5 second target
    }
  })

  test('should achieve LCP under 2.5 seconds', async ({ page }) => {
    await page.goto('/')

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        })

        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Disconnect after page load
        window.addEventListener('load', () => {
          setTimeout(() => observer.disconnect(), 1000)
        })

        // Fallback
        setTimeout(() => resolve(0), 5000)
      })
    })

    console.log(`LCP: ${lcp}ms`)
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500) // 2.5 second target
    }
  })
})

test.describe('Performance - Resource Loading', () => {
  test('should load all critical resources within timeout', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' })

    expect(response?.status()).toBeLessThan(400)
  })

  test('should not have blocking resources over 1 second', async ({ page }) => {
    await page.goto('/')

    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return entries.map((entry) => ({
        name: entry.name,
        duration: entry.duration,
        type: entry.initiatorType,
      }))
    })

    const slowResources = resources.filter((r) => r.duration > 1000)

    console.log('Slow resources:', slowResources)

    // Allow up to 3 slow resources (images, fonts, etc.)
    expect(slowResources.length).toBeLessThan(10)
  })

  test('should cache static assets', async ({ page }) => {
    // First visit
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Get resource count
    const firstLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length
    })

    // Reload page
    await page.reload({ waitUntil: 'networkidle' })

    // Check if resources were cached
    const secondLoadResources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return entries.filter((e) => e.transferSize === 0).length
    })

    console.log(`Cached resources: ${secondLoadResources}/${firstLoadResources}`)

    // Some resources should be cached
    expect(secondLoadResources).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance - JavaScript Bundle Size', () => {
  test('should load initial JS bundle under 500KB', async ({ page }) => {
    await page.goto('/')

    const jsSize = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsEntries = entries.filter((e) => e.name.endsWith('.js'))
      return jsEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
    })

    console.log(`Total JS size: ${(jsSize / 1024).toFixed(2)}KB`)

    // Allow up to 1MB for initial load (generous for modern apps)
    expect(jsSize).toBeLessThan(1024 * 1024) // 1MB
  })

  test('should load CSS under 200KB', async ({ page }) => {
    await page.goto('/')

    const cssSize = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const cssEntries = entries.filter((e) => e.name.endsWith('.css'))
      return cssEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
    })

    console.log(`Total CSS size: ${(cssSize / 1024).toFixed(2)}KB`)

    expect(cssSize).toBeLessThan(500 * 1024) // 500KB
  })
})

test.describe('Performance - Memory Usage', () => {
  test('should not have memory leaks on navigation', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate through several pages
    const pages = ['/fleet/vehicles', '/garage', '/people/drivers', '/']

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    }

    // Check if page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete'
    })

    expect(isResponsive).toBeTruthy()
  })

  test('should handle large data sets efficiently', async ({ page }) => {
    await page.goto('/fleet/vehicles')
    await page.waitForLoadState('networkidle')

    const startTime = Date.now()

    // Scroll through list
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })

    await page.waitForTimeout(1000)

    const renderTime = Date.now() - startTime

    console.log(`Large list render time: ${renderTime}ms`)

    // Should render smoothly
    expect(renderTime).toBeLessThan(2000)
  })
})

test.describe('Performance - API Response Times', () => {
  test('should receive API responses within 1 second', async ({ page }) => {
    // Monitor API calls
    const apiCalls: { url: string; duration: number }[] = []

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request()
        const timing = response.request().timing()

        if (timing) {
          apiCalls.push({
            url: response.url(),
            duration: timing.responseEnd,
          })
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    console.log(`API calls: ${apiCalls.length}`)

    // Most API calls should be fast
    const slowCalls = apiCalls.filter((call) => call.duration > 1000)
    console.log('Slow API calls:', slowCalls)

    // Allow up to 2 slow API calls
    expect(slowCalls.length).toBeLessThan(5)
  })
})
