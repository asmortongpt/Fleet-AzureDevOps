/**
 * FuelTransactionDialog - Add new fuel transaction
 *
 * Features:
 * - Vehicle and driver selection
 * - Fuel type and quantity input
 * - Cost tracking
 * - GPS location capture
 * - Odometer reading
 * - Receipt number tracking
 * - CSRF-protected submission
 *
 * Usage:
 * ```tsx
 * <FuelTransactionDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   tenantId="tenant-uuid"
 * />
 * ```
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Fuel, MapPin, Navigation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useFuelMutations, type CreateFuelTransactionInput } from '@/hooks/use-reactive-fuel-data'
import { useVehicles, useDrivers } from '@/hooks/use-api'
import logger from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface FuelTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess?: () => void
}

interface FormValues {
  vehicle_id: string
  driver_id: string
  transaction_date: string
  gallons: string
  cost_per_gallon: string
  odometer: string
  location: string
  latitude: string
  longitude: string
  fuel_type: 'diesel' | 'gasoline' | 'electric' | 'cng' | 'lpg' | ''
  vendor: string
  receipt_number: string
  notes: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FuelTransactionDialog({
  open,
  onOpenChange,
  tenantId,
  onSuccess
}: FuelTransactionDialogProps) {
  const [values, setValues] = useState<FormValues>({
    vehicle_id: '',
    driver_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    gallons: '',
    cost_per_gallon: '',
    odometer: '',
    location: '',
    latitude: '',
    longitude: '',
    fuel_type: '',
    vendor: '',
    receipt_number: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)

  const { createTransaction } = useFuelMutations()
  const { data: vehicles = [] } = useVehicles()
  const { data: drivers = [] } = useDrivers()

  // Handle field change
  const handleChange = (name: keyof FormValues, value: string) => {
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
      logger.error('[Fuel] Location capture error:', error)
      toast.error('Failed to capture location')
    } finally {
      setIsCapturingLocation(false)
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!values.vehicle_id) newErrors.vehicle_id = 'Vehicle is required'
    if (!values.transaction_date) newErrors.transaction_date = 'Date is required'
    if (!values.gallons || parseFloat(values.gallons) <= 0) {
      newErrors.gallons = 'Valid gallons amount required'
    }
    if (!values.cost_per_gallon || parseFloat(values.cost_per_gallon) <= 0) {
      newErrors.cost_per_gallon = 'Valid cost per gallon required'
    }
    if (!values.odometer || parseInt(values.odometer, 10) <= 0) {
      newErrors.odometer = 'Valid odometer reading required'
    }
    if (!values.location.trim()) newErrors.location = 'Location is required'
    if (!values.fuel_type) newErrors.fuel_type = 'Fuel type is required'
    if (!values.vendor.trim()) newErrors.vendor = 'Vendor is required'

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

    const transactionData: CreateFuelTransactionInput = {
      tenant_id: tenantId,
      vehicle_id: values.vehicle_id,
      driver_id: values.driver_id || undefined,
      transaction_date: values.transaction_date,
      gallons: parseFloat(values.gallons),
      cost_per_gallon: parseFloat(values.cost_per_gallon),
      odometer: parseInt(values.odometer, 10),
      location: values.location,
      latitude: values.latitude ? parseFloat(values.latitude) : undefined,
      longitude: values.longitude ? parseFloat(values.longitude) : undefined,
      fuel_type: values.fuel_type as 'diesel' | 'gasoline' | 'electric' | 'cng' | 'lpg',
      vendor: values.vendor,
      receipt_number: values.receipt_number || undefined,
      notes: values.notes || undefined
    }

    try {
      await createTransaction.mutateAsync(transactionData)
      toast.success('Fuel transaction added successfully')
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('[Fuel] Transaction creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add transaction')
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setValues({
        vehicle_id: '',
        driver_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        gallons: '',
        cost_per_gallon: '',
        odometer: '',
        location: '',
        latitude: '',
        longitude: '',
        fuel_type: '',
        vendor: '',
        receipt_number: '',
        notes: ''
      })
      setErrors({})
    }
  }

  const totalCost = values.gallons && values.cost_per_gallon
    ? (parseFloat(values.gallons) * parseFloat(values.cost_per_gallon)).toFixed(2)
    : '0.00'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              Add Fuel Transaction
            </DialogTitle>
            <DialogDescription>
              Record a new fuel purchase for fleet tracking and analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Vehicle & Driver Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">
                  Vehicle <span className="text-red-600">*</span>
                </Label>
                <Select value={values.vehicle_id} onValueChange={(val) => handleChange('vehicle_id', val)}>
                  <SelectTrigger id="vehicle" className={errors.vehicle_id ? 'border-red-600' : ''}>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.number} - {v.year} {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicle_id && <p className="text-sm text-red-600">{errors.vehicle_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Driver</Label>
                <Select value={values.driver_id} onValueChange={(val) => handleChange('driver_id', val)}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Select driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.firstName} {d.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Fuel Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Transaction Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={values.transaction_date}
                  onChange={(e) => handleChange('transaction_date', e.target.value)}
                  className={errors.transaction_date ? 'border-red-600' : ''}
                />
                {errors.transaction_date && <p className="text-sm text-red-600">{errors.transaction_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel-type">
                  Fuel Type <span className="text-red-600">*</span>
                </Label>
                <Select value={values.fuel_type} onValueChange={(val) => handleChange('fuel_type', val)}>
                  <SelectTrigger id="fuel-type" className={errors.fuel_type ? 'border-red-600' : ''}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="lpg">LPG</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuel_type && <p className="text-sm text-red-600">{errors.fuel_type}</p>}
              </div>
            </div>

            {/* Gallons & Cost */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gallons">
                  Gallons <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="gallons"
                  type="number"
                  step="0.01"
                  value={values.gallons}
                  onChange={(e) => handleChange('gallons', e.target.value)}
                  placeholder="0.00"
                  className={errors.gallons ? 'border-red-600' : ''}
                />
                {errors.gallons && <p className="text-sm text-red-600">{errors.gallons}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost-per-gallon">
                  Cost/Gallon <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="cost-per-gallon"
                  type="number"
                  step="0.01"
                  value={values.cost_per_gallon}
                  onChange={(e) => handleChange('cost_per_gallon', e.target.value)}
                  placeholder="0.00"
                  className={errors.cost_per_gallon ? 'border-red-600' : ''}
                />
                {errors.cost_per_gallon && <p className="text-sm text-red-600">{errors.cost_per_gallon}</p>}
              </div>

              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input value={`$${totalCost}`} disabled className="bg-muted" />
              </div>
            </div>

            {/* Odometer */}
            <div className="space-y-2">
              <Label htmlFor="odometer">
                Odometer Reading <span className="text-red-600">*</span>
              </Label>
              <Input
                id="odometer"
                type="number"
                value={values.odometer}
                onChange={(e) => handleChange('odometer', e.target.value)}
                placeholder="Current mileage"
                className={errors.odometer ? 'border-red-600' : ''}
              />
              {errors.odometer && <p className="text-sm text-red-600">{errors.odometer}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-600">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={values.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Station name or address"
                  className={`flex-1 ${errors.location ? 'border-red-600' : ''}`}
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
              {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
              {values.latitude && values.longitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  GPS: {values.latitude}, {values.longitude}
                </p>
              )}
            </div>

            {/* Vendor & Receipt */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">
                  Vendor <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="vendor"
                  value={values.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="Gas station name"
                  className={errors.vendor ? 'border-red-600' : ''}
                />
                {errors.vendor && <p className="text-sm text-red-600">{errors.vendor}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt Number</Label>
                <Input
                  id="receipt"
                  value={values.receipt_number}
                  onChange={(e) => handleChange('receipt_number', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes (optional)"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createTransaction.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
