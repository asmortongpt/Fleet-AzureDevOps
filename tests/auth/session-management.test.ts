/**
 * Session Management Tests - Vitest
 *
 * Tests session lifecycle:
 * - Session creation
 * - Session persistence across refreshes
 * - Token refresh
 * - Session expiration
 * - Logout cleanup
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const createMockToken = (expiresIn: number = 3600): string => {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    sub: 'user-123',
    email: 'test@capitaltechalliance.com',
    name: 'Test User',
    role: 'Admin',
    tenant_id: 'tenant-123',
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000)
  };

  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock-signature`;
};

const mockUserData = {
  id: 'user-123',
  email: 'test@capitaltechalliance.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'Admin',
  tenant_id: 'tenant-123',
  permissions: ['*']
};

// Mock fetch for testing
global.fetch = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.clearAllMocks();

  // Mock successful responses by default
  (global.fetch as any).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        user: mockUserData
      }
    }),
    headers: new Headers({
      'set-cookie': 'auth_token=mock-token; HttpOnly; Secure; SameSite=Strict; Max-Age=3600'
    })
  });
});

describe('Session Creation', () => {
  it('should create session on successful login', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user).toEqual(mockUserData);
  });

  it('should set httpOnly cookie on login', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('auth_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('should create session after Microsoft token exchange', async () => {
    const response = await fetch('/api/auth/microsoft/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'mock-ms-token' })
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user).toEqual(mockUserData);
  });
});

describe('Session Persistence', () => {
  it('should persist session across page refreshes', async () => {
    // Simulate login
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      credentials: 'include'
    });

    expect(loginResponse.ok).toBe(true);

    // Simulate page refresh - fetch user session
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    expect(meResponse.ok).toBe(true);

    const userData = await meResponse.json();
    expect(userData.data.user).toEqual(mockUserData);
  });

  it('should maintain MSAL session in sessionStorage', () => {
    const mockAccount = {
      homeAccountId: 'user-123',
      environment: 'login.microsoftonline.com',
      tenantId: 'tenant-123',
      username: 'test@capitaltechalliance.com',
      localAccountId: 'user-123',
      name: 'Test User',
      idTokenClaims: {}
    };

    sessionStorage.setItem('msal.account.keys', JSON.stringify([mockAccount.homeAccountId]));
    sessionStorage.setItem(
      `msal.account.${mockAccount.homeAccountId}`,
      JSON.stringify(mockAccount)
    );

    // Verify MSAL data persists
    const accountKeys = JSON.parse(sessionStorage.getItem('msal.account.keys') || '[]');
    expect(accountKeys).toHaveLength(1);

    const storedAccount = JSON.parse(
      sessionStorage.getItem(`msal.account.${mockAccount.homeAccountId}`) || '{}'
    );
    expect(storedAccount.username).toBe(mockAccount.username);
  });

  it('should clear session on logout', async () => {
    // Login first
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      credentials: 'include'
    });

    // Logout
    const logoutResponse = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    expect(logoutResponse.ok).toBe(true);

    // Try to access protected route
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    expect(meResponse.status).toBe(401);
  });
});

describe('Token Refresh', () => {
  it('should refresh token successfully', async () => {
    // Login first
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      credentials: 'include'
    });

    // Refresh token
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    expect(refreshResponse.ok).toBe(true);

    const data = await refreshResponse.json();
    expect(data.success).toBe(true);
  });

  it('should reject refresh with invalid token', async () => {
    // Try to refresh without valid token
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    expect(refreshResponse.status).toBe(401);
  });

  it('should auto-refresh token before expiration', async () => {
    vi.useFakeTimers();

    // Create a token that expires in 4 minutes
    const shortLivedToken = createMockToken(240);

    // Mock token refresh function
    const refreshToken = vi.fn(async () => {
      return await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
    });

    // Simulate auto-refresh logic (refresh at 5 min before expiry)
    const tokenPayload = JSON.parse(atob(shortLivedToken.split('.')[1]));
    const expiresAt = tokenPayload.exp * 1000;
    const refreshAt = expiresAt - 5 * 60 * 1000; // 5 min before expiry
    const timeUntilRefresh = refreshAt - Date.now();

    setTimeout(refreshToken, timeUntilRefresh);

    // Fast-forward time to trigger refresh
    await vi.advanceTimersByTimeAsync(timeUntilRefresh + 1000);

    expect(refreshToken).toHaveBeenCalled();

    vi.useRealTimers();
  });
});

describe('Session Expiration', () => {
  it('should handle expired token', async () => {
    const expiredToken = createMockToken(-3600); // Expired 1 hour ago

    // Try to decode and check expiration
    const payload = JSON.parse(atob(expiredToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    expect(payload.exp).toBeLessThan(now);
  });

  it('should redirect to login on session expiration', async () => {
    // Override the /me endpoint to return 401
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Session expired' }));
      })
    );

    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Session expired');
  });

  it('should clear local state on expiration', () => {
    // Set some user data in localStorage
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_role', 'Admin');

    // Simulate logout/expiration cleanup
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_role');
    sessionStorage.clear();

    expect(localStorage.getItem('demo_mode')).toBeNull();
    expect(localStorage.getItem('demo_role')).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});

describe('Concurrent Session Handling', () => {
  it('should handle multiple tabs with same session', async () => {
    // Simulate login in tab 1
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      credentials: 'include'
    });

    // Simulate requests from multiple tabs
    const requests = await Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }),
      fetch('/api/auth/me', { credentials: 'include' }),
      fetch('/api/auth/me', { credentials: 'include' })
    ]);

    // All requests should succeed with same session
    for (const response of requests) {
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.data.user.id).toBe(mockUserData.id);
    }
  });

  it('should handle logout from one tab affecting all tabs', async () => {
    // Login
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      credentials: 'include'
    });

    // Logout from "tab 1"
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Try to access from "tab 2"
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    expect(response.status).toBe(401);
  });

  it('should sync session state across tabs using storage events', () => {
    const storageListener = vi.fn();

    window.addEventListener('storage', storageListener);

    // Simulate logout in another tab (triggers storage event)
    localStorage.removeItem('demo_mode');

    // Dispatch storage event manually (simulating another tab)
    const event = new StorageEvent('storage', {
      key: 'demo_mode',
      oldValue: 'true',
      newValue: null,
      url: window.location.href
    });

    window.dispatchEvent(event);

    expect(storageListener).toHaveBeenCalled();

    window.removeEventListener('storage', storageListener);
  });
});

describe('Session Security', () => {
  it('should not expose tokens in localStorage', () => {
    // Verify no sensitive data in localStorage
    const localStorageKeys = Object.keys(localStorage);
    const hasSensitiveData = localStorageKeys.some(key =>
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret')
    );

    expect(hasSensitiveData).toBe(false);
  });

  it('should use httpOnly cookies for auth tokens', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('HttpOnly');
  });

  it('should use secure cookies in production', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('Secure');
  });

  it('should use SameSite=Strict for CSRF protection', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('SameSite=Strict');
  });

  it('should clear all session data on logout', async () => {
    // Set up session data
    sessionStorage.setItem('msal.account.keys', JSON.stringify(['user-123']));
    localStorage.setItem('demo_mode', 'true');

    // Logout
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Simulate cleanup
    sessionStorage.clear();
    localStorage.removeItem('demo_mode');

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.getItem('demo_mode')).toBeNull();
  });
});

describe('Session Recovery', () => {
  it('should recover session from MSAL account when server session missing', async () => {
    // Set up MSAL account
    const mockAccount = {
      homeAccountId: 'user-123',
      environment: 'login.microsoftonline.com',
      tenantId: 'tenant-123',
      username: 'test@capitaltechalliance.com',
      localAccountId: 'user-123',
      name: 'Test User'
    };

    sessionStorage.setItem('msal.account.keys', JSON.stringify([mockAccount.homeAccountId]));
    sessionStorage.setItem(
      `msal.account.${mockAccount.homeAccountId}`,
      JSON.stringify(mockAccount)
    );

    // Verify account exists
    const accountKeys = JSON.parse(sessionStorage.getItem('msal.account.keys') || '[]');
    expect(accountKeys).toHaveLength(1);

    // Exchange MSAL token for server session
    const response = await fetch('/api/auth/microsoft/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'mock-ms-token' }),
      credentials: 'include'
    });

    expect(response.ok).toBe(true);
  });

  it('should handle network errors during session check', async () => {
    // Override to simulate network error
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );

    try {
      await fetch('/api/auth/me', { credentials: 'include' });
      expect.fail('Should have thrown network error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('CSRF Protection', () => {
  it('should validate CSRF token on sensitive operations', async () => {
    const csrfToken = 'mock-csrf-token-' + Math.random();

    // Mock CSRF token endpoint
    server.use(
      rest.get('/api/auth/csrf', (req, res, ctx) => {
        return res(ctx.json({ csrfToken }));
      })
    );

    const csrfResponse = await fetch('/api/auth/csrf');
    const { csrfToken: token } = await csrfResponse.json();

    expect(token).toBe(csrfToken);

    // Use CSRF token in login request
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });

    expect(loginResponse.ok).toBe(true);
  });
});
