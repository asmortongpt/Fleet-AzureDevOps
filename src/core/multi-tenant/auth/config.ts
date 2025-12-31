import { logger } from '@/utils/logger';

/**
 * Authentication Configuration for Fleet Management System
 * Simple configuration for development and testing
 */

// Simple auth configuration interface
export interface AuthConfig {
  okta: {
    issuer: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    pkce: boolean;
    disableHttpsCheck: boolean;
  };
  session: {
    timeout: number;
    warningTime: number;
    extendTime: number;
    maxExtensions: number;
  };
  security: {
    requireMFA: boolean;
    allowedDomains: string[];
    ipWhitelist?: string[];
    maxFailedLogins: number;
    lockoutDuration: number;
  };
  compliance: {
    auditEnabled: boolean;
    auditEndpoint: string;
    dataClassification: boolean;
    encryptionRequired: boolean;
  };
}

// Default configuration for development
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  okta: {
    issuer: 'https://dev-florida.okta.com',
    clientId: 'fleet-management-app',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/login/callback`,
    scopes: ['openid', 'profile', 'email', 'groups'],
    pkce: true,
    disableHttpsCheck: false
  },
  session: {
    timeout: 480, // 8 hours
    warningTime: 15, // 15 minutes
    extendTime: 60, // 1 hour
    maxExtensions: 3
  },
  security: {
    requireMFA: false, // Disabled for development
    allowedDomains: ['florida.gov', 'dcf.state.fl.us', 'dot.state.fl.us'],
    maxFailedLogins: 3,
    lockoutDuration: 15
  },
  compliance: {
    auditEnabled: false, // Disabled for development
    auditEndpoint: '/api/audit',
    dataClassification: false,
    encryptionRequired: false
  }
};

// Get configuration based on environment
export const getAuthConfig = (): AuthConfig => {
  // For now, always return default config
  return DEFAULT_AUTH_CONFIG;
};

// Export the configuration instance
export const AUTH_CONFIG = getAuthConfig();

// Feature flags for authentication features
export const AUTH_FEATURE_FLAGS = {
  SSO_ENABLED: false, // Disabled for development
  MFA_ENABLED: false,
  SAML_ENABLED: false,
  BIOMETRIC_AUTH: false,
  RISK_BASED_AUTH: false,
  SESSION_SHARING: false,
  AUDIT_LOGGING: false,
  DATA_CLASSIFICATION: false,
  ENCRYPTION_AT_REST: false,
  MOCK_AUTH: true, // Enabled for development
  DEBUG_AUTH: true
};

// Okta domain mapping for different Florida state departments
export const OKTA_DOMAIN_MAPPING = {
  dcf: 'dcf-florida.okta.com',
  dot: 'fdot.okta.com',
  dms: 'dms-florida.okta.com',
  deo: 'deo-florida.okta.com',
  default: 'florida-state.okta.com'
};

// Get Okta domain based on user email or department
export const getOktaDomain = (email?: string, department?: string): string => {
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain?.includes('dcf')) return OKTA_DOMAIN_MAPPING.dcf;
    if (domain?.includes('dot') || domain?.includes('fdot')) return OKTA_DOMAIN_MAPPING.dot;
    if (domain?.includes('dms')) return OKTA_DOMAIN_MAPPING.dms;
    if (domain?.includes('deo')) return OKTA_DOMAIN_MAPPING.deo;
  }

  if (department) {
    const dept = department.toLowerCase();
    if (dept.includes('dcf') || dept.includes('children')) return OKTA_DOMAIN_MAPPING.dcf;
    if (dept.includes('dot') || dept.includes('transportation')) return OKTA_DOMAIN_MAPPING.dot;
    if (dept.includes('dms') || dept.includes('management')) return OKTA_DOMAIN_MAPPING.dms;
    if (dept.includes('deo') || dept.includes('opportunity')) return OKTA_DOMAIN_MAPPING.deo;
  }

  return OKTA_DOMAIN_MAPPING.default;
};

// Group name patterns for role mapping
export const GROUP_ROLE_PATTERNS = {
  ADMIN: ['admin', 'administrator', 'sysadmin'],
  FLEET_ADMIN: ['fleet_admin', 'fleetadmin', 'fleet-admin'],
  FLEET_MANAGER: ['fleet_manager', 'fleetmanager', 'fleet-manager'],
  FLEET_SUPERVISOR: ['fleet_supervisor', 'fleetsupervisor', 'fleet-supervisor'],
  DRIVER: ['driver', 'operator'],
  MECHANIC: ['mechanic', 'technician', 'maint'],
  SAFETY_OFFICER: ['safety', 'safety_officer'],
  AUDITOR: ['auditor', 'audit', 'compliance'],
  VIEWER: ['viewer', 'readonly', 'read-only']
};

// Map Okta groups to application roles
export const mapOktaGroupsToRoles = (groups: string[]): string[] => {
  const roles: string[] = [];

  groups.forEach(group => {
    const groupLower = group.toLowerCase();

    // Check each role pattern
    Object.entries(GROUP_ROLE_PATTERNS).forEach(([role, patterns]) => {
      if (patterns.some(pattern => groupLower.includes(pattern))) {
        roles.push(role.toLowerCase());
      }
    });
  });

  // Default to viewer if no roles found
  if (roles.length === 0) {
    roles.push('viewer');
  }

  return Array.from(new Set(roles)); // Remove duplicates
};

// Configuration summary for logging
export const getConfigSummary = (): Record<string, any> => {
  const config = getAuthConfig();
  return {
    environment: process.env.NODE_ENV || 'development',
    okta_issuer: config.okta.issuer,
    client_id: config.okta.clientId.substring(0, 8) + '...',
    mfa_required: config.security.requireMFA,
    audit_enabled: config.compliance.auditEnabled,
    session_timeout: config.session.timeout,
    allowed_domains: config.security.allowedDomains.length,
    feature_flags: Object.entries(AUTH_FEATURE_FLAGS)
      .filter(([_, enabled]) => enabled)
      .map(([flag]) => flag)
  };
};

// Log configuration on startup (development only)
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  // logger.debug('Auth Configuration Summary:', getConfigSummary());
}