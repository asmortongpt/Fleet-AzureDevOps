/**
 * Configuration Engine
 * Provides complete control over every configurable aspect of the Fleet application
 * Driven by policies and initial setup from Policy Hub
 *
 * This engine makes EVERYTHING configurable:
 * - UI elements (colors, branding, layouts)
 * - Business rules (thresholds, limits, calculations)
 * - Workflows (approval chains, notifications)
 * - Integrations (APIs, webhooks, external systems)
 * - Modules (enabled/disabled features)
 * - User experience (dashboards, navigation, defaults)
 */

import type { Policy } from '../policy-engine/types'
import logger from '@/utils/logger';

// ============================================================================
// Configuration Schema Types
// ============================================================================

export interface ConfigurationSchema {
  categories: ConfigCategory[]
  version: string
  lastModified: Date
  modifiedBy: string
}

export interface ConfigCategory {
  id: string
  name: string
  description: string
  icon: string
  order: number
  sections: ConfigSection[]
  requiredRole: 'SuperAdmin' | 'CTAOwner'
}

export interface ConfigSection {
  id: string
  name: string
  description: string
  settings: ConfigSetting[]
  dependsOn?: string[] // Other section IDs that must be configured first
  policyDriven?: boolean // Whether this section is auto-configured by policies
}

export interface ConfigSetting {
  id: string
  key: string // Dot notation path: 'ui.theme.primaryColor'
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'json' | 'code' | 'file'
  value: any
  defaultValue: any
  options?: ConfigOption[] // For select/multiselect
  validation?: ConfigValidation
  impact: 'low' | 'medium' | 'high' // Impact of changing this setting
  requiresRestart?: boolean
  requiresApproval?: boolean
  policySource?: string // Policy ID that sets/influences this value
  preview?: boolean // Whether to show live preview
}

export interface ConfigOption {
  value: any
  label: string
  description?: string
}

export interface ConfigValidation {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  custom?: (value: any) => boolean | string
}

// ============================================================================
// Complete Configuration Schema
// ============================================================================

export const CONFIGURATION_SCHEMA: ConfigurationSchema = {
  version: '1.0.0',
  lastModified: new Date(),
  modifiedBy: 'system',

  categories: [
    // ========================================================================
    // 1. ORGANIZATION & BRANDING
    // ========================================================================
    {
      id: 'organization',
      name: 'Organization & Branding',
      description: 'Organization identity, branding, and visual customization',
      icon: 'Building',
      order: 1,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'org-identity',
          name: 'Organization Identity',
          description: 'Core organization information',
          policyDriven: true,
          settings: [
            {
              id: 'org-name',
              key: 'organization.name',
              label: 'Organization Name',
              description: 'Legal name of the organization',
              type: 'string',
              value: '',
              defaultValue: '',
              validation: { required: true },
              impact: 'high',
              policySource: 'organization-profile'
            },
            {
              id: 'org-type',
              key: 'organization.type',
              label: 'Organization Type',
              description: 'Type of organization',
              type: 'select',
              value: 'municipal',
              defaultValue: 'municipal',
              options: [
                { value: 'municipal', label: 'Municipal Government', description: 'City, town, or county government' },
                { value: 'state', label: 'State Government', description: 'State-level agency' },
                { value: 'federal', label: 'Federal Government', description: 'Federal agency' },
                { value: 'private', label: 'Private Fleet', description: 'Commercial or private company' },
                { value: 'education', label: 'Educational Institution', description: 'School district or university' },
                { value: 'utility', label: 'Utility Company', description: 'Electric, gas, water utility' }
              ],
              impact: 'high',
              policySource: 'organization-profile'
            },
            {
              id: 'jurisdiction',
              key: 'organization.jurisdiction',
              label: 'Jurisdiction',
              description: 'Geographic jurisdiction (e.g., "Tallahassee, FL")',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'medium',
              policySource: 'organization-profile'
            },
            {
              id: 'fleet-size',
              key: 'organization.fleetSize',
              label: 'Fleet Size',
              description: 'Total number of vehicles and equipment',
              type: 'number',
              value: 0,
              defaultValue: 0,
              validation: { min: 0 },
              impact: 'medium',
              policySource: 'organization-profile'
            }
          ]
        },
        {
          id: 'branding',
          name: 'Visual Branding',
          description: 'Colors, logos, and visual identity',
          settings: [
            {
              id: 'logo',
              key: 'branding.logo',
              label: 'Organization Logo',
              description: 'Primary logo for headers and documents',
              type: 'file',
              value: null,
              defaultValue: null,
              impact: 'low',
              preview: true
            },
            {
              id: 'primary-color',
              key: 'branding.primaryColor',
              label: 'Primary Color',
              description: 'Main brand color for UI elements',
              type: 'color',
              value: '#3b82f6',
              defaultValue: '#3b82f6',
              impact: 'low',
              preview: true
            },
            {
              id: 'secondary-color',
              key: 'branding.secondaryColor',
              label: 'Secondary Color',
              description: 'Accent color for highlights and CTAs',
              type: 'color',
              value: '#8b5cf6',
              defaultValue: '#8b5cf6',
              impact: 'low',
              preview: true
            },
            {
              id: 'dark-mode',
              key: 'branding.darkModeDefault',
              label: 'Default Theme',
              description: 'Default color scheme',
              type: 'select',
              value: 'light',
              defaultValue: 'light',
              options: [
                { value: 'light', label: 'Light Mode' },
                { value: 'dark', label: 'Dark Mode' },
                { value: 'auto', label: 'Auto (system preference)' }
              ],
              impact: 'low',
              preview: true
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 2. MODULES & FEATURES
    // ========================================================================
    {
      id: 'modules',
      name: 'Modules & Features',
      description: 'Enable/disable application modules and features',
      icon: 'Squares',
      order: 2,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'enabled-hubs',
          name: 'Enabled Hubs',
          description: 'Control which hubs are available to users',
          settings: [
            {
              id: 'enable-fleet-hub',
              key: 'modules.fleetHub.enabled',
              label: 'Fleet Hub',
              description: 'Vehicle management and tracking',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high'
            },
            {
              id: 'enable-operations-hub',
              key: 'modules.operationsHub.enabled',
              label: 'Operations Hub',
              description: 'Dispatch, routing, and task management',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high'
            },
            {
              id: 'enable-maintenance-hub',
              key: 'modules.maintenanceHub.enabled',
              label: 'Maintenance Hub',
              description: 'Work orders and preventive maintenance',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high'
            },
            {
              id: 'enable-safety-compliance',
              key: 'modules.safetyComplianceHub.enabled',
              label: 'Safety & Compliance Hub',
              description: 'Safety incidents and regulatory compliance',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high'
            },
            {
              id: 'enable-policy-hub',
              key: 'modules.policyHub.enabled',
              label: 'Policy Hub',
              description: 'AI-powered policy management',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high'
            },
            {
              id: 'enable-analytics-hub',
              key: 'modules.analyticsHub.enabled',
              label: 'Analytics Hub',
              description: 'Reports and data analysis',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            },
            {
              id: 'enable-procurement-hub',
              key: 'modules.procurementHub.enabled',
              label: 'Procurement Hub',
              description: 'Purchasing and vendor management',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            },
            {
              id: 'enable-financial-hub',
              key: 'modules.financialHub.enabled',
              label: 'Financial Hub',
              description: 'Budget tracking and cost analysis',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            }
          ]
        },
        {
          id: 'feature-flags',
          name: 'Feature Flags',
          description: 'Enable/disable specific features',
          settings: [
            {
              id: 'enable-ai-assistant',
              key: 'features.aiAssistant.enabled',
              label: 'AI Assistant',
              description: 'AI-powered chat and recommendations',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            },
            {
              id: 'enable-video-telematics',
              key: 'features.videoTelematics.enabled',
              label: 'Video Telematics',
              description: 'Dashcam integration and safety events',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            },
            {
              id: 'enable-ev-charging',
              key: 'features.evCharging.enabled',
              label: 'EV Charging Management',
              description: 'Electric vehicle charging tracking',
              type: 'boolean',
              value: true,
              defaultValue: false,
              impact: 'low'
            },
            {
              id: 'enable-predictive-maintenance',
              key: 'features.predictiveMaintenance.enabled',
              label: 'Predictive Maintenance',
              description: 'AI-powered maintenance predictions',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 3. BUSINESS RULES & THRESHOLDS
    // ========================================================================
    {
      id: 'business-rules',
      name: 'Business Rules & Thresholds',
      description: 'Configure operational thresholds and business logic',
      icon: 'Sliders',
      order: 3,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'maintenance-rules',
          name: 'Maintenance Rules',
          description: 'PM intervals and maintenance thresholds',
          policyDriven: true,
          settings: [
            {
              id: 'pm-interval-light-duty',
              key: 'businessRules.maintenance.pmIntervalLightDuty',
              label: 'PM Interval - Light Duty (miles)',
              description: 'Preventive maintenance interval for light-duty vehicles',
              type: 'number',
              value: 5000,
              defaultValue: 5000,
              validation: { min: 1000, max: 15000 },
              impact: 'high',
              policySource: 'preventive-maintenance-policy'
            },
            {
              id: 'pm-interval-heavy-duty',
              key: 'businessRules.maintenance.pmIntervalHeavyDuty',
              label: 'PM Interval - Heavy Duty (miles)',
              description: 'Preventive maintenance interval for heavy-duty vehicles',
              type: 'number',
              value: 15000,
              defaultValue: 15000,
              validation: { min: 5000, max: 30000 },
              impact: 'high',
              policySource: 'preventive-maintenance-policy'
            },
            {
              id: 'overdue-threshold',
              key: 'businessRules.maintenance.overdueThresholdDays',
              label: 'Overdue Threshold (days)',
              description: 'Days overdue before blocking dispatch',
              type: 'number',
              value: 30,
              defaultValue: 30,
              validation: { min: 0, max: 90 },
              impact: 'high',
              policySource: 'preventive-maintenance-policy'
            }
          ]
        },
        {
          id: 'approval-thresholds',
          name: 'Approval Thresholds',
          description: 'Dollar amounts requiring approval',
          policyDriven: true,
          settings: [
            {
              id: 'maintenance-approval-threshold',
              key: 'businessRules.approvals.maintenanceThreshold',
              label: 'Maintenance Approval Threshold',
              description: 'Repair cost requiring manager approval',
              type: 'number',
              value: 5000,
              defaultValue: 5000,
              validation: { min: 0 },
              impact: 'high',
              policySource: 'maintenance-authorization-policy'
            },
            {
              id: 'procurement-approval-threshold',
              key: 'businessRules.approvals.procurementThreshold',
              label: 'Procurement Approval Threshold',
              description: 'Purchase amount requiring approval',
              type: 'number',
              value: 10000,
              defaultValue: 10000,
              validation: { min: 0 },
              impact: 'high',
              policySource: 'procurement-policy'
            }
          ]
        },
        {
          id: 'fuel-rules',
          name: 'Fuel Management Rules',
          description: 'Fuel transaction limits and fraud detection',
          policyDriven: true,
          settings: [
            {
              id: 'fuel-anomaly-threshold',
              key: 'businessRules.fuel.anomalyThresholdPercent',
              label: 'Fuel Anomaly Threshold (%)',
              description: 'Percentage over tank capacity to flag as anomaly',
              type: 'number',
              value: 110,
              defaultValue: 110,
              validation: { min: 100, max: 200 },
              impact: 'medium',
              policySource: 'fuel-fraud-prevention-policy'
            },
            {
              id: 'consecutive-fuel-hours',
              key: 'businessRules.fuel.consecutiveTransactionHours',
              label: 'Consecutive Transaction Window (hours)',
              description: 'Time window for detecting duplicate transactions',
              type: 'number',
              value: 1,
              defaultValue: 1,
              validation: { min: 0.5, max: 24 },
              impact: 'medium',
              policySource: 'fuel-fraud-prevention-policy'
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 4. INTEGRATIONS & APIs
    // ========================================================================
    {
      id: 'integrations',
      name: 'Integrations & APIs',
      description: 'Configure external system integrations',
      icon: 'Plug',
      order: 4,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'api-keys',
          name: 'API Keys & Credentials',
          description: 'External service authentication',
          settings: [
            {
              id: 'google-maps-api-key',
              key: 'integrations.googleMaps.apiKey',
              label: 'Google Maps API Key',
              description: 'API key for Google Maps integration',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'high'
            },
            {
              id: 'openai-api-key',
              key: 'integrations.openai.apiKey',
              label: 'OpenAI API Key',
              description: 'API key for AI-powered features',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'medium'
            },
            {
              id: 'anthropic-api-key',
              key: 'integrations.anthropic.apiKey',
              label: 'Anthropic API Key',
              description: 'API key for Claude AI integration',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'medium'
            }
          ]
        },
        {
          id: 'webhooks',
          name: 'Webhooks',
          description: 'Outbound webhook configurations',
          settings: [
            {
              id: 'incident-webhook',
              key: 'integrations.webhooks.incidentUrl',
              label: 'Incident Webhook URL',
              description: 'POST incidents to external system',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'low'
            },
            {
              id: 'maintenance-webhook',
              key: 'integrations.webhooks.maintenanceUrl',
              label: 'Maintenance Webhook URL',
              description: 'POST work orders to external system',
              type: 'string',
              value: '',
              defaultValue: '',
              impact: 'low'
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 5. NOTIFICATIONS & ALERTS
    // ========================================================================
    {
      id: 'notifications',
      name: 'Notifications & Alerts',
      description: 'Configure notification channels and alert rules',
      icon: 'Bell',
      order: 5,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'notification-channels',
          name: 'Notification Channels',
          description: 'Enable/disable notification methods',
          settings: [
            {
              id: 'enable-email',
              key: 'notifications.channels.email.enabled',
              label: 'Email Notifications',
              description: 'Send notifications via email',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium'
            },
            {
              id: 'enable-sms',
              key: 'notifications.channels.sms.enabled',
              label: 'SMS Notifications',
              description: 'Send notifications via SMS',
              type: 'boolean',
              value: false,
              defaultValue: false,
              impact: 'medium'
            },
            {
              id: 'enable-push',
              key: 'notifications.channels.push.enabled',
              label: 'Push Notifications',
              description: 'Browser/mobile push notifications',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'low'
            }
          ]
        },
        {
          id: 'alert-rules',
          name: 'Alert Rules',
          description: 'Configure when to send alerts',
          policyDriven: true,
          settings: [
            {
              id: 'critical-incident-alert',
              key: 'notifications.alerts.criticalIncident.enabled',
              label: 'Critical Incident Alerts',
              description: 'Immediate alert for critical incidents',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'high',
              policySource: 'accident-response-policy'
            },
            {
              id: 'pm-overdue-alert',
              key: 'notifications.alerts.pmOverdue.enabled',
              label: 'PM Overdue Alerts',
              description: 'Alert when vehicle PM is overdue',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'medium',
              policySource: 'preventive-maintenance-policy'
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 6. SECURITY & ACCESS CONTROL
    // ========================================================================
    {
      id: 'security',
      name: 'Security & Access Control',
      description: 'Security settings and access policies',
      icon: 'Shield',
      order: 6,
      requiredRole: 'SuperAdmin',
      sections: [
        {
          id: 'authentication',
          name: 'Authentication Settings',
          description: 'Login and authentication requirements',
          settings: [
            {
              id: 'require-mfa',
              key: 'security.authentication.requireMFA',
              label: 'Require Multi-Factor Authentication',
              description: 'Enforce MFA for all users',
              type: 'boolean',
              value: false,
              defaultValue: false,
              impact: 'high',
              requiresApproval: true
            },
            {
              id: 'session-timeout',
              key: 'security.authentication.sessionTimeoutMinutes',
              label: 'Session Timeout (minutes)',
              description: 'Auto-logout after inactivity',
              type: 'number',
              value: 60,
              defaultValue: 60,
              validation: { min: 15, max: 480 },
              impact: 'medium'
            },
            {
              id: 'password-expiry',
              key: 'security.authentication.passwordExpiryDays',
              label: 'Password Expiry (days)',
              description: 'Force password change interval (0 = never)',
              type: 'number',
              value: 90,
              defaultValue: 90,
              validation: { min: 0, max: 365 },
              impact: 'medium'
            }
          ]
        },
        {
          id: 'audit-logging',
          name: 'Audit Logging',
          description: 'Activity logging and retention',
          settings: [
            {
              id: 'audit-retention-days',
              key: 'security.audit.retentionDays',
              label: 'Audit Log Retention (days)',
              description: 'How long to keep audit logs',
              type: 'number',
              value: 2555, // 7 years
              defaultValue: 2555,
              validation: { min: 365, max: 3650 },
              impact: 'medium'
            },
            {
              id: 'log-policy-enforcement',
              key: 'security.audit.logPolicyEnforcement',
              label: 'Log Policy Enforcement',
              description: 'Log all policy enforcement decisions',
              type: 'boolean',
              value: true,
              defaultValue: true,
              impact: 'low'
            }
          ]
        }
      ]
    },

    // ========================================================================
    // 7. USER EXPERIENCE & DEFAULTS
    // ========================================================================
    {
      id: 'user-experience',
      name: 'User Experience & Defaults',
      description: 'Default views, layouts, and user preferences',
      icon: 'User',
      order: 7,
      requiredRole: 'CTAOwner',
      sections: [
        {
          id: 'default-landing',
          name: 'Default Landing Page',
          description: 'Where users land after login',
          settings: [
            {
              id: 'default-hub',
              key: 'ux.defaultLandingPage',
              label: 'Default Landing Hub',
              description: 'Initial page after login',
              type: 'select',
              value: 'fleet-hub',
              defaultValue: 'fleet-hub',
              options: [
                { value: 'fleet-hub', label: 'Fleet Hub' },
                { value: 'operations-hub', label: 'Operations Hub' },
                { value: 'maintenance-hub', label: 'Maintenance Hub' },
                { value: 'safety-compliance-hub', label: 'Safety & Compliance Hub' },
                { value: 'analytics-hub', label: 'Analytics Hub' }
              ],
              impact: 'low'
            }
          ]
        },
        {
          id: 'dashboard-defaults',
          name: 'Dashboard Defaults',
          description: 'Default dashboard configurations',
          settings: [
            {
              id: 'default-date-range',
              key: 'ux.dashboards.defaultDateRange',
              label: 'Default Date Range',
              description: 'Default time period for dashboards',
              type: 'select',
              value: '30d',
              defaultValue: '30d',
              options: [
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: 'ytd', label: 'Year to Date' },
                { value: '1y', label: 'Last 12 Months' }
              ],
              impact: 'low'
            }
          ]
        }
      ]
    }
  ]
}

// ============================================================================
// Configuration Engine
// ============================================================================

export class ConfigurationEngine {
  private config: Map<string, any> = new Map()
  private schema: ConfigurationSchema = CONFIGURATION_SCHEMA

  /**
   * Initialize configuration from stored values
   */
  async initialize(): Promise<void> {
    // Load configuration from database or localStorage
    const stored = await this.loadStoredConfiguration()

    // Apply defaults for any missing values
    this.applyDefaults()

    // Merge stored values
    if (stored) {
      Object.entries(stored).forEach(([key, value]) => {
        this.config.set(key, value)
      })
    }
  }

  /**
   * Get configuration value by key
   */
  get<T = any>(key: string, defaultValue?: T): T {
    return this.config.get(key) ?? defaultValue
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: any, modifiedBy: string): Promise<void> {
    const setting = this.findSetting(key)

    if (!setting) {
      throw new Error(`Unknown configuration key: ${key}`)
    }

    // Validate value
    if (setting.validation) {
      const validationResult = this.validate(value, setting.validation)
      if (validationResult !== true) {
        throw new Error(validationResult as string)
      }
    }

    // Check if approval required
    if (setting.requiresApproval) {
      await this.createApprovalRequest(key, value, modifiedBy)
      return
    }

    // Set value
    this.config.set(key, value)

    // Persist to database
    await this.saveConfiguration(key, value, modifiedBy)

    // Trigger any side effects
    await this.handleSideEffects(key, value)
  }

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    this.config.forEach((value, key) => {
      this.setNestedValue(result, key, value)
    })
    return result
  }

  /**
   * Apply configuration from policy
   */
  async applyPolicyConfiguration(policy: Policy): Promise<void> {
    // Extract configuration values from policy
    const policyConfig = this.extractConfigFromPolicy(policy)

    // Apply each configuration value
    for (const [key, value] of Object.entries(policyConfig)) {
      await this.set(key, value, `policy:${policy.id}`)
    }
  }

  /**
   * Get configuration schema
   */
  getSchema(): ConfigurationSchema {
    return this.schema
  }

  /**
   * Generate configuration from policy setup
   */
  async generateFromPolicySetup(policies: Policy[]): Promise<Record<string, any>> {
    const generated: Record<string, any> = {}

    for (const policy of policies) {
      const policyConfig = this.extractConfigFromPolicy(policy)
      Object.assign(generated, policyConfig)
    }

    return generated
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private applyDefaults(): void {
    this.schema.categories.forEach(category => {
      category.sections.forEach(section => {
        section.settings.forEach(setting => {
          if (!this.config.has(setting.key)) {
            this.config.set(setting.key, setting.defaultValue)
          }
        })
      })
    })
  }

  private findSetting(key: string): ConfigSetting | null {
    for (const category of this.schema.categories) {
      for (const section of category.sections) {
        const setting = section.settings.find(s => s.key === key)
        if (setting) return setting
      }
    }
    return null
  }

  private validate(value: any, validation: ConfigValidation): boolean | string {
    if (validation.required && (value === null || value === undefined || value === '')) {
      return 'This field is required'
    }

    if (validation.min !== undefined && value < validation.min) {
      return `Value must be at least ${validation.min}`
    }

    if (validation.max !== undefined && value > validation.max) {
      return `Value must be at most ${validation.max}`
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        return 'Value does not match required pattern'
      }
    }

    if (validation.custom) {
      const result = validation.custom(value)
      if (result !== true) {
        return result as string
      }
    }

    return true
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {}
      }
      current = current[parts[i]]
    }

    current[parts[parts.length - 1]] = value
  }

  private extractConfigFromPolicy(policy: Policy): Record<string, any> {
    // Extract configuration values from policy based on policy type
    const config: Record<string, any> = {}

    // Map policy types to configuration keys
    switch (policy.type) {
      case 'preventive-maintenance':
        // Extract PM intervals, thresholds, etc.
        break
      case 'fuel-fraud-prevention':
        // Extract fraud detection thresholds
        break
      case 'driver-qualification':
        // Extract driver requirements
        break
      // ... more policy types
    }

    return config
  }

  private async loadStoredConfiguration(): Promise<Record<string, any> | null> {
    // Load from localStorage (persisted via saveConfiguration)
    // Falls back to null if data is corrupted or unavailable
    try {
      const stored = localStorage.getItem('fleet-configuration')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      if (typeof parsed !== 'object' || parsed === null) {
        logger.warn('[ConfigEngine] Stored configuration is not a valid object, ignoring')
        return null
      }
      return parsed
    } catch (error) {
      logger.error('[ConfigEngine] Failed to parse stored configuration, clearing corrupted data:', error)
      localStorage.removeItem('fleet-configuration')
      return null
    }
  }

  private async saveConfiguration(key: string, value: any, modifiedBy: string): Promise<void> {
    // Persist to localStorage and log the change
    // In production, this should also sync to the backend API database
    try {
      const all = this.getAll()
      localStorage.setItem('fleet-configuration', JSON.stringify(all))
    } catch (error) {
      logger.error(`[ConfigEngine] Failed to save configuration for key: ${key}`, error)
      throw error
    }

    logger.info(`Configuration updated: ${key} by ${modifiedBy}`)
  }

  private async createApprovalRequest(key: string, value: any, requestedBy: string): Promise<void> {
    // Log the approval request - approval workflow is handled by the backend
    logger.info(`Approval required for configuration change: ${key} by ${requestedBy}`)
  }

  private async handleSideEffects(key: string, value: any): Promise<void> {
    // Handle any side effects of configuration changes
    // e.g., if theme changes, update CSS variables
    if (key.startsWith('branding.')) {
      this.updateBrandingCSS()
    }
  }

  private updateBrandingCSS(): void {
    // Update CSS variables for branding
    const primaryColor = this.get('branding.primaryColor')
    const secondaryColor = this.get('branding.secondaryColor')

    if (primaryColor) {
      document.documentElement.style.setProperty('--color-primary', primaryColor)
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--color-secondary', secondaryColor)
    }
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const configurationEngine = new ConfigurationEngine()
