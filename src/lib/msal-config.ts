/**
 * MSAL Configuration for Azure AD SSO
 *
 * This file imports centralized authentication configuration from @/config/auth-config.ts
 * Works across all environments: localhost, Azure Static Web Apps, custom domains
 *
 * SECURITY:
 * - All redirect URIs must be registered in Azure AD App Registration
 * - Tokens are stored in sessionStorage (cleared on tab close)
 * - HTTPS required in production
 * - Client secret is NEVER exposed to frontend
 */

import { Configuration, PopupRequest, SilentRequest } from '@azure/msal-browser';
import { getMsalConfig, getLoginRequest, getSilentRequest } from '@/config/auth-config';
import logger from '@/utils/logger';

/**
 * MSAL Configuration
 *
 * Generated from centralized auth-config.ts with environment-specific settings
 */
export const msalConfig: Configuration = {
  ...getMsalConfig(),
  system: {
    ...getMsalConfig().system,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;

        const prefix = '[MSAL]';
        switch (level) {
          case 0: // Error
            logger.error(prefix, message);
            break;
          case 1: // Warning
            logger.warn(prefix, message);
            break;
          case 2: // Info
            logger.info(prefix, message);
            break;
          case 3: // Verbose
            logger.debug(prefix, message);
            break;
        }
      },
      logLevel: import.meta.env.DEV ? 3 : 1, // Verbose in dev, Warning in prod
      piiLoggingEnabled: import.meta.env.DEV,
    },
  },
};

/**
 * Login Request Configuration
 *
 * Used for initial authentication (redirect or popup)
 * Scopes: openid, profile, email, User.Read
 * Prompt: select_account (user chooses which account to use)
 */
export const loginRequest: PopupRequest = {
  ...getLoginRequest(),
};

/**
 * Silent Token Request Configuration
 *
 * Used for silent token renewal (no user interaction)
 * Includes offline_access for refresh token support
 */
export const silentRequest: SilentRequest = {
  ...getSilentRequest(),
};
