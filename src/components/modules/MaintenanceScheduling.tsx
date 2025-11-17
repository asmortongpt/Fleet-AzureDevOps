import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDots, Wrench, Clock, CheckCircle, Warning } from "@phosphor-icons/react"
import { MaintenanceSchedule } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"

export function MaintenanceScheduling() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    vehicleNumber: "",
    serviceType: "",
    priority: "medium" as MaintenanceSchedule["priority"],
    scheduledDate: new Date(),
    estimatedCost: 0,
    notes: ""
  })

  const handleScheduleMaintenance = () => {
    setIsScheduleDialogOpen(true)
  }

  const handleSaveSchedule = () => {
    if (!newSchedule.vehicleNumber || !newSchedule.serviceType) {
      toast.error('Please fill in vehicle number and service type')
      return
    }

    const newMaintenanceSchedule: MaintenanceSchedule = {
      id: `maint-${Date.now()}`,
      vehicleNumber: newSchedule.vehicleNumber,
      serviceType: newSchedule.serviceType,
      priority: newSchedule.priority,
      status: "scheduled",
      nextDue: newSchedule.scheduledDate.toISOString(),
      estimatedCost: newSchedule.estimatedCost,
      frequency: "As Needed",
      notes: newSchedule.notes
    }

    setSchedules([...(schedules || []), newMaintenanceSchedule])
    toast.success(`Maintenance scheduled for ${newSchedule.vehicleNumber}`)
    setIsScheduleDialogOpen(false)
    setNewSchedule({
      vehicleNumber: "",
      serviceType: "",
      priority: "medium",
      scheduledDate: new Date(),
      estimatedCost: 0,
      notes: ""
    })
  }

  const schedulesForDate = (schedules || []).filter(schedule => {
    if (!selectedDate) return false
    const scheduleDate = new Date(schedule.nextDue)
    return scheduleDate.toDateString() === selectedDate.toDateString()
  })

  const upcomingSchedules = (schedules || [])
    .filter(s => new Date(s.nextDue) >= new Date())
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
    .slice(0, 10)

  const overdueSchedules = (schedules || []).filter(s => {
    const dueDate = new Date(s.nextDue)
    return dueDate < new Date() && s.status !== "completed"
  })

  const getStatusColor = (status: MaintenanceSchedule["status"]) => {
    const colors: Record<MaintenanceSchedule["status"], string> = {
      scheduled: "bg-blue-100 text-blue-700",
      due: "bg-yellow-100 text-yellow-700",
      overdue: "bg-red-100 text-red-700",
      completed: "bg-green-100 text-green-700"
    }
    return colors[status]
  }

  const getPriorityColor = (priority: MaintenanceSchedule["priority"]) => {
    const colors: Record<MaintenanceSchedule["priority"], string> = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700"
    }
    return colors[priority]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Maintenance Calendar</h2>
          <p className="text-muted-foreground">Schedule and track maintenance appointments</p>
        </div>
        <Button onClick={handleScheduleMaintenance}>
          <CalendarDots className="w-4 h-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(schedules || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDots className="w-3 h-3" />
              All services
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingSchedules.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              Next 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueSchedules.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(schedules || []).filter(s => s.status === "completed").length}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view scheduled services</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Services for ${format(selectedDate, "MMMM d, yyyy")}`
                : "Select a date"}
            </CardTitle>
            <CardDescription>
              {schedulesForDate.length} scheduled service{schedulesForDate.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesForDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services scheduled for this date
              </div>
            ) : (
              <div className="space-y-3">
                {schedulesForDate.map(schedule => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{schedule.serviceType}</div>
                          <div className="text-sm text-muted-foreground">
                            Vehicle {schedule.vehicleNumber}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(schedule.priority)} variant="secondary">
                          {schedule.priority}
                        </Badge>
                        <Badge className={getStatusColor(schedule.status)} variant="secondary">
                          {schedule.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated Cost: ${schedule.estimatedCost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Maintenance</CardTitle>
          <CardDescription>Next scheduled services across all vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No upcoming maintenance scheduled
                  </TableCell>
                </TableRow>
              ) : (
                upcomingSchedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.vehicleNumber}</TableCell>
                    <TableCell>{schedule.serviceType}</TableCell>
                    <TableCell>{format(new Date(schedule.nextDue), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(schedule.priority)} variant="secondary">
                        {schedule.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>${schedule.estimatedCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(schedule.status)} variant="secondary">
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Schedule Details</DialogTitle>
            <DialogDescription>
              Complete information for this maintenance service
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Service Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Service Type:</span>
                      <p className="font-medium">{selectedSchedule.serviceType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vehicle:</span>
                      <p className="font-medium">{selectedSchedule.vehicleNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <div className="mt-1">
                        <Badge className={getPriorityColor(selectedSchedule.priority)} variant="secondary">
                          {selectedSchedule.priority}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedSchedule.status)} variant="secondary">
                          {selectedSchedule.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Scheduling</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <p className="font-medium">{format(new Date(selectedSchedule.nextDue), "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Service:</span>
                      <p className="font-medium">
                        {selectedSchedule.lastCompleted
                          ? format(new Date(selectedSchedule.lastCompleted), "MMMM d, yyyy")
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <p className="font-medium">{selectedSchedule.frequency}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Cost & Provider</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <p className="font-medium text-lg">${selectedSchedule.estimatedCost.toLocaleString()}</p>
                  </div>
                  {selectedSchedule.assignedTechnician && (
                    <div>
                      <span className="text-muted-foreground">Assigned Technician:</span>
                      <p className="font-medium">{selectedSchedule.assignedTechnician}</p>
                    </div>
                  )}
                  {selectedSchedule.serviceProvider && (
                    <div>
                      <span className="text-muted-foreground">Service Provider:</span>
                      <p className="font-medium">{selectedSchedule.serviceProvider}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSchedule.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}

              {selectedSchedule.parts && selectedSchedule.parts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Required Parts</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSchedule.parts.map((part, index) => (
                      <Badge key={index} variant="outline">{part}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedSchedule && selectedSchedule.status !== "completed" && (
              <Button>Schedule Service</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Schedule a new maintenance service for a vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Number *</Label>
              <Input
                id="vehicle"
                placeholder="e.g., UNIT-001"
                value={newSchedule.vehicleNumber}
                onChange={(e) => setNewSchedule({ ...newSchedule, vehicleNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type *</Label>
              <Input
                id="service-type"
                placeholder="e.g., Oil Change, Tire Rotation"
                value={newSchedule.serviceType}
                onChange={(e) => setNewSchedule({ ...newSchedule, serviceType: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newSchedule.priority}
                  onValueChange={(value: MaintenanceSchedule["priority"]) =>
                    setNewSchedule({ ...newSchedule, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Estimated Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  value={newSchedule.estimatedCost}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, estimatedCost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDots className="w-4 h-4 mr-2" />
                    {format(newSchedule.scheduledDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newSchedule.scheduledDate}
                    onSelect={(date) =>
                      date && setNewSchedule({ ...newSchedule, scheduledDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or instructions..."
                value={newSchedule.notes}
                onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule}>
              Schedule Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
