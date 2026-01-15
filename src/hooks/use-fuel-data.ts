import { useMemo } from "react"

import { Vehicle } from "@/lib/types"

export interface FuelRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  date: string
  gallons: number
  cost: number
  odometer: number
  mpg: number
  location?: string
}

export function useFuelData(vehicles: Vehicle[]) {
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
        const costPerGallon = 3.2 + Math.random() * 0.8
        const milesDriven = Math.floor(Math.random() * 300) + 50
        currentOdometer -= milesDriven

        records.push({
          id: `fuel-${idx}-${i}`,
          vehicleNumber: vehicle.number,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          date: date.toISOString().split("T")[0],
          gallons: gallons,
          cost: parseFloat((gallons * costPerGallon).toFixed(2)),
          odometer: currentOdometer,
          mpg: parseFloat((milesDriven / gallons).toFixed(1)),
          location: locations[Math.floor(Math.random() * locations.length)]
        })
      }
    })

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [vehicles])

  return { fuelRecords }
}
