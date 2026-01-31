/**
 * HOSLogEntryDialog - Create new HOS log entries
 *
 * Modal dialog for drivers to create Hours of Service log entries.
 * Captures duty status, location, odometer, and automatically validates
 * against DOT 49 CFR 395.3 regulations.
 *
 * Features:
 * - Duty status selection (Off Duty, Sleeper, Driving, On Duty)
 * - GPS location auto-capture
 * - Odometer reading input
 * - Real-time validation
 * - Automatic violation checking
 * - CSRF-protected submission
 *
 * Usage:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <HOSLogEntryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   driverId="abc123"
 *   tenantId="tenant-uuid"
 * />
 * ```
 */

import { useState, useEffect } from 'react'
import toast from 'sonner'
import { Clock, MapPin, AlertCircle, Navigation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useHOSLogMutations, type DutyStatus, type CreateHOSLogInput } from '@/hooks/use-hos-data'
import logger from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface HOSLogEntryDialogProps {
  /** Dialog open state */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Driver ID creating the log */
  driverId: string
  /** Tenant ID for multi-tenant isolation */
  tenantId: string
  /** Optional vehicle ID (can be selected in form) */
  vehicleId?: string
  /** Callback on successful creation */
  onSuccess?: () => void
}

interface FormValues {
  duty_status: DutyStatus | ''
  vehicle_id: string
  odometer_reading: string
  location_address: string
  location_city: string
  location_state: string
  latitude: string
  longitude: string
  notes: string
}

interface FormErrors {
  [key: string]: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DUTY_STATUS_OPTIONS = [
  { value: 'off_duty', label: 'Off Duty', description: 'Not working, personal time' },
  { value: 'sleeper_berth', label: 'Sleeper Berth', description: 'Resting in sleeper berth' },
  { value: 'driving', label: 'Driving', description: 'Operating vehicle' },
  { value: 'on_duty_not_driving', label: 'On Duty (Not Driving)', description: 'Working but not driving' }
] as const

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

// ============================================================================
// COMPONENT
// ============================================================================

export function HOSLogEntryDialog({
  open,
  onOpenChange,
  driverId,
  tenantId,
  vehicleId: initialVehicleId = '',
  onSuccess
}: HOSLogEntryDialogProps) {
  // Form state
  const [values, setValues] = useState<FormValues>({
    duty_status: '',
    vehicle_id: initialVehicleId,
    odometer_reading: '',
    location_address: '',
    location_city: '',
    location_state: '',
    latitude: '',
    longitude: '',
    notes: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)

  // Mutation hook
  const { createLog } = useHOSLogMutations()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setValues({
        duty_status: '',
        vehicle_id: initialVehicleId,
        odometer_reading: '',
        location_address: '',
        location_city: '',
        location_state: '',
        latitude: '',
        longitude: '',
        notes: ''
      })
      setErrors({})
    }
  }, [open, initialVehicleId])

  // Handle field change
  const handleChange = (name: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Capture GPS location
  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsCapturingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords

      // Update coordinates
      setValues((prev) => ({
        ...prev,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6)
      }))

      // Reverse geocode (simplified - in production, use a geocoding service)
      // For now, just confirm capture
      toast.success('Location captured successfully')
      logger.info('[HOS] GPS location captured:', { latitude, longitude })
    } catch (error) {
      logger.error('[HOS] Location capture error:', error)
      toast.error('Failed to capture location. Please enter manually.')
    } finally {
      setIsCapturingLocation(false)
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!values.duty_status) {
      newErrors.duty_status = 'Duty status is required'
    }

    if (values.duty_status === 'driving' && !values.vehicle_id) {
      newErrors.vehicle_id = 'Vehicle ID is required when driving'
    }

    if (values.odometer_reading && isNaN(Number(values.odometer_reading))) {
      newErrors.odometer_reading = 'Odometer must be a number'
    }

    if (!values.location_address) {
      newErrors.location_address = 'Location address is required'
    }

    if (!values.location_city) {
      newErrors.location_city = 'City is required'
    }

    if (!values.location_state) {
      newErrors.location_state = 'State is required'
    }

    if (values.latitude && (isNaN(Number(values.latitude)) || Number(values.latitude) < -90 || Number(values.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90'
    }

    if (values.longitude && (isNaN(Number(values.longitude)) || Number(values.longitude) < -180 || Number(values.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    // Build log data
    const logData: CreateHOSLogInput = {
      driver_id: driverId,
      tenant_id: tenantId,
      duty_status: values.duty_status as DutyStatus,
      start_time: new Date().toISOString(),
      start_location: {
        address: values.location_address,
        city: values.location_city,
        state: values.location_state,
        coordinates: values.latitude && values.longitude
          ? {
              latitude: parseFloat(values.latitude),
              longitude: parseFloat(values.longitude)
            }
          : undefined
      }
    }

    // Optional fields
    if (values.vehicle_id) {
      logData.vehicle_id = values.vehicle_id
    }

    if (values.odometer_reading) {
      logData.odometer_reading = parseInt(values.odometer_reading, 10)
    }

    if (values.notes) {
      logData.notes = values.notes
    }

    try {
      await createLog.mutateAsync(logData)
      toast.success('HOS log created successfully')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('[HOS] Log creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create HOS log')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Create HOS Log Entry
            </DialogTitle>
            <DialogDescription>
              Record your current duty status and location for DOT compliance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Duty Status */}
            <div className="space-y-2">
              <Label htmlFor="duty_status">
                Duty Status <span className="text-red-600">*</span>
              </Label>
              <Select
                value={values.duty_status}
                onValueChange={(value) => handleChange('duty_status', value)}
              >
                <SelectTrigger
                  id="duty_status"
                  className={errors.duty_status ? 'border-red-600' : ''}
                >
                  <SelectValue placeholder="Select duty status..." />
                </SelectTrigger>
                <SelectContent>
                  {DUTY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duty_status && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.duty_status}
                </p>
              )}
            </div>

            {/* Vehicle ID */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">
                Vehicle ID
                {values.duty_status === 'driving' && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </Label>
              <Input
                id="vehicle_id"
                type="text"
                value={values.vehicle_id}
                onChange={(e) => handleChange('vehicle_id', e.target.value)}
                placeholder="e.g., FL-001, TRK-456"
                className={errors.vehicle_id ? 'border-red-600' : ''}
              />
              {errors.vehicle_id && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.vehicle_id}
                </p>
              )}
            </div>

            {/* Odometer Reading */}
            <div className="space-y-2">
              <Label htmlFor="odometer_reading">Odometer Reading (miles)</Label>
              <Input
                id="odometer_reading"
                type="number"
                value={values.odometer_reading}
                onChange={(e) => handleChange('odometer_reading', e.target.value)}
                placeholder="e.g., 125430"
                className={errors.odometer_reading ? 'border-red-600' : ''}
              />
              {errors.odometer_reading && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.odometer_reading}
                </p>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Information
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureLocation}
                  disabled={isCapturingLocation}
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  {isCapturingLocation ? 'Capturing...' : 'Capture GPS'}
                </Button>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="location_address">
                  Address <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="location_address"
                  type="text"
                  value={values.location_address}
                  onChange={(e) => handleChange('location_address', e.target.value)}
                  placeholder="123 Main St"
                  className={errors.location_address ? 'border-red-600' : ''}
                />
                {errors.location_address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.location_address}
                  </p>
                )}
              </div>

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_city">
                    City <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="location_city"
                    type="text"
                    value={values.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                    placeholder="Orlando"
                    className={errors.location_city ? 'border-red-600' : ''}
                  />
                  {errors.location_city && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.location_city}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_state">
                    State <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={values.location_state}
                    onValueChange={(value) => handleChange('location_state', value)}
                  >
                    <SelectTrigger
                      id="location_state"
                      className={errors.location_state ? 'border-red-600' : ''}
                    >
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location_state && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.location_state}
                    </p>
                  )}
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="text"
                    value={values.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="28.538336"
                    className={errors.latitude ? 'border-red-600' : ''}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.latitude}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="text"
                    value={values.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="-81.379234"
                    className={errors.longitude ? 'border-red-600' : ''}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.longitude}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Optional notes about this log entry..."
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Add any relevant details about this duty status change
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createLog.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLog.isPending}>
              {createLog.isPending ? 'Creating...' : 'Create Log Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
