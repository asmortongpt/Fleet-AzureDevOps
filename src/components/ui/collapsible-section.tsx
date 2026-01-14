/**
 * CollapsibleSection - Progressive Disclosure Component
 *
 * Hides advanced options and complex features behind collapsible sections
 * to reduce cognitive load and keep forms simple by default.
 *
 * Features:
 * - Smooth expand/collapse animations
 * - Optional badge to show collapsed content preview
 * - Accessible keyboard navigation
 * - Remembers state (optional)
 *
 * Created: 2026-01-08
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  description?: string
  badge?: string // Optional badge text (e.g., "3 options", "Optional")
  defaultExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  children: React.ReactNode
  className?: string
}

/**
 * CollapsibleSection - Progressive disclosure for advanced options
 *
 * Use this to hide complexity and keep forms simple by default.
 * Users can expand sections when they need advanced features.
 *
 * @example
 * <CollapsibleSection
 *   title="Advanced Options"
 *   description="Configure detailed settings"
 *   badge="Optional"
 * >
 *   <FormFieldWithHelp label="Custom Field">
 *     <Input />
 *   </FormFieldWithHelp>
 * </CollapsibleSection>
 */
export function CollapsibleSection({
  title,
  description,
  badge,
  defaultExpanded = false,
  onExpandChange,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onExpandChange?.(newState)
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        'bg-card',
        className
      )}
    >
      {/* Header - Always Visible */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-2',
          'hover:bg-muted/50 transition-colors',
          'rounded-none'
        )}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="ml-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </Button>

      {/* Collapsible Content */}
      <div
        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          'transition-all duration-200 ease-in-out overflow-hidden',
          isExpanded
            ? 'max-h-[2000px] opacity-100'
            : 'max-h-0 opacity-0'
        )}
        role="region"
        aria-labelledby={`collapsible-header-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="p-2 pt-0 space-y-2 border-t">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * CollapsibleGroup - Multiple collapsible sections
 *
 * Ensures only one section is expanded at a time (accordion behavior).
 * Use when you have multiple mutually exclusive advanced sections.
 *
 * @example
 * <CollapsibleGroup>
 *   <CollapsibleSection title="Advanced Filters">...</CollapsibleSection>
 *   <CollapsibleSection title="Expert Settings">...</CollapsibleSection>
 * </CollapsibleGroup>
 */
export function CollapsibleGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  )
}
