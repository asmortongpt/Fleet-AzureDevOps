import { useMemo } from "react"

import { useFuelTransactions } from "@/hooks/use-api"
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
  const { data } = useFuelTransactions()

  const vehicleById = useMemo(() => {
    const map = new Map<string, Vehicle>()
    vehicles.forEach((vehicle) => {
      if (vehicle.id) map.set(String(vehicle.id), vehicle)
      if (vehicle.number) map.set(String(vehicle.number), vehicle)
    })
    return map
  }, [vehicles])

  const fuelRecords = useMemo((): FuelRecord[] => {
    const transactions = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : []

    return transactions
      .map((transaction: any) => {
        const vehicleId =
          transaction.vehicleId ||
          transaction.vehicle_id ||
          transaction.vehicleNumber ||
          transaction.vehicle_number
        const vehicle = vehicleId ? vehicleById.get(String(vehicleId)) : undefined

        const date =
          transaction.date ||
          transaction.transaction_date ||
          transaction.created_at ||
          transaction.createdAt

        const gallons = Number(transaction.gallons ?? transaction.quantity ?? 0)
        const cost = Number(transaction.totalCost ?? transaction.total_cost ?? transaction.cost ?? 0)

        return {
          id: String(transaction.id || `${vehicleId || "fuel"}-${date || "record"}`),
          vehicleNumber: transaction.vehicleNumber || transaction.vehicle_number || vehicle?.number || "",
          vehicleName:
            transaction.vehicleName ||
            transaction.vehicle_name ||
            (vehicle ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() : ""),
          date: date || "",
          gallons,
          cost,
          odometer: Number(transaction.odometer ?? transaction.odometer_reading ?? 0),
          mpg: Number(transaction.mpg ?? 0),
          location: transaction.location || transaction.station
        }
      })
      .filter((record) => record.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data, vehicleById])

  return { fuelRecords }
}
