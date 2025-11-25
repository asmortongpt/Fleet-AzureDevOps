/**
 * Fleet Data Hook - Hybrid Version
 * Uses real API when available, falls back to demo data for demos/development
 */

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
import { useCallback, useState, useEffect, useMemo } from 'react'
import { generateAllDemoData } from '@/lib/demo-data'
import logger from '@/utils/logger'

// Debug flag - set to true in localStorage for verbose logging
const DEBUG_FLEET_DATA = typeof window !== 'undefined' && localStorage.getItem('debug_fleet_data') === 'true'

// Store API responses for debugging
if (typeof window !== 'undefined') {
  (window as any).__FLEET_API_RESPONSES__ = {}
}

// Cache demo mode setting to avoid repeated localStorage reads
const DEMO_MODE_CACHED = (() => {
  try {
    return localStorage.getItem('demo_mode') !== 'false';
  } catch {
    return true; // Default to demo mode if localStorage unavailable
  }
})();

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

  // Demo data fallback
  const [demoData] = useState(() => generateAllDemoData())
  const [useDemoData, setUseDemoData] = useState(DEMO_MODE_CACHED)

  // Check if we should use demo data (API unavailable or demo mode)
  useEffect(() => {
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    const hasApiErrors = vehiclesError || driversError || facilitiesError
    const isLoading = vehiclesLoading || driversLoading || facilitiesLoading
    const hasNoData = !vehiclesData && !driversData && !facilitiesData

    // Activate demo mode if:
    // 1. Explicitly enabled in localStorage, OR
    // 2. Loading finished but there's no data and no errors (API not configured), OR
    // 3. There are API errors
    if (isDemoMode || (!isLoading && hasNoData) || hasApiErrors) {
      if (!useDemoData) {
        setUseDemoData(true)
        logger.info('📊 Using demo data for walkthrough (API unavailable or demo mode active)')
      }
    }
  }, [vehiclesError, driversError, facilitiesError, vehiclesData, driversData, facilitiesData, vehiclesLoading, driversLoading, facilitiesLoading, useDemoData])

  // Mutation hooks
  const vehicleMutations = useVehicleMutations()
  const driverMutations = useDriverMutations()
  const workOrderMutations = useWorkOrderMutations()
  const fuelMutations = useFuelTransactionMutations()
  const facilityMutations = useFacilityMutations()
  const maintenanceMutations = useMaintenanceScheduleMutations()
  const routeMutations = useRouteMutations()

  // Extract data arrays from API responses or use demo data
  // Add defensive checks to ensure arrays and required properties exist
  // Use useMemo to stabilize references and prevent infinite loops in dependent hooks
  const vehicles = useMemo(() => {
    const rawVehicles = useDemoData ? demoData.vehicles : (vehiclesData?.data || [])
    return Array.isArray(rawVehicles) ? rawVehicles.map(v => ({
      ...v,
      // Ensure alerts is always an array to prevent .length errors
      alerts: Array.isArray(v.alerts) ? v.alerts : []
    })) : []
  }, [useDemoData, demoData.vehicles, vehiclesData?.data])

  const drivers = useMemo(() => {
    const rawDrivers = useDemoData ? demoData.drivers : (driversData?.data || [])
    return Array.isArray(rawDrivers) ? rawDrivers : []
  }, [useDemoData, demoData.drivers, driversData?.data])

  const workOrders = useMemo(() => {
    const rawWorkOrders = useDemoData ? demoData.workOrders : (workOrdersData?.data || [])
    return Array.isArray(rawWorkOrders) ? rawWorkOrders : []
  }, [useDemoData, demoData.workOrders, workOrdersData?.data])

  const fuelTransactions = useMemo(() => {
    const rawFuelTransactions = useDemoData ? demoData.fuelTransactions : (fuelTransactionsData?.data || [])
    return Array.isArray(rawFuelTransactions) ? rawFuelTransactions : []
  }, [useDemoData, demoData.fuelTransactions, fuelTransactionsData?.data])

  const facilities = useMemo(() => {
    const rawFacilities = useDemoData ? demoData.facilities : (facilitiesData?.data || [])
    return Array.isArray(rawFacilities) ? rawFacilities : []
  }, [useDemoData, demoData.facilities, facilitiesData?.data])

  const maintenanceSchedules = useMemo(() => {
    const rawMaintenanceSchedules = useDemoData ? demoData.maintenanceSchedules : (maintenanceData?.data || [])
    return Array.isArray(rawMaintenanceSchedules) ? rawMaintenanceSchedules : []
  }, [useDemoData, demoData.maintenanceSchedules, maintenanceData?.data])

  const routes = useMemo(() => {
    const rawRoutes = useDemoData ? demoData.routes : (routesData?.data || [])
    return Array.isArray(rawRoutes) ? rawRoutes : []
  }, [useDemoData, demoData.routes, routesData?.data])

  // Log data extraction results for debugging
  useEffect(() => {
    if (DEBUG_FLEET_DATA) {
      console.log('[useFleetData] Data extracted:', {
        vehicles: vehicles.length,
        drivers: drivers.length,
        facilities: facilities.length,
        useDemoData,
        sampleVehicle: vehicles[0] ? { id: vehicles[0].id, alerts: vehicles[0].alerts } : null
      })
    }
  }, [vehicles.length, drivers.length, facilities.length, useDemoData])

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

  // Data initialization
  const initializeData = useCallback(() => {
    if (useDemoData) {
      logger.info('✅ Demo data initialized - 50 vehicles, 5 facilities, 30 drivers ready for walkthrough')
    } else {
      logger.info('Using production API - data initialization not required')
    }
  }, [useDemoData])

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

  return {
    vehicles,
    drivers,
    staff,
    serviceBays: facilities,
    facilities,
    workOrders,
    technicians,
    fuelTransactions,
    mileageReimbursements: [], // TODO: filter fuel transactions
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
