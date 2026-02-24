import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getCsrfToken, refreshCsrfToken, clearCsrfToken, secureFetch } from '../use-api';

/**
 * Test Suite: use-api.ts - CSRF Protection & Secure HTTP Client
 *
 * Tests comprehensive CSRF token management, token fetching/caching,
 * automatic retry on CSRF validation failure, and secure fetch operations.
 */

describe('use-api.ts', () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    clearCsrfToken();
    vi.clearAllMocks();
  });

  describe('getCsrfToken()', () => {
    it('should fetch CSRF token from /api/csrf-token endpoint', async () => {
      const mockToken = 'test-csrf-token-12345';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: mockToken } }),
      });

      const token = await getCsrfToken();

      expect(token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should return cached token on subsequent calls', async () => {
      const mockToken = 'cached-token-67890';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: mockToken } }),
      });

      const token1 = await getCsrfToken();
      const token2 = await getCsrfToken();

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle promise caching during concurrent requests', async () => {
      const mockToken = 'concurrent-token-abc';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: mockToken } }),
      });

      // Simulate concurrent calls
      const [token1, token2, token3] = await Promise.all([
        getCsrfToken(),
        getCsrfToken(),
        getCsrfToken(),
      ]);

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
      // Should only fetch once due to promise caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should extract token from nested response format', async () => {
      const mockToken = 'nested-token-xyz';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: mockToken } }),
      });

      const token = await getCsrfToken();

      expect(token).toBe(mockToken);
    });

    it('should extract token from flat response format', async () => {
      const mockToken = 'flat-token-123';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken }),
      });

      const token = await getCsrfToken();

      expect(token).toBe(mockToken);
    });

    it('should return empty string when fetch fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const token = await getCsrfToken();

      expect(token).toBe('');
    });

    it('should return empty string on JSON parse error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const token = await getCsrfToken();

      expect(token).toBe('');
    });

    it('should return empty string on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const token = await getCsrfToken();

      expect(token).toBe('');
    });

    it('should skip token fetch in dev bypass mode', async () => {
      const originalEnv = import.meta.env.VITE_SKIP_AUTH;
      (import.meta.env as any).VITE_SKIP_AUTH = 'true';

      const token = await getCsrfToken();

      expect(token).toBe('');
      expect(global.fetch).not.toHaveBeenCalled();

      (import.meta.env as any).VITE_SKIP_AUTH = originalEnv;
    });

    it('should clear cache after failed fetch', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'recovery-token' } }),
        });

      await getCsrfToken();
      clearCsrfToken();
      const token = await getCsrfToken();

      expect(token).toBe('recovery-token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshCsrfToken()', () => {
    it('should clear cached token and fetch new one', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: oldToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: newToken } }),
        });

      const token1 = await getCsrfToken();
      expect(token1).toBe(oldToken);

      await refreshCsrfToken();

      const token2 = await getCsrfToken();
      expect(token2).toBe(newToken);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should skip refresh in dev bypass mode', async () => {
      const originalEnv = import.meta.env.VITE_SKIP_AUTH;
      (import.meta.env as any).VITE_SKIP_AUTH = 'true';

      await refreshCsrfToken();

      expect(global.fetch).not.toHaveBeenCalled();

      (import.meta.env as any).VITE_SKIP_AUTH = originalEnv;
    });
  });

  describe('clearCsrfToken()', () => {
    it('should clear cached token', async () => {
      const mockToken = 'token-to-clear';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: mockToken } }),
      });

      const token1 = await getCsrfToken();
      expect(token1).toBe(mockToken);

      clearCsrfToken();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { csrfToken: 'new-token' } }),
      });

      const token2 = await getCsrfToken();
      expect(token2).toBe('new-token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('secureFetch()', () => {
    it('should include CSRF token in POST request headers', async () => {
      const csrfToken = 'test-csrf-123';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      await secureFetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ name: 'vehicle' }),
      });

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[1].headers['X-CSRF-Token']).toBe(csrfToken);
    });

    it('should NOT include CSRF token in GET requests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await secureFetch('/api/vehicles', { method: 'GET' });

      const firstCall = (global.fetch as any).mock.calls[0];
      expect(firstCall[1].headers['X-CSRF-Token']).toBeUndefined();
    });

    it('should include credentials for all requests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await secureFetch('/api/test', { method: 'GET' });

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].credentials).toBe('include');
    });

    it('should retry on CSRF validation failure (403)', async () => {
      const validToken = 'valid-token-xyz';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'old-token' } }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: async () => ({ code: 'CSRF_VALIDATION_FAILED' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: validToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const response = await secureFetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ name: 'vehicle' }),
      });

      expect(response.ok).toBe(true);
      // 4 fetches: initial token, failed request, refresh token, retry
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should include Content-Type header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await secureFetch('/api/test', { method: 'GET' });

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });

    it('should merge custom headers with default headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      await secureFetch('/api/test', {
        method: 'GET',
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      const call = (global.fetch as any).mock.calls[0];
      expect(call[1].headers['X-Custom-Header']).toBe('custom-value');
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });

    it('should handle PUT requests with CSRF token', async () => {
      const csrfToken = 'csrf-put-token';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await secureFetch('/api/vehicles/123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'updated' }),
      });

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[1].headers['X-CSRF-Token']).toBe(csrfToken);
    });

    it('should handle PATCH requests with CSRF token', async () => {
      const csrfToken = 'csrf-patch-token';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await secureFetch('/api/vehicles/123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      });

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[1].headers['X-CSRF-Token']).toBe(csrfToken);
    });

    it('should handle DELETE requests with CSRF token', async () => {
      const csrfToken = 'csrf-delete-token';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await secureFetch('/api/vehicles/123', {
        method: 'DELETE',
      });

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[1].headers['X-CSRF-Token']).toBe(csrfToken);
    });

    it('should not retry on non-CSRF 403 errors', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'token' } }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: async () => ({ code: 'UNAUTHORIZED' }),
        });

      const response = await secureFetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);
      // 2 fetches: initial token, failed request (no retry)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle CSRF error in error message', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'old-token' } }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: async () => ({ error: 'CSRF token validation failed' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'new-token' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const response = await secureFetch('/api/test', { method: 'POST' });

      expect(response.ok).toBe(true);
    });

    it('should preserve request body through retry', async () => {
      const requestBody = { vehicle_id: '123', status: 'active' };
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'token' } }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: async () => ({ code: 'CSRF_VALIDATION_FAILED' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'new-token' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await secureFetch('/api/vehicles/123', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const retryCall = (global.fetch as any).mock.calls[3];
      expect(retryCall[1].body).toBe(JSON.stringify(requestBody));
    });

    it('should handle method case-insensitivity', async () => {
      const csrfToken = 'case-test-token';
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await secureFetch('/api/test', { method: 'post' });

      const secondCall = (global.fetch as any).mock.calls[1];
      expect(secondCall[1].headers['X-CSRF-Token']).toBe(csrfToken);
    });

    it('should handle responses without JSON body', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'token' } }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
        });

      const response = await secureFetch('/api/test', { method: 'GET' });

      expect(response.ok).toBe(true);
    });
  });

  describe('Integration: Token Lifecycle', () => {
    it('should handle complete token lifecycle: fetch -> cache -> refresh -> clear', async () => {
      const token1 = 'first-token';
      const token2 = 'second-token';

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: token1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: token2 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'third-token' } }),
        });

      // Fetch initial token
      const first = await getCsrfToken();
      expect(first).toBe(token1);

      // Use cached token
      const cached = await getCsrfToken();
      expect(cached).toBe(token1);

      // Refresh token
      await refreshCsrfToken();
      const second = await getCsrfToken();
      expect(second).toBe(token2);

      // Clear token
      clearCsrfToken();
      const third = await getCsrfToken();
      expect(third).toBe('third-token');

      // Should fetch 3 times (initial, refresh, clear)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle error recovery across multiple operations', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { csrfToken: 'recovery-token' } }),
        });

      const firstToken = await getCsrfToken();
      expect(firstToken).toBe('');

      clearCsrfToken();

      const secondToken = await getCsrfToken();
      expect(secondToken).toBe('recovery-token');
    });
  });
});
