/**
 * InvestigationDialog - Comprehensive incident investigation form
 *
 * Features:
 * - Root cause analysis workflow
 * - Contributing factors tracking
 * - Corrective and preventive action planning
 * - Training recommendations
 * - Follow-up scheduling
 * - Investigation status management
 *
 * @example
 * ```tsx
 * <InvestigationDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   incident={selectedIncident}
 *   tenantId="tenant-123"
 *   investigatorId="user-456"
 *   onSuccess={() => refetch()}
 * />
 * ```
 */

import { X, Plus, Trash2, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useIncidentMutations,
  type Incident,
  type CreateInvestigationInput,
} from '@/hooks/use-reactive-incident-data'


// ============================================================================
// TYPES
// ============================================================================

export interface InvestigationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: Incident
  tenantId: string
  investigatorId: string
  onSuccess?: () => void
}

interface FormValues {
  investigation_date: string
  findings: string
  root_cause_analysis: string
  contributing_factors: string[]
  corrective_actions: string[]
  preventive_measures: string[]
  training_recommendations: string[]
  follow_up_required: boolean
  follow_up_date: string
  follow_up_notes: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvestigationDialog({
  open,
  onOpenChange,
  incident,
  tenantId,
  investigatorId,
  onSuccess,
}: InvestigationDialogProps) {
  const { createInvestigation } = useIncidentMutations()

  // ========================================================================
  // STATE
  // ========================================================================

  const now = new Date()
  const [values, setValues] = useState<FormValues>({
    investigation_date: now.toISOString().split('T')[0],
    findings: '',
    root_cause_analysis: '',
    contributing_factors: [],
    corrective_actions: [],
    preventive_measures: [],
    training_recommendations: [],
    follow_up_required: false,
    follow_up_date: '',
    follow_up_notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Temporary input states for array fields
  const [newContributingFactor, setNewContributingFactor] = useState('')
  const [newCorrectiveAction, setNewCorrectiveAction] = useState('')
  const [newPreventiveMeasure, setNewPreventiveMeasure] = useState('')
  const [newTrainingRecommendation, setNewTrainingRecommendation] = useState('')

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleChange = useCallback(
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors]
  )

  const handleCheckboxChange = useCallback(
    (field: keyof FormValues) => (checked: boolean) => {
      setValues((prev) => ({ ...prev, [field]: checked }))
    },
    []
  )

  // Array field handlers
  const addArrayItem = useCallback((field: keyof FormValues, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return

    setValues((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()],
    }))
    setter('')
  }, [])

  const removeArrayItem = useCallback((field: keyof FormValues, index: number) => {
    setValues((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }))
  }, [])

  // ========================================================================
  // VALIDATION
  // ========================================================================

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!values.investigation_date) {
      newErrors.investigation_date = 'Investigation date is required'
    }

    if (!values.findings.trim()) {
      newErrors.findings = 'Findings are required'
    } else if (values.findings.length < 50) {
      newErrors.findings = 'Findings must be at least 50 characters'
    }

    if (!values.root_cause_analysis.trim()) {
      newErrors.root_cause_analysis = 'Root cause analysis is required'
    } else if (values.root_cause_analysis.length < 30) {
      newErrors.root_cause_analysis = 'Root cause analysis must be at least 30 characters'
    }

    // Must have at least one corrective action
    if (values.corrective_actions.length === 0) {
      newErrors.corrective_actions = 'At least one corrective action is required'
    }

    // Must have at least one preventive measure
    if (values.preventive_measures.length === 0) {
      newErrors.preventive_measures = 'At least one preventive measure is required'
    }

    // Follow-up validation
    if (values.follow_up_required) {
      if (!values.follow_up_date) {
        newErrors.follow_up_date = 'Follow-up date is required'
      } else {
        const followUpDate = new Date(values.follow_up_date)
        const investigationDate = new Date(values.investigation_date)
        if (followUpDate <= investigationDate) {
          newErrors.follow_up_date = 'Follow-up date must be after investigation date'
        }
      }

      if (!values.follow_up_notes.trim()) {
        newErrors.follow_up_notes = 'Follow-up notes are required when follow-up is scheduled'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values])

  // ========================================================================
  // SUBMIT
  // ========================================================================

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) {
        toast.error('Please fix the errors before submitting')
        return
      }

      setIsSubmitting(true)

      try {
        const investigationData: CreateInvestigationInput = {
          incident_id: incident.id,
          tenant_id: tenantId,
          investigator_id: investigatorId,
          investigation_date: values.investigation_date,
          findings: values.findings,
          root_cause_analysis: values.root_cause_analysis,
          contributing_factors:
            values.contributing_factors.length > 0 ? values.contributing_factors : undefined,
          corrective_actions: values.corrective_actions,
          preventive_measures: values.preventive_measures,
          training_recommendations:
            values.training_recommendations.length > 0 ? values.training_recommendations : undefined,
          follow_up_required: values.follow_up_required,
          follow_up_date: values.follow_up_required ? values.follow_up_date : undefined,
        }

        await createInvestigation.mutateAsync(investigationData)

        toast.success('Investigation created successfully', {
          description: 'The incident investigation has been documented.',
        })

        handleOpenChange(false)
        onSuccess?.()
      } catch (error) {
        toast.error('Failed to create investigation', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [validate, incident.id, tenantId, investigatorId, values, createInvestigation, onSuccess]
  )

  // ========================================================================
  // DIALOG CLOSE
  // ========================================================================

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Reset form on close
        setValues({
          investigation_date: new Date().toISOString().split('T')[0],
          findings: '',
          root_cause_analysis: '',
          contributing_factors: [],
          corrective_actions: [],
          preventive_measures: [],
          training_recommendations: [],
          follow_up_required: false,
          follow_up_date: '',
          follow_up_notes: '',
        })
        setErrors({})
        setNewContributingFactor('')
        setNewCorrectiveAction('')
        setNewPreventiveMeasure('')
        setNewTrainingRecommendation('')
      }
      onOpenChange(open)
    },
    [onOpenChange]
  )

  // ========================================================================
  // MEMOIZED VALUES
  // ========================================================================

  const isFormValid = useMemo(() => {
    return (
      values.findings.length >= 50 &&
      values.root_cause_analysis.length >= 30 &&
      values.corrective_actions.length > 0 &&
      values.preventive_measures.length > 0 &&
      (!values.follow_up_required ||
        (values.follow_up_date && values.follow_up_notes.trim()))
    )
  }, [values])

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <DialogTitle>Incident Investigation</DialogTitle>
              <DialogDescription>
                Document findings, root cause analysis, and corrective actions for incident{' '}
                <Badge variant="outline" className="ml-1">
                  {incident.incident_number}
                </Badge>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Incident Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Incident Summary
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>{' '}
                {new Date(incident.incident_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{' '}
                {incident.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div>
                <span className="text-muted-foreground">Severity:</span>{' '}
                <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {incident.severity}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span> {incident.location_city},{' '}
                {incident.location_state}
              </div>
            </div>
          </div>

          {/* Investigation Date */}
          <div className="space-y-2">
            <Label htmlFor="investigation_date" className="required">
              Investigation Date
            </Label>
            <Input
              id="investigation_date"
              type="date"
              value={values.investigation_date}
              onChange={handleChange('investigation_date')}
              max={new Date().toISOString().split('T')[0]}
              className={errors.investigation_date ? 'border-red-500' : ''}
            />
            {errors.investigation_date && (
              <p className="text-sm text-red-500">{errors.investigation_date}</p>
            )}
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <Label htmlFor="findings" className="required">
              Investigation Findings
            </Label>
            <Textarea
              id="findings"
              value={values.findings}
              onChange={handleChange('findings')}
              placeholder="Document what happened, who was involved, sequence of events, and any immediate observations..."
              rows={6}
              className={errors.findings ? 'border-red-500' : ''}
            />
            <div className="flex items-center justify-between text-sm">
              {errors.findings ? (
                <p className="text-red-500">{errors.findings}</p>
              ) : (
                <p className="text-muted-foreground">
                  Minimum 50 characters ({values.findings.length}/50)
                </p>
              )}
            </div>
          </div>

          {/* Root Cause Analysis */}
          <div className="space-y-2">
            <Label htmlFor="root_cause_analysis" className="required">
              Root Cause Analysis
            </Label>
            <Textarea
              id="root_cause_analysis"
              value={values.root_cause_analysis}
              onChange={handleChange('root_cause_analysis')}
              placeholder="Identify the underlying cause(s) of the incident. Why did it happen? What systemic issues contributed?"
              rows={5}
              className={errors.root_cause_analysis ? 'border-red-500' : ''}
            />
            <div className="flex items-center justify-between text-sm">
              {errors.root_cause_analysis ? (
                <p className="text-red-500">{errors.root_cause_analysis}</p>
              ) : (
                <p className="text-muted-foreground">
                  Minimum 30 characters ({values.root_cause_analysis.length}/30)
                </p>
              )}
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="space-y-2">
            <Label htmlFor="contributing_factors">Contributing Factors (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="contributing_factors"
                value={newContributingFactor}
                onChange={(e) => setNewContributingFactor(e.target.value)}
                placeholder="Add a contributing factor (e.g., poor visibility, road conditions)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('contributing_factors', newContributingFactor, setNewContributingFactor)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addArrayItem('contributing_factors', newContributingFactor, setNewContributingFactor)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {values.contributing_factors.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {values.contributing_factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                  >
                    <span>{factor}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeArrayItem('contributing_factors', index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Corrective Actions */}
          <div className="space-y-2">
            <Label htmlFor="corrective_actions" className="required">
              Corrective Actions
            </Label>
            <div className="flex gap-2">
              <Input
                id="corrective_actions"
                value={newCorrectiveAction}
                onChange={(e) => setNewCorrectiveAction(e.target.value)}
                placeholder="Add a corrective action to address this specific incident"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('corrective_actions', newCorrectiveAction, setNewCorrectiveAction)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addArrayItem('corrective_actions', newCorrectiveAction, setNewCorrectiveAction)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {values.corrective_actions.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {values.corrective_actions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{action}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeArrayItem('corrective_actions', index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors.corrective_actions && (
              <p className="text-sm text-red-500">{errors.corrective_actions}</p>
            )}
          </div>

          {/* Preventive Measures */}
          <div className="space-y-2">
            <Label htmlFor="preventive_measures" className="required">
              Preventive Measures
            </Label>
            <div className="flex gap-2">
              <Input
                id="preventive_measures"
                value={newPreventiveMeasure}
                onChange={(e) => setNewPreventiveMeasure(e.target.value)}
                placeholder="Add a preventive measure to avoid similar incidents in the future"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem('preventive_measures', newPreventiveMeasure, setNewPreventiveMeasure)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addArrayItem('preventive_measures', newPreventiveMeasure, setNewPreventiveMeasure)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {values.preventive_measures.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {values.preventive_measures.map((measure, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      <span>{measure}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeArrayItem('preventive_measures', index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors.preventive_measures && (
              <p className="text-sm text-red-500">{errors.preventive_measures}</p>
            )}
          </div>

          {/* Training Recommendations */}
          <div className="space-y-2">
            <Label htmlFor="training_recommendations">Training Recommendations (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="training_recommendations"
                value={newTrainingRecommendation}
                onChange={(e) => setNewTrainingRecommendation(e.target.value)}
                placeholder="Add a training recommendation (e.g., defensive driving course)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addArrayItem(
                      'training_recommendations',
                      newTrainingRecommendation,
                      setNewTrainingRecommendation
                    )
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addArrayItem(
                    'training_recommendations',
                    newTrainingRecommendation,
                    setNewTrainingRecommendation
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {values.training_recommendations.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {values.training_recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                  >
                    <span>{recommendation}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeArrayItem('training_recommendations', index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="follow_up_required"
                checked={values.follow_up_required}
                onCheckedChange={handleCheckboxChange('follow_up_required')}
              />
              <Label htmlFor="follow_up_required" className="cursor-pointer font-medium">
                Follow-up Required
              </Label>
            </div>

            {values.follow_up_required && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="follow_up_date" className="required">
                    Follow-up Date
                  </Label>
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-3" />
                    <Input
                      id="follow_up_date"
                      type="date"
                      value={values.follow_up_date}
                      onChange={handleChange('follow_up_date')}
                      min={
                        new Date(new Date(values.investigation_date).getTime() + 86400000)
                          .toISOString()
                          .split('T')[0]
                      }
                      className={errors.follow_up_date ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.follow_up_date && (
                    <p className="text-sm text-red-500">{errors.follow_up_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follow_up_notes" className="required">
                    Follow-up Notes
                  </Label>
                  <Textarea
                    id="follow_up_notes"
                    value={values.follow_up_notes}
                    onChange={handleChange('follow_up_notes')}
                    placeholder="Describe what needs to be followed up on and why..."
                    rows={3}
                    className={errors.follow_up_notes ? 'border-red-500' : ''}
                  />
                  {errors.follow_up_notes && (
                    <p className="text-sm text-red-500">{errors.follow_up_notes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Creating Investigation...' : 'Create Investigation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
