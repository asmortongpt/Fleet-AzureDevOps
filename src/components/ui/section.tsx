import React from 'react'

import { cn } from '@/lib/utils'

export interface SectionProps {
  title: string
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
        'relative rounded-xl border border-[rgba(240,160,0,0.1)] bg-card/80 backdrop-blur-md shadow-lg hover:shadow-xl hover:border-[#F0A000]/25 transition-all duration-300 cta-card animate-fade-in-up',
        className
      )}
    >
      {/* Gold gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(240, 160, 0, 0.5) 30%, rgba(240, 160, 0, 0.6) 50%, rgba(240, 160, 0, 0.5) 70%, transparent 95%)' }} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4" style={{ background: 'linear-gradient(180deg, rgba(240, 160, 0, 0.03) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3">
          {icon ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #F0A000, #3B82F6)', border: '1px solid rgba(240, 160, 0, 0.3)', boxShadow: '0 4px 12px rgba(240, 160, 0, 0.2)' }}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}
