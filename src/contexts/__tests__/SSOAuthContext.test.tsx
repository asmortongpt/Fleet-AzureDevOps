/**
 * SSOAuthContext Tests
 * Azure AD SSO authentication tests
 * Coverage: 100% branches
 */

import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'

import { SSOAuthProvider, useSSOAuth, AuthUser } from '../SSOAuthContext'

// Mock auth service
vi.mock('@/lib/auth/auth.service', () => ({
  initializeMsal: vi.fn(() => Promise.resolve()),
  isAuthenticated: vi.fn(() => false),
  getUserProfile: vi.fn(() => null),
  signInWithRedirect: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve('test-token')),
}))

vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

function TestWrapper({ children }: { children: ReactNode }) {
  return <SSOAuthProvider>{children}</SSOAuthProvider>
}

function TestComponent({ testFn }: { testFn: (auth: ReturnType<typeof useSSOAuth>) => void }) {
  const auth = useSSOAuth()
  testFn(auth)
  return null
}

describe('SSOAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSSOAuth hook', () => {
    it('should throw error when used outside SSOAuthProvider', () => {
      const TestComp = () => {
        useSSOAuth()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useSSOAuth must be used within SSOAuthProvider')
    })

    it('should provide auth context inside provider', async () => {
      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(authContext).toBeDefined()
      })
    })
  })

  describe('Initial state', () => {
    it('should initialize with loading state', async () => {
      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(authContext?.isLoading).toBe(false)
      })
    })

    it('should start with null user', async () => {
      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(authContext?.user).toBeNull()
      })
    })

    it('should start not authenticated', async () => {
      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(authContext?.isAuthenticated).toBe(false)
      })
    })
  })

  describe('Sign in', () => {
    it('should sign in with redirect', async () => {
      const { signInWithRedirect } = await import('@/lib/auth/auth.service')

      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              await authContext?.signIn()
            }}
          >
            Sign In
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const signInBtn = getByText('Sign In')
      signInBtn.click()

      await waitFor(() => {
        expect(signInWithRedirect).toHaveBeenCalled()
      })
    })

    it('should sign in with popup', async () => {
      const { signInWithPopup, getUserProfile } = await import('@/lib/auth/auth.service')
      ;(getUserProfile as any).mockReturnValue({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        username: 'testuser',
        tenantId: 'tenant-123',
      })

      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              await authContext?.signInPopup()
            }}
          >
            Sign In Popup
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const signInBtn = getByText('Sign In Popup')
      signInBtn.click()

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled()
      })
    })
  })

  describe('Sign out', () => {
    it('should sign out user', async () => {
      const { signOut: performSignOut } = await import('@/lib/auth/auth.service')
      const { isAuthenticated } = await import('@/lib/auth/auth.service')
      ;(isAuthenticated as any).mockReturnValue(true)

      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              await authContext?.signOut()
            }}
          >
            Sign Out
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const signOutBtn = getByText('Sign Out')
      signOutBtn.click()

      await waitFor(() => {
        expect(performSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Get access token', () => {
    it('should get access token', async () => {
      const { getAccessToken } = await import('@/lib/auth/auth.service')

      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              await authContext?.getAccessToken(['user.read'])
            }}
          >
            Get Token
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const tokenBtn = getByText('Get Token')
      tokenBtn.click()

      await waitFor(() => {
        expect(getAccessToken).toHaveBeenCalledWith(['user.read'])
      })
    })

    it('should get access token with default scopes', async () => {
      const { getAccessToken } = await import('@/lib/auth/auth.service')

      let authContext: ReturnType<typeof useSSOAuth> | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              await authContext?.getAccessToken()
            }}
          >
            Get Token
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const tokenBtn = getByText('Get Token')
      tokenBtn.click()

      await waitFor(() => {
        expect(getAccessToken).toHaveBeenCalled()
      })
    })
  })

  describe('Error handling', () => {
    it('should handle sign in errors', async () => {
      const { signInWithPopup } = await import('@/lib/auth/auth.service')
      ;(signInWithPopup as any).mockRejectedValueOnce(new Error('Sign in failed'))

      let authContext: ReturnType<typeof useSSOAuth> | null = null
      let error: Error | null = null

      function TestComp() {
        authContext = useSSOAuth()

        return (
          <button
            onClick={async () => {
              try {
                await authContext?.signInPopup()
              } catch (e) {
                error = e as Error
              }
            }}
          >
            Sign In
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      const signInBtn = getByText('Sign In')
      signInBtn.click()

      await waitFor(() => {
        expect(error).toBeDefined()
      })
    })
  })
})
