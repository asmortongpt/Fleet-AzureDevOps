/**
 * Official Capital Technology Alliance Brand Guidelines
 * Source: CTA - Branding Second Look - 012626 - ADELE.pdf
 *
 * ArchonY was selected as the preferred name and logo for
 * the entire suite of CTA enterprise solutions, including fleet management.
 */

export const CTA_BRAND_COLORS = {
  // Official CTA Color Palette
  DAYTIME: '#2B3A67',      // Navy - Primary brand color
  BLUE_SKIES: '#00D4FF',   // Cyan - Accent for highlights
  MIDNIGHT: '#1A0B2E',     // Deep Purple - Backgrounds
  NOON: '#FF5722',         // Orange - Call-to-action
  GOLDEN_HOUR: '#FDB813',  // Yellow/Gold - Premium accents
} as const

export const CTA_GRADIENTS = {
  // Official CTA Gradient Bar
  PRIMARY: 'linear-gradient(90deg, #FDB813 0%, #FF5722 100%)',

  // Background Gradients
  MIDNIGHT_TO_DAYTIME: 'linear-gradient(135deg, #1A0B2E 0%, #2B3A67 50%, #1A0B2E 100%)',

  // Text Gradients
  LOGO_TEXT: 'linear-gradient(90deg, #ffffff 0%, #00D4FF 50%, #ffffff 100%)',

  // Accent Gradients
  BLUE_SKIES_GLOW: 'radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, transparent 70%)',
  NOON_GLOW: 'radial-gradient(circle, rgba(255, 87, 34, 0.2) 0%, transparent 70%)',
} as const

export const CTA_SHADOWS = {
  // Glow effects for brand elements
  GOLDEN_HOUR_GLOW: '0 20px 40px rgba(253, 184, 19, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.2)',
  BLUE_SKIES_GLOW: '0 0 10px rgba(0, 212, 255, 0.8)',
  ARCHONY_TEXT: '0 2px 8px rgba(0, 212, 255, 0.6), 0 4px 12px rgba(253, 184, 19, 0.4)',
  GRADIENT_BAR: '0 2px 8px rgba(253, 184, 19, 0.6)',
} as const

export const CTA_TYPOGRAPHY = {
  // ArchonY Logo
  LOGO_FAMILY: '"Inter", -apple-system, sans-serif',
  LOGO_WEIGHT: 700,
  LOGO_LETTER_SPACING: '0.15em',

  // Tagline
  TAGLINE_FAMILY: '"Inter", -apple-system, sans-serif',
  TAGLINE_WEIGHT: 600,
  TAGLINE_LETTER_SPACING: '0.2em',
  TAGLINE_TEXT: 'INTELLIGENT PERFORMANCE',
} as const

export const CTA_BRANDING = {
  PRODUCT_NAME: 'ArchonY',
  COMPANY_NAME: 'Capital Tech Alliance',
  TAGLINE: 'INTELLIGENT PERFORMANCE',
  PHILOSOPHY: 'Turn insight into impact',
} as const

/**
 * Helper function to apply CTA brand styling
 */
export const ctaBrandStyle = {
  archonyLogo: (size: 'sm' | 'md' | 'lg' = 'md') => ({
    fontFamily: CTA_TYPOGRAPHY.LOGO_FAMILY,
    fontWeight: CTA_TYPOGRAPHY.LOGO_WEIGHT,
    letterSpacing: CTA_TYPOGRAPHY.LOGO_LETTER_SPACING,
    color: '#ffffff',
    textShadow: CTA_SHADOWS.ARCHONY_TEXT,
    background: CTA_GRADIENTS.LOGO_TEXT,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }),

  gradientButton: () => ({
    background: CTA_GRADIENTS.PRIMARY,
    boxShadow: '0 10px 20px rgba(253, 184, 19, 0.4)',
  }),

  accentText: () => ({
    color: CTA_BRAND_COLORS.BLUE_SKIES,
    textShadow: CTA_SHADOWS.BLUE_SKIES_GLOW,
  }),

  darkBackground: () => ({
    background: CTA_GRADIENTS.MIDNIGHT_TO_DAYTIME,
  }),
} as const

export default CTA_BRAND_COLORS
