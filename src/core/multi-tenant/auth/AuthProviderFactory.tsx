
import React, { ReactNode } from 'react';

import { MockAuthProvider } from './MockAuthProvider';

// Environment detection and configuration
const getAuthProviderConfig = () => {
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production';
  const forceOkta = import.meta.env.VITE_REACT_APP_FORCE_OKTA_AUTH === 'true';
  const forceMock = import.meta.env.VITE_REACT_APP_FORCE_MOCK_AUTH === 'true';
  const oktaConfigured = Boolean(
    import.meta.env.VITE_REACT_APP_OKTA_ISSUER &&
    import.meta.env.VITE_REACT_APP_OKTA_CLIENT_ID
  );

  // Decision matrix for authentication provider
  if (forceMock) {
    return { provider: 'mock', reason: 'Force mock authentication via environment variable' };
  }

  if (forceOkta && oktaConfigured) {
    return { provider: 'okta', reason: 'Force Okta authentication via environment variable' };
  }

  if (isProduction && oktaConfigured) {
    return { provider: 'okta', reason: 'Production environment with Okta configured' };
  }

  if (!isProduction) {
    return { provider: 'mock', reason: 'Development environment - using mock authentication' };
  }

  // Default to mock if Okta is not properly configured
  return { provider: 'mock', reason: 'Okta not properly configured - using mock authentication' };
};

interface AuthProviderFactoryProps {
  children: ReactNode;
}

export const AuthProviderFactory: React.FC<AuthProviderFactoryProps> = ({ children }) => {
  const config = getAuthProviderConfig();

  // logger.debug(`[AuthProviderFactory] Using ${config.provider} authentication: ${config.reason}`);

  // For now, always use MockAuthProvider until Okta is fully configured
  return <MockAuthProvider>{children}</MockAuthProvider>;
};

export default AuthProviderFactory;