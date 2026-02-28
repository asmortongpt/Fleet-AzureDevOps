import { BookOpen } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  helpArticle?: {
    title: string
    url: string
  }
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  helpArticle,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[400px] p-3 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 p-2 rounded-full bg-[#242424]/50" aria-hidden="true">
        {icon}
      </div>

      <h3 className="text-base font-semibold mb-2 text-white">{title}</h3>
      <p className="text-[rgba(255,255,255,0.40)] mb-3 max-w-md text-sm leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="lg">
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            size="lg"
            className="border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[#242424]"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {helpArticle && (
        <div className="mt-3 p-2 border border-[rgba(255,255,255,0.06)] rounded-lg bg-[#242424]/30 max-w-md">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-[#00CCFE] flex-shrink-0" />
            <span className="text-[rgba(255,255,255,0.65)]">New to this feature?</span>
            <a
              href={helpArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00CCFE] hover:underline font-medium"
            >
              {helpArticle.title} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
