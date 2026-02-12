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
        'rounded-xl border border-border/50 bg-card shadow-sm cta-card',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
