/**
 * Document Branding Configuration System
 * Allows organizations to customize policy/SOP document branding
 */

export interface BrandingConfig {
  organization: {
    name: string
    legalName?: string
    department?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    phone?: string
    email?: string
    website?: string
  }

  logo: {
    url?: string
    base64?: string
    width?: number
    height?: number
    position?: 'left' | 'center' | 'right'
  }

  colors: {
    primary: string
    secondary: string
    accent: string
    headerBackground: string
    headerText: string
    footerBackground: string
    footerText: string
    linkColor: string
  }

  typography: {
    fontFamily: string
    fontSize: {
      title: number
      heading1: number
      heading2: number
      heading3: number
      body: number
      footer: number
    }
    lineHeight: number
  }

  header: {
    showLogo: boolean
    showOrgName: boolean
    showDepartment: boolean
    customText?: string
    height?: number
  }

  footer: {
    showPageNumbers: boolean
    showDate: boolean
    showConfidentiality: boolean
    confidentialityText?: string
    customText?: string
    height?: number
  }

  watermark?: {
    enabled: boolean
    text: string
    opacity: number
    rotation: number
    fontSize: number
  }

  documentNumbers: {
    prefix: string
    includeYear: boolean
    includeVersion: boolean
  }

  approvalSignatures: {
    enabled: boolean
    positions: string[]
  }

  metadata: {
    includeRevisionHistory: boolean
    includeDistributionList: boolean
    includeEffectiveDate: boolean
    includeReviewCycle: boolean
  }
}

/**
 * Default branding configuration
 */
export const defaultBrandingConfig: BrandingConfig = {
  organization: {
    name: "Fleet Management Department",
    legalName: "City Fleet Services",
    department: "Public Works - Fleet Division",
    address: "123 Fleet Street",
    city: "Your City",
    state: "FL",
    zip: "32301",
    phone: "(850) 555-FLEET",
    email: "fleet@yourcity.gov",
    website: "www.yourcity.gov/fleet"
  },

  logo: {
    position: 'left',
    width: 150,
    height: 75
  },

  colors: {
    primary: '#1e40af', // Blue-700
    secondary: '#64748b', // Slate-500
    accent: '#0ea5e9', // Sky-500
    headerBackground: '#1e293b', // Slate-800
    headerText: '#ffffff',
    footerBackground: '#f1f5f9', // Slate-100
    footerText: '#475569', // Slate-600
    linkColor: '#0ea5e9'
  },

  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: {
      title: 24,
      heading1: 18,
      heading2: 16,
      heading3: 14,
      body: 11,
      footer: 9
    },
    lineHeight: 1.5
  },

  header: {
    showLogo: true,
    showOrgName: true,
    showDepartment: true,
    height: 1.25 // inches
  },

  footer: {
    showPageNumbers: true,
    showDate: true,
    showConfidentiality: true,
    confidentialityText: "INTERNAL USE ONLY - Not for Public Distribution",
    height: 0.75 // inches
  },

  watermark: {
    enabled: false,
    text: "DRAFT",
    opacity: 0.1,
    rotation: -45,
    fontSize: 72
  },

  documentNumbers: {
    prefix: "FLEET",
    includeYear: true,
    includeVersion: true
  },

  approvalSignatures: {
    enabled: true,
    positions: [
      "Fleet Manager",
      "Department Director",
      "Safety Officer"
    ]
  },

  metadata: {
    includeRevisionHistory: true,
    includeDistributionList: true,
    includeEffectiveDate: true,
    includeReviewCycle: true
  }
}

/**
 * Load branding configuration from storage
 */
export function loadBrandingConfig(): BrandingConfig {
  try {
    const stored = localStorage.getItem('fleet_branding_config')
    if (stored) {
      return { ...defaultBrandingConfig, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error loading branding config:', error)
  }
  return defaultBrandingConfig
}

/**
 * Save branding configuration to storage
 */
export function saveBrandingConfig(config: BrandingConfig): void {
  try {
    localStorage.setItem('fleet_branding_config', JSON.stringify(config))
  } catch (error) {
    console.error('Error saving branding config:', error)
  }
}

/**
 * Generate document number
 */
export function generateDocumentNumber(
  type: 'POLICY' | 'SOP' | 'TRAINING',
  sequence: number,
  version: string = '1.0',
  config: BrandingConfig = defaultBrandingConfig
): string {
  const parts: string[] = [config.documentNumbers.prefix, type]

  if (config.documentNumbers.includeYear) {
    parts.push(new Date().getFullYear().toString())
  }

  parts.push(sequence.toString().padStart(4, '0'))

  if (config.documentNumbers.includeVersion) {
    parts.push(`v${version}`)
  }

  return parts.join('-')
}

/**
 * Predefined branding templates for common scenarios
 */
export const brandingTemplates: Record<string, Partial<BrandingConfig>> = {
  municipal: {
    colors: {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#0ea5e9',
      headerBackground: '#1e293b',
      headerText: '#ffffff',
      footerBackground: '#f1f5f9',
      footerText: '#475569',
      linkColor: '#0ea5e9'
    },
    footer: {
      showPageNumbers: true,
      showDate: true,
      showConfidentiality: true,
      confidentialityText: "Official City Document - Internal Use Only"
    }
  },

  corporate: {
    colors: {
      primary: '#059669', // Emerald-600
      secondary: '#6b7280', // Gray-500
      accent: '#10b981', // Emerald-500
      headerBackground: '#065f46', // Emerald-800
      headerText: '#ffffff',
      footerBackground: '#ecfdf5', // Emerald-50
      footerText: '#047857', // Emerald-700
      linkColor: '#059669'
    },
    footer: {
      showPageNumbers: true,
      showDate: true,
      showConfidentiality: true,
      confidentialityText: "Confidential and Proprietary Information"
    }
  },

  educational: {
    colors: {
      primary: '#7c3aed', // Violet-600
      secondary: '#8b5cf6', // Violet-500
      accent: '#a78bfa', // Violet-400
      headerBackground: '#5b21b6', // Violet-800
      headerText: '#ffffff',
      footerBackground: '#f5f3ff', // Violet-50
      footerText: '#6d28d9', // Violet-700
      linkColor: '#7c3aed'
    },
    watermark: {
      enabled: true,
      text: "TRAINING MATERIAL",
      opacity: 0.08,
      rotation: -45,
      fontSize: 60
    }
  },

  safety: {
    colors: {
      primary: '#dc2626', // Red-600
      secondary: '#f59e0b', // Amber-500
      accent: '#ef4444', // Red-500
      headerBackground: '#991b1b', // Red-800
      headerText: '#ffffff',
      footerBackground: '#fef2f2', // Red-50
      footerText: '#b91c1c', // Red-700
      linkColor: '#dc2626'
    },
    footer: {
      showPageNumbers: true,
      showDate: true,
      showConfidentiality: true,
      confidentialityText: "SAFETY CRITICAL DOCUMENT - Mandatory Compliance Required"
    }
  }
}

/**
 * Apply branding template
 */
export function applyBrandingTemplate(
  templateName: keyof typeof brandingTemplates,
  baseConfig: BrandingConfig = defaultBrandingConfig
): BrandingConfig {
  const template = brandingTemplates[templateName]
  return { ...baseConfig, ...template }
}

export default {
  defaultBrandingConfig,
  loadBrandingConfig,
  saveBrandingConfig,
  generateDocumentNumber,
  brandingTemplates,
  applyBrandingTemplate
}
