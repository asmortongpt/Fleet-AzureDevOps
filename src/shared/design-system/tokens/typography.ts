/**
 * USWDS 3.0 Design Tokens - Typography
 *
 * Based on U.S. Web Design System (USWDS) 3.0 typography scale
 * https://designsystem.digital.gov/design-tokens/typesetting/
 *
 * Professional typography for government interfaces
 */

export const typography = {
  // Font Families - USWDS Standard
  fontFamily: {
    sans: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: '"Merriweather", Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"Roboto Mono", "Bitstream Vera Sans Mono", "Consolas", Courier, monospace',
  },

  // Font Sizes - USWDS Scale (rem-based, accessible)
  fontSize: {
    '2xs': '0.75rem',     // 12px - Fine print, labels
    xs: '0.8125rem',      // 13px - Small labels
    sm: '0.875rem',       // 14px - Secondary text, captions
    base: '1rem',         // 16px - Body text (WCAG recommended base)
    lg: '1.125rem',       // 18px - Large body text
    xl: '1.375rem',       // 22px - Subheadings
    '2xl': '1.75rem',     // 28px - Headings
    '3xl': '2.5rem',      // 40px - Large headings
    '4xl': '3rem',        // 48px - Display headings
    '5xl': '3.75rem',     // 60px - Hero text
  },

  // Font Weights - Limited palette for clarity
  fontWeight: {
    normal: 400,          // Regular text
    medium: 500,          // Subtle emphasis
    semibold: 600,        // Strong emphasis, labels
    bold: 700,            // Headings, primary CTAs
  },

  // Line Heights - Optimized for readability
  lineHeight: {
    none: 1,              // Icons, single-line elements
    tight: 1.25,          // Headings
    snug: 1.375,          // Large text
    normal: 1.5,          // Body text (WCAG recommended)
    relaxed: 1.625,       // Dense content
    loose: 2,             // Minimal text, spacious layouts
  },

  // Letter Spacing - Subtle adjustments
  letterSpacing: {
    tighter: '-0.02em',   // Large headings
    tight: '-0.01em',     // Headings
    normal: '0',          // Body text
    wide: '0.025em',      // Labels, small caps
    wider: '0.05em',      // All caps text
  },
} as const

export type TypographyTokens = typeof typography

// Text Styles - Predefined combinations
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  h4: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },

  // Body text
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },

  // Labels
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  labelSmall: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Code
  code: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal,
  },
} as const
