import { Calendar as CalendarIcon, Wrench, Clock, AlertTriangle } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { DataGrid } from "@/components/common/DataGrid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useDrilldown } from "@/contexts/DrilldownContext"
import {
  useMaintenanceSchedules,
  useMaintenanceMutations,
  useVehicles
} from "@/hooks/use-api"
import type { MaintenanceSchedule as ApiMaintenanceSchedule, Vehicle } from "@/lib/types"

type MaintenanceStatus = "scheduled" | "due" | "overdue" | "completed"

interface ScheduleView {
  id: string
  vehicleId: string
  vehicleNumber: string
  serviceType: string
  nextDue: string
  priority: "low" | "medium" | "high" | "urgent"
  estimatedCost: number
  status: MaintenanceStatus
  notes?: string
}

interface ScheduleForm {
  vehicleId: string
  name: string
  description: string
  serviceType: string
  intervalDays: number
  nextServiceDate: string
  estimatedCost: number
}

const STATUS_BADGES: Record<MaintenanceStatus, { label: string; badge: string }> = {
  scheduled: { label: "Scheduled", badge: "bg-blue-100 text-blue-700" },
  due: { label: "Due", badge: "bg-yellow-100 text-yellow-700" },
  overdue: { label: "Overdue", badge: "bg-red-100 text-red-700" },
  completed: { label: "Completed", badge: "bg-green-100 text-green-700" }
}

const PRIORITY_BADGES: Record<ScheduleView["priority"], string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
}

const SERVICE_TYPE_OPTIONS = [
  { value: "preventive", label: "Preventive" },
  { value: "corrective", label: "Corrective" },
  { value: "inspection", label: "Inspection" }
]

function determineStatus(schedule: ApiMaintenanceSchedule): MaintenanceStatus {
  if (schedule.is_active === false) return "completed"
  const nextDue = schedule.next_service_date ?? schedule.nextDue ?? schedule.nextDueDate
  if (!nextDue) return "scheduled"
  const dueMs = new Date(nextDue).getTime()
  const now = Date.now()
  if (dueMs < now) return "overdue"
  if (dueMs <= now + 30 * 24 * 60 * 60 * 1000) return "due"
  return "scheduled"
}

export function MaintenanceScheduling() {
  const { push } = useDrilldown()
  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    error: schedulesError,
    refetch: refetchSchedules
  } = useMaintenanceSchedules()

  const { data: vehicles = [] } = useVehicles()
  const { createMaintenanceSchedule } = useMaintenanceMutations()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleView | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [formState, setFormState] = useState<ScheduleForm>({
    vehicleId: "",
    name: "",
    description: "",
    serviceType: "preventive",
    intervalDays: 30,
    nextServiceDate: new Date().toISOString().split("T")[0],
    estimatedCost: 0
  })

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    vehicles.forEach((vehicle) => map.set(vehicle.id, vehicle))
    return map
  }, [vehicles])

  const scheduleViews = useMemo<ScheduleView[]>(() => {
    return schedules.map((schedule) => {
      const vehicle = vehicleMap.get(schedule.vehicle_id)
      return {
        id: schedule.id,
        vehicleId: schedule.vehicle_id,
        vehicleNumber: vehicle?.number || vehicle?.name || "Unknown",
        serviceType: schedule.type || schedule.name || "Preventive",
        nextDue: schedule.next_service_date || "",
        priority: (schedule.priority as ScheduleView["priority"]) || "medium",
        estimatedCost: schedule.estimated_cost ?? schedule.estimatedCost ?? 0,
        status: determineStatus(schedule),
        notes: schedule.notes ?? schedule.description ?? ""
      }
    })
  }, [schedules, vehicleMap])

  const upcomingSchedules = useMemo(() => {
    return scheduleViews
      .filter((schedule) => {
        const due = schedule.nextDue ? new Date(schedule.nextDue).getTime() : 0
        return due >= Date.now()
      })
      .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
      .slice(0, 10)
  }, [scheduleViews])

  const overdueSchedules = useMemo(
    () => scheduleViews.filter((schedule) => schedule.status === "overdue"),
    [scheduleViews]
  )

  const schedulesForDate = useMemo(() => {
    if (!selectedDate) return []
    return scheduleViews.filter((schedule) => {
      const due = schedule.nextDue ? new Date(schedule.nextDue) : null
      if (!due) return false
      return due.toDateString() === selectedDate.toDateString()
    })
  }, [scheduleViews, selectedDate])

  const handleVehicleClick = (e: React.MouseEvent | null, vehicleNumber: string, vehicleId?: string) => {
    e?.stopPropagation()
    push({
      type: "vehicle",
      label: vehicleNumber,
      data: { vehicleId: vehicleId || vehicleNumber, vehicleNumber }
    })
  }

  const handleScheduleClick = (schedule: ScheduleView) => {
    setSelectedSchedule(schedule)
    setIsDetailsDialogOpen(true)
  }

  const handleScheduleMaintenance = () => {
    setIsScheduleDialogOpen(true)
  }

  const handleFormChange = (key: keyof ScheduleForm, value: string | number) => {
    setFormState((prev) => ({
      ...prev,
      [key]: typeof value === "number" ? Number(value) : value
    }))
  }

  const handleSaveSchedule = async () => {
    if (!formState.vehicleId || !formState.serviceType || !formState.nextServiceDate) {
      toast.error("Complete the required fields before saving.")
      return
    }

    try {
      await createMaintenanceSchedule.mutateAsync({
        vehicle_id: formState.vehicleId,
        name: formState.name || "Routine Service",
        description: formState.description,
        type: formState.serviceType,
        interval_days: formState.intervalDays,
        next_service_date: formState.nextServiceDate,
        estimated_cost: formState.estimatedCost,
        is_active: true
      })
      toast.success("Maintenance scheduled successfully.")
      setIsScheduleDialogOpen(false)
      setFormState({
        vehicleId: "",
        name: "",
        description: "",
        serviceType: "preventive",
        intervalDays: 30,
        nextServiceDate: new Date().toISOString().split("T")[0],
        estimatedCost: 0
      })
      refetchSchedules()
    } catch {
      toast.error("Failed to create schedule.")
    }
  }

  const totalScheduled = scheduleViews.length

  const maintenanceColumns: ColumnDef<ScheduleView>[] = useMemo(
    () => [
      {
        accessorKey: "vehicleNumber",
        header: "Vehicle",
        cell: ({ row }) => (
          <div
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={(e) => handleVehicleClick(e, row.original.vehicleNumber, row.original.vehicleId)}
          >
            {row.original.vehicleNumber}
          </div>
        )
      },
      {
        accessorKey: "serviceType",
        header: "Service Type",
        cell: ({ row }) => <div className="text-sm">{row.original.serviceType}</div>
      },
      {
        accessorKey: "nextDue",
        header: "Next Due",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.nextDue ? format(new Date(row.original.nextDue), "MMM d, yyyy") : "TBD"}
          </div>
        )
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge className={PRIORITY_BADGES[row.original.priority]} variant="secondary">
            {row.original.priority}
          </Badge>
        )
      },
      {
        accessorKey: "estimatedCost",
        header: "Est. Cost",
        cell: ({ row }) => (
          <div className="text-sm">${row.original.estimatedCost.toLocaleString()}</div>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={STATUS_BADGES[row.original.status].badge} variant="secondary">
            {STATUS_BADGES[row.original.status].label}
          </Badge>
        )
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleScheduleClick(row.original)}
          >
            View Details
          </Button>
        )
      }
    ],
    []
  )

  if (schedulesLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Loading schedules...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 bg-slate-900/50 rounded-md" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (schedulesError) {
    return (
      <div className="flex items-center justify-center w-full p-4 bg-slate-900/50 rounded-lg">
        <p className="text-sm text-red-300">Unable to load maintenance schedules.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Maintenance Calendar</h2>
          <p className="text-muted-foreground text-xs">CTA fleet maintenance lifecycle</p>
        </div>
        <Button onClick={handleScheduleMaintenance}>
          <CalendarIcon className="w-4 h-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{totalScheduled}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              CTA fleet services
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">{upcomingSchedules.length}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Next 30 days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{overdueSchedules.length}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Action required
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled on Selected Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{schedulesForDate.length}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>{selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid columns={maintenanceColumns} data={scheduleViews} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar selected={selectedDate} onSelect={(date) => setSelectedDate(date ?? undefined)} />
            <div className="text-xs text-muted-foreground mt-2">Click a date to filter schedules.</div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Vehicle
            <select
              value={formState.vehicleId}
              onChange={(event) => handleFormChange("vehicleId", event.target.value)}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.number || vehicle.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Name
            <input
              value={formState.name}
              onChange={(event) => handleFormChange("name", event.target.value)}
              placeholder="Routine Oil Change"
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Service Type
            <select
              value={formState.serviceType}
              onChange={(event) => handleFormChange("serviceType", event.target.value)}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Interval (days)
            <input
              type="number"
              value={formState.intervalDays}
              onChange={(event) => handleFormChange("intervalDays", Number(event.target.value))}
              min={7}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Next Service Date
            <input
              type="date"
              value={formState.nextServiceDate}
              onChange={(event) => handleFormChange("nextServiceDate", event.target.value)}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Estimated Cost
            <input
              type="number"
              value={formState.estimatedCost}
              onChange={(event) => handleFormChange("estimatedCost", Number(event.target.value))}
              min={0}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Description
            <textarea
              rows={3}
              value={formState.description}
              onChange={(event) => handleFormChange("description", event.target.value)}
              className="mt-1 block w-full rounded border bg-slate-900/70 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} size="sm">
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} disabled={createMaintenanceSchedule.isLoading} size="sm">
                {createMaintenanceSchedule.isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogHeader>
          <DialogTitle>Schedule Details</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          {selectedSchedule && (
            <>
              <p className="text-sm text-muted-foreground">
                <strong>Vehicle:</strong> {selectedSchedule.vehicleNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Service Type:</strong> {selectedSchedule.serviceType}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Next Due:</strong>{" "}
                {selectedSchedule.nextDue ? format(new Date(selectedSchedule.nextDue), "MMM d, yyyy") : "TBD"}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Estimated Cost:</strong> ${selectedSchedule.estimatedCost.toLocaleString()}
              </p>
              {selectedSchedule.notes && (
                <p className="text-sm text-muted-foreground">
                  <strong>Notes:</strong> {selectedSchedule.notes}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
