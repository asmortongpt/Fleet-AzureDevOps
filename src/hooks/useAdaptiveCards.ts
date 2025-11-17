/**
 * Adaptive Cards Hooks
 */

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export function useSendMaintenanceCard() {
  return useMutation({
    mutationFn: async (data: {
      teamId: string
      channelId: string
      vehicleNumber: string
      serviceType: string
      dueDate: string
    }) => await apiClient.adaptiveCards.sendMaintenanceCard(data.teamId, data.channelId, data),
    onSuccess: () => toast.success('Maintenance card sent'),
    onError: () => toast.error('Failed to send card'),
  })
}

export function useSendWorkOrderCard() {
  return useMutation({
    mutationFn: async (data: {
      teamId: string
      channelId: string
      workOrderId: string
      priority: string
    }) => await apiClient.adaptiveCards.sendWorkOrderCard(data.teamId, data.channelId, data),
    onSuccess: () => toast.success('Work order card sent'),
    onError: () => toast.error('Failed to send card'),
  })
}

export function useSendApprovalCard() {
  return useMutation({
    mutationFn: async (data: {
      teamId: string
      channelId: string
      title: string
      description: string
    }) => await apiClient.adaptiveCards.sendApprovalCard(data.teamId, data.channelId, data),
    onSuccess: () => toast.success('Approval card sent'),
    onError: () => toast.error('Failed to send card'),
  })
}
