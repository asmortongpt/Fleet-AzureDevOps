import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Car, Briefcase, Coffee, SplitHorizontal, CurrencyDollar, Check, X, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { usePersonalUsePolicies, useMarkTrip, type TripUsageData, type Policy } from '@/hooks/usePersonalUseQueries'
import { cn } from '@/lib/utils'

export interface TripMarkerProps {
  tripId?: string
  initialUsageType?: 'business' | 'personal' | 'mixed'
  initialBusinessPercentage?: number
  miles?: number
  onSave?: (data: TripUsageData) => void
  onCancel?: () => void
  showCostPreview?: boolean
  compact?: boolean
  className?: string
}

export function TripMarker({
  tripId,
  initialUsageType = 'business',
  initialBusinessPercentage = 100,
  miles = 0,
  onSave,
  onCancel,
  showCostPreview = true,
  compact = false,
  className
}: TripMarkerProps) {
  const [usageType, setUsageType] = useState<'business' | 'personal' | 'mixed'>(initialUsageType)
  const [businessPercentage, setBusinessPercentage] = useState(initialBusinessPercentage)
  const [businessPurpose, setBusinessPurpose] = useState('')
  const [personalNotes, setPersonalNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Use TanStack Query for policy data
  const { data: policy, isLoading: policyLoading } = usePersonalUsePolicies()

  // Use TanStack Query mutation for marking trip
  const markTripMutation = useMarkTrip()

  const personalMiles =
    usageType === 'personal'
      ? miles
      : usageType === 'mixed'
      ? miles * ((100 - businessPercentage) / 100)
      : 0

  const businessMiles =
    usageType === 'business'
      ? miles
      : usageType === 'mixed'
      ? miles * (businessPercentage / 100)
      : 0

  const estimatedCost =
    policy?.charge_personal_use && policy.personal_use_rate_per_mile
      ? personalMiles * policy.personal_use_rate_per_mile
      : 0

  const willAutoApprove =
    policy?.auto_approve_under_miles && personalMiles <= policy.auto_approve_under_miles

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (usageType === 'business' || usageType === 'mixed') {
      if (!businessPurpose.trim()) {
        newErrors.businessPurpose = 'Business purpose is required (IRS compliance)'
      } else if (businessPurpose.trim().length < 3) {
        newErrors.businessPurpose = 'Business purpose must be at least 3 characters'
      }
    }

    if (usageType === 'mixed') {
      if (businessPercentage <= 0 || businessPercentage >= 100) {
        newErrors.businessPercentage = 'Business percentage must be between 1-99%'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      toast.error('Please fix validation errors')
      return
    }

    const data: TripUsageData = {
      usage_type: usageType,
      business_percentage: usageType === 'mixed' ? businessPercentage : undefined,
      business_purpose: usageType !== 'personal' ? businessPurpose : undefined,
      personal_notes: usageType !== 'business' ? personalNotes : undefined
    }

    if (tripId) {
      // Use mutation to mark trip
      markTripMutation.mutate(
        { tripId, data },
        {
          onSuccess: () => {
            toast.success('Trip marked successfully')
            onSave?.(data)
          },
          onError: (error: any) => {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to mark trip'
            toast.error(errorMsg)
          }
        }
      )
    } else {
      // If no tripId, just call onSave callback
      onSave?.(data)
    }
  }

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        <RadioGroup
          value={usageType}
          onValueChange={(value: any) => setUsageType(value)}
          className="flex gap-2"
        >
          <div className="flex items-center space-x-1 flex-1">
            <RadioGroupItem value="business" id="business-compact" />
            <Label htmlFor="business-compact" className="text-sm cursor-pointer">
              Business
            </Label>
          </div>
          <div className="flex items-center space-x-1 flex-1">
            <RadioGroupItem value="personal" id="personal-compact" />
            <Label htmlFor="personal-compact" className="text-sm cursor-pointer">
              Personal
            </Label>
          </div>
          <div className="flex items-center space-x-1 flex-1">
            <RadioGroupItem value="mixed" id="mixed-compact" />
            <Label htmlFor="mixed-compact" className="text-sm cursor-pointer">
              Mixed
            </Label>
          </div>
        </RadioGroup>

        {usageType === 'mixed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Business: {businessPercentage}%</Label>
              <Label className="text-xs text-muted-foreground">
                Personal: {100 - businessPercentage}%
              </Label>
            </div>
            <Slider
              value={[businessPercentage]}
              onValueChange={([value]) => setBusinessPercentage(value)}
              min={10}
              max={90}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {showCostPreview && estimatedCost > 0 && (
          <div className="text-sm text-muted-foreground">
            Est. cost: ${estimatedCost.toFixed(2)}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={markTripMutation.isPending} size="sm" className="flex-1">
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm" disabled={markTripMutation.isPending}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Mark Trip Usage
        </CardTitle>
        <CardDescription>
          Classify this trip as business, personal, or mixed use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Type Selection */}
        <div className="space-y-3">
          <Label>Trip Type</Label>
          <RadioGroup
            value={usageType}
            onValueChange={(value: any) => setUsageType(value)}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem
                value="business"
                id="business"
                className="peer sr-only"
              />
              <Label
                htmlFor="business"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Briefcase className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Business</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="personal"
                id="personal"
                className="peer sr-only"
              />
              <Label
                htmlFor="personal"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Coffee className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Personal</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="mixed"
                id="mixed"
                className="peer sr-only"
              />
              <Label
                htmlFor="mixed"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <SplitHorizontal className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Mixed</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Mixed Trip Percentage Slider */}
        {usageType === 'mixed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Business/Personal Split</Label>
              <div className="text-sm text-muted-foreground">
                {businessPercentage}% / {100 - businessPercentage}%
              </div>
            </div>
            <Slider
              value={[businessPercentage]}
              onValueChange={([value]) => setBusinessPercentage(value)}
              min={10}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {businessMiles.toFixed(1)} mi business
              </span>
              <span>
                {personalMiles.toFixed(1)} mi personal
              </span>
            </div>
            {errors.businessPercentage && (
              <p className="text-sm text-destructive">{errors.businessPercentage}</p>
            )}
          </div>
        )}

        {/* Business Purpose */}
        {(usageType === 'business' || usageType === 'mixed') && (
          <div className="space-y-2">
            <Label htmlFor="business-purpose">
              Business Purpose <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="business-purpose"
              placeholder="e.g., Client meeting, site visit, vendor pickup..."
              value={businessPurpose}
              onChange={(e) => setBusinessPurpose(e.target.value)}
              className={errors.businessPurpose ? 'border-destructive' : ''}
              rows={2}
            />
            {errors.businessPurpose && (
              <p className="text-sm text-destructive">{errors.businessPurpose}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Required for IRS compliance and audit trails
            </p>
          </div>
        )}

        {/* Personal Notes */}
        {(usageType === 'personal' || usageType === 'mixed') && (
          <div className="space-y-2">
            <Label htmlFor="personal-notes">Personal Notes (Optional)</Label>
            <Textarea
              id="personal-notes"
              placeholder="e.g., Grocery shopping, doctor appointment..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Cost Preview */}
        {showCostPreview && miles > 0 && (
          <Alert>
            <CurrencyDollar className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trip Distance:</span>
                  <span className="text-sm">{miles.toFixed(1)} miles</span>
                </div>
                {personalMiles > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Personal Miles:</span>
                      <span className="text-sm">{personalMiles.toFixed(1)} miles</span>
                    </div>
                    {policy?.charge_personal_use && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Rate:</span>
                          <span className="text-sm">
                            ${policy.personal_use_rate_per_mile?.toFixed(2)}/mile
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-semibold pt-2 border-t">
                          <span className="text-sm">Estimated Cost:</span>
                          <span className="text-sm">${estimatedCost.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {willAutoApprove && (
                  <Badge variant="secondary" className="mt-2">
                    <Check className="w-3 h-3 mr-1" />
                    Will be auto-approved
                  </Badge>
                )}
                {policy?.require_approval && !willAutoApprove && (
                  <Badge variant="outline" className="mt-2">
                    <Info className="w-3 h-3 mr-1" />
                    Requires manager approval
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={markTripMutation.isPending} className="flex-1">
            {markTripMutation.isPending ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Mark Trip
              </>
            )}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" disabled={markTripMutation.isPending}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
