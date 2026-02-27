/**
 * Section — Premium content card with glass depth
 *
 * Gradient background, subtle border glow on hover,
 * frosted header bar, smooth transitions.
 */
import React from 'react'

import { cn } from '@/lib/utils'

export interface SectionProps {
  title: React.ReactNode
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

export function Section({
  title,
  description,
  icon,
  actions,
  className,
  contentClassName,
  children,
}: SectionProps) {
  return (
    <section
      className={cn(
        'premium-section flex flex-col',
        className
      )}
    >
      <div className="section-header flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {icon ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-primary)',
              }}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description ? (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </section>
  )
}
