/**
 * Section — Premium content card
 *
 * Glass background, colored icon badge in header,
 * subtle bottom shadow for depth, generous padding.
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
        'flex flex-col rounded-2xl overflow-hidden',
        className
      )}
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          {icon ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.15)',
                color: '#10b981',
              }}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description ? (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {/* Content */}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}
