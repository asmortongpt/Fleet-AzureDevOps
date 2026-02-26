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
    info: 'text-[#00CCFE]',
    help: 'text-[rgba(255,255,255,0.65)]',
    warning: 'text-[#FDC016]',
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-3 h-3
                     ${iconColors[type]} hover:text-white
                     transition-colors rounded-full
                     hover:bg-[#2A1878] focus:outline-none focus:ring-2
                     focus:ring-[#00CCFE] focus:ring-offset-2 ${className}`}
          aria-label={`Help: ${title}`}
        >
          {icons[type]}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={placement}
        className="w-80 p-2 shadow-sm"
        sideOffset={5}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {icons[type]}
            {title}
          </h4>

          <div className="text-sm text-[rgba(255,255,255,0.40)] leading-relaxed">
            {content}
          </div>

          {(videoUrl || learnMoreUrl) && (
            <div className="pt-3 border-t space-y-2">
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00CCFE] hover:underline flex items-center gap-1.5 font-medium"
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
                  className="text-xs text-[#00CCFE] hover:underline flex items-center gap-1.5 font-medium"
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
