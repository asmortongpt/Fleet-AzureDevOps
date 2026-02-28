/**
 * Fleet-CTA Design Tokens (TypeScript)
 * Mirrors CSS custom properties in design-tokens.css
 * Use for JS-side references (chart configs, dynamic styles, etc.)
 */

export const tokens = {
  surface: {
    0: 'var(--surface-0)',
    1: 'var(--surface-1)',
    2: 'var(--surface-2)',
    3: 'var(--surface-3)',
    4: 'var(--surface-4)',
    glass: 'var(--surface-glass)',
    glassHover: 'var(--surface-glass-hover)',
  },
  border: {
    subtle: 'var(--border-subtle)',
    default: 'var(--border-default)',
    strong: 'var(--border-strong)',
    focus: 'var(--border-focus)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
    muted: 'var(--text-muted)',
  },
  status: {
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    info: 'var(--status-info)',
    neutral: 'var(--status-neutral)',
  },
  accent: {
    primary: 'var(--accent-primary)',
    hover: 'var(--accent-hover)',
    muted: 'var(--accent-muted)',
  },
  chart: {
    colors: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#ec4899', '#a3e635'],
    grid: 'var(--border-subtle)',
    axis: 'var(--text-tertiary)',
    tooltip: {
      bg: 'var(--surface-3)',
      border: 'var(--border-default)',
      text: 'var(--text-primary)',
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
