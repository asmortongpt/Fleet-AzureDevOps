import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from "@/lib/api"

export interface Driver {
  id: number | string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry?: Date | string
  licenseClass?: string
  licenseState?: string
  status: 'active' | 'inactive' | 'suspended'
  photoUrl?: string
  azureAdId?: string
  assignedVehicleId?: number
  department?: string
  employeeId?: string
  rating?: number
  totalTrips?: number
  totalMiles?: number
  safetyScore?: number
  hireDate?: Date | string
}

const mapDriverRow = (row: any): Driver => {
  const metadata = row?.metadata && typeof row.metadata === 'object'
    ? row.metadata
    : row?.metadata
      ? (() => {
          try {
            return JSON.parse(row.metadata)
          } catch {
            return {}
          }
        })()
      : {}

  const fullName = row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim()

  const status =
    row.status === 'on_leave'
      ? 'inactive'
      : row.status === 'terminated'
        ? 'inactive'
        : row.status || 'active'

  return {
    id: row.id,
    name: fullName || row.email || 'Unknown Driver',
    email: row.email,
    phone: row.phone,
    licenseNumber: row.license_number || row.licenseNumber || '',
    licenseExpiry: row.license_expiry_date,
    licenseClass: row.cdl ? 'CDL' : 'Standard',
    licenseState: row.license_state,
    status,
    department: metadata.department,
    employeeId: row.employee_number,
    rating: metadata.rating,
    totalTrips: metadata.totalTrips,
    totalMiles: metadata.totalMiles,
    safetyScore: row.performance_score ? Number(row.performance_score) : undefined,
    hireDate: row.hire_date
  }
}

const normalizeStatusForApi = (status?: string) => {
  if (!status) return status
  if (status === 'off-duty') return 'inactive'
  if (status === 'on-leave') return 'on_leave'
  return status
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
      const response = await api.get('/drivers', params)
      const rows = Array.isArray(response) ? response : (response?.data || [])
      return rows.map(mapDriverRow)
    },
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      const response = await (api.get as <T>(endpoint: string) => Promise<T>)(`/drivers/${id}`)
      return mapDriverRow(response)
    },
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Driver>) => {
      const [firstName, ...lastParts] = (data.name || '').trim().split(' ')
      const payload = {
        name: data.name,
        first_name: firstName || undefined,
        last_name: lastParts.join(' ').trim() || undefined,
        email: data.email,
        phone: data.phone,
        license_number: data.licenseNumber,
        license_state: data.licenseState,
        license_expiry_date: data.licenseExpiry,
        status: normalizeStatusForApi(data.status),
        department: data.department
      }
      const response = await (api.post as <T>(endpoint: string, data: unknown) => Promise<T>)<Driver>('/drivers', payload)
      return mapDriverRow(response)
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
      const [firstName, ...lastParts] = (data.name || '').trim().split(' ')
      const payload = {
        name: data.name,
        first_name: data.name ? (firstName || undefined) : undefined,
        last_name: data.name ? (lastParts.join(' ').trim() || undefined) : undefined,
        email: data.email,
        phone: data.phone,
        license_number: data.licenseNumber,
        license_state: data.licenseState,
        license_expiry_date: data.licenseExpiry,
        status: normalizeStatusForApi(data.status),
        department: data.department
      }
      const response = await (api.put as <T>(endpoint: string, data: unknown) => Promise<T>)<Driver>(`/drivers/${id}`, payload)
      return mapDriverRow(response)
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
