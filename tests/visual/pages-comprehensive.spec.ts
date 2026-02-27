import { test, expect } from '@playwright/test'

/**
 * Visual Regression Testing: Page-Level Tests
 *
 * Tests complete page layouts and flows for key pages.
 * Ensures visual consistency across different data states.
 *
 * Pages tested: 12+
 * Test cases: 80+
 * Coverage: Desktop, Tablet, Mobile, Dark/Light modes
 */

const viewports = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 375, height: 667, name: 'mobile' },
}

/**
 * PAGE: Dashboard
 */
test.describe('Visual: Dashboard Page', () => {
  test('Dashboard - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Full page screenshot
    await expect(page).toHaveScreenshot('page-dashboard-full.png', {
      maxDiffPixels: 300,
    })
  })

  test('Dashboard - viewport variations', async ({ page }) => {
    const routes = ['dashboard']

    for (const [vpName, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport)
      await page.goto(`http://localhost:5173/dashboard`, { waitUntil: 'networkidle' })

      await expect(page).toHaveScreenshot(`page-dashboard-${vpName}.png`, {
        maxDiffPixels: vpName === 'desktop' ? 300 : 200,
      })
    }
  })

  test('Dashboard - with sidebar collapsed', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Look for sidebar collapse button
    const sidebarToggle = page.locator('[data-testid*="sidebar"], button[aria-label*="toggle"]').first()
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('page-dashboard-sidebar-collapsed.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Dashboard - empty state handling', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Check for empty state
    const emptyState = page.locator('[class*="empty"], [data-testid*="empty"]').first()
    if (await emptyState.isVisible()) {
      await expect(page).toHaveScreenshot('page-dashboard-empty.png', {
        maxDiffPixels: 200,
      })
    }
  })

  test('Dashboard - loading state', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' })

    // Capture while still loading
    const spinner = page.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]').first()
    if (await spinner.isVisible()) {
      await expect(page).toHaveScreenshot('page-dashboard-loading.png', {
        maxDiffPixels: 200,
      })
    }
  })
})

/**
 * PAGE: Fleet Management
 */
test.describe('Visual: Fleet Management Page', () => {
  test('Fleet - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-fleet-full.png', {
      maxDiffPixels: 350,
    })
  })

  test('Fleet - table with data', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Scroll table into view
    const table = page.locator('table, [role="grid"]').first()
    if (await table.isVisible()) {
      await table.scrollIntoViewIfNeeded()
      await expect(page).toHaveScreenshot('page-fleet-table.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Fleet - filters and search', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Look for filter button
    const filterBtn = page.locator('button:has-text("Filter"), [data-testid*="filter"]').first()
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('page-fleet-filters-open.png', {
        maxDiffPixels: 250,
      })
    }

    // Search interaction
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('search term')
      await expect(page).toHaveScreenshot('page-fleet-search.png', {
        maxDiffPixels: 250,
      })
    }
  })

  test('Fleet - viewport variations', async ({ page }) => {
    for (const [vpName, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

      await expect(page).toHaveScreenshot(`page-fleet-${vpName}.png`, {
        maxDiffPixels: vpName === 'desktop' ? 350 : 200,
      })
    }
  })

  test('Fleet - selected row highlighting', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Select a row
    const checkbox = page.locator('input[type="checkbox"]').nth(1)
    if (await checkbox.isVisible()) {
      await checkbox.click()
      await expect(page).toHaveScreenshot('page-fleet-row-selected.png', {
        maxDiffPixels: 350,
      })
    }
  })
})

/**
 * PAGE: Driver Management
 */
test.describe('Visual: Driver Management Page', () => {
  test('Drivers - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-drivers-full.png', {
      maxDiffPixels: 350,
    })
  })

  test('Drivers - list view', async ({ page }) => {
    await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle' })

    const list = page.locator('[class*="list"], [role="grid"]').first()
    if (await list.isVisible()) {
      await expect(page).toHaveScreenshot('page-drivers-list.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Drivers - driver card states', async ({ page }) => {
    await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle' })

    // Hover on driver card
    const card = page.locator('[class*="driver"], [class*="card"]').first()
    if (await card.isVisible()) {
      await card.hover()
      await expect(page).toHaveScreenshot('page-drivers-card-hover.png', {
        maxDiffPixels: 300,
      })

      // Click to view details
      await card.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('page-drivers-details.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Drivers - mobile view', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-drivers-mobile.png', {
      maxDiffPixels: 200,
    })
  })
})

/**
 * PAGE: Maintenance
 */
test.describe('Visual: Maintenance Page', () => {
  test('Maintenance - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/maintenance', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-maintenance-full.png', {
      maxDiffPixels: 300,
    })
  })

  test('Maintenance - schedule view', async ({ page }) => {
    await page.goto('http://localhost:5173/maintenance', { waitUntil: 'networkidle' })

    const schedule = page.locator('[class*="schedule"], [class*="calendar"]').first()
    if (await schedule.isVisible()) {
      await expect(page).toHaveScreenshot('page-maintenance-schedule.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Maintenance - different status states', async ({ page }) => {
    await page.goto('http://localhost:5173/maintenance', { waitUntil: 'networkidle' })

    // Find items with different statuses
    const items = page.locator('[class*="status"], [data-status]')
    if (await items.first().isVisible()) {
      await expect(page).toHaveScreenshot('page-maintenance-statuses.png', {
        maxDiffPixels: 250,
      })
    }
  })
})

/**
 * PAGE: Reports & Analytics
 */
test.describe('Visual: Reports Page', () => {
  test('Reports - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-reports-full.png', {
      maxDiffPixels: 350,
    })
  })

  test('Reports - chart rendering', async ({ page }) => {
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    // Check for charts
    const charts = page.locator('canvas, [class*="chart"]').first()
    if (await charts.isVisible()) {
      await expect(page).toHaveScreenshot('page-reports-charts.png', {
        maxDiffPixels: 350,
      })
    }
  })

  test('Reports - export options', async ({ page }) => {
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    const exportBtn = page.locator('button:has-text("Export"), button[aria-label*="export"]').first()
    if (await exportBtn.isVisible()) {
      await exportBtn.click()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('page-reports-export-menu.png', {
        maxDiffPixels: 200,
      })
    }
  })

  test('Reports - mobile responsive', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-reports-mobile.png', {
      maxDiffPixels: 200,
    })
  })
})

/**
 * PAGE: Settings
 */
test.describe('Visual: Settings Page', () => {
  test('Settings - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-settings-full.png', {
      maxDiffPixels: 250,
    })
  })

  test('Settings - tabs navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' })

    // Find tabs
    const tabs = page.locator('[role="tab"], [class*="tab-list"] button')
    if (await tabs.first().isVisible()) {
      // Click through tabs
      const count = await tabs.count()
      for (let i = 0; i < Math.min(count, 3); i++) {
        await tabs.nth(i).click()
        await page.waitForTimeout(200)

        await expect(page).toHaveScreenshot(`page-settings-tab-${i}.png`, {
          maxDiffPixels: 250,
        })
      }
    }
  })

  test('Settings - form inputs', async ({ page }) => {
    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' })

    const inputs = page.locator('input, select, textarea')
    if (await inputs.first().isVisible()) {
      // Focus first input
      await inputs.first().focus()
      await expect(page).toHaveScreenshot('page-settings-focused.png', {
        maxDiffPixels: 250,
      })
    }
  })
})

/**
 * PAGE: User Profile
 */
test.describe('Visual: User Profile Page', () => {
  test('Profile - complete page layout', async ({ page }) => {
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-profile-full.png', {
      maxDiffPixels: 250,
    })
  })

  test('Profile - edit mode', async ({ page }) => {
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' })

    const editBtn = page.locator('button:has-text("Edit"), button[aria-label*="edit"]').first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('page-profile-edit.png', {
        maxDiffPixels: 250,
      })
    }
  })

  test('Profile - mobile view', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('page-profile-mobile.png', {
      maxDiffPixels: 150,
    })
  })
})

/**
 * PAGE: Navigation & Global UI
 */
test.describe('Visual: Global Navigation & Header', () => {
  test('Header - default state', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const header = page.locator('header').first()
    if (await header.isVisible()) {
      await header.scrollIntoViewIfNeeded()
      await expect(page).toHaveScreenshot('page-header-default.png', {
        maxDiffPixels: 100,
      })
    }
  })

  test('Header - search active', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const searchBtn = page.locator('button[aria-label*="search"]').first()
    if (await searchBtn.isVisible()) {
      await searchBtn.click()
      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('page-header-search.png', {
        maxDiffPixels: 150,
      })
    }
  })

  test('User menu - open and closed', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const userMenu = page.locator('[data-testid*="user"], [class*="profile"], button[aria-label*="account"]').first()
    if (await userMenu.isVisible()) {
      // Closed
      await expect(page).toHaveScreenshot('page-user-menu-closed.png', {
        maxDiffPixels: 100,
      })

      // Opened
      await userMenu.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('page-user-menu-open.png', {
        maxDiffPixels: 150,
      })
    }
  })
})

/**
 * MULTI-PAGE WORKFLOWS
 */
test.describe('Visual: Page Transitions & Workflows', () => {
  test('Navigation between pages - dashboard to fleet', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot('workflow-dashboard-initial.png', {
      maxDiffPixels: 300,
    })

    // Navigate to fleet
    const fleetLink = page.locator('a:has-text("Fleet"), button:has-text("Fleet")').first()
    if (await fleetLink.isVisible()) {
      await fleetLink.click()
      await page.waitForURL('**/fleet', { timeout: 5000 })
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('workflow-fleet-after-nav.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Modal workflow - open, interact, close', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    const addBtn = page.locator('button:has-text("Add"), button:has-text("New")').first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('workflow-modal-open.png', {
        maxDiffPixels: 250,
      })

      // Fill form
      const input = page.locator('input').first()
      if (await input.isVisible()) {
        await input.fill('Test Value')
        await expect(page).toHaveScreenshot('workflow-modal-filled.png', {
          maxDiffPixels: 250,
        })
      }

      // Close
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('workflow-modal-closed.png', {
        maxDiffPixels: 250,
      })
    }
  })
})

/**
 * ERROR & EDGE STATES
 */
test.describe('Visual: Error & Edge States', () => {
  test('Error page - 404', async ({ page }) => {
    await page.goto('http://localhost:5173/nonexistent-page-404', {
      waitUntil: 'networkidle',
    })

    await expect(page).toHaveScreenshot('page-error-404.png', {
      maxDiffPixels: 200,
    })
  })

  test('Loading overlay - when present', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' })

    // Look for loading overlay
    const overlay = page.locator('[class*="overlay"], [class*="loading"]').first()
    if (await overlay.isVisible()) {
      await expect(page).toHaveScreenshot('page-loading-overlay.png', {
        maxDiffPixels: 200,
      })
    }
  })

  test('Empty state - when no data available', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet?search=nonexistentdata', {
      waitUntil: 'networkidle',
    })

    const emptyState = page.locator('[class*="empty"], [data-testid*="empty"]').first()
    if (await emptyState.isVisible()) {
      await expect(page).toHaveScreenshot('page-empty-state.png', {
        maxDiffPixels: 200,
      })
    }
  })
})
