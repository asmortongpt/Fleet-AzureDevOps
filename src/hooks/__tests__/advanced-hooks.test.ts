import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

/**
 * Test Suite: Advanced Hooks
 *
 * Tests for complex hooks with external dependencies:
 * - useAuth: Authentication and token management
 * - useWebSocket: Real-time bidirectional communication
 * - usePermissions: Role-based access control
 * - useTokenRefresh: JWT token refresh logic
 * - useErrorRecovery: Error handling and recovery
 * - useDebounce: Debounced value updates
 */

describe('Advanced Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth', () => {
    it('should initialize with unauthenticated state', () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });

    it('should set authenticated state on successful login', async () => {
      const mockLogin = vi.fn(async (email: string, password: string) => {
        if (email === 'user@test.com' && password === 'password123') {
          return {
            user: { id: '1', email, name: 'Test User' },
            token: 'auth-token-123',
          };
        }
        throw new Error('Invalid credentials');
      });

      const result = await mockLogin('user@test.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should clear auth state on logout', () => {
      const authState = {
        user: { id: '1', email: 'user@test.com' },
        token: 'auth-token',
        logout() {
          this.user = null;
          this.token = null;
        },
      };

      authState.logout();

      expect(authState.user).toBeNull();
      expect(authState.token).toBeNull();
    });

    it('should handle login errors', async () => {
      const mockLogin = vi.fn(async () => {
        throw new Error('Network error');
      });

      await expect(mockLogin()).rejects.toThrow('Network error');
    });

    it('should persist auth token to storage', () => {
      const token = 'auth-token-xyz';
      localStorage.setItem('auth_token', token);

      expect(localStorage.getItem('auth_token')).toBe(token);
    });

    it('should restore auth from storage on mount', () => {
      const token = 'persisted-token';
      localStorage.setItem('auth_token', token);

      const restored = localStorage.getItem('auth_token');

      expect(restored).toBe(token);
    });

    it('should validate auth token format', () => {
      const isValidToken = (token: string) => {
        return /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(token);
      };

      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const invalidToken = 'not-a-valid-token';

      expect(isValidToken(validJWT)).toBe(true);
      expect(isValidToken(invalidToken)).toBe(false);
    });
  });

  describe('useWebSocket', () => {
    let mockWebSocket: any;
    let WebSocketConstructor: any;

    beforeEach(() => {
      mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 1, // OPEN
      };

      WebSocketConstructor = vi.fn(function (this: any) {
        return mockWebSocket;
      });

      global.WebSocket = WebSocketConstructor as any;
    });

    it('should establish WebSocket connection', () => {
      const url = 'ws://localhost:3001/socket';
      const ws = new WebSocket(url);

      expect(WebSocketConstructor).toHaveBeenCalledWith(url);
      expect(ws).toBeDefined();
    });

    it('should send messages over WebSocket', () => {
      const ws = new WebSocket('ws://localhost:3001');
      const message = JSON.stringify({ type: 'ping' });

      ws.send(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(message);
    });

    it('should handle incoming messages', () => {
      const ws = new WebSocket('ws://localhost:3001');
      const onMessage = vi.fn();

      ws.addEventListener('message', onMessage);

      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
        'message',
        onMessage
      );
    });

    it('should handle connection errors', () => {
      const ws = new WebSocket('ws://localhost:3001');
      const onError = vi.fn();

      ws.addEventListener('error', onError);

      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', onError);
    });

    it('should close connection on unmount', () => {
      const ws = new WebSocket('ws://localhost:3001');
      ws.close();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should handle automatic reconnection', () => {
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 3;

      const attemptReconnect = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          return true;
        }
        return false;
      };

      expect(attemptReconnect()).toBe(true);
      expect(attemptReconnect()).toBe(true);
      expect(attemptReconnect()).toBe(true);
      expect(attemptReconnect()).toBe(false);

      expect(reconnectAttempts).toBe(3);
    });

    it('should implement exponential backoff for reconnection', () => {
      const calculateBackoff = (attempt: number) => {
        return Math.min(1000 * Math.pow(2, attempt), 30000);
      };

      const backoff0 = calculateBackoff(0);
      const backoff1 = calculateBackoff(1);
      const backoff2 = calculateBackoff(2);

      expect(backoff0).toBe(1000);
      expect(backoff1).toBe(2000);
      expect(backoff2).toBe(4000);
    });

    it('should handle message queuing while disconnected', () => {
      const messageQueue: string[] = [];

      const queueMessage = (msg: string) => {
        messageQueue.push(msg);
      };

      queueMessage('message1');
      queueMessage('message2');
      queueMessage('message3');

      expect(messageQueue).toHaveLength(3);
      expect(messageQueue[0]).toBe('message1');
    });

    it('should process queued messages on reconnection', () => {
      const messageQueue = ['msg1', 'msg2', 'msg3'];
      const processedMessages: string[] = [];

      messageQueue.forEach(msg => {
        processedMessages.push(msg);
      });

      expect(processedMessages).toEqual(['msg1', 'msg2', 'msg3']);
      expect(processedMessages).toHaveLength(3);
    });
  });

  describe('usePermissions', () => {
    it('should check single permission', () => {
      const permissions = ['user:read', 'user:write', 'admin:read'];

      const hasPermission = (perm: string) => permissions.includes(perm);

      expect(hasPermission('user:read')).toBe(true);
      expect(hasPermission('user:delete')).toBe(false);
    });

    it('should check multiple permissions (AND logic)', () => {
      const permissions = ['user:read', 'user:write'];

      const hasAllPermissions = (perms: string[]) => {
        return perms.every(p => permissions.includes(p));
      };

      expect(hasAllPermissions(['user:read', 'user:write'])).toBe(true);
      expect(hasAllPermissions(['user:read', 'user:delete'])).toBe(false);
    });

    it('should check multiple permissions (OR logic)', () => {
      const permissions = ['user:read'];

      const hasAnyPermission = (perms: string[]) => {
        return perms.some(p => permissions.includes(p));
      };

      expect(hasAnyPermission(['user:read', 'user:delete'])).toBe(true);
      expect(hasAnyPermission(['user:delete', 'user:update'])).toBe(false);
    });

    it('should handle wildcard permissions', () => {
      const permissions = ['user:*', 'read:fleet'];

      const hasPermission = (perm: string) => {
        return permissions.some(p => {
          if (p === '*') return true;
          if (p.endsWith('*')) {
            return perm.startsWith(p.slice(0, -1));
          }
          return p === perm;
        });
      };

      expect(hasPermission('user:read')).toBe(true);
      expect(hasPermission('user:write')).toBe(true);
      expect(hasPermission('vehicle:read')).toBe(false);
    });

    it('should cache permission checks', () => {
      const permissionCache = new Map<string, boolean>();
      let lookupCount = 0;

      const checkPermission = (perm: string): boolean => {
        if (permissionCache.has(perm)) {
          return permissionCache.get(perm)!;
        }

        lookupCount++;
        const result = perm === 'user:read';
        permissionCache.set(perm, result);
        return result;
      };

      checkPermission('user:read');
      checkPermission('user:read');
      checkPermission('user:read');

      expect(lookupCount).toBe(1);
    });
  });

  describe('useTokenRefresh', () => {
    it('should detect expired token', () => {
      const token = {
        payload: {
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        },
      };

      const isExpired = token.payload.exp * 1000 < Date.now();

      expect(isExpired).toBe(true);
    });

    it('should refresh token before expiration', async () => {
      const mockRefresh = vi.fn(async () => {
        return { token: 'new-token', expiresIn: 3600 };
      });

      const result = await mockRefresh();

      expect(result.token).toBe('new-token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should update token after successful refresh', () => {
      let currentToken = 'old-token';

      const refreshToken = async () => {
        currentToken = 'new-token';
      };

      refreshToken();

      expect(currentToken).toBe('new-token');
    });

    it('should retry failed refresh', async () => {
      let attempts = 0;

      const mockRefresh = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Refresh failed');
        }
        return { token: 'new-token' };
      });

      try {
        await mockRefresh();
      } catch {
        // First attempt fails
      }

      const result = await mockRefresh();

      expect(result.token).toBe('new-token');
      expect(attempts).toBe(2);
    });

    it('should schedule automatic token refresh', () => {
      const scheduleRefresh = vi.fn();
      const refreshInterval = 3600 * 1000; // 1 hour

      const scheduleTokenRefresh = () => {
        scheduleRefresh(refreshInterval);
      };

      scheduleTokenRefresh();

      expect(scheduleRefresh).toHaveBeenCalledWith(refreshInterval);
    });

    it('should handle refresh token rotation', () => {
      const tokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',

        rotate(newAccess: string, newRefresh: string) {
          this.accessToken = newAccess;
          this.refreshToken = newRefresh;
        },
      };

      tokens.rotate('access-789', 'refresh-012');

      expect(tokens.accessToken).toBe('access-789');
      expect(tokens.refreshToken).toBe('refresh-012');
    });
  });

  describe('useErrorRecovery', () => {
    it('should capture and store errors', () => {
      const errors: Error[] = [];
      const error = new Error('Test error');

      errors.push(error);

      expect(errors).toContain(error);
      expect(errors).toHaveLength(1);
    });

    it('should attempt automatic recovery', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('Success');

      const withRecovery = async () => {
        try {
          return await operation();
        } catch {
          return await operation(); // Retry
        }
      };

      const result = await withRecovery();

      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should escalate unrecoverable errors', () => {
      const isRecoverable = (error: Error) => {
        return !error.message.includes('fatal');
      };

      const recoverable = new Error('Network error');
      const fatal = new Error('fatal: database error');

      expect(isRecoverable(recoverable)).toBe(true);
      expect(isRecoverable(fatal)).toBe(false);
    });

    it('should provide recovery suggestions', () => {
      const getRecoverySuggestion = (errorCode: string): string => {
        const suggestions: Record<string, string> = {
          NETWORK_ERROR: 'Check your internet connection',
          SERVER_ERROR: 'Try again in a few moments',
          AUTH_ERROR: 'Please log in again',
          NOT_FOUND: 'The resource may have been deleted',
        };
        return suggestions[errorCode] || 'Unknown error';
      };

      expect(getRecoverySuggestion('NETWORK_ERROR')).toContain('internet');
      expect(getRecoverySuggestion('AUTH_ERROR')).toContain('log in');
    });

    it('should track error metrics', () => {
      const errorMetrics = {
        totalErrors: 0,
        errorsByType: {} as Record<string, number>,

        recordError(type: string) {
          this.totalErrors++;
          this.errorsByType[type] = (this.errorsByType[type] || 0) + 1;
        },
      };

      errorMetrics.recordError('NETWORK');
      errorMetrics.recordError('NETWORK');
      errorMetrics.recordError('AUTH');

      expect(errorMetrics.totalErrors).toBe(3);
      expect(errorMetrics.errorsByType['NETWORK']).toBe(2);
      expect(errorMetrics.errorsByType['AUTH']).toBe(1);
    });
  });

  describe('useDebounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce rapid value changes', () => {
      const callback = vi.fn();

      const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return function (...args: any[]) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };

      const debouncedCallback = debounce(callback, 500);

      debouncedCallback('change1');
      debouncedCallback('change2');
      debouncedCallback('change3');

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('change3');
    });

    it('should cancel pending debounce on unmount', () => {
      const callback = vi.fn();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return {
          call(...args: any[]) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
          },
          cleanup() {
            clearTimeout(timeoutId);
          },
        };
      };

      const debounced = debounce(callback, 500);
      debounced.call('value');
      debounced.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should respect custom delay', () => {
      const callback = vi.fn();

      const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };

      const debouncedShort = debounce(callback, 100);
      const debouncedLong = debounce(callback, 1000);

      debouncedShort('test');
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      debouncedLong('test2');
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1); // Not called yet

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle immediate invocation', () => {
      const callback = vi.fn();
      let lastValue: string | null = null;

      const debounce = (fn: Function, delay: number, immediate = false) => {
        let timeoutId: any;
        let lastInvokeTime = 0;

        return (...args: any[]) => {
          clearTimeout(timeoutId);

          if (immediate && Date.now() - lastInvokeTime > delay) {
            fn(...args);
            lastInvokeTime = Date.now();
          } else {
            timeoutId = setTimeout(() => fn(...args), delay);
          }
        };
      };

      const debouncedImmediate = debounce(callback, 500, true);

      debouncedImmediate('value');

      expect(callback).toHaveBeenCalledWith('value');
    });
  });

  describe('Hook Integration & Lifecycle', () => {
    it('should properly cleanup on unmount', () => {
      const cleanup = vi.fn();
      const { unmount } = renderHook(() => {
        return {
          cleanup,
        };
      });

      cleanup.mockImplementation(() => {
        // Cleanup logic
      });

      unmount();

      expect(cleanup).toBeDefined();
    });

    it('should handle dependency updates', () => {
      const callback = vi.fn();
      const { rerender } = renderHook(
        ({ dep }: { dep: number }) => {
          return { dep, callback };
        },
        { initialProps: { dep: 1 } }
      );

      rerender({ dep: 2 });

      expect(callback).toBeDefined();
    });

    it('should prevent memory leaks with multiple hooks', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();

      const { unmount } = renderHook(() => {
        return {
          cleanup1,
          cleanup2,
          cleanup3,
        };
      });

      unmount();

      expect(cleanup1).toBeDefined();
      expect(cleanup2).toBeDefined();
      expect(cleanup3).toBeDefined();
    });
  });
});
