/**
 * CTA / ArchonY Brand Configuration
 *
 * Centralized brand tokens for Capital Technology Alliance.
 * Source: ADELE Branding Document, January 26, 2026 (Second Look)
 *
 * To update branding for a different organization:
 * 1. Update the color palette below
 * 2. Update the logo SVG paths in CompactHeader.tsx (ArchonYLogo, CTAMark)
 * 3. Update CSS variables in src/index.css :root block
 * 4. Update favicon at public/favicon.ico
 *
 * The CSS variables (--cta-*) in index.css should always match
 * the values defined here.
 */

/** Brand color palette - ADELE Vibrant Palette */
export const brandColors = {
  /** DAYTIME - Navy blue. Used for primary surfaces, icon rail bg, text on light */
  daytime: '#2F3359',
  /** BLUE SKIES - Cyan. Used for interactive elements, active states, links */
  blueSkies: '#41B2E3',
  /** MIDNIGHT - Deep dark blue (client-adjusted darker than ADELE original #1A0B2E).
   *  Used for app background, deep surfaces, overlays */
  midnight: '#0A0E27',
  /** NOON - Orange. Used for alerts, warnings, CTAs, gradient end */
  noon: '#DD3903',
  /** GOLDEN HOUR - Yellow. Used for highlights, gradient start, CTA accent bar */
  goldenHour: '#F0A000',
} as const

/** Derived surface colors for the dark theme */
export const surfaceColors = {
  /** Slightly lighter than midnight for cards, panels */
  card: '#111638',
  /** Slightly lighter than midnight for icon rail */
  rail: '#0F1535',
  /** Muted navy for disabled/inactive states */
  muted: '#161B3D',
} as const

/** Brand gradients */
export const brandGradients = {
  /** Dawn gradient - Golden Hour → Noon. The signature CTA accent bar */
  dawn: `linear-gradient(90deg, ${brandColors.goldenHour} 0%, ${brandColors.noon} 100%)`,
  /** Secondary gradient - Blue Skies → Daytime */
  secondary: `linear-gradient(135deg, ${brandColors.blueSkies} 0%, ${brandColors.daytime} 100%)`,
  /** Full cityscape skyline gradient */
  skyline: `linear-gradient(90deg, ${brandColors.daytime} 0%, ${brandColors.blueSkies} 30%, ${brandColors.goldenHour} 70%, ${brandColors.noon} 100%)`,
} as const

/** Brand identity */
export const brandIdentity = {
  /** Parent brand name */
  parentBrand: 'Capital Technology Alliance',
  /** Parent brand abbreviation */
  parentAbbrev: 'CTA',
  /** Product name for the fleet/enterprise suite */
  productName: 'ArchonY',
  /** Product tagline */
  tagline: 'Intelligent Performance',
  /** Primary tagline for CTA */
  ctaTagline: 'Intelligent Technology. Integrated Partnership.',
  /** Page title format */
  pageTitle: 'ArchonY | Fleet Management',
} as const

/** Tailwind-compatible CSS class helpers using the brand */
export const brandClasses = {
  /** Dawn gradient bar (2-3px height) */
  dawnGradientBar: 'bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]',
  /** Glass effect on midnight background */
  glassMidnight: 'bg-[#0A0E27]/95 backdrop-blur-xl',
  /** Active state indicator color */
  activeIndicator: 'bg-[#41B2E3]',
  /** Alert/warning color */
  alertColor: 'text-[#DD3903]',
  /** Success color */
  successColor: 'text-emerald-400',
} as const
