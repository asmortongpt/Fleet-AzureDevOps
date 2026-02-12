/**
 * Token Refresh Mechanism
 * SECURITY (CRIT-F-001): Implements automatic token refresh with 30-minute idle timeout
 * Tokens are stored in httpOnly cookies managed by backend
 *
 * Features:
 * - Automatic token refresh before expiration
 * - MSAL integration for Azure AD tokens
 * - Idle timeout detection
 * - Cross-tab synchronization
 * - Secure token storage
 */

import { PublicClientApplication } from '@azure/msal-browser';

import { loginRequest } from '@/lib/msal-config';
import { getTokenStorage, getTokenExpiration } from '@/services/token-storage';
import logger from '@/utils/logger';

export interface TokenRefreshConfig {
  /** Token refresh interval in milliseconds (default: 25 minutes) */
  refreshInterval: number;
  /** Session idle timeout in milliseconds (default: 30 minutes) */
  idleTimeout: number;
  /** Grace period before forcing logout (default: 5 minutes) */
  gracePeriod: number;
  /** API endpoint for token refresh */
  refreshEndpoint: string;
  /** MSAL instance for Azure AD token refresh */
  msalInstance?: PublicClientApplication;
  /** Callback when token is refreshed */
  onRefresh?: (success: boolean) => void;
  /** Callback when session expires */
  onExpire?: () => void;
  /** Enable persistent storage (localStorage vs sessionStorage) */
  persistent?: boolean;
}

const DEFAULT_CONFIG: TokenRefreshConfig = {
  refreshInterval: 25 * 60 * 1000, // 25 minutes (refresh before 30min expiry)
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  gracePeriod: 5 * 60 * 1000, // 5 minutes
  refreshEndpoint: '/api/auth/refresh',
  persistent: false,
};

export class TokenRefreshManager {
  private config: TokenRefreshConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isRefreshing = false;
  private listeners: Set<EventListener> = new Set();
  private tokenStorage = getTokenStorage(false);
  private storageCleanup: (() => void) | null = null;

  constructor(config?: Partial<TokenRefreshConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenStorage = getTokenStorage(config?.persistent || false);
    this.setupActivityListeners();
    this.setupCrossTabSync();
  }

  /**
   * Start the token refresh mechanism
   */
  public start(): void {
    logger.info('[TokenRefresh] Starting token refresh mechanism', {
      refreshInterval: this.config.refreshInterval / 60000 + ' min',
      idleTimeout: this.config.idleTimeout / 60000 + ' min',
      persistent: this.config.persistent,
    });

    this.scheduleRefresh();
    this.scheduleIdleCheck();
  }

  /**
   * Stop the token refresh mechanism
   */
  public stop(): void {
    logger.info('[TokenRefresh] Stopping token refresh mechanism');

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    this.removeActivityListeners();

    if (this.storageCleanup) {
      this.storageCleanup();
      this.storageCleanup = null;
    }
  }

  /**
   * Manually trigger token refresh
   * Supports both MSAL (Azure AD) and backend refresh token flows
   */
  public async refresh(): Promise<boolean> {
    if (this.isRefreshing) {
      logger.warn('[TokenRefresh] Refresh already in progress');
      return false;
    }

    this.isRefreshing = true;

    try {
      logger.info('[TokenRefresh] Refreshing token...');

      // Try MSAL silent refresh first if available
      if (this.config.msalInstance) {
        const success = await this.refreshWithMSAL();
        if (success) {
          this.lastActivity = Date.now();
          this.config.onRefresh?.(true);
          this.scheduleRefresh();
          return true;
        }
      }

      // Fall back to backend refresh token flow
      const response = await fetch(this.config.refreshEndpoint, {
        method: 'POST',
        credentials: 'include', // Send httpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      logger.info('[TokenRefresh] Token refreshed successfully', {
        expiresIn: data.expiresIn,
      });

      // Store new token if provided
      if (data.token || data.accessToken) {
        const token = data.token || data.accessToken;
        const expiresAt = getTokenExpiration(token) || Date.now() + 30 * 60 * 1000;
        await this.tokenStorage.updateAccessToken(token, expiresAt);
      }

      // Update last activity time
      this.lastActivity = Date.now();

      // Notify listeners
      this.config.onRefresh?.(true);

      // Reschedule next refresh
      this.scheduleRefresh();

      return true;
    } catch (error) {
      logger.error('[TokenRefresh] Token refresh failed', { error });

      // Notify listeners of failure
      this.config.onRefresh?.(false);

      // Schedule session expiry
      this.handleSessionExpiry();

      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh token using MSAL (Azure AD)
   */
  private async refreshWithMSAL(): Promise<boolean> {
    if (!this.config.msalInstance) return false;

    try {
      const accounts = this.config.msalInstance.getAllAccounts();

      if (accounts.length === 0) {
        logger.warn('[TokenRefresh] No MSAL accounts found');
        return false;
      }

      const account = accounts[0];

      logger.debug('[TokenRefresh] Attempting MSAL silent token acquisition');

      const tokenResult = await this.config.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      logger.info('[TokenRefresh] MSAL token refreshed successfully');

      // Exchange MSAL token with backend
      const exchangeResponse = await fetch('/api/auth/microsoft/exchange', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenResult.accessToken }),
      });

      if (!exchangeResponse.ok) {
        logger.warn('[TokenRefresh] MSAL token exchange failed');
        return false;
      }

      const data = await exchangeResponse.json();

      // Store exchanged token
      if (data.token || data.accessToken) {
        const token = data.token || data.accessToken;
        const expiresAt = getTokenExpiration(token) || Date.now() + 30 * 60 * 1000;
        await this.tokenStorage.updateAccessToken(token, expiresAt);
      }

      return true;
    } catch (error) {
      logger.error('[TokenRefresh] MSAL refresh failed:', { error });
      return false;
    }
  }

  /**
   * Check if session is idle and handle expiry
   */
  private checkIdleStatus(): void {
    const now = Date.now();
    const idleDuration = now - this.lastActivity;

    logger.debug('[TokenRefresh] Checking idle status', {
      idleDuration: Math.floor(idleDuration / 1000) + 's',
      threshold: Math.floor(this.config.idleTimeout / 1000) + 's',
    });

    if (idleDuration >= this.config.idleTimeout) {
      logger.warn('[TokenRefresh] Session idle timeout exceeded');
      this.handleSessionExpiry();
    } else {
      // Schedule next idle check
      this.scheduleIdleCheck();
    }
  }

  /**
   * Handle session expiry (idle timeout or refresh failure)
   */
  private handleSessionExpiry(): void {
    logger.info('[TokenRefresh] Session expired - logging out');

    this.stop();
    this.config.onExpire?.();

    // Redirect to login
    window.location.href = '/login?reason=session_expired';
  }

  /**
   * Schedule next token refresh
   */
  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refresh();
    }, this.config.refreshInterval);

    logger.debug('[TokenRefresh] Next refresh scheduled', {
      nextRefresh: new Date(Date.now() + this.config.refreshInterval).toISOString(),
    });
  }

  /**
   * Schedule next idle check
   */
  private scheduleIdleCheck(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Check idle status every minute
    this.idleTimer = setTimeout(() => {
      this.checkIdleStatus();
    }, 60 * 1000); // Check every 60 seconds
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity = (): void => {
    this.lastActivity = Date.now();

    logger.debug('[TokenRefresh] Activity detected', {
      lastActivity: new Date(this.lastActivity).toISOString(),
    });
  };

  /**
   * Setup activity listeners to detect user interaction
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      window.addEventListener(event, this.updateActivity, { passive: true });
    });

    logger.debug('[TokenRefresh] Activity listeners registered');
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      window.removeEventListener(event, this.updateActivity);
    });

    logger.debug('[TokenRefresh] Activity listeners removed');
  }

  /**
   * Setup cross-tab synchronization
   * Listen for token changes in other tabs
   */
  private setupCrossTabSync(): void {
    this.storageCleanup = this.tokenStorage.onTokenChange((tokens) => {
      if (tokens === null) {
        // Token cleared in another tab - logout
        logger.warn('[TokenRefresh] Token cleared in another tab');
        this.handleSessionExpiry();
      } else {
        // Token updated in another tab - update activity
        logger.debug('[TokenRefresh] Token updated in another tab');
        this.lastActivity = Date.now();
      }
    });

    logger.debug('[TokenRefresh] Cross-tab sync enabled');
  }

  /**
   * Get time until next refresh
   */
  public getTimeUntilRefresh(): number {
    if (!this.refreshTimer) return 0;
    // TypeScript doesn't expose the timer's scheduled time directly
    // We'll need to track this separately in a future enhancement
    return this.config.refreshInterval;
  }

  /**
   * Get time since last activity
   */
  public getTimeSinceActivity(): number {
    return Date.now() - this.lastActivity;
  }

  /**
   * Check if user is idle
   */
  public isIdle(): boolean {
    return this.getTimeSinceActivity() >= this.config.idleTimeout;
  }
}

// Singleton instance
let tokenRefreshManager: TokenRefreshManager | null = null;

/**
 * Initialize the token refresh manager
 */
export function initializeTokenRefresh(config?: Partial<TokenRefreshConfig>): TokenRefreshManager {
  if (tokenRefreshManager) {
    logger.warn('[TokenRefresh] Manager already initialized');
    return tokenRefreshManager;
  }

  tokenRefreshManager = new TokenRefreshManager(config);
  tokenRefreshManager.start();

  return tokenRefreshManager;
}

/**
 * Get the token refresh manager instance
 */
export function getTokenRefreshManager(): TokenRefreshManager | null {
  return tokenRefreshManager;
}

/**
 * Stop and cleanup the token refresh manager
 */
export function stopTokenRefresh(): void {
  if (tokenRefreshManager) {
    tokenRefreshManager.stop();
    tokenRefreshManager = null;
  }
}
