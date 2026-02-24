/**
 * Hook to manage contextual email compose dialog state.
 */

import { useState, useCallback } from 'react'
import type { EmailContext } from './email-templates'

export interface EmailComposeState {
  open: boolean
  to: string
  subject: string
  body: string
  context?: EmailContext
}

const DEFAULT_STATE: EmailComposeState = {
  open: false,
  to: '',
  subject: '',
  body: '',
  context: undefined,
}

export function useEmailCompose() {
  const [state, setState] = useState<EmailComposeState>(DEFAULT_STATE)

  const openCompose = useCallback(
    (opts: {
      to?: string
      subject?: string
      body?: string
      context?: EmailContext
    } = {}) => {
      setState({
        open: true,
        to: opts.to ?? '',
        subject: opts.subject ?? '',
        body: opts.body ?? '',
        context: opts.context,
      })
    },
    []
  )

  const closeCompose = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  const setOpen = useCallback((open: boolean) => {
    if (!open) {
      setState(DEFAULT_STATE)
    }
  }, [])

  return {
    ...state,
    openCompose,
    closeCompose,
    setOpen,
  }
}
