/**
 * Fleet Data Hook - Hybrid Version (API + Demo Fallback)
 * Uses API data when available, falls back to demo data
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
  useFuelTransactionMutations,
  useFacilities,
  useFacilityMutations,
  useMaintenanceSchedules,
  useMaintenanceScheduleMutations,
  useRoutes,
  useRouteMutations
} from '@/hooks/use-api'
import { Vehicle, Driver, WorkOrder, GISFacility } from '@/lib/types'
import { generateDemoVehicles, generateDemoDrivers, generateDemoWorkOrders, generateDemoFacilities } from '@/lib/demo-data'
import logger from '@/utils/logger'

// Check if demo mode is enabled (default: true)
const isDemoMode = () => {
  if (typeof window === 'undefined') return true
  const demoMode = localStorage.getItem('demo_mode')
  return demoMode !== 'false' // Default to demo mode unless explicitly disabled
}

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
      logger.debug('[useFleetData] Demo Mode:', isDemoMode())
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
  const fuelMutations = useFuelTransactionMutations()
  const facilityMutations = useFacilityMutations()
  const maintenanceMutations = useMaintenanceScheduleMutations()
  const routeMutations = useRouteMutations()

  // Extract data arrays with demo fallback
  const vehicles = useMemo((): Vehicle[] => {
    if (isDemoMode()) {
      // Use demo data
      const demoVehicles = generateDemoVehicles(50)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo vehicles:', demoVehicles.length)
      return demoVehicles
    }

    // Use API data - ensure alerts is always an array
    const rawVehicles = vehiclesData || []
    return Array.isArray(rawVehicles) ? rawVehicles.map((v): Vehicle => ({
      ...v,
      // Ensure alerts is always a string array (Vehicle interface already includes alerts: string[])
      alerts: Array.isArray(v.alerts) ? v.alerts : []
    })) : []
  }, [vehiclesData]);

  const drivers = useMemo((): Driver[] => {
    if (isDemoMode()) {
      const demoDrivers = generateDemoDrivers(20)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo drivers:', demoDrivers.length)
      return demoDrivers
    }

    const rawDrivers = driversData || []
    return Array.isArray(rawDrivers) ? rawDrivers : []
  }, [driversData]);

  const workOrders = useMemo((): WorkOrder[] => {
    if (isDemoMode()) {
      const demoOrders = generateDemoWorkOrders(30)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo work orders:', demoOrders.length)
      return demoOrders
    }

    const rawWorkOrders = workOrdersData || []
    return Array.isArray(rawWorkOrders) ? rawWorkOrders : []
  }, [workOrdersData]);

  const fuelTransactions = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo fuel transactions for now
    }
    
    const rawFuelTransactions = fuelTransactionsData || []
    return Array.isArray(rawFuelTransactions) ? rawFuelTransactions : []
  }, [fuelTransactionsData]);

  const facilities = useMemo((): GISFacility[] => {
    if (isDemoMode()) {
      const demoFacilities = generateDemoFacilities()
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo facilities:', demoFacilities.length)
      return demoFacilities
    }

    const rawFacilities = facilitiesData || []
    return Array.isArray(rawFacilities) ? rawFacilities : []
  }, [facilitiesData]);

  const maintenanceSchedules = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo maintenance schedules for now
    }
    
    const rawMaintenanceSchedules = maintenanceData || []
    return Array.isArray(rawMaintenanceSchedules) ? rawMaintenanceSchedules : []
  }, [maintenanceData]);

  const routes = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo routes for now
    }
    
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
        facilities: facilities.length,
        demoMode: isDemoMode()
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
    if (isDemoMode()) {
      logger.info('✅ Using demo data mode')
    } else {
      logger.info('✅ Using production API/emulator data')
    }
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
  const mileageReimbursements = useMemo(():any => {
    // TODO: Fetch actual mileage reimbursements from API endpoint
    // For now, return empty array as FuelTransactions don't have mileage type
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
    maintenanceRequests: maintenanceSchedules,
    routes,
    dataInitialized: true,
    isLoading: isDemoMode() ? false : (vehiclesLoading || driversLoading || workOrdersLoading || fuelLoading || routesLoading),
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