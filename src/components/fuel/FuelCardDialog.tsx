/**
 * FuelCardDialog - Manage fuel cards
 *
 * Features:
 * - Card number input (secured - last 4 digits only)
 * - Card holder assignment
 * - Driver/vehicle assignment
 * - Daily and monthly spending limits
 * - Fuel type restrictions
 * - Expiration tracking
 * - Card status management
 * - CSRF-protected submission
 *
 * Usage:
 * ```tsx
 * <FuelCardDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   tenantId="tenant-uuid"
 * />
 * ```
 */

import { CreditCard } from 'lucide-react'
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
import { useFuelMutations, type CreateFuelCardInput } from '@/hooks/use-reactive-fuel-data'
import logger from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface FuelCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess?: () => void
}

interface FormValues {
  card_number: string
  card_holder: string
  assigned_driver_id: string
  assigned_vehicle_id: string
  daily_limit: string
  monthly_limit: string
  expiration_date: string
  fuel_type_diesel: boolean
  fuel_type_gasoline: boolean
  fuel_type_electric: boolean
  fuel_type_cng: boolean
  fuel_type_lpg: boolean
  notes: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FuelCardDialog({
  open,
  onOpenChange,
  tenantId,
  onSuccess
}: FuelCardDialogProps) {
  const [values, setValues] = useState<FormValues>({
    card_number: '',
    card_holder: '',
    assigned_driver_id: '',
    assigned_vehicle_id: '',
    daily_limit: '',
    monthly_limit: '',
    expiration_date: '',
    fuel_type_diesel: false,
    fuel_type_gasoline: false,
    fuel_type_electric: false,
    fuel_type_cng: false,
    fuel_type_lpg: false,
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createCard } = useFuelMutations()
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

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!values.card_number.trim()) {
      newErrors.card_number = 'Card number is required'
    } else if (values.card_number.length !== 4) {
      newErrors.card_number = 'Enter last 4 digits only'
    } else if (!/^\d{4}$/.test(values.card_number)) {
      newErrors.card_number = 'Must be 4 digits'
    }

    if (!values.card_holder.trim()) {
      newErrors.card_holder = 'Card holder name is required'
    }

    if (!values.expiration_date) {
      newErrors.expiration_date = 'Expiration date is required'
    } else {
      const expDate = new Date(values.expiration_date)
      if (expDate < new Date()) {
        newErrors.expiration_date = 'Card is already expired'
      }
    }

    if (values.daily_limit && parseFloat(values.daily_limit) <= 0) {
      newErrors.daily_limit = 'Daily limit must be positive'
    }

    if (values.monthly_limit && parseFloat(values.monthly_limit) <= 0) {
      newErrors.monthly_limit = 'Monthly limit must be positive'
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

    // Build fuel type restrictions array
    const fuelTypeRestrictions: string[] = []
    if (values.fuel_type_diesel) fuelTypeRestrictions.push('diesel')
    if (values.fuel_type_gasoline) fuelTypeRestrictions.push('gasoline')
    if (values.fuel_type_electric) fuelTypeRestrictions.push('electric')
    if (values.fuel_type_cng) fuelTypeRestrictions.push('cng')
    if (values.fuel_type_lpg) fuelTypeRestrictions.push('lpg')

    const cardData: CreateFuelCardInput = {
      tenant_id: tenantId,
      card_number: values.card_number,
      card_holder: values.card_holder,
      assigned_driver_id: values.assigned_driver_id || undefined,
      assigned_vehicle_id: values.assigned_vehicle_id || undefined,
      daily_limit: values.daily_limit ? parseFloat(values.daily_limit) : undefined,
      monthly_limit: values.monthly_limit ? parseFloat(values.monthly_limit) : undefined,
      fuel_type_restrictions: fuelTypeRestrictions.length > 0 ? fuelTypeRestrictions : undefined,
      expiration_date: values.expiration_date,
      notes: values.notes || undefined
    }

    try {
      await createCard.mutateAsync(cardData)
      toast.success('Fuel card added successfully')
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('[Fuel] Card creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add fuel card')
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setValues({
        card_number: '',
        card_holder: '',
        assigned_driver_id: '',
        assigned_vehicle_id: '',
        daily_limit: '',
        monthly_limit: '',
        expiration_date: '',
        fuel_type_diesel: false,
        fuel_type_gasoline: false,
        fuel_type_electric: false,
        fuel_type_cng: false,
        fuel_type_lpg: false,
        notes: ''
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Add Fuel Card
            </DialogTitle>
            <DialogDescription>
              Register a new fleet fuel card for tracking and limit management
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Card Number & Holder */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">
                  Card Number (Last 4 Digits) <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="card-number"
                  value={values.card_number}
                  onChange={(e) => handleChange('card_number', e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className={errors.card_number ? 'border-red-600' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  For security, only enter the last 4 digits
                </p>
                {errors.card_number && <p className="text-sm text-red-600">{errors.card_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-holder">
                  Card Holder <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="card-holder"
                  value={values.card_holder}
                  onChange={(e) => handleChange('card_holder', e.target.value)}
                  placeholder="John Doe"
                  className={errors.card_holder ? 'border-red-600' : ''}
                />
                {errors.card_holder && <p className="text-sm text-red-600">{errors.card_holder}</p>}
              </div>
            </div>

            {/* Assigned Driver & Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Assigned Driver</Label>
                <Select
                  value={values.assigned_driver_id}
                  onValueChange={(val) => handleChange('assigned_driver_id', val)}
                >
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
                <Label htmlFor="vehicle">Assigned Vehicle</Label>
                <Select
                  value={values.assigned_vehicle_id}
                  onValueChange={(val) => handleChange('assigned_vehicle_id', val)}
                >
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

            {/* Spending Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Limit ($)</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  step="0.01"
                  value={values.daily_limit}
                  onChange={(e) => handleChange('daily_limit', e.target.value)}
                  placeholder="0.00"
                  className={errors.daily_limit ? 'border-red-600' : ''}
                />
                {errors.daily_limit && <p className="text-sm text-red-600">{errors.daily_limit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-limit">Monthly Limit ($)</Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  step="0.01"
                  value={values.monthly_limit}
                  onChange={(e) => handleChange('monthly_limit', e.target.value)}
                  placeholder="0.00"
                  className={errors.monthly_limit ? 'border-red-600' : ''}
                />
                {errors.monthly_limit && <p className="text-sm text-red-600">{errors.monthly_limit}</p>}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expiration">
                Expiration Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="expiration"
                type="date"
                value={values.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
                className={errors.expiration_date ? 'border-red-600' : ''}
              />
              {errors.expiration_date && <p className="text-sm text-red-600">{errors.expiration_date}</p>}
            </div>

            {/* Fuel Type Restrictions */}
            <div className="space-y-2">
              <Label>Fuel Type Restrictions</Label>
              <p className="text-xs text-muted-foreground">
                Select allowed fuel types (leave all unchecked for no restrictions)
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel-diesel"
                    checked={values.fuel_type_diesel}
                    onCheckedChange={(checked) => handleChange('fuel_type_diesel', !!checked)}
                  />
                  <label htmlFor="fuel-diesel" className="text-sm cursor-pointer">
                    Diesel
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel-gasoline"
                    checked={values.fuel_type_gasoline}
                    onCheckedChange={(checked) => handleChange('fuel_type_gasoline', !!checked)}
                  />
                  <label htmlFor="fuel-gasoline" className="text-sm cursor-pointer">
                    Gasoline
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel-electric"
                    checked={values.fuel_type_electric}
                    onCheckedChange={(checked) => handleChange('fuel_type_electric', !!checked)}
                  />
                  <label htmlFor="fuel-electric" className="text-sm cursor-pointer">
                    Electric
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel-cng"
                    checked={values.fuel_type_cng}
                    onCheckedChange={(checked) => handleChange('fuel_type_cng', !!checked)}
                  />
                  <label htmlFor="fuel-cng" className="text-sm cursor-pointer">
                    CNG
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuel-lpg"
                    checked={values.fuel_type_lpg}
                    onCheckedChange={(checked) => handleChange('fuel_type_lpg', !!checked)}
                  />
                  <label htmlFor="fuel-lpg" className="text-sm cursor-pointer">
                    LPG
                  </label>
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
                placeholder="Additional information (optional)"
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
              disabled={createCard.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending ? 'Adding...' : 'Add Fuel Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
