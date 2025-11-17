/**
 * SmartForm Component
 *
 * Regular form enhanced with AI features:
 * - Real-time validation
 * - Smart suggestions
 * - Anomaly detection
 * - Auto-complete
 */

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Lightbulb, TrendingUp, Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiClient } from '../../lib/api'

interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required?: boolean
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

interface SmartFormProps {
  entityType: string
  fields: FieldConfig[]
  initialData?: Record<string, any>
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
}

interface ValidationResult {
  isValid: boolean
  confidence: number
  warnings: Array<{
    field: string
    message: string
    severity: 'info' | 'warning' | 'error'
    suggestedValue?: any
  }>
  anomalies: Array<{
    type: string
    description: string
    expectedRange?: [number, number]
    actualValue: number
  }>
  suggestions: Array<{
    field: string
    value: any
    reason: string
    confidence: number
  }>
}

export function SmartForm({
  entityType,
  fields,
  initialData = {},
  onSubmit,
  onCancel
}: SmartFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        validateForm()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData])

  const validateForm = async () => {
    setIsValidating(true)
    try {
      const response = await apiClient.post('/api/ai/validate', {
        entityType,
        data: formData
      })
      setValidation(response.data)
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBlur = (field: string) => {
    setTouched(prev => new Set([...prev, field]))
  }

  const handleSuggestionApply = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setTouched(prev => new Set([...prev, field]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched(new Set(fields.map(f => f.name)))

    // Final validation
    await validateForm()

    // Check if there are blocking errors
    if (validation?.warnings.some(w => w.severity === 'error')) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldWarning = (fieldName: string) => {
    return validation?.warnings.find(w => w.field === fieldName && touched.has(fieldName))
  }

  const getFieldSuggestion = (fieldName: string) => {
    return validation?.suggestions.find(s => s.field === fieldName && !formData[fieldName])
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-red-600'
    }
    return colors[severity as keyof typeof colors] || 'text-gray-600'
  }

  const getSeverityBgColor = (severity: string) => {
    const colors = {
      info: 'bg-blue-50 border-blue-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200'
    }
    return colors[severity as keyof typeof colors] || 'bg-gray-50'
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Smart {entityType.replace('_', ' ')} Form</span>
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating...</span>
            </div>
          )}
          {validation && !isValidating && (
            <Badge variant={validation.isValid ? 'default' : 'destructive'}>
              {validation.isValid ? 'Valid' : 'Issues Found'} ({Math.round(validation.confidence * 100)}% confidence)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Anomaly Alerts */}
        {validation && validation.anomalies.length > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <p className="font-semibold text-orange-900 mb-2">Anomalies Detected:</p>
              {validation.anomalies.map((anomaly, index) => (
                <div key={index} className="text-sm text-orange-800 mb-1">
                  <strong>{anomaly.type}:</strong> {anomaly.description}
                  {anomaly.expectedRange && (
                    <span className="text-orange-600 ml-2">
                      (Expected: {anomaly.expectedRange[0]} - {anomaly.expectedRange[1]})
                    </span>
                  )}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const warning = getFieldWarning(field.name)
            const suggestion = getFieldSuggestion(field.name)

            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                <div className="relative">
                  {field.type === 'select' ? (
                    <select
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      className="w-full px-3 py-2 border rounded-md"
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className={warning ? `border-${warning.severity === 'error' ? 'red' : 'yellow'}-500` : ''}
                    />
                  )}
                </div>

                {/* Field Warning */}
                {warning && (
                  <div className={`flex items-start gap-2 p-2 rounded border ${getSeverityBgColor(warning.severity)}`}>
                    <AlertCircle className={`w-4 h-4 mt-0.5 ${getSeverityColor(warning.severity)}`} />
                    <div className="flex-1 text-sm">
                      <p className={getSeverityColor(warning.severity)}>{warning.message}</p>
                      {warning.suggestedValue && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => handleSuggestionApply(field.name, warning.suggestedValue)}
                        >
                          Use suggested value: {String(warning.suggestedValue)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Smart Suggestion */}
                {suggestion && !warning && (
                  <div className="flex items-start gap-2 p-2 rounded border bg-blue-50 border-blue-200">
                    <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600" />
                    <div className="flex-1 text-sm">
                      <p className="text-blue-900">
                        Suggestion: <strong>{String(suggestion.value)}</strong>
                      </p>
                      <p className="text-blue-700 text-xs">{suggestion.reason}</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-blue-600"
                        onClick={() => handleSuggestionApply(field.name, suggestion.value)}
                      >
                        Apply suggestion ({Math.round(suggestion.confidence * 100)}% confidence)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* General Warnings */}
          {validation && validation.warnings.filter(w => !w.field).map((warning, index) => (
            <Alert key={index} className={getSeverityBgColor(warning.severity)}>
              <AlertCircle className={`h-4 w-4 ${getSeverityColor(warning.severity)}`} />
              <AlertDescription className={getSeverityColor(warning.severity)}>
                {warning.message}
              </AlertDescription>
            </Alert>
          ))}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || (validation && !validation.isValid)}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
