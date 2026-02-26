/**
 * Preset Theme Variants
 * 8+ pre-configured accessible themes
 */

import type { Theme } from './types'

// ArchonY Light Theme (WCAG AA)
export const THEME_LIGHT: Theme = {
  id: 'light',
  name: 'Light',
  variant: 'light',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#1F3076',      // Daytime
    secondary: '#1A0648',    // Midnight
    accent: '#00CCFE',       // Blue Skies
    background: '#F5F5F7',   // Surface-0 light
    surface: '#FFFFFF',      // Surface-1 light
    foreground: '#1A0648',   // Midnight as text
    muted: '#E8E8EC',        // Surface-4 light
    mutedForeground: 'rgba(26, 6, 72, 0.65)',
    border: 'rgba(26, 6, 72, 0.12)',
    success: '#10B981',
    warning: '#FDC016',      // Golden Hour
    error: '#FF4300',        // Noon
    info: '#00CCFE',         // Blue Skies
    destructive: '#FF4300',  // Noon
  },
}

// ArchonY Dark Theme (Default — WCAG AA)
export const THEME_DARK: Theme = {
  id: 'dark',
  name: 'Dark',
  variant: 'dark',
  wcagLevel: 'AA',
  contrastRatio: 4.5,
  colors: {
    primary: '#00CCFE',      // Blue Skies
    secondary: '#1F3076',    // Daytime
    accent: '#00CCFE',       // Blue Skies
    background: '#0D0320',   // Surface-0
    surface: '#1A0648',      // Surface-1 (Midnight)
    foreground: '#FFFFFF',
    muted: '#2A1878',        // Surface-3
    mutedForeground: 'rgba(255, 255, 255, 0.65)',
    border: 'rgba(0, 204, 254, 0.15)',
    success: '#10B981',
    warning: '#FDC016',      // Golden Hour
    error: '#FF4300',        // Noon
    info: '#00CCFE',         // Blue Skies
    destructive: '#FF4300',  // Noon
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
    secondary: '#8B5A00',
    accent: '#663399',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#0173B2',
    warning: '#8B5A00',
    error: '#663399',
    info: '#0173B2',
    destructive: '#663399',
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
    secondary: '#8B6F00',
    accent: '#008FB3',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#005BA6',
    warning: '#8B6F00',
    error: '#008FB3',
    info: '#005BA6',
    destructive: '#008FB3',
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
    primary: '#C41E3A',
    secondary: '#00886B',
    accent: '#8B3A00',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    foreground: '#000000',
    muted: '#BDBDBD',
    mutedForeground: '#616161',
    border: '#E0E0E0',
    success: '#C41E3A',
    warning: '#8B3A00',
    error: '#00886B',
    info: '#C41E3A',
    destructive: '#00886B',
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
