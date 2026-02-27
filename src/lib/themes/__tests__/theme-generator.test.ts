/**
 * Theme Generator Tests
 * Tests for dynamic theme generation and CSS variable creation
 */

import { describe, it, expect } from 'vitest'

import { THEME_LIGHT, THEME_HIGH_CONTRAST_LIGHT, THEME_DEUTERANOPIA } from '../preset-themes'
import {
  generateCSSVariables,
  generateThemeFromColor,
  generateThemeCSS,
  validateThemeContrast,
  generateTailwindConfig,
  createCustomTheme,
} from '../theme-generator'
import type { Theme, CustomThemeConfig } from '../types'

describe('Theme Generator', () => {
  describe('generateCSSVariables', () => {
    it('should generate valid CSS variables for a theme', () => {
      const css = generateCSSVariables(THEME_LIGHT)

      expect(css).toContain(':root {')
      expect(css).toContain('--primary:')
      expect(css).toContain('--background:')
      expect(css).toContain('--foreground:')
      expect(css).toContain('}')
    })

    it('should include all required color properties', () => {
      const css = generateCSSVariables(THEME_LIGHT)
      const requiredColors = [
        'primary',
        'secondary',
        'accent',
        'background',
        'surface',
        'foreground',
        'muted',
        'muted-foreground',
        'border',
        'success',
        'warning',
        'error',
        'info',
        'destructive',
      ]

      requiredColors.forEach((color) => {
        expect(css.toLowerCase()).toContain(`--${color}`)
      })
    })

    it('should use valid hex color values', () => {
      const css = generateCSSVariables(THEME_LIGHT)
      const hexRegex = /#[0-9A-Fa-f]{6}/g
      const matches = css.match(hexRegex)

      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThan(0)
    })
  })

  describe('generateThemeCSS', () => {
    it('should generate complete CSS with variables and utilities', () => {
      const css = generateThemeCSS(THEME_LIGHT)

      expect(css).toContain(':root {')
      expect(css).toContain('--font-sans')
      expect(css).toContain('--transition-')
      expect(css).toContain('--shadow-')
      expect(css).toContain('--radius-')
    })

    it('should include media queries for prefers-color-scheme', () => {
      const css = generateThemeCSS(THEME_LIGHT)

      expect(css).toContain('@media (prefers-color-scheme: light)')
      expect(css).toContain('@media (prefers-color-scheme: dark)')
    })

    it('should include reduced motion preferences', () => {
      const css = generateThemeCSS(THEME_LIGHT)

      expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      expect(css).toContain('animation-duration: 0.01ms !important')
    })

    it('should include focus styles', () => {
      const css = generateThemeCSS(THEME_LIGHT)

      expect(css).toContain(':focus-visible')
      expect(css).toContain('outline')
    })
  })

  describe('generateThemeFromColor', () => {
    it('should generate a light theme from colors', () => {
      const theme = generateThemeFromColor({
        primaryColor: '#10b981',
        secondaryColor: '#D97706',
        darkMode: false,
      })

      expect(theme.colors.background).toBe('#FFFFFF')
      expect(theme.colors.foreground).toBe('#1a1a1a')
      expect(theme.id).toBeTruthy()
    })

    it('should generate a dark theme from colors', () => {
      const theme = generateThemeFromColor({
        primaryColor: '#34d399',
        secondaryColor: '#FBBF24',
        darkMode: true,
      })

      expect(theme.colors.background).toBe('#1a1a1a')
      expect(theme.colors.foreground).toBe('#FAFAFA')
    })

    it('should apply high contrast mode', () => {
      const theme = generateThemeFromColor({
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        darkMode: false,
        highContrast: true,
      })

      expect(theme.variant).toBe('high-contrast')
      expect(theme.wcagLevel).toBe('AAA')
    })

    it('should apply deuteranopia color blind mode', () => {
      const theme = generateThemeFromColor({
        primaryColor: '#0173B2',
        secondaryColor: '#DE8F05',
        darkMode: false,
        colorBlindMode: 'deuteranopia',
      })

      expect(theme.variant).toBe('deuteranopia')
      expect(theme.wcagLevel).toBe('AAA')
    })

    it('should generate unique theme IDs', () => {
      const theme1 = generateThemeFromColor({
        primaryColor: '#10b981',
        secondaryColor: '#D97706',
        darkMode: false,
      })

      const theme2 = generateThemeFromColor({
        primaryColor: '#10b981',
        secondaryColor: '#D97706',
        darkMode: false,
      })

      expect(theme1.id).not.toBe(theme2.id)
    })
  })

  describe('validateThemeContrast', () => {
    it('should validate high contrast theme passes', () => {
      const validation = validateThemeContrast(THEME_HIGH_CONTRAST_LIGHT)

      expect(validation).toHaveProperty('valid')
      expect(validation).toHaveProperty('issues')
      expect(validation).toHaveProperty('ratios')
      expect(validation.issues).toBeInstanceOf(Array)
    })

    it('should identify contrast issues in a theme', () => {
      const badTheme: Theme = {
        ...THEME_LIGHT,
        colors: {
          ...THEME_LIGHT.colors,
          foreground: '#F0F0F0', // Light on light - should fail
          background: '#FFFFFF',
        },
      }

      const validation = validateThemeContrast(badTheme)
      expect(validation.issues.length).toBeGreaterThan(0)
    })

    it('should calculate contrast ratios correctly', () => {
      const validation = validateThemeContrast(THEME_LIGHT)

      expect(validation.ratios).toBeTruthy()
      Object.values(validation.ratios).forEach((ratio) => {
        expect(typeof ratio).toBe('number')
        expect(ratio).toBeGreaterThan(0)
      })
    })

    it('should mark WCAG AAA theme as valid', () => {
      const validation = validateThemeContrast(THEME_DEUTERANOPIA)

      expect(validation.valid).toBe(true)
      expect(validation.issues.length).toBe(0)
    })
  })

  describe('generateTailwindConfig', () => {
    it('should generate Tailwind color config', () => {
      const config = generateTailwindConfig(THEME_LIGHT)

      expect(config).toHaveProperty('colors')
      expect(config.colors).toHaveProperty('primary')
      expect(config.colors).toHaveProperty('background')
    })

    it('should include all color properties in Tailwind config', () => {
      const config = generateTailwindConfig(THEME_LIGHT)
      const requiredColors = ['primary', 'secondary', 'background', 'foreground', 'success', 'error']

      requiredColors.forEach((color) => {
        expect(config.colors).toHaveProperty(color)
      })
    })

    it('should use correct color values from theme', () => {
      const config = generateTailwindConfig(THEME_LIGHT)

      expect(config.colors.primary).toBe(THEME_LIGHT.colors.primary)
      expect(config.colors.background).toBe(THEME_LIGHT.colors.background)
    })
  })

  describe('createCustomTheme', () => {
    it('should create a custom theme from config', () => {
      const config: CustomThemeConfig = {
        primaryColor: '#10b981',
        secondaryColor: '#D97706',
        accentColor: '#EC4899',
        darkMode: false,
        highContrast: false,
        fontSize: 'medium',
        density: 'comfortable',
      }

      const theme = createCustomTheme(config)

      expect(theme).toHaveProperty('colors')
      expect(theme).toHaveProperty('id')
      expect(theme.variant).toBe('custom')
    })

    it('should respect dark mode configuration', () => {
      const darkConfig: CustomThemeConfig = {
        primaryColor: '#34d399',
        secondaryColor: '#FBBF24',
        accentColor: '#F472B6',
        darkMode: true,
        highContrast: false,
        fontSize: 'medium',
        density: 'comfortable',
      }

      const theme = createCustomTheme(darkConfig)

      expect(theme.colors.background).toBe('#1a1a1a')
    })

    it('should apply high contrast when requested', () => {
      const config: CustomThemeConfig = {
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#F59E0B',
        darkMode: false,
        highContrast: true,
        fontSize: 'medium',
        density: 'comfortable',
      }

      const theme = createCustomTheme(config)

      expect(theme.variant).toBe('high-contrast')
      expect(theme.wcagLevel).toBe('AAA')
    })

    it('should apply color blind mode when provided', () => {
      const config: CustomThemeConfig = {
        primaryColor: '#0173B2',
        secondaryColor: '#DE8F05',
        accentColor: '#CC78BC',
        darkMode: false,
        highContrast: false,
        colorBlindMode: 'deuteranopia',
        fontSize: 'medium',
        density: 'comfortable',
      }

      const theme = createCustomTheme(config)

      expect(theme.variant).toBe('deuteranopia')
    })
  })

  describe('Theme consistency', () => {
    it('should maintain color property consistency across generated themes', () => {
      const theme = generateThemeFromColor({
        primaryColor: '#10b981',
        secondaryColor: '#D97706',
        darkMode: false,
      })

      const requiredColors = [
        'primary',
        'secondary',
        'accent',
        'background',
        'surface',
        'foreground',
        'muted',
        'mutedForeground',
        'border',
        'success',
        'warning',
        'error',
        'info',
        'destructive',
      ]

      requiredColors.forEach((color) => {
        expect(theme.colors).toHaveProperty(color)
        expect(theme.colors[color as keyof typeof theme.colors]).toBeTruthy()
        expect(typeof theme.colors[color as keyof typeof theme.colors]).toBe('string')
      })
    })
  })
})
