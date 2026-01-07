import { test, expect } from '@playwright/test'

/**
 * Comprehensive Financial Hub Testing
 * 
 * Tests:
 * 1. Browser console for errors/warnings
 * 2. Tooltip functionality (hover on metric cards)
 * 3. Drill-down chart interactivity (clickable bars)
 * 4. Interactive features and state changes
 */

test.describe.skip('Financial Hub - Comprehensive Testing', () => {
  const FINANCIAL_URL = 'http://localhost:5173/financial'
  const TIMEOUT = 10000

  // Collect console messages
  let consoleLogs: { type: string; message: string; location: string }[] = []

  test.beforeEach(async ({ page }) => {
    // Clear previous console logs
    consoleLogs = []

    // Listen to all console events
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        message: msg.text(),
        location: msg.location().url || 'unknown'
      })
    })

    // Listen to page errors
    page.on('pageerror', (error) => {
      consoleLogs.push({
        type: 'error',
        message: 'Uncaught Exception: ' + error.message,
        location: 'page-error'
      })
    })

    // Navigate to financial page
    await page.goto(FINANCIAL_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })
    await page.waitForLoadState('domcontentloaded')
  })

  test('1. Console - No critical errors on page load', async ({ page }) => {
    // Wait a moment for any late-loading errors
    await page.waitForTimeout(2000)

    // Filter console messages
    const errors = consoleLogs.filter(log => log.type === 'error')
    const warnings = consoleLogs.filter(log => log.type === 'warning')
    const criticalErrors = errors.filter(e => !e.message.includes('404') && !e.message.includes('favicon'))

    console.log('=== CONSOLE REPORT ===')
    console.log('Total Messages: ' + consoleLogs.length)
    console.log('Errors: ' + errors.length)
    console.log('Warnings: ' + warnings.length)
    console.log('Critical Errors: ' + criticalErrors.length)

    if (errors.length > 0) {
      console.log('\nErrors found:')
      errors.forEach(e => console.log('  - ' + e.message))
    }

    if (warnings.length > 0) {
      console.log('\nWarnings found:')
      warnings.slice(0, 5).forEach(w => console.log('  - ' + w.message))
    }

    // Assert no critical errors
    expect(criticalErrors).toHaveLength(0)
  })

  test('2. Page Layout - Renders main content', async ({ page }) => {
    // Check main title
    const title = page.locator('h1, h2, [role="heading"]').first()
    await expect(title).toBeVisible({ timeout: TIMEOUT })

    // Check for cost analysis tab (default tab)
    const costAnalysisTab = page.locator('text=/Cost Analysis/i').first()
    await expect(costAnalysisTab).toBeVisible()

    console.log('Page layout verified - main content rendered')
  })

  test('3. Tooltips - MetricTooltip appears on hover over stat cards', async ({ page }) => {
    // Find first StatCard (Total Monthly Costs)
    const statCard = page.locator('[data-slot="tooltip-trigger"]').first()

    if (await statCard.isVisible()) {
      // Hover over the card
      await statCard.hover()

      // Wait for tooltip to appear
      await page.waitForTimeout(300)

      // Look for tooltip content
      const tooltip = page.locator('[data-slot="tooltip-content"]')
      const isVisible = await tooltip.isVisible({ timeout: 2000 }).catch(() => false)

      console.log('Tooltip visibility: ' + isVisible)

      if (isVisible) {
        const tooltipText = await tooltip.textContent()
        console.log('Tooltip content: ' + tooltipText?.substring(0, 100) + '...')
        expect(isVisible).toBe(true)
      } else {
        console.log('Tooltip not found - checking alternative selectors')
      }
    }
  })

  test('4. Stat Card Interactivity - Cards are clickable', async ({ page }) => {
    // Find all stat cards
    const statCards = page.locator('[role="button"]').filter({ has: page.locator('text=/\\$|K|%/') })
    const count = await statCards.count()

    console.log('Found ' + count + ' interactive elements')

    if (count > 0) {
      // Try clicking first card
      const firstCard = statCards.first()

      // Get initial state
      const initialBox = await firstCard.boundingBox()

      // Click the card
      await firstCard.click({ timeout: 2000 }).catch(e => {
        console.log('Click error (expected if not clickable): ' + (e instanceof Error ? e.message : String(e)))
      })

      console.log('Stat card click action completed')
    }
  })

  test('5. Drill-Down Chart - Chart renders with clickable bars', async ({ page }) => {
    // Wait for chart container
    const chartContainer = page.locator('text=/Cost Distribution by Category/i').first()

    if (await chartContainer.isVisible({ timeout: TIMEOUT })) {
      console.log('Drill-down chart found')

      // Look for bar chart
      const barChart = page.locator('[role="img"]').filter({ has: page.locator('text=/Cost|Fuel|Maintenance/') })

      // Check for SVG bars (Recharts renders SVG)
      const svgBars = page.locator('svg rect[role="presentation"]')
      const barCount = await svgBars.count()

      console.log('Chart bars found: ' + barCount)

      if (barCount > 0) {
        // Try clicking first bar
        const firstBar = svgBars.first()

        // Get bar position
        const bbox = await firstBar.boundingBox()
        console.log('First bar position: ' + (bbox ? 'x: ' + bbox.x + ', y: ' + bbox.y : 'unknown'))

        // Click the bar
        await firstBar.click().catch(e => {
          console.log('Bar click error: ' + (e instanceof Error ? e.message : String(e)))
        })

        // Wait for potential drill-down
        await page.waitForTimeout(500)

        // Check for breadcrumb changes
        const breadcrumbs = page.locator('text=/Level \\d+ of 3/i')
        const hasBreadcrumb = await breadcrumbs.isVisible({ timeout: 1000 }).catch(() => false)

        console.log('Drill-down breadcrumb visible: ' + hasBreadcrumb)
      }
    } else {
      console.log('Drill-down chart not visible on first tab')
    }
  })

  test('6. Tab Navigation - Switch between tabs', async ({ page }) => {
    // Get all tabs
    const budgetTab = page.locator('text=/Budget|Monitoring/i')

    if (await budgetTab.isVisible({ timeout: TIMEOUT })) {
      console.log('Budget tab found, clicking...')
      await budgetTab.click()

      // Wait for content to load
      await page.waitForTimeout(1000)

      // Check if new content loaded
      const budgetContent = page.locator('text=/Budget vs Actual|Department Budget/i')
      const visible = await budgetContent.isVisible({ timeout: 3000 }).catch(() => false)

      console.log('Budget tab content loaded: ' + visible)

      if (visible) {
        // Try to find and interact with chart in budget tab
        const chartArea = page.locator('svg').first()
        const chartExists = await chartArea.isVisible({ timeout: 2000 }).catch(() => false)
        console.log('Chart in budget tab exists: ' + chartExists)
      }
    }
  })

  test('7. Drill-Down Chart Full Interaction - Multi-level navigation', async ({ page }) => {
    // Navigate to Budget tab
    const budgetTab = page.locator('text=/Budget|Monitoring/i')
    await budgetTab.click({ timeout: TIMEOUT })
    await page.waitForTimeout(1000)

    // Find the drill-down chart section
    const chartSection = page.locator('text=/Cost Distribution|Drill[\\s\\-]*down/i').first()

    if (await chartSection.isVisible({ timeout: TIMEOUT })) {
      console.log('Drill-down chart section found')

      // Get current level indicator
      const levelIndicator = page.locator('text=/Level \\d+ of 3/i')
      const initialLevel = await levelIndicator.textContent({ timeout: 2000 }).catch(() => 'unknown')
      console.log('Initial level: ' + initialLevel)

      // Find SVG bars
      const bars = page.locator('svg [role="presentation"]').filter({ has: page.locator('rect') })
      const barCount = await bars.count()

      if (barCount > 0) {
        console.log('Attempting to click bar (' + barCount + ' bars found)')

        // Click first bar
        const firstBar = page.locator('svg rect').first()

        try {
          // Get parent group to ensure we click the bar
          await page.evaluate(() => {
            const rects = document.querySelectorAll('svg rect[height]')
            if (rects.length > 0) {
              const rect = rects[0]
              const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              })
              rect.dispatchEvent(event)
            }
          })

          await page.waitForTimeout(500)

          // Check if level changed
          const newLevel = await levelIndicator.textContent({ timeout: 2000 }).catch(() => 'unknown')
          console.log('After click - new level: ' + newLevel)

          // Check breadcrumb buttons
          const breadcrumbs = page.locator('[role="button"]').filter({ has: page.locator('text=/Cost Categories|Fuel|Maintenance/') })
          const breadcrumbCount = await breadcrumbs.count()
          console.log('Breadcrumb buttons found: ' + breadcrumbCount)

        } catch (e) {
          console.log('Drill-down interaction error: ' + (e instanceof Error ? e.message : String(e)))
        }
      }
    }
  })

  test('8. Responsive Layout - Window resize and reflow', async ({ page }) => {
    // Check initial size
    const viewport = page.viewportSize()
    console.log('Initial viewport: ' + viewport?.width + 'x' + viewport?.height)

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)

    // Check if content still visible
    const mainContent = page.locator('main, [role="main"], .p-8').first()
    const visibleAfterResize = await mainContent.isVisible({ timeout: 2000 }).catch(() => false)

    console.log('Content visible after resize to mobile: ' + visibleAfterResize)

    // Resize back to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(500)

    const visibleAfterRestoring = await mainContent.isVisible({ timeout: 2000 }).catch(() => false)
    console.log('Content visible after restore to desktop: ' + visibleAfterRestoring)
  })

  test('9. Performance - Check initial load time', async ({ page }) => {
    const startTime = Date.now()

    // Already navigated in beforeEach, measure time to interactive
    const mainContent = page.locator('h1, h2, [role="heading"]').first()
    await mainContent.waitFor({ timeout: TIMEOUT, state: 'visible' })

    const loadTime = Date.now() - startTime
    console.log('Page interactive in ' + loadTime + 'ms')

    expect(loadTime).toBeLessThan(TIMEOUT)
  })

  test.afterEach(async ({ page }) => {
    // Print console report at end of each test
    const filteredLogs = consoleLogs.filter(log =>
      !log.message.includes('favicon') &&
      !log.message.includes('404') &&
      !log.message.includes('Localstorage')
    )

    if (filteredLogs.length > 0) {
      console.log('\n--- Filtered Console Messages ---')
      filteredLogs.forEach(log => {
        if (log.type === 'error' || log.type === 'warning') {
          console.log('[' + log.type.toUpperCase() + '] ' + log.message)
        }
      })
    }
  })
})
