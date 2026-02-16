/**
 * Theme System Type Definitions
 * Support for accessibility variants and custom themes
 */

export type ThemeVariant =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia'
  | 'custom'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  success: string
  warning: string
  error: string
  info: string
  destructive: string
}

export interface ThemeColorBlindVariant {
  name: string
  description: string
  colors: ThemeColors
  contrastRatio: number // WCAG ratio
  wcagLevel: 'A' | 'AA' | 'AAA'
  patterns?: {
    success: string
    warning: string
    error: string
    info: string
  }
}

export interface Theme {
  id: string
  name: string
  variant: ThemeVariant
  colors: ThemeColors
  typography?: {
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
    }
    fontFamily: string
    lineHeight: {
      tight: string
      normal: string
      relaxed: string
    }
  }
  spacing?: {
    compact: Record<string, string>
    comfortable: Record<string, string>
    spacious: Record<string, string>
  }
  borders?: {
    radius: Record<string, string>
    width: Record<string, string>
  }
  shadows?: Record<string, string>
  transitions?: {
    fast: string
    normal: string
    slow: string
  }
  wcagLevel?: 'A' | 'AA' | 'AAA'
  contrastRatio?: number
}

export interface CustomThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  darkMode: boolean
  highContrast: boolean
  colorBlindMode?: 'deuteranopia' | 'protanopia' | 'tritanopia'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  density: 'compact' | 'comfortable' | 'spacious'
}

export interface ThemeGenerationOptions {
  primaryColor: string
  secondaryColor: string
  darkMode: boolean
  highContrast?: boolean
  colorBlindMode?: 'deuteranopia' | 'protanopia' | 'tritanopia'
}
