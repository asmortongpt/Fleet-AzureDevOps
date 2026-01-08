/**
 * CreateDamageReport - Enhanced Form with Phase 1 UX Components
 *
 * This component demonstrates the complete UX enhancement system:
 * - FormFieldWithHelp for all form fields
 * - InfoPopover for complex concepts
 * - SmartTooltip for all buttons
 * - Comprehensive contextual help
 *
 * Created: 2026-01-08
 */

import { AlertCircle, Cube, Plus, Upload, X } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help'
import { InfoPopover } from '@/components/ui/info-popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SmartTooltip } from '@/components/ui/smart-tooltip'
import { Textarea } from '@/components/ui/textarea'

interface DamageReportFormData {
  vehicle_id: string
  damage_severity: 'minor' | 'moderate' | 'severe' | ''
  damage_description: string
  damage_location: string
  estimated_repair_cost: string
  photos: File[]
}

interface FormErrors {
  vehicle_id?: string
  damage_severity?: string
  damage_description?: string
  damage_location?: string
}

export function CreateDamageReport() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<DamageReportFormData>({
    vehicle_id: '',
    damage_severity: '',
    damage_description: '',
    damage_location: '',
    estimated_repair_cost: '',
    photos: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Mock vehicle data - in production, fetch from API
  const vehicles = [
    { id: '1', make: 'Ford', model: 'F-150', vin: '1FTFW1E89MFA12345' },
    { id: '2', make: 'Chevrolet', model: 'Silverado', vin: '1GC4K1EY2MF123456' },
    { id: '3', make: 'Toyota', model: 'Camry', vin: '4T1B11HK5MU123456' },
  ]

  const handleInputChange = (field: keyof DamageReportFormData, value: string | File[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newFiles],
      }))
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.vehicle_id) {
      newErrors.vehicle_id = 'Please select a vehicle'
    }
    if (!formData.damage_severity) {
      newErrors.damage_severity = 'Please select damage severity'
    }
    if (!formData.damage_description.trim()) {
      newErrors.damage_description = 'Please provide a damage description'
    }
    if (!formData.damage_location.trim()) {
      newErrors.damage_location = 'Please specify the damage location'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log('Damage report submitted:', formData)
      // Navigate to damage reports list or show success message
      navigate('/fleet')
    } catch (error) {
      console.error('Failed to submit damage report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData)
    // Save to local storage or API
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Create Damage Report
                <InfoPopover
                  title="About Damage Reports"
                  content={
                    <div className="space-y-2">
                      <p>
                        Document vehicle damage for insurance claims, maintenance
                        tracking, and 3D model generation using AI-powered TripoSR.
                      </p>
                      <p className="text-xs">
                        <strong>Tip:</strong> Upload photos from multiple angles for
                        best results with 3D model generation.
                      </p>
                    </div>
                  }
                  videoUrl="/help/videos/damage-reports-intro.mp4"
                  learnMoreUrl="/docs/damage-reports"
                />
              </CardTitle>
              <CardDescription>
                Record vehicle damage with photos and generate 3D models
              </CardDescription>
            </div>
            <SmartTooltip content="Cancel and return to fleet" shortcut="Esc">
              <Button
                variant="ghost"
                onClick={() => navigate('/fleet')}
                type="button"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </SmartTooltip>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Selection */}
            <FormFieldWithHelp
              label="Vehicle"
              helpText="Select the vehicle associated with this damage report"
              example="Fleet Vehicle #1234 (2023 Ford F-150)"
              required
              error={errors.vehicle_id}
              learnMoreUrl="/docs/vehicles#identification"
            >
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => handleInputChange('vehicle_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.vin})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldWithHelp>

            {/* Damage Severity */}
            <FormFieldWithHelp
              label="Damage Severity"
              helpText="Select the level that best matches the repair urgency and safety impact"
              helpTitle="How to Choose Severity Level"
              required
              error={errors.damage_severity}
            >
              <Select
                value={formData.damage_severity}
                onValueChange={(value) =>
                  handleInputChange('damage_severity', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Minor - Cosmetic only
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Moderate - Functional issues
                    </div>
                  </SelectItem>
                  <SelectItem value="severe">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Severe - Safety hazard
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormFieldWithHelp>

            {/* Damage Location */}
            <FormFieldWithHelp
              label="Damage Location"
              helpText="Specify where the damage occurred on the vehicle"
              example="Front bumper, driver side door, rear quarter panel"
              required
              error={errors.damage_location}
            >
              <Input
                id="damage_location"
                value={formData.damage_location}
                onChange={(e) =>
                  handleInputChange('damage_location', e.target.value)
                }
                placeholder="e.g., Front bumper, driver side"
              />
            </FormFieldWithHelp>

            {/* Damage Description */}
            <FormFieldWithHelp
              label="Damage Description"
              helpText="Describe what happened, when it occurred, and any immediate actions taken"
              example="Front bumper damaged during parking. Scraped against concrete pillar at 2:30 PM on 01/08/2026. Vehicle still drivable, minor cosmetic damage only."
              required
              error={errors.damage_description}
              learnMoreUrl="/docs/damage-reports#writing-descriptions"
            >
              <Textarea
                id="damage_description"
                value={formData.damage_description}
                onChange={(e) =>
                  handleInputChange('damage_description', e.target.value)
                }
                placeholder="Provide a detailed description..."
                rows={4}
              />
            </FormFieldWithHelp>

            {/* Estimated Repair Cost */}
            <FormFieldWithHelp
              label="Estimated Repair Cost (Optional)"
              helpText="If you have an estimate, enter the amount in dollars"
              example="$450.00"
            >
              <Input
                id="estimated_repair_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_repair_cost}
                onChange={(e) =>
                  handleInputChange('estimated_repair_cost', e.target.value)
                }
                placeholder="$0.00"
              />
            </FormFieldWithHelp>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Photos & Videos
                <InfoPopover
                  title="Media Upload Tips"
                  content={
                    <div className="space-y-2">
                      <p>• Take photos from multiple angles</p>
                      <p>• Include overall vehicle shots</p>
                      <p>• Capture close-ups of damage</p>
                      <p>• Max file size: 50MB per file</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>3D Model Generation:</strong> At least 3 photos
                        from different angles are recommended for AI-powered 3D
                        model generation using TripoSR.
                      </p>
                    </div>
                  }
                  videoUrl="/help/videos/photo-tips.mp4"
                  type="info"
                />
              </Label>

              <div className="flex gap-3 flex-wrap">
                <SmartTooltip content="Upload photos and videos of the damage">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById('photo-upload')?.click()
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </SmartTooltip>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {formData.photos.length >= 3 && (
                  <SmartTooltip content="Generate 3D model from uploaded photos using AI-powered TripoSR">
                    <Button type="button" variant="secondary">
                      <Cube className="h-4 w-4 mr-2" />
                      Generate 3D Model
                    </Button>
                  </SmartTooltip>
                )}
              </div>

              {/* Photo Preview */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Upload photos and videos of the damage (Max 50MB per file)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <SmartTooltip
                content="Save damage report and generate 3D model if photos available"
                shortcut="Ctrl+S"
              >
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Report'}
                </Button>
              </SmartTooltip>

              <SmartTooltip content="Save as draft without generating 3D model">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
              </SmartTooltip>
            </div>

            {/* Helpful Notice */}
            {formData.photos.length > 0 && formData.photos.length < 3 && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">
                    Upload more photos for 3D model generation
                  </p>
                  <p className="text-muted-foreground mt-1">
                    You've uploaded {formData.photos.length} photo
                    {formData.photos.length === 1 ? '' : 's'}. Add{' '}
                    {3 - formData.photos.length} more from different angles to
                    enable AI-powered 3D model generation.
                  </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
