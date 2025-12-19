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
    if (DEBUG_FLEET_DATA) {
      logger.debug('[useFleetData] Demo Mode:', isDemoMode())
      logger.debug('[useFleetData] API Data State:', {
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

  // Extract data arrays with demo fallback
  const vehicles = useMemo(() => {
    if (isDemoMode()) {
      // Use demo data
      const demoVehicles = generateDemoVehicles(50)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo vehicles:', demoVehicles.length)
      return demoVehicles
    }
    
    // Use API data
    const rawVehicles = vehiclesData?.data || []
    return Array.isArray(rawVehicles) ? rawVehicles.map(v => ({
      ...v,
      alerts: Array.isArray(v.alerts) ? v.alerts : []
    })) : []
  }, [vehiclesData?.data])

  const drivers = useMemo(() => {
    if (isDemoMode()) {
      const demoDrivers = generateDemoDrivers(20)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo drivers:', demoDrivers.length)
      return demoDrivers
    }
    
    const rawDrivers = driversData?.data || []
    return Array.isArray(rawDrivers) ? rawDrivers : []
  }, [driversData?.data])

  const workOrders = useMemo(() => {
    if (isDemoMode()) {
      const demoOrders = generateDemoWorkOrders(30)
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo work orders:', demoOrders.length)
      return demoOrders
    }
    
    const rawWorkOrders = workOrdersData?.data || []
    return Array.isArray(rawWorkOrders) ? rawWorkOrders : []
  }, [workOrdersData?.data])

  const fuelTransactions = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo fuel transactions for now
    }
    
    const rawFuelTransactions = fuelTransactionsData?.data || []
    return Array.isArray(rawFuelTransactions) ? rawFuelTransactions : []
  }, [fuelTransactionsData?.data])

  const facilities = useMemo(() => {
    if (isDemoMode()) {
      const demoFacilities = generateDemoFacilities()
      if (DEBUG_FLEET_DATA) logger.debug('[useFleetData] Using demo facilities:', demoFacilities.length)
      return demoFacilities
    }
    
    const rawFacilities = facilitiesData?.data || []
    return Array.isArray(rawFacilities) ? rawFacilities : []
  }, [facilitiesData?.data])

  const maintenanceSchedules = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo maintenance schedules for now
    }
    
    const rawMaintenanceSchedules = maintenanceData?.data || []
    return Array.isArray(rawMaintenanceSchedules) ? rawMaintenanceSchedules : []
  }, [maintenanceData?.data])

  const routes = useMemo(() => {
    if (isDemoMode()) {
      return [] // No demo routes for now
    }
    
    const rawRoutes = routesData?.data || []
    return Array.isArray(rawRoutes) ? rawRoutes : []
  }, [routesData?.data])

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
  const serviceBays = useMemo(() => facilities, [facilities])
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

  // Filter mileage reimbursements
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
