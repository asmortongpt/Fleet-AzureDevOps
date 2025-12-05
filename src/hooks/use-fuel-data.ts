import { useMemo } from "react"
import { Vehicle } from "@/lib/types"
import {
  generateRecordId,
  formatVehicleName,
  generateDateRange,
  randomInt,
  randomFloat,
  randomItem,
  sortByDateDesc,
  COMMON_LOCATIONS
} from "@/utils/demo-data-generator"

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

    vehicles.slice(0, 20).forEach((vehicle, idx) => {
      const numRecords = randomInt(3, 10)
      let currentOdometer = vehicle.mileage
      const dates = generateDateRange(numRecords, 3)

      for (let i = 0; i < numRecords; i++) {
        const gallons = randomInt(5, 25)
        const costPerGallon = randomFloat(3.2, 4.0)
        const milesDriven = randomInt(50, 350)
        currentOdometer -= milesDriven

        records.push({
          id: generateRecordId('fuel', idx, i),
          vehicleNumber: vehicle.number,
          vehicleName: formatVehicleName(vehicle),
          date: dates[i],
          gallons: gallons,
          cost: randomFloat(gallons * costPerGallon, gallons * costPerGallon),
          odometer: currentOdometer,
          mpg: randomFloat(milesDriven / gallons, milesDriven / gallons, 1),
          location: randomItem(COMMON_LOCATIONS)
        })
      }
    })

    return sortByDateDesc(records)
  }, [vehicles])

  return { fuelRecords }
}
