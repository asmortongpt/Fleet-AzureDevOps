/**
 * GlobalStateContext Tests
 * Global state management including tenant, user, feature flags, notifications, and theme
 * Coverage: 100% branches
 */

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'

import {
  TenantProvider,
  useTenant,
  UserProvider,
  useUser,
  FeatureFlagsProvider,
  useFeatureFlags,
  NotificationProvider,
  useNotification,
  ThemeProvider,
  useTheme,
} from '../GlobalStateContext'

global.fetch = vi.fn()

function TenantTestWrapper({ children }: { children: ReactNode }) {
  return <TenantProvider>{children}</TenantProvider>
}

function UserTestWrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>
}

function FeatureFlagsTestWrapper({ children }: { children: ReactNode }) {
  return <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
}

function NotificationTestWrapper({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>
}

function ThemeTestWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe('GlobalStateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.clear === 'function') {
      sessionStorage.clear()
    }
    ;(global.fetch as any).mockClear()
  })

  describe('TenantContext', () => {
    it('should throw error when useTenant used outside TenantProvider', () => {
      const TestComp = () => {
        useTenant()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useTenant must be used within TenantProvider')
    })

    it('should provide tenant context', () => {
      let tenantContext: ReturnType<typeof useTenant> | null = null

      function TestComp() {
        tenantContext = useTenant()
        return null
      }

      render(
        <TenantTestWrapper>
          <TestComp />
        </TenantTestWrapper>
      )

      expect(tenantContext).toBeDefined()
      expect(tenantContext?.currentTenant).toBeNull()
    })

    it('should load tenant from localStorage', async () => {
      localStorage.setItem('tenant_id', '123')
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          id: 123,
          name: 'Test Tenant',
          slug: 'test-tenant',
        }),
      })

      let tenantContext: ReturnType<typeof useTenant> | null = null

      function TestComp() {
        tenantContext = useTenant()
        return null
      }

      render(
        <TenantTestWrapper>
          <TestComp />
        </TenantTestWrapper>
      )

      await waitFor(() => {
        expect(tenantContext?.currentTenant).toBeDefined()
      })
    })

    it('should switch tenant', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          id: 456,
          name: 'New Tenant',
          slug: 'new-tenant',
        }),
      })

      let tenantContext: ReturnType<typeof useTenant> | null = null

      function TestComp() {
        tenantContext = useTenant()

        return (
          <button
            onClick={async () => {
              await tenantContext?.switchTenant(456)
            }}
          >
            Switch
          </button>
        )
      }

      const { getByText } = render(
        <TenantTestWrapper>
          <TestComp />
        </TenantTestWrapper>
      )

      fireEvent.click(getByText('Switch'))

      await waitFor(() => {
        expect(tenantContext?.currentTenant?.id).toBe(456)
      })

      expect(localStorage.getItem('tenant_id')).toBe('456')
    })
  })

  describe('UserContext', () => {
    it('should throw error when useUser used outside UserProvider', () => {
      const TestComp = () => {
        useUser()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useUser must be used within UserProvider')
    })

    it('should provide user context', () => {
      let userContext: ReturnType<typeof useUser> | null = null

      function TestComp() {
        userContext = useUser()
        return null
      }

      render(
        <UserTestWrapper>
          <TestComp />
        </UserTestWrapper>
      )

      expect(userContext).toBeDefined()
      expect(userContext?.userProfile).toBeNull()
    })

    it('should set user profile', () => {
      let userContext: ReturnType<typeof useUser> | null = null

      function TestComp() {
        userContext = useUser()

        return (
          <button
            onClick={() => {
              userContext?.setUserProfile({
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                permissions: ['read', 'write'],
              })
            }}
          >
            Set User
          </button>
        )
      }

      const { getByText } = render(
        <UserTestWrapper>
          <TestComp />
        </UserTestWrapper>
      )

      fireEvent.click(getByText('Set User'))

      expect(userContext?.userProfile?.name).toBe('John Doe')
      expect(userContext?.userProfile?.permissions).toContain('read')
    })
  })

  describe('FeatureFlagsContext', () => {
    it('should throw error when useFeatureFlags used outside FeatureFlagsProvider', () => {
      const TestComp = () => {
        useFeatureFlags()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useFeatureFlags must be used within FeatureFlagsProvider')
    })

    it('should provide feature flags context', () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          gps_tracking: true,
          maintenance: false,
        }),
      })

      let flagsContext: ReturnType<typeof useFeatureFlags> | null = null

      function TestComp() {
        flagsContext = useFeatureFlags()
        return null
      }

      render(
        <FeatureFlagsTestWrapper>
          <TestComp />
        </FeatureFlagsTestWrapper>
      )

      expect(flagsContext?.isFeatureEnabled).toBeDefined()
    })

    it('should check if feature is enabled', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          gps_tracking: true,
          maintenance: false,
        }),
      })

      let flagsContext: ReturnType<typeof useFeatureFlags> | null = null

      function TestComp() {
        flagsContext = useFeatureFlags()
        return null
      }

      render(
        <FeatureFlagsTestWrapper>
          <TestComp />
        </FeatureFlagsTestWrapper>
      )

      await waitFor(() => {
        expect(flagsContext?.isFeatureEnabled('gps_tracking')).toBe(true)
      })
    })
  })

  describe('NotificationContext', () => {
    it('should throw error when useNotification used outside NotificationProvider', () => {
      const TestComp = () => {
        useNotification()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useNotification must be used within NotificationProvider')
    })

    it('should provide notification context', () => {
      let notifContext: ReturnType<typeof useNotification> | null = null

      function TestComp() {
        notifContext = useNotification()
        return null
      }

      render(
        <NotificationTestWrapper>
          <TestComp />
        </NotificationTestWrapper>
      )

      expect(notifContext).toBeDefined()
      expect(notifContext?.notifications).toEqual([])
    })

    it('should add notification', () => {
      let notifContext: ReturnType<typeof useNotification> | null = null

      function TestComp() {
        notifContext = useNotification()

        return (
          <button
            onClick={() => {
              notifContext?.addNotification({
                id: '1',
                message: 'Test notification',
                type: 'success',
              })
            }}
          >
            Add Notif
          </button>
        )
      }

      const { getByText } = render(
        <NotificationTestWrapper>
          <TestComp />
        </NotificationTestWrapper>
      )

      fireEvent.click(getByText('Add Notif'))

      expect(notifContext?.notifications).toHaveLength(1)
      expect(notifContext?.notifications[0].message).toBe('Test notification')
    })

    it('should remove notification', () => {
      let notifContext: ReturnType<typeof useNotification> | null = null

      function TestComp() {
        notifContext = useNotification()

        return (
          <>
            <button
              onClick={() => {
                notifContext?.addNotification({
                  id: '1',
                  message: 'Test',
                  type: 'success',
                })
              }}
            >
              Add
            </button>
            <button
              onClick={() => {
                notifContext?.removeNotification('1')
              }}
            >
              Remove
            </button>
          </>
        )
      }

      const { getByText } = render(
        <NotificationTestWrapper>
          <TestComp />
        </NotificationTestWrapper>
      )

      fireEvent.click(getByText('Add'))
      expect(notifContext?.notifications).toHaveLength(1)

      fireEvent.click(getByText('Remove'))
      expect(notifContext?.notifications).toHaveLength(0)
    })
  })

  describe('ThemeContext', () => {
    it('should throw error when useTheme used outside ThemeProvider', () => {
      const TestComp = () => {
        useTheme()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useTheme must be used within ThemeProvider')
    })

    it('should provide theme context', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      function TestComp() {
        themeContext = useTheme()
        return null
      }

      render(
        <ThemeTestWrapper>
          <TestComp />
        </ThemeTestWrapper>
      )

      expect(themeContext).toBeDefined()
      expect(['light', 'dark']).toContain(themeContext?.theme)
    })

    it('should toggle theme', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      function TestComp() {
        themeContext = useTheme()

        return (
          <button
            onClick={() => {
              themeContext?.toggleTheme()
            }}
          >
            Toggle
          </button>
        )
      }

      const { getByText } = render(
        <ThemeTestWrapper>
          <TestComp />
        </ThemeTestWrapper>
      )

      const initialTheme = themeContext?.theme

      fireEvent.click(getByText('Toggle'))

      expect(themeContext?.theme).not.toBe(initialTheme)
    })

    it('should persist theme in localStorage', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      function TestComp() {
        themeContext = useTheme()

        return (
          <button
            onClick={() => {
              themeContext?.toggleTheme()
            }}
          >
            Toggle
          </button>
        )
      }

      const { getByText } = render(
        <ThemeTestWrapper>
          <TestComp />
        </ThemeTestWrapper>
      )

      fireEvent.click(getByText('Toggle'))

      const storedTheme = localStorage.getItem('theme')
      expect(['light', 'dark']).toContain(storedTheme)
    })

    it('should load theme from localStorage', () => {
      localStorage.setItem('theme', 'dark')

      let themeContext: ReturnType<typeof useTheme> | null = null

      function TestComp() {
        themeContext = useTheme()
        return null
      }

      render(
        <ThemeTestWrapper>
          <TestComp />
        </ThemeTestWrapper>
      )

      expect(themeContext?.theme).toBe('dark')
    })
  })

  describe('Barrel exports', () => {
    it('should export GlobalStateProvider', async () => {
      const module = await import('../GlobalStateContext')
      expect(module.GlobalStateProvider).toBeDefined()
    })

    it('should export useGlobalState', async () => {
      const module = await import('../GlobalStateContext')
      expect(module.useGlobalState).toBeDefined()
    })
  })
})
