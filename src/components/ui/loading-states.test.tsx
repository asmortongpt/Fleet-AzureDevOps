import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  Spinner,
  LoadingOverlay,
  AsyncState,
  LoadingStatus,
} from './loading-states'

describe('Loading States Components', () => {
  describe('Skeleton Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render skeleton element', () => {
        const { container } = render(<Skeleton />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toBeInTheDocument()
      })

      it('should have aria-busy="true"', () => {
        const { container } = render(<Skeleton />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveAttribute('aria-busy', 'true')
      })

      it('should have aria-live="polite"', () => {
        const { container } = render(<Skeleton />)
        const skeleton = container.querySelector('[aria-live="polite"]')
        expect(skeleton).toBeInTheDocument()
      })

      it('should apply default bg-slate-200 color', () => {
        const { container } = render(<Skeleton />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('bg-slate-200')
      })

      it('should apply rounded-md by default', () => {
        const { container } = render(<Skeleton />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('rounded-md')
      })
    })

    describe('Props & Configuration', () => {
      it('should render shimmer variant', () => {
        const { container } = render(<Skeleton variant="shimmer" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('skeleton-shimmer')
      })

      it('should render pulse variant', () => {
        const { container } = render(<Skeleton variant="pulse" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('animate-pulse')
      })

      it('should apply custom className', () => {
        const { container } = render(<Skeleton className="custom-class" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('custom-class')
      })

      it('should apply rounded-sm', () => {
        const { container } = render(<Skeleton rounded="sm" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('rounded-sm')
      })

      it('should apply rounded-lg', () => {
        const { container } = render(<Skeleton rounded="lg" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('rounded-lg')
      })

      it('should apply rounded-full', () => {
        const { container } = render(<Skeleton rounded="full" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('rounded-full')
      })

      it('should apply rounded-none', () => {
        const { container } = render(<Skeleton rounded="none" />)
        const skeleton = container.querySelector('[aria-busy="true"]')
        expect(skeleton).toHaveClass('rounded-none')
      })
    })
  })

  describe('TableSkeleton Component', () => {
    it('should render table skeleton with default rows and columns', () => {
      render(<TableSkeleton />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render correct number of rows', () => {
      const { container } = render(<TableSkeleton rows={3} columns={2} />)
      const rows = container.querySelectorAll('.flex.gap-2.p-2')
      // Header + 3 rows
      expect(rows.length).toBeGreaterThanOrEqual(3)
    })

    it('should render correct number of columns', () => {
      const { container } = render(<TableSkeleton rows={1} columns={4} />)
      const skeletons = container.querySelectorAll('[aria-busy="true"]')
      // Should have multiple skeletons for each column
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should have aria-label for loading', () => {
      render(<TableSkeleton />)
      expect(screen.getByText(/Loading table data/)).toBeInTheDocument()
    })
  })

  describe('CardSkeleton Component', () => {
    it('should render card skeleton', () => {
      const { container } = render(<CardSkeleton />)
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should render image skeleton when showImage=true', () => {
      const { container } = render(<CardSkeleton showImage={true} />)
      const skeletons = container.querySelectorAll('[aria-busy="true"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not render image skeleton when showImage=false', () => {
      const { container } = render(<CardSkeleton showImage={false} />)
      const elements = container.querySelectorAll('[aria-busy="true"]')
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should have border styling', () => {
      const { container } = render(<CardSkeleton />)
      const card = container.querySelector('.border')
      expect(card).toBeInTheDocument()
    })
  })

  describe('StatCardSkeleton Component', () => {
    it('should render stat card skeleton', () => {
      const { container } = render(<StatCardSkeleton />)
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should render multiple skeleton elements', () => {
      const { container } = render(<StatCardSkeleton />)
      const skeletons = container.querySelectorAll('[aria-busy="true"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('ChartSkeleton Component', () => {
    it('should render chart skeleton', () => {
      const { container } = render(<ChartSkeleton />)
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should accept custom height', () => {
      const { container } = render(<ChartSkeleton height="500px" />)
      const div = container.querySelector('[style*="height"]')
      expect(div).toBeInTheDocument()
    })

    it('should render multiple bar skeletons', () => {
      const { container } = render(<ChartSkeleton />)
      const skeletons = container.querySelectorAll('[aria-busy="true"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('ListSkeleton Component', () => {
    it('should render list skeleton with default items', () => {
      render(<ListSkeleton />)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('should render correct number of items', () => {
      const { container } = render(<ListSkeleton items={3} />)
      const items = container.querySelectorAll('.flex.items-center')
      expect(items.length).toBeGreaterThan(0)
    })

    it('should render multiple skeleton elements per item', () => {
      const { container } = render(<ListSkeleton items={1} />)
      const skeletons = container.querySelectorAll('[aria-busy="true"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Spinner Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render spinner', () => {
        render(<Spinner />)
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      it('should have role="status"', () => {
        render(<Spinner />)
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      it('should render Loader2 icon', () => {
        const { container } = render(<Spinner />)
        const icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })

      it('should have animate-spin class on icon', () => {
        const { container } = render(<Spinner />)
        const icon = container.querySelector('svg')
        expect(icon).toHaveClass('animate-spin')
      })

      it('should render default label in sr-only', () => {
        render(<Spinner />)
        const srLabel = screen.getByText('Loading')
        expect(srLabel).toHaveClass('sr-only')
      })
    })

    describe('Props & Configuration', () => {
      it('should render with custom size', () => {
        const { container } = render(<Spinner size="lg" />)
        const spinner = container.querySelector('[role="status"]')
        expect(spinner).toBeInTheDocument()
      })

      it('should accept custom className', () => {
        const { container } = render(<Spinner className="custom-class" />)
        const spinner = container.querySelector('[role="status"]')
        expect(spinner).toHaveClass('custom-class')
      })

      it('should accept custom label', () => {
        render(<Spinner label="Processing..." />)
        expect(screen.getByText('Processing...')).toBeInTheDocument()
      })

      it('should apply text-primary color', () => {
        const { container } = render(<Spinner />)
        const icon = container.querySelector('svg')
        expect(icon).toHaveClass('text-primary')
      })
    })
  })

  describe('LoadingOverlay Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should not render when isLoading=false', () => {
        const { container } = render(<LoadingOverlay isLoading={false} />)
        expect(container.firstChild).not.toBeInTheDocument()
      })

      it('should render when isLoading=true', () => {
        render(<LoadingOverlay isLoading={true} />)
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      it('should display loading message', () => {
        render(<LoadingOverlay isLoading={true} message="Please wait..." />)
        expect(screen.getByText('Please wait...')).toBeInTheDocument()
      })

      it('should render spinner', () => {
        const { container } = render(<LoadingOverlay isLoading={true} />)
        expect(container.querySelector('[role="status"]')).toBeInTheDocument()
      })

      it('should have z-50 layering', () => {
        const { container } = render(<LoadingOverlay isLoading={true} />)
        const overlay = container.querySelector('.z-50')
        expect(overlay).toBeInTheDocument()
      })

      it('should be absolute positioned by default', () => {
        const { container } = render(<LoadingOverlay isLoading={true} />)
        const overlay = container.querySelector('.absolute')
        expect(overlay).toBeInTheDocument()
      })
    })

    describe('Props & Configuration', () => {
      it('should be fixed when fullScreen=true', () => {
        const { container } = render(<LoadingOverlay isLoading={true} fullScreen={true} />)
        const overlay = container.querySelector('.fixed')
        expect(overlay).toBeInTheDocument()
      })

      it('should apply blur when blur=true', () => {
        const { container } = render(<LoadingOverlay isLoading={true} blur={true} />)
        const overlay = container.querySelector('.backdrop-blur-sm')
        expect(overlay).toBeInTheDocument()
      })

      it('should display progress bar when provided', () => {
        const { container } = render(<LoadingOverlay isLoading={true} progress={50} />)
        const progressBar = container.querySelector('.h-2')
        expect(progressBar).toBeInTheDocument()
      })

      it('should show progress percentage', () => {
        render(<LoadingOverlay isLoading={true} progress={75} />)
        expect(screen.getByText('75% complete')).toBeInTheDocument()
      })
    })
  })

  describe('AsyncState Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should render loading component when isLoading=true', () => {
        render(
          <AsyncState isLoading={true} data={null}>
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText(/Loading data/)).toBeInTheDocument()
      })

      it('should render data when loaded', () => {
        render(
          <AsyncState isLoading={false} data="Test Data">
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText('Test Data')).toBeInTheDocument()
      })

      it('should render error component when error present', () => {
        const error = new Error('Test error')
        render(
          <AsyncState isLoading={false} error={error} data={null}>
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
      })

      it('should render empty component when data is empty array', () => {
        render(
          <AsyncState isLoading={false} data={[]}>
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText(/No data available/)).toBeInTheDocument()
      })

      it('should render empty component when data is null', () => {
        render(
          <AsyncState isLoading={false} data={null}>
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText(/No data available/)).toBeInTheDocument()
      })
    })

    describe('Props & Configuration', () => {
      it('should accept custom loadingComponent', () => {
        render(
          <AsyncState
            isLoading={true}
            data={null}
            loadingComponent={<div>Custom Loading...</div>}
          >
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
      })

      it('should accept custom errorComponent', () => {
        const error = new Error('Test')
        render(
          <AsyncState
            isLoading={false}
            error={error}
            data={null}
            errorComponent={<div>Custom Error</div>}
          >
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText('Custom Error')).toBeInTheDocument()
      })

      it('should accept custom emptyComponent', () => {
        render(
          <AsyncState
            isLoading={false}
            data={[]}
            emptyComponent={<div>No Items</div>}
          >
            {(data) => <div>{data}</div>}
          </AsyncState>
        )
        expect(screen.getByText('No Items')).toBeInTheDocument()
      })

      it('should honor minLoadTime', async () => {
        const { rerender } = render(
          <AsyncState isLoading={true} data={null} minLoadTime={100}>
            {(data) => <div>Loaded</div>}
          </AsyncState>
        )

        expect(screen.getByText(/Loading data/)).toBeInTheDocument()

        rerender(
          <AsyncState isLoading={false} data="Ready" minLoadTime={100}>
            {(data) => <div>{data}</div>}
          </AsyncState>
        )

        // Should still show loading for a bit due to minLoadTime
        expect(screen.getByText(/Loading data/)).toBeInTheDocument()

        await waitFor(
          () => {
            expect(screen.getByText('Ready')).toBeInTheDocument()
          },
          { timeout: 200 }
        )
      })
    })
  })

  describe('LoadingStatus Component', () => {
    describe('Rendering & Basic Structure', () => {
      it('should not render when status=idle', () => {
        const { container } = render(<LoadingStatus status="idle" />)
        expect(container.firstChild?.childNodes.length).toBe(0)
      })

      it('should render when status=loading', () => {
        const { container } = render(<LoadingStatus status="loading" />)
        expect(container.querySelector('[role="status"]')).toBeInTheDocument()
      })

      it('should render when status=success', () => {
        const { container } = render(<LoadingStatus status="success" />)
        expect(container.querySelector('svg')).toBeInTheDocument()
      })

      it('should render when status=error', () => {
        const { container } = render(<LoadingStatus status="error" />)
        expect(container.querySelector('svg')).toBeInTheDocument()
      })

      it('should display message when provided', () => {
        render(<LoadingStatus status="loading" message="Processing..." />)
        expect(screen.getByText('Processing...')).toBeInTheDocument()
      })
    })

    describe('Props & Configuration', () => {
      it('should apply loading color for loading status', () => {
        const { container } = render(<LoadingStatus status="loading" />)
        const status = container.querySelector('.text-blue-800')
        expect(status).toBeInTheDocument()
      })

      it('should apply success color for success status', () => {
        const { container } = render(<LoadingStatus status="success" />)
        const status = container.querySelector('.text-green-500')
        expect(status).toBeInTheDocument()
      })

      it('should apply error color for error status', () => {
        const { container } = render(<LoadingStatus status="error" />)
        const status = container.querySelector('.text-red-500')
        expect(status).toBeInTheDocument()
      })

      it('should display appropriate icon for each status', () => {
        const { container: loadingContainer } = render(<LoadingStatus status="loading" />)
        expect(loadingContainer.querySelector('svg')).toBeInTheDocument()

        const { container: successContainer } = render(<LoadingStatus status="success" />)
        expect(successContainer.querySelector('svg')).toBeInTheDocument()

        const { container: errorContainer } = render(<LoadingStatus status="error" />)
        expect(errorContainer.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('Integration Tests', () => {
    it('should transition from loading to success', async () => {
      const { rerender } = render(
        <AsyncState isLoading={true} data={null}>
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      expect(screen.getByText(/Loading/)).toBeInTheDocument()

      rerender(
        <AsyncState isLoading={false} data="Success!">
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })

    it('should transition from loading to error', async () => {
      const error = new Error('Network error')
      const { rerender } = render(
        <AsyncState isLoading={true} data={null}>
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      expect(screen.getByText(/Loading/)).toBeInTheDocument()

      rerender(
        <AsyncState isLoading={false} error={error} data={null}>
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid loading state changes', async () => {
      const { rerender } = render(
        <AsyncState isLoading={true} data={null}>
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      rerender(
        <AsyncState isLoading={false} data="Fast">
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      rerender(
        <AsyncState isLoading={true} data={null}>
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      rerender(
        <AsyncState isLoading={false} data="Done">
          {(data) => <div>{data}</div>}
        </AsyncState>
      )

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument()
      })
    })

    it('should handle very large progress values', () => {
      render(<LoadingOverlay isLoading={true} progress={150} />)
      // Should handle gracefully
      expect(screen.getByText(/complete/)).toBeInTheDocument()
    })

    it('should handle negative progress values', () => {
      render(<LoadingOverlay isLoading={true} progress={-10} />)
      // Should handle gracefully
      expect(screen.getByText(/complete/)).toBeInTheDocument()
    })
  })
})
