/**
 * Animation Variants Library - Fleet-CTA
 *
 * Production-ready animation presets using Framer Motion
 * Optimized for performance and accessibility
 *
 * Usage:
 * import { pageTransitionVariants, modalVariants } from '@/lib/animations/animation-variants'
 *
 * <motion.div
 *   variants={pageTransitionVariants}
 *   initial="hidden"
 *   animate="visible"
 *   exit="exit"
 * >
 *   Content
 * </motion.div>
 */

import { Variants } from 'framer-motion'

/**
 * Detect if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get safe transition config that respects prefers-reduced-motion
 */
export const getSafeTransition = (duration = 0.3): any => {
  if (prefersReducedMotion()) {
    return { duration: 0.01 }
  }
  return { duration, ease: 'easeOut' }
}

/* ============================================================================
 * PAGE & LAYOUT TRANSITIONS
 * ============================================================================ */

export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: getSafeTransition(0.4),
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: getSafeTransition(0.2),
  },
}

export const pageSlideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.4),
  },
  exit: { opacity: 0, x: 30, transition: getSafeTransition(0.2) },
}

export const pageSlideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.4),
  },
  exit: { opacity: 0, x: -30, transition: getSafeTransition(0.2) },
}

export const pageScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: getSafeTransition(0.4),
  },
  exit: { opacity: 0, scale: 0.95, transition: getSafeTransition(0.2) },
}

/* ============================================================================
 * MODAL & DIALOG TRANSITIONS
 * ============================================================================ */

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: getSafeTransition(0.2),
  },
  exit: { opacity: 0, transition: getSafeTransition(0.15) },
}

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      ...getSafeTransition(0.3),
    },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: getSafeTransition(0.15) },
}

export const sheetSlideVariants: Variants = {
  hidden: { opacity: 0, x: -400 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.3),
  },
  exit: { opacity: 0, x: -400, transition: getSafeTransition(0.2) },
}

/* ============================================================================
 * LIST & CONTAINER ANIMATIONS
 * ============================================================================ */

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      ...getSafeTransition(0.2),
    },
  },
  exit: { opacity: 0, transition: { staggerChildren: 0.02, staggerDirection: -1 } },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.2),
  },
  exit: { opacity: 0, x: -20, transition: getSafeTransition(0.1) },
}

export const gridItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: getSafeTransition(0.2),
  },
  exit: { opacity: 0, scale: 0.9, transition: getSafeTransition(0.1) },
}

/* ============================================================================
 * CARD & COMPONENT ANIMATIONS
 * ============================================================================ */

export const cardHoverVariants: Variants = {
  initial: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
    transition: getSafeTransition(0.2),
  },
}

export const cardTapVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
}

export const expandableCardVariants: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: getSafeTransition(0.3),
  },
}

/* ============================================================================
 * BUTTON & INTERACTIVE ANIMATIONS
 * ============================================================================ */

export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: getSafeTransition(0.15) },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
}

export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: 4,
    opacity: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

/* ============================================================================
 * STATUS & INDICATOR ANIMATIONS
 * ============================================================================ */

export const pulseVariants: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const glowVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 5px rgba(65, 178, 227, 0)',
      '0 0 20px rgba(65, 178, 227, 0.5)',
      '0 0 5px rgba(65, 178, 227, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const statusIndicatorVariants: Variants = {
  online: {
    scale: 1,
    boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
  },
  offline: {
    scale: 1,
    boxShadow: '0 0 0px rgba(107, 114, 128, 0)',
  },
  warning: {
    scale: [1, 1.2, 1],
    boxShadow: [
      '0 0 10px rgba(245, 158, 11, 0)',
      '0 0 20px rgba(245, 158, 11, 0.6)',
      '0 0 10px rgba(245, 158, 11, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  critical: {
    scale: [1, 1.15, 1],
    boxShadow: [
      '0 0 10px rgba(239, 68, 68, 0)',
      '0 0 25px rgba(239, 68, 68, 0.8)',
      '0 0 10px rgba(239, 68, 68, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

/* ============================================================================
 * DROPDOWN & MENU ANIMATIONS
 * ============================================================================ */

export const dropdownMenuVariants: Variants = {
  hidden: { opacity: 0, y: -8, pointerEvents: 'none' },
  visible: {
    opacity: 1,
    y: 0,
    pointerEvents: 'auto',
    transition: getSafeTransition(0.15),
  },
  exit: { opacity: 0, y: -8, pointerEvents: 'none', transition: getSafeTransition(0.1) },
}

export const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.1),
  },
}

/* ============================================================================
 * ACCORDION & COLLAPSIBLE ANIMATIONS
 * ============================================================================ */

export const accordionItemVariants: Variants = {
  collapsed: { height: 0, opacity: 0, marginBottom: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    marginBottom: 16,
    transition: {
      height: getSafeTransition(0.3),
      opacity: getSafeTransition(0.3),
      marginBottom: getSafeTransition(0.3),
    },
  },
}

export const accordionContentVariants: Variants = {
  collapsed: { opacity: 0, scale: 0.95 },
  expanded: {
    opacity: 1,
    scale: 1,
    transition: getSafeTransition(0.2),
  },
}

/* ============================================================================
 * LOADING & SKELETON ANIMATIONS
 * ============================================================================ */

export const skeletonShimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const fadeInLoadingVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: getSafeTransition(0.3),
  },
}

/* ============================================================================
 * NOTIFICATION & TOAST ANIMATIONS
 * ============================================================================ */

export const toastEnterVariants: Variants = {
  hidden: { opacity: 0, x: 100, y: 0 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      ...getSafeTransition(0.3),
    },
  },
}

export const toastExitVariants: Variants = {
  exit: {
    opacity: 0,
    x: 100,
    y: 0,
    transition: getSafeTransition(0.2),
  },
}

export const toastProgressVariants: Variants = {
  initial: { width: '100%' },
  animate: {
    width: '0%',
    transition: {
      duration: 4,
      ease: 'linear',
    },
  },
}

/* ============================================================================
 * BACKDROP & OVERLAY ANIMATIONS
 * ============================================================================ */

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: getSafeTransition(0.2),
  },
  exit: { opacity: 0, transition: getSafeTransition(0.15) },
}

/* ============================================================================
 * TEXT & CONTENT ANIMATIONS
 * ============================================================================ */

export const fadeInTextVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: getSafeTransition(0.4),
  },
}

export const slideInTextVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: getSafeTransition(0.3),
  },
}

/* ============================================================================
 * COMPOUND ANIMATION SETS
 * ============================================================================ */

/**
 * Complete modal animation set
 * Usage: Wrap modal with AnimatePresence, apply modalVariants.overlay to backdrop,
 * modalVariants.content to content div
 */
export const modalVariants = {
  overlay: modalOverlayVariants,
  content: modalContentVariants,
}

/**
 * Complete list animation set with stagger
 * Usage: Apply to container and items
 */
export const listVariants = {
  container: listContainerVariants,
  item: listItemVariants,
}

/**
 * Complete page transition set
 * Usage: Wrap routes with AnimatePresence, apply to page root
 */
export const pageVariants = {
  default: pageTransitionVariants,
  slideLeft: pageSlideLeftVariants,
  slideRight: pageSlideRightVariants,
  scale: pageScaleVariants,
}

/**
 * Complete card animation set
 * Usage: Apply hover variant on hover, tap variant on tap
 */
export const cardVariants = {
  hover: cardHoverVariants,
  tap: cardTapVariants,
  expandable: expandableCardVariants,
}
