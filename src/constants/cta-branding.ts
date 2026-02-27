/**
 * Official Capital Technology Alliance Brand Guidelines
 * Source: CTA - Branding Second Look - 012626 - ADELE.pdf
 *
 * CTA Fleet is the preferred name and logo for
 * the entire suite of CTA enterprise solutions, including fleet management.
 *
 * CTA Brand Palette (mapped to theme CSS variables)
 * - DAYTIME: primary
 * - SILVER: chart-1
 * - MIDNIGHT: background
 * - NOON: chart-6
 * - GOLDEN HOUR: chart-3
 */

export const CTA_BRAND_COLORS = {
  // Official CTA Color Palette - EXACT from ADELE PDF
  DAYTIME: 'hsl(var(--primary))',
  SILVER: 'hsl(var(--chart-1))',
  MIDNIGHT: 'hsl(var(--background))',
  NOON: 'hsl(var(--chart-6))',
  GOLDEN_HOUR: 'hsl(var(--chart-3))',
} as const

export const CTA_GRADIENTS = {
  // Official CTA Gradient Bar - Skyline colors
  PRIMARY: 'linear-gradient(90deg, hsl(var(--chart-3)) 0%, hsl(var(--chart-6)) 100%)',

  // Full Skyline Gradient
  SKYLINE: 'linear-gradient(90deg, hsl(var(--chart-1)) 0%, hsl(var(--chart-1)) 25%, hsl(var(--chart-3)) 75%, hsl(var(--chart-6)) 100%)',

  // Background Gradients
  MIDNIGHT_TO_DAYTIME: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--primary)) 50%, hsl(var(--background)) 100%)',

  // Text Gradients
  LOGO_TEXT: 'linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--chart-1)) 50%, hsl(var(--foreground)) 100%)',

  // Accent Gradients
  SILVER_GLOW: 'radial-gradient(circle, hsl(var(--chart-1) / 0.25) 0%, transparent 70%)',
  NOON_GLOW: 'radial-gradient(circle, hsl(var(--chart-6) / 0.2) 0%, transparent 70%)',
} as const

export const CTA_SHADOWS = {
  // Glow effects for brand elements - updated with exact colors
  GOLDEN_HOUR_GLOW: '0 20px 40px hsl(var(--chart-3) / 0.6), 0 0 0 2px hsl(var(--foreground) / 0.2)',
  SILVER_GLOW: '0 0 10px hsl(var(--chart-1) / 0.8)',
  CTA_TEXT: '0 2px 8px hsl(var(--chart-1) / 0.6), 0 4px 12px hsl(var(--chart-3) / 0.4)',
  GRADIENT_BAR: '0 2px 8px hsl(var(--chart-3) / 0.6)',
} as const

export const CTA_TYPOGRAPHY = {
  // Headings - Cinzel (brand primary serif)
  HEADING_FAMILY: '"Cinzel", Georgia, serif',
  HEADING_WEIGHT: 700,

  // Body - Montserrat (brand secondary sans-serif)
  BODY_FAMILY: '"Montserrat", -apple-system, sans-serif',
  BODY_WEIGHT: 400,

  // CTA Fleet Logo
  LOGO_FAMILY: '"Cinzel", Georgia, serif',
  LOGO_WEIGHT: 700,
  LOGO_LETTER_SPACING: '0.15em',

  // Tagline
  TAGLINE_FAMILY: '"Montserrat", -apple-system, sans-serif',
  TAGLINE_WEIGHT: 600,
  TAGLINE_LETTER_SPACING: '0.2em',
  TAGLINE_TEXT: 'INTELLIGENT PERFORMANCE',
} as const

export const CTA_BRANDING = {
  PRODUCT_NAME: 'CTA Fleet Command',
  PRODUCT_SHORT: 'CTA Fleet',
  COMPANY_NAME: 'Capital Technology Alliance',
  COMPANY_SHORT: 'CTA',
  TAGLINE: 'INTELLIGENT PERFORMANCE',
  MAIN_TAGLINE: 'Intelligent Technology. Integrated Partnership.',
  PHILOSOPHY: 'Turn insight into impact',
} as const

/**
 * Helper function to apply CTA brand styling
 */
export const ctaBrandStyle = {
  ctaFleetLogo: (size: 'sm' | 'md' | 'lg' = 'md') => ({
    fontFamily: CTA_TYPOGRAPHY.LOGO_FAMILY,
    fontWeight: CTA_TYPOGRAPHY.LOGO_WEIGHT,
    letterSpacing: CTA_TYPOGRAPHY.LOGO_LETTER_SPACING,
    color: 'hsl(var(--foreground))',
    textShadow: CTA_SHADOWS.CTA_TEXT,
    background: CTA_GRADIENTS.LOGO_TEXT,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }),

  gradientButton: () => ({
    background: CTA_GRADIENTS.PRIMARY,
    boxShadow: '0 10px 20px hsl(var(--chart-3) / 0.4)',
  }),

  accentText: () => ({
    color: CTA_BRAND_COLORS.SILVER,
    textShadow: CTA_SHADOWS.SILVER_GLOW,
  }),

  darkBackground: () => ({
    background: CTA_GRADIENTS.MIDNIGHT_TO_DAYTIME,
  }),
} as const

export default CTA_BRAND_COLORS
