/**
 * Vehicle Filters Hook
 *
 * Centralized hook for filtering vehicles across all fleet management modules.
 * Eliminates duplicate filter logic in 12+ modules.
 *
 * Features:
 * - Status filtering (active, inactive, maintenance, all)
 * - Type/fuel type filtering (electric, hybrid, gas, diesel, all)
 * - Location filtering
 * - Search/text filtering
 * - Make/model filtering
 * - Department/assignment filtering
 * - Memoized results for performance
 *
 * Usage:
 * ```tsx
 * const { filters, setFilters, filteredVehicles, filterStats } = useVehicleFilters(vehicles)
 *
 * <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
 *   <SelectItem value="all">All ({filterStats.all})</SelectItem>
 *   <SelectItem value="active">Active ({filterStats.active})</SelectItem>
 * </Select>
 * ```
 */

import { useState, useMemo, useCallback } from 'react'

export interface VehicleFilters {
  status: 'all' | 'active' | 'inactive' | 'maintenance' | 'out_of_service'
  type: 'all' | 'electric' | 'hybrid' | 'gas' | 'diesel' | 'other'
  location: string // 'all' or specific location ID
  department: string // 'all' or specific department
  make: string // 'all' or specific make
  searchTerm: string
  assignedOnly: boolean // Only show assigned vehicles
  availableOnly: boolean // Only show available vehicles
}

export interface FilterStats {
  all: number
  active: number
  inactive: number
  maintenance: number
  outOfService: number
  electric: number
  hybrid: number
  gas: number
  diesel: number
  assigned: number
  available: number
}

interface Vehicle {
  id: string
  status?: string
  type?: string
  fuelType?: string
  location?: string
  locationId?: string
  department?: string
  make?: string
  model?: string
  name?: string
  vehicleNumber?: string
  licensePlate?: string
  assignedTo?: string | null
  assignedDriver?: string | null
  [key: string]: any
}

const DEFAULT_FILTERS: VehicleFilters = {
  status: 'all',
  type: 'all',
  location: 'all',
  department: 'all',
  make: 'all',
  searchTerm: '',
  assignedOnly: false,
  availableOnly: false
}

export function useVehicleFilters(vehicles: Vehicle[] = []) {
  const [filters, setFilters] = useState<VehicleFilters>(DEFAULT_FILTERS)

  /**
   * Filter vehicles based on current filter state
   */
  const filteredVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return []

    return vehicles.filter((vehicle) => {
      // Status filter
      if (filters.status !== 'all') {
        const vehicleStatus = (vehicle.status || '').toLowerCase()
        const filterStatus = filters.status.toLowerCase()

        if (filters.status === 'out_of_service') {
          if (vehicleStatus !== 'out of service' && vehicleStatus !== 'out_of_service') {
            return false
          }
        } else if (vehicleStatus !== filterStatus) {
          return false
        }
      }

      // Type/Fuel type filter
      if (filters.type !== 'all') {
        const vehicleType = (vehicle.type || vehicle.fuelType || '').toLowerCase()
        const filterType = filters.type.toLowerCase()

        if (!vehicleType.includes(filterType)) {
          return false
        }
      }

      // Location filter
      if (filters.location !== 'all') {
        const vehicleLocation = vehicle.location || vehicle.locationId || ''
        if (vehicleLocation !== filters.location) {
          return false
        }
      }

      // Department filter
      if (filters.department !== 'all') {
        if (vehicle.department !== filters.department) {
          return false
        }
      }

      // Make filter
      if (filters.make !== 'all') {
        if (vehicle.make !== filters.make) {
          return false
        }
      }

      // Search term filter (searches multiple fields)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const searchableFields = [
          vehicle.name,
          vehicle.vehicleNumber,
          vehicle.licensePlate,
          vehicle.make,
          vehicle.model,
          `${vehicle.make} ${vehicle.model}`.trim()
        ].filter(Boolean)

        const matchesSearch = searchableFields.some((field) =>
          String(field).toLowerCase().includes(searchLower)
        )

        if (!matchesSearch) {
          return false
        }
      }

      // Assigned only filter
      if (filters.assignedOnly) {
        if (!vehicle.assignedTo && !vehicle.assignedDriver) {
          return false
        }
      }

      // Available only filter
      if (filters.availableOnly) {
        if (vehicle.assignedTo || vehicle.assignedDriver) {
          return false
        }
      }

      return true
    })
  }, [vehicles, filters])

  /**
   * Calculate statistics for all filter options
   */
  const filterStats = useMemo<FilterStats>(() => {
    if (!vehicles || vehicles.length === 0) {
      return {
        all: 0,
        active: 0,
        inactive: 0,
        maintenance: 0,
        outOfService: 0,
        electric: 0,
        hybrid: 0,
        gas: 0,
        diesel: 0,
        assigned: 0,
        available: 0
      }
    }

    const stats = {
      all: vehicles.length,
      active: 0,
      inactive: 0,
      maintenance: 0,
      outOfService: 0,
      electric: 0,
      hybrid: 0,
      gas: 0,
      diesel: 0,
      assigned: 0,
      available: 0
    }

    vehicles.forEach((vehicle) => {
      // Count by status
      const status = (vehicle.status || '').toLowerCase()
      if (status === 'active') stats.active++
      else if (status === 'inactive') stats.inactive++
      else if (status === 'maintenance') stats.maintenance++
      else if (status === 'out of service' || status === 'out_of_service') stats.outOfService++

      // Count by type
      const type = (vehicle.type || vehicle.fuelType || '').toLowerCase()
      if (type.includes('electric')) stats.electric++
      else if (type.includes('hybrid')) stats.hybrid++
      else if (type.includes('gas') || type.includes('gasoline')) stats.gas++
      else if (type.includes('diesel')) stats.diesel++

      // Count assigned vs available
      if (vehicle.assignedTo || vehicle.assignedDriver) {
        stats.assigned++
      } else {
        stats.available++
      }
    })

    return stats
  }, [vehicles])

  /**
   * Get unique values for dropdowns
   */
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    vehicles.forEach((v) => {
      const loc = v.location || v.locationId
      if (loc && typeof loc === 'string') {
        locations.add(loc)
      }
    })
    return Array.from(locations).sort()
  }, [vehicles])

  const uniqueDepartments = useMemo(() => {
    const departments = new Set<string>()
    vehicles.forEach((v) => {
      if (v.department && typeof v.department === 'string') {
        departments.add(v.department)
      }
    })
    return Array.from(departments).sort()
  }, [vehicles])

  const uniqueMakes = useMemo(() => {
    const makes = new Set<string>()
    vehicles.forEach((v) => {
      if (v.make && typeof v.make === 'string') {
        makes.add(v.make)
      }
    })
    return Array.from(makes).sort()
  }, [vehicles])

  /**
   * Reset all filters to default
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  /**
   * Update a single filter
   */
  const updateFilter = useCallback(<K extends keyof VehicleFilters>(
    key: K,
    value: VehicleFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.type !== 'all' ||
      filters.location !== 'all' ||
      filters.department !== 'all' ||
      filters.make !== 'all' ||
      filters.searchTerm !== '' ||
      filters.assignedOnly ||
      filters.availableOnly
    )
  }, [filters])

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredVehicles,
    filterStats,
    uniqueLocations,
    uniqueDepartments,
    uniqueMakes,
    hasActiveFilters,
    totalCount: vehicles.length,
    filteredCount: filteredVehicles.length
  }
}
