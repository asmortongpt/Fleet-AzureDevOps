/**
 * ARCHONY Fleet Logo
 * Official logo - uses exact image provided by user
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
  // Full logo - official ARCHONY image
  if (variant === 'full') {
    return (
      <motion.img
        src="/logos/approved-branding/Screenshot 2026-02-15 at 4.05.10 PM.png"
        alt="ARCHONY - Intelligent Performance"
        className={cn("w-full h-auto object-contain", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ maxWidth: '100%' }}
      />
    )
  }

  // Compact version - uses same official image, scaled down
  if (variant === 'compact') {
    return (
      <motion.img
        src="/logos/approved-branding/Screenshot 2026-02-15 at 4.05.10 PM.png"
        alt="ARCHONY"
        className={cn("w-full h-auto object-contain", className)}
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ maxWidth: '280px' }}
      />
    )
  }

  // Icon only - simple "A"
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn("w-10 h-10 flex items-center justify-center font-black text-lg text-white bg-black rounded", className)}
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
      transition={{ duration: 0.6 }}
    >
      <span className="text-2xl font-black tracking-tight text-[#1D1D1D]">
        ARCHONY
      </span>
      <span className="text-xs font-light tracking-wider text-[#666]">
        INTELLIGENT PERFORMANCE
      </span>
    </motion.div>
  )
}
