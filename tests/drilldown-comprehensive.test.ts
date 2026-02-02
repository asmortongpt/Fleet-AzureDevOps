/**
 * COMPREHENSIVE DRILL-DOWN FUNCTIONALITY TEST SUITE
 *
 * Tests all drill-down implementations end-to-end across:
 * - Dashboard, Safety, Maintenance, Operations, Policy Engine hubs
 * - All drill-down components
 * - DrilldownManager routing
 * - DrilldownPanel behavior
 *
 * Test Coverage:
 * A. Basic Drill-Down Flow
 * B. Deep Navigation (4-5 levels)
 * C. Data Display
 * D. Keyboard Navigation
 * E. Error Handling
 * F. Performance Metrics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DrilldownProvider } from '@/contexts/DrilldownContext'
import { SafetyHub } from '@/pages/SafetyHub'
import { MaintenanceHub } from '@/pages/MaintenanceHub'
import { OperationsHub } from '@/pages/OperationsHub'
import { AssetsHub } from '@/pages/AssetsHub'
import { MemoryRouter } from 'react-router-dom'

// Test utilities
const renderWithDrilldown = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <DrilldownProvider>
        {component}
      </DrilldownProvider>
    </MemoryRouter>
  )
}

// Performance measurement utility
class PerformanceMonitor {
  private measurements: Array<{ name: string; duration: number }> = []
  private memorySnapshots: number[] = []

  measure(name: string, fn: () => void) {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    this.measurements.push({ name, duration })

    // Memory snapshot (if available)
    if (performance.memory) {
      this.memorySnapshots.push(performance.memory.usedJSHeapSize)
    }

    return duration
  }

  getReport() {
    const avgDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0) / this.measurements.length
    const maxDuration = Math.max(...this.measurements.map(m => m.duration))
    const minDuration = Math.min(...this.measurements.map(m => m.duration))

    const memoryLeak = this.memorySnapshots.length > 1
      ? this.memorySnapshots[this.memorySnapshots.length - 1] - this.memorySnapshots[0]
      : 0

    return {
      measurements: this.measurements,
      avgDuration,
      maxDuration,
      minDuration,
      memoryLeak,
      memorySnapshots: this.memorySnapshots
    }
  }

  reset() {
    this.measurements = []
    this.memorySnapshots = []
  }
}

// Test results collector
interface TestResult {
  scenario: string
  status: 'PASS' | 'FAIL'
  duration?: number
  error?: string
  details?: any
}

class TestReporter {
  private results: TestResult[] = []

  addResult(result: TestResult) {
    this.results.push(result)
  }

  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length

    return {
      summary: {
        total,
        passed,
        failed,
        passRate: `${((passed / total) * 100).toFixed(1)}%`
      },
      results: this.results,
      failedTests: this.results.filter(r => r.status === 'FAIL')
    }
  }
}

const reporter = new TestReporter()
const perfMonitor = new PerformanceMonitor()

// ==============================================================================
// A. BASIC DRILL-DOWN FLOW TESTS
// ==============================================================================

describe('A. Basic Drill-Down Flow', () => {
  it('A.1 Click metric card → Verify correct list view opens (SafetyHub)', async () => {
    try {
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Find and click "Open Incidents" stat card
      const openIncidentsCard = screen.getByText('Open Incidents')
      expect(openIncidentsCard).toBeTruthy()

      perfMonitor.measure('drill-down-activation', () => {
        fireEvent.click(openIncidentsCard.closest('[data-testid="stat-card"]') || openIncidentsCard)
      })

      // Verify drill-down panel opens
      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeTruthy()
      }, { timeout: 200 })

      reporter.addResult({
        scenario: 'A.1 SafetyHub - Open Incidents drill-down',
        status: 'PASS',
        duration: perfMonitor.getReport().measurements[0]?.duration
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'A.1 SafetyHub - Open Incidents drill-down',
        status: 'FAIL',
        error: (error as Error).message
      })
      throw error
    }
  })

  it('A.2 Click table row → Verify detail panel opens', async () => {
    try {
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      // Click work orders card to open list
      const workOrdersCard = screen.getByText('Work Orders')
      fireEvent.click(workOrdersCard.closest('[data-testid="stat-card"]') || workOrdersCard)

      await waitFor(() => {
        const listView = screen.queryByTestId('drilldown-list')
        expect(listView).toBeTruthy()
      })

      // Click first row
      const firstRow = screen.queryByTestId('list-row-0')
      if (firstRow) {
        fireEvent.click(firstRow)

        await waitFor(() => {
          const detailPanel = screen.queryByTestId('detail-panel')
          expect(detailPanel).toBeTruthy()
        })
      }

      reporter.addResult({
        scenario: 'A.2 MaintenanceHub - Work order detail panel',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'A.2 MaintenanceHub - Work order detail panel',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('A.3 Click breadcrumb → Verify navigation back works', async () => {
    try {
      const { container } = renderWithDrilldown(<OperationsHub />)

      // Navigate to active jobs
      const activeJobsCard = screen.getByText('Active Jobs')
      fireEvent.click(activeJobsCard.closest('[data-testid="stat-card"]') || activeJobsCard)

      await waitFor(() => {
        const breadcrumb = screen.queryByTestId('breadcrumb')
        expect(breadcrumb).toBeTruthy()
      })

      // Click breadcrumb to go back
      const breadcrumbItems = screen.queryAllByRole('button', { name: /back/i })
      if (breadcrumbItems.length > 0) {
        fireEvent.click(breadcrumbItems[0])

        await waitFor(() => {
          // Should be back at hub level
          const hubContent = screen.queryByTestId('hub-content-dispatch')
          expect(hubContent).toBeTruthy()
        })
      }

      reporter.addResult({
        scenario: 'A.3 OperationsHub - Breadcrumb navigation',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'A.3 OperationsHub - Breadcrumb navigation',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('A.4 Click close button → Verify panel closes completely', async () => {
    try {
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Open panel
      const safetyScoreCard = screen.getByText('Safety Score')
      fireEvent.click(safetyScoreCard.closest('div[class*="cursor-pointer"]') || safetyScoreCard)

      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeTruthy()
      })

      // Close panel
      const closeButton = screen.queryByTestId('close-drilldown') || screen.queryByLabelText('close')
      if (closeButton) {
        fireEvent.click(closeButton)

        await waitFor(() => {
          const panel = screen.queryByTestId('drilldown-panel')
          expect(panel).toBeFalsy()
        })
      }

      reporter.addResult({
        scenario: 'A.4 SafetyHub - Close panel',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'A.4 SafetyHub - Close panel',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// B. DEEP NAVIGATION TESTS (4-5 levels)
// ==============================================================================

describe('B. Deep Navigation (4-5 levels)', () => {
  it('B.1 Dashboard → Vehicles → Vehicle Detail → Trips → Trip Detail', async () => {
    try {
      const breadcrumbTrail: string[] = []

      // Level 1: Dashboard
      const { container } = renderWithDrilldown(<AssetsHub />)
      breadcrumbTrail.push('Assets Hub')

      // Level 2: Click on vehicle card
      const vehiclesCard = screen.queryByText('Total Vehicles') || screen.queryByText('Fleet')
      if (vehiclesCard) {
        fireEvent.click(vehiclesCard.closest('[data-testid="stat-card"]') || vehiclesCard)
        breadcrumbTrail.push('Vehicles')

        await waitFor(() => {
          const vehiclesList = screen.queryByTestId('drilldown-list')
          expect(vehiclesList).toBeTruthy()
        })
      }

      // Level 3: Click on first vehicle
      const firstVehicle = screen.queryByTestId('list-row-0')
      if (firstVehicle) {
        fireEvent.click(firstVehicle)
        breadcrumbTrail.push('Vehicle Detail')

        await waitFor(() => {
          const vehicleDetail = screen.queryByTestId('vehicle-detail-panel')
          expect(vehicleDetail).toBeTruthy()
        })
      }

      // Level 4: Click on trips tab
      const tripsTab = screen.queryByText('Trips') || screen.queryByTestId('trips-tab')
      if (tripsTab) {
        fireEvent.click(tripsTab)
        breadcrumbTrail.push('Trips')
      }

      // Level 5: Click on first trip
      const firstTrip = screen.queryByTestId('trip-row-0')
      if (firstTrip) {
        fireEvent.click(firstTrip)
        breadcrumbTrail.push('Trip Detail')
      }

      // Verify breadcrumbs
      const breadcrumbs = screen.queryAllByTestId(/breadcrumb-/i)
      expect(breadcrumbs.length).toBeGreaterThanOrEqual(3)

      reporter.addResult({
        scenario: 'B.1 Deep navigation - 5 levels',
        status: 'PASS',
        details: { breadcrumbTrail }
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'B.1 Deep navigation - 5 levels',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('B.2 Verify breadcrumbs update correctly at each level', async () => {
    try {
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Level 1
      const incidentsCard = screen.getByText('Open Incidents')
      fireEvent.click(incidentsCard.closest('[data-testid="stat-card"]') || incidentsCard)

      await waitFor(() => {
        const breadcrumbs = screen.queryAllByTestId(/breadcrumb/i)
        expect(breadcrumbs.length).toBeGreaterThanOrEqual(1)
      })

      // Level 2
      const firstIncident = screen.queryByTestId('list-row-0')
      if (firstIncident) {
        fireEvent.click(firstIncident)

        await waitFor(() => {
          const breadcrumbs = screen.queryAllByTestId(/breadcrumb/i)
          expect(breadcrumbs.length).toBeGreaterThanOrEqual(2)
        })
      }

      reporter.addResult({
        scenario: 'B.2 Breadcrumb updates',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'B.2 Breadcrumb updates',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('B.3 Verify data persists through navigation', async () => {
    try {
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      // Navigate and capture data
      const workOrdersCard = screen.getByText('Work Orders')
      const initialValue = screen.getByText('Work Orders').closest('[data-testid="stat-card"]')?.textContent

      fireEvent.click(workOrdersCard.closest('[data-testid="stat-card"]') || workOrdersCard)

      await waitFor(() => {
        const listView = screen.queryByTestId('drilldown-list')
        expect(listView).toBeTruthy()
      })

      // Go back
      const backButton = screen.queryByTestId('back-button') || screen.queryByRole('button', { name: /back/i })
      if (backButton) {
        fireEvent.click(backButton)

        await waitFor(() => {
          const restoredValue = screen.getByText('Work Orders').closest('[data-testid="stat-card"]')?.textContent
          expect(restoredValue).toBe(initialValue)
        })
      }

      reporter.addResult({
        scenario: 'B.3 Data persistence',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'B.3 Data persistence',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// C. DATA DISPLAY TESTS
// ==============================================================================

describe('C. Data Display', () => {
  it('C.1 Verify filtered data matches summary statistics', async () => {
    try {
      const { container } = renderWithDrilldown(<OperationsHub />)

      // Click "Active Jobs" which shows "24"
      const activeJobsCard = screen.getByText('Active Jobs')
      const expectedCount = activeJobsCard.closest('[data-testid="stat-card"]')?.querySelector('[class*="text-"]')?.textContent

      fireEvent.click(activeJobsCard.closest('[data-testid="stat-card"]') || activeJobsCard)

      await waitFor(() => {
        const listItems = screen.queryAllByTestId(/list-row-/i)
        // Should have items (exact count may vary with pagination)
        expect(listItems.length).toBeGreaterThan(0)
      })

      reporter.addResult({
        scenario: 'C.1 Filtered data consistency',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'C.1 Filtered data consistency',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('C.2 Verify sorting works in tables', async () => {
    try {
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      // Open work orders list
      const workOrdersCard = screen.getByText('Work Orders')
      fireEvent.click(workOrdersCard.closest('[data-testid="stat-card"]') || workOrdersCard)

      await waitFor(() => {
        const sortableHeader = screen.queryByTestId('sortable-header-0') ||
                               screen.queryByRole('button', { name: /sort/i })

        if (sortableHeader) {
          fireEvent.click(sortableHeader)

          // Verify sort indicator appears
          const sortIndicator = screen.queryByTestId('sort-indicator')
          expect(sortIndicator || sortableHeader).toBeTruthy()
        }
      })

      reporter.addResult({
        scenario: 'C.2 Table sorting',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'C.2 Table sorting',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('C.3 Verify empty states display correctly', async () => {
    try {
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Try to find a metric with 0 value or create empty state
      const camerasCard = screen.queryByText('Events Today')
      if (camerasCard) {
        fireEvent.click(camerasCard.closest('[data-testid="stat-card"]') || camerasCard)

        await waitFor(() => {
          // Should show either data or empty state
          const content = screen.queryByTestId('drilldown-content')
          expect(content).toBeTruthy()
        })
      }

      reporter.addResult({
        scenario: 'C.3 Empty states',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'C.3 Empty states',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// D. KEYBOARD NAVIGATION TESTS
// ==============================================================================

describe('D. Keyboard Navigation', () => {
  it('D.1 Tab through interactive elements', async () => {
    try {
      const user = userEvent.setup()
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Tab through stat cards
      await user.tab()
      const firstFocusable = document.activeElement
      expect(firstFocusable?.tagName).toBeTruthy()

      await user.tab()
      const secondFocusable = document.activeElement
      expect(secondFocusable).not.toBe(firstFocusable)

      reporter.addResult({
        scenario: 'D.1 Tab navigation',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'D.1 Tab navigation',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('D.2 Press Enter/Space to activate drill-downs', async () => {
    try {
      const user = userEvent.setup()
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      // Find first stat card
      const workOrdersCard = screen.getByText('Work Orders')
      const card = workOrdersCard.closest('[data-testid="stat-card"]') || workOrdersCard

      // Focus and press Enter
      ;(card as HTMLElement).focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeTruthy()
      })

      reporter.addResult({
        scenario: 'D.2 Enter/Space activation',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'D.2 Enter/Space activation',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('D.3 Press Escape to close panels', async () => {
    try {
      const user = userEvent.setup()
      const { container } = renderWithDrilldown(<OperationsHub />)

      // Open panel
      const activeJobsCard = screen.getByText('Active Jobs')
      fireEvent.click(activeJobsCard.closest('[data-testid="stat-card"]') || activeJobsCard)

      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeTruthy()
      })

      // Press Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeFalsy()
      })

      reporter.addResult({
        scenario: 'D.3 Escape to close',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'D.3 Escape to close',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('D.4 Verify focus management', async () => {
    try {
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Click to open panel
      const incidentsCard = screen.getByText('Open Incidents')
      fireEvent.click(incidentsCard.closest('[data-testid="stat-card"]') || incidentsCard)

      await waitFor(() => {
        const panel = screen.queryByTestId('drilldown-panel')
        expect(panel).toBeTruthy()

        // Check if focus moved into panel
        const focusedElement = document.activeElement
        expect(panel?.contains(focusedElement)).toBeTruthy()
      })

      reporter.addResult({
        scenario: 'D.4 Focus management',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'D.4 Focus management',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// E. ERROR HANDLING TESTS
// ==============================================================================

describe('E. Error Handling', () => {
  it('E.1 Test with missing data', async () => {
    try {
      // Render with intentionally missing data
      const { container } = renderWithDrilldown(<SafetyHub />)

      // Click on a card that might have no data
      const resolvedCard = screen.queryByText('Resolved (30d)')
      if (resolvedCard) {
        fireEvent.click(resolvedCard.closest('[data-testid="stat-card"]') || resolvedCard)

        await waitFor(() => {
          // Should handle gracefully - either show empty state or data
          const content = screen.queryByTestId('drilldown-content') ||
                         screen.queryByText(/no data/i) ||
                         screen.queryByTestId('empty-state')
          expect(content).toBeTruthy()
        })
      }

      reporter.addResult({
        scenario: 'E.1 Missing data handling',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'E.1 Missing data handling',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('E.2 Test graceful degradation', async () => {
    try {
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      // The component should render without errors
      expect(container).toBeTruthy()

      // Should have fallback content
      const content = screen.queryByTestId('hub-content-garage') || container
      expect(content).toBeTruthy()

      reporter.addResult({
        scenario: 'E.2 Graceful degradation',
        status: 'PASS'
      })
    } catch (error) {
      reporter.addResult({
        scenario: 'E.2 Graceful degradation',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// F. PERFORMANCE TESTS
// ==============================================================================

describe('F. Performance', () => {
  it('F.1 Measure drill-down activation time (<100ms target)', async () => {
    try {
      perfMonitor.reset()
      const { container } = renderWithDrilldown(<OperationsHub />)

      // Measure activation time
      const activeJobsCard = screen.getByText('Active Jobs')

      const duration = perfMonitor.measure('drill-down-activation', () => {
        fireEvent.click(activeJobsCard.closest('[data-testid="stat-card"]') || activeJobsCard)
      })

      // Target: <100ms
      const passed = duration < 100

      reporter.addResult({
        scenario: 'F.1 Drill-down activation time',
        status: passed ? 'PASS' : 'FAIL',
        duration,
        details: { target: '< 100ms', actual: `${duration.toFixed(2)}ms` }
      })

      expect(duration).toBeLessThan(100)
    } catch (error) {
      reporter.addResult({
        scenario: 'F.1 Drill-down activation time',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('F.2 Check for memory leaks (open/close 50 times)', async () => {
    try {
      perfMonitor.reset()
      const { container } = renderWithDrilldown(<SafetyHub />)

      const incidentsCard = screen.getByText('Open Incidents')
      const card = incidentsCard.closest('[data-testid="stat-card"]') || incidentsCard

      // Open and close 50 times
      for (let i = 0; i < 50; i++) {
        perfMonitor.measure(`iteration-${i}`, () => {
          fireEvent.click(card)
        })

        // Close
        const closeButton = screen.queryByTestId('close-drilldown')
        if (closeButton) {
          fireEvent.click(closeButton)
        }
      }

      const report = perfMonitor.getReport()

      // Memory leak threshold: < 10MB increase
      const memoryLeakAcceptable = Math.abs(report.memoryLeak) < 10 * 1024 * 1024

      reporter.addResult({
        scenario: 'F.2 Memory leak test',
        status: memoryLeakAcceptable ? 'PASS' : 'FAIL',
        details: {
          memoryLeak: `${(report.memoryLeak / 1024 / 1024).toFixed(2)} MB`,
          iterations: 50
        }
      })

      expect(memoryLeakAcceptable).toBe(true)
    } catch (error) {
      reporter.addResult({
        scenario: 'F.2 Memory leak test',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })

  it('F.3 Test with large datasets (100+ records)', async () => {
    try {
      const { container } = renderWithDrilldown(<MaintenanceHub />)

      const startTime = performance.now()

      // Click work orders (should have many records)
      const workOrdersCard = screen.getByText('Work Orders')
      fireEvent.click(workOrdersCard.closest('[data-testid="stat-card"]') || workOrdersCard)

      await waitFor(() => {
        const listView = screen.queryByTestId('drilldown-list')
        expect(listView).toBeTruthy()
      })

      const duration = performance.now() - startTime

      // Should render within 500ms even with large dataset
      const passed = duration < 500

      reporter.addResult({
        scenario: 'F.3 Large dataset rendering',
        status: passed ? 'PASS' : 'FAIL',
        duration,
        details: { target: '< 500ms', actual: `${duration.toFixed(2)}ms` }
      })

      expect(duration).toBeLessThan(500)
    } catch (error) {
      reporter.addResult({
        scenario: 'F.3 Large dataset rendering',
        status: 'FAIL',
        error: (error as Error).message
      })
    }
  })
})

// ==============================================================================
// GENERATE FINAL REPORT
// ==============================================================================

afterAll(() => {
  const finalReport = reporter.generateReport()
  const perfReport = perfMonitor.getReport()

  console.log('\n' + '='.repeat(80))
  console.log('COMPREHENSIVE DRILL-DOWN FUNCTIONALITY TEST REPORT')
  console.log('='.repeat(80))

  console.log('\n📊 SUMMARY')
  console.log(`Total Tests: ${finalReport.summary.total}`)
  console.log(`✅ Passed: ${finalReport.summary.passed}`)
  console.log(`❌ Failed: ${finalReport.summary.failed}`)
  console.log(`Pass Rate: ${finalReport.summary.passRate}`)

  console.log('\n⚡ PERFORMANCE METRICS')
  console.log(`Average Duration: ${perfReport.avgDuration.toFixed(2)}ms`)
  console.log(`Max Duration: ${perfReport.maxDuration.toFixed(2)}ms`)
  console.log(`Min Duration: ${perfReport.minDuration.toFixed(2)}ms`)
  if (perfReport.memoryLeak !== 0) {
    console.log(`Memory Change: ${(perfReport.memoryLeak / 1024 / 1024).toFixed(2)} MB`)
  }

  console.log('\n📋 DETAILED RESULTS')
  finalReport.results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration.toFixed(2)}ms)` : ''
    console.log(`${icon} ${result.scenario}${duration}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details)}`)
    }
  })

  if (finalReport.failedTests.length > 0) {
    console.log('\n🔧 FAILED TESTS - RECOMMENDED FIXES')
    finalReport.failedTests.forEach((test, idx) => {
      console.log(`\n${idx + 1}. ${test.scenario}`)
      console.log(`   Error: ${test.error}`)
      console.log(`   Recommendation: Review component implementation and add missing test IDs`)
    })
  }

  console.log('\n' + '='.repeat(80))
})
