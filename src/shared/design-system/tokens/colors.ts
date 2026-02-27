/**
 * USWDS 3.0 Design Tokens - Colors
 *
 * Based on U.S. Web Design System (USWDS) 3.0 color palette
 * https://designsystem.digital.gov/design-tokens/color/
 *
 * Government-standard color palette for professional, accessible interfaces
 */

export const colors = {
  // Primary - Professional Emerald (CTA Fleet brand)
  primary: {
    base: 'var(--color-primary-600)',      // Primary actions, links
    dark: 'var(--color-primary-700)',      // Hover states
    darker: 'var(--color-primary-800)',    // Active states
    light: 'var(--color-primary-500)',     // Subtle highlights
    lighter: 'var(--color-primary-300)',   // Very subtle backgrounds
  },

  // Semantic - Status Colors (WCAG 2.1 AA compliant)
  success: {
    base: 'var(--color-success-500)',
    dark: 'var(--color-success-700)',
    light: 'var(--color-success-50)',
  },

  warning: {
    base: 'var(--color-warning-500)',
    dark: 'var(--color-warning-700)',
    light: 'var(--color-warning-50)',
  },

  error: {
    base: 'var(--color-error-500)',
    dark: 'var(--color-error-700)',
    light: 'var(--color-error-50)',
  },

  info: {
    base: 'var(--color-info-500)',
    dark: 'var(--color-info-700)',
    light: 'var(--color-info-50)',
  },

  // Neutrals - High Contrast (WCAG AAA for text)
  gray: {
    900: 'var(--color-neutral-900)',       // Text primary
    800: 'var(--color-neutral-800)',       // Text secondary
    700: 'var(--color-neutral-700)',       // Text tertiary
    600: 'var(--color-neutral-600)',       // Disabled text
    500: 'var(--color-neutral-500)',       // Borders, dividers
    400: 'var(--color-neutral-400)',       // Subtle borders
    300: 'var(--color-neutral-300)',       // Input borders
    200: 'var(--color-neutral-200)',       // Light backgrounds
    100: 'var(--color-neutral-100)',       // Subtle backgrounds
    50: 'var(--color-neutral-50)',         // Very subtle backgrounds
  },

  // Surface
  white: 'var(--bg-primary)',
  background: {
    base: 'var(--bg-primary)',      // Main background
    subtle: 'var(--surface-card)',  // Alternating rows, subtle sections
    medium: 'var(--bg-secondary)',  // Disabled inputs, inactive states
  },

  // Borders
  border: {
    base: 'var(--border-default)',  // Default border
    dark: 'var(--border-strong)',   // Emphasized border
    light: 'var(--border-subtle)',  // Subtle border
  },

  // Focus - Government Standard
  focus: {
    outline: 'var(--color-info-500)',    // Keyboard focus indicator
    background: 'var(--color-info-50)',  // Focus background
  },
} as const

export type ColorTokens = typeof colors

// Export individual color scales for convenience
export const { primary, success, warning, error, info, gray, white, background, border, focus } = colors
