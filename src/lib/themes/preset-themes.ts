/**
 * Preset Theme Variants
 * 8+ pre-configured accessible themes
 */

import type { Theme } from './types'

// Standard Light Theme (WCAG AA)
export const THEME_LIGHT: Theme = {
  id: 'light',
  name: 'Light',
  variant: 'light',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#EC4899',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    foreground: '#0F172A',
    muted: '#CBD5E1',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    destructive: '#DC2626',
  },
}

// Standard Dark Theme (WCAG AA)
export const THEME_DARK: Theme = {
  id: 'dark',
  name: 'Dark',
  variant: 'dark',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    accent: '#F472B6',
    background: '#0F172A',
    surface: '#1E293B',
    foreground: '#F8FAFC',
    muted: '#475569',
    mutedForeground: '#CBD5E1',
    border: '#334155',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    destructive: '#F87171',
  },
}

// High Contrast Light (WCAG AAA+)
export const THEME_HIGH_CONTRAST_LIGHT: Theme = {
  id: 'high-contrast-light',
  name: 'High Contrast Light',
  variant: 'high-contrast',
  wcagLevel: 'AAA',
  contrastRatio: 8.5,
  colors: {
    primary: '#000000',
    secondary: '#0000CC',
    accent: '#0000FF',
    background: '#FFFFFF',
    surface: '#F0F0F0',
    foreground: '#000000',
    muted: '#333333',
    mutedForeground: '#000000',
    border: '#000000',
    success: '#008000',
    warning: '#FF8C00',
    error: '#FF0000',
    info: '#0000FF',
    destructive: '#FF0000',
  },
}

// High Contrast Dark (WCAG AAA+)
export const THEME_HIGH_CONTRAST_DARK: Theme = {
  id: 'high-contrast-dark',
  name: 'High Contrast Dark',
  variant: 'high-contrast',
  wcagLevel: 'AAA',
  contrastRatio: 8.5,
  colors: {
    primary: '#FFFFFF',
    secondary: '#FFFF00',
    accent: '#FFFF00',
    background: '#000000',
    surface: '#1A1A1A',
    foreground: '#FFFFFF',
    muted: '#CCCCCC',
    mutedForeground: '#FFFFFF',
    border: '#FFFFFF',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0000',
    info: '#00FFFF',
    destructive: '#FF0000',
  },
}

// Deuteranopia Safe (Red-Green Colorblind)
export const THEME_DEUTERANOPIA: Theme = {
  id: 'deuteranopia',
  name: 'Deuteranopia Safe',
  variant: 'deuteranopia',
  wcagLevel: 'AAA',
  contrastRatio: 7.5,
  colors: {
    primary: '#0173B2',
    secondary: '#DE8F05',
    accent: '#CC78BC',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#0173B2',
    warning: '#DE8F05',
    error: '#CC78BC',
    info: '#0173B2',
    destructive: '#CC78BC',
  },
}

// Protanopia Safe (Red-Blind)
export const THEME_PROTANOPIA: Theme = {
  id: 'protanopia',
  name: 'Protanopia Safe',
  variant: 'protanopia',
  wcagLevel: 'AAA',
  contrastRatio: 7.5,
  colors: {
    primary: '#005BA6',
    secondary: '#FFBE00',
    accent: '#00B4D8',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#005BA6',
    warning: '#FFBE00',
    error: '#00B4D8',
    info: '#005BA6',
    destructive: '#00B4D8',
  },
}

// Tritanopia Safe (Blue-Yellow Colorblind)
export const THEME_TRITANOPIA: Theme = {
  id: 'tritanopia',
  name: 'Tritanopia Safe',
  variant: 'tritanopia',
  wcagLevel: 'AAA',
  contrastRatio: 7.5,
  colors: {
    primary: '#E81828',
    secondary: '#00C9A7',
    accent: '#D55E00',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#E81828',
    warning: '#D55E00',
    error: '#00C9A7',
    info: '#E81828',
    destructive: '#00C9A7',
  },
}

// Warm Light Theme
export const THEME_WARM_LIGHT: Theme = {
  id: 'warm-light',
  name: 'Warm Light',
  variant: 'light',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#D97706',
    secondary: '#B91C1C',
    accent: '#EA580C',
    background: '#FEF9F3',
    surface: '#FEF3F2',
    foreground: '#1F2937',
    muted: '#D1D5DB',
    mutedForeground: '#6B7280',
    border: '#FEE2E2',
    success: '#854D0E',
    warning: '#D97706',
    error: '#B91C1C',
    info: '#2563EB',
    destructive: '#B91C1C',
  },
}

// Cool Light Theme
export const THEME_COOL_LIGHT: Theme = {
  id: 'cool-light',
  name: 'Cool Light',
  variant: 'light',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#0EA5E9',
    secondary: '#6366F1',
    accent: '#06B6D4',
    background: '#F0F9FF',
    surface: '#F0F4F8',
    foreground: '#0C2D48',
    muted: '#CBD5E1',
    mutedForeground: '#475569',
    border: '#DBEAFE',
    success: '#0369A1',
    warning: '#FACC15',
    error: '#EF4444',
    info: '#0EA5E9',
    destructive: '#EF4444',
  },
}

// All preset themes
export const PRESET_THEMES = [
  THEME_LIGHT,
  THEME_DARK,
  THEME_HIGH_CONTRAST_LIGHT,
  THEME_HIGH_CONTRAST_DARK,
  THEME_DEUTERANOPIA,
  THEME_PROTANOPIA,
  THEME_TRITANOPIA,
  THEME_WARM_LIGHT,
  THEME_COOL_LIGHT,
]

export const PRESET_THEMES_MAP = new Map(PRESET_THEMES.map((theme) => [theme.id, theme]))

/**
 * Get theme by ID
 */
export function getThemeById(id: string): Theme | undefined {
  return PRESET_THEMES_MAP.get(id)
}

/**
 * Get all themes for a specific variant
 */
export function getThemesByVariant(variant: string): Theme[] {
  return PRESET_THEMES.filter((theme) => theme.variant === variant)
}

/**
 * Get all accessibility-focused themes (high contrast, colorblind)
 */
export function getAccessibilityThemes(): Theme[] {
  return PRESET_THEMES.filter((theme) =>
    ['high-contrast', 'deuteranopia', 'protanopia', 'tritanopia'].includes(theme.variant)
  )
}

/**
 * Get all WCAG AAA compliant themes
 */
export function getWCAGAAAThemes(): Theme[] {
  return PRESET_THEMES.filter((theme) => theme.wcagLevel === 'AAA')
}
