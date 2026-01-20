import { AlertTriangle, Car, Upload, X, Loader2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { damageReportsApi } from '@/services/damageReportsApi'

const damageReportSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  damage_description: z.string().min(10, 'Description must be at least 10 characters'),
  damage_severity: z.enum(['minor', 'moderate', 'severe'], {
    required_error: 'Please select a severity level',
  }),
  damage_location: z.string().optional(),
  linked_work_order_id: z.string().uuid().optional().or(z.literal('')),
  inspection_id: z.string().uuid().optional().or(z.literal('')),
})

type DamageReportFormData = z.infer<typeof damageReportSchema>

interface CreateDamageReportProps {
  vehicleId?: string
  onSuccess?: (reportId: string) => void
}

export function CreateDamageReport({ vehicleId, onSuccess }: CreateDamageReportProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<DamageReportFormData>({
    vehicle_id: vehicleId || '',
    damage_description: '',
    damage_severity: 'minor',
    damage_location: '',
    linked_work_order_id: '',
    inspection_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (
    field: keyof DamageReportFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const validFiles = newFiles.filter((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      if (!isImage && !isVideo) {
        alert(`${file.name} is not a valid image or video file`)
        return false
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 50MB`)
        return false
      }
      return true
    })

    setSelectedFiles((prev) => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    try {
      damageReportSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)

      // Step 1: Upload media files if any
      const photoUrls: string[] = []
      const videoUrls: string[] = []

      if (selectedFiles.length > 0) {
        setUploading(true)
        setUploadProgress(0)

        const uploadFormData = new FormData()
        selectedFiles.forEach((file) => {
          uploadFormData.append('media', file)
        })

        const uploadResult = await damageReportsApi.uploadMedia(uploadFormData)

        // Separate photos and videos
        uploadResult.files.forEach((file) => {
          if (file.type === 'photo') {
            photoUrls.push(file.url)
          } else if (file.type === 'video') {
            videoUrls.push(file.url)
          }
        })

        setUploadProgress(100)
        setUploading(false)
      }

      // Step 2: Create damage report
      const reportData = {
        ...formData,
        photos: photoUrls,
        videos: videoUrls,
        linked_work_order_id: formData.linked_work_order_id || undefined,
        inspection_id: formData.inspection_id || undefined,
      }

      const createdReport = await damageReportsApi.create(reportData)

      // Success
      if (onSuccess) {
        onSuccess(createdReport.id)
      } else {
        navigate(`/damage-reports/${createdReport.id}`)
      }
    } catch (error: any) {
      console.error('Error creating damage report:', error)
      setSubmitError(
        error.response?.data?.error || 'Failed to create damage report'
      )
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold tracking-tight">Create Damage Report</h2>
        <p className="text-muted-foreground">
          Document vehicle damage with photos and detailed information
        </p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Provide details about the damage incident</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_id" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle ID *
            </Label>
            <Input
              id="vehicle_id"
              value={formData.vehicle_id}
              onChange={(e) => handleInputChange('vehicle_id', e.target.value)}
              placeholder="Enter vehicle UUID"
              disabled={!!vehicleId}
              aria-required="true"
              aria-invalid={!!errors.vehicle_id}
              aria-describedby={errors.vehicle_id ? 'vehicle_id-error' : undefined}
            />
            {errors.vehicle_id && (
              <p id="vehicle_id-error" className="text-sm text-destructive">
                {errors.vehicle_id}
              </p>
            )}
          </div>

          {/* Damage Description */}
          <div className="space-y-2">
            <Label htmlFor="damage_description">Damage Description *</Label>
            <Textarea
              id="damage_description"
              value={formData.damage_description}
              onChange={(e) =>
                handleInputChange('damage_description', e.target.value)
              }
              placeholder="Describe the damage in detail..."
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.damage_description}
              aria-describedby={
                errors.damage_description ? 'damage_description-error' : undefined
              }
            />
            {errors.damage_description && (
              <p id="damage_description-error" className="text-sm text-destructive">
                {errors.damage_description}
              </p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="damage_severity">Severity Level *</Label>
            <Select
              value={formData.damage_severity}
              onValueChange={(value) =>
                handleInputChange('damage_severity', value)
              }
            >
              <SelectTrigger
                id="damage_severity"
                aria-required="true"
                aria-invalid={!!errors.damage_severity}
              >
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
            {errors.damage_severity && (
              <p className="text-sm text-destructive">{errors.damage_severity}</p>
            )}
          </div>

          {/* Damage Location */}
          <div className="space-y-2">
            <Label htmlFor="damage_location">Damage Location (Optional)</Label>
            <Input
              id="damage_location"
              value={formData.damage_location}
              onChange={(e) => handleInputChange('damage_location', e.target.value)}
              placeholder="e.g., Front bumper, Driver side door, Rear panel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Media Files</CardTitle>
          <CardDescription>
            Upload photos and videos of the damage (Max 50MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* File Upload Button */}
          <div>
            <Label htmlFor="file-upload" className="sr-only">
              Upload media files
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading || submitting}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Photos/Videos
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload media files"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading files...</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-9 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-9 w-12 bg-background rounded flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {file.type.startsWith('image/') ? 'Photo' : 'Video'}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading || submitting}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Records (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Records (Optional)</CardTitle>
          <CardDescription>
            Link this damage report to related work orders or inspections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Linked Work Order */}
          <div className="space-y-2">
            <Label htmlFor="linked_work_order_id">Work Order ID</Label>
            <Input
              id="linked_work_order_id"
              value={formData.linked_work_order_id}
              onChange={(e) =>
                handleInputChange('linked_work_order_id', e.target.value)
              }
              placeholder="Enter work order UUID (optional)"
            />
          </div>

          {/* Linked Inspection */}
          <div className="space-y-2">
            <Label htmlFor="inspection_id">Inspection ID</Label>
            <Input
              id="inspection_id"
              value={formData.inspection_id}
              onChange={(e) => handleInputChange('inspection_id', e.target.value)}
              placeholder="Enter inspection UUID (optional)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/damage-reports')}
          disabled={submitting || uploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Report
            </>
          )}
        </Button>
      </div>
    </form>
  )
}