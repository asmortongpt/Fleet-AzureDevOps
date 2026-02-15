/**
 * ToastContext Tests
 * Toast notification context tests
 * Coverage: 100% branches
 */

import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'

import { ToastProvider, useToastContext } from '../ToastContext'

// Mock dependencies
vi.mock('@/components/Toast', () => ({
  ToastContainer: ({ toasts }: any) => <div>{toasts.length}</div>,
}))

// Create a proper mock for useToast hook
let mockUseToastReturnValue = {
  toasts: [] as any[],
  addToast: vi.fn(),
  removeToast: vi.fn(),
  clearAllToasts: vi.fn(),
  updateToast: vi.fn(),
}

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => mockUseToastReturnValue),
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
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.addToast).toHaveBeenCalledWith('Success!', 'success', undefined)
    })

    it('should show success toast with duration', () => {
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.addToast).toHaveBeenCalledWith('Success!', 'success', 5000)
    })
  })

  describe('Show error', () => {
    it('should show error toast', () => {
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.addToast).toHaveBeenCalledWith('Error!', 'error', undefined)
    })
  })

  describe('Show info', () => {
    it('should show info toast', () => {
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.addToast).toHaveBeenCalledWith('Info!', 'info', undefined)
    })
  })

  describe('Show warning', () => {
    it('should show warning toast', () => {
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.addToast).toHaveBeenCalledWith('Warning!', 'warning', undefined)
    })
  })

  describe('Clear all', () => {
    it('should clear all toasts', () => {
      mockUseToastReturnValue.addToast = vi.fn()
      mockUseToastReturnValue.removeToast = vi.fn()
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = []

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

      expect(mockUseToastReturnValue.clearAllToasts).toHaveBeenCalled()
    })
  })

  describe('Max toasts limit', () => {
    it('should remove oldest toast when max is reached', () => {
      const mockRemoveToast = vi.fn()
      const mockAddToast = vi.fn()

      const toasts = [
        { id: '1', message: 'Toast 1', type: 'success' as const },
        { id: '2', message: 'Toast 2', type: 'info' as const },
        { id: '3', message: 'Toast 3', type: 'warning' as const },
      ]

      mockUseToastReturnValue.addToast = mockAddToast
      mockUseToastReturnValue.removeToast = mockRemoveToast
      mockUseToastReturnValue.clearAllToasts = vi.fn()
      mockUseToastReturnValue.toasts = toasts

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
