/**
 * Azure AD Authentication Configuration
 *
 * Centralized configuration for Azure Active Directory OAuth 2.0 authentication.
 * Supports both development (localhost) and production (Azure Static Web App) environments.
 *
 * SECURITY REQUIREMENTS:
 * - All redirect URIs must be registered in Azure AD App Registration
 * - Client secrets must NEVER be exposed to frontend code
 * - Token validation uses Azure AD public keys (JWKS)
 * - All tokens use HTTPS in production
 */

/**
 * Azure AD Tenant Configuration
 */
export const AZURE_AD_CONFIG = {
  // Application (client) ID from Azure AD App Registration
  clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || import.meta.env.VITE_AZURE_CLIENT_ID || '',

  // Directory (tenant) ID from Azure AD
  tenantId: import.meta.env.VITE_AZURE_AD_TENANT_ID || import.meta.env.VITE_AZURE_TENANT_ID || '',

  // Authority URL (Azure AD endpoint for this tenant)
  authority: `https://login.microsoftonline.com/${(import.meta.env.VITE_AZURE_AD_TENANT_ID || import.meta.env.VITE_AZURE_TENANT_ID || 'common')}`,

  // Known authorities (for multi-tenant support)
  knownAuthorities: [`login.microsoftonline.com`],
} as const;

/**
 * OAuth 2.0 Scopes
 *
 * Standard OpenID Connect scopes:
 * - openid: Required for OIDC authentication
 * - profile: User's profile information (name, username)
 * - email: User's email address
 * - offline_access: Refresh token for token renewal
 *
 * Microsoft Graph scopes:
 * - User.Read: Read user's basic profile from Microsoft Graph
 */
export const AUTH_SCOPES = {
  // Basic authentication scopes
  login: ['openid', 'profile', 'email', 'User.Read'],

  // Silent token acquisition (includes offline_access for refresh tokens)
  silentRequest: ['openid', 'profile', 'email', 'User.Read', 'offline_access'],

  // Microsoft Graph API scopes
  graphApi: ['User.Read', 'User.ReadBasic.All'],
} as const;

/**
 * Redirect URI Configuration
 *
 * IMPORTANT: All URIs must be registered in Azure AD App Registration:
 * Azure Portal > App Registrations > Your App > Authentication > Platform configurations > Web
 */
const getEnvRedirectUris = (): string[] => {
  const raw = import.meta.env.VITE_AZURE_AD_REDIRECT_URIS;
  if (!raw) return [];
  return raw.split(',').map((u: string) => u.trim()).filter(Boolean);
};

export const REDIRECT_URIS = {
  dev: getEnvRedirectUris(),
  prod: getEnvRedirectUris(),
} as const;

/**
 * Get the appropriate redirect URI for the current environment
 */
export function getRedirectUri(): string {
  // If explicitly set via environment variable, use that
  const envRedirectUri = import.meta.env.VITE_AZURE_AD_REDIRECT_URI;
  if (envRedirectUri) {
    // Dev guard: avoid redirect loops when the env var points to the wrong local port.
    // In development, prefer the current origin unless the configured redirect matches it.
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (!envRedirectUri.startsWith(origin)) {
        console.warn('[Auth] Ignoring VITE_AZURE_AD_REDIRECT_URI (wrong origin for this dev server)', {
          envRedirectUri,
          origin,
        });
        return `${origin}/auth/callback`;
      }
    }

    return envRedirectUri;
  }

  // Auto-detect based on window.location
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/auth/callback`;
  }

  // No window available: require explicit configuration
  return '';
}

/**
 * Get the post-logout redirect URI
 */
export function getPostLogoutRedirectUri(): string {
  const envRedirectUri = import.meta.env.VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI;
  if (envRedirectUri) return envRedirectUri;
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/**
 * Cache Configuration
 *
 * - sessionStorage: Tokens cleared when browser tab closes (more secure)
 * - localStorage: Tokens persist across browser sessions (more convenient)
 *
 * SECURITY: Use sessionStorage for production environments
 */
export const CACHE_CONFIG = {
  // Storage location for tokens and cache
  cacheLocation: 'sessionStorage' as 'sessionStorage' | 'localStorage',

  // Store auth state in cookies for SSR compatibility
  storeAuthStateInCookie: false,

  // Secure cookie settings (production only)
  secureCookies: true,
} as const;

/**
 * Token Configuration
 */
export const TOKEN_CONFIG = {
  // Token lifetime settings (in seconds)
  accessTokenLifetime: 3600, // 1 hour
  refreshTokenLifetime: 86400, // 24 hours

  // Token renewal settings
  renewBeforeExpiry: 300, // Renew 5 minutes before expiry

  // Token validation settings
  validateIssuer: true,
  validateAudience: true,
  clockSkew: 300, // Allow 5 minutes clock skew
} as const;

/**
 * Interaction Configuration
 */
export const INTERACTION_CONFIG = {
  // Preferred interaction mode
  interactionMode: 'redirect' as 'redirect' | 'popup',

  // Popup window dimensions
  popupWindowDimensions: {
    width: 600,
    height: 800,
  },

  // Redirect timeout (milliseconds)
  redirectTimeout: 30000, // 30 seconds

  // Login hints
  promptBehavior: 'select_account' as 'login' | 'select_account' | 'consent' | 'none',
} as const;

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  // Log level (0=Error, 1=Warning, 2=Info, 3=Verbose)
  logLevel: import.meta.env.DEV ? 3 : 1,

  // Enable PII logging (only in development)
  piiLoggingEnabled: import.meta.env.DEV ? true : false,

  // Correlation ID for tracking requests
  correlationId: undefined,
} as const;

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  // Timeout for network requests (milliseconds)
  timeout: 30000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // Enable HTTP caching
  enableHttpCache: true,
} as const;

/**
 * Backend API Configuration
 */
export const BACKEND_API_CONFIG = {
  // Token exchange endpoint (converts Azure AD token to app session)
  tokenExchangeEndpoint: '/api/auth/microsoft/exchange',

  // User profile endpoint
  userProfileEndpoint: '/api/auth/me',

  // Token refresh endpoint
  tokenRefreshEndpoint: '/api/auth/refresh',

  // Logout endpoint
  logoutEndpoint: '/api/auth/logout',

  // Tenant switch endpoint (SuperAdmin only)
  tenantSwitchEndpoint: '/api/auth/switch-tenant',
} as const;

/**
 * Feature Flags
 */
export const AUTH_FEATURES = {
  // Enable Azure AD SSO
  enableAzureAD: true,

  // Enable local email/password login
  enableLocalAuth: true,

  // Enable token refresh
  enableTokenRefresh: true,

  // Enable CSRF protection
  enableCsrfProtection: true,

  // Enable session validation
  enableSessionValidation: true,

  // Enable multi-tenant support
  enableMultiTenant: true,
} as const;

/**
 * Error Messages
 */
export const AUTH_ERROR_MESSAGES = {
  // Login errors
  LOGIN_FAILED: 'Login failed. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account locked due to multiple failed login attempts.',

  // Token errors
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token.',
  TOKEN_REFRESH_FAILED: 'Failed to refresh session. Please log in again.',

  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',

  // Azure AD errors
  AZURE_AD_FAILED: 'Microsoft authentication failed.',
  POPUP_BLOCKED: 'Popup window blocked. Please allow popups for this site.',
  USER_CANCELLED: 'Login cancelled by user.',

  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource.',
  TENANT_SWITCH_FAILED: 'Failed to switch tenant.',
} as const;

/**
 * Route Guards
 */
export const PROTECTED_ROUTES = {
  // Routes requiring authentication
  requireAuth: [
    '/',
    '/fleet',
    '/drivers',
    '/compliance',
    '/maintenance',
    '/reports',
    '/admin',
  ],

  // Routes requiring specific roles
  requireSuperAdmin: [
    '/admin/tenants',
    '/admin/users',
    '/admin/configuration',
  ],

  // Public routes (no authentication required)
  publicRoutes: [
    '/login',
    '/auth/callback',
    '/forgot-password',
    '/reset-password',
  ],
} as const;

/**
 * Environment Detection
 */
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',

  // Skip authentication (development only)
  skipAuth: import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true',
} as const;

/**
 * Complete MSAL Configuration Object
 *
 * This is the final configuration passed to MSAL PublicClientApplication
 */
export function getMsalConfig() {
  if (import.meta.env.PROD) {
    if (!AZURE_AD_CONFIG.clientId || !AZURE_AD_CONFIG.tenantId) {
      throw new Error(
        'Azure AD SSO is not configured. Set VITE_AZURE_AD_CLIENT_ID and VITE_AZURE_AD_TENANT_ID for production.'
      );
    }
  }

  return {
    auth: {
      clientId: AZURE_AD_CONFIG.clientId,
      authority: AZURE_AD_CONFIG.authority,
      redirectUri: getRedirectUri(),
      postLogoutRedirectUri: getPostLogoutRedirectUri(),
      navigateToLoginRequestUrl: true,
      knownAuthorities: AZURE_AD_CONFIG.knownAuthorities,
    },
    cache: {
      cacheLocation: CACHE_CONFIG.cacheLocation,
      storeAuthStateInCookie: CACHE_CONFIG.storeAuthStateInCookie,
      secureCookies: CACHE_CONFIG.secureCookies,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: number, message: string, containsPii: boolean) => {
          if (containsPii && !LOGGING_CONFIG.piiLoggingEnabled) {
            return;
          }

          const prefix = '[MSAL]';
          switch (level) {
            case 0: // Error
              console.error(prefix, message);
              break;
            case 1: // Warning
              console.warn(prefix, message);
              break;
            case 2: // Info
              console.info(prefix, message);
              break;
            case 3: // Verbose
              console.debug(prefix, message);
              break;
          }
        },
        logLevel: LOGGING_CONFIG.logLevel,
        piiLoggingEnabled: LOGGING_CONFIG.piiLoggingEnabled,
      },
      windowHashTimeout: INTERACTION_CONFIG.redirectTimeout,
      iframeHashTimeout: INTERACTION_CONFIG.redirectTimeout,
      loadFrameTimeout: INTERACTION_CONFIG.redirectTimeout,
      asyncPopups: false,
    },
  };
}

/**
 * Login Request Configuration
 */
export function getLoginRequest() {
  return {
    scopes: AUTH_SCOPES.login,
    prompt: INTERACTION_CONFIG.promptBehavior,
  };
}

/**
 * Silent Token Request Configuration
 */
export function getSilentRequest() {
  return {
    scopes: AUTH_SCOPES.silentRequest,
    forceRefresh: false,
  };
}

/**
 * Export all configuration as a single object for easy access
 */
export const AuthConfig = {
  azureAd: AZURE_AD_CONFIG,
  scopes: AUTH_SCOPES,
  redirectUris: REDIRECT_URIS,
  cache: CACHE_CONFIG,
  token: TOKEN_CONFIG,
  interaction: INTERACTION_CONFIG,
  logging: LOGGING_CONFIG,
  network: NETWORK_CONFIG,
  backendApi: BACKEND_API_CONFIG,
  features: AUTH_FEATURES,
  errors: AUTH_ERROR_MESSAGES,
  routes: PROTECTED_ROUTES,
  env: ENV_CONFIG,

  // Helper functions
  getMsalConfig,
  getLoginRequest,
  getSilentRequest,
  getRedirectUri,
  getPostLogoutRedirectUri,
} as const;

export default AuthConfig;
