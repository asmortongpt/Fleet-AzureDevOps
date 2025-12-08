import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

export interface Vehicle {
  id: number
  vehicleNumber: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: 'active' | 'maintenance' | 'retired'
  mileage: number
  fuelType: string
  location: string
}

export function useVehicles(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: async () => {
      const response = await api.get('/vehicles', { params })
      return response.data
    },
  })
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const response = await api.get(`/vehicles/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      const response = await api.post('/vehicles', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Vehicle> }) => {
      const response = await api.put(`/vehicles/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/vehicles/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
