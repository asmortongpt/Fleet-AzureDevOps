/**
 * Dynamic Theme Generator
 * Generates CSS variables and theme objects from color configurations
 */

import type { Theme, ThemeGenerationOptions, CustomThemeConfig } from './types'
import {
  DEUTERANOPIA_PALETTE,
  PROTANOPIA_PALETTE,
  TRITANOPIA_PALETTE,
  HIGH_CONTRAST_LIGHT,
  HIGH_CONTRAST_DARK,
  calculateContrastRatio,
  getWCAGLevel,
} from './color-blind-palettes'

/**
 * Generate CSS variables from theme colors
 */
export function generateCSSVariables(theme: Theme): string {
  const colors = theme.colors
  const lines: string[] = [':root {', '  /* Theme Colors */']

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    lines.push(`  ${cssVar}: ${value};`)
  })

  lines.push('}')
  return lines.join('\n')
}

/**
 * Generate Tailwind config from theme
 */
export function generateTailwindConfig(theme: Theme): Record<string, any> {
  return {
    colors: {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      surface: theme.colors.surface,
      foreground: theme.colors.foreground,
      muted: theme.colors.muted,
      'muted-foreground': theme.colors.mutedForeground,
      border: theme.colors.border,
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
      info: theme.colors.info,
      destructive: theme.colors.destructive,
    },
  }
}

/**
 * Generate a theme from a single primary color
 */
export function generateThemeFromColor(options: ThemeGenerationOptions): Theme {
  // Select base palette based on color blind mode
  let basePalette
  if (options.highContrast) {
    basePalette = options.darkMode ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT
  } else if (options.colorBlindMode === 'deuteranopia') {
    basePalette = DEUTERANOPIA_PALETTE
  } else if (options.colorBlindMode === 'protanopia') {
    basePalette = PROTANOPIA_PALETTE
  } else if (options.colorBlindMode === 'tritanopia') {
    basePalette = TRITANOPIA_PALETTE
  } else {
    basePalette = options.darkMode
      ? {
          name: 'Standard Dark',
          description: 'Standard dark theme',
          wcagLevel: 'AA' as const,
          contrastRatio: 4.5,
          colors: {
            primary: options.primaryColor,
            secondary: options.secondaryColor,
            accent: '#64748B',
            background: '#0F172A',
            surface: '#1E293B',
            foreground: '#F8FAFC',
            muted: '#475569',
            mutedForeground: '#CBD5E1',
            border: '#334155',
            success: '#22C55E',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
            destructive: '#EF4444',
          },
        }
      : {
          name: 'Standard Light',
          description: 'Standard light theme',
          wcagLevel: 'AA' as const,
          contrastRatio: 4.5,
          colors: {
            primary: options.primaryColor,
            secondary: options.secondaryColor,
            accent: '#94A3B8',
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
  }

  return {
    id: `theme-${Date.now()}`,
    name: basePalette.name,
    variant: options.highContrast ? 'high-contrast' : 'custom',
    colors: basePalette.colors,
    wcagLevel: basePalette.wcagLevel,
    contrastRatio: basePalette.contrastRatio,
  }
}

/**
 * Generate CSS pattern definitions for color blind safe patterns
 */
export function generatePatternDefs(variant: 'deuteranopia' | 'protanopia' | 'tritanopia'): string {
  const patternId = `pattern-${variant}`

  return `
    <defs>
      <!-- Success: Diagonal lines -->
      <pattern id="${patternId}-success" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="8" y2="8" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      </pattern>

      <!-- Warning: Dots -->
      <pattern id="${patternId}-warning" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.5" fill="currentColor" opacity="0.5"/>
      </pattern>

      <!-- Error: Horizontal lines -->
      <pattern id="${patternId}-error" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="2" x2="8" y2="2" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      </pattern>

      <!-- Info: Vertical lines -->
      <pattern id="${patternId}-info" x="0" y="0" width="4" height="8" patternUnits="userSpaceOnUse">
        <line x1="2" y1="0" x2="2" y2="8" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      </pattern>
    </defs>
  `
}

/**
 * Generate complete CSS theme file
 */
export function generateThemeCSS(theme: Theme): string {
  const variables = generateCSSVariables(theme)

  const additionalStyles = `
/* Extended theme styles */
:root {
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Monaco', 'Courier New', monospace;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

/* Light mode adjustments */
@media (prefers-color-scheme: light) {
  :root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Selection colors */
::selection {
  background-color: var(--primary);
  color: var(--background);
}
`

  return variables + '\n' + additionalStyles
}

/**
 * Export theme as JSON
 */
export function exportThemeAsJSON(theme: Theme): string {
  return JSON.stringify(theme, null, 2)
}

/**
 * Validate theme has proper contrast
 */
export function validateThemeContrast(theme: Theme): {
  valid: boolean
  issues: string[]
  ratios: Record<string, number>
} {
  const issues: string[] = []
  const ratios: Record<string, number> = {}

  // Check critical color pairs
  const colorPairs = [
    ['foreground', 'background'],
    ['primary', 'background'],
    ['secondary', 'background'],
    ['mutedForeground', 'surface'],
  ]

  colorPairs.forEach(([color1, color2]) => {
    const ratio = calculateContrastRatio(theme.colors[color1 as keyof typeof theme.colors], theme.colors[color2 as keyof typeof theme.colors])
    ratios[`${color1}-${color2}`] = parseFloat(ratio.toFixed(2))

    const wcagLevel = getWCAGLevel(ratio)
    if (wcagLevel === 'FAIL') {
      issues.push(`${color1} on ${color2}: ratio ${ratio.toFixed(2)} (fails WCAG A)`)
    } else if (wcagLevel === 'A') {
      issues.push(`${color1} on ${color2}: ratio ${ratio.toFixed(2)} (only meets WCAG A)`)
    }
  })

  return {
    valid: issues.length === 0,
    issues,
    ratios,
  }
}

/**
 * Create custom theme from user-provided colors
 */
export function createCustomTheme(config: CustomThemeConfig): Theme {
  const isDark = config.darkMode

  return generateThemeFromColor({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    darkMode: isDark,
    highContrast: config.highContrast,
    colorBlindMode: config.colorBlindMode,
  })
}
