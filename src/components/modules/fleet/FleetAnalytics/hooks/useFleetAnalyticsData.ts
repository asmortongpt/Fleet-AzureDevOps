import { useMemo } from "react"

import { Vehicle, FuelTransaction, WorkOrder } from "@/lib/types"

interface FleetAnalyticsMetrics {
  totalFleet: number
  utilization: number
  totalFuelCost: number
  totalMaintenanceCost: number
  avgMileage: number
  downtime: number
}

interface FleetAnalyticsKPIs {
  costPerVehicle: number
  costPerMile: string
  downtimeRate: string
  fuelEfficiency: string
}

export function useFleetAnalyticsData(
  vehicles: Vehicle[],
  fuelTransactions: FuelTransaction[],
  workOrders: WorkOrder[]
) {
  const metrics = useMemo<FleetAnalyticsMetrics>(() => {
    const totalFuelCost = fuelTransactions.reduce((sum, t) => sum + (t?.totalCost ?? 0), 0)
    const totalMaintenanceCost = workOrders
      .filter(w => w?.cost)
      .reduce((sum, w) => sum + (w?.cost ?? 0), 0)

    const activeVehicles = vehicles.filter(v => v?.status === "active").length
    const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0

    const avgMileage = vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + (v?.mileage ?? 0), 0) / vehicles.length)
      : 0

    const downtime = vehicles.filter(v => v?.status === "service").length

    return {
      totalFleet: vehicles.length,
      utilization,
      totalFuelCost,
      totalMaintenanceCost,
      avgMileage,
      downtime
    }
  }, [vehicles, fuelTransactions, workOrders])

  const kpis = useMemo<FleetAnalyticsKPIs>(() => {
    return {
      costPerVehicle: metrics.totalFleet > 0
        ? Math.round((metrics.totalFuelCost + metrics.totalMaintenanceCost) / metrics.totalFleet)
        : 0,
      costPerMile: metrics.avgMileage > 0 && metrics.totalFleet > 0
        ? ((metrics.totalFuelCost + metrics.totalMaintenanceCost) / (metrics.avgMileage * metrics.totalFleet)).toFixed(2)
        : "0.00",
      downtimeRate: metrics.totalFleet > 0
        ? ((metrics.downtime / metrics.totalFleet) * 100).toFixed(1)
        : "0.0",
      fuelEfficiency: fuelTransactions.length > 0
        ? (fuelTransactions.reduce((sum, t) => sum + (t?.mpg ?? 0), 0) / fuelTransactions.length).toFixed(1)
        : "0.0"
    }
  }, [metrics, fuelTransactions])

  return { metrics, kpis }
}
