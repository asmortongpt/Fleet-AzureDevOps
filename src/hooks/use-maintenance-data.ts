import { useMemo } from "react"

import { Vehicle } from "@/lib/types"

export interface MaintenanceRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  serviceType: string
  date: string
  cost: number
  status: "upcoming" | "overdue" | "completed"
  nextDue: string | null
  notes?: string
}

export function useMaintenanceData(vehicles: Vehicle[]) {
  const maintenanceRecords = useMemo((): MaintenanceRecord[] => {
    const serviceTypes = [
      "Oil Change",
      "Tire Rotation",
      "Brake Service",
      "Engine Tune-up",
      "Transmission Service",
      "Battery Replacement",
      "Air Filter",
      "Inspection"
    ]

    const records: MaintenanceRecord[] = []
    vehicles.slice(0, 25).forEach((vehicle, idx) => {
      const numRecords = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numRecords; i++) {
        const daysAgo = Math.floor(Math.random() * 90) - 30
        const date = new Date()
        date.setDate(date.getDate() + daysAgo)

        const status = daysAgo < 0 ? "upcoming" : daysAgo > 60 ? "overdue" : "completed"
        const nextDueDate = new Date()
        nextDueDate.setDate(nextDueDate.getDate() + Math.floor(Math.random() * 90) + 30)

        records.push({
          id: `maint-${idx}-${i}`,
          vehicleNumber: vehicle.number ?? "",
          vehicleName: `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`,
          serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
          date: date.toISOString().split("T")[0],
          cost: Math.floor(Math.random() * 500) + 50,
          status: status,
          nextDue: status === "completed" ? nextDueDate.toISOString().split("T")[0] : null,
          notes: i % 3 === 0 ? "Routine maintenance" : undefined
        })
      }
    })

    return records
  }, [vehicles])

  const maintenanceMetrics = useMemo(() => {
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const totalCost = maintenanceRecords
      .filter((r) => new Date(r.date) >= thisMonth && r.status === "completed")
      .reduce((sum, r) => sum + r.cost, 0)

    const overdue = maintenanceRecords.filter((r) => r.status === "overdue").length

    const upcoming = maintenanceRecords.filter((r) => {
      if (r.status !== "upcoming") return false
      const nextDue = new Date(r.date)
      const thirtyDaysOut = new Date()
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)
      return nextDue <= thirtyDaysOut
    }).length

    return { totalCost, overdue, upcoming }
  }, [maintenanceRecords])

  return { maintenanceRecords, maintenanceMetrics }
}