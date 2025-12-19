import * as msal from '@azure/msal-node';

import { logger } from '../utils/logger';

const config: msal.Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET as string,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (containsPii) return;
        switch (loglevel) {
          case msal.LogLevel.Error:
            logger.error(message);
            break;
          case msal.LogLevel.Warning:
            logger.warn(message);
            break;
          case msal.LogLevel.Info:
            logger.info(message);
            break;
          default:
            logger.debug(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};

export const pca = new msal.ConfidentialClientApplication(config);
export const REDIRECT_URI = process.env.AZURE_REDIRECT_URI as string;

logger.info('Azure AD MSAL configured', {
  clientId: process.env.AZURE_CLIENT_ID,
  tenantId: process.env.AZURE_TENANT_ID,
  redirectUri: REDIRECT_URI
});
