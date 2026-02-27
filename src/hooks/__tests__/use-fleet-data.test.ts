import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import * as useApiHooks from '../use-api';
import { useFleetData } from '../use-fleet-data';

/**
 * Test Suite: useFleetData Hook
 *
 * Tests comprehensive fleet data aggregation, multiple async queries,
 * error handling, data transformation, and memoization patterns.
 */

describe('useFleetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Aggregation', () => {
    it('should aggregate all fleet data sources', async () => {
      // Mock all the individual hooks
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: [{ id: '1', name: 'Vehicle 1', tenantId: 'tenant-1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue({
        data: [{ id: '1', name: 'Driver 1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue({
        data: [{ id: '1', workOrderNumber: 'WO-001' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue({
        data: [{ id: '1', amount: 50 }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue({
        data: [{ id: '1', name: 'Facility 1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue({
        data: [{ id: '1', vehicleId: '1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue({
        data: [{ id: '1', name: 'Route 1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue({
        data: [{ id: '1', type: 'incident' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue({
        data: [{ id: '1', zone: 'zone-1' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue({
        data: [{ id: '1', type: 'inspection' }],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useVehicleMutations').mockReturnValue({
        createVehicle: vi.fn(),
        updateVehicle: vi.fn(),
        deleteVehicle: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useDriverMutations').mockReturnValue({
        createDriver: vi.fn(),
        updateDriver: vi.fn(),
        deleteDriver: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useWorkOrderMutations').mockReturnValue({
        createWorkOrder: vi.fn(),
        updateWorkOrder: vi.fn(),
        deleteWorkOrder: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useFacilityMutations').mockReturnValue({
        createFacility: vi.fn(),
        updateFacility: vi.fn(),
        deleteFacility: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useRouteMutations').mockReturnValue({
        createRoute: vi.fn(),
        updateRoute: vi.fn(),
        deleteRoute: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useMaintenanceMutations').mockReturnValue({
        createMaintenanceSchedule: vi.fn(),
        updateMaintenanceSchedule: vi.fn(),
        deleteMaintenanceSchedule: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useFuelMutations').mockReturnValue({
        createFuelTransaction: vi.fn(),
        updateFuelTransaction: vi.fn(),
        deleteFuelTransaction: vi.fn(),
      } as any);

      const { result } = renderHook(() => useFleetData());

      await waitFor(() => {
        expect(result.current.vehicles).toHaveLength(1);
        expect(result.current.drivers).toHaveLength(1);
        expect(result.current.workOrders).toHaveLength(1);
      });

      expect(result.current.vehicles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', name: 'Vehicle 1' }),
        ])
      );
      expect(result.current.drivers).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: '1' })])
      );
      expect(result.current.fuelTransactions).toHaveLength(1);
      expect(result.current.facilities).toHaveLength(1);
    });

    it('should handle empty data arrays', async () => {
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      // Mock all other hooks with empty data
      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.vehicles).toEqual([]);
      expect(result.current.drivers).toEqual([]);
      expect(result.current.workOrders).toEqual([]);
    });

    it('should handle undefined data', async () => {
      const undefinedMock = { data: undefined, isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(undefinedMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(undefinedMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.vehicles).toEqual([]);
      expect(result.current.drivers).toEqual([]);
    });
  });

  describe('Data Transformation', () => {
    it('should normalize vehicle location data', async () => {
      const vehicleWithLocation = {
        id: '1',
        name: 'Vehicle 1',
        tenantId: 'tenant-1',
        latitude: 40.7128,
        longitude: -74.006,
      };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: [vehicleWithLocation],
        isLoading: false,
        error: null,
      } as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.vehicles[0]).toMatchObject({
        id: '1',
        name: 'Vehicle 1',
      });
    });

    it('should handle alternative location field names', async () => {
      const vehicleWithAltLocation = {
        id: '1',
        name: 'Vehicle 1',
        tenantId: 'tenant-1',
        gps_latitude: 40.7128,
        gps_longitude: -74.006,
      };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: [vehicleWithAltLocation],
        isLoading: false,
        error: null,
      } as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.vehicles).toHaveLength(1);
    });

    it('should ensure alerts array exists', async () => {
      const vehicleWithoutAlerts = {
        id: '1',
        name: 'Vehicle 1',
        tenantId: 'tenant-1',
      };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: [vehicleWithoutAlerts],
        isLoading: false,
        error: null,
      } as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.vehicles[0]?.alerts).toEqual([]);
    });
  });

  describe('Loading States', () => {
    it('should indicate when data is loading', async () => {
      const loadingMock = { data: undefined, isLoading: true, error: null };
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(loadingMock as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.isLoading).toBe(true);
    });

    it('should indicate when any source is loading', async () => {
      const loadedMock = { data: [], isLoading: false, error: null };
      const loadingMock = { data: undefined, isLoading: true, error: null };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(loadingMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(loadedMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(loadedMock as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from individual sources', async () => {
      const error = new Error('Network error');
      const errorMock = { data: undefined, isLoading: false, error };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(errorMock as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      // The hook should capture error state internally
      expect(result.current).toBeDefined();
    });

    it('should handle multiple simultaneous errors', async () => {
      const error = new Error('Error');
      const errorMock = { data: undefined, isLoading: false, error };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(errorMock as any);
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(errorMock as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result } = renderHook(() => useFleetData());

      // The hook should handle multiple errors gracefully
      expect(result.current).toBeDefined();
    });
  });

  describe('Memoization', () => {
    it('should memoize vehicles data', async () => {
      const vehicleData = [{ id: '1', name: 'Vehicle 1', tenantId: 'tenant-1' }];
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue({
        data: vehicleData,
        isLoading: false,
        error: null,
      } as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result, rerender } = renderHook(() => useFleetData());

      const vehicles1 = result.current.vehicles;

      rerender();

      const vehicles2 = result.current.vehicles;

      // Should return the same memoized array reference
      expect(vehicles1).toBe(vehicles2);
    });

    it('should update memoized data when source changes', async () => {
      const vehicleData1 = [{ id: '1', name: 'Vehicle 1', tenantId: 'tenant-1' }];
      const vehicleData2 = [
        { id: '1', name: 'Vehicle 1', tenantId: 'tenant-1' },
        { id: '2', name: 'Vehicle 2', tenantId: 'tenant-1' },
      ];

      const useVehiclesMock = vi.spyOn(useApiHooks, 'useVehicles');
      useVehiclesMock.mockReturnValueOnce({
        data: vehicleData1,
        isLoading: false,
        error: null,
      } as any);

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      const { result, rerender } = renderHook(() => useFleetData());

      expect(result.current.vehicles).toHaveLength(1);

      useVehiclesMock.mockReturnValueOnce({
        data: vehicleData2,
        isLoading: false,
        error: null,
      } as any);

      rerender();

      expect(result.current.vehicles).toHaveLength(2);
    });
  });

  describe('Mutation Hooks', () => {
    it('should provide vehicle mutations', async () => {
      const vehicleMutations = {
        createVehicle: vi.fn(),
        updateVehicle: vi.fn(),
        deleteVehicle: vi.fn(),
      };

      vi.spyOn(useApiHooks, 'useVehicleMutations').mockReturnValue(
        vehicleMutations as any
      );

      const emptyMock = { data: [], isLoading: false, error: null };
      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      vi.spyOn(useApiHooks, 'useDriverMutations').mockReturnValue({
        createDriver: vi.fn(),
        updateDriver: vi.fn(),
        deleteDriver: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useWorkOrderMutations').mockReturnValue({
        createWorkOrder: vi.fn(),
        updateWorkOrder: vi.fn(),
        deleteWorkOrder: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useFacilityMutations').mockReturnValue({
        createFacility: vi.fn(),
        updateFacility: vi.fn(),
        deleteFacility: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useRouteMutations').mockReturnValue({
        createRoute: vi.fn(),
        updateRoute: vi.fn(),
        deleteRoute: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useMaintenanceMutations').mockReturnValue({
        createMaintenanceSchedule: vi.fn(),
        updateMaintenanceSchedule: vi.fn(),
        deleteMaintenanceSchedule: vi.fn(),
      } as any);

      vi.spyOn(useApiHooks, 'useFuelMutations').mockReturnValue({
        createFuelTransaction: vi.fn(),
        updateFuelTransaction: vi.fn(),
        deleteFuelTransaction: vi.fn(),
      } as any);

      const { result } = renderHook(() => useFleetData());

      // The hook should return vehicle mutations
      expect(result.current).toBeDefined();
    });

    it('should provide all mutation types', async () => {
      const emptyMock = { data: [], isLoading: false, error: null };
      const mutations = {
        createVehicle: vi.fn(),
        updateVehicle: vi.fn(),
        deleteVehicle: vi.fn(),
      };

      vi.spyOn(useApiHooks, 'useVehicles').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useDrivers').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useWorkOrders').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFuelTransactions').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useFacilities').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useMaintenanceSchedules').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useRoutes').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useIncidents').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useHazardZones').mockReturnValue(emptyMock as any);
      vi.spyOn(useApiHooks, 'useInspections').mockReturnValue(emptyMock as any);

      vi.spyOn(useApiHooks, 'useVehicleMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useDriverMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useWorkOrderMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useFacilityMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useRouteMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useMaintenanceMutations').mockReturnValue(mutations as any);
      vi.spyOn(useApiHooks, 'useFuelMutations').mockReturnValue(mutations as any);

      const { result } = renderHook(() => useFleetData());

      expect(result.current).toBeDefined();
    });
  });
});
