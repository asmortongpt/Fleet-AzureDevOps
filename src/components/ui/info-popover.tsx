import { Info, HelpCircle, AlertCircle, ExternalLink, PlayCircle } from 'lucide-react'
import React from 'react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface InfoPopoverProps {
  title: string
  content: string | React.ReactNode
  type?: 'info' | 'help' | 'warning'
  learnMoreUrl?: string
  videoUrl?: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

/**
 * InfoPopover - Contextual help component
 *
 * Displays helpful information in a popover when clicked.
 * Use this next to form fields, buttons, or any UI element that needs explanation.
 *
 * @example
 * <InfoPopover
 *   title="Damage Severity"
 *   content="Choose the appropriate severity level based on repair urgency"
 *   type="help"
 *   learnMoreUrl="/docs/damage-reports#severity"
 * />
 */
export function InfoPopover({
  title,
  content,
  type = 'info',
  learnMoreUrl,
  videoUrl,
  placement = 'right',
  className = '',
}: InfoPopoverProps) {
  const icons = {
    info: <Info className="h-4 w-4" aria-hidden="true" />,
    help: <HelpCircle className="h-4 w-4" aria-hidden="true" />,
    warning: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
  }

  const iconColors = {
    info: 'text-[#1e40af] dark:text-blue-400',
    help: 'text-[#334155] dark:text-slate-400',
    warning: 'text-[#b45309] dark:text-amber-400',
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-5 h-5
                     ${iconColors[type]} hover:text-foreground
                     transition-colors rounded-full
                     hover:bg-muted focus:outline-none focus:ring-2
                     focus:ring-ring focus:ring-offset-2 ${className}`}
          aria-label={`Help: ${title}`}
        >
          {icons[type]}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={placement}
        className="w-80 p-4 shadow-lg"
        sideOffset={5}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {icons[type]}
            {title}
          </h4>

          <div className="text-sm text-muted-foreground leading-relaxed">
            {content}
          </div>

          {(videoUrl || learnMoreUrl) && (
            <div className="pt-3 border-t space-y-2">
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Watch 2-minute tutorial
                </a>
              )}

              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Learn more in documentation
                </a>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
