/**
 * CTA Fleet Logo - Capital Technology Alliance branding
 * Clean dark theme SVG logos — no navy/purple/blue.
 */

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface CTAFleetLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'text'
  className?: string
  showAnimation?: boolean
}

/** Full inline SVG logo — charcoal bg, white CTA text, subtle accent bar */
function CTALogoFull({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 280 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      {/* CTA text */}
      <text x="0" y="42" fill="white" fontSize="48" fontWeight="900" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="-1">
        CTA
      </text>
      {/* Divider */}
      <rect x="120" y="10" width="1.5" height="40" rx="0.75" fill="rgba(255,255,255,0.15)" />
      {/* Company name */}
      <text x="132" y="22" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="600" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="1.5">
        CAPITAL TECHNOLOGY
      </text>
      <text x="132" y="38" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="600" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="1.5">
        ALLIANCE
      </text>
      {/* Accent bar */}
      <rect x="0" y="56" width="270" height="2" rx="1" fill="url(#ctaFullAccent)" />
      <defs>
        <linearGradient id="ctaFullAccent" x1="0" y1="57" x2="270" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.5)" />
          <stop offset="0.6" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Compact CTA icon — dark square with white text */
function CTALogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="6" fill="#242424" />
      <text x="16" y="20" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" textAnchor="middle" letterSpacing="0.5">
        CTA
      </text>
      <rect x="6" y="24" width="20" height="2" rx="1" fill="url(#ctaIconAccent)" />
      <defs>
        <linearGradient id="ctaIconAccent" x1="6" y1="25" x2="26" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.5)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function CTAFleetLogo({
  variant = 'full',
  className,
  showAnimation = false
}: CTAFleetLogoProps) {
  // Full logo
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("w-full h-auto", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <CTALogoFull className="w-full h-auto" />
      </motion.div>
    )
  }

  // Compact version for header bar
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn("w-full h-auto", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <CTALogoFull className="w-full h-auto" style={{ maxWidth: '220px' }} />
      </motion.div>
    )
  }

  // Icon only — CTA square mark
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("flex items-center justify-center", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <CTALogoIcon className="w-full h-full" />
      </motion.div>
    )
  }

  // Text only variant
  return (
    <motion.div
      className={cn("flex flex-col gap-1", className)}
      initial={showAnimation ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <span className="text-2xl font-black tracking-tight text-white">
        CTA FLEET
      </span>
      <span className="text-xs font-light tracking-wider text-[var(--text-secondary)]">
        CAPITAL TECHNOLOGY ALLIANCE
      </span>
    </motion.div>
  )
}
