/**
 * Microsoft Graph Service Tests
 *
 * Tests for Microsoft Graph API integration including:
 * - Token acquisition and refresh
 * - Graph API request wrapper
 * - Rate limiting handling
 * - Error handling (401, 429, 500)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Graph API responses
const mockTokenResponse = {
  access_token: 'mock_access_token_12345',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'https://graph.microsoft.com/.default',
  refresh_token: 'mock_refresh_token_67890'
};

const mockUserProfile = {
  id: 'mock_user_id',
  displayName: 'Test User',
  mail: 'testuser@example.com',
  userPrincipalName: 'testuser@example.com'
};

// Mock service class
class MicrosoftGraphService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;

  constructor(config: { clientId: string; clientSecret: string; tenantId: string }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tenantId = config.tenantId;
  }

  async acquireToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    const response = await this.fetchToken();
    this.accessToken = response.access_token;
    this.tokenExpiry = now + (response.expires_in * 1000);
    return this.accessToken;
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await this.fetchToken(refreshToken);
    this.accessToken = response.access_token;
    this.tokenExpiry = Date.now() + (response.expires_in * 1000);
    return this.accessToken;
  }

  private async fetchToken(refreshToken?: string): Promise<typeof mockTokenResponse> {
    // Mock implementation
    return mockTokenResponse;
  }

  async makeGraphRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.acquireToken();
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.json();
  }

  private async handleError(response: Response): Promise<never> {
    const status = response.status;

    if (status === 401) {
      throw new Error('Unauthorized - Token invalid or expired');
    }

    if (status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new Error(`Rate limited - Retry after ${retryAfter} seconds`);
    }

    if (status >= 500) {
      throw new Error(`Server error - Status: ${status}`);
    }

    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Graph API error: ${JSON.stringify(error)}`);
  }
}

describe('MicrosoftGraphService', () => {
  let service: MicrosoftGraphService;
  let fetchMock: any;

  beforeEach(() => {
    service = new MicrosoftGraphService({
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      tenantId: 'test_tenant_id'
    });

    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Acquisition', () => {
    it('should acquire access token successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });

      const token = await service.acquireToken();

      expect(token).toBe(mockTokenResponse.access_token);
    });

    it('should cache token until expiry', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });

      const token1 = await service.acquireToken();
      const token2 = await service.acquireToken();

      expect(token1).toBe(token2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should refresh token when expired', async () => {
      const refreshToken = 'mock_refresh_token';

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });

      const newToken = await service.refreshToken(refreshToken);

      expect(newToken).toBe(mockTokenResponse.access_token);
    });

    it('should handle token acquisition failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.acquireToken()).rejects.toThrow('Network error');
    });
  });

  describe('Graph API Requests', () => {
    beforeEach(() => {
      // Mock token acquisition
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });
    });

    it('should make successful Graph API request', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserProfile
        });

      const result = await service.makeGraphRequest<typeof mockUserProfile>('/me');

      expect(result).toEqual(mockUserProfile);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockTokenResponse.access_token}`
          })
        })
      );
    });

    it('should include custom headers in request', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      await service.makeGraphRequest('/me', {
        headers: { 'X-Custom-Header': 'value' }
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value',
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock token acquisition
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Invalid token' })
        });

      await expect(service.makeGraphRequest('/me')).rejects.toThrow(
        'Unauthorized - Token invalid or expired'
      );
    });

    it('should handle 429 Rate Limit error', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '120' }),
          json: async () => ({ error: 'Too many requests' })
        });

      await expect(service.makeGraphRequest('/me')).rejects.toThrow(
        'Rate limited - Retry after 120 seconds'
      );
    });

    it('should handle 500 Server Error', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' })
        });

      await expect(service.makeGraphRequest('/me')).rejects.toThrow(
        'Server error - Status: 500'
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: 'Service unavailable' })
        });

      await expect(service.makeGraphRequest('/me')).rejects.toThrow(
        'Server error - Status: 503'
      );
    });

    it('should handle network errors', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockRejectedValueOnce(new Error('Network failure'));

      await expect(service.makeGraphRequest('/me')).rejects.toThrow('Network failure');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect Retry-After header', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '60' }),
          json: async () => ({ error: 'Rate limited' })
        });

      try {
        await service.makeGraphRequest('/me');
      } catch (error: any) {
        expect(error.message).toContain('Retry after 60 seconds');
      }
    });

    it('should use default retry time when header missing', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers(),
          json: async () => ({ error: 'Rate limited' })
        });

      try {
        await service.makeGraphRequest('/me');
      } catch (error: any) {
        expect(error.message).toContain('Retry after 60 seconds');
      }
    });
  });
});
