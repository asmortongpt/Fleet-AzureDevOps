/**
 * USWDS 3.0 Design Tokens - Colors
 *
 * Based on U.S. Web Design System (USWDS) 3.0 color palette
 * https://designsystem.digital.gov/design-tokens/color/
 *
 * Government-standard color palette for professional, accessible interfaces
 */

export const colors = {
  // Primary - Government Blue (Official U.S. Government color)
  primary: {
    base: '#005EA2',      // USWDS blue-60 - Primary actions, links
    dark: '#1C3F94',      // USWDS blue-80 - Hover states
    darker: '#162E51',    // USWDS blue-90 - Active states
    light: '#2378C3',     // USWDS blue-50 - Subtle highlights
    lighter: '#73B3E7',   // USWDS blue-30 - Very subtle backgrounds
  },

  // Semantic - Status Colors (WCAG 2.1 AA compliant)
  success: {
    base: '#00A91C',      // USWDS green-cool-50
    dark: '#008817',      // USWDS green-cool-60
    light: '#70E17B',     // USWDS green-cool-20
  },

  warning: {
    base: '#FFBE2E',      // USWDS gold-20
    dark: '#E5A000',      // USWDS gold-30
    light: '#FEE685',     // USWDS gold-10
  },

  error: {
    base: '#D54309',      // USWDS red-warm-60
    dark: '#B50909',      // USWDS red-warm-70
    light: '#F4E3DB',     // USWDS red-warm-10
  },

  info: {
    base: '#2378C3',      // USWDS blue-50
    dark: '#005EA2',      // USWDS blue-60
    light: '#97D4EA',     // USWDS cyan-20
  },

  // Neutrals - High Contrast (WCAG AAA for text)
  gray: {
    900: '#1B1B1B',       // Text primary (21:1 contrast ratio)
    800: '#3D4551',       // Text secondary (12:1 contrast ratio)
    700: '#565C65',       // Text tertiary (8:1 contrast ratio)
    600: '#71767A',       // Disabled text (4.5:1 contrast ratio)
    500: '#A9AEB1',       // Borders, dividers
    400: '#C6CACE',       // Subtle borders
    300: '#D9D9D9',       // Input borders
    200: '#E6E6E6',       // Light backgrounds
    100: '#F0F0F0',       // Subtle backgrounds
    50: '#F9F9F9',        // Very subtle backgrounds
  },

  // Surface
  white: '#FFFFFF',
  background: {
    base: '#FFFFFF',      // Main background
    subtle: '#F9F9F9',    // Alternating rows, subtle sections
    medium: '#F0F0F0',    // Disabled inputs, inactive states
  },

  // Borders
  border: {
    base: '#A9AEB1',      // Default border
    dark: '#71767A',      // Emphasized border
    light: '#D9D9D9',     // Subtle border
  },

  // Focus - Government Standard
  focus: {
    outline: '#2491FF',   // USWDS blue-40 - Keyboard focus indicator
    background: '#E7F6F8', // USWDS cyan-5 - Focus background
  },
} as const

export type ColorTokens = typeof colors

// Export individual color scales for convenience
export const { primary, success, warning, error, info, gray, white, background, border, focus } = colors
