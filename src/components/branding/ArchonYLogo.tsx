/**
 * CTA Fleet Logo - Capital Technology Alliance branding
 * Uses official logo images with clean filenames for cross-server compatibility
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
  // Full logo - CTA horizontal on light background
  if (variant === 'full') {
    return (
      <motion.div
        className={cn("w-full h-auto", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img
          src="/logos/approved-branding/cta-horizontal-light.png"
          alt="CTA - Capital Technology Alliance"
          className="w-full h-auto object-contain"
          style={{ maxWidth: '100%' }}
        />
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
        <img
          src="/logos/approved-branding/cta-horizontal-light.png"
          alt="CTA Fleet"
          className="w-full h-auto object-contain"
          style={{ maxWidth: '280px' }}
        />
      </motion.div>
    )
  }

  // Icon only - CTA square icon
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("flex items-center justify-center", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <img
          src="/logos/approved-branding/cta-icon-navy.png"
          alt="CTA"
          className="w-full h-full object-contain rounded"
        />
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
      <span className="text-2xl font-black tracking-tight text-[#1F3076]">
        CTA FLEET
      </span>
      <span className="text-xs font-light tracking-wider text-white/60">
        CAPITAL TECHNOLOGY ALLIANCE
      </span>
    </motion.div>
  )
}
