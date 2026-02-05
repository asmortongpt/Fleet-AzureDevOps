/**
 * Pro Max Layout Wrapper
 *
 * Applies UI/UX Pro Max design system to the entire application
 * wrapping the existing CommandCenterLayout
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'
import { glass } from '@/lib/design-system'

interface ProMaxLayoutProps {
  children: ReactNode
}

export function ProMaxLayout({ children }: ProMaxLayoutProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Animated background pattern */}
      <div className="fixed inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

      {/* Main content with glass effect */}
      <div className="relative z-10">
        <motion.div
          {...(!shouldReduceMotion && {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3 }
          })}
        >
          <style>
            {`
              /* Global Pro Max Styling */
              .glassmorphic-card {
                ${glass('card')}
              }

              /* Smooth transitions on all interactive elements */
              button, a, [role="button"] {
                transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
              }

              button:hover, a:hover, [role="button"]:hover {
                transform: translateY(-1px);
              }

              /* Enhanced shadows */
              .shadow-pro {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }

              .shadow-pro-lg {
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              }

              /* Professional gradient backgrounds */
              .bg-gradient-pro-blue {
                background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
              }

              .bg-gradient-pro-emerald {
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
              }

              .bg-gradient-pro-violet {
                background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
              }

              /* Glassmorphism utilities */
              .backdrop-glass {
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
              }

              /* Accessibility - respect reduced motion */
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `}
          </style>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
