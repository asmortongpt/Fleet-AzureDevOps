/**
 * Radio Dispatch Authentication Configuration
 *
 * Uses MSAL (Microsoft Authentication Library) for Azure AD authentication.
 * This module provides auth configuration specific to the radio-dispatch feature.
 */

import type { Configuration, PopupRequest, RedirectRequest } from '@azure/msal-browser';

// Auth configuration options interface
export interface AuthOptions {
  providers: AuthProvider[];
  callbacks: AuthCallbacks;
  pages: AuthPages;
  session: SessionConfig;
  secret?: string;
  cookies?: CookieConfig;
}

interface AuthProvider {
  id: string;
  name: string;
  clientId: string;
  tenantId: string;
  authorization?: {
    params?: {
      scope?: string;
    };
  };
}

interface AuthCallbacks {
  jwt?: (params: JwtCallbackParams) => Promise<JwtToken>;
  session?: (params: SessionCallbackParams) => Promise<Session>;
  redirect?: (params: RedirectCallbackParams) => Promise<string>;
}

interface JwtCallbackParams {
  token: JwtToken;
  account?: AccountInfo | null;
  profile?: Profile | null;
}

interface SessionCallbackParams {
  session: Session;
  token: JwtToken;
}

interface RedirectCallbackParams {
  url: string;
  baseUrl: string;
}

interface AuthPages {
  signIn?: string;
  error?: string;
}

interface SessionConfig {
  strategy: 'jwt' | 'database';
  maxAge?: number;
}

interface CookieOptions {
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  secure?: boolean;
  maxAge?: number;
}

interface CookieConfig {
  sessionToken?: { name: string; options: CookieOptions };
  callbackUrl?: { name: string; options: CookieOptions };
  csrfToken?: { name: string; options: CookieOptions };
  pkceCodeVerifier?: { name: string; options: CookieOptions };
  state?: { name: string; options: CookieOptions };
  nonce?: { name: string; options: CookieOptions };
}

// Session and Token types
export interface Session {
  accessToken?: string;
  user: {
    role?: string;
    organizationId?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface JwtToken {
  accessToken?: string;
  idToken?: string;
  role?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface Profile {
  role?: string;
  organizationId?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface AccountInfo {
  access_token?: string;
  id_token?: string;
  [key: string]: unknown;
}

export const authOptions: AuthOptions = {
  providers: [
    {
      id: 'azure-ad',
      name: 'Azure AD',
      clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
      tenantId: import.meta.env.VITE_AZURE_AD_TENANT_ID || '',
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }: JwtCallbackParams): Promise<JwtToken> {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account?.access_token;
        token.idToken = account?.id_token;
      }
      if (profile) {
        token.role = profile?.role || 'viewer';
        token.organizationId = profile?.organizationId;
      }
      return token;
    },

    async session({ session, token }: SessionCallbackParams): Promise<Session> {
      // Send properties to the client
      session.accessToken = token?.accessToken as string;
      session.user.role = token?.role as string;
      session.user.organizationId = token?.organizationId as string;
      return session;
    },

    async redirect({ url, baseUrl }: RedirectCallbackParams): Promise<string> {
      // Redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl + '/dashboard';
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },

  secret: import.meta.env.VITE_AUTH_SECRET,

  // Cookie configuration for basePath support
  cookies: {
    sessionToken: {
      name: '__Secure-dispatch.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    callbackUrl: {
      name: '__Secure-dispatch.callback-url',
      options: {
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    csrfToken: {
      name: '__Host-dispatch.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-dispatch.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
        maxAge: 900, // 15 minutes
      },
    },
    state: {
      name: '__Secure-dispatch.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
        maxAge: 900, // 15 minutes
      },
    },
    nonce: {
      name: '__Secure-dispatch.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/dispatch',
        secure: true,
      },
    },
  },
};

/**
 * MSAL Configuration for Radio Dispatch feature
 * Use this with PublicClientApplication from @azure/msal-browser
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

/**
 * Login request configuration for MSAL
 */
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
};

/**
 * Redirect request configuration for MSAL
 */
export const redirectRequest: RedirectRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
};
