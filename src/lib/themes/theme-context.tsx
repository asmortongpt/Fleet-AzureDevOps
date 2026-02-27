/**
 * Theme Context Provider
 * Manages theme state and application of themes
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

import { PRESET_THEMES_MAP, getThemeById } from './preset-themes'
import { generateThemeCSS, validateThemeContrast } from './theme-generator'
import type { Theme, ThemeVariant } from './types'

interface ThemeContextType {
  currentTheme: Theme
  themes: Theme[]
  activeVariant: ThemeVariant
  setTheme: (theme: Theme | string) => void
  applyTheme: (theme: Theme) => void
  getTheme: (id: string) => Theme | undefined
  validateContrast: () => any
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Load saved theme from localStorage
    const savedThemeId = localStorage.getItem('app-theme')
    if (savedThemeId) {
      const theme = getThemeById(savedThemeId)
      if (theme) return theme
    }
    // Default to light theme
    const defaultTheme = getThemeById('light')
    if (defaultTheme) return defaultTheme

    // Fallback to first available theme
    const firstTheme = PRESET_THEMES_MAP.values().next().value
    if (firstTheme) return firstTheme

    throw new Error('No themes available')
  })

  const [themes] = useState<Theme[]>(Array.from(PRESET_THEMES_MAP.values()))

  // Apply theme to DOM
  useEffect(() => {
    applyThemeToDom(currentTheme)
    localStorage.setItem('app-theme', currentTheme.id)
  }, [currentTheme])

  const setTheme = (theme: Theme | string) => {
    if (typeof theme === 'string') {
      const foundTheme = getThemeById(theme)
      if (foundTheme) {
        setCurrentTheme(foundTheme)
      }
    } else {
      setCurrentTheme(theme)
    }
  }

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme)
  }

  const getTheme = (id: string) => {
    return getThemeById(id)
  }

  const validateContrast = () => {
    return validateThemeContrast(currentTheme)
  }

  const value: ThemeContextType = {
    currentTheme,
    themes,
    activeVariant: currentTheme.variant,
    setTheme,
    applyTheme,
    getTheme,
    validateContrast,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Apply theme to DOM
 */
function applyThemeToDom(theme: Theme) {
  // Create or update style element
  let styleElement = document.getElementById('app-theme-styles')
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'app-theme-styles'
    document.head.appendChild(styleElement)
  }

  // Generate and apply CSS
  const css = generateThemeCSS(theme)
  styleElement.textContent = css

  // Set CSS variables for runtime access
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })

  // Add data attributes for theme selection
  root.dataset.theme = theme.id
  root.dataset.themeVariant = theme.variant
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Hook to set theme by ID
 */
export function useSetTheme() {
  const { setTheme } = useTheme()
  return setTheme
}

/**
 * Hook to get current theme
 */
export function useCurrentTheme(): Theme {
  const { currentTheme } = useTheme()
  return currentTheme
}

/**
 * Hook to get all available themes
 */
export function useAvailableThemes(): Theme[] {
  const { themes } = useTheme()
  return themes
}
