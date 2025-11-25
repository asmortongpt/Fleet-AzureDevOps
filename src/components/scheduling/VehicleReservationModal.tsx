/**
 * Vehicle Reservation Modal Component
 * Form for creating and editing vehicle reservations with availability checking
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
import AlertCircleIcon from 'lucide-react/dist/esm/icons/alert-circle'
import ClockIcon from 'lucide-react/dist/esm/icons/clock'
import TruckIcon from 'lucide-react/dist/esm/icons/truck'
import { cn } from '@/lib/utils'
import { VehicleReservation, CreateReservationRequest } from '@/types/scheduling'
import { Vehicle, Driver } from '@/lib/types'

const reservationSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  reservationType: z.enum(['general', 'delivery', 'service', 'personal']),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  endTime: z.string().min(1, 'End time is required'),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  estimatedMiles: z.coerce.number().min(0).optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  const [startHour, startMin] = data.startTime.split(':').map(Number)
  const [endHour, endMin] = data.endTime.split(':').map(Number)
  start.setHours(startHour, startMin, 0, 0)
  end.setHours(endHour, endMin, 0, 0)
  return end > start
}, {
  message: 'End date/time must be after start date/time',
  path: ['endDate'],
})

type ReservationFormValues = z.infer<typeof reservationSchema>

interface VehicleReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateReservationRequest) => Promise<void>
  reservation?: VehicleReservation
  vehicles?: Vehicle[]
  drivers?: Driver[]
  isLoading?: boolean
  onCheckAvailability?: (vehicleId: string, startTime: Date, endTime: Date) => Promise<{ available: boolean; conflicts?: any[] }>
}

const RESERVATION_TYPES = [
  { value: 'general', label: 'General Use' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'service', label: 'Service Call' },
  { value: 'personal', label: 'Personal Use' },
]

// Generate time slots (every 30 minutes)
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function VehicleReservationModal({
  open,
  onOpenChange,
  onSubmit,
  reservation,
  vehicles = [],
  drivers = [],
  isLoading = false,
  onCheckAvailability,
}: VehicleReservationModalProps) {
  const [checking, setChecking] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!reservation

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      vehicleId: reservation?.vehicle_id || '',
      driverId: reservation?.driver_id || '',
      reservationType: (reservation?.reservation_type as any) || 'general',
      startDate: reservation ? new Date(reservation.start_time) : new Date(),
      startTime: reservation ? format(new Date(reservation.start_time), 'HH:mm') : '08:00',
      endDate: reservation ? new Date(reservation.end_time) : new Date(),
      endTime: reservation ? format(new Date(reservation.end_time), 'HH:mm') : '17:00',
      pickupLocation: reservation?.pickup_location || '',
      dropoffLocation: reservation?.dropoff_location || '',
      estimatedMiles: reservation?.estimated_miles || undefined,
      purpose: reservation?.purpose || '',
      notes: reservation?.notes || '',
    },
  })

  const watchVehicleId = form.watch('vehicleId')
  const watchStartDate = form.watch('startDate')
  const watchStartTime = form.watch('startTime')
  const watchEndDate = form.watch('endDate')
  const watchEndTime = form.watch('endTime')

  // Check availability when vehicle or dates change
  useEffect(() => {
    const checkVehicleAvailability = async () => {
      if (!watchVehicleId || !watchStartDate || !watchStartTime || !watchEndDate || !watchEndTime || !onCheckAvailability) {
        setConflicts([])
        return
      }

      try {
        setChecking(true)
        const [startHour, startMin] = watchStartTime.split(':').map(Number)
        const [endHour, endMin] = watchEndTime.split(':').map(Number)

        const startDateTime = new Date(watchStartDate)
        startDateTime.setHours(startHour, startMin, 0, 0)

        const endDateTime = new Date(watchEndDate)
        endDateTime.setHours(endHour, endMin, 0, 0)

        const result = await onCheckAvailability(watchVehicleId, startDateTime, endDateTime)

        if (!result.available && result.conflicts) {
          setConflicts(result.conflicts)
        } else {
          setConflicts([])
        }
      } catch (error) {
        console.error('Failed to check availability:', error)
      } finally {
        setChecking(false)
      }
    }

    const timeoutId = setTimeout(checkVehicleAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [watchVehicleId, watchStartDate, watchStartTime, watchEndDate, watchEndTime, onCheckAvailability])

  const handleSubmit = async (values: ReservationFormValues) => {
    try {
      setSubmitting(true)

      const [startHour, startMin] = values.startTime.split(':').map(Number)
      const [endHour, endMin] = values.endTime.split(':').map(Number)

      const startDateTime = new Date(values.startDate)
      startDateTime.setHours(startHour, startMin, 0, 0)

      const endDateTime = new Date(values.endDate)
      endDateTime.setHours(endHour, endMin, 0, 0)

      const requestData: CreateReservationRequest = {
        vehicleId: values.vehicleId,
        driverId: values.driverId,
        reservationType: values.reservationType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        pickupLocation: values.pickupLocation,
        dropoffLocation: values.dropoffLocation,
        estimatedMiles: values.estimatedMiles,
        purpose: values.purpose,
        notes: values.notes,
      }

      await onSubmit(requestData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to submit reservation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === watchVehicleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            {isEditing ? 'Edit Vehicle Reservation' : 'New Vehicle Reservation'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the reservation details below' : 'Schedule a vehicle for use'}
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
                      <div>Type: {selectedVehicle.type}</div>
                      <div>Status: <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>{selectedVehicle.status}</Badge></div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Reservation Type */}
            <FormField
              control={form.control}
              name="reservationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservation Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESERVATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Availability Check Status */}
            {checking && (
              <Alert>
                <ClockIcon className="h-4 w-4" />
                <AlertDescription>Checking vehicle availability...</AlertDescription>
              </Alert>
            )}

            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Scheduling Conflicts Detected:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict.description}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Driver Assignment */}
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} - {driver.licenseType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Assign a specific driver to this reservation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dropoffLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dropoff Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dropoff location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Miles */}
            <FormField
              control={form.control}
              name="estimatedMiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Miles</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Estimated mileage for this trip
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of purpose" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or special requirements..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || checking || conflicts.length > 0}
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Reservation' : 'Create Reservation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
