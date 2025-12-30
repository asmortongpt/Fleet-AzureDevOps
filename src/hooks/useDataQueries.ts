/**
 * Centralized data fetching hooks using TanStack Query
 * Provides optimized caching, refetching, and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type {
  Vehicle,
  Driver,
  WorkOrder,
  FuelTransaction,
  Part,
  Vendor,
  GISFacility,
} from '@/lib/types';

// Query keys for consistent cache management
export const queryKeys = {
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  drivers: ['drivers'] as const,
  driver: (id: string) => ['drivers', id] as const,
  workOrders: ['workOrders'] as const,
  workOrder: (id: string) => ['workOrders', id] as const,
  fuelTransactions: ['fuelTransactions'] as const,
  maintenanceSchedules: ['maintenanceSchedules'] as const,
  parts: ['parts'] as const,
  part: (id: string) => ['parts', id] as const,
  vendors: ['vendors'] as const,
  vendor: (id: string) => ['vendors', id] as const,
  purchaseOrders: ['purchaseOrders'] as const,
  purchaseOrder: (id: string) => ['purchaseOrders', id] as const,
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  facilities: ['facilities'] as const,
  facility: (id: string) => ['facilities', id] as const,
};

// ============================================================================
// Vehicle Queries
// ============================================================================

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => {
      const response = await apiClient.get<Vehicle[]>('/vehicles');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: queryKeys.vehicle(id),
    queryFn: async () => {
      const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
      return response;
    },
    enabled: !!id,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id'>) => {
      const response = await apiClient.post<Vehicle>('/vehicles', vehicle);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vehicle> & { id: string }) => {
      const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, updates);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(data?.id || '') });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    },
  });
}

// ============================================================================
// Driver Queries
// ============================================================================

export function useDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers,
    queryFn: async () => {
      const response = await apiClient.get<Driver[]>('/drivers');
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: queryKeys.driver(id),
    queryFn: async () => {
      const response = await apiClient.get<Driver>(`/drivers/${id}`);
      return response;
    },
    enabled: !!id,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driver: Omit<Driver, 'id'>) => {
      const response = await apiClient.post<Driver>('/drivers', driver);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Driver> & { id: string }) => {
      const response = await apiClient.patch<Driver>(`/drivers/${id}`, updates);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.driver(data?.id || '') });
    },
  });
}

// ============================================================================
// Work Order Queries
// ============================================================================

export function useWorkOrders(filters?: { status?: string; vehicleId?: string }) {
  return useQuery({
    queryKey: [...queryKeys.workOrders, filters],
    queryFn: async () => {
      const response = await apiClient.get<WorkOrder[]>('/work-orders', {
        params: filters,
      });
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for work orders)
    gcTime: 5 * 60 * 1000,
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.workOrder(id),
    queryFn: async () => {
      const response = await apiClient.get<WorkOrder>(`/work-orders/${id}`);
      return response;
    },
    enabled: !!id,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workOrder: Omit<WorkOrder, 'id'>) => {
      const response = await apiClient.post<WorkOrder>('/work-orders', workOrder);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkOrder> & { id: string }) => {
      const response = await apiClient.patch<WorkOrder>(`/work-orders/${id}`, updates);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data?.id || '') });
    },
  });
}

// ============================================================================
// Fuel Transaction Queries
// ============================================================================

export function useFuelTransactions(filters?: { vehicleId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [...queryKeys.fuelTransactions, filters],
    queryFn: async () => {
      const response = await apiClient.get<FuelTransaction[]>('/fuel-transactions', {
        params: filters,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// Parts Inventory Queries
// ============================================================================

export function useParts() {
  return useQuery({
    queryKey: queryKeys.parts,
    queryFn: async () => {
      const response = await apiClient.get<Part[]>('/parts');
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (parts inventory changes less frequently)
    gcTime: 15 * 60 * 1000,
  });
}

export function usePart(id: string) {
  return useQuery({
    queryKey: queryKeys.part(id),
    queryFn: async () => {
      const response = await apiClient.get<Part>(`/parts/${id}`);
      return response;
    },
    enabled: !!id,
    gcTime: 15 * 60 * 1000,
  });
}

// ============================================================================
// Vendor Queries
// ============================================================================

export function useVendors() {
  return useQuery({
    queryKey: queryKeys.vendors,
    queryFn: async () => {
      const response = await apiClient.get<Vendor[]>('/vendors');
      return response;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: queryKeys.vendor(id),
    queryFn: async () => {
      const response = await apiClient.get<Vendor>(`/vendors/${id}`);
      return response;
    },
    enabled: !!id,
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================================================
// Facilities Queries
// ============================================================================

export function useFacilities() {
  return useQuery({
    queryKey: queryKeys.facilities,
    queryFn: async () => {
      const response = await apiClient.get<GISFacility[]>('/facilities');
      return response;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

export function usePrefetchVehicle() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vehicle(id),
      queryFn: async () => {
        const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
        return response;
      },
    });
  };
}

export function usePrefetchDriver() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.driver(id),
      queryFn: async () => {
        const response = await apiClient.get<Driver>(`/drivers/${id}`);
        return response;
      },
    });
  };
}

// ============================================================================
// Infinite Query Example (for pagination)
// ============================================================================

export function useInfiniteVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'infinite'],
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
      const response = await apiClient.get<Vehicle[]>('/vehicles', {
        params: {
          page: pageParam,
          limit: 20,
        },
      });
      return response;
    },
    // @ts-ignore - This would need proper setup with useInfiniteQuery
    getNextPageParam: (_lastPage, _pages) => {
      return _lastPage?.length === 20 ? _pages.length + 1 : undefined;
    },
    gcTime: 10 * 60 * 1000,
  });
}