import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { RecurrencePattern, WorkOrderTemplate } from "@/lib/types"
import { X } from "@phosphor-icons/react"

interface RecurringScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RecurringScheduleFormData) => void
  vehicles: { id: string; vehicle_number: string }[]
}

export interface RecurringScheduleFormData {
  vehicle_id: string
  service_type: string
  priority: "low" | "medium" | "high" | "urgent"
  estimated_cost?: number
  recurrence_pattern: RecurrencePattern
  auto_create_work_order: boolean
  work_order_template: WorkOrderTemplate
  notes?: string
  parts?: string[]
}

export function RecurringScheduleDialog({
  open,
  onOpenChange,
  onSubmit,
  vehicles
}: RecurringScheduleDialogProps) {
  const [formData, setFormData] = useState<RecurringScheduleFormData>({
    vehicle_id: "",
    service_type: "",
    priority: "medium",
    estimated_cost: 0,
    recurrence_pattern: {
      type: "time",
      interval_value: 90,
      interval_unit: "days",
      lead_time_days: 7,
      warning_threshold_days: 14
    },
    auto_create_work_order: true,
    work_order_template: {
      priority: "medium",
      estimated_duration_hours: 2
    },
    notes: "",
    parts: []
  })

  const [partInput, setPartInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  const addPart = () => {
    if (partInput.trim()) {
      setFormData({
        ...formData,
        parts: [...(formData.parts || []), partInput.trim()]
      })
      setPartInput("")
    }
  }

  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts?.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recurring Maintenance Schedule</DialogTitle>
          <DialogDescription>
            Set up an automated recurring maintenance schedule with work order generation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vehicles || []).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Input
                  id="service_type"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  placeholder="e.g., Oil Change, Tire Rotation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
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
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Recurrence Pattern */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Recurrence Pattern</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurrence_type">Type</Label>
                <Select
                  value={formData.recurrence_pattern.type}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      recurrence_pattern: {
                        ...formData.recurrence_pattern,
                        type: value,
                        interval_unit: value === "mileage" ? "miles" : value === "engine_hours" ? "engine_hours" : "days"
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="mileage">Mileage-based</SelectItem>
                    <SelectItem value="engine_hours">Engine Hours</SelectItem>
                    <SelectItem value="combined">Combined (Time + Mileage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval_value">Interval</Label>
                <Input
                  id="interval_value"
                  type="number"
                  value={formData.recurrence_pattern.interval_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence_pattern: {
                        ...formData.recurrence_pattern,
                        interval_value: parseInt(e.target.value)
                      }
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval_unit">Unit</Label>
                <Select
                  value={formData.recurrence_pattern.interval_unit}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      recurrence_pattern: { ...formData.recurrence_pattern, interval_unit: value }
                    })
                  }
                  disabled={formData.recurrence_pattern.type === "mileage" || formData.recurrence_pattern.type === "engine_hours"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.recurrence_pattern.type === "mileage" && (
                      <SelectItem value="miles">Miles</SelectItem>
                    )}
                    {formData.recurrence_pattern.type === "engine_hours" && (
                      <SelectItem value="engine_hours">Engine Hours</SelectItem>
                    )}
                    {(formData.recurrence_pattern.type === "time" || formData.recurrence_pattern.type === "combined") && (
                      <>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_time">Lead Time (days before due)</Label>
                <Input
                  id="lead_time"
                  type="number"
                  value={formData.recurrence_pattern.lead_time_days || 7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence_pattern: {
                        ...formData.recurrence_pattern,
                        lead_time_days: parseInt(e.target.value)
                      }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning_threshold">Warning Threshold (days)</Label>
                <Input
                  id="warning_threshold"
                  type="number"
                  value={formData.recurrence_pattern.warning_threshold_days || 14}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence_pattern: {
                        ...formData.recurrence_pattern,
                        warning_threshold_days: parseInt(e.target.value)
                      }
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Auto Work Order Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Automatic Work Order Generation</h3>
                <p className="text-xs text-muted-foreground">
                  Automatically create work orders when maintenance is due
                </p>
              </div>
              <Switch
                checked={formData.auto_create_work_order}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_create_work_order: checked })
                }
              />
            </div>

            {formData.auto_create_work_order && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="wo_priority">Work Order Priority</Label>
                  <Select
                    value={formData.work_order_template.priority}
                    onValueChange={(value: any) =>
                      setFormData({
                        ...formData,
                        work_order_template: { ...formData.work_order_template, priority: value }
                      })
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="assigned_technician">Assigned Technician</Label>
                  <Input
                    id="assigned_technician"
                    value={formData.work_order_template.assigned_technician || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_order_template: {
                          ...formData.work_order_template,
                          assigned_technician: e.target.value
                        }
                      })
                    }
                    placeholder="Email or username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wo_cost">Default Cost</Label>
                  <Input
                    id="wo_cost"
                    type="number"
                    value={formData.work_order_template.estimated_cost || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_order_template: {
                          ...formData.work_order_template,
                          estimated_cost: parseFloat(e.target.value)
                        }
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Est. Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.work_order_template.estimated_duration_hours || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_order_template: {
                          ...formData.work_order_template,
                          estimated_duration_hours: parseFloat(e.target.value)
                        }
                      })
                    }
                    placeholder="2.0"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="wo_description">Work Order Description</Label>
                  <Textarea
                    id="wo_description"
                    value={formData.work_order_template.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_order_template: {
                          ...formData.work_order_template,
                          description: e.target.value
                        }
                      })
                    }
                    placeholder="Default description for generated work orders..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Parts & Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Required Parts</Label>
              <div className="flex gap-2">
                <Input
                  value={partInput}
                  onChange={(e) => setPartInput(e.target.value)}
                  placeholder="Add part name..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPart())}
                />
                <Button type="button" onClick={addPart} variant="secondary">
                  Add
                </Button>
              </div>
              {formData.parts && formData.parts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.parts.map((part, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {part}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removePart(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or instructions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Recurring Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
