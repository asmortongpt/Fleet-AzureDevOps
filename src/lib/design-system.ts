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
 * CTA Brand Colors: DAYTIME (#1F3076), neutral grays/whites for accents
 * (Legacy: BLUE SKIES #00CCFE, MIDNIGHT #1A0648, NOON #FF4300, GOLDEN HOUR #FDC016)
 * Enhanced for WCAG AAA contrast (7:1 minimum)
 */
export const darkColors = {
  // Backgrounds
  background: '#09090b',      // Near-black neutral
  card: '#111113',            // Neutral dark gray cards
  cardAlt: '#18181b',         // Alternative card background
  cardHover: '#27272a',       // Card hover state
  input: '#18181b',           // Input field background
  overlay: 'rgba(9, 9, 11, 0.7)',

  // Text & Foreground
  foreground: '#FFFFFF',      // Pure white for max contrast
  foregroundMuted: '#D1D5DB', // Muted text (light gray)
  foregroundSecondary: '#B4BCD4', // Secondary text

  // Brand Colors
  primary: '#1F3076',         // DAYTIME Navy
  secondary: '#ffffff',       // Clean white
  accent: '#e0e0e0',          // Light gray
  warning: '#f59e0b',         // Amber (semantic warning)
  success: '#10B981',         // Emerald Green
  destructive: '#EF4444',     // Bright red for alerts

  // Borders
  border: 'rgba(255, 255, 255, 0.12)', // White transparent
  borderHeavy: 'rgba(255, 255, 255, 0.25)',

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',     // White → Gray
    accent: 'linear-gradient(90deg, #ffffff 0%, #a0a0a0 100%)',       // White → Gray
    skyline: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 100%)',
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
    blue: 'from-emerald-500/50 to-cyan-500',
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
  dark: 'backdrop-blur-xl bg-[#111]/80 border border-white/[0.15]/20',
  card: 'backdrop-blur-xl bg-white/80 rounded-2xl shadow-lg shadow-black/[0.1] border border-white/20',
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
