/**
 * Fleet Data Hook - Production Version (Real API Only)
 * Fetches all fleet data from the real API
 */

import { useCallback, useMemo } from 'react'

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

export function useFleetData() {
  // Fetch data from API using SWR hooks
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDrivers()
  const { data: workOrdersData, isLoading: workOrdersLoading, error: workOrdersError } = useWorkOrders()
  const { data: fuelTransactionsData, isLoading: fuelLoading, error: _fuelError } = useFuelTransactions()
  const { data: facilitiesData, isLoading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const { data: maintenanceData, isLoading: _maintenanceLoading, error: _maintenanceError } = useMaintenanceSchedules()
  const { data: routesData, isLoading: routesLoading, error: _routesError } = useRoutes()

  // Mutation hooks
  const vehicleMutations = useVehicleMutations()
  const driverMutations = useDriverMutations()
  const workOrderMutations = useWorkOrderMutations()
  const facilityMutations = useFacilityMutations()
  const routeMutations = useRouteMutations()
  const maintenanceMutations = useMaintenanceMutations()
  const fuelMutations = useFuelMutations()

  // Extract data arrays from API responses
  const vehicles = useMemo((): Vehicle[] => {
    const rawVehicles = vehiclesData || []
    return Array.isArray(rawVehicles) ? rawVehicles.map((v): Vehicle => ({
      ...(v as Partial<Vehicle>),
      id: v.id || '',
      tenant_id: v.tenant_id || '',
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

  // Legacy compatibility
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

  // Filter mileage reimbursements from fuel transactions
  const mileageReimbursements = useMemo(() => {
    return fuelTransactions.filter((t: any) => t.type === 'mileage')
  }, [fuelTransactions])

  // Safety data - fetched from API (empty if not implemented yet)
  const incidents = useMemo(() => [], [])
  const hazardZones = useMemo(() => [], [])
  const inspections = useMemo(() => [], [])

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
