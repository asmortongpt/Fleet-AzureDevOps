/**
 * Tenant Branding System
 *
 * Allows each tenant to customize colors, logos, and visual identity
 */

export interface TenantBranding {
  tenantId: string;
  tenantName: string;

  // Logo & Identity
  logoUrl?: string;
  logoUrlLight?: string; // For dark backgrounds
  faviconUrl?: string;

  // Primary Brand Colors
  primaryColor: string;      // Main brand color
  primaryDark: string;        // Darker variant for hover states
  primaryLight: string;       // Lighter variant for backgrounds

  // Status Colors (optional - defaults to system colors)
  statusGood?: string;
  statusWarn?: string;
  statusBad?: string;

  // UI Customization (optional - defaults to system theme)
  accentColor?: string;
  panelBackground?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;

  // Typography (optional)
  fontFamily?: string;

  // Custom CSS Variables (advanced)
  customCSSVars?: Record<string, string>;
}

export const DEFAULT_BRANDING: TenantBranding = {
  tenantId: 'default',
  tenantName: 'Fleet Management System',
  primaryColor: '#005EA2',       // USWDS Blue-60
  primaryDark: '#1C3F94',        // USWDS Blue-80
  primaryLight: '#2378C3',       // USWDS Blue-50
};

// Example tenant configurations
export const TENANT_PRESETS: Record<string, TenantBranding> = {
  'cta': {
    tenantId: 'cta',
    tenantName: 'Capital Transit Alliance',
    logoUrl: '/branding/cta-logo.svg',
    primaryColor: '#005EA2',
    primaryDark: '#1C3F94',
    primaryLight: '#2378C3',
    accentColor: '#60a5fa',
  },
  'government': {
    tenantId: 'government',
    tenantName: 'Federal Fleet Management',
    logoUrl: '/branding/gov-seal.svg',
    primaryColor: '#112e51',       // Government blue
    primaryDark: '#0d2136',
    primaryLight: '#205493',
    statusGood: '#4aa564',         // Government green
    statusWarn: '#fdb81e',         // Government yellow
    statusBad: '#d54309',          // Government red
  },
  'enterprise': {
    tenantId: 'enterprise',
    tenantName: 'Enterprise Fleet Services',
    logoUrl: '/branding/enterprise-logo.svg',
    primaryColor: '#2563eb',       // Modern blue
    primaryDark: '#1e40af',
    primaryLight: '#3b82f6',
    accentColor: '#06b6d4',        // Cyan accent
  },
};
