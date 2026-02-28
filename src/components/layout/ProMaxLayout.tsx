/**
 * Pro Max Layout Wrapper
 *
 * Applies UI/UX Pro Max design system to the entire application
 * wrapping the existing CommandCenterLayout
 */

// motion removed - React 19 incompatible
import { ReactNode } from 'react'

interface ProMaxLayoutProps {
  children: ReactNode
}

export function ProMaxLayout({ children }: ProMaxLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <div className="relative z-10">
        <div>
          <style>
            {`
              /* Smooth transitions on all interactive elements */
              button, a, [role="button"] {
                transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
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
        </div>
      </div>
    </div>
  )
}
