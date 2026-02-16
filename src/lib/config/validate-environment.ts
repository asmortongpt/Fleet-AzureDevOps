/**
 * Environment Variable Validation
 * Ensures all required configuration is present before app starts
 */

interface ValidationError {
  variable: string;
  message: string;
}

export function validateEnvironment(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Critical variables that MUST be set
  const REQUIRED_VARS = {
    VITE_API_URL: 'Backend API URL (e.g., https://api.example.com)',
    VITE_AZURE_AD_CLIENT_ID: 'Azure AD Client ID for authentication',
    VITE_AZURE_AD_TENANT_ID: 'Azure AD Tenant ID for authentication',
  };

  // Production-only required variables
  if (import.meta.env.PROD) {
    const PROD_REQUIRED = {
      VITE_AZURE_AD_REDIRECT_URI: 'Azure AD Redirect URI (must match Azure registration)',
    };
    Object.assign(REQUIRED_VARS, PROD_REQUIRED);
  }

  // Check each required variable
  for (const [varName, description] of Object.entries(REQUIRED_VARS)) {
    const value = import.meta.env[varName as keyof ImportMetaEnv];
    if (!value) {
      errors.push({
        variable: varName,
        message: `${description} - Set ${varName} environment variable`,
      });
    }
  }

  // Check for dangerous bypasses in production
  if (import.meta.env.PROD) {
    const DANGER_VARS = ['VITE_SKIP_AUTH', 'VITE_BYPASS_AUTH'];
    for (const varName of DANGER_VARS) {
      const value = import.meta.env[varName as keyof ImportMetaEnv];
      if (value === 'true') {
        errors.push({
          variable: varName,
          message: `${varName} is not allowed in production - remove from environment`,
        });
      }
    }
  }

  return errors;
}

export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error(
      'VITE_API_URL environment variable is required. ' +
      'Set it to your backend API URL (e.g., https://api.example.com)'
    );
  }
  return url;
}

export function getWsUrl(): string {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (!wsUrl && import.meta.env.PROD) {
    throw new Error('VITE_WS_URL environment variable is required in production');
  }
  // In development, construct from API URL if not provided
  if (!wsUrl) {
    const apiUrl = getApiUrl();
    return apiUrl.replace(/^http/, 'ws');
  }
  return wsUrl;
}
