/**
 * Enhanced Data Fetching Hooks with Production-Grade Error Handling
 *
 * This file provides improved versions of data query hooks with:
 * - Automatic error handling and user-friendly messages
 * - Toast notifications for mutations
 * - Retry logic for failed requests
 * - Loading states
 * - Error logging and reporting
 */

import { useQueryClient } from '@tanstack/react-query';

import {
  useQueryWithErrorHandling,
  useMutationWithErrorHandling,
  UseQueryWithErrorHandlingOptions,
  UseMutationWithErrorHandlingOptions,
} from './useQueryWithErrorHandling';

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

export function useVehicles(
  options?: UseQueryWithErrorHandlingOptions<Vehicle[]>
) {
  return useQueryWithErrorHandling<Vehicle[]>(
    queryKeys.vehicles,
    async () => {
      const response = await apiClient.get<{ data: Vehicle[] }>('/vehicles');
      return response?.data ?? [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,
      errorMessage: 'Failed to load vehicles. Please try again.',
      ...options,
    }
  );
}

export function useVehicle(
  id: string,
  options?: UseQueryWithErrorHandlingOptions<Vehicle>
) {
  return useQueryWithErrorHandling<Vehicle>(
    queryKeys.vehicle(id),
    async () => {
      const response = await apiClient.get<{ data: Vehicle }>(`/vehicles/${id}`);
      return response?.data;
    },
    {
      enabled: !!id,
      gcTime: 10 * 60 * 1000,
      errorMessage: `Failed to load vehicle details. Please try again.`,
      ...options,
    }
  );
}

export function useCreateVehicle(
  options?: UseMutationWithErrorHandlingOptions<Vehicle, unknown, Omit<Vehicle, 'id'>>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<Vehicle, unknown, Omit<Vehicle, 'id'>>(
    async (vehicle) => {
      const response = await apiClient.post<{ data: Vehicle }>('/vehicles', vehicle);
      return response?.data;
    },
    {
      successMessage: 'Vehicle created successfully',
      errorMessage: 'Failed to create vehicle. Please check your input and try again.',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      },
      ...options,
    }
  );
}

export function useUpdateVehicle(
  options?: UseMutationWithErrorHandlingOptions<Vehicle, unknown, Partial<Vehicle> & { id: string }>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<Vehicle, unknown, Partial<Vehicle> & { id: string }>(
    async ({ id, ...updates }) => {
      const response = await apiClient.patch<{ data: Vehicle }>(`/vehicles/${id}`, updates);
      return response?.data;
    },
    {
      successMessage: 'Vehicle updated successfully',
      errorMessage: 'Failed to update vehicle. Please try again.',
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(data.id) });
      },
      ...options,
    }
  );
}

export function useDeleteVehicle(
  options?: UseMutationWithErrorHandlingOptions<void, unknown, string>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<void, unknown, string>(
    async (id) => {
      await apiClient.delete(`/vehicles/${id}`);
    },
    {
      successMessage: 'Vehicle deleted successfully',
      errorMessage: 'Failed to delete vehicle. Please try again.',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      },
      ...options,
    }
  );
}

// ============================================================================
// Driver Queries
// ============================================================================

export function useDrivers(
  options?: UseQueryWithErrorHandlingOptions<Driver[]>
) {
  return useQueryWithErrorHandling<Driver[]>(
    queryKeys.drivers,
    async () => {
      const response = await apiClient.get<{ data: Driver[] }>('/drivers');
      return response?.data ?? [];
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      errorMessage: 'Failed to load drivers. Please try again.',
      ...options,
    }
  );
}

export function useDriver(
  id: string,
  options?: UseQueryWithErrorHandlingOptions<Driver>
) {
  return useQueryWithErrorHandling<Driver>(
    queryKeys.driver(id),
    async () => {
      const response = await apiClient.get<{ data: Driver }>(`/drivers/${id}`);
      return response?.data;
    },
    {
      enabled: !!id,
      gcTime: 10 * 60 * 1000,
      errorMessage: 'Failed to load driver details. Please try again.',
      ...options,
    }
  );
}

export function useCreateDriver(
  options?: UseMutationWithErrorHandlingOptions<Driver, unknown, Omit<Driver, 'id'>>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<Driver, unknown, Omit<Driver, 'id'>>(
    async (driver) => {
      const response = await apiClient.post<{ data: Driver }>('/drivers', driver);
      return response?.data;
    },
    {
      successMessage: 'Driver created successfully',
      errorMessage: 'Failed to create driver. Please check your input and try again.',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      },
      ...options,
    }
  );
}

export function useUpdateDriver(
  options?: UseMutationWithErrorHandlingOptions<Driver, unknown, Partial<Driver> & { id: string }>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<Driver, unknown, Partial<Driver> & { id: string }>(
    async ({ id, ...updates }) => {
      const response = await apiClient.patch<{ data: Driver }>(`/drivers/${id}`, updates);
      return response?.data;
    },
    {
      successMessage: 'Driver updated successfully',
      errorMessage: 'Failed to update driver. Please try again.',
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
        queryClient.invalidateQueries({ queryKey: queryKeys.driver(data.id) });
      },
      ...options,
    }
  );
}

// ============================================================================
// Work Order Queries
// ============================================================================

export function useWorkOrders(
  filters?: { status?: string; vehicleId?: string },
  options?: UseQueryWithErrorHandlingOptions<WorkOrder[]>
) {
  return useQueryWithErrorHandling<WorkOrder[]>(
    [...queryKeys.workOrders, filters],
    async () => {
      const response = await apiClient.get<{ data: WorkOrder[] }>('/work-orders', {
        params: filters,
      });
      return response?.data ?? [];
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for work orders)
      gcTime: 5 * 60 * 1000,
      errorMessage: 'Failed to load work orders. Please try again.',
      ...options,
    }
  );
}

export function useWorkOrder(
  id: string,
  options?: UseQueryWithErrorHandlingOptions<WorkOrder>
) {
  return useQueryWithErrorHandling<WorkOrder>(
    queryKeys.workOrder(id),
    async () => {
      const response = await apiClient.get<{ data: WorkOrder }>(`/work-orders/${id}`);
      return response?.data;
    },
    {
      enabled: !!id,
      gcTime: 5 * 60 * 1000,
      errorMessage: 'Failed to load work order details. Please try again.',
      ...options,
    }
  );
}

export function useCreateWorkOrder(
  options?: UseMutationWithErrorHandlingOptions<WorkOrder, unknown, Omit<WorkOrder, 'id'>>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<WorkOrder, unknown, Omit<WorkOrder, 'id'>>(
    async (workOrder) => {
      const response = await apiClient.post<{ data: WorkOrder }>('/work-orders', workOrder);
      return response?.data;
    },
    {
      successMessage: 'Work order created successfully',
      errorMessage: 'Failed to create work order. Please check your input and try again.',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
      },
      ...options,
    }
  );
}

export function useUpdateWorkOrder(
  options?: UseMutationWithErrorHandlingOptions<WorkOrder, unknown, Partial<WorkOrder> & { id: string }>
) {
  const queryClient = useQueryClient();

  return useMutationWithErrorHandling<WorkOrder, unknown, Partial<WorkOrder> & { id: string }>(
    async ({ id, ...updates }) => {
      const response = await apiClient.patch<{ data: WorkOrder }>(`/work-orders/${id}`, updates);
      return response?.data;
    },
    {
      successMessage: 'Work order updated successfully',
      errorMessage: 'Failed to update work order. Please try again.',
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.workOrders });
        queryClient.invalidateQueries({ queryKey: queryKeys.workOrder(data.id) });
      },
      ...options,
    }
  );
}

// ============================================================================
// Fuel Transaction Queries
// ============================================================================

export function useFuelTransactions(
  filters?: { vehicleId?: string; startDate?: string; endDate?: string },
  options?: UseQueryWithErrorHandlingOptions<FuelTransaction[]>
) {
  return useQueryWithErrorHandling<FuelTransaction[]>(
    [...queryKeys.fuelTransactions, filters],
    async () => {
      const response = await apiClient.get<{ data: FuelTransaction[] }>('/fuel-transactions', {
        params: filters,
      });
      return response?.data ?? [];
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      errorMessage: 'Failed to load fuel transactions. Please try again.',
      ...options,
    }
  );
}

// ============================================================================
// Parts Inventory Queries
// ============================================================================

export function useParts(
  options?: UseQueryWithErrorHandlingOptions<Part[]>
) {
  return useQueryWithErrorHandling<Part[]>(
    queryKeys.parts,
    async () => {
      const response = await apiClient.get<{ data: Part[] }>('/parts');
      return response?.data ?? [];
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (parts inventory changes less frequently)
      gcTime: 15 * 60 * 1000,
      errorMessage: 'Failed to load parts inventory. Please try again.',
      ...options,
    }
  );
}

export function usePart(
  id: string,
  options?: UseQueryWithErrorHandlingOptions<Part>
) {
  return useQueryWithErrorHandling<Part>(
    queryKeys.part(id),
    async () => {
      const response = await apiClient.get<{ data: Part }>(`/parts/${id}`);
      return response?.data;
    },
    {
      enabled: !!id,
      gcTime: 15 * 60 * 1000,
      errorMessage: 'Failed to load part details. Please try again.',
      ...options,
    }
  );
}

// ============================================================================
// Vendor Queries
// ============================================================================

export function useVendors(
  options?: UseQueryWithErrorHandlingOptions<Vendor[]>
) {
  return useQueryWithErrorHandling<Vendor[]>(
    queryKeys.vendors,
    async () => {
      const response = await apiClient.get<{ data: Vendor[] }>('/vendors');
      return response?.data ?? [];
    },
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 20 * 60 * 1000,
      errorMessage: 'Failed to load vendors. Please try again.',
      ...options,
    }
  );
}

export function useVendor(
  id: string,
  options?: UseQueryWithErrorHandlingOptions<Vendor>
) {
  return useQueryWithErrorHandling<Vendor>(
    queryKeys.vendor(id),
    async () => {
      const response = await apiClient.get<{ data: Vendor }>(`/vendors/${id}`);
      return response?.data;
    },
    {
      enabled: !!id,
      gcTime: 20 * 60 * 1000,
      errorMessage: 'Failed to load vendor details. Please try again.',
      ...options,
    }
  );
}

// ============================================================================
// Facilities Queries
// ============================================================================

export function useFacilities(
  options?: UseQueryWithErrorHandlingOptions<GISFacility[]>
) {
  return useQueryWithErrorHandling<GISFacility[]>(
    queryKeys.facilities,
    async () => {
      const response = await apiClient.get<{ data: GISFacility[] }>('/facilities');
      return response?.data ?? [];
    },
    {
      staleTime: 15 * 60 * 1000,
      gcTime: 20 * 60 * 1000,
      errorMessage: 'Failed to load facilities. Please try again.',
      ...options,
    }
  );
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
        const response = await apiClient.get<{ data: Vehicle }>(`/vehicles/${id}`);
        return response?.data;
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
        const response = await apiClient.get<{ data: Driver }>(`/drivers/${id}`);
        return response?.data;
      },
    });
  };
}