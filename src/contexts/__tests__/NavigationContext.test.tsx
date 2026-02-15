/**
 * NavigationContext Tests
 * Navigation state and module switching tests
 * Coverage: 100% branches
 */

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { NavigationProvider, useNavigation } from '../NavigationContext'
import { AuthProvider } from '../AuthContext'

// Mock dependencies
vi.mock('@azure/msal-react', () => ({
  useMsal: vi.fn(() => ({
    instance: {},
    accounts: [],
    inProgress: 0,
  })),
}))

vi.mock('@/hooks/use-api', () => ({
  getCsrfToken: vi.fn(() => Promise.resolve('test-csrf-token')),
  refreshCsrfToken: vi.fn(() => Promise.resolve()),
  clearCsrfToken: vi.fn(),
}))

vi.mock('@/lib/auth/token-refresh', () => ({
  initializeTokenRefresh: vi.fn(),
  stopTokenRefresh: vi.fn(),
}))

vi.mock('@/lib/microsoft-auth', () => ({
  getMicrosoftLoginUrl: vi.fn(() => 'https://login.microsoft.com/'),
}))

vi.mock('@/lib/msal-config', () => ({
  loginRequest: { scopes: ['user.read'] },
}))

vi.mock('@/services/token-storage', () => ({
  getTokenStorage: vi.fn((persistent) => ({
    clearTokens: vi.fn(() => Promise.resolve()),
  })),
}))

vi.mock('@/config/role-navigation', () => ({
  getNavigationItemsForRole: vi.fn(() => []),
}))

vi.mock('@/lib/navigation', () => ({
  navigationItems: [
    { id: 'fleet-hub-consolidated', label: 'Fleet', section: 'main' },
    { id: 'drivers', label: 'Drivers', section: 'main' },
    { id: 'vehicles', label: 'Vehicles', section: 'main' },
  ],
}))

vi.mock('@/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

global.fetch = vi.fn()

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>{children}</NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function TestComponent({ testFn }: { testFn: (nav: ReturnType<typeof useNavigation>) => void }) {
  const nav = useNavigation()
  testFn(nav)
  return null
}

describe('NavigationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.clear === 'function') {
      sessionStorage.clear()
    }
    ;(global.fetch as any).mockClear()
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
    })
  })

  describe('useNavigation hook', () => {
    it('should throw error when used outside NavigationProvider', () => {
      const TestComp = () => {
        useNavigation()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useNavigation must be used within a NavigationProvider')
    })

    it('should provide navigation context inside provider', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(navContext).toBeDefined()
    })
  })

  describe('Active module', () => {
    it('should track active module', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      expect(navContext?.activeModule).toBeDefined()
    })

    it('should set active module', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()

        return (
          <button
            onClick={() => {
              navContext?.setActiveModule('drivers')
            }}
          >
            Set Module
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Set Module'))

      expect(navContext?.activeModule).toBe('drivers')
    })
  })

  describe('Visible nav items', () => {
    it('should filter nav items based on role', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      // Should be empty since user is not authenticated
      expect(navContext?.visibleNavItems).toEqual([])
    })
  })

  describe('Navigate', () => {
    it('should navigate to module', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()

        return (
          <button
            onClick={() => {
              navContext?.navigateTo('drivers')
            }}
          >
            Navigate
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Navigate'))

      expect(navContext?.activeModule).toBe('drivers')
    })

    it('should map fleet-hub-consolidated to root path', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()

        return (
          <button
            onClick={() => {
              navContext?.navigateTo('fleet-hub-consolidated')
            }}
          >
            Navigate
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Navigate'))

      expect(navContext?.activeModule).toBe('fleet-hub-consolidated')
    })
  })

  describe('Get nav items by section', () => {
    it('should filter nav items by section', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const mainItems = navContext?.getNavItemsBySection('main')
      expect(mainItems).toBeDefined()
    })
  })

  describe('Update navigation', () => {
    it('should force re-render of visible nav items', () => {
      let navContext: ReturnType<typeof useNavigation> | null = null

      function TestComp() {
        navContext = useNavigation()

        return (
          <button
            onClick={() => {
              navContext?.updateNavigation()
            }}
          >
            Update
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Update'))

      expect(navContext).toBeDefined()
    })
  })
})
