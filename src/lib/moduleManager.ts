/**
 * Module Manager - Customer-based feature enablement
 * Controls which modules are available based on customer subscription
 */

export interface ModuleDefinition {
  id: string
  name: string
  required: boolean
  description: string
  modules: string[]
  dependencies?: string[]
  price?: number
  minUsers?: number
  minVehicles?: number
  requiresEVs?: boolean
}

export interface CustomerConfig {
  customerId: string
  customerName: string
  subscriptionTier: "starter" | "professional" | "enterprise" | "enterprise-plus" | "custom"
  enabledModulePackages: string[]
  customModules?: string[]
  maxUsers: number
  maxVehicles: number
  features: {
    multiTenant: boolean
    apiAccess: boolean
    customBranding: boolean
    ssoEnabled: boolean
    advancedAnalytics: boolean
  }
}

export interface ModuleRoute {
  path: string
  modulePackage: string
  component: string
  requiresAuth: boolean
  requiredPermissions: string[]
}

export class ModuleManager {
  private moduleConfig: Record<string, ModuleDefinition>
  private customerConfig: CustomerConfig | null = null
  private enabledModules: Set<string> = new Set()

  constructor(moduleConfigPath?: string) {
    // Load module configuration from JSON or use default
    this.moduleConfig = this.getDefaultModuleConfig()
    this.loadModuleConfig(moduleConfigPath)
  }

  /**
   * Initialize with customer configuration
   */
  initialize(customerConfig: CustomerConfig): void {
    this.customerConfig = customerConfig
    this.enabledModules = this.calculateEnabledModules(customerConfig)
  }

  /**
   * Check if a module is enabled for the customer
   */
  isModuleEnabled(moduleId: string): boolean {
    return this.enabledModules.has(moduleId)
  }

  /**
   * Check if a module package is enabled
   */
  isModulePackageEnabled(packageId: string): boolean {
    if (!this.customerConfig) return false
    
    // Check if it's a required module (always enabled)
    const packageDef = this.moduleConfig[packageId]
    if (packageDef && packageDef.required) return true

    // Check if included in subscription or custom modules
    return (
      this.customerConfig.enabledModulePackages.includes(packageId) ||
      (this.customerConfig.customModules || []).includes(packageId)
    )
  }

  /**
   * Get all enabled modules
   */
  getEnabledModules(): string[] {
    return Array.from(this.enabledModules)
  }

  /**
   * Get all enabled module packages
   */
  getEnabledPackages(): string[] {
    if (!this.customerConfig) return []
    return this.customerConfig.enabledModulePackages
  }

  /**
   * Get navigation items filtered by enabled modules
   */
  getFilteredNavigation(allNavigationItems: any[]): any[] {
    return allNavigationItems.filter(item => 
      this.isModuleEnabled(item.id)
    )
  }

  /**
   * Get filtered routes based on enabled modules
   */
  getFilteredRoutes(allRoutes: ModuleRoute[]): ModuleRoute[] {
    return allRoutes.filter(route => 
      this.isModulePackageEnabled(route.modulePackage)
    )
  }

  /**
   * Validate customer limits
   */
  validateLimits(currentUsers: number, currentVehicles: number): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!this.customerConfig) {
      errors.push("Customer configuration not initialized")
      return { valid: false, errors }
    }

    if (currentUsers > this.customerConfig.maxUsers) {
      errors.push(`User limit exceeded: ${currentUsers}/${this.customerConfig.maxUsers}`)
    }

    if (currentVehicles > this.customerConfig.maxVehicles) {
      errors.push(`Vehicle limit exceeded: ${currentVehicles}/${this.customerConfig.maxVehicles}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if a feature is available
   */
  hasFeature(featureName: keyof CustomerConfig["features"]): boolean {
    if (!this.customerConfig) return false
    return this.customerConfig.features[featureName] || false
  }

  /**
   * Get module package details
   */
  getModulePackage(packageId: string): ModuleDefinition | null {
    return this.moduleConfig[packageId] || null
  }

  /**
   * Get all available module packages
   */
  getAllPackages(): ModuleDefinition[] {
    return Object.values(this.moduleConfig)
  }

  /**
   * Calculate total monthly cost for customer
   */
  calculateMonthlyCost(): number {
    if (!this.customerConfig) return 0

    let totalCost = 0

    // Add costs from enabled module packages
    for (const packageId of this.customerConfig.enabledModulePackages) {
      const packageDef = this.moduleConfig[packageId]
      if (packageDef && packageDef.price) {
        totalCost += packageDef.price
      }
    }

    return totalCost
  }

  /**
   * Check if customer can add a module package
   */
  canAddModule(packageId: string): {
    canAdd: boolean
    reason?: string
  } {
    if (!this.customerConfig) {
      return { canAdd: false, reason: "Customer configuration not initialized" }
    }

    const packageDef = this.moduleConfig[packageId]
    if (!packageDef) {
      return { canAdd: false, reason: "Module package not found" }
    }

    // Check dependencies
    if (packageDef.dependencies) {
      for (const dep of packageDef.dependencies) {
        if (!this.isModulePackageEnabled(dep)) {
          return { 
            canAdd: false, 
            reason: `Requires ${dep} module to be enabled first` 
          }
        }
      }
    }

    // Check minimum requirements
    if (packageDef.minUsers && this.customerConfig.maxUsers < packageDef.minUsers) {
      return { 
        canAdd: false, 
        reason: `Requires at least ${packageDef.minUsers} user licenses` 
      }
    }

    if (packageDef.minVehicles && this.customerConfig.maxVehicles < packageDef.minVehicles) {
      return { 
        canAdd: false, 
        reason: `Requires at least ${packageDef.minVehicles} vehicles` 
      }
    }

    return { canAdd: true }
  }

  /**
   * Get customer configuration
   */
  getCustomerConfig(): CustomerConfig | null {
    return this.customerConfig
  }

  /**
   * Private: Calculate enabled modules based on customer config
   */
  private calculateEnabledModules(config: CustomerConfig): Set<string> {
    const enabled = new Set<string>()

    // Add all modules from enabled packages
    for (const packageId of config.enabledModulePackages) {
      const packageDef = this.moduleConfig[packageId]
      if (packageDef) {
        for (const moduleId of packageDef.modules) {
          enabled.add(moduleId)
        }
      }
    }

    // Add custom modules
    if (config.customModules) {
      for (const moduleId of config.customModules) {
        enabled.add(moduleId)
      }
    }

    return enabled
  }

  /**
   * Private: Load module configuration
   */
  private loadModuleConfig(configPath?: string): void {
    // In production, load from configPath
    // For now, use default configuration
    if (configPath) {
      try {
        // Load from file or API
        console.log("Loading module config from:", configPath)
      } catch (error) {
        console.error("Failed to load module config:", error)
      }
    }
  }

  /**
   * Private: Get default module configuration
   */
  private getDefaultModuleConfig(): Record<string, ModuleDefinition> {
    return {
      "core": {
        id: "core",
        name: "Core Fleet Management",
        required: true,
        description: "Essential fleet operations",
        modules: ["dashboard", "gps-tracking", "people", "garage", "fuel", "workbench"]
      },
      "gis-mapping": {
        id: "gis-mapping",
        name: "GIS & Advanced Mapping",
        required: false,
        description: "Multi-layer GIS with weather and traffic",
        modules: ["gis-map", "map-layers", "geofences"],
        dependencies: ["core"],
        price: 2500,
        minUsers: 10
      },
      "advanced-routing": {
        id: "advanced-routing",
        name: "AI Route Optimization",
        required: false,
        description: "AI-powered route optimization",
        modules: ["route-optimization", "routes"],
        dependencies: ["core", "gis-mapping"],
        price: 3500,
        minUsers: 20
      },
      "telematics": {
        id: "telematics",
        name: "Vehicle Telemetry",
        required: false,
        description: "OBD-II and Smartcar integration",
        modules: ["vehicle-telemetry"],
        dependencies: ["core"],
        price: 5000,
        minVehicles: 50
      },
      "video-telematics": {
        id: "video-telematics",
        name: "Video Telematics & AI",
        required: false,
        description: "Dashcam AI event detection",
        modules: ["video-telematics"],
        dependencies: ["core"],
        price: 7500,
        minVehicles: 25
      },
      "ev-charging": {
        id: "ev-charging",
        name: "EV Charging Management",
        required: false,
        description: "Smart EV charging optimization",
        modules: ["ev-charging"],
        dependencies: ["core"],
        price: 4500,
        requiresEVs: true
      },
      "maintenance": {
        id: "maintenance",
        name: "Predictive Maintenance",
        required: false,
        description: "ML-based maintenance prediction",
        modules: ["predictive-maintenance", "maintenance-scheduling"],
        dependencies: ["core"],
        price: 3000,
        minVehicles: 100
      },
      "procurement": {
        id: "procurement",
        name: "Procurement & Inventory",
        required: false,
        description: "Complete procurement workflows",
        modules: ["vendor-management", "parts-inventory", "purchase-orders", "invoices"],
        dependencies: ["core"],
        price: 2000,
        minUsers: 5
      },
      "safety-compliance": {
        id: "safety-compliance",
        name: "OSHA & Safety",
        required: false,
        description: "OSHA forms and safety compliance",
        modules: ["osha-forms", "form-builder"],
        dependencies: ["core"],
        price: 3500,
        minUsers: 10
      },
      "policy-automation": {
        id: "policy-automation",
        name: "AI Policy Engine",
        required: false,
        description: "AI-driven compliance automation",
        modules: ["policy-engine"],
        dependencies: ["core"],
        price: 6000,
        minUsers: 50
      },
      "communications": {
        id: "communications",
        name: "Communications Suite",
        required: false,
        description: "AI assistant and integrations",
        modules: ["ai-assistant", "teams-integration", "email-center", "communication-log"],
        dependencies: ["core"],
        price: 2500,
        minUsers: 10
      },
      "financial": {
        id: "financial",
        name: "Financial & Receipts",
        required: false,
        description: "Receipt processing and reimbursement",
        modules: ["receipt-processing", "mileage"],
        dependencies: ["core"],
        price: 1500,
        minUsers: 5
      },
      "analytics": {
        id: "analytics",
        name: "Advanced Analytics",
        required: false,
        description: "Comprehensive fleet analytics",
        modules: ["comprehensive", "driver-mgmt"],
        dependencies: ["core"],
        price: 2000,
        minUsers: 10
      }
    }
  }
}

// Singleton instance
let moduleManagerInstance: ModuleManager | null = null

export function getModuleManager(): ModuleManager {
  if (!moduleManagerInstance) {
    moduleManagerInstance = new ModuleManager()
  }
  return moduleManagerInstance
}

export function initializeModuleManager(customerConfig: CustomerConfig): void {
  const manager = getModuleManager()
  manager.initialize(customerConfig)
}
