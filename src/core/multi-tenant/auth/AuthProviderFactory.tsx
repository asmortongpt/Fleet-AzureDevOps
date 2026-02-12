
import React, { ReactNode } from 'react';

import { ProductionOktaProvider } from './ProductionOktaProvider';

// Environment detection and configuration
const getAuthProviderConfig = () => {
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production';
  const forceOkta = import.meta.env.VITE_REACT_APP_FORCE_OKTA_AUTH === 'true';
  const oktaConfigured = Boolean(
    import.meta.env.VITE_REACT_APP_OKTA_ISSUER &&
    import.meta.env.VITE_REACT_APP_OKTA_CLIENT_ID
  );

  // Decision matrix for authentication provider
  if (forceOkta && oktaConfigured) {
    return { provider: 'okta', reason: 'Force Okta authentication via environment variable' };
  }

  if (isProduction && oktaConfigured) {
    return { provider: 'okta', reason: 'Production environment with Okta configured' };
  }

  if (!isProduction) {
    return { provider: 'okta', reason: 'Development environment - Okta required for auth' };
  }

  // Default to okta when configured; otherwise error out
  return { provider: 'okta', reason: 'Okta required for authentication' };
};

interface AuthProviderFactoryProps {
  children: ReactNode;
}

export const AuthProviderFactory: React.FC<AuthProviderFactoryProps> = ({ children }) => {
  const config = getAuthProviderConfig();

  // logger.debug(`[AuthProviderFactory] Using ${config.provider} authentication: ${config.reason}`);

  if (!import.meta.env.VITE_REACT_APP_OKTA_ISSUER || !import.meta.env.VITE_REACT_APP_OKTA_CLIENT_ID) {
    throw new Error('Okta configuration missing: set VITE_REACT_APP_OKTA_ISSUER and VITE_REACT_APP_OKTA_CLIENT_ID');
  }

  return <ProductionOktaProvider>{children}</ProductionOktaProvider>;
};

export default AuthProviderFactory;
