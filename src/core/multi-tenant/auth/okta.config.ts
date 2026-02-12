/**
 * Okta SAML 2.0 Configuration for DCF Fleet Management
 * Production-ready configuration for Florida state identity integration
 * Compliant with DCF ITB 2425-077 security requirements
 */

export interface OktaEnvironmentConfig {
  issuer: string
  clientId: string
  redirectUri: string
  postLogoutRedirectUri: string
  scopes: string[]
  environment: 'development' | 'staging' | 'production'
}

// Environment-specific configurations
export const oktaConfigs: Record<string, OktaEnvironmentConfig> = {
  development: {
    issuer: 'https://dev-dcf-florida.okta.com/oauth2/default',
    clientId: 'dcf-fleet-dev-client',
    redirectUri: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/login/callback`,
    postLogoutRedirectUri: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    scopes: ['openid', 'profile', 'email', 'groups', 'dcf.fleet.access'],
    environment: 'development'
  },

  staging: {
    issuer: 'https://staging-dcf-florida.okta.com/oauth2/default',
    clientId: 'dcf-fleet-staging-client',
    redirectUri: 'https://staging-fleet.dcf.state.fl.us/login/callback',
    postLogoutRedirectUri: 'https://staging-fleet.dcf.state.fl.us',
    scopes: ['openid', 'profile', 'email', 'groups', 'dcf.fleet.access'],
    environment: 'staging'
  },

  production: {
    issuer: 'https://dcf-florida.okta.com/oauth2/default',
    clientId: 'dcf-fleet-prod-client',
    redirectUri: 'https://fleet.dcf.state.fl.us/login/callback',
    postLogoutRedirectUri: 'https://fleet.dcf.state.fl.us',
    scopes: ['openid', 'profile', 'email', 'groups', 'dcf.fleet.access'],
    environment: 'production'
  }
}

// Get current environment configuration
export const getCurrentOktaConfig = (): OktaEnvironmentConfig => {
  const env = import.meta.env.VITE_NODE_ENV || 'development'
  const configKey = import.meta.env.VITE_REACT_APP_DEPLOYMENT_ENV || env
  const config = oktaConfigs[configKey] || oktaConfigs.development

  // Override with environment variables if provided
  return {
    ...config,
    issuer: process.env.VITE_REACT_APP_OKTA_ISSUER || config.issuer,
    clientId: process.env.VITE_REACT_APP_OKTA_CLIENT_ID || config.clientId,
    redirectUri: process.env.VITE_REACT_APP_OKTA_REDIRECT_URI || config.redirectUri,
    postLogoutRedirectUri: process.env.VITE_REACT_APP_OKTA_POST_LOGOUT_URI || config.postLogoutRedirectUri
  }
}

// SAML Attribute Mapping Configuration
export const samlAttributeMapping = {
  // Standard OIDC claims
  sub: 'user_id',
  email: 'email',
  given_name: 'first_name',
  family_name: 'last_name',
  name: 'full_name',
  preferred_username: 'username',

  // DCF-specific SAML attributes
  "dcf:employee_id": "employee_id",
  "dcf:department": "department",
  "dcf:job_title": "job_title",
  "dcf:role": "role",
  "dcf:region": "region",
  "dcf:permissions": "permissions",
  "dcf:cost_center": "cost_center",
  "dcf:supervisor_id": "supervisor_id",
  "dcf:clearance": "security_clearance",
  "dcf:mfa_enabled": "mfa_enabled",
  "dcf:account_status": "account_status",
  "dcf:session_timeout": "session_timeout",
  "dcf:training_complete": "training_complete",
  "dcf:contractor": "contractor_flag",
  "dcf:last_password_change": "password_changed_at",
  "dcf:password_expiry": "password_expires_at"
}

// Role hierarchy and permissions mapping
export const dcfRoleHierarchy = {
  admin: {
    level: 4,
    inherits: ['manager', 'driver', 'mechanic'],
    permissions: [
      'fleet:admin',
      'fleet:manage',
      'fleet:view',
      'fleet:edit',
      'fleet:delete',
      'fleet:reports',
      'fleet:audit',
      'users:manage',
      'roles:manage',
      'system:config'
    ]
  },

  manager: {
    level: 3,
    inherits: ['driver', 'mechanic'],
    permissions: [
      'fleet:manage',
      'fleet:view',
      'fleet:edit',
      'fleet:reports',
      'fleet:approve',
      'vehicles:assign',
      'maintenance:schedule',
      'drivers:manage'
    ]
  },

  driver: {
    level: 2,
    inherits: [],
    permissions: [
      'fleet:view',
      'fleet:edit_own',
      'trips:create',
      'trips:edit_own',
      'mileage:submit',
      'vehicles:checkout',
      'maintenance:report'
    ]
  },

  mechanic: {
    level: 2,
    inherits: [],
    permissions: [
      'fleet:view',
      'maintenance:manage',
      'maintenance:schedule',
      'maintenance:complete',
      'vehicles:inspect',
      'parts:manage',
      'work_orders:manage'
    ]
  }
}

// Region-specific settings
export const dcfRegions = {
  central: {
    name: 'Central Region',
    timezone: 'America/New_York',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-407-555-0123'
  },

  headquarters: {
    name: 'Headquarters',
    timezone: 'America/New_York',
    office_hours: { start: '07:30', end: '18:00'},
    emergency_contact: '+1-850-555-0100'
  },

  northeast: {
    name: 'Northeast Region',
    timezone: 'America/New_York',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-904-555-0150'
  },

  northwest: {
    name: 'Northwest Region',
    timezone: 'America/Chicago',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-850-555-0175'
  },

  southern: {
    name: 'Southern Region',
    timezone: 'America/New_York',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-305-555-0200'
  },

  southeast: {
    name: 'Southeast Region',
    timezone: 'America/New_York',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-561-555-0225'
  },

  suncoast: {
    name: 'Suncoast Region',
    timezone: 'America/New_York',
    office_hours: { start: '08:00', end: '17:00'},
    emergency_contact: '+1-813-555-0250'
  }
}

// Security policies
export const securityPolicies = {
  session: {
    maxDurationHours: 8,
    idleTimeoutMinutes: 30,
    warningBeforeTimeoutMinutes: 5,
    extendSessionMaxTimes: 3
  },

  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAgeDays: 90,
    historyCount: 12
  },

  mfa: {
    required: true,
    allowedMethods: ['sms', 'email', 'okta_verify', 'google_authenticator'],
    backupCodes: true,
    rememberDeviceDays: 30
  },

  access: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    requireReAuthentication: ['admin_actions', 'role_changes', 'sensitive_data'],
    allowedIpRanges: [
      '10.0.0.0/8', // DCF internal network
      '172.16.0.0/12', // DCF private network
      '192.168.0.0/16' // DCF local network
    ]
  }
}

// Audit and compliance settings
export const complianceSettings = {
  auditEvents: [
    'login_success',
    'login_failure',
    'logout',
    'session_timeout',
    'permission_denied',
    'role_change',
    'data_access',
    'data_modification',
    'admin_action',
    'security_event'
  ],

  retentionPeriods: {
    auditLogs: '7_years',
    sessionLogs: '1_year',
    securityEvents: '5_years',
    accessLogs: '2_years'
  },

  reportingRequirements: {
    securityIncidents: 'immediate',
    accessReviews: 'quarterly',
    privilegedAccess: 'monthly',
    complianceReports: 'annual'
  }
}

// Integration endpoints
export const integrationEndpoints = {
  development: {
    flairApi: 'https://dev-flair.dcf.state.fl.us/api',
    fdotGis: 'https://dev-gis.fdot.gov/api',
    myFloridaMarketplace: 'https://dev-mfmp.state.fl.us/api',
    dcfHr: 'https://dev-hr.dcf.state.fl.us/api',
    auditSystem: 'https://dev-audit.dcf.state.fl.us/api'
  },

  staging: {
    flairApi: 'https://staging-flair.dcf.state.fl.us/api',
    fdotGis: 'https://staging-gis.fdot.gov/api',
    myFloridaMarketplace: 'https://staging-mfmp.state.fl.us/api',
    dcfHr: 'https://staging-hr.dcf.state.fl.us/api',
    auditSystem: 'https://staging-audit.dcf.state.fl.us/api'
  },

  production: {
    flairApi: 'https://flair.dcf.state.fl.us/api',
    fdotGis: 'https://gis.fdot.gov/api',
    myFloridaMarketplace: 'https://mfmp.state.fl.us/api',
    dcfHr: 'https://hr.dcf.state.fl.us/api',
    auditSystem: 'https://audit.dcf.state.fl.us/api'
  }
}

// Feature flags for different environments
export const featureFlags = {
  development: {
    enableDebugLogging: true,
    enableMockData: false,
    enableExperimentalFeatures: true,
    skipCertificateValidation: true,
    allowHttpConnections: true
  },

  staging: {
    enableDebugLogging: true,
    enableMockData: false,
    enableExperimentalFeatures: true,
    skipCertificateValidation: false,
    allowHttpConnections: false
  },

  production: {
    enableDebugLogging: false,
    enableMockData: false,
    enableExperimentalFeatures: false,
    skipCertificateValidation: false,
    allowHttpConnections: false
  }
}

// Export configuration helper function
export const getOktaConfiguration = () => {
  const environment = import.meta.env.VITE_NODE_ENV || 'development'
  const config = getCurrentOktaConfig()
  const features = featureFlags[environment as keyof typeof featureFlags]
  const security = securityPolicies

  return {
    config,
    features,
    security,
    environment,
    samlAttributeMapping,
    dcfRoleHierarchy,
    dcfRegions,
    complianceSettings,
    integrationEndpoints: integrationEndpoints[environment as keyof typeof integrationEndpoints]
  }
}

export default getOktaConfiguration
