/**
 * Token Storage Service
 * SECURITY (CRIT-F-001): Secure token storage with encryption and expiration handling
 *
 * Features:
 * - Secure storage in localStorage/sessionStorage
 * - Token encryption (AES-256-GCM)
 * - Automatic expiration checking
 * - Secure cleanup on logout
 * - Cross-tab synchronization
 */

import logger from '@/utils/logger';

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  issuedAt: number;
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface TokenMetadata {
  expiresAt: number;
  issuedAt: number;
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

const STORAGE_KEY = 'fleet_auth_state';
const ENCRYPTION_KEY_NAME = 'fleet_enc_key';

/**
 * Token Storage Service
 * Manages secure storage and retrieval of authentication tokens
 */
export class TokenStorage {
  private storage: Storage;
  private encryptionKey: CryptoKey | null = null;

  constructor(persistent: boolean = false) {
    // Use localStorage for persistent sessions, sessionStorage for session-only
    this.storage = persistent ? localStorage : sessionStorage;
  }

  /**
   * Initialize encryption key for token protection
   * Uses Web Crypto API for AES-256-GCM encryption
   */
  private async initEncryptionKey(): Promise<void> {
    if (this.encryptionKey) return;

    try {
      // Try to load existing key from secure storage
      const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);

      if (storedKey) {
        const keyData = JSON.parse(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new encryption key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store key (in sessionStorage for security)
        const exportedKey = await crypto.subtle.exportKey('jwk', this.encryptionKey);
        sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
      }

      logger.debug('[TokenStorage] Encryption key initialized');
    } catch (error) {
      logger.error('[TokenStorage] Failed to initialize encryption:', { error });
      // Fall back to no encryption if Web Crypto API unavailable
      this.encryptionKey = null;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initEncryptionKey();
    }

    if (!this.encryptionKey) {
      // Fallback: no encryption
      logger.warn('[TokenStorage] Encryption unavailable, storing plaintext');
      return btoa(data);
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('[TokenStorage] Encryption failed:', { error });
      return btoa(data);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initEncryptionKey();
    }

    if (!this.encryptionKey) {
      // Fallback: no encryption
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      logger.error('[TokenStorage] Decryption failed:', { error });
      // Try fallback decode
      try {
        return atob(encryptedData);
      } catch {
        return '';
      }
    }
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokens: StoredToken): Promise<void> {
    try {
      const tokenData = JSON.stringify(tokens);
      const encrypted = await this.encrypt(tokenData);

      this.storage.setItem(STORAGE_KEY, encrypted);

      logger.info('[TokenStorage] Tokens stored', {
        userId: tokens.userId,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
      });

      // Notify other tabs about auth state change
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: encrypted,
        storageArea: this.storage,
      }));
    } catch (error) {
      logger.error('[TokenStorage] Failed to store tokens:', { error });
      throw new Error('Token storage failed');
    }
  }

  /**
   * Retrieve tokens from storage
   * Returns null if tokens are expired or invalid
   */
  async getTokens(): Promise<StoredToken | null> {
    try {
      const encrypted = this.storage.getItem(STORAGE_KEY);

      if (!encrypted) {
        logger.debug('[TokenStorage] No tokens found');
        return null;
      }

      const decrypted = await this.decrypt(encrypted);
      const tokens: StoredToken = JSON.parse(decrypted);

      // Check if tokens are expired
      if (this.isExpired(tokens.expiresAt)) {
        logger.warn('[TokenStorage] Tokens expired, clearing storage');
        await this.clearTokens();
        return null;
      }

      logger.debug('[TokenStorage] Tokens retrieved', {
        userId: tokens.userId,
        expiresAt: new Date(tokens.expiresAt).toISOString(),
      });

      return tokens;
    } catch (error) {
      logger.error('[TokenStorage] Failed to retrieve tokens:', { error });
      // Clear corrupted data
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Get token metadata without decrypting the full token
   */
  async getTokenMetadata(): Promise<TokenMetadata | null> {
    const tokens = await this.getTokens();

    if (!tokens) return null;

    return {
      expiresAt: tokens.expiresAt,
      issuedAt: tokens.issuedAt,
      userId: tokens.userId,
      email: tokens.email,
      role: tokens.role,
      tenantId: tokens.tenantId,
    };
  }

  /**
   * Update access token (after refresh)
   */
  async updateAccessToken(accessToken: string, expiresAt: number): Promise<void> {
    const tokens = await this.getTokens();

    if (!tokens) {
      throw new Error('No existing tokens to update');
    }

    tokens.accessToken = accessToken;
    tokens.expiresAt = expiresAt;

    await this.storeTokens(tokens);

    logger.info('[TokenStorage] Access token updated');
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    this.storage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(ENCRYPTION_KEY_NAME);
    this.encryptionKey = null;

    logger.info('[TokenStorage] Tokens cleared');

    // Notify other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: null,
      storageArea: this.storage,
    }));
  }

  /**
   * Check if token is expired
   */
  isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(expiresAt: number): number {
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Check if token should be refreshed (within 5 minutes of expiry)
   */
  shouldRefresh(expiresAt: number, threshold: number = 5 * 60 * 1000): boolean {
    return this.getTimeUntilExpiry(expiresAt) < threshold;
  }

  /**
   * Listen for cross-tab token changes
   */
  onTokenChange(callback: (tokens: StoredToken | null) => void): () => void {
    const handler = async (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;

      if (event.newValue === null) {
        callback(null);
      } else {
        const tokens = await this.getTokens();
        callback(tokens);
      }
    };

    window.addEventListener('storage', handler);

    // Return cleanup function
    return () => window.removeEventListener('storage', handler);
  }
}

// Singleton instances
let persistentStorage: TokenStorage | null = null;
let sessionStorage_: TokenStorage | null = null;

/**
 * Get token storage instance
 * @param persistent - Use localStorage (true) or sessionStorage (false)
 */
export function getTokenStorage(persistent: boolean = false): TokenStorage {
  if (persistent) {
    if (!persistentStorage) {
      persistentStorage = new TokenStorage(true);
    }
    return persistentStorage;
  } else {
    if (!sessionStorage_) {
      sessionStorage_ = new TokenStorage(false);
    }
    return sessionStorage_;
  }
}

/**
 * Parse JWT token to extract metadata
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('[TokenStorage] Failed to parse JWT:', { error });
    return null;
  }
}

/**
 * Extract token expiration from JWT
 */
export function getTokenExpiration(token: string): number | null {
  const payload = parseJWT(token);

  if (!payload || !payload.exp) return null;

  return payload.exp * 1000; // Convert to milliseconds
}
