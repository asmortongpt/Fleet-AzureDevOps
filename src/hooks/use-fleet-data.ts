/**
 * Fleet Data Hook - Demo Data with Optional Emulator Enhancement
 * Uses demo data by default, optionally enhanced with live emulator telemetry
 * Site works perfectly without emulator - enhancement is graceful
 */

import { useCallback, useMemo } from 'react'
import logger from '@/utils/logger'
import {
  generateDemoVehicles,
  generateDemoDrivers,
  generateDemoFacilities,
  generateDemoWorkOrders,
  generateDemoFuelTransactions,
  generateDemoRoutes
} from '@/lib/demo-data'
import { useEmulatorEnhancement } from '@/hooks/use-emulator-enhancement'

/**
 * Main fleet data hook
 * Returns demo data enhanced with live emulator telemetry when available
 */
export function useFleetData() {
  // Generate demo data (always available)
  const demoVehicles = useMemo(() => generateDemoVehicles(50), [])
  const demoDrivers = useMemo(() => generateDemoDrivers(20), [])
  const demoFacilities = useMemo(() => generateDemoFacilities(), [])
  const demoWorkOrders = useMemo(() => generateDemoWorkOrders(15), [])
  const demoFuelTransactions = useMemo(() => generateDemoFuelTransactions(25), [])
  const demoMaintenanceSchedules = useMemo(() => [], []) // Empty for now
  const demoRoutes = useMemo(() => generateDemoRoutes(5), [])

  // Initialize emulator enhancement (optional)
  const { enhanceVehicles, status: emulatorStatus } = useEmulatorEnhancement()

  // Apply enhancement to vehicles if emulator is available
  const vehicles = useMemo(() => {
    // Ensure alerts is always an array to prevent .length errors
    const vehiclesWithAlerts = demoVehicles.map(v => ({
      ...v,
      alerts: Array.isArray(v.alerts) ? v.alerts : []
    }))
    return enhanceVehicles(vehiclesWithAlerts)
  }, [demoVehicles, enhanceVehicles])

  // Other data stays as demo (could be enhanced later if needed)
  const drivers = useMemo(() => demoDrivers, [demoDrivers])
  const workOrders = useMemo(() => demoWorkOrders, [demoWorkOrders])
  const fuelTransactions = useMemo(() => demoFuelTransactions, [demoFuelTransactions])
  const facilities = useMemo(() => demoFacilities, [demoFacilities])
  const maintenanceSchedules = useMemo(() => demoMaintenanceSchedules, [demoMaintenanceSchedules])
  const routes = useMemo(() => demoRoutes, [demoRoutes])

  // Legacy compatibility - map facilities to serviceBays and staff
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
    if (emulatorStatus.connected) {
      logger.info('✅ Using demo data enhanced with live emulator telemetry')
    } else {
      logger.info('✅ Using demo data - emulator not connected')
    }
  }, [emulatorStatus.connected])

  // CRUD operations (in-memory for demo data)
  // In a real implementation, these would update localStorage or make API calls
  const addVehicle = useCallback(async (vehicle: any) => {
    logger.info('addVehicle called (demo mode)', vehicle)
    return { success: true, data: { ...vehicle, id: `VEH-${Date.now()}` } }
  }, [])

  const updateVehicle = useCallback(async (id: string, updates: any) => {
    logger.info('updateVehicle called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteVehicle = useCallback(async (id: string) => {
    logger.info('deleteVehicle called (demo mode)', { id })
    return { success: true }
  }, [])

  const addDriver = useCallback(async (driver: any) => {
    logger.info('addDriver called (demo mode)', driver)
    return { success: true, data: { ...driver, id: `DRV-${Date.now()}` } }
  }, [])

  const updateDriver = useCallback(async (id: string, updates: any) => {
    logger.info('updateDriver called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteDriver = useCallback(async (id: string) => {
    logger.info('deleteDriver called (demo mode)', { id })
    return { success: true }
  }, [])

  const addStaff = useCallback(async (person: any) => {
    logger.info('addStaff called (demo mode)', person)
    return { success: true, data: { ...person, role: 'technician', id: `STF-${Date.now()}` } }
  }, [])

  const updateStaff = useCallback(async (id: string, updates: any) => {
    logger.info('updateStaff called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteStaff = useCallback(async (id: string) => {
    logger.info('deleteStaff called (demo mode)', { id })
    return { success: true }
  }, [])

  const addWorkOrder = useCallback(async (order: any) => {
    logger.info('addWorkOrder called (demo mode)', order)
    return { success: true, data: { ...order, id: `WO-${Date.now()}` } }
  }, [])

  const updateWorkOrder = useCallback(async (id: string, updates: any) => {
    logger.info('updateWorkOrder called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteWorkOrder = useCallback(async (id: string) => {
    logger.info('deleteWorkOrder called (demo mode)', { id })
    return { success: true }
  }, [])

  const addFuelTransaction = useCallback(async (transaction: any) => {
    logger.info('addFuelTransaction called (demo mode)', transaction)
    return { success: true, data: { ...transaction, id: `FT-${Date.now()}` } }
  }, [])

  const updateServiceBay = useCallback(async (id: string, updates: any) => {
    logger.info('updateServiceBay called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const addMileageReimbursement = useCallback(async (reimbursement: any) => {
    logger.info('addMileageReimbursement called (demo mode)', reimbursement)
    return { success: true, data: { ...reimbursement, type: 'mileage', id: `MR-${Date.now()}` } }
  }, [])

  const updateMileageReimbursement = useCallback(async (id: string, updates: any) => {
    logger.info('updateMileageReimbursement called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteMileageReimbursement = useCallback(async (id: string) => {
    logger.info('deleteMileageReimbursement called (demo mode)', { id })
    return { success: true }
  }, [])

  const addMaintenanceRequest = useCallback(async (request: any) => {
    logger.info('addMaintenanceRequest called (demo mode)', request)
    return { success: true, data: { ...request, id: `MNT-${Date.now()}` } }
  }, [])

  const updateMaintenanceRequest = useCallback(async (id: string, updates: any) => {
    logger.info('updateMaintenanceRequest called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const addRoute = useCallback(async (route: any) => {
    logger.info('addRoute called (demo mode)', route)
    return { success: true, data: { ...route, id: `RT-${Date.now()}` } }
  }, [])

  const updateRoute = useCallback(async (id: string, updates: any) => {
    logger.info('updateRoute called (demo mode)', { id, updates })
    return { success: true, data: updates }
  }, [])

  const deleteRoute = useCallback(async (id: string) => {
    logger.info('deleteRoute called (demo mode)', { id })
    return { success: true }
  }, [])

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
    dataInitialized: true, // Always true with demo data
    isLoading: false, // Never loading with demo data
    emulatorStatus, // Expose emulator connection status
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
