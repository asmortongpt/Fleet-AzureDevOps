/**
 * UI/UX Pro Max Design System with Dark Mode Support
 *
 * Global design tokens, utilities, and configurations used by the Pro Max layout.
 * Includes comprehensive dark and light theme color palettes with WCAG AAA compliance.
 */

// ============================================================================
// COLOR PALETTE - Professional Tech (Fleet Management) - Light & Dark
// ============================================================================

/**
 * DARK MODE COLOR PALETTE
 * CTA Brand Colors: DAYTIME (#2F3359), BLUE SKIES (#41B2E3), MIDNIGHT (#1A0B2E),
 * NOON (#DD3903), GOLDEN HOUR (#F0A000)
 * Enhanced for WCAG AAA contrast (7:1 minimum)
 */
export const darkColors = {
  // Backgrounds
  background: '#0A0E27',      // MIDNIGHT darkened - main app background
  card: '#131B45',            // Lighter cards for visibility
  cardAlt: '#1A2554',         // Alternative card background
  cardHover: '#212D5A',       // Card hover state
  input: '#111638',           // Input field background
  overlay: 'rgba(10, 14, 39, 0.7)',

  // Text & Foreground
  foreground: '#FFFFFF',      // Pure white for max contrast
  foregroundMuted: '#D1D5DB', // Muted text (light gray)
  foregroundSecondary: '#B4BCD4', // Secondary text

  // Brand Colors
  primary: '#2F3359',         // DAYTIME Navy
  secondary: '#41B2E3',       // BLUE SKIES Cyan
  accent: '#DD3903',          // NOON Orange-Red
  warning: '#F0A000',         // GOLDEN HOUR Golden
  success: '#10B981',         // Emerald Green
  destructive: '#EF4444',     // Bright red for alerts

  // Borders
  border: 'rgba(65, 178, 227, 0.12)', // BLUE SKIES transparent
  borderHeavy: 'rgba(65, 178, 227, 0.25)',

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #41B2E3 0%, #2F3359 100%)',     // BLUE SKIES → DAYTIME
    accent: 'linear-gradient(90deg, #F0A000 0%, #DD3903 100%)',       // GOLDEN HOUR → NOON
    skyline: 'linear-gradient(90deg, #0080F0 0%, #41B2E3 25%, #F0A000 75%, #DD3903 100%)',
  },
};

/**
 * LIGHT MODE COLOR PALETTE
 * Optimized for light backgrounds with WCAG AAA contrast
 */
export const lightColors = {
  // Backgrounds
  background: '#FFFFFF',      // Pure white
  card: '#F9FAFB',           // Off-white card
  cardAlt: '#F3F4F6',        // Alternative card
  cardHover: '#ECECF1',      // Card hover
  input: '#F3F4F6',          // Input field
  overlay: 'rgba(255, 255, 255, 0.95)',

  // Text & Foreground
  foreground: '#0F172A',      // Dark navy text
  foregroundMuted: '#475569', // Muted text (dark gray)
  foregroundSecondary: '#64748B', // Secondary text

  // Brand Colors
  primary: '#1E40AF',         // Deep blue
  secondary: '#0284C7',       // Bright blue
  accent: '#DC2626',          // Deep red
  warning: '#B45309',         // Deep amber
  success: '#047857',         // Deep emerald
  destructive: '#991B1B',     // Deep red for alerts

  // Borders
  border: '#E2E8F0',          // Light gray
  borderHeavy: '#CBD5E1',     // Darker gray border

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0284C7 0%, #1E40AF 100%)',
    accent: 'linear-gradient(90deg, #FBBF24 0%, #DC2626 100%)',
    skyline: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 25%, #FBBF24 75%, #DC2626 100%)',
  },
};

export const colors = {
  // Primary - Blue Gray Professional
  primary: {
    50: 'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    200: 'var(--color-primary-200)',
    300: 'var(--color-primary-300)',
    400: 'var(--color-primary-400)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)',
    800: 'var(--color-primary-800)',
    900: 'var(--color-primary-900)',
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
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)',
    error: 'var(--color-error-500)',
    info: 'var(--color-info-500)',
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

export function glass(variant: keyof typeof glassEffect = 'card'): string {
  return glassEffect[variant]
}

export function gradient(color: keyof typeof colors.gradients): string {
  return `bg-gradient-to-r ${colors.gradients[color]}`
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
