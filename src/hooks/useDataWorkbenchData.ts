import { useMemo } from "react"

import { MaintenanceRecord, FuelRecord } from "@/components/modules/DataWorkbench/types"
import { Vehicle } from "@/lib/types"

export function useDataWorkbenchData(vehicles: Vehicle[]) {
  // Generate realistic maintenance data
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

        const status = daysAgo < 0 ? "upcoming" : (daysAgo > 60 ? "overdue" : "completed")
        const nextDueDate = new Date()
        nextDueDate.setDate(nextDueDate.getDate() + Math.floor(Math.random() * 90) + 30)

        records.push({
          id: `maint-${idx}-${i}`,
          vehicleId: vehicle.id,
          date: date.toISOString().split('T')[0],
          type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
          cost: Math.floor(Math.random() * 500) + 50,
          description: i % 3 === 0 ? "Routine maintenance" : undefined
        })
      }
    })

    return records
  }, [vehicles])

  // Generate realistic fuel data
  const fuelRecords = useMemo((): FuelRecord[] => {
    const records: FuelRecord[] = []
    const locations = ["Main Depot", "North Station", "South Station", "Highway 95", "Downtown"]

    vehicles.slice(0, 20).forEach((vehicle, idx) => {
      const numRecords = Math.floor(Math.random() * 8) + 3
      let currentOdometer = vehicle.mileage

      for (let i = 0; i < numRecords; i++) {
        const daysAgo = (numRecords - i - 1) * 3
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        const gallons = Math.floor(Math.random() * 20) + 5
        const costPerGallon = 3.2 + (Math.random() * 0.8)
        const milesDriven = Math.floor(Math.random() * 300) + 50
        currentOdometer -= milesDriven

        records.push({
          id: `fuel-${idx}-${i}`,
          vehicleId: vehicle.id,
          date: date.toISOString().split('T')[0],
          gallons: gallons,
          cost: parseFloat((gallons * costPerGallon).toFixed(2)),
          location: locations[Math.floor(Math.random() * locations.length)]
        })
      }
    })

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [vehicles])

  // Fleet metrics
  const metrics = useMemo(() => ({
    total: vehicles.length,
    active: (vehicles || []).filter(v => v.status === "active").length,
    maintenance: (vehicles || []).filter(v => v.status === "service").length,
    avgFuel: vehicles.length > 0
      ? Math.round((vehicles || []).reduce((sum, v) => sum + (v.fuelLevel ?? 0), 0) / vehicles.length)
      : 0,
    alerts: vehicles.filter(v => ((v.alerts || [])).length > 0).length
  }), [vehicles])

  return {
    maintenanceRecords,
    fuelRecords,
    metrics
  }
}
