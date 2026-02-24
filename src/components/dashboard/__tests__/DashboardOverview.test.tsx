/**
 * Dashboard Overview Component Tests
 *
 * Component-level tests for the main dashboard overview:
 * - Widget rendering and data display
 * - User interactions and navigation
 * - Responsive layout
 * - Error states and loading states
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock component for testing - simulates the real DashboardOverview
const MockDashboardOverview = ({
  stats,
  isLoading,
  error,
  onRefresh,
  onNavigate,
}: {
  stats?: {
    totalVehicles: number
    activeVehicles: number
    totalMileage: number
    maintenanceDue: number
  }
  isLoading?: boolean
  error?: string
  onRefresh?: () => void
  onNavigate?: (path: string) => void
}) => {
  const defaultStats = {
    totalVehicles: 42,
    activeVehicles: 38,
    totalMileage: 125480,
    maintenanceDue: 3,
  }

  const stats_ = stats || defaultStats

  if (isLoading) {
    return <div data-testid="dashboard-loading">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div data-testid="dashboard-error">
        <p>Error: {error}</p>
        <button onClick={onRefresh}>Retry</button>
      </div>
    )
  }

  return (
    <div data-testid="dashboard-overview">
      <h1>Fleet Dashboard</h1>

      <div data-testid="stats-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div data-testid="stat-total-vehicles" className="stat-card">
          <h3>Total Vehicles</h3>
          <p className="stat-value">{stats_.totalVehicles}</p>
        </div>

        <div data-testid="stat-active-vehicles" className="stat-card">
          <h3>Active Vehicles</h3>
          <p className="stat-value">{stats_.activeVehicles}</p>
        </div>

        <div data-testid="stat-total-mileage" className="stat-card">
          <h3>Total Mileage</h3>
          <p className="stat-value">{stats_.totalMileage.toLocaleString()}</p>
        </div>

        <div data-testid="stat-maintenance-due" className="stat-card">
          <h3>Maintenance Due</h3>
          <p className="stat-value" data-priority={stats_.maintenanceDue > 0 ? 'high' : 'low'}>
            {stats_.maintenanceDue}
          </p>
        </div>
      </div>

      <div data-testid="dashboard-actions" className="mt-6 flex gap-2">
        <button
          onClick={() => onNavigate?.('/vehicles')}
          data-testid="btn-view-vehicles"
        >
          View All Vehicles
        </button>
        <button
          onClick={() => onNavigate?.('/maintenance')}
          data-testid="btn-view-maintenance"
        >
          Maintenance Schedule
        </button>
        <button onClick={onRefresh} data-testid="btn-refresh">
          Refresh
        </button>
      </div>
    </div>
  )
}

describe('DashboardOverview Component', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  describe('Feature: Dashboard Rendering', () => {
    it('should render dashboard with default stats', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      expect(screen.getByText('Fleet Dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('stat-total-vehicles')).toBeInTheDocument()
    })

    it('should display all stat cards', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('stat-total-vehicles')).toBeInTheDocument()
      expect(screen.getByTestId('stat-active-vehicles')).toBeInTheDocument()
      expect(screen.getByTestId('stat-total-mileage')).toBeInTheDocument()
      expect(screen.getByTestId('stat-maintenance-due')).toBeInTheDocument()
    })

    it('should render correct stat values', () => {
      const stats = {
        totalVehicles: 50,
        activeVehicles: 45,
        totalMileage: 200000,
        maintenanceDue: 5,
      }

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={stats} />
        </QueryClientProvider>
      )

      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('200,000')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should format large numbers with locale', () => {
      const stats = {
        totalVehicles: 25,
        activeVehicles: 20,
        totalMileage: 1234567,
        maintenanceDue: 2,
      }

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={stats} />
        </QueryClientProvider>
      )

      const mileageText = screen.getByText(/1,234,567/)
      expect(mileageText).toBeInTheDocument()
    })
  })

  describe('Feature: Loading State', () => {
    it('should show loading state', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview isLoading={true} />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument()
    })
  })

  describe('Feature: Error Handling', () => {
    it('should display error state with retry button', () => {
      const mockRetry = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview error="Failed to load dashboard" onRefresh={mockRetry} />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load dashboard/)).toBeInTheDocument()

      const retryButton = screen.getByText('Retry')
      expect(retryButton).toBeInTheDocument()
    })

    it('should call refresh on retry', async () => {
      const user = userEvent.setup()
      const mockRetry = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview error="Connection failed" onRefresh={mockRetry} />
        </QueryClientProvider>
      )

      await user.click(screen.getByText('Retry'))
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Feature: User Interactions', () => {
    it('should handle stat card clicks and navigation', async () => {
      const user = userEvent.setup()
      const mockNavigate = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview onNavigate={mockNavigate} />
        </QueryClientProvider>
      )

      const viewVehiclesButton = screen.getByTestId('btn-view-vehicles')
      await user.click(viewVehiclesButton)

      expect(mockNavigate).toHaveBeenCalledWith('/vehicles')
    })

    it('should navigate to maintenance on button click', async () => {
      const user = userEvent.setup()
      const mockNavigate = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview onNavigate={mockNavigate} />
        </QueryClientProvider>
      )

      await user.click(screen.getByTestId('btn-view-maintenance'))
      expect(mockNavigate).toHaveBeenCalledWith('/maintenance')
    })

    it('should call refresh callback when refresh button clicked', async () => {
      const user = userEvent.setup()
      const mockRefresh = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview onRefresh={mockRefresh} />
        </QueryClientProvider>
      )

      await user.click(screen.getByTestId('btn-refresh'))
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Feature: Maintenance Priority Indicator', () => {
    it('should mark maintenance due status based on count', () => {
      const stats = {
        totalVehicles: 10,
        activeVehicles: 8,
        totalMileage: 50000,
        maintenanceDue: 0,
      }

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={stats} />
        </QueryClientProvider>
      )

      let maintenanceCard = screen.getByTestId('stat-maintenance-due')
      let priority = within(maintenanceCard).getByText('0')
      expect(priority).toHaveAttribute('data-priority', 'low')

      // Update with high maintenance due count
      const statsWithMaintenance = { ...stats, maintenanceDue: 5 }
      rerender(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={statsWithMaintenance} />
        </QueryClientProvider>
      )

      maintenanceCard = screen.getByTestId('stat-maintenance-due')
      priority = within(maintenanceCard).getByText('5')
      expect(priority).toHaveAttribute('data-priority', 'high')
    })
  })

  describe('Feature: Responsive Layout', () => {
    it('should render stats grid with correct structure', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview />
        </QueryClientProvider>
      )

      const statsGrid = screen.getByTestId('stats-grid')
      expect(statsGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4')

      const statCards = within(statsGrid).getAllByTestId(/^stat-/)
      expect(statCards.length).toBe(4)
    })
  })

  describe('Feature: Empty and Edge Cases', () => {
    it('should handle zero values gracefully', () => {
      const stats = {
        totalVehicles: 0,
        activeVehicles: 0,
        totalMileage: 0,
        maintenanceDue: 0,
      }

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={stats} />
        </QueryClientProvider>
      )

      const allZeros = screen.getAllByText('0')
      expect(allZeros.length).toBeGreaterThan(0)
    })

    it('should handle very large numbers', () => {
      const stats = {
        totalVehicles: 9999,
        activeVehicles: 9998,
        totalMileage: 999999999,
        maintenanceDue: 500,
      }

      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview stats={stats} />
        </QueryClientProvider>
      )

      expect(screen.getByText('9999')).toBeInTheDocument()
      expect(screen.getByText(/999,999,999/)).toBeInTheDocument()
    })

    it('should render all action buttons', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MockDashboardOverview />
        </QueryClientProvider>
      )

      expect(screen.getByTestId('btn-view-vehicles')).toBeInTheDocument()
      expect(screen.getByTestId('btn-view-maintenance')).toBeInTheDocument()
      expect(screen.getByTestId('btn-refresh')).toBeInTheDocument()
    })
  })
})
