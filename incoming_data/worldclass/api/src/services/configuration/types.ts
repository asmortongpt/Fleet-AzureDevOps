/**
 * CONFIGURATION UNIT - Type Definitions
 *
 * Comprehensive configuration system for CTA owners
 * Every element in the system is configurable through this interface
 */

// ============================================================================
// CONFIGURATION CATEGORIES
// ============================================================================

export type ConfigCategory =
  | 'system'
  | 'branding'
  | 'security'
  | 'features'
  | 'integrations'
  | 'notifications'
  | 'workflows'
  | 'policies'
  | 'ui-ux'
  | 'data-retention'
  | 'ai-services'
  | 'reporting'

// ============================================================================
// CONFIGURATION VALUE TYPES
// ============================================================================

export type ConfigValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'object'
  | 'color'
  | 'url'
  | 'email'
  | 'json'

export interface ConfigOption {
  label: string
  value: any
  description?: string
  icon?: string
}

export interface ConfigValidation {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  options?: ConfigOption[]
  customValidator?: string // Function name for custom validation
}

// ============================================================================
// CONFIGURATION ITEM
// ============================================================================

export interface ConfigItem {
  id: string
  category: ConfigCategory
  key: string // Dot-notation path (e.g., 'branding.logo.url')
  label: string
  description: string
  type: ConfigValueType
  value: any
  defaultValue: any
  validation?: ConfigValidation

  // Access control
  requiresCTAOwner: boolean
  visibleToRoles?: string[]
  editableByRoles?: string[]

  // Metadata
  group?: string
  order?: number
  tags?: string[]
  sensitive?: boolean // Hide value in UI/logs

  // Dependencies
  dependsOn?: string[] // Other config keys that must be set first
  affects?: string[] // Other config keys that will be impacted

  // Rules engine integration
  appliesWhen?: PolicyCondition[]

  // Audit
  lastModified?: string
  modifiedBy?: string
  version?: number
}

// ============================================================================
// POLICY & RULES ENGINE
// ============================================================================

export interface PolicyCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface PolicyRule {
  id: string
  name: string
  description: string
  category: string
  priority: number // Higher = executed first

  // Conditions
  conditions: PolicyCondition[]
  conditionLogic: 'AND' | 'OR' // How to combine conditions

  // Actions
  actions: PolicyAction[]

  // Metadata
  enabled: boolean
  createdAt: string
  createdBy: string
  lastExecuted?: string
}

export interface PolicyAction {
  type: 'set_config' | 'send_notification' | 'create_task' | 'log_event' | 'trigger_workflow'
  config?: {
    key: string
    value: any
  }
  notification?: {
    recipients: string[]
    template: string
    priority: 'low' | 'medium' | 'high'
  }
  task?: {
    title: string
    assignee: string
    dueDate?: string
  }
}

// ============================================================================
// CONFIGURATION PROFILES
// ============================================================================

export interface ConfigProfile {
  id: string
  name: string
  description: string
  isDefault: boolean

  // Profile settings
  settings: Record<string, any> // Flat key-value pairs

  // Policy associations
  policyRules: string[] // IDs of active rules

  // Metadata
  createdAt: string
  createdBy: string
  lastModified: string
  modifiedBy: string
  version: number
}

// ============================================================================
// CONFIGURATION CHANGE TRACKING
// ============================================================================

export interface ConfigChange {
  id: string
  configKey: string
  oldValue: any
  newValue: any
  changedBy: string
  changedAt: string
  reason?: string
  approvedBy?: string
  rollbackable: boolean
  source: 'manual' | 'policy_engine' | 'initial_setup' | 'api'
}

// ============================================================================
// INITIAL SETUP WIZARD
// ============================================================================

export interface SetupStep {
  id: string
  title: string
  description: string
  order: number
  required: boolean
  configItems: string[] // Config IDs to configure in this step
  completed: boolean
}

export interface InitialSetup {
  organizationId: string
  steps: SetupStep[]
  currentStep: number
  completed: boolean
  startedAt: string
  completedAt?: string
  completedBy?: string
}

// ============================================================================
// COMPREHENSIVE CONFIGURATION SCHEMA
// ============================================================================

export interface SystemConfiguration {
  // System Settings
  system: {
    organizationName: string
    organizationId: string
    environment: 'development' | 'staging' | 'production'
    timezone: string
    dateFormat: string
    timeFormat: string
    currency: string
    language: string
    maintenanceMode: boolean
  }

  // Branding
  branding: {
    logo: {
      url: string
      width: number
      height: number
    }
    favicon: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    companyName: string
    tagline: string
    customCSS?: string
  }

  // Security
  security: {
    authentication: {
      method: 'sso' | 'local' | 'hybrid'
      ssoProvider: 'azure-ad' | 'okta' | 'google'
      allowLocalLogin: boolean
      mfaRequired: boolean
      mfaMethods: ('totp' | 'sms' | 'email')[]
      sessionTimeout: number // minutes
      passwordPolicy: {
        minLength: number
        requireUppercase: boolean
        requireLowercase: boolean
        requireNumbers: boolean
        requireSpecialChars: boolean
        expiryDays: number
      }
    }
    authorization: {
      rbacEnabled: boolean
      defaultRole: string
      autoAssignRoles: boolean
    }
    encryption: {
      atRest: boolean
      inTransit: boolean
      algorithm: string
    }
    audit: {
      enabled: boolean
      retentionDays: number
      logSensitiveData: boolean
    }
  }

  // Features
  features: {
    modules: {
      fleet: boolean
      maintenance: boolean
      analytics: boolean
      dispatch: boolean
      compliance: boolean
      financial: boolean
      safety: boolean
      environmental: boolean
      procurement: boolean
      hr: boolean
    }
    aiAssistant: {
      enabled: boolean
      provider: 'openai' | 'claude' | 'gemini' | 'grok'
      model: string
      features: ('chat' | 'suggestions' | 'automation' | 'analysis')[]
    }
    realtime: {
      enabled: boolean
      updateInterval: number // seconds
      pushNotifications: boolean
    }
  }

  // Integrations
  integrations: {
    googleMaps: {
      enabled: boolean
      apiKey: string
      features: ('routing' | 'geocoding' | 'traffic' | 'places')[]
    }
    microsoft365: {
      enabled: boolean
      tenantId: string
      clientId: string
      features: ('calendar' | 'email' | 'teams' | 'sharepoint')[]
    }
    telematics: {
      provider: string
      enabled: boolean
      features: ('gps' | 'diagnostics' | 'fuel' | 'driver-behavior')[]
    }
  }

  // Notifications
  notifications: {
    channels: {
      email: boolean
      sms: boolean
      push: boolean
      inApp: boolean
    }
    templates: Record<string, {
      subject: string
      body: string
      priority: 'low' | 'medium' | 'high'
    }>
    schedule: {
      quietHours: {
        enabled: boolean
        startTime: string
        endTime: string
      }
      batchInterval: number // minutes
    }
  }

  // Workflows
  workflows: {
    maintenanceApproval: {
      enabled: boolean
      autoApproveUnder: number // dollar amount
      requiresApproval: string[] // user roles
      escalationDays: number
    }
    dispatchAssignment: {
      autoAssign: boolean
      algorithm: 'round-robin' | 'nearest' | 'load-balanced' | 'manual'
      notifyDriver: boolean
    }
    incidentReporting: {
      requiredFields: string[]
      autoNotify: string[] // roles
      escalationMatrix: Record<string, string>
    }
  }

  // Policies
  policies: {
    dataRetention: {
      vehicleData: number // days
      maintenanceRecords: number
      financialRecords: number
      userActivity: number
      complianceDocuments: number
    }
    privacy: {
      gdprCompliant: boolean
      ccpaCompliant: boolean
      dataExportEnabled: boolean
      anonymizeAfterDays: number
    }
    usage: {
      maxUsers: number
      maxVehicles: number
      maxLocations: number
      storageQuota: number // GB
    }
  }

  // UI/UX
  uiUx: {
    theme: 'light' | 'dark' | 'auto'
    density: 'comfortable' | 'compact' | 'spacious'
    defaultView: string
    dashboardLayout: 'grid' | 'list' | 'custom'
    enableAnimations: boolean
    enableSounds: boolean
    accessibilityMode: boolean
  }

  // Reporting
  reporting: {
    schedules: Record<string, {
      enabled: boolean
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
      recipients: string[]
      format: 'pdf' | 'excel' | 'csv'
    }>
    customReports: boolean
    exportFormats: string[]
  }
}
