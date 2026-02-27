/**
 * Fleet-CTA Design Tokens (TypeScript)
 * Mirrors CSS custom properties in design-tokens.css
 * Use for JS-side references (chart configs, dynamic styles, etc.)
 */

export const tokens = {
  surface: {
    0: '#09090b',
    1: '#0c0c0e',
    2: '#111113',
    3: '#18181b',
    4: '#1e1e22',
    glass: 'rgba(255, 255, 255, 0.03)',
    glassHover: 'rgba(255, 255, 255, 0.06)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.12)',
    focus: 'rgba(16, 185, 129, 0.5)',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.92)',
    secondary: 'rgba(255, 255, 255, 0.64)',
    tertiary: 'rgba(255, 255, 255, 0.40)',
    muted: 'rgba(255, 255, 255, 0.24)',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    neutral: 'rgba(255, 255, 255, 0.40)',
  },
  accent: {
    primary: '#10b981',
    hover: '#059669',
    muted: 'rgba(16, 185, 129, 0.15)',
  },
  chart: {
    colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'],
    grid: 'rgba(255, 255, 255, 0.06)',
    axis: 'rgba(255, 255, 255, 0.40)',
    tooltip: {
      bg: '#18181b',
      border: 'rgba(255, 255, 255, 0.08)',
      text: 'rgba(255, 255, 255, 0.92)',
    },
  },
  animation: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    durationFast: 150,
    durationNormal: 250,
    durationSlow: 400,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const

export type Tokens = typeof tokens
