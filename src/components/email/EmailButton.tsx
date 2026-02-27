/**
 * Reusable Email Button that opens the ContextualEmailDialog.
 *
 * Two variants:
 * - icon-only (for tight spaces like dropdowns, card headers)
 * - icon + label (for action bars)
 */

import { Mail } from 'lucide-react'
import { useState } from 'react'


import { ContextualEmailDialog } from './ContextualEmailDialog'
import type { EmailContext } from './email-templates'
import { getEmailTemplate } from './email-templates'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmailButtonProps {
  /** Recipient email address */
  to?: string
  /** Pre-filled subject */
  subject?: string
  /** Pre-filled body text */
  body?: string
  /** Context for AI generation and template fallback */
  context?: EmailContext
  /** Show label alongside icon */
  label?: string
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  /** Button variant */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  /** Additional class names */
  className?: string
  /** Accessible label for icon-only mode */
  ariaLabel?: string
}

export function EmailButton({
  to,
  subject,
  body,
  context,
  label,
  size = 'sm',
  variant = 'ghost',
  className,
  ariaLabel,
}: EmailButtonProps) {
  const [open, setOpen] = useState(false)

  // Compute defaults: if subject/body not explicitly provided, derive from context
  const resolvedSubject = subject ?? (context ? getEmailTemplate(context).subject : '')
  const resolvedBody = body ?? ''

  return (
    <>
      <Button
        type="button"
        size={label ? size : 'icon'}
        variant={variant}
        className={cn(label ? 'gap-1.5' : 'h-8 w-8', className)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        title={ariaLabel ?? (label ? undefined : 'Send Email')}
        aria-label={ariaLabel ?? label ?? 'Send Email'}
      >
        <Mail className={cn(label ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        {label && <span>{label}</span>}
      </Button>

      <ContextualEmailDialog
        open={open}
        onOpenChange={setOpen}
        defaultTo={to ?? ''}
        defaultSubject={resolvedSubject}
        defaultBody={resolvedBody}
        context={context}
      />
    </>
  )
}
