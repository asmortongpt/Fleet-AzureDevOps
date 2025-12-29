/**
 * Auth0 / Azure AD Authentication Configuration
 *
 * Production-grade authentication supporting:
 * - Auth0 (recommended for multi-tenant SaaS)
 * - Azure AD (for enterprise/government deployments)
 * - JWT validation with RS256
 * - MFA enforcement
 * - Session management with automatic timeout
 *
 * FedRAMP Compliance: IA-2, IA-3, IA-5, IA-8, AC-11
 * SOC 2: CC6.1, CC6.2, CC6.3
 */

import { Auth0Client, Auth0ClientOptions } from '@auth0/auth0-spa-js';
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

/**
 * Authentication Provider Type
 */
export type AuthProvider = 'auth0' | 'azure-ad';

/**
 * Auth0 Configuration
 * Loaded from environment variables for security
 */
export const auth0Config: Auth0ClientOptions = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'fleet.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.fleet.local',
    scope: [
      'openid',
      'profile',
      'email',
      'read:vehicles',
      'write:vehicles',
      'read:drivers',
      'write:drivers',
      'read:workorders',
      'write:workorders',
      'read:facilities',
      'write:facilities',
      'read:routes',
      'analyze:routes',
      'read:audit',
      'admin:all'
    ].join(' ')
  },
  cacheLocation: 'localstorage', // Use localstorage for persistence
  useRefreshTokens: true,
  useRefreshTokensFallback: true
};

/**
 * Azure AD / Microsoft Entra ID Configuration
 * Used for government/enterprise deployments requiring FedRAMP compliance
 */
export const azureAdConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      logLevel: 3, // Error
      piiLoggingEnabled: false
    }
  }
};

/**
 * Azure AD Scopes
 */
export const azureAdScopes = {
  loginRequest: {
    scopes: ['openid', 'profile', 'email', 'User.Read']
  },
  apiRequest: {
    scopes: [`api://${import.meta.env.VITE_AZURE_AD_CLIENT_ID}/Fleet.All`]
  }
};

/**
 * Session Configuration
 * FedRAMP AC-11: Session Lock after 15 minutes
 * FedRAMP AC-12: Session Termination after 30 minutes
 */
export const sessionConfig = {
  /** Idle timeout before warning (14 minutes) */
  idleWarningTimeout: 14 * 60 * 1000,

  /** Idle timeout before automatic logout (15 minutes) */
  idleTimeout: 15 * 60 * 1000,

  /** Absolute session timeout (8 hours for normal users, 1 hour for admins) */
  absoluteTimeout: {
    user: 8 * 60 * 60 * 1000,
    admin: 1 * 60 * 60 * 1000
  },

  /** Token refresh interval (55 minutes - before 1hr expiry) */
  tokenRefreshInterval: 55 * 60 * 1000
};

/**
 * MFA Configuration
 * FedRAMP IA-2(1), IA-2(2): Multi-Factor Authentication
 */
export const mfaConfig = {
  /** Require MFA for all administrative roles */
  requireMfaForRoles: ['admin', 'security-admin', 'fleet-manager'],

  /** Allowed MFA factors */
  allowedFactors: [
    'otp', // One-Time Password (TOTP/HOTP)
    'sms', // SMS (allowed but not recommended)
    'push', // Push notification
    'webauthn', // WebAuthn (FIDO2, preferred)
    'voice' // Voice call
  ],

  /** Preferred MFA factor (WebAuthn for highest security) */
  preferredFactor: 'webauthn' as const,

  /** Remember device for 30 days */
  rememberDeviceDays: 30
};

/**
 * JWT Validation Configuration
 * FedRAMP SC-8, SC-13: Cryptographic Protection
 */
export const jwtConfig = {
  /** Algorithm (RS256 for asymmetric keys) */
  algorithm: 'RS256' as const,

  /** Token expiry (1 hour) */
  expiresIn: '1h',

  /** Refresh token expiry (7 days) */
  refreshExpiresIn: '7d',

  /** Issuer validation */
  issuer: import.meta.env.VITE_AUTH0_DOMAIN
    ? `https://${import.meta.env.VITE_AUTH0_DOMAIN}/`
    : `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}/v2.0`,

  /** Audience validation */
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || `api://${import.meta.env.VITE_AZURE_AD_CLIENT_ID}`,

  /** Clock tolerance (5 seconds) */
  clockTolerance: 5
};

/**
 * Initialize Auth0 Client (Singleton)
 */
let auth0ClientInstance: Auth0Client | null = null;

export async function getAuth0Client(): Promise<Auth0Client> {
  if (!auth0ClientInstance) {
    auth0ClientInstance = new Auth0Client(auth0Config);
  }
  return auth0ClientInstance;
}

/**
 * Initialize Azure AD Client (Singleton)
 */
let azureAdClientInstance: PublicClientApplication | null = null;

export async function getAzureAdClient(): Promise<PublicClientApplication> {
  if (!azureAdClientInstance) {
    azureAdClientInstance = new PublicClientApplication(azureAdConfig);
    await azureAdClientInstance.initialize();
  }
  return azureAdClientInstance;
}

/**
 * Determine which auth provider to use based on environment
 */
export function getAuthProvider(): AuthProvider {
  // Check environment variable override
  const providerOverride = import.meta.env.VITE_AUTH_PROVIDER as AuthProvider | undefined;
  if (providerOverride === 'auth0' || providerOverride === 'azure-ad') {
    return providerOverride;
  }

  // Default to Azure AD for government deployments, Auth0 for others
  const isGovernment = import.meta.env.VITE_DEPLOYMENT_TYPE === 'government';
  return isGovernment ? 'azure-ad' : 'auth0';
}

/**
 * Password Policy Configuration
 * FedRAMP IA-5(1): Password-Based Authentication
 */
export const passwordPolicy = {
  minLength: 14,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxAge: 90, // Days
  historyCount: 24, // Remember last 24 passwords
  maxAttempts: 5, // Lock account after 5 failed attempts
  lockoutDuration: 30 // Minutes
};
