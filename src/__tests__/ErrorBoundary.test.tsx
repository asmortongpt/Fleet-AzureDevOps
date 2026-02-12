/**
 * ErrorBoundary Component Tests
 *
 * Tests for the global error boundary with Application Insights integration
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ErrorBoundary, useErrorHandler } from '../components/ErrorBoundary'
import { telemetryService } from '../lib/telemetry'

// Mock telemetry service
vi.mock('../lib/telemetry', () => ({
  telemetryService: {
    trackException: vi.fn(),
    trackEvent: vi.fn(),
  },
}))

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

// Component that uses useErrorHandler hook
const ComponentWithErrorHandler = () => {
  const handleError = useErrorHandler()

  return (
    <button
      onClick={() => {
        try {
          throw new Error('Programmatic error')
        } catch (error) {
          handleError(error as Error)
        }
      }}
    >
      Trigger Error
    </button>
  )
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // Restore console.error
    vi.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('catches component errors and displays error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
      const fallback = <div>Custom fallback UI</div>

      render(
        <ErrorBoundary fallback={fallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom fallback UI')).toBeInTheDocument()
    })
  })

  describe('Application Insights Integration', () => {
    it('tracks error in Application Insights', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(telemetryService.trackException).toHaveBeenCalled()
      expect(telemetryService.trackEvent).toHaveBeenCalledWith(
        'ErrorBoundary_Error',
        expect.objectContaining({
          errorMessage: 'Test error message',
        })
      )
    })

    it('includes error context in telemetry', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(telemetryService.trackException).toHaveBeenCalledWith(
        expect.any(Error),
        3, // Severity level
        expect.objectContaining({
          errorBoundary: true,
          errorCount: 1,
          retryCount: 0,
        })
      )
    })
  })

  describe('Error Logging', () => {
    it('stores error log in localStorage', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorLogs = JSON.parse(localStorage.getItem('fleet-error-logs') || '[]')
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0]).toMatchObject({
        error: {
          message: 'Test error message',
        },
      })
    })

    it('limits error log size to 20 entries', () => {
      // Pre-populate localStorage with 20 errors
      const existingLogs = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        error: { message: `Error ${i}` },
      }))
      localStorage.setItem('fleet-error-logs', JSON.stringify(existingLogs))

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const errorLogs = JSON.parse(localStorage.getItem('fleet-error-logs') || '[]')
      expect(errorLogs).toHaveLength(20) // Should still be 20, oldest removed
      expect(errorLogs[0].error.message).toBe('Test error message') // New error at front
    })
  })

  describe('Retry Logic', () => {
    it('displays retry button with correct attempt count', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByText(/Retry \(0\/3\)/)
      expect(retryButton).toBeInTheDocument()
    })

    it('increments retry count when retry button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const retryButton = screen.getByText(/Retry \(0\/3\)/)
      await user.click(retryButton)

      // Wait for retry delay and check telemetry
      await waitFor(() => {
        expect(telemetryService.trackEvent).toHaveBeenCalledWith(
          'ErrorBoundary_Retry',
          expect.objectContaining({
            retryCount: '1',
          })
        )
      })
    })

    it('hides retry button after max retries', async () => {
      const user = userEvent.setup()

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // Click retry 3 times
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.queryByText(/Retry/)
        if (retryButton) {
          await user.click(retryButton)
          // Wait a bit for state update
          await new Promise(resolve => setTimeout(resolve, 100))
          rerender(
            <ErrorBoundary>
              <ThrowError />
            </ErrorBoundary>
          )
        }
      }

      // After 3 retries, button should be hidden or disabled
      await waitFor(() => {
        const retryButton = screen.queryByText(/Retry \(3\/3\)/)
        expect(retryButton).not.toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('resets error state when "Try Again" is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()

      // Change prop to not throw
      shouldThrow = false

      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      // Rerender with new prop
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('tracks reset event in telemetry', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      expect(telemetryService.trackEvent).toHaveBeenCalledWith(
        'ErrorBoundary_Reset',
        expect.any(Object)
      )
    })

    it('downloads error log when download button is clicked', async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL and document methods
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const createElementSpy = vi.spyOn(document, 'createElement')

      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      )

      const downloadButton = screen.getByText(/Download Error Log/)
      await user.click(downloadButton)

      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(telemetryService.trackEvent).toHaveBeenCalledWith('ErrorBoundary_DownloadLog')

      // Cleanup
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })
  })

  describe('Props and Configuration', () => {
    it('calls onError callback when error is caught', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('shows technical details in development mode', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError />
        </ErrorBoundary>
      )

      const details = screen.getByText('Technical Details (Development Only)')
      expect(details).toBeInTheDocument()
    })

    it('hides technical details when showDetails is false', () => {
      render(
        <ErrorBoundary showDetails={false}>
          <ThrowError />
        </ErrorBoundary>
      )

      const details = screen.queryByText('Technical Details (Development Only)')
      expect(details).not.toBeInTheDocument()
    })

    it('resets when resetKeys change', () => {
      let resetKey = 'key1'

      const { rerender } = render(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      // Trigger error
      rerender(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()

      // Change reset key
      resetKey = 'key2'
      rerender(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Error should be cleared
      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('useErrorHandler Hook', () => {
    it('allows programmatic error triggering', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ComponentWithErrorHandler />
        </ErrorBoundary>
      )

      const button = screen.getByText('Trigger Error')
      await user.click(button)

      // Error should be caught by boundary
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })
  })
})
