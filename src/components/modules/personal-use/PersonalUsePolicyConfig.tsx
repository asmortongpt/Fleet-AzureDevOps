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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ApprovalWorkflow,
  CreatePolicyRequest,
  NotificationSettings
} from '@/types/trip-usage'
import logger from '@/utils/logger';

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
  notification_settings: NotificationSettings
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
  const token = localStorage.getItem('token') || '';
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const apiMutation = async (url: string, method: string, data?: any) => {
  const token = localStorage.getItem('token') || '';
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
  currentTheme: _currentTheme
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
    gcTime: Infinity
  })

  // Handle errors with useEffect
  React.useEffect(() => {
    if (error) {
      logger.error('Failed to fetch policy:', error)
    }
  }, [error])

  const existingPolicy = policyData?.data || null

  React.useEffect(() => {
    if (existingPolicy && existingPolicy.id) {
      setFormData({
        allow_personal_use: existingPolicy.allow_personal_use,
        require_approval: existingPolicy.require_approval,
        max_personal_miles_per_month: existingPolicy.max_personal_miles_per_month ?? undefined,
        max_personal_miles_per_year: existingPolicy.max_personal_miles_per_year ?? undefined,
        charge_personal_use: existingPolicy.charge_personal_use,
        personal_use_rate_per_mile: existingPolicy.personal_use_rate_per_mile ?? undefined,
        approval_workflow: existingPolicy.approval_workflow,
        auto_approve_under_miles: existingPolicy.auto_approve_under_miles ?? undefined,
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
      const tenantId = user.tenant_id || '';

      const payload: CreatePolicyRequest = {
        allow_personal_use: formData.allow_personal_use,
        require_approval: formData.require_approval,
        max_personal_miles_per_month: formData.max_personal_miles_per_month ?? undefined,
        max_personal_miles_per_year: formData.max_personal_miles_per_year ?? undefined,
        charge_personal_use: formData.charge_personal_use,
        personal_use_rate_per_mile: formData.personal_use_rate_per_mile ?? undefined,
        reporting_required: true,
        approval_workflow: formData.approval_workflow,
        notification_settings: formData.notification_settings,
        auto_approve_under_miles: formData.auto_approve_under_miles ?? undefined,
        effective_date: formData.effective_date
      };

      return apiMutation(`/api/personal-use-policies/${tenantId}`, 'PUT', payload)
    },
    onSuccess: () => {
      toast.success('Policy saved successfully')
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['personal-use-policies'] })
    },
    onError: (err: any) => {
      logger.error('Failed to save policy:', err)
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
                    updateFormData({ allow_personal_use: checked === true })
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
                    updateFormData({ require_approval: checked === true })
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
                        Manager Approval - Direct manager ap
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}