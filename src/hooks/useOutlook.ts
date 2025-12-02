/**
 * Outlook Integration Hooks
 * React Query hooks for Microsoft Outlook API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { OutlookEmail, OutlookFolder, EmailDraft } from '@/types/microsoft'
import { useWebSocket } from './useWebSocket'
import { useEffect } from 'react'
import { toast } from 'sonner'

// ========== Query Keys ==========

const outlookKeys = {
  all: ['outlook'] as const,
  folders: () => [...outlookKeys.all, 'folders'] as const,
  folder: (folderId: string) => [...outlookKeys.all, 'folder', folderId] as const,
  messages: (filter?: any) => [...outlookKeys.all, 'messages', filter] as const,
  message: (messageId: string) => [...outlookKeys.all, 'message', messageId] as const,
}

// ========== Folders Hooks ==========

export function useOutlookFolders() {
  return useQuery({
    queryKey: outlookKeys.folders(),
    queryFn: async () => {
      const response: any = await apiClient.outlook.listFolders()
      return (response.value || []) as OutlookFolder[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useOutlookFolder(folderId: string) {
  return useQuery({
    queryKey: outlookKeys.folder(folderId),
    queryFn: async () => {
      return await apiClient.outlook.getFolder(folderId) as OutlookFolder
    },
    enabled: !!folderId,
  })
}

// ========== Messages Hooks ==========

export function useEmails(filter?: {
  folderId?: string
  isRead?: boolean
  category?: string
  search?: string
  top?: number
  skip?: number
}) {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const query = useQuery({
    queryKey: outlookKeys.messages(filter),
    queryFn: async () => {
      const params: any = {}
      if (filter?.top) params.$top = filter.top
      if (filter?.skip) params.$skip = filter.skip
      if (filter?.search) params.$search = `"${filter.search}"`
      if (filter?.folderId) params.$filter = `parentFolderId eq '${filter.folderId}'`
      if (filter?.isRead !== undefined) {
        params.$filter = params.$filter
          ? `${params.$filter} and isRead eq ${filter.isRead}`
          : `isRead eq ${filter.isRead}`
      }
      if (filter?.category) {
        params.$filter = params.$filter
          ? `${params.$filter} and categories/any(c: c eq '${filter.category}')`
          : `categories/any(c: c eq '${filter.category}')`
      }
      params.$orderby = 'receivedDateTime desc'

      const response: any = await apiClient.outlook.listMessages(params)
      return (response.value || []) as OutlookEmail[]
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  })

  // Real-time updates
  useEffect(() => {
    const unsubscribeNew = subscribe('outlook:new-email', (message: any) => {
      queryClient.setQueryData(
        outlookKeys.messages(filter),
        (old: OutlookEmail[] = []) => [message.data?.email, ...old]
      )

      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('New Email', {
          body: `${message.data?.email.from.name}: ${message.data?.email.subject}`,
          icon: '/icons/email.png',
          tag: message.data?.email.id
        })
      }

      toast.info(`New email from ${message.data?.email.from.name}`)
    })

    const unsubscribeUpdated = subscribe('outlook:email-updated', (message: any) => {
      queryClient.setQueryData(
        outlookKeys.messages(filter),
        (old: OutlookEmail[] = []) =>
          old.map(email => email.id === message.data?.email.id ? message.data?.email : email)
      )
    })

    return () => {
      unsubscribeNew()
      unsubscribeUpdated()
    }
  }, [filter, subscribe, queryClient])

  return query
}

export function useEmail(messageId: string) {
  return useQuery({
    queryKey: outlookKeys.message(messageId),
    queryFn: async () => {
      return await apiClient.outlook.getMessage(messageId) as OutlookEmail
    },
    enabled: !!messageId,
  })
}

// ========== Mutations ==========

export function useSendEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draft: EmailDraft) => {
      return await apiClient.outlook.sendEmail({
        message: {
          subject: draft.subject,
          body: {
            contentType: draft.bodyType || 'HTML',
            content: draft.body
          },
          toRecipients: draft.to.map(email => ({
            emailAddress: { address: email }
          })),
          ccRecipients: draft.cc?.map(email => ({
            emailAddress: { address: email }
          })),
          bccRecipients: draft.bcc?.map(email => ({
            emailAddress: { address: email }
          })),
          importance: draft.importance || 'normal'
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outlookKeys.all })
      toast.success('Email sent successfully')
    },
    onError: () => {
      toast.error('Failed to send email')
    },
  })
}

export function useReplyEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, comment }: { messageId: string; comment: string }) => {
      return await apiClient.outlook.replyToEmail(messageId, {
        message: {
          body: {
            contentType: 'HTML',
            content: comment
          }
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outlookKeys.all })
      toast.success('Reply sent successfully')
    },
    onError: () => {
      toast.error('Failed to send reply')
    },
  })
}

export function useForwardEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, to, comment }: {
      messageId: string
      to: string[]
      comment?: string
    }) => {
      return await apiClient.outlook.forwardEmail(messageId, {
        toRecipients: to.map(email => ({ emailAddress: { address: email } })),
        comment
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outlookKeys.all })
      toast.success('Email forwarded successfully')
    },
    onError: () => {
      toast.error('Failed to forward email')
    },
  })
}

export function useDeleteEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiClient.outlook.deleteEmail(messageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outlookKeys.all })
      toast.success('Email deleted')
    },
    onError: () => {
      toast.error('Failed to delete email')
    },
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiClient.outlook.markAsRead(messageId)
    },
    onSuccess: (_, messageId) => {
      queryClient.setQueriesData(
        { queryKey: outlookKeys.all },
        (old: any) => {
          if (Array.isArray(old)) {
            return old.map((email: OutlookEmail) =>
              email.id === messageId ? { ...email, isRead: true } : email
            )
          }
          return old
        }
      )
    },
  })
}

export function useMoveEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, destinationId }: {
      messageId: string
      destinationId: string
    }) => {
      return await apiClient.outlook.moveEmail(messageId, destinationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outlookKeys.all })
      toast.success('Email moved')
    },
    onError: () => {
      toast.error('Failed to move email')
    },
  })
}

/**
 * Combined hook for Outlook operations
 */
export function useOutlookRealtime(filter?: any) {
  const emails = useEmails(filter)
  const sendEmail = useSendEmail()
  const replyEmail = useReplyEmail()
  const deleteEmail = useDeleteEmail()
  const markAsRead = useMarkAsRead()

  return {
    emails: emails.data || [],
    isLoading: emails.isLoading,
    isError: emails.isError,
    error: emails.error,
    sendEmail: sendEmail.mutate,
    isSending: sendEmail.isPending,
    replyEmail: replyEmail.mutate,
    deleteEmail: deleteEmail.mutate,
    markAsRead: markAsRead.mutate,
    refetch: emails.refetch
  }
}
