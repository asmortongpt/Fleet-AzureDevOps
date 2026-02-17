/**
 * ARCHONY Fleet Logo
 * Official logo design with distinctive swoosh and professional branding
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ArchonYLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'text'
  className?: string
  showAnimation?: boolean
}

export function ArchonYLogo({
  variant = 'full',
  className,
  showAnimation = false
}: ArchonYLogoProps) {
  // Brand color palette from CLAUDE.md specification
  const colors = {
    navy: '#2F3359',         // Navy (official spec)
    orange: '#FF6B35',       // CTA Orange
    blue: '#41B2E3',         // Blue Skies
    gold: '#F0A000',         // Golden Hour
    red: '#DD3903',          // Noon Red
  }

  // Advanced animation variants with 3D effects
  const glowPulseAnimation = {
    initial: { opacity: 0.5 },
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } as any
  }

  const iconVariants = {
    idle: {
      scale: 1,
      filter: 'drop-shadow(0 0 12px rgba(65, 178, 227, 0.3))',
      rotateX: 0,
      rotateY: 0,
    },
    hover: {
      scale: 1.12,
      filter: 'drop-shadow(0 0 24px rgba(65, 178, 227, 0.8))',
      rotateX: 5,
      rotateY: 5,
    }
  }

  // Sophisticated multi-layer animation sequences
  const coreRotation = {
    animate: { rotate: 360 },
    transition: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } as any
  }

  const reverseRotation = {
    animate: { rotate: -360 },
    transition: { duration: 16, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } as any
  }

  // Full logo with text - OFFICIAL ARCHONY LOGO
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("inline-flex items-center", className)}
        initial={showAnimation ? { opacity: 0, x: -30, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img
          src="/logos/archony-approved-logo.svg"
          alt="ARCHONY - Intelligent Performance"
          className="h-auto"
          style={{ width: '100%', maxWidth: '700px' }}
        />
      </motion.div>
    )
  }

  // Compact version - compact horizontal logo
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn("inline-flex items-center", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <img
          src="/logos/archony-approved-logo.svg"
          alt="ARCHONY"
          className="h-auto"
          style={{ width: '100%', maxWidth: '280px' }}
        />
      </motion.div>
    )
  }

  // Icon only - simple "A" icon
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#41B2E3] text-white font-bold text-lg", className)}
        whileHover={{ scale: 1.1 }}
        initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        A
      </motion.div>
    )
  }

  // Text only variant
  return (
    <motion.div
      className={cn("flex flex-col gap-1", className)}
      initial={showAnimation ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-[#1D1D1D]">
          ARCHONY
        </span>
      </div>
      <span className="text-sm font-light tracking-wider text-[#666]">
        INTELLIGENT PERFORMANCE
      </span>
    </motion.div>
  )
}
