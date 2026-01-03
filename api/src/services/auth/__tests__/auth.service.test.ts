/**
 * Comprehensive Test Suite for Authentication Service
 * Tests JWT generation, refresh token rotation, token validation, and security features
 */
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-12345';

    // Create fresh instance for each test
    authService = new AuthService();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from environment', () => {
      const service = new AuthService();
      expect(service).toBeDefined();
    });

    it('should fall back to default secrets if env vars missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      const service = new AuthService();
      expect(service).toBeDefined();
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const userId = 'user-123';
      const result = authService.generateTokens(userId);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should generate valid JWT access token with correct payload', () => {
      const userId = 'user-456';
      const { accessToken } = authService.generateTokens(userId);

      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      expect(decoded.sub).toBe(userId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate access token that expires in 15 minutes', () => {
      const userId = 'user-789';
      const { accessToken } = authService.generateTokens(userId);

      const decoded = jwt.decode(accessToken) as any;
      const expiryTime = decoded.exp - decoded.iat;
      expect(expiryTime).toBe(15 * 60); // 15 minutes in seconds
    });

    it('should generate unique refresh tokens for each call', () => {
      const userId = 'user-unique';
      const { refreshToken: token1 } = authService.generateTokens(userId);
      const { refreshToken: token2 } = authService.generateTokens(userId);

      expect(token1).not.toBe(token2);
    });

    it('should generate refresh token with 80 character hex string', () => {
      const userId = 'user-hex';
      const { refreshToken } = authService.generateTokens(userId);

      expect(refreshToken).toMatch(/^[a-f0-9]{80}$/);
      expect(refreshToken.length).toBe(80);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token and return payload', () => {
      const userId = 'user-verify';
      const { accessToken } = authService.generateTokens(userId);

      const result = authService.verifyToken(accessToken);
      expect(result).not.toBeNull();
      expect(result.sub).toBe(userId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const result = authService.verifyToken(invalidToken);

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const userId = 'user-expired';

      // Create expired token
      const expiredToken = jwt.sign(
        { sub: userId },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );

      const result = authService.verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const userId = 'user-wrong-secret';
      const wrongToken = jwt.sign(
        { sub: userId },
        'wrong-secret-key',
        { expiresIn: '15m' }
      );

      const result = authService.verifyToken(wrongToken);
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = authService.verifyToken('not-even-a-token');
      expect(result).toBeNull();
    });

    it('should handle empty string token', () => {
      const result = authService.verifyToken('');
      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh valid token and return new tokens', async () => {
      const userId = 'user-refresh';
      const { refreshToken } = authService.generateTokens(userId);

      const result = await authService.refreshToken(refreshToken);

      expect(result).not.toBeNull();
      expect(result!.accessToken).toBeDefined();
      expect(result!.refreshToken).toBeDefined();
      expect(result!.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should rotate refresh token (security best practice)', async () => {
      const userId = 'user-rotate';
      const { refreshToken: oldToken } = authService.generateTokens(userId);

      const result = await authService.refreshToken(oldToken);

      expect(result!.refreshToken).not.toBe(oldToken);

      // Old token should no longer work
      const secondRefresh = await authService.refreshToken(oldToken);
      expect(secondRefresh).toBeNull();
    });

    it('should return null for invalid refresh token', async () => {
      const result = await authService.refreshToken('invalid-refresh-token');
      expect(result).toBeNull();
    });

    it('should return null for expired refresh token', async () => {
      const userId = 'user-expired-refresh';
      const { refreshToken } = authService.generateTokens(userId);

      // Mock the internal token store to have expired token
      // We'll do this by waiting or by directly manipulating time
      const now = new Date();
      const pastDate = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      // Use fake timers to simulate expired token
      vi.useFakeTimers();
      vi.setSystemTime(pastDate);

      const { refreshToken: expiredToken } = authService.generateTokens(userId);

      // Move time forward to after expiry
      vi.setSystemTime(now);

      const result = await authService.refreshToken(expiredToken);
      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it('should maintain same userId after refresh', async () => {
      const userId = 'user-maintain-id';
      const { refreshToken } = authService.generateTokens(userId);

      const result = await authService.refreshToken(refreshToken);
      const decoded = jwt.verify(result!.accessToken, process.env.JWT_SECRET!) as any;

      expect(decoded.sub).toBe(userId);
    });

    it('should generate new access token with fresh expiry', async () => {
      const userId = 'user-fresh-expiry';
      const { refreshToken } = authService.generateTokens(userId);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await authService.refreshToken(refreshToken);
      const newDecoded = jwt.decode(result!.accessToken) as any;

      const expectedExpiry = Math.floor(Date.now() / 1000) + (15 * 60);
      expect(newDecoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
      expect(newDecoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });

    it('should handle empty string refresh token', async () => {
      const result = await authService.refreshToken('');
      expect(result).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('should revoke refresh token successfully', async () => {
      const userId = 'user-revoke';
      const { refreshToken } = authService.generateTokens(userId);

      // Token should work before revocation
      let result = await authService.refreshToken(refreshToken);
      expect(result).not.toBeNull();

      // Revoke the new token
      authService.revokeToken(result!.refreshToken);

      // Token should not work after revocation
      result = await authService.refreshToken(result!.refreshToken);
      expect(result).toBeNull();
    });

    it('should not throw error when revoking non-existent token', () => {
      expect(() => {
        authService.revokeToken('non-existent-token');
      }).not.toThrow();
    });

    it('should not throw error when revoking already revoked token', () => {
      const userId = 'user-double-revoke';
      const { refreshToken } = authService.generateTokens(userId);

      authService.revokeToken(refreshToken);

      expect(() => {
        authService.revokeToken(refreshToken);
      }).not.toThrow();
    });

    it('should handle empty string token', () => {
      expect(() => {
        authService.revokeToken('');
      }).not.toThrow();
    });
  });

  describe('Security Tests', () => {
    it('should not allow reuse of refresh token after successful refresh', async () => {
      const userId = 'user-no-reuse';
      const { refreshToken } = authService.generateTokens(userId);

      // First refresh should work
      const firstRefresh = await authService.refreshToken(refreshToken);
      expect(firstRefresh).not.toBeNull();

      // Second refresh with same token should fail (token rotation)
      const secondRefresh = await authService.refreshToken(refreshToken);
      expect(secondRefresh).toBeNull();
    });

    it('should generate cryptographically secure refresh tokens', () => {
      const userId = 'user-crypto';
      const tokens = new Set();

      // Generate 100 tokens and ensure no collisions
      for (let i = 0; i < 100; i++) {
        const { refreshToken } = authService.generateTokens(userId);
        tokens.add(refreshToken);
      }

      expect(tokens.size).toBe(100); // All unique
    });

    it('should not expose internal token storage', () => {
      const userId = 'user-exposure';
      const { refreshToken } = authService.generateTokens(userId);

      // Ensure no way to access internal storage
      expect((authService as any).refreshTokens).toBeUndefined();
    });

    it('should handle concurrent token generation safely', async () => {
      const userId = 'user-concurrent';

      // Generate multiple tokens concurrently
      const promises = Array(10).fill(null).map(() =>
        Promise.resolve(authService.generateTokens(userId))
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });

      // All refresh tokens should be unique
      const refreshTokens = results.map(r => r.refreshToken);
      const uniqueTokens = new Set(refreshTokens);
      expect(uniqueTokens.size).toBe(10);
    });

    it('should handle concurrent refresh operations safely', async () => {
      const userId = 'user-concurrent-refresh';
      const { refreshToken } = authService.generateTokens(userId);

      // Attempt to refresh same token concurrently
      // Only one should succeed due to token rotation
      const promises = Array(3).fill(null).map(() =>
        authService.refreshToken(refreshToken)
      );

      const results = await Promise.all(promises);

      // Only first one should succeed
      const successful = results.filter(r => r !== null);
      expect(successful.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long user IDs', () => {
      const longUserId = 'user-' + 'a'.repeat(1000);
      const { accessToken } = authService.generateTokens(longUserId);

      const decoded = authService.verifyToken(accessToken);
      expect(decoded!.sub).toBe(longUserId);
    });

    it('should handle special characters in user ID', () => {
      const specialUserId = 'user-@#$%^&*()_+-={}[]|:;"<>?,./';
      const { accessToken } = authService.generateTokens(specialUserId);

      const decoded = authService.verifyToken(accessToken);
      expect(decoded!.sub).toBe(specialUserId);
    });

    it('should handle UUID format user IDs', () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000';
      const { accessToken } = authService.generateTokens(uuidUserId);

      const decoded = authService.verifyToken(accessToken);
      expect(decoded!.sub).toBe(uuidUserId);
    });

    it('should handle numeric user IDs as strings', () => {
      const numericUserId = '12345';
      const { accessToken } = authService.generateTokens(numericUserId);

      const decoded = authService.verifyToken(accessToken);
      expect(decoded!.sub).toBe(numericUserId);
    });

    it('should handle empty string user ID', () => {
      const emptyUserId = '';
      const { accessToken } = authService.generateTokens(emptyUserId);

      const decoded = authService.verifyToken(accessToken);
      expect(decoded!.sub).toBe(emptyUserId);
    });
  });

  describe('Token Expiry Behavior', () => {
    it('should create tokens that are valid immediately', () => {
      const userId = 'user-immediate';
      const { accessToken } = authService.generateTokens(userId);

      const result = authService.verifyToken(accessToken);
      expect(result).not.toBeNull();
      expect(result!.sub).toBe(userId);
    });

    it('should create access tokens with iat (issued at) claim', () => {
      const userId = 'user-iat';
      const beforeGeneration = Math.floor(Date.now() / 1000);

      const { accessToken } = authService.generateTokens(userId);

      const afterGeneration = Math.floor(Date.now() / 1000);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
    });

    it('should create access tokens with exp (expiry) claim', () => {
      const userId = 'user-exp';
      const { accessToken } = authService.generateTokens(userId);

      const decoded = jwt.decode(accessToken) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('Exported authService instance', () => {
    it('should export singleton instance', async () => {
      const { authService: exportedService } = await import('../auth.service');
      expect(exportedService).toBeDefined();
      expect(exportedService).toBeInstanceOf(AuthService);
    });

    it('should have working methods on exported instance', async () => {
      const { authService: exportedService } = await import('../auth.service');
      const userId = 'user-exported';

      const result = exportedService.generateTokens(userId);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
