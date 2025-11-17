/**
 * Teams Integration Hooks
 * React Query hooks for Microsoft Teams API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { TeamsChannel, TeamsMessage } from '@/types/microsoft'
import { useWebSocket } from './useWebSocket'
import { useEffect } from 'react'
import { toast } from 'sonner'

// ========== Query Keys ==========

const teamsKeys = {
  all: ['teams'] as const,
  teams: () => [...teamsKeys.all, 'list'] as const,
  team: (teamId: string) => [...teamsKeys.all, 'detail', teamId] as const,
  channels: (teamId: string) => [...teamsKeys.all, 'channels', teamId] as const,
  channel: (teamId: string, channelId: string) =>
    [...teamsKeys.all, 'channel', teamId, channelId] as const,
  messages: (teamId: string, channelId: string) =>
    [...teamsKeys.all, 'messages', teamId, channelId] as const,
  message: (teamId: string, channelId: string, messageId: string) =>
    [...teamsKeys.all, 'message', teamId, channelId, messageId] as const,
}

// ========== Teams Hooks ==========

/**
 * Fetch all teams
 */
export function useTeams() {
  return useQuery({
    queryKey: teamsKeys.teams(),
    queryFn: async () => {
      const response: any = await apiClient.teams.listTeams()
      return response.value || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch team by ID
 */
export function useTeam(teamId: string) {
  return useQuery({
    queryKey: teamsKeys.team(teamId),
    queryFn: async () => {
      return await apiClient.teams.getTeam(teamId)
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  })
}

// ========== Channels Hooks ==========

/**
 * Fetch channels for a team
 */
export function useTeamsChannels(teamId: string) {
  return useQuery({
    queryKey: teamsKeys.channels(teamId),
    queryFn: async () => {
      const response: any = await apiClient.teams.listChannels(teamId)
      return (response.value || []) as TeamsChannel[]
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a specific channel
 */
export function useTeamsChannel(teamId: string, channelId: string) {
  return useQuery({
    queryKey: teamsKeys.channel(teamId, channelId),
    queryFn: async () => {
      return await apiClient.teams.getChannel(teamId, channelId) as TeamsChannel
    },
    enabled: !!teamId && !!channelId,
    staleTime: 5 * 60 * 1000,
  })
}

// ========== Messages Hooks ==========

/**
 * Fetch messages for a channel with real-time updates
 */
export function useTeamsMessages(teamId: string, channelId: string, options?: {
  limit?: number
  enableRealtime?: boolean
}) {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const query = useQuery({
    queryKey: teamsKeys.messages(teamId, channelId),
    queryFn: async () => {
      const response: any = await apiClient.teams.listMessages(teamId, channelId, {
        $top: options?.limit || 50,
        $orderby: 'createdDateTime desc'
      })
      return (response.value || []) as TeamsMessage[]
    },
    enabled: !!teamId && !!channelId,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!options?.enableRealtime || !teamId || !channelId) return

    const unsubscribeNew = subscribe('teams:new-message', (message: any) => {
      if (message.data.teamId === teamId && message.data.channelId === channelId) {
        queryClient.setQueryData(
          teamsKeys.messages(teamId, channelId),
          (old: TeamsMessage[] = []) => [message.data.message, ...old]
        )
      }
    })

    const unsubscribeUpdated = subscribe('teams:message-updated', (message: any) => {
      if (message.data.teamId === teamId && message.data.channelId === channelId) {
        queryClient.setQueryData(
          teamsKeys.messages(teamId, channelId),
          (old: TeamsMessage[] = []) =>
            old.map(msg => msg.id === message.data.message.id ? message.data.message : msg)
        )
      }
    })

    const unsubscribeDeleted = subscribe('teams:message-deleted', (message: any) => {
      if (message.data.teamId === teamId && message.data.channelId === channelId) {
        queryClient.setQueryData(
          teamsKeys.messages(teamId, channelId),
          (old: TeamsMessage[] = []) =>
            old.filter(msg => msg.id !== message.data.messageId)
        )
      }
    })

    return () => {
      unsubscribeNew()
      unsubscribeUpdated()
      unsubscribeDeleted()
    }
  }, [teamId, channelId, options?.enableRealtime, subscribe, queryClient])

  return query
}

/**
 * Fetch a specific message
 */
export function useTeamsMessage(teamId: string, channelId: string, messageId: string) {
  return useQuery({
    queryKey: teamsKeys.message(teamId, channelId, messageId),
    queryFn: async () => {
      return await apiClient.teams.getMessage(teamId, channelId, messageId) as TeamsMessage
    },
    enabled: !!teamId && !!channelId && !!messageId,
  })
}

// ========== Mutations ==========

/**
 * Send a message to a Teams channel
 */
export function useSendTeamsMessage(teamId: string, channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      subject?: string
      content: string
      contentType?: 'text' | 'html'
      importance?: 'normal' | 'high' | 'urgent'
      mentions?: any[]
      attachments?: any[]
    }) => {
      return await apiClient.teams.sendMessage(teamId, channelId, {
        subject: data.subject,
        body: {
          contentType: data.contentType || 'html',
          content: data.content
        },
        importance: data.importance || 'normal',
        mentions: data.mentions,
        attachments: data.attachments
      })
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamsKeys.messages(teamId, channelId) })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(teamsKeys.messages(teamId, channelId))

      // Optimistically update to the new value
      const optimisticMessage: TeamsMessage = {
        id: `temp-${Date.now()}`,
        channelId,
        teamId,
        subject: newMessage.subject,
        content: newMessage.content,
        contentType: newMessage.contentType || 'text',
        author: {
          id: 'current-user',
          name: 'You'
        },
        createdAt: new Date().toISOString(),
        deliveryStatus: 'sending'
      }

      queryClient.setQueryData(
        teamsKeys.messages(teamId, channelId),
        (old: TeamsMessage[] = []) => [optimisticMessage, ...old]
      )

      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(teamsKeys.messages(teamId, channelId), context?.previousMessages)
      toast.error('Failed to send message')
    },
    onSuccess: () => {
      toast.success('Message sent successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: teamsKeys.messages(teamId, channelId) })
    },
  })
}

/**
 * Reply to a Teams message
 */
export function useReplyToTeamsMessage(teamId: string, channelId: string, messageId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      content: string
      contentType?: 'text' | 'html'
    }) => {
      return await apiClient.teams.replyToMessage(teamId, channelId, messageId, {
        body: {
          contentType: data.contentType || 'html',
          content: data.content
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.messages(teamId, channelId) })
      toast.success('Reply sent successfully')
    },
    onError: () => {
      toast.error('Failed to send reply')
    },
  })
}

/**
 * Delete a Teams message
 */
export function useDeleteTeamsMessage(teamId: string, channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiClient.teams.deleteMessage(teamId, channelId, messageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.messages(teamId, channelId) })
      toast.success('Message deleted')
    },
    onError: () => {
      toast.error('Failed to delete message')
    },
  })
}

/**
 * Add reaction to a message
 */
export function useAddTeamsReaction(teamId: string, channelId: string, messageId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reaction: string) => {
      return await apiClient.teams.addReaction(teamId, channelId, messageId, reaction)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.message(teamId, channelId, messageId) })
      queryClient.invalidateQueries({ queryKey: teamsKeys.messages(teamId, channelId) })
    },
  })
}

/**
 * Upload file to Teams channel
 */
export function useUploadTeamsFile(teamId: string, channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      return await apiClient.teams.uploadFile(teamId, channelId, file)
    },
    onSuccess: () => {
      toast.success('File uploaded successfully')
    },
    onError: () => {
      toast.error('Failed to upload file')
    },
  })
}

/**
 * Combined hook for Teams real-time updates and operations
 */
export function useTeamsRealtime(teamId: string, channelId: string) {
  const messages = useTeamsMessages(teamId, channelId, { enableRealtime: true })
  const sendMessage = useSendTeamsMessage(teamId, channelId)
  const replyToMessage = useReplyToTeamsMessage(teamId, channelId, '')
  const deleteMessage = useDeleteTeamsMessage(teamId, channelId)

  return {
    messages: messages.data || [],
    isLoading: messages.isLoading,
    isError: messages.isError,
    error: messages.error,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    replyToMessage: replyToMessage.mutate,
    deleteMessage: deleteMessage.mutate,
    refetch: messages.refetch
  }
}
