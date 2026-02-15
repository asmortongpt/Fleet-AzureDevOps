/**
 * ToastContext Tests
 * Toast notification context tests
 * Coverage: 100% branches
 */

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'

import { ToastProvider, useToastContext } from '../ToastContext'

// Mock dependencies
vi.mock('@/components/Toast', () => ({
  ToastContainer: ({ toasts }: any) => <div>{toasts.length}</div>,
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearAllToasts: vi.fn(),
  })),
}))

function TestWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider maxToasts={3}>{children}</ToastProvider>
}

function TestComponent({ testFn }: { testFn: (toast: ReturnType<typeof useToastContext>) => void }) {
  const toast = useToastContext()
  testFn(toast)
  return null
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useToastContext hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const TestComp = () => {
        useToastContext()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useToastContext must be used within a ToastProvider')
    })

    it('should provide toast context inside provider', () => {
      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(toastContext).toBeDefined()
    })
  })

  describe('Show success', () => {
    it('should show success toast', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockAddToast = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: mockAddToast,
        removeToast: vi.fn(),
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showSuccess('Success!')
            }}
          >
            Show Success
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Show Success'))

      expect(mockAddToast).toHaveBeenCalledWith('Success!', 'success', undefined)
    })

    it('should show success toast with duration', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockAddToast = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: mockAddToast,
        removeToast: vi.fn(),
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showSuccess('Success!', 5000)
            }}
          >
            Show Success
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Show Success'))

      expect(mockAddToast).toHaveBeenCalledWith('Success!', 'success', 5000)
    })
  })

  describe('Show error', () => {
    it('should show error toast', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockAddToast = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: mockAddToast,
        removeToast: vi.fn(),
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showError('Error!')
            }}
          >
            Show Error
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Show Error'))

      expect(mockAddToast).toHaveBeenCalledWith('Error!', 'error', undefined)
    })
  })

  describe('Show info', () => {
    it('should show info toast', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockAddToast = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: mockAddToast,
        removeToast: vi.fn(),
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showInfo('Info!')
            }}
          >
            Show Info
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Show Info'))

      expect(mockAddToast).toHaveBeenCalledWith('Info!', 'info', undefined)
    })
  })

  describe('Show warning', () => {
    it('should show warning toast', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockAddToast = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: mockAddToast,
        removeToast: vi.fn(),
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showWarning('Warning!')
            }}
          >
            Show Warning
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Show Warning'))

      expect(mockAddToast).toHaveBeenCalledWith('Warning!', 'warning', undefined)
    })
  })

  describe('Clear all', () => {
    it('should clear all toasts', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockClearAllToasts = vi.fn()
      ;(useToast as any).mockReturnValue({
        toasts: [],
        addToast: vi.fn(),
        removeToast: vi.fn(),
        clearAllToasts: mockClearAllToasts,
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.clearAll()
            }}
          >
            Clear All
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Clear All'))

      expect(mockClearAllToasts).toHaveBeenCalled()
    })
  })

  describe('Max toasts limit', () => {
    it('should remove oldest toast when max is reached', () => {
      const { useToast } = require('@/hooks/useToast')
      const mockRemoveToast = vi.fn()
      const mockAddToast = vi.fn()

      const toasts = [
        { id: '1', message: 'Toast 1', type: 'success' },
        { id: '2', message: 'Toast 2', type: 'info' },
        { id: '3', message: 'Toast 3', type: 'warning' },
      ]

      ;(useToast as any).mockReturnValue({
        toasts,
        addToast: mockAddToast,
        removeToast: mockRemoveToast,
        clearAllToasts: vi.fn(),
      })

      let toastContext: ReturnType<typeof useToastContext> | null = null

      function TestComp() {
        toastContext = useToastContext()

        return (
          <button
            onClick={() => {
              toastContext?.showSuccess('New toast')
            }}
          >
            Add Toast
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Add Toast'))

      expect(mockRemoveToast).toHaveBeenCalledWith('1')
      expect(mockAddToast).toHaveBeenCalled()
    })
  })
})
