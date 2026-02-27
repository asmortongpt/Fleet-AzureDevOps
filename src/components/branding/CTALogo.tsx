/**
 * CTA (Capital Technology Alliance) Logo Component
 * Official branding with Charcoal (#242424) + White (#ffffff) color scheme
 *
 * Features:
 * - Official CTA logo with text
 * - Dark charcoal background with white text + gold accent bar
 * - Responsive design with multiple variants
 * - Accessible and SEO-friendly
 */

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface CTALogoProps {
  variant?: 'full' | 'compact' | 'icon'
  className?: string
  showAnimation?: boolean
  showTagline?: boolean
}

export function CTALogo({
  variant = 'full',
  className,
  showAnimation = false,
  showTagline = false
}: CTALogoProps) {
  // Official CTA color palette
  const colors = {
    charcoal: '#242424',    // Charcoal
    gold: '#ffffff',        // White
    white: '#FFFFFF',       // Text color
    darkGold: '#e0e0e0',   // Light gray hover state
  }

  // Animation variants
  const containerVariants = {
    hidden: showAnimation ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const accentBarVariants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.8, delay: 0.3 }
    }
  }

  const hoverVariants = {
    idle: {},
    hover: {
      boxShadow: `0 8px 24px ${colors.gold}40`
    }
  }

  // Full logo with text - official CTA branding
  if (variant === 'full') {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-4 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
          className
        )}
        style={{ backgroundColor: colors.charcoal }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        whileHover={{ boxShadow: `0 8px 24px ${colors.gold}40` }}
      >
        {/* CTA Icon with charcoal background */}
        <motion.div
          className="relative w-10 h-10 flex items-center justify-center flex-shrink-0"
          whileHover={{ scale: 1.08 }}
        >
          {/* Charcoal circle background */}
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.charcoal}ee 100%)`,
              border: `2px solid ${colors.gold}`,
            }}
          />

          {/* CTA text "C" */}
          <div
            className="relative z-10 text-lg font-black tracking-tighter"
            style={{ color: colors.white }}
          >
            CTA
          </div>
        </motion.div>

        {/* Text branding */}
        <div className="flex flex-col gap-0 leading-tight">
          <motion.div
            className="text-base font-black tracking-wide"
            style={{ color: colors.white }}
            whileHover={{ color: colors.gold }}
          >
            CAPITAL
          </motion.div>
          <motion.div
            className="text-xs font-bold tracking-widest opacity-90"
            style={{ color: colors.white }}
          >
            TECHNOLOGY ALLIANCE
          </motion.div>
        </div>

        {/* Accent bar */}
        <motion.div
          className="ml-2 h-8"
          style={{
            width: '3px',
            background: `linear-gradient(180deg, ${colors.gold} 0%, ${colors.darkGold} 100%)`,
            borderRadius: '2px',
            boxShadow: `0 0 8px ${colors.gold}80`
          }}
          variants={accentBarVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Tagline if enabled */}
        {showTagline && (
          <motion.span
            className="ml-2 text-xs font-semibold tracking-widest opacity-75"
            style={{ color: colors.gold }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: 0.6 }}
          >
            FLEET MANAGEMENT
          </motion.span>
        )}
      </motion.div>
    )
  }

  // Compact version - icon only
  if (variant === 'compact') {
    return (
      <motion.div
        className={cn(
          "relative w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0",
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.charcoal}ee 100%)`,
          border: `2px solid ${colors.gold}`,
          boxShadow: `0 4px 12px ${colors.gold}20`
        }}
        whileHover={{ scale: 1.1, boxShadow: `0 8px 20px ${colors.gold}40` }}
      >
        <div
          className="text-lg font-black tracking-tighter"
          style={{ color: colors.white }}
        >
          CTA
        </div>

        {/* Gold accent corner */}
        <motion.div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.gold }}
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    )
  }

  // Icon only - minimal version
  if (variant === 'icon') {
    return (
      <motion.div
        className={cn(
          "relative w-8 h-8 flex items-center justify-center rounded",
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.charcoal}dd 100%)`,
          border: `1.5px solid ${colors.gold}`,
        }}
        whileHover={{ scale: 1.12 }}
      >
        <div
          className="text-sm font-black tracking-tight"
          style={{ color: colors.white }}
        >
          C
        </div>
      </motion.div>
    )
  }

  // Default fallback
  return null
}

export default CTALogo
