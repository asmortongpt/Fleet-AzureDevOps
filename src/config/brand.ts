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
  daytime: 'hsl(var(--muted-foreground))',
  /** BLUE SKIES - Cyan. Used for interactive elements, active states, links */
  blueSkies: 'hsl(var(--primary))',
  /** MIDNIGHT - Deep dark blue (client-adjusted darker than ADELE original).
   *  Used for app background, deep surfaces, overlays */
  midnight: 'hsl(var(--background))',
  /** NOON - Orange. Used for alerts, warnings, CTAs, gradient end */
  noon: 'hsl(var(--destructive))',
  /** GOLDEN HOUR - Yellow. Used for highlights, gradient start, CTA accent bar */
  goldenHour: 'hsl(var(--warning))',
} as const

/** Derived surface colors for the dark theme */
export const surfaceColors = {
  /** Slightly lighter than midnight for cards, panels */
  card: 'hsl(var(--card))',
  /** Slightly lighter than midnight for icon rail */
  rail: 'hsl(var(--card))',
  /** Muted navy for disabled/inactive states */
  muted: 'hsl(var(--muted))',
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
  dawnGradientBar: 'bg-gradient-to-r from-[hsl(var(--warning))] via-[hsl(var(--warning))] to-[hsl(var(--destructive))]',
  /** Glass effect on midnight background */
  glassMidnight: 'bg-[hsl(var(--background))]/95 backdrop-blur-xl',
  /** Active state indicator color */
  activeIndicator: 'bg-[hsl(var(--primary))]',
  /** Alert/warning color */
  alertColor: 'text-[hsl(var(--destructive))]',
  /** Success color */
  successColor: 'text-emerald-400',
} as const
