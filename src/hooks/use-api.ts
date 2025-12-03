import { useQuery, useMutation, useQueryClient, QueryClient, QueryKey } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface VehicleFilters {
  tenant_id: string;
  [key: string]: string | number | undefined;
}

interface DriverFilters {
  tenant_id: string;
  [key: string]: string | number | undefined;
}

interface MaintenanceFilters {
  tenant_id: string;
  startDate: string;
  endDate: string;
}

interface Vehicle {
  id: string;
  tenant_id: string;
  // other vehicle properties
}

interface Driver {
  id: string;
  tenant_id: string;
  // other driver properties
}

interface Maintenance {
  id: string;
  tenant_id: string;
  // other maintenance properties
}

const queryClient = new QueryClient();

const queryKeyFactory = {
  vehicles: (filters: VehicleFilters) => ['vehicles', filters],
  drivers: (filters: DriverFilters) => ['drivers', filters],
  maintenance: (filters: MaintenanceFilters) => ['maintenance', filters],
};

export function useVehicles(filters: VehicleFilters) {
  return useQuery<Vehicle[], Error>({
    queryKey: queryKeyFactory.vehicles(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/vehicles?${params}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDrivers(filters: DriverFilters) {
  return useQuery<Driver[], Error>({
    queryKey: queryKeyFactory.drivers(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/drivers?${params}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useMaintenance(filters: MaintenanceFilters) {
  return useQuery<Maintenance[], Error>({
    queryKey: queryKeyFactory.maintenance(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/maintenance?${params}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useVehicleMutations() {
  const queryClient = useQueryClient();

  const createVehicle = useMutation<Vehicle, Error, Vehicle>({
    mutationFn: async (newVehicle) => {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeyFactory.vehicles({ tenant_id: '' }));
    },
  });

  const updateVehicle = useMutation<Vehicle, Error, Vehicle>({
    mutationFn: async (updatedVehicle) => {
      const res = await fetch(`/api/vehicles/${updatedVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVehicle),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onMutate: async (updatedVehicle) => {
      await queryClient.cancelQueries(queryKeyFactory.vehicles({ tenant_id: updatedVehicle.tenant_id }));
      const previousVehicles = queryClient.getQueryData<Vehicle[]>(queryKeyFactory.vehicles({ tenant_id: updatedVehicle.tenant_id }));
      queryClient.setQueryData<Vehicle[]>(queryKeyFactory.vehicles({ tenant_id: updatedVehicle.tenant_id }), (old) =>
        old?.map((vehicle) => (vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle))
      );
      return { previousVehicles };
    },
    onError: (err, updatedVehicle, context) => {
      if (context?.previousVehicles) {
        queryClient.setQueryData(queryKeyFactory.vehicles({ tenant_id: updatedVehicle.tenant_id }), context.previousVehicles);
      }
    },
    onSettled: (updatedVehicle) => {
      queryClient.invalidateQueries(queryKeyFactory.vehicles({ tenant_id: updatedVehicle.tenant_id }));
    },
  });

  const deleteVehicle = useMutation<void, Error, { id: string; tenant_id: string }>({
    mutationFn: async ({ id, tenant_id }) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Network response was not ok');
    },
    onSuccess: (_, { tenant_id }) => {
      queryClient.invalidateQueries(queryKeyFactory.vehicles({ tenant_id }));
    },
  });

  return { createVehicle, updateVehicle, deleteVehicle };
}

export function useDriverMutations() {
  const queryClient = useQueryClient();

  const createDriver = useMutation<Driver, Error, Driver>({
    mutationFn: async (newDriver) => {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeyFactory.drivers({ tenant_id: '' }));
    },
  });

  const updateDriver = useMutation<Driver, Error, Driver>({
    mutationFn: async (updatedDriver) => {
      const res = await fetch(`/api/drivers/${updatedDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDriver),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onMutate: async (updatedDriver) => {
      await queryClient.cancelQueries(queryKeyFactory.drivers({ tenant_id: updatedDriver.tenant_id }));
      const previousDrivers = queryClient.getQueryData<Driver[]>(queryKeyFactory.drivers({ tenant_id: updatedDriver.tenant_id }));
      queryClient.setQueryData<Driver[]>(queryKeyFactory.drivers({ tenant_id: updatedDriver.tenant_id }), (old) =>
        old?.map((driver) => (driver.id === updatedDriver.id ? updatedDriver : driver))
      );
      return { previousDrivers };
    },
    onError: (err, updatedDriver, context) => {
      if (context?.previousDrivers) {
        queryClient.setQueryData(queryKeyFactory.drivers({ tenant_id: updatedDriver.tenant_id }), context.previousDrivers);
      }
    },
    onSettled: (updatedDriver) => {
      queryClient.invalidateQueries(queryKeyFactory.drivers({ tenant_id: updatedDriver.tenant_id }));
    },
  });

  const deleteDriver = useMutation<void, Error, { id: string; tenant_id: string }>({
    mutationFn: async ({ id, tenant_id }) => {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Network response was not ok');
    },
    onSuccess: (_, { tenant_id }) => {
      queryClient.invalidateQueries(queryKeyFactory.drivers({ tenant_id }));
    },
  });

  return { createDriver, updateDriver, deleteDriver };
}

export function useMaintenanceMutations() {
  const queryClient = useQueryClient();

  const createMaintenance = useMutation<Maintenance, Error, Maintenance>({
    mutationFn: async (newMaintenance) => {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaintenance),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeyFactory.maintenance({ tenant_id: '', startDate: '', endDate: '' }));
    },
  });

  const updateMaintenance = useMutation<Maintenance, Error, Maintenance>({
    mutationFn: async (updatedMaintenance) => {
      const res = await fetch(`/api/maintenance/${updatedMaintenance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMaintenance),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    onMutate: async (updatedMaintenance) => {
      await queryClient.cancelQueries(queryKeyFactory.maintenance({ tenant_id: updatedMaintenance.tenant_id, startDate: '', endDate: '' }));
      const previousMaintenance = queryClient.getQueryData<Maintenance[]>(queryKeyFactory.maintenance({ tenant_id: updatedMaintenance.tenant_id, startDate: '', endDate: '' }));
      queryClient.setQueryData<Maintenance[]>(queryKeyFactory.maintenance({ tenant_id: updatedMaintenance.tenant_id, startDate: '', endDate: '' }), (old) =>
        old?.map((maintenance) => (maintenance.id === updatedMaintenance.id ? updatedMaintenance : maintenance))
      );
      return { previousMaintenance };
    },
    onError: (err, updatedMaintenance, context) => {
      if (context?.previousMaintenance) {
        queryClient.setQueryData(queryKeyFactory.maintenance({ tenant_id: updatedMaintenance.tenant_id, startDate: '', endDate: '' }), context.previousMaintenance);
      }
    },
    onSettled: (updatedMaintenance) => {
      queryClient.invalidateQueries(queryKeyFactory.maintenance({ tenant_id: updatedMaintenance.tenant_id, startDate: '', endDate: '' }));
    },
  });

  const deleteMaintenance = useMutation<void, Error, { id: string; tenant_id: string }>({
    mutationFn: async ({ id, tenant_id }) => {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Network response was not ok');
    },
    onSuccess: (_, { tenant_id }) => {
      queryClient.invalidateQueries(queryKeyFactory.maintenance({ tenant_id, startDate: '', endDate: '' }));
    },
  });

  return { createMaintenance, updateMaintenance, deleteMaintenance };
}
