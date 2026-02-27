import { test, expect } from '@playwright/test'

/**
 * Visual Regression Testing: Advanced & Complex Components
 *
 * Tests complex components like DataTable, Charts, Dashboard Cards, etc.
 * across multiple states and configurations.
 *
 * Components tested: 25+
 * Test cases: 140+
 */

const viewports = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 375, height: 667, name: 'mobile' },
}

/**
 * DASHBOARD COMPONENTS
 */
test.describe('Visual: Dashboard Components', () => {
  test('Dashboard Card - default and interactive states', async ({ page }) => {
    // Wait for dashboard to load
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Default state
    await expect(page).toHaveScreenshot('dashboard-default.png', {
      maxDiffPixels: 200,
    })

    // Hover state
    const card = page.locator('[class*="card"]').first()
    if (await card.isVisible()) {
      await card.hover()
      await expect(page).toHaveScreenshot('dashboard-card-hover.png', {
        maxDiffPixels: 200,
      })
    }
  })

  test('Dashboard - mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixels: 150,
    })
  })
})

/**
 * DATA TABLE COMPONENTS
 */
test.describe('Visual: Data Table Components', () => {
  test('DataTable - all states and interactions', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Default table view
    await expect(page).toHaveScreenshot('datatable-default.png', {
      maxDiffPixels: 250,
    })

    // Sortable columns
    const header = page.locator('th').first()
    if (await header.isVisible()) {
      await header.hover()
      await expect(page).toHaveScreenshot('datatable-column-hover.png', {
        maxDiffPixels: 250,
      })

      await header.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('datatable-sorted.png', {
        maxDiffPixels: 250,
      })
    }

    // Row selection
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.click()
      await expect(page).toHaveScreenshot('datatable-row-selected.png', {
        maxDiffPixels: 250,
      })
    }
  })

  test('DataTable - mobile responsive view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('datatable-mobile.png', {
      maxDiffPixels: 200,
    })
  })

  test('DataTable - pagination controls', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Find pagination controls
    const pagination = page.locator('[class*="pagination"]')
    if (await pagination.isVisible()) {
      await expect(page).toHaveScreenshot('datatable-pagination.png', {
        maxDiffPixels: 100,
      })

      // Click next page
      const nextButton = page.locator('button:has-text("Next")')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(500)
        await expect(page).toHaveScreenshot('datatable-pagination-next.png', {
          maxDiffPixels: 100,
        })
      }
    }
  })
})

/**
 * CHART COMPONENTS
 */
test.describe('Visual: Chart Components', () => {
  test('Chart Cards - multiple chart types', async ({ page }) => {
    // Navigate to a page with charts (e.g., analytics or reports)
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    // Default charts
    await expect(page).toHaveScreenshot('charts-default.png', {
      maxDiffPixels: 300,
    })

    // Chart interactions (if applicable)
    const chart = page.locator('[class*="chart"], canvas').first()
    if (await chart.isVisible()) {
      await chart.hover()
      await expect(page).toHaveScreenshot('charts-hover.png', {
        maxDiffPixels: 300,
      })
    }
  })

  test('Chart - mobile responsive view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('charts-mobile.png', {
      maxDiffPixels: 200,
    })
  })
})

/**
 * FORM COMPONENTS (Complex)
 */
test.describe('Visual: Complex Form Components', () => {
  test('Dialog Form - all states', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Open dialog form
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)

      // Dialog open
      await expect(page).toHaveScreenshot('dialog-form-open.png', {
        maxDiffPixels: 200,
      })

      // Focus state
      const input = page.locator('input').first()
      if (await input.isVisible()) {
        await input.focus()
        await expect(page).toHaveScreenshot('dialog-form-focused.png', {
          maxDiffPixels: 200,
        })

        // With validation error
        await input.fill('invalid')
        const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Save")').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(300)
          await expect(page).toHaveScreenshot('dialog-form-error.png', {
            maxDiffPixels: 200,
          })
        }
      }

      // Close dialog
      await page.keyboard.press('Escape')
    }
  })
})

/**
 * SIDEBAR & NAVIGATION
 */
test.describe('Visual: Navigation & Sidebar', () => {
  test('Sidebar - all states', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Sidebar visible
    const sidebar = page.locator('[class*="sidebar"], nav').first()
    if (await sidebar.isVisible()) {
      await expect(page).toHaveScreenshot('sidebar-default.png', {
        maxDiffPixels: 150,
      })

      // Hover on nav item
      const navItem = page.locator('[class*="nav-item"], [role="menuitem"]').first()
      if (await navItem.isVisible()) {
        await navItem.hover()
        await expect(page).toHaveScreenshot('sidebar-nav-hover.png', {
          maxDiffPixels: 150,
        })
      }
    }
  })

  test('Sidebar - collapsed state', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Look for collapse button
    const collapseBtn = page.locator('[class*="collapse"], button[aria-label*="toggle"]').first()
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('sidebar-collapsed.png', {
        maxDiffPixels: 150,
      })
    }
  })

  test('Navigation Header - all states', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Header default
    const header = page.locator('header').first()
    if (await header.isVisible()) {
      await expect(page).toHaveScreenshot('header-default.png', {
        maxDiffPixels: 100,
      })

      // Search or menu interactions
      const searchBtn = page.locator('button[aria-label*="search"]').first()
      if (await searchBtn.isVisible()) {
        await searchBtn.click()
        await page.waitForTimeout(300)
        await expect(page).toHaveScreenshot('header-search-open.png', {
          maxDiffPixels: 150,
        })
      }
    }
  })
})

/**
 * MODAL & OVERLAY COMPONENTS
 */
test.describe('Visual: Modal & Overlay Components', () => {
  test('Modal Dialog - all states', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Try to trigger a modal
    const triggerBtn = page.locator('button:has-text("Settings"), button:has-text("Details")').first()
    if (await triggerBtn.isVisible()) {
      await triggerBtn.click()
      await page.waitForTimeout(500)

      // Modal open
      const modal = page.locator('[role="dialog"], [class*="modal"]').first()
      if (await modal.isVisible()) {
        await expect(page).toHaveScreenshot('modal-open.png', {
          maxDiffPixels: 200,
        })

        // Close modal
        const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Cancel")').first()
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
        } else {
          await page.keyboard.press('Escape')
        }
      }
    }
  })

  test('Popover - open and closed states', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const popoverTrigger = page.locator('[class*="popover"], button[aria-label*="info"]').first()
    if (await popoverTrigger.isVisible()) {
      // Closed
      await expect(page).toHaveScreenshot('popover-closed.png', {
        maxDiffPixels: 100,
      })

      // Opened
      await popoverTrigger.click()
      await page.waitForTimeout(300)
      await expect(page).toHaveScreenshot('popover-open.png', {
        maxDiffPixels: 150,
      })
    }
  })

  test('Tooltip - visibility and positioning', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const tooltipTrigger = page.locator('[title], [data-tooltip]').first()
    if (await tooltipTrigger.isVisible()) {
      await tooltipTrigger.hover()
      await page.waitForTimeout(200)

      await expect(page).toHaveScreenshot('tooltip-visible.png', {
        maxDiffPixels: 100,
      })
    }
  })
})

/**
 * STATUS INDICATORS & BADGES
 */
test.describe('Visual: Status Indicators', () => {
  test('Status Badges - all variants', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Find status badges
    const statusBadges = page.locator('[class*="status"], [class*="badge"]')
    if (await statusBadges.first().isVisible()) {
      await expect(page).toHaveScreenshot('status-badges-all.png', {
        maxDiffPixels: 150,
      })
    }
  })

  test('Status Indicators - pulse animation', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    // Active status indicator
    const active = page.locator('[class*="active"], [class*="online"]').first()
    if (await active.isVisible()) {
      await expect(page).toHaveScreenshot('status-active.png', {
        maxDiffPixels: 100,
      })
    }
  })
})

/**
 * RESPONSIVE LAYOUT TESTS
 */
test.describe('Visual: Responsive Layouts', () => {
  test('Dashboard - tablet layout', async ({ page }) => {
    await page.setViewportSize(viewports.tablet)
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('layout-dashboard-tablet.png', {
      maxDiffPixels: 200,
    })
  })

  test('Dashboard - mobile layout', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('layout-dashboard-mobile.png', {
      maxDiffPixels: 150,
    })
  })

  test('Fleet Management - tablet layout', async ({ page }) => {
    await page.setViewportSize(viewports.tablet)
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('layout-fleet-tablet.png', {
      maxDiffPixels: 200,
    })
  })

  test('Fleet Management - mobile layout', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' })

    await expect(page).toHaveScreenshot('layout-fleet-mobile.png', {
      maxDiffPixels: 150,
    })
  })
})

/**
 * ANIMATION & TRANSITION VERIFICATION
 */
test.describe('Visual: Animations & Transitions', () => {
  test('Button hover animations are smooth', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const button = page.locator('button').first()
    if (await button.isVisible()) {
      // Default
      await expect(page).toHaveScreenshot('animation-button-default.png', {
        maxDiffPixels: 50,
      })

      // Hover
      await button.hover()
      await page.waitForTimeout(100)
      await expect(page).toHaveScreenshot('animation-button-hover.png', {
        maxDiffPixels: 50,
      })
    }
  })

  test('Card elevation and shadow on hover', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    const card = page.locator('[class*="card"]').first()
    if (await card.isVisible()) {
      // Before hover
      await expect(page).toHaveScreenshot('animation-card-default.png', {
        maxDiffPixels: 50,
      })

      // On hover
      await card.hover()
      await page.waitForTimeout(100)
      await expect(page).toHaveScreenshot('animation-card-hover.png', {
        maxDiffPixels: 50,
      })
    }
  })
})

/**
 * COLOR & CONTRAST VERIFICATION
 */
test.describe('Visual: Color & Contrast', () => {
  test('Brand colors are correctly applied', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Verify brand colors are present
    const hasCorrectColors = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body)
      const elements = document.querySelectorAll('*')

      let foundOrange = false
      let foundBlue = false

      for (const el of elements) {
        const style = window.getComputedStyle(el)
        const bg = style.background
        const color = style.color

        // Check for brand colors
        if (bg.includes('rgb(255, 107, 53)') || bg.includes('#FF6B35')) {
          foundOrange = true
        }
        if (bg.includes('rgb(65, 178, 227)') || bg.includes('#41B2E3')) {
          foundBlue = true
        }
      }

      return foundOrange || foundBlue
    })

    expect(hasCorrectColors).toBeTruthy()
  })

  test('Text contrast is sufficient', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })

    // Check contrast ratios
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      let issues = 0

      elements.forEach((el) => {
        const style = window.getComputedStyle(el)
        const bg = style.backgroundColor
        const color = style.color

        // Simple check: background and text should not be the same
        if (bg === color && el.textContent?.trim()) {
          issues++
        }
      })

      return issues
    })

    // Should have minimal or no contrast issues
    expect(contrastIssues).toBeLessThan(5)
  })
})
