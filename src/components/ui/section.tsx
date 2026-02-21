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
        'flex flex-col rounded-lg border border-white/[0.08] bg-[#242424] shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-1.5">
        <div className="flex items-center gap-2">
          {icon ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06] text-white/60">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="text-[11px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('p-2', contentClassName)}>{children}</div>
    </section>
  )
}
