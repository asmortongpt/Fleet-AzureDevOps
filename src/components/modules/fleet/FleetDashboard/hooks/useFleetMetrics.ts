import { useMemo } from "react"

import { Vehicle } from "@/lib/types"

export function useFleetMetrics(vehicles: Vehicle[]) {
  const metrics = useMemo(() => {
    const totalVehicles = vehicles.length
    const activeVehicles = vehicles.filter((v) => v.status === "active").length
    const inService = vehicles.filter((v) => v.status === "service").length
    const inactive = vehicles.filter((v) => v.status === "inactive").length

    const lowFuelVehicles = vehicles.filter((v) => v.fuelLevel < 25).length
    const criticalAlerts = vehicles.filter(
      (v) => v.alerts && v.alerts.some((a) => a.toLowerCase().includes("critical"))
    ).length

    const avgFuelLevel =
      vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0) / vehicles.length
        : 0

    const avgMileage =
      vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / vehicles.length
        : 0

    const totalAlerts = vehicles.reduce((sum, v) => sum + (v.alerts?.length || 0), 0)

    // Region distribution
    const regionCounts = vehicles.reduce(
      (acc, v) => {
        acc[v.region] = (acc[v.region] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Department distribution
    const departmentCounts = vehicles.reduce(
      (acc, v) => {
        acc[v.department] = (acc[v.department] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Status distribution
    const statusCounts = vehicles.reduce(
      (acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalVehicles,
      activeVehicles,
      inService,
      inactive,
      lowFuelVehicles,
      criticalAlerts,
      avgFuelLevel: Math.round(avgFuelLevel),
      avgMileage: Math.round(avgMileage),
      totalAlerts,
      regionCounts,
      departmentCounts,
      statusCounts,
      utilizationRate: totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0
    }
  }, [vehicles])

  return metrics
}
