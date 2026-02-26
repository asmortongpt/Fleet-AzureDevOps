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
        'flex flex-col rounded-xl border border-[rgba(0,204,254,0.08)] bg-[#221060] shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(0,204,254,0.06)] px-3 py-1.5">
        <div className="flex items-center gap-2">
          {icon ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2A1878] text-[rgba(255,255,255,0.65)]">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="font-['Montserrat',sans-serif] font-semibold text-lg text-white">{title}</h3>
            {description ? (
              <p className="text-[11px] text-[rgba(255,255,255,0.65)]">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('p-2', contentClassName)}>{children}</div>
    </section>
  )
}
