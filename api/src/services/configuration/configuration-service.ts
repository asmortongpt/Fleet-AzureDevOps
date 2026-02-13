/**
 * CONFIGURATION SERVICE
 *
 * Centralized configuration management for CTA owners
 * Integrates with Policy Hub for rule-driven configuration
 * Provides complete system configurability
 */

import logger from '../../config/logger'
import type {
  ConfigItem,
  ConfigProfile,
  ConfigChange,
  SystemConfiguration,
  PolicyRule,
  PolicyCondition,
  InitialSetup,
  SetupStep
} from './types'

export class ConfigurationService {
  private config: Map<string, ConfigItem> = new Map()
  private profiles: Map<string, ConfigProfile> = new Map()
  private changeHistory: ConfigChange[] = []
  private setupState: InitialSetup | null = null

  // =========================================================================
  // INITIALIZATION & SETUP
  // =========================================================================

  /**
   * Load all configuration items from database
   */
  async initialize(): Promise<void> {
    // TODO: Load from database
    // For now, load default configuration items
    const defaultConfig = this.getDefaultConfigItems()
    defaultConfig.forEach(item => {
      this.config.set(item.key, item)
    })

    logger.info('Configuration Service initialized', { itemCount: this.config.size })
  }

  /**
   * Initialize setup wizard for new CTA owner
   */
  async startInitialSetup(organizationId: string): Promise<InitialSetup> {
    const setupSteps: SetupStep[] = [
      {
        id: 'step-1-organization',
        title: 'Organization Details',
        description: 'Configure basic organization information',
        order: 1,
        required: true,
        configItems: [
          'system.organizationName',
          'system.timezone',
          'system.dateFormat',
          'system.currency'
        ],
        completed: false
      },
      {
        id: 'step-2-branding',
        title: 'Branding & Appearance',
        description: 'Customize your application appearance',
        order: 2,
        required: false,
        configItems: [
          'branding.logo.url',
          'branding.primaryColor',
          'branding.secondaryColor',
          'branding.companyName'
        ],
        completed: false
      },
      {
        id: 'step-3-security',
        title: 'Security Settings',
        description: 'Configure authentication and security',
        order: 3,
        required: true,
        configItems: [
          'security.authentication.method',
          'security.authentication.mfaRequired',
          'security.authentication.sessionTimeout'
        ],
        completed: false
      },
      {
        id: 'step-4-features',
        title: 'Feature Modules',
        description: 'Enable features for your organization',
        order: 4,
        required: true,
        configItems: [
          'features.modules.fleet',
          'features.modules.maintenance',
          'features.modules.analytics',
          'features.modules.dispatch'
        ],
        completed: false
      },
      {
        id: 'step-5-integrations',
        title: 'External Integrations',
        description: 'Connect external services',
        order: 5,
        required: false,
        configItems: [
          'integrations.googleMaps.enabled',
          'integrations.microsoft365.enabled',
          'integrations.telematics.enabled'
        ],
        completed: false
      }
    ]

    this.setupState = {
      organizationId,
      steps: setupSteps,
      currentStep: 0,
      completed: false,
      startedAt: new Date().toISOString()
    }

    return this.setupState
  }

  /**
   * Complete a setup step
   */
  async completeSetupStep(stepId: string, values: Record<string, any>): Promise<void> {
    if (!this.setupState) {
      throw new Error('Setup not initialized')
    }

    const step = this.setupState.steps.find(s => s.id === stepId)
    if (!step) {
      throw new Error(`Step ${stepId} not found`)
    }

    // Update configuration values
    for (const [key, value] of Object.entries(values)) {
      await this.updateConfig(key, value, 'SYSTEM', 'initial_setup')
    }

    // Mark step as completed
    step.completed = true
    this.setupState.currentStep = Math.min(
      this.setupState.currentStep + 1,
      this.setupState.steps.length - 1
    )

    // Check if all steps completed
    if (this.setupState.steps.every(s => s.completed)) {
      this.setupState.completed = true
      this.setupState.completedAt = new Date().toISOString()
    }
  }

  // =========================================================================
  // CONFIGURATION CRUD
  // =========================================================================

  /**
   * Get configuration item by key
   */
  getConfig(key: string): ConfigItem | undefined {
    return this.config.get(key)
  }

  /**
   * Get all configuration items (optionally filtered)
   */
  getAllConfig(filter?: {
    category?: string
    requiresCTAOwner?: boolean
    visibleToRole?: string
  }): ConfigItem[] {
    let items = Array.from(this.config.values())

    if (filter) {
      if (filter.category) {
        items = items.filter(item => item.category === filter.category)
      }
      if (filter.requiresCTAOwner !== undefined) {
        items = items.filter(item => item.requiresCTAOwner === filter.requiresCTAOwner)
      }
      if (filter.visibleToRole) {
        items = items.filter(item =>
          !item.visibleToRoles || item.visibleToRoles.includes(filter.visibleToRole)
        )
      }
    }

    return items
  }

  /**
   * Update configuration value
   */
  async updateConfig(
    key: string,
    value: any,
    changedBy: string,
    source: 'manual' | 'policy_engine' | 'initial_setup' | 'api' = 'manual',
    reason?: string
  ): Promise<ConfigChange> {
    const item = this.config.get(key)
    if (!item) {
      throw new Error(`Configuration key "${key}" not found`)
    }

    // Validate new value
    if (item.validation) {
      this.validateConfigValue(item, value)
    }

    // Check policy conditions
    if (item.appliesWhen && item.appliesWhen.length > 0) {
      const applies = this.evaluatePolicyConditions(item.appliesWhen)
      if (!applies) {
        throw new Error(`Configuration "${key}" does not apply in current context`)
      }
    }

    // Create change record
    const change: ConfigChange = {
      id: this.generateId(),
      configKey: key,
      oldValue: item.value,
      newValue: value,
      changedBy,
      changedAt: new Date().toISOString(),
      reason,
      rollbackable: true,
      source
    }

    // Update value
    const oldValue = item.value
    item.value = value
    item.lastModified = new Date().toISOString()
    item.modifiedBy = changedBy
    item.version = (item.version || 0) + 1

    // Record change
    this.changeHistory.push(change)

    // Trigger affected configurations if any
    if (item.affects && item.affects.length > 0) {
      await this.handleAffectedConfigs(item.affects, value)
    }

    logger.info('Configuration updated', { key, oldValue, newValue: value, changedBy })

    return change
  }

  /**
   * Rollback configuration change
   */
  async rollbackConfig(changeId: string, rolledBackBy: string): Promise<void> {
    const change = this.changeHistory.find(c => c.id === changeId)
    if (!change) {
      throw new Error(`Change ${changeId} not found`)
    }

    if (!change.rollbackable) {
      throw new Error(`Change ${changeId} is not rollbackable`)
    }

    await this.updateConfig(
      change.configKey,
      change.oldValue,
      rolledBackBy,
      'manual',
      `Rollback of change ${changeId}`
    )
  }

  // =========================================================================
  // CONFIGURATION PROFILES
  // =========================================================================

  /**
   * Create configuration profile (preset)
   */
  async createProfile(
    name: string,
    description: string,
    settings: Record<string, any>,
    createdBy: string
  ): Promise<ConfigProfile> {
    const profile: ConfigProfile = {
      id: this.generateId(),
      name,
      description,
      isDefault: false,
      settings,
      policyRules: [],
      createdAt: new Date().toISOString(),
      createdBy,
      lastModified: new Date().toISOString(),
      modifiedBy: createdBy,
      version: 1
    }

    this.profiles.set(profile.id, profile)
    return profile
  }

  /**
   * Apply configuration profile
   */
  async applyProfile(profileId: string, appliedBy: string): Promise<void> {
    const profile = this.profiles.get(profileId)
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`)
    }

    // Apply all settings in the profile
    for (const [key, value] of Object.entries(profile.settings)) {
      await this.updateConfig(key, value, appliedBy, 'manual', `Applied profile: ${profile.name}`)
    }

    logger.info('Profile applied', { profileName: profile.name, appliedBy })
  }

  // =========================================================================
  // POLICY ENGINE INTEGRATION
  // =========================================================================

  /**
   * Apply policy rule to configuration
   * Called by Policy Hub when rules are created/updated
   */
  async applyPolicyRule(rule: PolicyRule): Promise<void> {
    // Evaluate rule conditions
    const applies = this.evaluatePolicyConditions(rule.conditions, rule.conditionLogic)

    if (!applies) {
      logger.info('Policy rule does not apply in current context', { ruleName: rule.name })
      return
    }

    // Execute rule actions
    for (const action of rule.actions) {
      if (action.type === 'set_config' && action.config) {
        await this.updateConfig(
          action.config.key,
          action.config.value,
          'POLICY_ENGINE',
          'policy_engine',
          `Policy: ${rule.name}`
        )
      }
    }

    logger.info('Policy rule applied', { ruleName: rule.name })
  }

  /**
   * Evaluate policy conditions
   */
  private evaluatePolicyConditions(
    conditions: PolicyCondition[],
    logic: 'AND' | 'OR' = 'AND'
  ): boolean {
    if (conditions.length === 0) return true

    const results = conditions.map(condition => {
      // Get current value for the field
      const currentValue = this.getFieldValue(condition.field)

      // Evaluate condition based on operator
      switch (condition.operator) {
        case 'equals':
          return currentValue === condition.value
        case 'not_equals':
          return currentValue !== condition.value
        case 'contains':
          return Array.isArray(currentValue)
            ? currentValue.includes(condition.value)
            : String(currentValue).includes(String(condition.value))
        case 'greater_than':
          return currentValue > condition.value
        case 'less_than':
          return currentValue < condition.value
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(currentValue)
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(currentValue)
        default:
          return false
      }
    })

    return logic === 'AND'
      ? results.every(r => r)
      : results.some(r => r)
  }

  /**
   * Get field value from configuration or system state
   */
  private getFieldValue(field: string): any {
    // Check if it's a configuration key
    const configItem = this.config.get(field)
    if (configItem) {
      return configItem.value
    }

    // Check nested path (e.g., 'system.environment')
    const parts = field.split('.')
    let value: any = this.config

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part]
      } else {
        break
      }
    }

    return value
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  /**
   * Validate configuration value against rules
   */
  private validateConfigValue(item: ConfigItem, value: any): void {
    const validation = item.validation
    if (!validation) return

    // Required check
    if (validation.required && (value === null || value === undefined || value === '')) {
      throw new Error(`Configuration "${item.label}" is required`)
    }

    // Type-specific validation
    switch (item.type) {
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Configuration "${item.label}" must be a number`)
        }
        if (validation.min !== undefined && value < validation.min) {
          throw new Error(`Configuration "${item.label}" must be at least ${validation.min}`)
        }
        if (validation.max !== undefined && value > validation.max) {
          throw new Error(`Configuration "${item.label}" must be at most ${validation.max}`)
        }
        break

      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Configuration "${item.label}" must be a string`)
        }
        if (validation.min !== undefined && value.length < validation.min) {
          throw new Error(`Configuration "${item.label}" must be at least ${validation.min} characters`)
        }
        if (validation.max !== undefined && value.length > validation.max) {
          throw new Error(`Configuration "${item.label}" must be at most ${validation.max} characters`)
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern)
          if (!regex.test(value)) {
            throw new Error(`Configuration "${item.label}" format is invalid`)
          }
        }
        break

      case 'enum':
        if (validation.options) {
          const validValues = validation.options.map(opt => opt.value)
          if (!validValues.includes(value)) {
            throw new Error(`Configuration "${item.label}" must be one of: ${validValues.join(', ')}`)
          }
        }
        break

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          throw new Error(`Configuration "${item.label}" must be a valid email`)
        }
        break

      case 'url':
        try {
          new URL(value)
        } catch {
          throw new Error(`Configuration "${item.label}" must be a valid URL`)
        }
        break
    }

    // Custom validator
    if (validation.customValidator) {
      // TODO: Implement custom validator lookup and execution
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Handle affected configurations when a config changes
   */
  private async handleAffectedConfigs(affectedKeys: string[], triggerValue: any): Promise<void> {
    for (const key of affectedKeys) {
      const item = this.config.get(key)
      if (item) {
        logger.info('Configuration affected by change', { key, currentValue: item.value })
        // TODO: Implement automatic recalculation or notification
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get default configuration items
   */
  private getDefaultConfigItems(): ConfigItem[] {
    return [
      // System Configuration
      {
        id: 'config-system-org-name',
        category: 'system',
        key: 'system.organizationName',
        label: 'Organization Name',
        description: 'The name of your organization',
        type: 'string',
        value: '',
        defaultValue: '',
        validation: { required: true, min: 2, max: 100 },
        requiresCTAOwner: true,
        order: 1
      },
      {
        id: 'config-system-timezone',
        category: 'system',
        key: 'system.timezone',
        label: 'Timezone',
        description: 'Default timezone for the application',
        type: 'enum',
        value: 'America/New_York',
        defaultValue: 'America/New_York',
        validation: {
          required: true,
          options: [
            { label: 'Eastern Time', value: 'America/New_York' },
            { label: 'Central Time', value: 'America/Chicago' },
            { label: 'Mountain Time', value: 'America/Denver' },
            { label: 'Pacific Time', value: 'America/Los_Angeles' }
          ]
        },
        requiresCTAOwner: false,
        order: 2
      },

      // Branding Configuration
      {
        id: 'config-branding-primary-color',
        category: 'branding',
        key: 'branding.primaryColor',
        label: 'Primary Color',
        description: 'Main brand color for the application',
        type: 'color',
        value: '#3b82f6',
        defaultValue: '#3b82f6',
        requiresCTAOwner: true,
        order: 1
      },

      // Security Configuration
      {
        id: 'config-security-auth-method',
        category: 'security',
        key: 'security.authentication.method',
        label: 'Authentication Method',
        description: 'Primary authentication method',
        type: 'enum',
        value: 'sso',
        defaultValue: 'sso',
        validation: {
          required: true,
          options: [
            { label: 'Single Sign-On (SSO)', value: 'sso', description: 'Use Azure AD SSO' },
            { label: 'Local Login', value: 'local', description: 'Username/password authentication' },
            { label: 'Hybrid', value: 'hybrid', description: 'Both SSO and local login' }
          ]
        },
        requiresCTAOwner: true,
        order: 1
      },
      {
        id: 'config-security-mfa-required',
        category: 'security',
        key: 'security.authentication.mfaRequired',
        label: 'Require MFA',
        description: 'Require multi-factor authentication for all users',
        type: 'boolean',
        value: true,
        defaultValue: true,
        requiresCTAOwner: true,
        order: 2
      },

      // Feature Configuration
      {
        id: 'config-features-fleet-enabled',
        category: 'features',
        key: 'features.modules.fleet',
        label: 'Fleet Management',
        description: 'Enable fleet management module',
        type: 'boolean',
        value: true,
        defaultValue: true,
        requiresCTAOwner: true,
        affects: ['features.modules.maintenance', 'features.modules.dispatch'],
        order: 1
      },
      {
        id: 'config-features-maintenance-enabled',
        category: 'features',
        key: 'features.modules.maintenance',
        label: 'Maintenance Management',
        description: 'Enable maintenance tracking module',
        type: 'boolean',
        value: true,
        defaultValue: true,
        requiresCTAOwner: true,
        dependsOn: ['features.modules.fleet'],
        order: 2
      }
    ]
  }

  /**
   * Get change history
   */
  getChangeHistory(filter?: {
    configKey?: string
    changedBy?: string
    source?: string
    limit?: number
  }): ConfigChange[] {
    let changes = [...this.changeHistory]

    if (filter) {
      if (filter.configKey) {
        changes = changes.filter(c => c.configKey === filter.configKey)
      }
      if (filter.changedBy) {
        changes = changes.filter(c => c.changedBy === filter.changedBy)
      }
      if (filter.source) {
        changes = changes.filter(c => c.source === filter.source)
      }
      if (filter.limit) {
        changes = changes.slice(0, filter.limit)
      }
    }

    return changes.sort((a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    )
  }

  /**
   * Export full system configuration
   */
  exportConfiguration(): SystemConfiguration {
    const config: any = {}

    this.config.forEach((item) => {
      const keys = item.key.split('.')
      let current = config

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = item.value
    })

    return config as SystemConfiguration
  }
}

// Export singleton instance
export const configurationService = new ConfigurationService()
