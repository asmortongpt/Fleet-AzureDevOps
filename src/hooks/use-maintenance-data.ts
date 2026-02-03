import { useMemo } from "react"

import { useMaintenanceSchedules, useWorkOrders } from "@/hooks/use-api"
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

const toDateString = (value?: string | Date | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split("T")[0]
}

export function useMaintenanceData(vehicles: Vehicle[]) {
  const { data: workOrders } = useWorkOrders()
  const { data: maintenanceSchedules } = useMaintenanceSchedules()

  const vehicleById = useMemo(() => {
    const map = new Map<string, Vehicle>()
    vehicles.forEach((vehicle) => {
      if (vehicle.id) map.set(String(vehicle.id), vehicle)
      if (vehicle.number) map.set(String(vehicle.number), vehicle)
    })
    return map
  }, [vehicles])

  const maintenanceRecords = useMemo((): MaintenanceRecord[] => {
    const records: MaintenanceRecord[] = []

    const workOrderRows = Array.isArray(workOrders)
      ? workOrders
      : Array.isArray((workOrders as any)?.data)
        ? (workOrders as any).data
        : []
    workOrderRows.forEach((order: any) => {
      const vehicleId = order.vehicleId || order.vehicle_id || order.vehicleNumber || order.vehicle_number
      const vehicle = vehicleId ? vehicleById.get(String(vehicleId)) : undefined

      const date =
        toDateString(order.completedDate || order.completed_date) ||
        toDateString(order.dueDate || order.due_date) ||
        toDateString(order.createdDate || order.created_date || order.created_at)

      if (!date) return

      const statusMap: Record<string, MaintenanceRecord["status"]> = {
        completed: "completed",
        cancelled: "completed",
        pending: "upcoming",
        open: "upcoming",
        review: "upcoming",
        waiting_parts: "upcoming",
        "in-progress": "upcoming"
      }

      records.push({
        id: String(order.id),
        vehicleNumber: order.vehicleNumber || order.vehicle_number || vehicle?.number || "",
        vehicleName:
          order.vehicleName ||
          order.vehicle_name ||
          (vehicle ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() : ""),
        serviceType: order.serviceType || order.service_type || order.title || "Service",
        date,
        cost: Number(order.cost ?? order.estimatedCost ?? order.estimated_cost ?? 0),
        status: statusMap[String(order.status || "").toLowerCase()] || "upcoming",
        nextDue: toDateString(order.dueDate || order.due_date),
        notes: order.description
      })
    })

    const scheduleRows = Array.isArray(maintenanceSchedules)
      ? maintenanceSchedules
      : Array.isArray((maintenanceSchedules as any)?.data)
        ? (maintenanceSchedules as any).data
        : []
    scheduleRows.forEach((schedule: any) => {
      const vehicleId = schedule.vehicleId || schedule.vehicle_id || schedule.vehicleNumber || schedule.vehicle_number
      const vehicle = vehicleId ? vehicleById.get(String(vehicleId)) : undefined
      const nextDue = toDateString(schedule.nextDue || schedule.next_due)
      const lastPerformed = toDateString(schedule.lastPerformed || schedule.last_performed)
      const statusMap: Record<string, MaintenanceRecord["status"]> = {
        scheduled: "upcoming",
        due: "upcoming",
        overdue: "overdue",
        completed: "completed"
      }

      records.push({
        id: String(schedule.id),
        vehicleNumber: schedule.vehicleNumber || schedule.vehicle_number || vehicle?.number || "",
        vehicleName:
          schedule.vehicleName ||
          schedule.vehicle_name ||
          (vehicle ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() : ""),
        serviceType: schedule.serviceType || schedule.service_type || "Scheduled Service",
        date: nextDue || lastPerformed || "",
        cost: Number(schedule.estimatedCost ?? schedule.estimated_cost ?? 0),
        status: statusMap[String(schedule.status || "").toLowerCase()] || "upcoming",
        nextDue: nextDue,
        notes: schedule.notes
      })
    })

    return records
      .filter((record) => record.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [workOrders, maintenanceSchedules, vehicleById])

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
