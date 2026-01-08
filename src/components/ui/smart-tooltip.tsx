import { Keyboard } from 'lucide-react'
import React from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SmartTooltipProps {
  content: string
  shortcut?: string // Keyboard shortcut (e.g., "Ctrl+N", "?")
  children: React.ReactNode
  delay?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

/**
 * SmartTooltip - Enhanced tooltip with keyboard shortcut support
 *
 * Wraps any element to show helpful information on hover.
 * Optionally displays keyboard shortcuts.
 *
 * @example
 * <SmartTooltip content="Add a new vehicle to your fleet" shortcut="Ctrl+N">
 *   <Button>
 *     <Plus className="h-4 w-4 mr-2" />
 *     Add Vehicle
 *   </Button>
 * </SmartTooltip>
 *
 * @example
 * <SmartTooltip content="Download report as PDF">
 *   <Button variant="ghost" size="icon">
 *     <Download className="h-4 w-4" />
 *   </Button>
 * </SmartTooltip>
 */
export function SmartTooltip({
  content,
  shortcut,
  children,
  delay = 300,
  side = 'top',
  className = '',
}: SmartTooltipProps) {
  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={`max-w-xs ${className}`}>
          <div className="space-y-1">
            <p className="text-sm">{content}</p>
            {shortcut && (
              <div className="flex items-center gap-1.5 pt-1 border-t text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" aria-hidden="true" />
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-background border rounded">
                  {shortcut}
                </kbd>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
