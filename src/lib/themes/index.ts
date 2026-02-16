/**
 * Theme System Index
 * Exports all theme-related utilities and types
 */

// Types
export * from './types'

// Color palettes
export * from './color-blind-palettes'

// Theme generation
export * from './theme-generator'

// Preset themes
export * from './preset-themes'

// Theme context (React component)
export { ThemeProvider, useTheme, useSetTheme, useCurrentTheme, useAvailableThemes } from './theme-context'
