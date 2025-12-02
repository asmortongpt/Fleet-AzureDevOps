import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Plus, Info } from "@phosphor-icons/react"
import { toast } from "sonner"
import { usePersonalUsePolicies, useCreateTripUsage, type TripUsageData, type Policy } from "@/hooks/usePersonalUseQueries"
interface TripUsageDialogProps {
  trigger?: React.ReactNode
  vehicleId?: string
  driverId?: string
  onSuccess?: () => void
  defaultValues?: Partial<TripUsageFormData>
}

interface TripUsageFormData extends TripUsageData {
  vehicle_id: string
  driver_id: string
  business_purpose: string
  personal_notes: string
  miles_total: number
  trip_date: string
  start_location: string
  end_location: string
  start_odometer: number
  end_odometer: number
}

export function TripUsageDialog({
  trigger,
  vehicleId,
  driverId,
  onSuccess,
  defaultValues
}: TripUsageDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TripUsageFormData>({
    vehicle_id: vehicleId || "",
    driver_id: driverId || "",
    usage_type: 'business',
    business_purpose: "",
    business_percentage: 100,
    personal_notes: "",
    miles_total: 0,
    trip_date: new Date().toISOString().split('T')[0],
    start_location: "",
    end_location: "",
    start_odometer: 0,
    end_odometer: 0,
    ...defaultValues
  })

  // Use TanStack Query for policy data
  const { data: policy, isLoading: policyLoading, error: policyError } = usePersonalUsePolicies()
  // Use TanStack Query mutation for creating trip usage
  const createTripMutation = useCreateTripUsage()

  const validateForm = (): string | null => {
    if (!formData.vehicle_id) return "Vehicle is required"
    if (!formData.driver_id) return "Driver is required"
    if (formData.miles_total <= 0) return "Miles must be greater than 0"
    if (!formData.trip_date) return "Trip date is required"

    // Federal requirement: business purpose for business/mixed trips
    if ((formData.usage_type === 'business' || formData.usage_type === 'mixed') &&
        !formData.business_purpose.trim()) {
      return "Business purpose is required for business and mixed trips (federal requirement)"
    }

    // Business percentage required for mixed trips
    if (formData.usage_type === 'mixed' &&
        (formData.business_percentage <= 0 || formData.business_percentage >= 100)) {
      return "Business percentage must be between 1-99 for mixed trips"
    }

    // Check if personal use is allowed
    if (policy && !policy.allow_personal_use && formData.usage_type !== 'business') {
      return "Personal use is not permitted per organization policy"
    }

    // Odometer validation
    if (formData.start_odometer && formData.end_odometer) {
      if (formData.end_odometer <= formData.start_odometer) {
        return "End odometer must be greater than start odometer"
      }
      const calculatedMiles = formData.end_odometer - formData.start_odometer
      if (Math.abs(calculatedMiles - formData.miles_total) > 5) {
        return `Odometer readings (${calculatedMiles} mi) don't match entered miles (${formData.miles_total} mi)`
      }
    }

    return null
  }

  const calculateEstimatedCharge = (): number => {
    if (!policy?.charge_personal_use || !policy.personal_use_rate_per_mile) return 0

    let personalMiles = 0
    if (formData.usage_type === 'personal') {
      personalMiles = formData.miles_total
    } else if (formData.usage_type === 'mixed') {
      personalMiles = formData.miles_total * ((100 - formData.business_percentage) / 100)
    }

    return personalMiles * policy.personal_use_rate_per_mile
  }

  const handleSubmit = () => {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    // Call mutation with form data
    createTripMutation.mutate(formData, {
      onSuccess: (response: any) => {
        const needsApproval = response.approval_status === 'pending'

        toast.success(
          needsApproval
            ? 'Trip recorded and submitted for approval'
            : 'Trip recorded successfully'
        )

        // Show charge estimate if applicable
        const charge = calculateEstimatedCharge()
        if (charge > 0) {
          toast.info(`Estimated personal use charge: $${charge.toFixed(2)}`)
        }

        setOpen(false)
        resetForm()
        onSuccess?.()
      },
      onError: (error: any) => {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to record trip usage'
        toast.error(errorMsg)
      }
    })
  }

  const resetForm = () => {
    setFormData({
      vehicle_id: vehicleId || "",
      driver_id: driverId || "",
      usage_type: 'business',
      business_purpose: "",
      business_percentage: 100,
      personal_notes: "",
      miles_total: 0,
      trip_date: new Date().toISOString().split('T')[0],
      start_location: "",
      end_location: "",
      start_odometer: 0,
      end_odometer: 0
    })
  }

  const businessMiles = formData.usage_type === 'business'
    ? formData.miles_total
    : formData.usage_type === 'mixed'
      ? formData.miles_total * (formData.business_percentage / 100)
      : 0

  const personalMiles = formData.usage_type === 'personal'
    ? formData.miles_total
    : formData.usage_type === 'mixed'
      ? formData.miles_total * ((100 - formData.business_percentage) / 100)
      : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Record Trip Usage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Personal vs Business Trip Classification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Usage Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Trip Usage Type *</Label>
            <RadioGroup
              value={formData.usage_type}
              onValueChange={(value: any) => {
                setFormData({
                  ...formData,
                  usage_type: value,
                  business_percentage: value === 'business' ? 100 : value === 'personal' ? 0 : 50
                })
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Business Use</div>
                  <div className="text-sm text-muted-foreground">Official organization business - Full federal rate reimbursement</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Personal Use</div>
                  <div className="text-sm text-muted-foreground">
                    Private/personal use - {policy?.charge_personal_use ? 'Subject to charges' : 'No reimbursement'}
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Mixed Use</div>
                  <div className="text-sm text-muted-foreground">Combination of business and personal - Pro-rated calculation</div>
                </Label>
              </div>
            </RadioGroup>

            {!policy?.allow_personal_use && formData.usage_type !== 'business' && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Personal use is not permitted per organization policy
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Mixed Use Percentage Slider */}
          {formData.usage_type === 'mixed' && (
            <div className="space-y-3 p-4 border rounded-lg bg-accent/50">
              <Label className="text-base font-semibold">Business Percentage: {formData.business_percentage}%</Label>
              <Slider
                value={[formData.business_percentage]}
                onValueChange={([value]) => setFormData({ ...formData, business_percentage: value })}
                min={1}
                max={99}
                step={1}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Business Miles</div>
                  <div className="font-semibold">{businessMiles.toFixed(1)} mi</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Personal Miles</div>
                  <div className="font-semibold">{personalMiles.toFixed(1)} mi</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Trip Date */}
            <div className="space-y-2">
              <Label htmlFor="trip_date">Trip Date *</Label>
              <Input
                id="trip_date"
                type="date"
                value={formData.trip_date}
                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Total Miles */}
            <div className="space-y-2">
              <Label htmlFor="miles_total">Total Miles *</Label>
              <Input
                id="miles_total"
                type="number"
                min="0"
                step="0.1"
                value={formData.miles_total || ''}
                onChange={(e) => setFormData({ ...formData, miles_total: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Business Purpose (required for business/mixed) */}
          {(formData.usage_type === 'business' || formData.usage_type === 'mixed') && (
            <div className="space-y-2">
              <Label htmlFor="business_purpose">
                Business Purpose * <span className="text-xs text-muted-foreground">(Federal requirement)</span>
              </Label>
              <Textarea
                id="business_purpose"
                value={formData.business_purpose}
                onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
                placeholder="e.g., Client meeting, site visit, training session..."
                rows={2}
              />
            </div>
          )}

          {/* Personal Notes (optional for personal) */}
          {formData.usage_type === 'personal' && (
            <div className="space-y-2">
              <Label htmlFor="personal_notes">Personal Notes (Optional)</Label>
              <Textarea
                id="personal_notes"
                value={formData.personal_notes}
                onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
                placeholder="Optional notes about personal use..."
                rows={2}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Start Location */}
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                placeholder="e.g., Office, Home..."
              />
            </div>

            {/* End Location */}
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <Input
                id="end_location"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                placeholder="e.g., Client site, Airport..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Odometer */}
            <div className="space-y-2">
              <Label htmlFor="start_odometer">Start Odometer (Optional)</Label>
              <Input
                id="start_odometer"
                type="number"
                min="0"
                step="0.1"
                value={formData.start_odometer || ''}
                onChange={(e) => setFormData({ ...formData, start_odometer: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
              />
            </div>

            {/* End Odometer */}
            <div className="space-y-2">
              <Label htmlFor="end_odometer">End Odometer (Optional)</Label>
              <Input
                id="end_odometer"
                type="number"
                min="0"
                step="0.1"
                value={formData.end_odometer || ''}
                onChange={(e) => setFormData({ ...formData, end_odometer: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Charge Estimate */}
          {calculateEstimatedCharge() > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Estimated Personal Use Charge:</strong> ${calculateEstimatedCharge().toFixed(2)}
                <br />
                <span className="text-xs text-muted-foreground">
                  Based on {personalMiles.toFixed(1)} personal miles at ${policy?.personal_use_rate_per_mile}/mile
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Notice */}
          {policy?.require_approval && formData.usage_type !== 'business' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This trip will require manager approval before processing.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              resetForm()
            }}
            disabled={createTripMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTripMutation.isPending}>
            {createTripMutation.isPending ? 'Saving...' : 'Record Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
