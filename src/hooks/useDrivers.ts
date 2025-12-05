import { createCrudHooks } from './useCrudResource'

export interface Driver {
  id: number
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: Date
  licenseClass: string
  status: 'active' | 'inactive' | 'suspended'
  photoUrl?: string
  azureAdId?: string
  assignedVehicleId?: number
  rating: number
  totalTrips: number
  totalMiles: number
  safetyScore: number
  hireDate: Date
}

// Create all CRUD hooks using the shared factory
const driverHooks = createCrudHooks<Driver>({
  resourceName: 'drivers',
  queryKey: 'drivers'
})

// Export with consistent naming
export const useDrivers = driverHooks.useList
export const useDriver = driverHooks.useOne
export const useCreateDriver = driverHooks.useCreate
export const useUpdateDriver = driverHooks.useUpdate
export const useDeleteDriver = driverHooks.useDelete
