import { useState, useMemo } from "react"

import { Vehicle } from "@/lib/types"

export interface AdvancedFilterCriteria {
  vehicleStatus: string[]
  departments: string[]
  regions: string[]
  fuelLevelRange: [number, number]
  mileageRange: { min: number | null; max: number | null }
  alertStatus: string[]
  driverAssigned: string
  vehicleTypes: string[]
  yearRange: { from: number | null; to: number | null }
  lastMaintenance: string
}

export const defaultFilterCriteria: AdvancedFilterCriteria = {
  vehicleStatus: [],
  departments: [],
  regions: [],
  fuelLevelRange: [0, 100],
  mileageRange: { min: null, max: null },
  alertStatus: [],
  driverAssigned: "all",
  vehicleTypes: [],
  yearRange: { from: null, to: null },
  lastMaintenance: "all"
}

export function useFleetFilters(vehicles: Vehicle[]) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCriteria, setFilterCriteria] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter
      const matchesSearch =
        !searchQuery ||
        searchQuery === "" ||
        v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAdvancedStatus =
        appliedFilters.vehicleStatus.length === 0 || appliedFilters.vehicleStatus.includes(v.status)
      const matchesDepartment =
        appliedFilters.departments.length === 0 || appliedFilters.departments.includes(v.department)
      const matchesAdvancedRegion =
        appliedFilters.regions.length === 0 || appliedFilters.regions.includes(v.region)
      const matchesFuelLevel =
        v.fuelLevel >= appliedFilters.fuelLevelRange[0] &&
        v.fuelLevel <= appliedFilters.fuelLevelRange[1]
      const matchesMileage =
        (appliedFilters.mileageRange.min === null || v.mileage >= appliedFilters.mileageRange.min) &&
        (appliedFilters.mileageRange.max === null || v.mileage <= appliedFilters.mileageRange.max)
      const matchesAlertStatus =
        appliedFilters.alertStatus.length === 0 ||
        (appliedFilters.alertStatus.includes("has-alerts") && v.alerts && v.alerts.length > 0) ||
        (appliedFilters.alertStatus.includes("no-alerts") && (!v.alerts || v.alerts.length === 0)) ||
        (appliedFilters.alertStatus.includes("critical") &&
          v.alerts &&
          v.alerts.some((a) => a.toLowerCase().includes("critical")))
      const matchesDriverAssignment =
        appliedFilters.driverAssigned === "all" ||
        (appliedFilters.driverAssigned === "assigned" && v.assignedDriver) ||
        (appliedFilters.driverAssigned === "unassigned" && !v.assignedDriver)
      const matchesVehicleType =
        appliedFilters.vehicleTypes.length === 0 ||
        appliedFilters.vehicleTypes.some(
          (type) =>
            v.make.toLowerCase().includes(type.toLowerCase()) ||
            v.model.toLowerCase().includes(type.toLowerCase())
        )
      const matchesYearRange =
        (appliedFilters.yearRange.from === null || v.year >= appliedFilters.yearRange.from) &&
        (appliedFilters.yearRange.to === null || v.year <= appliedFilters.yearRange.to)

      return (
        matchesStatus &&
        matchesSearch &&
        matchesAdvancedStatus &&
        matchesDepartment &&
        matchesAdvancedRegion &&
        matchesFuelLevel &&
        matchesMileage &&
        matchesAlertStatus &&
        matchesDriverAssignment &&
        matchesVehicleType &&
        matchesYearRange
      )
    })
  }, [vehicles, statusFilter, searchQuery, appliedFilters])

  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.vehicleStatus.length > 0 ||
      appliedFilters.departments.length > 0 ||
      appliedFilters.regions.length > 0 ||
      appliedFilters.fuelLevelRange[0] > 0 ||
      appliedFilters.fuelLevelRange[1] < 100 ||
      appliedFilters.mileageRange.min !== null ||
      appliedFilters.mileageRange.max !== null ||
      appliedFilters.alertStatus.length > 0 ||
      appliedFilters.driverAssigned !== "all" ||
      appliedFilters.vehicleTypes.length > 0 ||
      appliedFilters.yearRange.from !== null ||
      appliedFilters.yearRange.to !== null ||
      appliedFilters.lastMaintenance !== "all"
    )
  }, [appliedFilters])

  const clearAllFilters = () => {
    setFilterCriteria(defaultFilterCriteria)
    setAppliedFilters(defaultFilterCriteria)
    setStatusFilter("all")
    setSearchQuery("")
  }

  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filterCriteria,
    setFilterCriteria,
    appliedFilters,
    setAppliedFilters,
    filteredVehicles,
    hasActiveFilters,
    clearAllFilters
  }
}
