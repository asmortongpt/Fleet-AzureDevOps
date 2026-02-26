import React from 'react'

import { InfoPopover } from './info-popover'
import { Label } from './label'

interface FormFieldWithHelpProps {
  label: string
  helpText: string
  example?: string
  required?: boolean
  children: React.ReactNode
  error?: string
  helpTitle?: string
  learnMoreUrl?: string
}

export function FormFieldWithHelp({
  label,
  helpText,
  example,
  required,
  children,
  error,
  helpTitle,
  learnMoreUrl,
}: FormFieldWithHelpProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          {required && <span className="text-[#FF4300]">*</span>}
          <InfoPopover
            title={helpTitle || label}
            content={
              <div className="space-y-2">
                <p>{helpText}</p>
                {example && (
                  <div className="p-2 bg-[#221060] rounded text-xs">
                    <span className="font-semibold">Example: </span>
                    {example}
                  </div>
                )}
              </div>
            }
            learnMoreUrl={learnMoreUrl}
          />
        </Label>
      </div>

      {children}

      {error && (
        <p className="text-sm text-[#FF4300]">{error}</p>
      )}

      <p className="text-xs text-[rgba(255,255,255,0.40)]">{helpText}</p>
    </div>
  )
}
