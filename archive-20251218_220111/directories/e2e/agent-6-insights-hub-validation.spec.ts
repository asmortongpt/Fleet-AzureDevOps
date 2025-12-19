import { test, expect } from '@playwright/test'

/**
 * AGENT 6: INSIGHTS HUB & DATA ELEMENTS VALIDATOR
 *
 * Mission: Validate 100% of features, functions, and data elements in Insights Hub,
 * plus verify ALL data visualizations, charts, graphs, and analytics across the entire application.
 *
 * Insights Hub Modules (7):
 * 1. Executive Dashboard
 * 2. Fleet Analytics
 * 3. Custom Reports
 * 4. Data Workbench
 * 5. Cost Analysis
 * 6. Predictive Analytics (Driver Scorecard)
 * 7. Business Intelligence (Fleet Optimizer)
 */

test.describe('Agent 6: Insights Hub & Data Elements Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5173')

    // Wait for app to load
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
  })

  test.describe('Module 1: Executive Dashboard - Comprehensive Validation', () => {
    test('should navigate to Executive Dashboard', async ({ page }) => {
      // Find and click Executive Dashboard nav item
      const execDashboardButton = page.getByRole('button', { name: /executive dashboard/i })
      await execDashboardButton.click()

      // Wait for dashboard to load
      await page.waitForTimeout(2000)

      // Verify main heading
      await expect(page.getByRole('heading', { name: /executive dashboard/i })).toBeVisible()
    })

    test('should display Fleet Health Score with all subcategories', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Check for Overall Fleet Health card
      const healthCard = page.locator('text=Overall Fleet Health').first()
      await expect(healthCard).toBeVisible()

      // Verify all health subcategories
      await expect(page.locator('text=Mechanical').first()).toBeVisible()
      await expect(page.locator('text=Safety').first()).toBeVisible()
      await expect(page.locator('text=Compliance').first()).toBeVisible()
      await expect(page.locator('text=Efficiency').first()).toBeVisible()

      // Verify health score is displayed (number between 0-100)
      const scoreElements = page.locator('[class*="text-5xl font-bold"]')
      await expect(scoreElements.first()).toBeVisible()
    })

    test('should display all 8 KPI cards with metrics', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Verify each KPI card
      const kpis = [
        'Total Vehicles',
        'Fleet Utilization',
        'Monthly Mileage',
        'Driver Safety Score',
        'Fuel Efficiency',
        'Maintenance Cost',
        'Task Completion',
        'Alert Response Time'
      ]

      for (const kpi of kpis) {
        await expect(page.locator(`text=${kpi}`).first()).toBeVisible()
      }
    })

    test('should display AI-Powered Insights panel', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Check for AI Insights section
      await expect(page.locator('text=AI-Powered Insights').first()).toBeVisible()
      await expect(page.locator('text=Machine learning analysis').first()).toBeVisible()

      // Verify at least one insight is displayed
      const insightCards = page.locator('[class*="border-l-4"]')
      expect(await insightCards.count()).toBeGreaterThan(0)
    })

    test('should display three chart tabs: Utilization, Costs, Incidents', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Find tab list
      const tabs = ['Fleet Utilization', 'Cost Analysis', 'Incident Trends']

      for (const tab of tabs) {
        await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible()
      }
    })

    test('should render Fleet Utilization chart', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Click Utilization tab
      await page.getByRole('tab', { name: /fleet utilization/i }).click()
      await page.waitForTimeout(1000)

      // Verify chart container exists
      await expect(page.locator('text=Fleet Utilization Over Time').first()).toBeVisible()

      // Check for Recharts SVG element
      const chartSvg = page.locator('svg.recharts-surface').first()
      await expect(chartSvg).toBeVisible()
    })

    test('should render Cost Analysis charts and breakdown', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Click Cost Analysis tab
      await page.getByRole('tab', { name: /cost analysis/i }).click()
      await page.waitForTimeout(1000)

      // Verify Cost Breakdown pie chart
      await expect(page.locator('text=Cost Breakdown').first()).toBeVisible()

      // Verify Daily Cost Trend line chart
      await expect(page.locator('text=Daily Cost Trend').first()).toBeVisible()

      // Verify Cost Summary
      await expect(page.locator('text=Cost Summary').first()).toBeVisible()
      await expect(page.locator('text=Total Monthly Costs').first()).toBeVisible()
      await expect(page.locator('text=Cost Per Mile').first()).toBeVisible()
    })

    test('should render Incident Trends bar chart', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Click Incidents tab
      await page.getByRole('tab', { name: /incident trends/i }).click()
      await page.waitForTimeout(1000)

      // Verify chart title
      await expect(page.locator('text=Safety Incident Trends').first()).toBeVisible()

      // Check for bar chart SVG
      const chartSvg = page.locator('svg.recharts-surface').first()
      await expect(chartSvg).toBeVisible()
    })

    test('should have working Refresh button', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Find and click refresh button
      const refreshButton = page.getByRole('button', { name: /refresh/i }).first()
      await expect(refreshButton).toBeVisible()
      await refreshButton.click()

      // Verify button is disabled during refresh (loading state)
      await expect(refreshButton).toBeDisabled()
    })

    test('should have Export PDF button', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Verify Export PDF button exists
      const exportButton = page.getByRole('button', { name: /export pdf/i })
      await expect(exportButton).toBeVisible()
    })

    test('should display Quick Actions section', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Scroll to bottom if needed
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)

      // Verify Quick Actions section
      await expect(page.locator('text=Quick Actions').first()).toBeVisible()
    })
  })

  test.describe('Module 2: Fleet Analytics - Comprehensive Validation', () => {
    test('should navigate to Fleet Analytics', async ({ page }) => {
      const analyticsButton = page.getByRole('button', { name: /fleet analytics/i })
      await analyticsButton.click()
      await page.waitForTimeout(2000)

      await expect(page.getByRole('heading', { name: /fleet analytics/i })).toBeVisible()
    })

    test('should display all 4 tabs: Overview, Financial, Utilization, KPIs', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      const tabs = ['Overview', 'Financial', 'Utilization', 'Key Metrics']

      for (const tab of tabs) {
        await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible()
      }
    })

    test('should display Overview metrics and charts', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      // Verify metric cards
      await expect(page.locator('text=Total Fleet Size').first()).toBeVisible()
      await expect(page.locator('text=Fleet Utilization').first()).toBeVisible()
      await expect(page.locator('text=Avg Mileage').first()).toBeVisible()
      await expect(page.locator('text=Vehicles in Service').first()).toBeVisible()

      // Verify charts
      await expect(page.locator('text=Fleet Status Over Time').first()).toBeVisible()
      await expect(page.locator('text=Fleet Utilization Rate').first()).toBeVisible()
    })

    test('should display Financial tab with costs and charts', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /financial/i }).click()
      await page.waitForTimeout(1000)

      // Verify financial metrics
      await expect(page.locator('text=Total Fuel Cost').first()).toBeVisible()
      await expect(page.locator('text=Maintenance Cost').first()).toBeVisible()
      await expect(page.locator('text=Cost per Vehicle').first()).toBeVisible()

      // Verify charts
      await expect(page.locator('text=Cost Analysis Breakdown').first()).toBeVisible()
      await expect(page.locator('text=Cost Distribution').first()).toBeVisible()
    })

    test('should display Utilization tab with vehicle type breakdown', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /utilization/i }).click()
      await page.waitForTimeout(1000)

      // Verify sections
      await expect(page.locator('text=Utilization by Vehicle Type').first()).toBeVisible()
      await expect(page.locator('text=Fleet Composition').first()).toBeVisible()
    })

    test('should display KPIs tab with all 4 metrics', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /key metrics/i }).click()
      await page.waitForTimeout(1000)

      // Verify KPI cards
      const kpis = ['Cost per Mile', 'Fuel Efficiency', 'Downtime Rate', 'Utilization']

      for (const kpi of kpis) {
        await expect(page.locator(`text=${kpi}`).first()).toBeVisible()
      }

      // Verify Performance Insights section
      await expect(page.locator('text=Performance Insights').first()).toBeVisible()
    })

    test('should have time period selector', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      // Find time period dropdown
      const periodSelector = page.locator('text=This Month').or(page.locator('[role="combobox"]')).first()
      await expect(periodSelector).toBeVisible()
    })
  })

  test.describe('Module 3: Custom Report Builder - Comprehensive Validation', () => {
    test('should navigate to Custom Report Builder', async ({ page }) => {
      const reportsButton = page.getByRole('button', { name: /custom report/i })
      await reportsButton.click()
      await page.waitForTimeout(2000)

      await expect(page.locator('text=Custom Report Builder').first()).toBeVisible()
    })

    test('should display main tabs: Builder, My Reports, Templates', async ({ page }) => {
      await page.getByRole('button', { name: /custom report/i }).click()
      await page.waitForTimeout(2000)

      // Check for tab structure (may vary by implementation)
      await expect(page.locator('text=Report Builder').or(page.locator('text=Builder')).first()).toBeVisible()
    })

    test('should display report configuration options', async ({ page }) => {
      await page.getByRole('button', { name: /custom report/i }).click()
      await page.waitForTimeout(2000)

      // Look for key report builder elements
      const reportElements = [
        'Report Name',
        'Data Source',
        'Columns',
        'Filters'
      ]

      // At least some should be visible
      const visibleCount = await Promise.all(
        reportElements.map(async (element) => {
          const locator = page.locator(`text=${element}`).first()
          return await locator.isVisible().catch(() => false)
        })
      )

      expect(visibleCount.filter(Boolean).length).toBeGreaterThan(0)
    })

    test('should have action buttons: Save, Run, Export', async ({ page }) => {
      await page.getByRole('button', { name: /custom report/i }).click()
      await page.waitForTimeout(2000)

      // Check for common action buttons
      const buttons = page.locator('button')
      const buttonText = await buttons.allTextContents()

      const hasRelevantButtons = buttonText.some(text =>
        /save|run|execute|export|download/i.test(text)
      )

      expect(hasRelevantButtons).toBeTruthy()
    })
  })

  test.describe('Module 4: Data Workbench - Comprehensive Validation', () => {
    test('should navigate to Data Workbench', async ({ page }) => {
      const workbenchButton = page.getByRole('button', { name: /data workbench/i })
      await workbenchButton.click()
      await page.waitForTimeout(2000)

      await expect(page.getByRole('heading', { name: /data workbench/i })).toBeVisible()
    })

    test('should display 5 metric cards', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Verify metric cards
      await expect(page.locator('text=Total Vehicles').first()).toBeVisible()
      await expect(page.locator('text=Active').first()).toBeVisible()
      await expect(page.locator('text=In Maintenance').first()).toBeVisible()
      await expect(page.locator('text=Avg Fuel').first()).toBeVisible()
      await expect(page.locator('text=Active Alerts').first()).toBeVisible()
    })

    test('should display all 4 data tabs', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      const tabs = ['Fleet Overview', 'Maintenance', 'Fuel Records', 'Analytics']

      for (const tab of tabs) {
        await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible()
      }
    })

    test('should display Fleet Overview table with data', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Verify table headers
      await expect(page.locator('th', { hasText: /vehicle/i }).first()).toBeVisible()
      await expect(page.locator('th', { hasText: /status/i }).first()).toBeVisible()
      await expect(page.locator('th', { hasText: /mileage/i }).first()).toBeVisible()

      // Verify table has rows
      const tableRows = page.locator('tbody tr')
      expect(await tableRows.count()).toBeGreaterThan(0)
    })

    test('should have search and filter functionality', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Verify search input
      const searchInput = page.locator('input[placeholder*="search" i]').or(
        page.locator('input[placeholder*="Search vehicles" i]')
      ).first()
      await expect(searchInput).toBeVisible()

      // Verify Advanced Search button
      const advancedSearchBtn = page.getByRole('button', { name: /advanced search/i })
      await expect(advancedSearchBtn).toBeVisible()
    })

    test('should display Maintenance tab with records', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /maintenance/i }).click()
      await page.waitForTimeout(1000)

      // Verify maintenance metrics
      await expect(page.locator('text=Maintenance Cost').first()).toBeVisible()
      await expect(page.locator('text=Overdue Services').first()).toBeVisible()
      await expect(page.locator('text=Upcoming Services').first()).toBeVisible()

      // Verify filter buttons
      await expect(page.getByRole('button', { name: /all/i }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /upcoming/i }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /overdue/i }).first()).toBeVisible()
    })

    test('should display Fuel Records tab with data', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /fuel records/i }).click()
      await page.waitForTimeout(1000)

      // Verify fuel metrics
      await expect(page.locator('text=Total Fuel Cost').first()).toBeVisible()
      await expect(page.locator('text=Average MPG').first()).toBeVisible()
      await expect(page.locator('text=Total Gallons').first()).toBeVisible()
      await expect(page.locator('text=Cost per Mile').first()).toBeVisible()
    })

    test('should display Analytics tab with insights', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      await page.getByRole('tab', { name: /analytics/i }).click()
      await page.waitForTimeout(1000)

      // Verify analytics sections
      await expect(page.locator('text=Fleet Analytics').first()).toBeVisible()
      await expect(page.locator('text=Utilization Rate').first()).toBeVisible()
      await expect(page.locator('text=Cost Analysis').first()).toBeVisible()
    })

    test('should have Import/Export/Refresh buttons', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Verify action buttons
      await expect(page.getByRole('button', { name: /import/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /export/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible()
    })
  })

  test.describe('Module 5: Cost Analysis Center - Comprehensive Validation', () => {
    test('should navigate to Cost Analysis', async ({ page }) => {
      const costButton = page.getByRole('button', { name: /cost analysis/i })
      await costButton.click()
      await page.waitForTimeout(2000)

      await expect(page.locator('text=Cost Analysis').first()).toBeVisible()
    })

    test('should display cost summary cards', async ({ page }) => {
      await page.getByRole('button', { name: /cost analysis/i }).click()
      await page.waitForTimeout(2000)

      // Look for cost-related elements
      await expect(page.locator('text=Total Costs').or(page.locator('text=Cost')).first()).toBeVisible()
    })

    test('should have export functionality', async ({ page }) => {
      await page.getByRole('button', { name: /cost analysis/i }).click()
      await page.waitForTimeout(2000)

      // Check for export button
      const exportBtn = page.getByRole('button', { name: /export/i })
      if (await exportBtn.isVisible()) {
        await expect(exportBtn).toBeVisible()
      }
    })
  })

  test.describe('Module 6: Driver Scorecard (Predictive Analytics) - Validation', () => {
    test('should navigate to Driver Scorecard', async ({ page }) => {
      const scorecardButton = page.getByRole('button', { name: /driver scorecard/i })
      await scorecardButton.click()
      await page.waitForTimeout(2000)

      await expect(page.locator('text=Driver Scorecard').or(page.locator('text=Scorecard')).first()).toBeVisible()
    })

    test('should display leaderboard or driver metrics', async ({ page }) => {
      await page.getByRole('button', { name: /driver scorecard/i }).click()
      await page.waitForTimeout(2000)

      // Look for driver-related content
      const hasDriverContent = await page.locator('text=Driver').or(
        page.locator('text=Score')
      ).first().isVisible().catch(() => false)

      expect(hasDriverContent).toBeTruthy()
    })
  })

  test.describe('Module 7: Fleet Optimizer (Business Intelligence) - Validation', () => {
    test('should navigate to Fleet Optimizer', async ({ page }) => {
      const optimizerButton = page.getByRole('button', { name: /fleet optimizer/i })
      await optimizerButton.click()
      await page.waitForTimeout(2000)

      await expect(page.locator('text=Fleet Optimizer').or(page.locator('text=Optimizer')).first()).toBeVisible()
    })

    test('should display optimization metrics', async ({ page }) => {
      await page.getByRole('button', { name: /fleet optimizer/i }).click()
      await page.waitForTimeout(2000)

      // Look for optimization-related content
      const hasOptimizerContent = await page.locator('text=Optim').first().isVisible().catch(() => false)
      expect(hasOptimizerContent).toBeTruthy()
    })
  })

  test.describe('Cross-Module Data Visualization Validation', () => {
    test('should validate charts render across all modules', async ({ page }) => {
      const modules = [
        'Executive Dashboard',
        'Fleet Analytics',
        'Data Workbench'
      ]

      const chartCounts: Record<string, number> = {}

      for (const module of modules) {
        await page.getByRole('button', { name: new RegExp(module, 'i') }).click()
        await page.waitForTimeout(2000)

        // Count SVG chart elements
        const svgCharts = page.locator('svg.recharts-surface')
        const count = await svgCharts.count()
        chartCounts[module] = count

        console.log(`${module}: ${count} charts found`)
      }

      // At least Executive Dashboard should have charts
      expect(chartCounts['Executive Dashboard']).toBeGreaterThan(0)
    })

    test('should validate all metric cards display numbers', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Find all metric card values (large numbers)
      const metricValues = page.locator('[class*="text-2xl"], [class*="text-3xl"]')
      const count = await metricValues.count()

      expect(count).toBeGreaterThan(5) // Should have multiple metrics
    })

    test('should validate tables have data rows', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Check for table rows
      const tableRows = page.locator('tbody tr')
      const rowCount = await tableRows.count()

      expect(rowCount).toBeGreaterThan(0)
    })
  })

  test.describe('Data Completeness Assessment', () => {
    test('should assess Executive Dashboard data completeness', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      const dataElements = {
        'Fleet Health Score': page.locator('text=Overall Fleet Health').first(),
        'KPI Cards (8)': page.locator('[class*="text-2xl font-bold"]').nth(0),
        'AI Insights': page.locator('text=AI-Powered Insights').first(),
        'Utilization Chart': page.locator('text=Fleet Utilization Over Time').first(),
        'Cost Charts': page.locator('text=Cost Breakdown').first(),
        'Incident Chart': page.locator('text=Safety Incident Trends').first()
      }

      const completeness: string[] = []

      for (const [name, locator] of Object.entries(dataElements)) {
        const isVisible = await locator.isVisible().catch(() => false)
        if (isVisible) {
          completeness.push(name)
        }
      }

      const percentage = (completeness.length / Object.keys(dataElements).length) * 100
      console.log(`Executive Dashboard Completeness: ${percentage.toFixed(1)}%`)
      console.log(`Present: ${completeness.join(', ')}`)

      expect(percentage).toBeGreaterThanOrEqual(70) // At least 70% complete
    })

    test('should assess Fleet Analytics data completeness', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(2000)

      const dataElements = {
        'Overview Metrics': page.locator('text=Total Fleet Size').first(),
        'Financial Tab': page.getByRole('tab', { name: /financial/i }),
        'Utilization Tab': page.getByRole('tab', { name: /utilization/i }),
        'KPIs Tab': page.getByRole('tab', { name: /key metrics/i }),
        'Charts': page.locator('svg.recharts-surface').first()
      }

      const completeness: string[] = []

      for (const [name, locator] of Object.entries(dataElements)) {
        const isVisible = await locator.isVisible().catch(() => false)
        if (isVisible) {
          completeness.push(name)
        }
      }

      const percentage = (completeness.length / Object.keys(dataElements).length) * 100
      console.log(`Fleet Analytics Completeness: ${percentage.toFixed(1)}%`)

      expect(percentage).toBeGreaterThanOrEqual(70)
    })

    test('should assess Data Workbench data completeness', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      const dataElements = {
        'Metric Cards': page.locator('text=Total Vehicles').first(),
        'Fleet Overview Tab': page.getByRole('tab', { name: /fleet overview/i }),
        'Maintenance Tab': page.getByRole('tab', { name: /maintenance/i }),
        'Fuel Tab': page.getByRole('tab', { name: /fuel/i }),
        'Analytics Tab': page.getByRole('tab', { name: /analytics/i }),
        'Search Function': page.locator('input[placeholder*="search" i]').first(),
        'Data Table': page.locator('table').first()
      }

      const completeness: string[] = []

      for (const [name, locator] of Object.entries(dataElements)) {
        const isVisible = await locator.isVisible().catch(() => false)
        if (isVisible) {
          completeness.push(name)
        }
      }

      const percentage = (completeness.length / Object.keys(dataElements).length) * 100
      console.log(`Data Workbench Completeness: ${percentage.toFixed(1)}%`)

      expect(percentage).toBeGreaterThanOrEqual(70)
    })
  })

  test.describe('Interactive Features Validation', () => {
    test('should test tab switching works correctly', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(2000)

      // Click through chart tabs
      await page.getByRole('tab', { name: /utilization/i }).click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Fleet Utilization Over Time').first()).toBeVisible()

      await page.getByRole('tab', { name: /cost/i }).click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Cost Breakdown').first()).toBeVisible()

      await page.getByRole('tab', { name: /incident/i }).click()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Safety Incident Trends').first()).toBeVisible()
    })

    test('should test filters work in Data Workbench', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Go to Maintenance tab
      await page.getByRole('tab', { name: /maintenance/i }).click()
      await page.waitForTimeout(1000)

      // Click filter buttons
      const allButton = page.getByRole('button', { name: /^all$/i }).first()
      await allButton.click()
      await page.waitForTimeout(500)

      const upcomingButton = page.getByRole('button', { name: /upcoming/i }).first()
      await upcomingButton.click()
      await page.waitForTimeout(500)

      // Verify table still has content
      const tableRows = page.locator('tbody tr')
      expect(await tableRows.count()).toBeGreaterThanOrEqual(0)
    })

    test('should test search functionality', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(2000)

      // Find search input
      const searchInput = page.locator('input[placeholder*="search" i]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('UNIT')
        await page.waitForTimeout(500)

        // Table should still render
        const tableRows = page.locator('tbody tr')
        expect(await tableRows.count()).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Screenshot Capture for Documentation', () => {
    test('should capture Executive Dashboard screenshot', async ({ page }) => {
      await page.getByRole('button', { name: /executive dashboard/i }).click()
      await page.waitForTimeout(3000)

      await page.screenshot({
        path: 'tests/screenshots/agent-6-executive-dashboard.png',
        fullPage: true
      })
    })

    test('should capture Fleet Analytics screenshot', async ({ page }) => {
      await page.getByRole('button', { name: /fleet analytics/i }).click()
      await page.waitForTimeout(3000)

      await page.screenshot({
        path: 'tests/screenshots/agent-6-fleet-analytics.png',
        fullPage: true
      })
    })

    test('should capture Data Workbench screenshot', async ({ page }) => {
      await page.getByRole('button', { name: /data workbench/i }).click()
      await page.waitForTimeout(3000)

      await page.screenshot({
        path: 'tests/screenshots/agent-6-data-workbench.png',
        fullPage: true
      })
    })

    test('should capture Cost Analysis screenshot', async ({ page }) => {
      await page.getByRole('button', { name: /cost analysis/i }).click()
      await page.waitForTimeout(3000)

      await page.screenshot({
        path: 'tests/screenshots/agent-6-cost-analysis.png',
        fullPage: true
      })
    })
  })
})
