/**
 * Generic CRUD hook factory - eliminates duplication across useDrivers, useVehicles, etc.
 * Provides standard create, read, update, delete operations with React Query
 */
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import axios from '@/lib/api'

export interface CrudResourceOptions<T> {
  resourceName: string // e.g., 'drivers', 'vehicles'
  queryKey: string // e.g., 'drivers', 'vehicles'
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  [key: string]: any
}

/**
 * Generate all CRUD hooks for a resource
 */
export function createCrudHooks<T extends { id?: number | string }>(
  options: CrudResourceOptions<T>
) {
  const { resourceName, queryKey } = options

  /**
   * Get all resources with optional pagination/filtering
   */
  function useList(params?: PaginationParams, queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await axios.get<T[]>(`/${resourceName}`, { params })
        return response?.data ?? []
      },
      gcTime: 5 * 60 * 1000,
      ...queryOptions
    })
  }

  /**
   * Get a single resource by ID
   */
  function useOne(id: number | string, queryOptions?: Omit<UseQueryOptions, 'queryKey' | 'queryFn' | 'enabled'>) {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: async () => {
        const response = await axios.get<T>(`/${resourceName}/${id}`)
        return response?.data ?? response
      },
      enabled: !!id,
      gcTime: 5 * 60 * 1000,
      ...queryOptions
    })
  }

  /**
   * Create a new resource
   */
  function useCreate(mutationOptions?: Omit<UseMutationOptions<any, any, Partial<T>>, 'mutationFn'>) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (data: Partial<T>) => {
        const response = await axios.post<T>(`/${resourceName}`, data)
        return response?.data ?? response
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      },
      ...mutationOptions
    })
  }

  /**
   * Update an existing resource
   */
  function useUpdate(mutationOptions?: Omit<UseMutationOptions<any, any, { id: number | string; data: Partial<T> }>, 'mutationFn'>) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async ({ id, data }: { id: number | string; data: Partial<T> }) => {
        const response = await axios.put<T>(`/${resourceName}/${id}`, data)
        return response?.data ?? response
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
        queryClient.invalidateQueries({ queryKey: [queryKey, variables.id] })
      },
      ...mutationOptions
    })
  }

  /**
   * Delete a resource
   */
  function useDelete(mutationOptions?: Omit<UseMutationOptions<any, any, number | string>, 'mutationFn'>) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (id: number | string) => {
        await axios.delete(`/${resourceName}/${id}`)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      },
      ...mutationOptions
    })
  }

  return {
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete
  }
}