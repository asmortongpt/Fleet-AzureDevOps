import { useMemo } from "react"

import { FuelTransaction, Vehicle, WorkOrder } from "@/lib/types"

const parseDate = (value?: string | number | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const monthKey = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

const formatMonth = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" })

const getMonths = (count: number) => {
  const base = new Date()
  base.setUTCDate(1)
  base.setUTCHours(0, 0, 0, 0)
  const months: Date[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(base)
    d.setUTCMonth(base.getUTCMonth() - i)
    months.push(d)
  }
  return months
}

const toNumber = (value: any) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export function useChartData(
  vehicles: Vehicle[],
  fuelTransactions: FuelTransaction[] = [],
  workOrders: WorkOrder[] = []
) {
  const monthlyFleetData = useMemo(() => {
    const totalVehicles = vehicles.length
    const activeStatuses = new Set(["active", "emergency", "charging"])

    const currentActive = vehicles.filter((v) => activeStatuses.has(String(v.status))).length
    const currentService = vehicles.filter((v) => String(v.status) === "service").length
    const currentIdle = Math.max(totalVehicles - currentActive - currentService, 0)
    const currentUtilization = totalVehicles > 0 ? Math.round((currentActive / totalVehicles) * 100) : 0

    const activityAvailable = fuelTransactions.length > 0 || workOrders.length > 0
    if (!activityAvailable) {
      return [
        {
          name: "Current",
          active: currentActive,
          idle: currentIdle,
          service: currentService,
          utilization: currentUtilization
        }
      ]
    }

    const months = getMonths(6)
    const monthKeys = new Set(months.map(monthKey))

    const activeByMonth = new Map<string, Set<string>>()
    const serviceByMonth = new Map<string, Set<string>>()

    const ensureSet = (map: Map<string, Set<string>>, key: string) => {
      if (!map.has(key)) map.set(key, new Set())
      return map.get(key)!
    }

    fuelTransactions.forEach((transaction) => {
      const date = parseDate((transaction as any).date || (transaction as any).transaction_date || (transaction as any).created_at)
      if (!date) return
      const key = monthKey(date)
      if (!monthKeys.has(key)) return
      const vehicleId =
        (transaction as any).vehicleId ||
        (transaction as any).vehicle_id ||
        (transaction as any).vehicleNumber ||
        (transaction as any).vehicle_number
      if (!vehicleId) return
      ensureSet(activeByMonth, key).add(String(vehicleId))
    })

    workOrders.forEach((workOrder) => {
      const date = parseDate(
        (workOrder as any).createdDate ||
          (workOrder as any).created_date ||
          (workOrder as any).created_at ||
          (workOrder as any).dueDate
      )
      if (!date) return
      const key = monthKey(date)
      if (!monthKeys.has(key)) return
      const vehicleId =
        (workOrder as any).vehicleId ||
        (workOrder as any).vehicle_id ||
        (workOrder as any).vehicleNumber ||
        (workOrder as any).vehicle_number
      if (!vehicleId) return
      ensureSet(serviceByMonth, key).add(String(vehicleId))
    })

    return months.map((month) => {
      const key = monthKey(month)
      const activeCount = activeByMonth.get(key)?.size ?? 0
      const serviceCount = serviceByMonth.get(key)?.size ?? 0
      const idleCount = Math.max(totalVehicles - activeCount - serviceCount, 0)
      const utilization = totalVehicles > 0 ? Math.round((activeCount / totalVehicles) * 100) : 0

      return {
        name: formatMonth(month),
        active: activeCount,
        idle: idleCount,
        service: serviceCount,
        utilization
      }
    })
  }, [vehicles, fuelTransactions, workOrders])

  const costAnalysis = useMemo(() => {
    if (fuelTransactions.length === 0 && workOrders.length === 0) return []

    const months = getMonths(6)
    const monthKeys = new Set(months.map(monthKey))
    const totals = new Map<string, { fuel: number; maintenance: number; insurance: number }>()

    const ensure = (key: string) => {
      if (!totals.has(key)) {
        totals.set(key, { fuel: 0, maintenance: 0, insurance: 0 })
      }
      return totals.get(key)!
    }

    fuelTransactions.forEach((transaction) => {
      const date = parseDate((transaction as any).date || (transaction as any).transaction_date || (transaction as any).created_at)
      if (!date) return
      const key = monthKey(date)
      if (!monthKeys.has(key)) return
      const bucket = ensure(key)
      bucket.fuel += toNumber((transaction as any).totalCost ?? (transaction as any).total_cost ?? (transaction as any).cost)
    })

    workOrders.forEach((workOrder) => {
      const date = parseDate(
        (workOrder as any).createdDate ||
          (workOrder as any).created_date ||
          (workOrder as any).created_at ||
          (workOrder as any).dueDate
      )
      if (!date) return
      const key = monthKey(date)
      if (!monthKeys.has(key)) return
      const bucket = ensure(key)
      bucket.maintenance += toNumber((workOrder as any).cost ?? (workOrder as any).estimatedCost)
    })

    return months.map((month) => {
      const key = monthKey(month)
      const bucket = totals.get(key) || { fuel: 0, maintenance: 0, insurance: 0 }
      return {
        name: formatMonth(month),
        fuel: Math.round(bucket.fuel),
        maintenance: Math.round(bucket.maintenance),
        insurance: Math.round(bucket.insurance)
      }
    })
  }, [fuelTransactions, workOrders])

  const utilizationByType = useMemo(() => {
    const activeWindow = new Date()
    activeWindow.setDate(activeWindow.getDate() - 30)

    const activeVehicleIds = new Set<string>()
    fuelTransactions.forEach((transaction) => {
      const date = parseDate((transaction as any).date || (transaction as any).transaction_date || (transaction as any).created_at)
      if (!date || date < activeWindow) return
      const vehicleId =
        (transaction as any).vehicleId ||
        (transaction as any).vehicle_id ||
        (transaction as any).vehicleNumber ||
        (transaction as any).vehicle_number
      if (!vehicleId) return
      activeVehicleIds.add(String(vehicleId))
    })

    const fallbackActiveStatuses = new Set(["active", "emergency", "charging"])

    const grouped = new Map<string, { total: number; active: number }>()
    vehicles.forEach((vehicle) => {
      const type = String(vehicle.type || vehicle.asset_type || "Unknown")
      if (!grouped.has(type)) grouped.set(type, { total: 0, active: 0 })
      const entry = grouped.get(type)!
      entry.total += 1

      const vehicleId = String((vehicle as any).id || (vehicle as any).vehicle_id || vehicle.number)
      const isActive = activeVehicleIds.size > 0
        ? activeVehicleIds.has(vehicleId)
        : fallbackActiveStatuses.has(String(vehicle.status))

      if (isActive) entry.active += 1
    })

    return Array.from(grouped.entries()).map(([name, entry]) => {
      const utilization = entry.total > 0 ? Math.round((entry.active / entry.total) * 100) : 0
      return {
        name,
        utilization,
        count: entry.total
      }
    })
  }, [vehicles, fuelTransactions])

  return { monthlyFleetData, costAnalysis, utilizationByType }
}
