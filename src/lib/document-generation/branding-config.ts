/**
 * Document Branding Configuration System
 * Allows organizations to customize policy/SOP document branding
 */

import logger from '@/utils/logger';

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
    primary: 'hsl(var(--primary))', // Emerald-700
    secondary: 'hsl(var(--muted-foreground))', // Slate-500
    accent: 'hsl(var(--primary))', // Sky-500
    headerBackground: 'hsl(var(--card))', // Slate-800
    headerText: 'hsl(var(--foreground))',
    footerBackground: 'hsl(var(--muted))', // Slate-100
    footerText: 'hsl(var(--muted-foreground))', // Slate-600
    linkColor: 'hsl(var(--primary))'
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
    logger.error('Error loading branding config:', error)
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
    logger.error('Error saving branding config:', error)
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
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--muted-foreground))',
      accent: 'hsl(var(--primary))',
      headerBackground: 'hsl(var(--card))',
      headerText: 'hsl(var(--foreground))',
      footerBackground: 'hsl(var(--muted))',
      footerText: 'hsl(var(--muted-foreground))',
      linkColor: 'hsl(var(--primary))'
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
      primary: 'hsl(var(--success))', // Emerald-600
      secondary: 'hsl(var(--muted-foreground))', // Gray-500
      accent: 'hsl(var(--success))', // Emerald-500
      headerBackground: 'hsl(var(--success))', // Emerald-800
      headerText: 'hsl(var(--foreground))',
      footerBackground: 'hsl(var(--success) / 0.1)', // Emerald-50
      footerText: 'hsl(var(--success))', // Emerald-700
      linkColor: 'hsl(var(--success))'
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
      primary: 'hsl(var(--accent))', // Accent-600
      secondary: 'hsl(var(--accent))', // Accent-500
      accent: 'hsl(var(--accent))', // Accent-400
      headerBackground: 'hsl(var(--accent))', // Accent-800
      headerText: 'hsl(var(--foreground))',
      footerBackground: 'hsl(var(--accent) / 0.1)', // Accent-50
      footerText: 'hsl(var(--accent))', // Accent-700
      linkColor: 'hsl(var(--accent))'
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
      primary: 'hsl(var(--destructive))', // Red-600
      secondary: 'hsl(var(--warning))', // Amber-500
      accent: 'hsl(var(--destructive))', // Red-500
      headerBackground: 'hsl(var(--destructive))', // Red-800
      headerText: 'hsl(var(--foreground))',
      footerBackground: 'hsl(var(--destructive) / 0.1)', // Red-50
      footerText: 'hsl(var(--destructive))', // Red-700
      linkColor: 'hsl(var(--destructive))'
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
