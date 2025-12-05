/**
 * Fleet Data Hook - Production Version
 * Uses ONLY real API/emulator data - no hardcoded demo data
 */

import {
  useVehicles,
  useVehicleMutations,
  useDrivers,
  useDriverMutations,
  useMaintenance,
  useMaintenanceMutations,
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
import { useCallback, useEffect, useMemo } from 'react'
import logger from '@/utils/logger'

// Debug flag - set to true in localStorage for verbose logging
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
  const { data: fuelTransactionsData, isLoading: fuelLoading, error: fuelError } = useFuelTransactions()
  const { data: facilitiesData, isLoading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const { data: maintenanceData, isLoading: maintenanceLoading, error: maintenanceError } = useMaintenanceSchedules()
  const { data: routesData, isLoading: routesLoading, error: routesError } = useRoutes()

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
    if (vehiclesError) {
      console.error('[useFleetData] Vehicles API error:', vehiclesError)
    }
    if (driversError) {
      console.error('[useFleetData] Drivers API error:', driversError)
    }
    if (facilitiesError) {
      console.error('[useFleetData] Facilities API error:', facilitiesError)
    }

    // Log when data arrives
    if (DEBUG_FLEET_DATA) {
      console.log('[useFleetData] API Data State:', {
        vehicles: { count: vehiclesData?.data?.length ?? 'N/A', loading: vehiclesLoading, error: !!vehiclesError },
        drivers: { count: driversData?.data?.length ?? 'N/A', loading: driversLoading, error: !!driversError },
        facilities: { count: facilitiesData?.data?.length ?? 'N/A', loading: facilitiesLoading, error: !!facilitiesError }
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

  // Extract data arrays from API responses ONLY - no demo data fallback
  // Add defensive checks to ensure arrays and required properties exist
  // Use useMemo to stabilize references and prevent infinite loops in dependent hooks
  const vehicles = useMemo(() => {
    const rawVehicles = vehiclesData?.data || []
    return Array.isArray(rawVehicles) ? rawVehicles.map(v => ({
      ...v,
      // Ensure alerts is always an array to prevent .length errors
      alerts: Array.isArray(v.alerts) ? v.alerts : []
    })) : []
  }, [vehiclesData?.data])

  const drivers = useMemo(() => {
    const rawDrivers = driversData?.data || []
    return Array.isArray(rawDrivers) ? rawDrivers : []
  }, [driversData?.data])

  const workOrders = useMemo(() => {
    const rawWorkOrders = workOrdersData?.data || []
    return Array.isArray(rawWorkOrders) ? rawWorkOrders : []
  }, [workOrdersData?.data])

  const fuelTransactions = useMemo(() => {
    const rawFuelTransactions = fuelTransactionsData?.data || []
    return Array.isArray(rawFuelTransactions) ? rawFuelTransactions : []
  }, [fuelTransactionsData?.data])

  const facilities = useMemo(() => {
    const rawFacilities = facilitiesData?.data || []
    return Array.isArray(rawFacilities) ? rawFacilities : []
  }, [facilitiesData?.data])

  const maintenanceSchedules = useMemo(() => {
    const rawMaintenanceSchedules = maintenanceData?.data || []
    return Array.isArray(rawMaintenanceSchedules) ? rawMaintenanceSchedules : []
  }, [maintenanceData?.data])

  const routes = useMemo(() => {
    const rawRoutes = routesData?.data || []
    return Array.isArray(rawRoutes) ? rawRoutes : []
  }, [routesData?.data])

  // Log data extraction results for debugging
  useEffect(() => {
    if (DEBUG_FLEET_DATA) {
      console.log('[useFleetData] Data extracted from API:', {
        vehicles: vehicles.length,
        drivers: drivers.length,
        facilities: facilities.length,
        sampleVehicle: vehicles[0] ? { id: vehicles[0].id, alerts: vehicles[0].alerts } : null
      })
    }
  }, [vehicles.length, drivers.length, facilities.length])

  // Legacy compatibility - map facilities to serviceBays and staff
  // Use useMemo to prevent creating new arrays on every render
  const serviceBays = useMemo(() => facilities, [facilities])
  const staff = useMemo(() =>
    drivers.filter((d: any) => d.role === 'technician' || d.role === 'fleet_manager'),
    [drivers]
  )
  const technicians = useMemo(() =>
    drivers.filter((d: any) => d.role === 'technician'),
    [drivers]
  )

  // Data initialization - API only, no demo data
  const initializeData = useCallback(() => {
    logger.info('✅ Using production API/emulator data - no hardcoded demo data')
  }, [])

  // CRUD operations using API mutations
  const addVehicle = useCallback(async (vehicle: any) => {
    return await vehicleMutations.create(vehicle)
  }, [vehicleMutations])

  const updateVehicle = useCallback(async (id: string, updates: any) => {
    return await vehicleMutations.update(id, updates)
  }, [vehicleMutations])

  const deleteVehicle = useCallback(async (id: string) => {
    return await vehicleMutations.delete(id)
  }, [vehicleMutations])

  const addDriver = useCallback(async (driver: any) => {
    return await driverMutations.create(driver)
  }, [driverMutations])

  const updateDriver = useCallback(async (id: string, updates: any) => {
    return await driverMutations.update(id, updates)
  }, [driverMutations])

  const deleteDriver = useCallback(async (id: string) => {
    return await driverMutations.delete(id)
  }, [driverMutations])

  const addStaff = useCallback(async (person: any) => {
    return await driverMutations.create({ ...person, role: 'technician' })
  }, [driverMutations])

  const updateStaff = useCallback(async (id: string, updates: any) => {
    return await driverMutations.update(id, updates)
  }, [driverMutations])

  const deleteStaff = useCallback(async (id: string) => {
    return await driverMutations.delete(id)
  }, [driverMutations])

  const addWorkOrder = useCallback(async (order: any) => {
    return await workOrderMutations.create(order)
  }, [workOrderMutations])

  const updateWorkOrder = useCallback(async (id: string, updates: any) => {
    return await workOrderMutations.update(id, updates)
  }, [workOrderMutations])

  const deleteWorkOrder = useCallback(async (id: string) => {
    return await workOrderMutations.delete(id)
  }, [workOrderMutations])

  const addFuelTransaction = useCallback(async (transaction: any) => {
    return await fuelMutations.create(transaction)
  }, [fuelMutations])

  const updateServiceBay = useCallback(async (id: string, updates: any) => {
    return await facilityMutations.update(id, updates)
  }, [facilityMutations])

  const addMileageReimbursement = useCallback(async (reimbursement: any) => {
    // Store as fuel transaction with type='mileage'
    return await fuelMutations.create({ ...reimbursement, type: 'mileage' })
  }, [fuelMutations])

  const updateMileageReimbursement = useCallback(async (id: string, updates: any) => {
    return await fuelMutations.update(id, updates)
  }, [fuelMutations])

  const deleteMileageReimbursement = useCallback(async (id: string) => {
    return await fuelMutations.delete(id)
  }, [fuelMutations])

  const addMaintenanceRequest = useCallback(async (request: any) => {
    return await maintenanceMutations.create(request)
  }, [maintenanceMutations])

  const updateMaintenanceRequest = useCallback(async (id: string, updates: any) => {
    return await maintenanceMutations.update(id, updates)
  }, [maintenanceMutations])

  const addRoute = useCallback(async (route: any) => {
    return await routeMutations.create(route)
  }, [routeMutations])

  const updateRoute = useCallback(async (id: string, updates: any) => {
    return await routeMutations.update(id, updates)
  }, [routeMutations])

  const deleteRoute = useCallback(async (id: string) => {
    return await routeMutations.delete(id)
  }, [routeMutations])

  // Filter mileage reimbursements from fuel transactions where type='mileage'
  const mileageReimbursements = useMemo(() =>
    fuelTransactions.filter((transaction: any) => transaction.type === 'mileage'),
    [fuelTransactions]
  )

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
    dataInitialized: true, // Always true with API
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
