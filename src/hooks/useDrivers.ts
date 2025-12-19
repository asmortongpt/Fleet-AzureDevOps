import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

export interface Driver {
  id: number
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: Date
  licenseClass: string
  status: 'active' | 'inactive' | 'suspended'
  photoUrl?: string
  azureAdId?: string
  assignedVehicleId?: number
  rating: number
  totalTrips: number
  totalMiles: number
  safetyScore: number
  hireDate: Date
}

export function useDrivers(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: async () => {
      const response = await api.get('/drivers', { params })
      return response.data
    },
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      const response = await api.get(`/drivers/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Driver>) => {
      const response = await api.post('/drivers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Driver> }) => {
      const response = await api.put(`/drivers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/drivers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
  })
}
