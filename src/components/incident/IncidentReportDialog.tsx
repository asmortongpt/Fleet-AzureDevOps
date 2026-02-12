/**
 * IncidentReportDialog - Report safety incidents/accidents
 *
 * Features:
 * - Comprehensive incident details capture
 * - Severity and type classification
 * - Location tracking with GPS
 * - Witness information
 * - Damage/injury reporting
 * - Police/emergency services tracking
 * - CSRF-protected submission
 *
 * Usage:
 * ```tsx
 * <IncidentReportDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   tenantId="tenant-uuid"
 *   reportedBy="user-uuid"
 * />
 * ```
 */

import { AlertTriangle, Navigation, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useVehicles, useDrivers } from '@/hooks/use-api'
import {
  useIncidentMutations,
  type CreateIncidentInput,
  type IncidentSeverity,
  type IncidentType
} from '@/hooks/use-reactive-incident-data'
import logger from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface IncidentReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  reportedBy: string
  onSuccess?: () => void
}

interface FormValues {
  incident_date: string
  incident_time: string
  severity: IncidentSeverity | ''
  type: IncidentType | ''
  location_address: string
  location_city: string
  location_state: string
  latitude: string
  longitude: string
  driver_id: string
  vehicle_id: string
  third_party_involved: boolean
  third_party_details: string
  description: string
  weather_conditions: string
  road_conditions: string
  injuries_reported: boolean
  injury_details: string
  vehicle_damage_estimate: string
  property_damage_estimate: string
  police_report_filed: boolean
  police_report_number: string
  emergency_services_called: boolean
}

// ============================================================================
// US STATES
// ============================================================================

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

export function IncidentReportDialog({
  open,
  onOpenChange,
  tenantId,
  reportedBy,
  onSuccess
}: IncidentReportDialogProps) {
  const now = new Date()
  const [values, setValues] = useState<FormValues>({
    incident_date: now.toISOString().split('T')[0],
    incident_time: now.toTimeString().slice(0, 5),
    severity: '',
    type: '',
    location_address: '',
    location_city: '',
    location_state: '',
    latitude: '',
    longitude: '',
    driver_id: '',
    vehicle_id: '',
    third_party_involved: false,
    third_party_details: '',
    description: '',
    weather_conditions: '',
    road_conditions: '',
    injuries_reported: false,
    injury_details: '',
    vehicle_damage_estimate: '',
    property_damage_estimate: '',
    police_report_filed: false,
    police_report_number: '',
    emergency_services_called: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)

  const { createIncident } = useIncidentMutations()
  const { data: vehicles = [] } = useVehicles()
  const { data: drivers = [] } = useDrivers()

  // Handle field change
  const handleChange = (name: keyof FormValues, value: string | boolean) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Capture GPS location
  const captureLocation = async () => {
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
      setValues(prev => ({
        ...prev,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6)
      }))
      toast.success('Location captured successfully')
    } catch (error) {
      logger.error('[Incident] Location capture error:', error)
      toast.error('Failed to capture location')
    } finally {
      setIsCapturingLocation(false)
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!values.incident_date) newErrors.incident_date = 'Date is required'
    if (!values.incident_time) newErrors.incident_time = 'Time is required'
    if (!values.severity) newErrors.severity = 'Severity is required'
    if (!values.type) newErrors.type = 'Incident type is required'
    if (!values.location_address.trim()) newErrors.location_address = 'Address is required'
    if (!values.location_city.trim()) newErrors.location_city = 'City is required'
    if (!values.location_state) newErrors.location_state = 'State is required'
    if (!values.description.trim()) newErrors.description = 'Description is required'
    if (values.description.length < 20) newErrors.description = 'Description must be at least 20 characters'

    if (values.third_party_involved && !values.third_party_details.trim()) {
      newErrors.third_party_details = 'Third party details are required'
    }

    if (values.injuries_reported && !values.injury_details.trim()) {
      newErrors.injury_details = 'Injury details are required'
    }

    if (values.police_report_filed && !values.police_report_number.trim()) {
      newErrors.police_report_number = 'Police report number is required'
    }

    if (values.vehicle_damage_estimate && parseFloat(values.vehicle_damage_estimate) < 0) {
      newErrors.vehicle_damage_estimate = 'Amount must be positive'
    }

    if (values.property_damage_estimate && parseFloat(values.property_damage_estimate) < 0) {
      newErrors.property_damage_estimate = 'Amount must be positive'
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

    const incidentData: CreateIncidentInput = {
      tenant_id: tenantId,
      incident_date: values.incident_date,
      incident_time: values.incident_time,
      severity: values.severity as IncidentSeverity,
      type: values.type as IncidentType,
      location_address: values.location_address,
      location_city: values.location_city,
      location_state: values.location_state,
      latitude: values.latitude ? parseFloat(values.latitude) : undefined,
      longitude: values.longitude ? parseFloat(values.longitude) : undefined,
      driver_id: values.driver_id || undefined,
      vehicle_id: values.vehicle_id || undefined,
      third_party_involved: values.third_party_involved,
      third_party_details: values.third_party_details || undefined,
      description: values.description,
      weather_conditions: values.weather_conditions || undefined,
      road_conditions: values.road_conditions || undefined,
      injuries_reported: values.injuries_reported,
      injury_details: values.injury_details || undefined,
      vehicle_damage_estimate: values.vehicle_damage_estimate ? parseFloat(values.vehicle_damage_estimate) : undefined,
      property_damage_estimate: values.property_damage_estimate ? parseFloat(values.property_damage_estimate) : undefined,
      police_report_filed: values.police_report_filed,
      police_report_number: values.police_report_number || undefined,
      emergency_services_called: values.emergency_services_called,
      reported_by: reportedBy
    }

    try {
      await createIncident.mutateAsync(incidentData)
      toast.success('Incident reported successfully')
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('[Incident] Report creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to report incident')
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      const now = new Date()
      setValues({
        incident_date: now.toISOString().split('T')[0],
        incident_time: now.toTimeString().slice(0, 5),
        severity: '',
        type: '',
        location_address: '',
        location_city: '',
        location_state: '',
        latitude: '',
        longitude: '',
        driver_id: '',
        vehicle_id: '',
        third_party_involved: false,
        third_party_details: '',
        description: '',
        weather_conditions: '',
        road_conditions: '',
        injuries_reported: false,
        injury_details: '',
        vehicle_damage_estimate: '',
        property_damage_estimate: '',
        police_report_filed: false,
        police_report_number: '',
        emergency_services_called: false
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Report Safety Incident
            </DialogTitle>
            <DialogDescription>
              Document all safety incidents, accidents, and near-misses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Incident Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={values.incident_date}
                  onChange={(e) => handleChange('incident_date', e.target.value)}
                  className={errors.incident_date ? 'border-red-600' : ''}
                />
                {errors.incident_date && <p className="text-sm text-red-600">{errors.incident_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">
                  Incident Time <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={values.incident_time}
                  onChange={(e) => handleChange('incident_time', e.target.value)}
                  className={errors.incident_time ? 'border-red-600' : ''}
                />
                {errors.incident_time && <p className="text-sm text-red-600">{errors.incident_time}</p>}
              </div>
            </div>

            {/* Severity & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">
                  Severity <span className="text-red-600">*</span>
                </Label>
                <Select value={values.severity} onValueChange={(val) => handleChange('severity', val)}>
                  <SelectTrigger id="severity" className={errors.severity ? 'border-red-600' : ''}>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="fatality">Fatality</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-sm text-red-600">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Incident Type <span className="text-red-600">*</span>
                </Label>
                <Select value={values.type} onValueChange={(val) => handleChange('type', val)}>
                  <SelectTrigger id="type" className={errors.type ? 'border-red-600' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle_accident">Vehicle Accident</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="personal_injury">Personal Injury</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="equipment_damage">Equipment Damage</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
              </div>
            </div>

            {/* Driver & Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Involved Driver</Label>
                <Select value={values.driver_id} onValueChange={(val) => handleChange('driver_id', val)}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Select driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.firstName} {d.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">Involved Vehicle</Label>
                <Select value={values.vehicle_id} onValueChange={(val) => handleChange('vehicle_id', val)}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.number} - {v.year} {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address">
                Location Address <span className="text-red-600">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={values.location_address}
                  onChange={(e) => handleChange('location_address', e.target.value)}
                  placeholder="Street address"
                  className={`flex-1 ${errors.location_address ? 'border-red-600' : ''}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureLocation}
                  disabled={isCapturingLocation}
                >
                  <Navigation className={`h-4 w-4 ${isCapturingLocation ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
              {errors.location_address && <p className="text-sm text-red-600">{errors.location_address}</p>}
              {values.latitude && values.longitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  GPS: {values.latitude}, {values.longitude}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="city"
                  value={values.location_city}
                  onChange={(e) => handleChange('location_city', e.target.value)}
                  className={errors.location_city ? 'border-red-600' : ''}
                />
                {errors.location_city && <p className="text-sm text-red-600">{errors.location_city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-red-600">*</span>
                </Label>
                <Select value={values.location_state} onValueChange={(val) => handleChange('location_state', val)}>
                  <SelectTrigger id="state" className={errors.location_state ? 'border-red-600' : ''}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location_state && <p className="text-sm text-red-600">{errors.location_state}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Incident Description <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Provide a detailed description of what happened..."
                rows={4}
                className={`resize-none ${errors.description ? 'border-red-600' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 20 characters ({values.description.length}/20)
              </p>
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weather">Weather Conditions</Label>
                <Input
                  id="weather"
                  value={values.weather_conditions}
                  onChange={(e) => handleChange('weather_conditions', e.target.value)}
                  placeholder="e.g., Clear, Rainy, Foggy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="road">Road Conditions</Label>
                <Input
                  id="road"
                  value={values.road_conditions}
                  onChange={(e) => handleChange('road_conditions', e.target.value)}
                  placeholder="e.g., Dry, Wet, Icy"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="third-party"
                  checked={values.third_party_involved}
                  onCheckedChange={(checked) => handleChange('third_party_involved', !!checked)}
                />
                <label htmlFor="third-party" className="text-sm cursor-pointer">
                  Third party involved
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="injuries"
                  checked={values.injuries_reported}
                  onCheckedChange={(checked) => handleChange('injuries_reported', !!checked)}
                />
                <label htmlFor="injuries" className="text-sm cursor-pointer">
                  Injuries reported
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="police"
                  checked={values.police_report_filed}
                  onCheckedChange={(checked) => handleChange('police_report_filed', !!checked)}
                />
                <label htmlFor="police" className="text-sm cursor-pointer">
                  Police report filed
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergency"
                  checked={values.emergency_services_called}
                  onCheckedChange={(checked) => handleChange('emergency_services_called', !!checked)}
                />
                <label htmlFor="emergency" className="text-sm cursor-pointer">
                  Emergency services called
                </label>
              </div>
            </div>

            {/* Conditional Fields */}
            {values.third_party_involved && (
              <div className="space-y-2">
                <Label htmlFor="third-party-details">
                  Third Party Details <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="third-party-details"
                  value={values.third_party_details}
                  onChange={(e) => handleChange('third_party_details', e.target.value)}
                  placeholder="Name, contact info, insurance details..."
                  rows={2}
                  className={`resize-none ${errors.third_party_details ? 'border-red-600' : ''}`}
                />
                {errors.third_party_details && <p className="text-sm text-red-600">{errors.third_party_details}</p>}
              </div>
            )}

            {values.injuries_reported && (
              <div className="space-y-2">
                <Label htmlFor="injury-details">
                  Injury Details <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="injury-details"
                  value={values.injury_details}
                  onChange={(e) => handleChange('injury_details', e.target.value)}
                  placeholder="Describe injuries and medical treatment received..."
                  rows={2}
                  className={`resize-none ${errors.injury_details ? 'border-red-600' : ''}`}
                />
                {errors.injury_details && <p className="text-sm text-red-600">{errors.injury_details}</p>}
              </div>
            )}

            {values.police_report_filed && (
              <div className="space-y-2">
                <Label htmlFor="police-number">
                  Police Report Number <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="police-number"
                  value={values.police_report_number}
                  onChange={(e) => handleChange('police_report_number', e.target.value)}
                  placeholder="Report number"
                  className={errors.police_report_number ? 'border-red-600' : ''}
                />
                {errors.police_report_number && <p className="text-sm text-red-600">{errors.police_report_number}</p>}
              </div>
            )}

            {/* Damage Estimates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-damage">Vehicle Damage Estimate ($)</Label>
                <Input
                  id="vehicle-damage"
                  type="number"
                  step="0.01"
                  value={values.vehicle_damage_estimate}
                  onChange={(e) => handleChange('vehicle_damage_estimate', e.target.value)}
                  placeholder="0.00"
                  className={errors.vehicle_damage_estimate ? 'border-red-600' : ''}
                />
                {errors.vehicle_damage_estimate && <p className="text-sm text-red-600">{errors.vehicle_damage_estimate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="property-damage">Property Damage Estimate ($)</Label>
                <Input
                  id="property-damage"
                  type="number"
                  step="0.01"
                  value={values.property_damage_estimate}
                  onChange={(e) => handleChange('property_damage_estimate', e.target.value)}
                  placeholder="0.00"
                  className={errors.property_damage_estimate ? 'border-red-600' : ''}
                />
                {errors.property_damage_estimate && <p className="text-sm text-red-600">{errors.property_damage_estimate}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createIncident.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createIncident.isPending} variant="destructive">
              {createIncident.isPending ? 'Reporting...' : 'Report Incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
