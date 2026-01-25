import { Configuration, PopupRequest } from '@azure/msal-browser';

/**
 * MSAL Configuration for Azure AD SSO
 * Works across all environments: localhost, gray-flower, fleet.capitaltechalliance.com
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case 0: // Error
            console.error('[MSAL]', message);
            break;
          case 1: // Warning
            console.warn('[MSAL]', message);
            break;
          case 2: // Info
            console.info('[MSAL]', message);
            break;
          case 3: // Verbose
            console.debug('[MSAL]', message);
            break;
        }
      },
      logLevel: import.meta.env.DEV ? 3 : 1, // Verbose in dev, Warning in prod
    },
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account',
};

export const silentRequest = {
  scopes: ['openai', 'profile', 'email', 'User.Read'],
};
