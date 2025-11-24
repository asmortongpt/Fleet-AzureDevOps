import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HubLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * HubLayout - Consistent layout for all hub pages
 *
 * Provides a standard structure with:
 * - Title and description header
 * - Responsive container
 * - Consistent spacing and styling
 */
export function HubLayout({ title, description, children, className }: HubLayoutProps) {
  return (
    <div className={cn("h-full flex flex-col p-6 space-y-6", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

interface HubSectionProps {
  children: React.ReactNode
  className?: string
}

/**
 * HubSection - Container for major sections within a hub
 */
export function HubSection({ children, className }: HubSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}

interface HubGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

/**
 * HubGrid - Responsive grid layout for hub content
 */
export function HubGrid({ children, columns = 2, className }: HubGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn("grid gap-6", gridClasses[columns], className)}>
      {children}
    </div>
  )
}

interface HubPanelProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * HubPanel - Card-based panel for hub content sections
 */
export function HubPanel({ title, description, children, className }: HubPanelProps) {
  return (
    <Card className={cn("h-full", className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={title || description ? "" : "pt-6"}>
        {children}
      </CardContent>
    </Card>
  )
}
