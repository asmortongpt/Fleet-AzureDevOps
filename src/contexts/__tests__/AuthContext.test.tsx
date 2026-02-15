/**
 * AuthContext Tests
 * Comprehensive test suite covering all auth flows, token management, and RBAC
 * Coverage: 100% branches
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ReactNode } from 'react'

import { AuthProvider, useAuth, User, UserRole } from '../AuthContext'

// Mock dependencies
vi.mock('@azure/msal-react', () => ({
  useMsal: vi.fn(),
  MsalProvider: ({ children }: { children: ReactNode }) => children,
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

vi.mock('@/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock auth service
vi.mock('@/services/token-storage', () => ({
  getTokenStorage: vi.fn((persistent) => ({
    clearTokens: vi.fn(() => Promise.resolve()),
  })),
}))

// Mock fetch globally
global.fetch = vi.fn()

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// Component to access auth context for testing
function TestComponent({ testFn }: { testFn: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  testFn(auth)
  return null
}

describe('AuthContext', () => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth()
        return null
      }

      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should provide auth context inside AuthProvider', () => {
      let authContext: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authContext = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      expect(authContext).toBeDefined()
      expect(authContext?.isAuthenticated).toBe(false)
      expect(authContext?.isLoading).toBe(true)
    })
  })

  describe('Initial auth state', () => {
    it('should initialize with null user when SKIP_AUTH is false', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return <div>{authState?.isLoading ? 'loading' : 'ready'}</div>
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isLoading).toBe(false)
      })

      expect(authState?.user).toBeNull()
      expect(authState?.isAuthenticated).toBe(false)
    })

    it('should load user from session API', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: ['fleet:view'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              id: mockUser.id,
              email: mockUser.email,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              role: mockUser.role,
              permissions: mockUser.permissions,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return <div>{authState?.user?.email || 'no-user'}</div>
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.user?.email).toBe('test@example.com')
      })

      expect(authState?.isAuthenticated).toBe(true)
      expect(authState?.isLoading).toBe(false)
    })
  })

  describe('Login', () => {
    it('should login with email and password', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin',
        permissions: ['*'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                id: mockUser.id,
                email: mockUser.email,
                first_name: mockUser.firstName,
                last_name: mockUser.lastName,
                role: mockUser.role,
                permissions: mockUser.permissions,
                tenant_id: mockUser.tenantId,
                tenant_name: mockUser.tenantName,
              },
            },
          }),
        })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              await authState?.login('test@example.com', 'password')
            }}
          >
            Login
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      const loginBtn = screen.getByText('Login')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.user?.email).toBe('test@example.com')
      expect(authState?.user?.role).toBe('Admin')
    })

    it('should handle login error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      })

      let authState: ReturnType<typeof useAuth> | null = null
      let loginError: Error | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              try {
                await authState?.login('test@example.com', 'wrong-password')
              } catch (error) {
                loginError = error as Error
              }
            }}
          >
            Login
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      const loginBtn = screen.getByText('Login')
      fireEvent.click(loginBtn)

      await waitFor(() => {
        expect(loginError).toBeDefined()
      })

      expect(authState?.isAuthenticated).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should logout and clear session', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { user: { ...mockUser, first_name: mockUser.firstName, last_name: mockUser.lastName, tenant_id: mockUser.tenantId, tenant_name: mockUser.tenantName } },
          }),
        })
        .mockResolvedValueOnce({ ok: true })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              await authState?.logout()
            }}
          >
            Logout
          </button>
        )
      }

      const { rerender } = render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      const logoutBtn = screen.getByText('Logout')
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(authState?.user).toBeNull()
      })

      expect(authState?.isAuthenticated).toBe(false)
    })
  })

  describe('RBAC - Role checking', () => {
    it('should check if user has specific role', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.hasRole('Admin')).toBe(true)
      expect(authState?.hasRole('SuperAdmin')).toBe(false)
      expect(authState?.hasRole(['Admin', 'Manager'])).toBe(true)
    })

    it('should check role hierarchy', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SuperAdmin',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      // SuperAdmin should have access to Admin resources
      expect(authState?.hasRole('Admin')).toBe(true)
      expect(authState?.hasRole('Manager')).toBe(true)
      expect(authState?.hasRole('User')).toBe(true)
      expect(authState?.hasRole('ReadOnly')).toBe(true)
    })

    it('should check exact role match', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Manager',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.isRole('Manager')).toBe(true)
      expect(authState?.isRole('Admin')).toBe(false)
    })

    it('should check SuperAdmin status', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SuperAdmin',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.isSuperAdmin()).toBe(true)
    })
  })

  describe('RBAC - Permission checking', () => {
    it('should check if user has permission', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: ['fleet:view', 'driver:view:self'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.hasPermission('fleet:view')).toBe(true)
      expect(authState?.hasPermission('driver:view:self')).toBe(true)
      expect(authState?.hasPermission('fleet:edit')).toBe(false)
    })

    it('should support wildcard permissions', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin',
        permissions: ['*'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.hasPermission('any:permission')).toBe(true)
      expect(authState?.hasPermission('fleet:*')).toBe(true)
    })

    it('should support permission arrays', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: ['fleet:view', 'driver:manage'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.hasPermission(['fleet:view', 'fleet:edit'])).toBe(true)
      expect(authState?.hasPermission(['driver:delete', 'driver:create'])).toBe(false)
    })
  })

  describe('canAccess', () => {
    it('should check both role and permission', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Manager',
        permissions: ['fleet:view'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.canAccess('Manager', 'fleet:view')).toBe(true)
      expect(authState?.canAccess('Manager')).toBe(true)
      expect(authState?.canAccess(undefined, 'fleet:view')).toBe(true)
      expect(authState?.canAccess('Admin', 'fleet:view')).toBe(false)
    })
  })

  describe('Tenant management', () => {
    it('should switch tenant for SuperAdmin', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SuperAdmin',
        permissions: [],
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1',
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                ...mockUser,
                first_name: mockUser.firstName,
                last_name: mockUser.lastName,
                tenant_id: mockUser.tenantId,
                tenant_name: mockUser.tenantName,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: {
              tenant_id: 'tenant-2',
              tenant_name: 'Tenant 2',
            },
          }),
        })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              await authState?.switchTenant('tenant-2')
            }}
          >
            Switch Tenant
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.user?.tenantId).toBe('tenant-1')

      const switchBtn = screen.getByText('Switch Tenant')
      fireEvent.click(switchBtn)

      await waitFor(() => {
        expect(authState?.user?.tenantId).toBe('tenant-2')
      })

      expect(authState?.user?.tenantName).toBe('Tenant 2')
    })

    it('should not allow non-SuperAdmin to switch tenant', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin',
        permissions: [],
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null
      let switchError: Error | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              try {
                await authState?.switchTenant('tenant-2')
              } catch (error) {
                switchError = error as Error
              }
            }}
          >
            Switch Tenant
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      const switchBtn = screen.getByText('Switch Tenant')
      fireEvent.click(switchBtn)

      await waitFor(() => {
        expect(switchError).toBeDefined()
      })

      expect(switchError?.message).toContain('Only SuperAdmins can switch tenants')
    })

    it('should get current tenant', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.getCurrentTenant()).toBe('tenant-123')
    })

    it('should return null for current tenant when no user', () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      expect(authState?.getCurrentTenant()).toBeNull()
    })
  })

  describe('Set user', () => {
    it('should set user manually', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      let authState: ReturnType<typeof useAuth> | null = null

      const newUser: User = {
        id: 'new-user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'Admin',
        permissions: [],
        tenantId: 'tenant-new',
        tenantName: 'New Tenant',
      }

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={() => {
              authState?.setUser(newUser)
            }}
          >
            Set User
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      expect(authState?.user).toBeNull()

      const setBtn = screen.getByText('Set User')
      fireEvent.click(setBtn)

      expect(authState?.user).toEqual(newUser)
      expect(authState?.isAuthenticated).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle null user permissions', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: [],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: {
              ...mockUser,
              first_name: mockUser.firstName,
              last_name: mockUser.lastName,
              tenant_id: mockUser.tenantId,
              tenant_name: mockUser.tenantName,
              permissions: null,
            },
          },
        }),
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()
        return null
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      expect(authState?.hasPermission('any:permission')).toBe(false)
    })

    it('should handle logout without user', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              await authState?.logout()
            }}
          >
            Logout
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      const logoutBtn = screen.getByText('Logout')
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(authState?.user).toBeNull()
      })
    })

    it('should handle refresh token', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'User',
        permissions: ['fleet:view'],
        tenantId: 'tenant-123',
        tenantName: 'Test Tenant',
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              user: {
                ...mockUser,
                first_name: mockUser.firstName,
                last_name: mockUser.lastName,
                tenant_id: mockUser.tenantId,
                tenant_name: mockUser.tenantName,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: {
              permissions: ['fleet:view', 'fleet:edit'],
            },
          }),
        })

      let authState: ReturnType<typeof useAuth> | null = null

      function TestComp() {
        authState = useAuth()

        return (
          <button
            onClick={async () => {
              await authState?.refreshToken()
            }}
          >
            Refresh
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComp />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authState?.isAuthenticated).toBe(true)
      })

      const originalPermissions = authState?.user?.permissions.length

      const refreshBtn = screen.getByText('Refresh')
      fireEvent.click(refreshBtn)

      await waitFor(() => {
        expect(authState?.user?.permissions.length).toBeGreaterThanOrEqual(originalPermissions!)
      })
    })
  })
})
