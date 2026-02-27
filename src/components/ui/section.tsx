/**
 * Section — Content card with optional header
 *
 * Tesla/Rivian minimal: very subtle border, generous padding,
 * clean typography hierarchy. No visual decoration.
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
        'flex flex-col rounded-2xl bg-[#111111] border border-white/[0.04]',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04] text-white/40">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-[14px] font-semibold text-white">{title}</h3>
            {description ? (
              <p className="text-[12px] text-white/30 mt-0.5">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </section>
  )
}
