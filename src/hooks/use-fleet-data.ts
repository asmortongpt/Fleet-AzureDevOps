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
import { useCallback, useState, useEffect } from 'react'
import { generateAllDemoData } from '@/lib/demo-data'
import logger from '@/utils/logger'

export function useFleetData() {
  // Fetch data from API using SWR hooks
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { data: driversData, isLoading: driversLoading, error: driversError } = useDrivers()
  const { data: workOrdersData, isLoading: workOrdersLoading, error: workOrdersError } = useWorkOrders()
  const { data: fuelTransactionsData, isLoading: fuelLoading, error: fuelError } = useFuelTransactions()
  const { data: facilitiesData, isLoading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const { data: maintenanceData, isLoading: maintenanceLoading, error: maintenanceError } = useMaintenanceSchedules()
  const { data: routesData, isLoading: routesLoading, error: routesError } = useRoutes()

  // Demo data fallback
  const [demoData] = useState(() => generateAllDemoData())
  const [useDemoData, setUseDemoData] = useState(() => {
    // Check for demo mode on mount
    // Enable demo mode by default in production until all APIs are implemented
    const explicitDemoMode = localStorage.getItem('demo_mode')
    return explicitDemoMode !== 'false' // Default to true unless explicitly disabled
  })

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
  const vehicles = useDemoData ? demoData.vehicles : (vehiclesData?.data || [])
  const drivers = useDemoData ? demoData.drivers : (driversData?.data || [])
  const workOrders = useDemoData ? demoData.workOrders : (workOrdersData?.data || [])
  const fuelTransactions = useDemoData ? demoData.fuelTransactions : (fuelTransactionsData?.data || [])
  const facilities = useDemoData ? demoData.facilities : (facilitiesData?.data || [])
  const maintenanceSchedules = useDemoData ? demoData.maintenanceSchedules : (maintenanceData?.data || [])
  const routes = useDemoData ? demoData.routes : (routesData?.data || [])

  // Legacy compatibility - map facilities to serviceBays and staff
  const serviceBays = facilities
  const staff = drivers.filter((d: any) => d.role === 'technician' || d.role === 'fleet_manager')
  const technicians = drivers.filter((d: any) => d.role === 'technician')

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
