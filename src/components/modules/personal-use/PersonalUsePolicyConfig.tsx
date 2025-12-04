import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Info,
  FloppyDisk,
  ArrowsClockwise,
  CurrencyDollar,
  Bell,
  Eye,
  CheckCircle,
  Warning
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  PersonalUsePolicy,
  ApprovalWorkflow,
  CreatePolicyRequest
} from '../../types/trip-usage'

interface PersonalUsePolicyConfigProps {
  currentTheme?: string
}

interface PolicyFormData {
  allow_personal_use: boolean
  require_approval: boolean
  max_personal_miles_per_month: number | null
  max_personal_miles_per_year: number | null
  charge_personal_use: boolean
  personal_use_rate_per_mile: number | null
  approval_workflow: ApprovalWorkflow
  auto_approve_under_miles: number | null
  notification_settings: {
    notify_at_80_percent: boolean
    notify_at_95_percent: boolean
    notify_on_charge: boolean
    notify_on_rejection: boolean
  }
  effective_date: string
}

const IRS_RATE_2025 = 0.67 // Federal IRS rate per mile for 2025

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Alert variant="destructive" className="m-4">
    <Warning className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <ArrowsClockwise className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)

const apiClient = async (url: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const apiMutation = async (url: string, method: string, data?: any) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to perform action')
  }
  return response.json()
}

export const PersonalUsePolicyConfig: React.FC<PersonalUsePolicyConfigProps> = ({
  currentTheme
}) => {
  const queryClient = useQueryClient()
  const [showPreview, setShowPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState<PolicyFormData>({
    allow_personal_use: true,
    require_approval: true,
    max_personal_miles_per_month: 200,
    max_personal_miles_per_year: 1000,
    charge_personal_use: false,
    personal_use_rate_per_mile: 0.25,
    approval_workflow: ApprovalWorkflow.MANAGER,
    auto_approve_under_miles: 50,
    notification_settings: {
      notify_at_80_percent: true,
      notify_at_95_percent: true,
      notify_on_charge: true,
      notify_on_rejection: true
    },
    effective_date: new Date().toISOString().split('T')[0]
  })

  const { data: policyData, isLoading: loading, error } = useQuery({
    queryKey: ['personal-use-policies'],
    queryFn: () => apiClient('/api/personal-use-policies'),
    staleTime: Infinity,
    onError: (err: any) => {
      console.error('Failed to fetch policy:', err)
    }
  })

  const existingPolicy = policyData?.data || null

  React.useEffect(() => {
    if (existingPolicy && existingPolicy.id) {
      setFormData({
        allow_personal_use: existingPolicy.allow_personal_use,
        require_approval: existingPolicy.require_approval,
        max_personal_miles_per_month: existingPolicy.max_personal_miles_per_month,
        max_personal_miles_per_year: existingPolicy.max_personal_miles_per_year,
        charge_personal_use: existingPolicy.charge_personal_use,
        personal_use_rate_per_mile: existingPolicy.personal_use_rate_per_mile,
        approval_workflow: existingPolicy.approval_workflow,
        auto_approve_under_miles: existingPolicy.auto_approve_under_miles,
        notification_settings: existingPolicy.notification_settings || {
          notify_at_80_percent: true,
          notify_at_95_percent: true,
          notify_on_charge: true,
          notify_on_rejection: true
        },
        effective_date: new Date(existingPolicy.effective_date).toISOString().split('T')[0]
      })
    }
  }, [existingPolicy])

  const validateForm = (): string | null => {
    // Rate validation if charging enabled
    if (formData.charge_personal_use) {
      if (!formData.personal_use_rate_per_mile || formData.personal_use_rate_per_mile <= 0) {
        return 'Rate per mile is required when charging is enabled'
      }
      if (formData.personal_use_rate_per_mile > IRS_RATE_2025) {
        return `Rate cannot exceed federal IRS rate ($${IRS_RATE_2025}/mile)`
      }
    }

    // Limits validation
    if (formData.max_personal_miles_per_month && formData.max_personal_miles_per_month <= 0) {
      return 'Monthly limit must be greater than 0'
    }
    if (formData.max_personal_miles_per_year && formData.max_personal_miles_per_year <= 0) {
      return 'Annual limit must be greater than 0'
    }

    // Yearly limit should be >= monthly limit × 12
    if (formData.max_personal_miles_per_month && formData.max_personal_miles_per_year) {
      if (formData.max_personal_miles_per_year < formData.max_personal_miles_per_month) {
        return 'Annual limit should be greater than monthly limit'
      }
    }

    // Auto-approve threshold validation
    if (formData.auto_approve_under_miles) {
      if (formData.max_personal_miles_per_month &&
          formData.auto_approve_under_miles >= formData.max_personal_miles_per_month) {
        return 'Auto-approve threshold must be less than monthly limit'
      }
    }

    // Effective date validation
    const effectiveDate = new Date(formData.effective_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (effectiveDate < today) {
      return 'Effective date cannot be in the past'
    }

    return null
  }

  const { mutate: savePolicy, isPending: saving } = useMutation({
    mutationFn: async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const tenantId = user.tenant_id

      const payload: CreatePolicyRequest = {
        allow_personal_use: formData.allow_personal_use,
        require_approval: formData.require_approval,
        max_personal_miles_per_month: formData.max_personal_miles_per_month,
        max_personal_miles_per_year: formData.max_personal_miles_per_year,
        charge_personal_use: formData.charge_personal_use,
        personal_use_rate_per_mile: formData.personal_use_rate_per_mile,
        reporting_required: true,
        approval_workflow: formData.approval_workflow,
        notification_settings: formData.notification_settings,
        auto_approve_under_miles: formData.auto_approve_under_miles,
        effective_date: formData.effective_date
      }

      return apiMutation(`/api/personal-use-policies/${tenantId}`, 'PUT', payload)
    },
    onSuccess: () => {
      toast.success('Policy saved successfully')
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['personal-use-policies'] })
    },
    onError: (err: any) => {
      console.error('Failed to save policy:', err)
      toast.error(err.message || 'Failed to save policy')
    }
  })

  const handleSave = () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to save this policy? This will affect all drivers in your organization.'
    )
    if (!confirmed) return

    savePolicy()
  }

  const handleResetToDefaults = () => {
    const confirmed = window.confirm('Reset all settings to default values?')
    if (!confirmed) return

    setFormData({
      allow_personal_use: true,
      require_approval: true,
      max_personal_miles_per_month: 200,
      max_personal_miles_per_year: 1000,
      charge_personal_use: false,
      personal_use_rate_per_mile: 0.25,
      approval_workflow: ApprovalWorkflow.MANAGER,
      auto_approve_under_miles: 50,
      notification_settings: {
        notify_at_80_percent: true,
        notify_at_95_percent: true,
        notify_on_charge: true,
        notify_on_rejection: true
      },
      effective_date: new Date().toISOString().split('T')[0]
    })

    setHasChanges(true)
    toast.info('Settings reset to defaults')
  }

  const updateFormData = (updates: Partial<PolicyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const calculateExampleCharge = (): string => {
    if (!formData.charge_personal_use || !formData.personal_use_rate_per_mile) {
      return '$0.00'
    }

    const exampleMiles = 100
    const charge = exampleMiles * formData.personal_use_rate_per_mile
    return `$${charge.toFixed(2)} (for ${exampleMiles} miles)`
  }

  if (loading) return <LoadingSpinner />
  if (error && error instanceof Error && error.message !== 'Failed to fetch') return <ErrorDisplay error={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ['personal-use-policies'] })} />

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Personal Use Policy Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure organization-wide personal vehicle use policies and limits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            <ArrowsClockwise className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <FloppyDisk className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Policy'}
          </Button>
        </div>
      </div>

      {/* Current Policy Info */}
      {existingPolicy && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Policy:</strong> Effective since{' '}
            {new Date(existingPolicy.effective_date).toLocaleDateString()}
            {hasChanges && ' • You have unsaved changes'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="limits">Usage Limits</TabsTrigger>
          <TabsTrigger value="charging">Charging</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Use Policy</CardTitle>
              <CardDescription>
                Core settings for allowing and managing personal vehicle use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allow Personal Use */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_personal_use" className="text-base">
                    Allow Personal Use
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable drivers to use company vehicles for personal trips
                  </p>
                </div>
                <Switch
                  id="allow_personal_use"
                  checked={formData.allow_personal_use}
                  onCheckedChange={(checked) =>
                    updateFormData({ allow_personal_use: checked })
                  }
                />
              </div>

              <Separator />

              {/* Require Approval */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require_approval" className="text-base">
                    Require Approval
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Personal use trips must be approved by manager/admin
                  </p>
                </div>
                <Switch
                  id="require_approval"
                  checked={formData.require_approval}
                  onCheckedChange={(checked) =>
                    updateFormData({ require_approval: checked })
                  }
                  disabled={!formData.allow_personal_use}
                />
              </div>

              {/* Approval Workflow */}
              {formData.require_approval && (
                <div className="space-y-3 pl-6 border-l-2">
                  <Label className="text-base">Approval Workflow</Label>
                  <RadioGroup
                    value={formData.approval_workflow}
                    onValueChange={(value: ApprovalWorkflow) =>
                      updateFormData({ approval_workflow: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={ApprovalWorkflow.MANAGER} id="manager" />
                      <Label htmlFor="manager" className="font-normal cursor-pointer">
                        Manager Approval - Direct manager approves personal use
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={ApprovalWorkflow.FLEET_ADMIN} id="fleet_admin" />
                      <Label htmlFor="fleet_admin" className="font-normal cursor-pointer">
                        Fleet Admin Approval - Fleet administrator approves all requests
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={ApprovalWorkflow.BOTH} id="both" />
                      <Label htmlFor="both" className="font-normal cursor-pointer">
                        Both - Requires both manager and fleet admin approval
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Auto-Approve Threshold */}
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="auto_approve">
                      Auto-Approve Threshold (optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="auto_approve"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.auto_approve_under_miles || ''}
                        onChange={(e) =>
                          updateFormData({
                            auto_approve_under_miles: e.target.value
                              ? parseInt(e.target.value)
                              : null
                          })
                        }
                        placeholder="e.g., 50"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">miles</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trips under this mileage will be automatically approved
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Effective Date */}
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => updateFormData({ effective_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-64"
                />
                <p className="text-xs text-muted-foreground">
                  Policy will take effect on this date
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
              <CardDescription>
                Set monthly and annual personal use mileage limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly Limit */}
              <div className="space-y-2">
                <Label htmlFor="monthly_limit">
                  Maximum Personal Miles Per Month
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="monthly_limit"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.max_personal_miles_per_month || ''}
                    onChange={(e) =>
                      updateFormData({
                        max_personal_miles_per_month: e.target.value
                          ? parseInt(e.target.value)
                          : null
                      })
                    }
                    placeholder="e.g., 200"
                    className="w-32"
                    disabled={!formData.allow_personal_use}
                  />
                  <span className="text-sm text-muted-foreground">miles</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank for no monthly limit
                </p>
              </div>

              <Separator />

              {/* Annual Limit */}
              <div className="space-y-2">
                <Label htmlFor="annual_limit">
                  Maximum Personal Miles Per Year
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="annual_limit"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.max_personal_miles_per_year || ''}
                    onChange={(e) =>
                      updateFormData({
                        max_personal_miles_per_year: e.target.value
                          ? parseInt(e.target.value)
                          : null
                      })
                    }
                    placeholder="e.g., 1000"
                    className="w-32"
                    disabled={!formData.allow_personal_use}
                  />
                  <span className="text-sm text-muted-foreground">miles</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank for no annual limit
                </p>
              </div>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Drivers will be warned when they reach 80% of their limit and blocked at 100%.
                  {formData.max_personal_miles_per_month && formData.max_personal_miles_per_year && (
                    <div className="mt-2 text-sm">
                      <strong>Current Settings:</strong>
                      <br />• Monthly: {formData.max_personal_miles_per_month} miles
                      <br />• Annual: {formData.max_personal_miles_per_year} miles
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charging Tab */}
        <TabsContent value="charging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar className="w-5 h-5" />
                Personal Use Charging
              </CardTitle>
              <CardDescription>
                Configure charges for personal vehicle use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Charge Personal Use */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="charge_personal_use" className="text-base">
                    Charge for Personal Use
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Bill drivers for personal vehicle use
                  </p>
                </div>
                <Switch
                  id="charge_personal_use"
                  checked={formData.charge_personal_use}
                  onCheckedChange={(checked) =>
                    updateFormData({ charge_personal_use: checked })
                  }
                  disabled={!formData.allow_personal_use}
                />
              </div>

              {/* Rate Per Mile */}
              {formData.charge_personal_use && (
                <div className="space-y-4 pl-6 border-l-2">
                  <div className="space-y-2">
                    <Label htmlFor="rate_per_mile">Rate Per Mile *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">$</span>
                      <Input
                        id="rate_per_mile"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.personal_use_rate_per_mile || ''}
                        onChange={(e) =>
                          updateFormData({
                            personal_use_rate_per_mile: e.target.value
                              ? parseFloat(e.target.value)
                              : null
                          })
                        }
                        placeholder="0.25"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">per mile</span>
                    </div>
                  </div>

                  {/* IRS Rate Reference */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Federal IRS Rate (2025):</strong> ${IRS_RATE_2025}/mile
                      <br />
                      Your rate cannot exceed the federal rate.
                    </AlertDescription>
                  </Alert>

                  {/* Example Calculation */}
                  <div className="p-4 bg-accent rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Example Calculation</h4>
                    <p className="text-sm text-muted-foreground">
                      For 100 personal miles: {calculateExampleCharge()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when drivers and managers receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Driver Notifications */}
              <div className="space-y-4">
                <h4 className="font-semibold">Driver Notifications</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify_80"
                    checked={formData.notification_settings.notify_at_80_percent}
                    onCheckedChange={(checked) =>
                      updateFormData({
                        notification_settings: {
                          ...formData.notification_settings,
                          notify_at_80_percent: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="notify_80" className="font-normal cursor-pointer">
                    Notify at 80% of limit
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify_95"
                    checked={formData.notification_settings.notify_at_95_percent}
                    onCheckedChange={(checked) =>
                      updateFormData({
                        notification_settings: {
                          ...formData.notification_settings,
                          notify_at_95_percent: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="notify_95" className="font-normal cursor-pointer">
                    Notify at 95% of limit (critical warning)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify_charge"
                    checked={formData.notification_settings.notify_on_charge}
                    onCheckedChange={(checked) =>
                      updateFormData({
                        notification_settings: {
                          ...formData.notification_settings,
                          notify_on_charge: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="notify_charge" className="font-normal cursor-pointer">
                    Notify when charges are generated
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify_rejection"
                    checked={formData.notification_settings.notify_on_rejection}
                    onCheckedChange={(checked) =>
                      updateFormData({
                        notification_settings: {
                          ...formData.notification_settings,
                          notify_on_rejection: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="notify_rejection" className="font-normal cursor-pointer">
                    Notify when trips are rejected
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Additional policy configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Federal Compliance:</strong> All business trips require a documented
                  business purpose per IRS regulations. This is enforced automatically.
                </AlertDescription>
              </Alert>

              <Alert>
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  <strong>Policy Changes:</strong> Changes to this policy will take effect
                  immediately for all new trips. Existing pending trips will follow the
                  previous policy rules.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Policy Preview
            </CardTitle>
            <CardDescription>
              How this policy will appear to drivers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                {formData.allow_personal_use ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  Personal use is {formData.allow_personal_use ? 'allowed' : 'not allowed'}
                </span>
              </div>

              {formData.allow_personal_use && (
                <>
                  {formData.require_approval && (
                    <div className="text-sm text-muted-foreground">
                      • Approval required by {formData.approval_workflow.replace('_', ' ')}
                    </div>
                  )}

                  {formData.max_personal_miles_per_month && (
                    <div className="text-sm text-muted-foreground">
                      • Monthly limit: {formData.max_personal_miles_per_month} miles
                    </div>
                  )}

                  {formData.max_personal_miles_per_year && (
                    <div className="text-sm text-muted-foreground">
                      • Annual limit: {formData.max_personal_miles_per_year} miles
                    </div>
                  )}

                  {formData.charge_personal_use && (
                    <div className="text-sm text-muted-foreground">
                      • Charges: ${formData.personal_use_rate_per_mile}/mile
                    </div>
                  )}

                  {formData.auto_approve_under_miles && (
                    <div className="text-sm text-muted-foreground">
                      • Auto-approved under {formData.auto_approve_under_miles} miles
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Changes Warning */}
      {hasChanges && (
        <Alert>
          <Warning className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Policy" to apply these changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default PersonalUsePolicyConfig
