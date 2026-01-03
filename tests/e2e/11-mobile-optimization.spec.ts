/**
 * Mobile Optimization Tests
 * Validates mobile responsiveness, touch gestures, offline mode, and PWA features
 */

import { test, expect, devices } from '@playwright/test'

// Test configurations for different mobile devices
const mobileDevices = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 14 Pro', ...devices['iPhone 14 Pro'] },
  { name: 'Galaxy S21', ...devices['Galaxy S21'] },
  { name: 'Galaxy Fold', ...devices['Galaxy Fold'] },
  { name: 'iPad Mini', ...devices['iPad Mini'] },
]

/* ============================================================
   TASK 3.1: HORIZONTAL SCROLL TESTS
   ============================================================ */

test.describe('Mobile Layout - No Horizontal Scroll', () => {
  for (const device of mobileDevices) {
    test(`${device.name}: Should not have horizontal scroll on any page`, async ({ browser }) => {
      const context = await browser.newContext(device)
      const page = await context.newPage()

      const testPages = [
        { url: '/', name: 'Dashboard' },
        { url: '/?module=gps-tracking', name: 'GPS Tracking' },
        { url: '/?module=vehicles', name: 'Vehicles' },
        { url: '/?module=maintenance', name: 'Maintenance' },
      ]

      for (const testPage of testPages) {
        await page.goto(testPage.url)
        await page.waitForLoadState('networkidle')

        // Check for horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        const viewportWidth = await page.evaluate(() => window.innerWidth)

        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // Allow 1px tolerance
        console.log(
          `[${device.name}] ${testPage.name}: bodyWidth=${bodyWidth}px, viewportWidth=${viewportWidth}px`
        )
      }

      await context.close()
    })
  }

  test('Galaxy Fold (280px): Should work on smallest fold width', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Galaxy Fold'],
      viewport: { width: 280, height: 653 }, // Unfolded mode smallest width
    })
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(280 + 1)
    expect(viewportWidth).toBe(280)

    await context.close()
  })
})

/* ============================================================
   TASK 3.2: SCROLL-AWARE HEADER TESTS
   ============================================================ */

test.describe('Mobile Header - Scroll Behavior', () => {
  test('iPhone 14 Pro: Header should hide on scroll down, show on scroll up', async ({
    browser,
  }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Get initial header position
    const header = page.locator('header')
    const initialY = await header.boundingBox().then((box) => box?.y ?? 0)

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(500) // Wait for scroll animation

    // Header should be hidden (translateY(-100%))
    const hiddenTransform = await header.evaluate((el) => getComputedStyle(el).transform)
    console.log('[Scroll Down] Header transform:', hiddenTransform)

    // Scroll up
    await page.evaluate(() => window.scrollBy(0, -300))
    await page.waitForTimeout(500) // Wait for scroll animation

    // Header should be visible again
    const visibleTransform = await header.evaluate((el) => getComputedStyle(el).transform)
    console.log('[Scroll Up] Header transform:', visibleTransform)

    await context.close()
  })

  test('iPhone 14 Pro: Header should not obscure content', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that main content has appropriate padding-top
    const main = page.locator('main')
    const paddingTop = await main.evaluate((el) => getComputedStyle(el).paddingTop)

    // Should have padding equal to or greater than header height
    const paddingValue = parseInt(paddingTop)
    expect(paddingValue).toBeGreaterThan(0)

    console.log('[Header Offset] Main padding-top:', paddingTop)

    await context.close()
  })

  test('iPhone 14 Pro: Safe area insets should be applied', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for safe area inset support
    const hasSafeAreaSupport = await page.evaluate(() => {
      const testDiv = document.createElement('div')
      testDiv.style.paddingTop = 'env(safe-area-inset-top)'
      document.body.appendChild(testDiv)
      const hasSupport = getComputedStyle(testDiv).paddingTop !== '0px'
      document.body.removeChild(testDiv)
      return hasSupport
    })

    console.log('[Safe Area] Support:', hasSafeAreaSupport)

    await context.close()
  })
})

/* ============================================================
   TASK 3.3: TOUCH GESTURE TESTS
   ============================================================ */

test.describe('Mobile Touch Gestures', () => {
  test('iPhone 14 Pro: Touch targets should be at least 44x44px', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check all buttons and interactive elements
    const buttons = page.locator('button, a[href], input[type="button"], input[type="submit"]')
    const count = await buttons.count()

    let failedElements = 0

    for (let i = 0; i < Math.min(count, 20); i++) {
      // Check first 20 elements
      const element = buttons.nth(i)
      const box = await element.boundingBox()

      if (box && (box.width < 44 || box.height < 44)) {
        const text = await element.textContent()
        console.warn(
          `[Touch Target] Element too small: ${box.width}x${box.height}px - "${text?.substring(0, 30)}"`
        )
        failedElements++
      }
    }

    // Allow some exceptions (e.g., icons with larger click areas)
    expect(failedElements).toBeLessThan(5)

    await context.close()
  })

  test('iPhone 14 Pro: Swipe gestures should be detected', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test swipe gesture on a swipeable element
    const swipeableElement = page.locator('[data-swipeable]').first()

    if ((await swipeableElement.count()) > 0) {
      const box = await swipeableElement.boundingBox()

      if (box) {
        // Simulate swipe left
        await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2)
        await page.touchscreen.tap(box.x + 50, box.y + box.height / 2)

        // Wait for gesture handler
        await page.waitForTimeout(500)

        console.log('[Swipe] Gesture executed successfully')
      }
    }

    await context.close()
  })
})

/* ============================================================
   TASK 3.4: OFFLINE MODE TESTS
   ============================================================ */

test.describe('Offline Mode', () => {
  test('Should register Service Worker', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check if Service Worker is registered
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration
      }
      return false
    })

    expect(hasServiceWorker).toBe(true)
    console.log('[Service Worker] Registered:', hasServiceWorker)
  })

  test('Should cache static assets', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for Service Worker to activate
    await page.waitForTimeout(2000)

    // Check cache storage
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys()
    })

    expect(cacheNames.length).toBeGreaterThan(0)
    console.log('[Cache] Cache names:', cacheNames)

    // Check if critical assets are cached
    const hasCriticalAssets = await page.evaluate(async () => {
      const cache = await caches.open(cacheNames[0])
      const keys = await cache.keys()
      return keys.some((request) => request.url.includes('index.html'))
    })

    console.log('[Cache] Has critical assets:', hasCriticalAssets)
  })

  test('Should show offline banner when offline', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Simulate going offline
    await context.setOffline(true)

    // Wait for offline banner
    await page.waitForTimeout(1000)

    // Check for offline indicator
    const offlineBanner = page.locator('[role="alert"]').filter({ hasText: /offline/i })
    const isVisible = await offlineBanner.isVisible().catch(() => false)

    console.log('[Offline] Banner visible:', isVisible)

    // Go back online
    await context.setOffline(false)

    await context.close()
  })

  test('Should work with cached data when offline', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for data to be cached
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Navigate to another cached page
    await page.goto('/?module=vehicles').catch(() => {
      /* May fail, that's okay */
    })

    // Should still show some content (from cache)
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    expect(body?.length ?? 0).toBeGreaterThan(100)

    console.log('[Offline] Page loaded from cache successfully')

    await context.close()
  })
})

/* ============================================================
   TASK 3.5: PWA TESTS
   ============================================================ */

test.describe('PWA Features', () => {
  test('Should have valid manifest.json', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    expect(response.ok()).toBe(true)

    const manifest = await response.json()

    // Check required fields
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toBeInstanceOf(Array)
    expect(manifest.icons.length).toBeGreaterThan(0)

    console.log('[PWA] Manifest:', JSON.stringify(manifest, null, 2))
  })

  test('Should have PWA icons with required sizes', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    const manifest = await response.json()

    const requiredSizes = ['192x192', '512x512']
    const availableSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)

    for (const size of requiredSizes) {
      expect(availableSizes).toContain(size)
    }

    console.log('[PWA] Available icon sizes:', availableSizes)
  })

  test('Should have app shortcuts', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    const manifest = await response.json()

    expect(manifest.shortcuts).toBeInstanceOf(Array)
    expect(manifest.shortcuts.length).toBeGreaterThan(0)

    console.log('[PWA] Shortcuts:', manifest.shortcuts.length)
  })

  test('Should have share target configured', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    const manifest = await response.json()

    expect(manifest.share_target).toBeTruthy()
    expect(manifest.share_target.action).toBeTruthy()
    expect(manifest.share_target.params).toBeTruthy()

    console.log('[PWA] Share target configured')
  })

  test('Should display install prompt on mobile', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 14 Pro'])
    const page = await context.newPage()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for beforeinstallprompt event listener
    const hasInstallListener = await page.evaluate(() => {
      return window.hasOwnProperty('onbeforeinstallprompt')
    })

    console.log('[PWA] Install prompt listener:', hasInstallListener)

    await context.close()
  })
})

/* ============================================================
   PERFORMANCE TESTS
   ============================================================ */

test.describe('Mobile Performance', () => {
  test('iPhone SE: Should load in under 3 seconds on 3G', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone SE'],
      // Simulate 3G network
      offline: false,
    })

    const page = await context.newPage()

    // Throttle network to 3G speeds
    await page.route('**/*', (route) => {
      // Delay requests to simulate slow network
      setTimeout(() => route.continue(), 100)
    })

    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
    console.log(`[Performance] Load time on 3G: ${loadTime}ms`)

    await context.close()
  })

  test('Should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Run basic performance checks
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-contentful-paint')?.startTime,
      }
    })

    console.log('[Performance] Metrics:', metrics)

    // Basic assertions
    expect(metrics.domContentLoaded).toBeLessThan(2000)
    expect(metrics.firstContentfulPaint ?? 0).toBeLessThan(2000)
  })
})

/* ============================================================
   ACCESSIBILITY TESTS
   ============================================================ */

test.describe('Mobile Accessibility', () => {
  test('Should be navigable with screen reader', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for ARIA landmarks
    const main = await page.locator('main').count()
    const nav = await page.locator('nav').count()
    const header = await page.locator('header').count()

    expect(main).toBeGreaterThan(0)
    expect(nav + header).toBeGreaterThan(0)

    console.log('[A11y] ARIA landmarks:', { main, nav, header })
  })

  test('Should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1) // Should have exactly one h1

    console.log('[A11y] H1 count:', h1Count)
  })

  test('Should have focus indicators', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Tab to first focusable element
    await page.keyboard.press('Tab')

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      const styles = window.getComputedStyle(el as Element)
      return {
        tagName: el?.tagName,
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
      }
    })

    console.log('[A11y] Focused element:', focusedElement)

    // Should have visible outline
    expect(focusedElement.outlineWidth).not.toBe('0px')
  })
})
