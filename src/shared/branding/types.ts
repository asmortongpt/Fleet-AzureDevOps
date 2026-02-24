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
  tenantName: 'ArchonY Fleet Command — Intelligent Performance',
  primaryColor: 'hsl(var(--primary))',
  primaryDark: 'hsl(var(--primary))',
  primaryLight: 'hsl(var(--primary))',
};

// Example tenant configurations
export const TENANT_PRESETS: Record<string, TenantBranding> = {
  'cta': {
    tenantId: 'cta',
    tenantName: 'ArchonY Fleet Command — Intelligent Performance',
    logoUrl: '/branding/cta-logo.svg',
    primaryColor: 'hsl(var(--primary))',
    primaryDark: 'hsl(var(--primary))',
    primaryLight: 'hsl(var(--primary))',
    accentColor: 'hsl(var(--accent))',
  },
  'government': {
    tenantId: 'government',
    tenantName: 'Federal Fleet Management',
    logoUrl: '/branding/gov-seal.svg',
    primaryColor: 'hsl(var(--primary))',
    primaryDark: 'hsl(var(--primary))',
    primaryLight: 'hsl(var(--primary))',
    statusGood: 'hsl(var(--chart-2))',
    statusWarn: 'hsl(var(--chart-3))',
    statusBad: 'hsl(var(--chart-6))',
  },
  'enterprise': {
    tenantId: 'enterprise',
    tenantName: 'Enterprise Fleet Services',
    logoUrl: '/branding/enterprise-logo.svg',
    primaryColor: 'hsl(var(--primary))',
    primaryDark: 'hsl(var(--primary))',
    primaryLight: 'hsl(var(--primary))',
    accentColor: 'hsl(var(--accent))',
  },
};
