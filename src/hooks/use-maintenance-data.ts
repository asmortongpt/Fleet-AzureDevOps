import { useMemo } from "react"

import { Vehicle } from "@/lib/types"
import {
  generateRecordId,
  formatVehicleName,
  generateRandomDate,
  randomInt,
  randomItem,
  calculateStatus,
  COMMON_SERVICE_TYPES
} from "@/utils/demo-data-generator"

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
    const records: MaintenanceRecord[] = []

    vehicles.slice(0, 25).forEach((vehicle, idx) => {
      const numRecords = randomInt(1, 4)
      for (let i = 0; i < numRecords; i++) {
        const daysOffset = randomInt(-30, 90)
        const date = generateRandomDate(-daysOffset)
        const status = calculateStatus(daysOffset, { upcomingThreshold: 0, overdueThreshold: 60 })
        const nextDueOffset = randomInt(30, 120)

        records.push({
          id: generateRecordId('maint', idx, i),
          vehicleNumber: vehicle.number,
          vehicleName: formatVehicleName(vehicle),
          serviceType: randomItem(COMMON_SERVICE_TYPES),
          date: date,
          cost: randomInt(50, 550),
          status: status,
          nextDue: status === "completed" ? generateRandomDate(-nextDueOffset) : null,
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
