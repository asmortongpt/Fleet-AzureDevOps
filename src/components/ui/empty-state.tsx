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
      className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 p-4 rounded-full bg-muted/50" aria-hidden="true">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
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
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {helpArticle && (
        <div className="mt-8 p-4 border rounded-lg bg-muted/30 max-w-md">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">New to this feature?</span>
            <a
              href={helpArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {helpArticle.title} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
