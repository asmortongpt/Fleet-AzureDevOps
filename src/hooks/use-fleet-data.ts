/**
 * Fleet Data Hook - Production API Version
 * Uses real API data from backend
 */

import { useCallback, useEffect, useMemo } from 'react'

import {
  useVehicles,
  useVehicleMutations,
  useDrivers,
  useDriverMutations,
  useWorkOrders,
  useWorkOrderMutations,
  useFuelTransactions,
  useFuelMutations,
  useFacilities,
  useFacilityMutations,
  useMaintenanceSchedules,
  useRoutes,
  useRouteMutations,
  useMaintenanceMutations
} from '@/hooks/use-api'
import { Vehicle, Driver, WorkOrder, GISFacility } from '@/lib/types'
import logger from '@/utils/logger'

// Debug flag
const DEBUG_FLEET_DATA = typeof window !== 'undefined' && localStorage.getItem('debug_fleet_data') === 'true'

// Store API responses for debugging
if (typeof window !== 'undefined') {
  (window as any).__FLEET_API_RESPONSES__ = {}
}

export function useFleetData() {
  // Fetch data from API using SWR hooks
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDrivers()
  const { data: workOrdersData, isLoading: workOrdersLoading, error: workOrdersError } = useWorkOrders()
  const { data: fuelTransactionsData, isLoading: fuelLoading, error: _fuelError } = useFuelTransactions()
  const { data: facilitiesData, isLoading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const { data: maintenanceData, isLoading: _maintenanceLoading, error: _maintenanceError } = useMaintenanceSchedules()
  const { data: routesData, isLoading: routesLoading, error: _routesError } = useRoutes()

  // Store API responses for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__FLEET_API_RESPONSES__ = {
        vehicles: { data: vehiclesData, loading: vehiclesLoading, error: vehiclesError?.message },
        drivers: { data: driversData, loading: driversLoading, error: driversError?.message },
        workOrders: { data: workOrdersData, loading: workOrdersLoading, error: workOrdersError?.message },
        facilities: { data: facilitiesData, loading: facilitiesLoading, error: facilitiesError?.message },
        lastUpdate: new Date().toISOString()
      }
    }
  }, [vehiclesData, driversData, workOrdersData, facilitiesData, vehiclesError, driversError, workOrdersError, facilitiesError, vehiclesLoading, driversLoading, workOrdersLoading, facilitiesLoading])

  // Log API responses for debugging
  useEffect(() => {
    if (DEBUG_FLEET_DATA) {
      logger.debug('[useFleetData] API Data State:', {
        vehicles: { count: vehiclesData?.length ?? 'N/A', loading: vehiclesLoading, error: !!vehiclesError },
        drivers: { count: driversData?.length ?? 'N/A', loading: driversLoading, error: !!driversError },
        facilities: { count: facilitiesData?.length ?? 'N/A', loading: facilitiesLoading, error: !!facilitiesError }
      })
    }
  }, [vehiclesData, driversData, facilitiesData, vehiclesError, driversError, facilitiesError, vehiclesLoading, driversLoading, facilitiesLoading])

  // Mutation hooks
  const vehicleMutations = useVehicleMutations()
  const driverMutations = useDriverMutations()
  const workOrderMutations = useWorkOrderMutations()
  const facilityMutations = useFacilityMutations()
  const routeMutations = useRouteMutations()
  const maintenanceMutations = useMaintenanceMutations()
  const fuelMutations = useFuelMutations()

  // Extract data arrays from API
  const vehicles = useMemo((): Vehicle[] => {
    // Use API data - ensure alerts is always an array
    const rawVehicles = vehiclesData || []
    return Array.isArray(rawVehicles) ? rawVehicles.map((v): Vehicle => ({
      ...(v as Partial<Vehicle>),
      id: v.id || '',
      tenant_id: v.tenant_id || '',
      // Ensure alerts is always a string array (Vehicle interface already includes alerts: string[])
      alerts: Array.isArray((v as any).alerts) ? (v as any).alerts : []
    } as Vehicle)) : []
  }, [vehiclesData]);

  const drivers = useMemo((): Driver[] => {
    const rawDrivers = driversData || []
    return Array.isArray(rawDrivers) ? (rawDrivers as unknown as Driver[]) : []
  }, [driversData]);

  const workOrders = useMemo((): WorkOrder[] => {
    const rawWorkOrders = workOrdersData || []
    return Array.isArray(rawWorkOrders) ? (rawWorkOrders as unknown as WorkOrder[]) : []
  }, [workOrdersData]);

  const fuelTransactions = useMemo(() => {
    const rawFuelTransactions = fuelTransactionsData || []
    return Array.isArray(rawFuelTransactions) ? rawFuelTransactions : []
  }, [fuelTransactionsData]);

  const facilities = useMemo((): GISFacility[] => {
    const rawFacilities = facilitiesData || []
    return Array.isArray(rawFacilities) ? (rawFacilities as unknown as GISFacility[]) : []
  }, [facilitiesData]);

  const maintenanceSchedules = useMemo(() => {
    const rawMaintenanceSchedules = maintenanceData || []
    return Array.isArray(rawMaintenanceSchedules) ? rawMaintenanceSchedules : []
  }, [maintenanceData]);

  const routes = useMemo(() => {
    const rawRoutes = routesData || []
    return Array.isArray(rawRoutes) ? rawRoutes : []
  }, [routesData]);

  // Log data extraction results for debugging
  useEffect(() => {
    if (DEBUG_FLEET_DATA) {
      logger.debug('[useFleetData] Final data counts:', {
        vehicles: vehicles.length,
        drivers: drivers.length,
        workOrders: workOrders.length,
        facilities: facilities.length
      })
    }
  }, [vehicles.length, drivers.length, workOrders.length, facilities.length])

  // Legacy compatibility
  const _serviceBays = useMemo(() => facilities, [facilities])
  const staff = useMemo(() =>
    drivers.filter((d: any) => d.role === 'technician' || d.role === 'fleet_manager'),
    [drivers]
  )
  const technicians = useMemo(() =>
    drivers.filter((d: any) => d.role === 'technician'),
    [drivers]
  )

  // Data initialization
  const initializeData = useCallback(() => {
    logger.info('✅ Using production API data')
  }, [])

  // CRUD operations using API mutations
  const addVehicle = useCallback(async (vehicle: any) => {
    return await vehicleMutations.createVehicle.mutateAsync(vehicle)
  }, [vehicleMutations.createVehicle])

  const updateVehicle = useCallback(async (id: string, updates: any) => {
    return await vehicleMutations.updateVehicle.mutateAsync({ id, ...updates })
  }, [vehicleMutations.updateVehicle])

  const deleteVehicle = useCallback(async (id: string) => {
    return await vehicleMutations.deleteVehicle.mutateAsync({ id, tenant_id: '' })
  }, [vehicleMutations.deleteVehicle])

  const addDriver = useCallback(async (driver: any) => {
    return await driverMutations.createDriver.mutateAsync(driver)
  }, [driverMutations.createDriver])

  const updateDriver = useCallback(async (id: string, updates: any) => {
    return await driverMutations.updateDriver.mutateAsync({ id, ...updates })
  }, [driverMutations.updateDriver])

  const deleteDriver = useCallback(async (id: string) => {
    return await driverMutations.deleteDriver.mutateAsync({ id, tenant_id: '' })
  }, [driverMutations.deleteDriver])

  const addStaff = useCallback(async (person: any) => {
    return await driverMutations.createDriver.mutateAsync({ ...person, role: 'technician' })
  }, [driverMutations.createDriver])

  const updateStaff = useCallback(async (id: string, updates: any) => {
    return await driverMutations.updateDriver.mutateAsync({ id, ...updates })
  }, [driverMutations.updateDriver])

  const deleteStaff = useCallback(async (id: string) => {
    return await driverMutations.deleteDriver.mutateAsync({ id, tenant_id: '' })
  }, [driverMutations.deleteDriver])

  const addWorkOrder = useCallback(async (order: any) => {
    return await workOrderMutations.createWorkOrder.mutateAsync(order)
  }, [workOrderMutations.createWorkOrder])

  const updateWorkOrder = useCallback(async (id: string, updates: any) => {
    return await workOrderMutations.updateWorkOrder.mutateAsync({ id, updates })
  }, [workOrderMutations.updateWorkOrder])

  const deleteWorkOrder = useCallback(async (id: string) => {
    return await workOrderMutations.deleteWorkOrder.mutateAsync(id)
  }, [workOrderMutations.deleteWorkOrder])

  const addFuelTransaction = useCallback(async (transaction: any) => {
    return await fuelMutations.createFuelTransaction.mutateAsync(transaction)
  }, [fuelMutations.createFuelTransaction])

  const updateServiceBay = useCallback(async (id: string, updates: any) => {
    return await facilityMutations.updateFacility.mutateAsync({ id, updates })
  }, [facilityMutations.updateFacility])

  const addMileageReimbursement = useCallback(async (reimbursement: any) => {
    return await fuelMutations.createFuelTransaction.mutateAsync({ ...reimbursement, type: 'mileage' })
  }, [fuelMutations.createFuelTransaction])

  const updateMileageReimbursement = useCallback(async (id: string, updates: any) => {
    return await fuelMutations.updateFuelTransaction.mutateAsync({ id, updates })
  }, [fuelMutations.updateFuelTransaction])

  const deleteMileageReimbursement = useCallback(async (id: string) => {
    return await fuelMutations.deleteFuelTransaction.mutateAsync(id)
  }, [fuelMutations.deleteFuelTransaction])

  const addMaintenanceRequest = useCallback(async (request: any) => {
    return await maintenanceMutations.createMaintenanceSchedule.mutateAsync(request)
  }, [maintenanceMutations.createMaintenanceSchedule])

  const updateMaintenanceRequest = useCallback(async (id: string, updates: any) => {
    return await maintenanceMutations.updateMaintenanceSchedule.mutateAsync({ id, updates })
  }, [maintenanceMutations.updateMaintenanceSchedule])

  const addRoute = useCallback(async (route: any) => {
    return await routeMutations.createRoute.mutateAsync(route)
  }, [routeMutations.createRoute])

  const updateRoute = useCallback(async (id: string, updates: any) => {
    return await routeMutations.updateRoute.mutateAsync({ id, updates })
  }, [routeMutations.updateRoute])

  const deleteRoute = useCallback(async (id: string) => {
    return await routeMutations.deleteRoute.mutateAsync(id)
  }, [routeMutations.deleteRoute])

  // Filter mileage reimbursements
  const mileageReimbursements = useMemo((): any => {
    // TODO: Fetch actual mileage reimbursements from API endpoint
    // For now, return empty array as FuelTransactions don't have mileage type
    return []
  }, [])

  // Safety Data (TODO: Connect to API endpoints when available)
  const incidents = useMemo(() => {
    // TODO: Fetch from API endpoint /api/incidents
    return []
  }, [])

  const hazardZones = useMemo(() => {
    // TODO: Fetch from API endpoint /api/hazard-zones
    return []
  }, [])

  const inspections = useMemo(() => {
    // TODO: Fetch from API endpoint /api/inspections
    return []
  }, [])

  return {
    vehicles,
    drivers,
    staff,
    serviceBays: facilities,
    facilities,
    workOrders,
    technicians,
    fuelTransactions,
    mileageReimbursements,
    incidents,
    hazardZones,
    inspections,
    maintenanceRequests: maintenanceSchedules,
    routes,
    dataInitialized: true,
    isLoading: vehiclesLoading || driversLoading || workOrdersLoading || fuelLoading || routesLoading,
    initializeData,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
    addStaff,
    updateStaff,
    deleteStaff,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    addFuelTransaction,
    updateServiceBay,
    addMileageReimbursement,
    updateMileageReimbursement,
    deleteMileageReimbursement,
    addMaintenanceRequest,
    updateMaintenanceRequest,
    addRoute,
    updateRoute,
    deleteRoute
  }
}