/**
 * Maintenance Appointment Modal Component
 * Form for scheduling maintenance appointments with service bay and technician assignment
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { AlertCircle, Calendar, CheckCircle, Clock, Wrench } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Vehicle, Technician } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MaintenanceAppointment, CreateMaintenanceRequest, AppointmentType, ServiceBay } from '@/types/scheduling'
import logger from '@/utils/logger'

const appointmentSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  appointmentTypeId: z.string().min(1, 'Appointment type is required'),
  date: z.date({
    required_error: 'Date is required',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  serviceBayId: z.string().optional(),
  assignedTechnicianId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate that end time doesn't exceed business hours
  const [hour, min] = data.startTime.split(':').map(Number)
  const endMinutes = (hour ?? 0) * 60 + (min ?? 0) + data.duration
  return endMinutes <= 19 * 60 // 7 PM
}, {
  message: 'Appointment extends beyond business hours (7 PM)',
  path: ['duration'],
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface MaintenanceAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateMaintenanceRequest) => Promise<void>
  appointment?: MaintenanceAppointment
  vehicles?: Vehicle[]
  appointmentTypes?: AppointmentType[]
  serviceBays?: ServiceBay[]
  technicians?: Technician[]
  isLoading?: boolean
  onCheckAvailability?: (data: {
    serviceBayId?: string
    technicianId?: string
    startTime: Date
    endTime: Date
  }) => Promise<{ available: boolean; conflicts?: any[] }>
}

// Generate time slots (every 30 minutes from 7 AM to 7 PM)
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 7; hour < 19; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
] as const

export function MaintenanceAppointmentModal({
  open,
  onOpenChange,
  onSubmit,
  appointment,
  vehicles = [],
  appointmentTypes = [],
  serviceBays = [],
  technicians = [],
  onCheckAvailability,
}: MaintenanceAppointmentModalProps) {
  const [checking, setChecking] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [_availableBays, _setAvailableBays] = useState<ServiceBay[]>(serviceBays)
  const [_availableTechs, _setAvailableTechs] = useState<Technician[]>(technicians)

  const isEditing = !!appointment

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      vehicleId: appointment?.vehicle_id || '',
      appointmentTypeId: appointment?.appointment_type_id || '',
      date: appointment ? new Date(appointment.scheduled_start) : new Date(),
      startTime: appointment ? format(new Date(appointment.scheduled_start), 'HH:mm') : '08:00',
      duration: appointment
        ? Math.round((new Date(appointment.scheduled_end).getTime() - new Date(appointment.scheduled_start).getTime()) / 60000)
        : 60,
      serviceBayId: appointment?.service_bay_id || '',
      assignedTechnicianId: appointment?.assigned_technician_id || '',
      priority: appointment?.priority || 'medium',
      notes: appointment?.notes || '',
    },
  })

  const watchAppointmentType = form.watch('appointmentTypeId')
  const watchDate = form.watch('date')
  const watchStartTime = form.watch('startTime')
  const watchDuration = form.watch('duration')
  const watchServiceBay = form.watch('serviceBayId')
  const watchTechnician = form.watch('assignedTechnicianId')

  // Auto-fill duration based on appointment type
  useEffect(() => {
    const selectedType = appointmentTypes.find((t) => t.id === watchAppointmentType)
    if (selectedType && !isEditing) {
      form.setValue('duration', selectedType.estimated_duration ?? 60)
    }
  }, [watchAppointmentType, appointmentTypes, form, isEditing])

  // Check availability when bay/tech/time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!watchDate || !watchStartTime || !onCheckAvailability) {
        setConflicts([])
        return
      }

      if (!watchServiceBay && !watchTechnician) {
        setConflicts([])
        return
      }

      try {
        setChecking(true)
        const [hour, min] = watchStartTime.split(':').map(Number)

        const startDateTime = new Date(watchDate)
        startDateTime.setHours(hour ?? 0, min ?? 0, 0, 0)

        const endDateTime = new Date(startDateTime)
        endDateTime.setMinutes(endDateTime.getMinutes() + (watchDuration ?? 0))

        const result = await onCheckAvailability({
          serviceBayId: watchServiceBay || undefined,
          technicianId: watchTechnician || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
        })

        if (!result.available && result.conflicts) {
          setConflicts(result.conflicts)
        } else {
          setConflicts([])
        }
      } catch (error) {
        logger.error('Failed to check availability:', error)
      } finally {
        setChecking(false)
      }
    }

    const timeoutId = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [watchServiceBay, watchTechnician, watchDate, watchStartTime, watchDuration, onCheckAvailability])

  const handleSubmit = async (values: AppointmentFormValues) => {
    try {
      setSubmitting(true)

      const [hour, min] = values.startTime.split(':').map(Number)

      const startDateTime = new Date(values.date)
      startDateTime.setHours(hour ?? 0, min ?? 0, 0, 0)

      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + (values.duration ?? 0))

      const requestData: CreateMaintenanceRequest = {
        vehicleId: values.vehicleId,
        appointmentTypeId: values.appointmentTypeId,
        scheduledStart: startDateTime.toISOString(),
        scheduledEnd: endDateTime.toISOString(),
        assignedTechnicianId: values.assignedTechnicianId,
        serviceBayId: values.serviceBayId,
        priority: values.priority,
        notes: values.notes,
      }

      await onSubmit(requestData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error('Failed to submit appointment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.watch('vehicleId'))
  const selectedAppointmentType = appointmentTypes.find((t) => t.id === watchAppointmentType)
  const selectedTechnician = technicians.find((t) => t.id === watchTechnician)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {isEditing ? 'Edit Maintenance Appointment' : 'New Maintenance Appointment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the appointment details below' : 'Schedule maintenance service'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Vehicle Selection */}
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.licensePlate}) - {vehicle.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedVehicle && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <div>VIN: {selectedVehicle.vin}</div>
                      <div>Mileage: {selectedVehicle.mileage.toLocaleString()} miles</div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Appointment Type */}
            <FormField
              control={form.control}
              name="appointmentTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                            {type.name}
                            <span className="text-xs text-muted-foreground">
                              (~{type.estimated_duration} min)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedAppointmentType?.description && (
                    <FormDescription>{selectedAppointmentType.description}</FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <label
                            htmlFor={option.value}
                            className={cn('text-sm font-medium cursor-pointer', option.color)}
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Selection */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col col-span-2">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const day = date.getDay()
                            return date < new Date(new Date().setHours(0, 0, 0, 0))
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col col-span-1">
                    <FormLabel>Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem className="flex flex-col col-span-1">
                    <FormLabel>Duration (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="15"
                        min="15"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Bay and Technician */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceBayId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Bay</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bay" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceBays.map((bay) => (
                          <SelectItem key={bay.id} value={bay.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {bay.bay_name} #{bay.bay_number}
                              </span>
                              <Badge variant={bay.is_active ? 'default' : 'destructive'}>
                                {bay.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {bay => bay.bay_type ? `Type: ${bay.bay_type}` : ''}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTechnicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technician</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.firstName} {tech.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedTechnician && (
                      <FormDescription>
                        {selectedTechnician.specialty || 'General Technician'}
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Availability Check */}
            {checking && (
              <Alert variant="default" className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription>Checking availability...</AlertDescription>
              </Alert>
            )}
            {!checking && conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Scheduling conflict detected. This {watchServiceBay ? 'bay' : 'technician'} is already booked for the selected time.
                </AlertDescription>
              </Alert>
            )}
            {!checking && conflicts.length === 0 && (watchServiceBay || watchTechnician) && (
              <Alert variant="default" className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  {watchServiceBay && watchTechnician
                    ? 'Bay and technician are available for the selected time.'
                    : watchServiceBay
                    ? 'Bay is available for the selected time.'
                    : 'Technician is available for the selected time.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details or special instructions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || checking || conflicts.length > 0}
              >
                {submitting ? 'Scheduling...' : isEditing ? 'Update Appointment' : 'Schedule Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}