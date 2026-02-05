/**
 * UI/UX Pro Max Design System
 *
 * Global design tokens, utilities, and configurations based on
 * the ui-ux-pro-max-skill design principles
 */

// ============================================================================
// COLOR PALETTE - Professional Tech (Fleet Management)
// ============================================================================

export const colors = {
  // Primary - Blue Gray Professional
  primary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Accent Gradients
  gradients: {
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'from-violet-500 to-purple-500',
    orange: 'from-orange-500 to-amber-500',
    rose: 'from-rose-500 to-pink-500',
  },

  // Status Colors (WCAG AA Compliant)
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
}

// ============================================================================
// GLASSMORPHISM UTILITY
// ============================================================================

export const glassEffect = {
  light: 'backdrop-blur-xl bg-white/80 border border-white/20',
  medium: 'backdrop-blur-xl bg-white/70 border border-white/20',
  dark: 'backdrop-blur-xl bg-slate-900/80 border border-slate-800/20',
  card: 'backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/20',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function glass(variant: 'light' | 'medium' | 'dark' | 'card' = 'card'): string {
  return glassEffect[variant]
}

export function gradient(color: 'blue' | 'emerald' | 'violet' | 'orange' | 'rose'): string {
  return `bg-gradient-to-r ${colors.gradients[color]}`
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
