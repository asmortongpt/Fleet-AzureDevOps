/**
 * IncidentReportingForm - Comprehensive incident reporting system
 * Supports OSHA compliance, photo uploads, witness statements
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    Warning,
    Camera,
    MapPin,
    Calendar,
    User,
    FileText,
    Check,
    X
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface IncidentFormData {
    incident_type: string
    severity: 'minor' | 'moderate' | 'severe' | 'critical'
    description: string
    location: string
    incident_date: string
    vehicle_id?: string
    driver_id?: string
    witnesses: string[]
    injuries: boolean
    property_damage: boolean
    environmental_impact: boolean
    osha_recordable: boolean
    corrective_actions: string
    photos: File[]
}

interface IncidentReportingFormProps {
    onSubmit: (data: IncidentFormData) => Promise<void>
    onCancel?: () => void
}

const INCIDENT_TYPES = [
    'Vehicle Accident',
    'Property Damage',
    'Personal Injury',
    'Near Miss',
    'Equipment Failure',
    'Environmental Spill',
    'Safety Violation',
    'Workplace Hazard',
    'Fire/Explosion',
    'Other'
]

const SEVERITY_LEVELS = [
    { value: 'minor', label: 'Minor', color: 'bg-blue-500' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500' },
    { value: 'severe', label: 'Severe', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500' }
]

export function IncidentReportingForm({ onSubmit, onCancel }: IncidentReportingFormProps) {
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<IncidentFormData>({
        defaultValues: {
            incident_date: new Date().toISOString().split('T')[0],
            witnesses: [],
            injuries: false,
            property_damage: false,
            environmental_impact: false,
            osha_recordable: false,
            photos: []
        }
    })

    const [witnesses, setWitnesses] = useState<string[]>([])
    const [witnessInput, setWitnessInput] = useState('')
    const [photos, setPhotos] = useState<File[]>([])

    const selectedSeverity = watch('severity')
    const hasInjuries = watch('injuries')

    const addWitness = () => {
        if (witnessInput.trim()) {
            const newWitnesses = [...witnesses, witnessInput.trim()]
            setWitnesses(newWitnesses)
            setValue('witnesses', newWitnesses)
            setWitnessInput('')
        }
    }

    const removeWitness = (index: number) => {
        const newWitnesses = witnesses.filter((_, i) => i !== index)
        setWitnesses(newWitnesses)
        setValue('witnesses', newWitnesses)
    }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos = [...photos, ...Array.from(e.target.files)]
            setPhotos(newPhotos)
            setValue('photos', newPhotos)
        }
    }

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index)
        setPhotos(newPhotos)
        setValue('photos', newPhotos)
    }

    const onSubmitForm = async (data: IncidentFormData) => {
        await onSubmit({
            ...data,
            witnesses,
            photos
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Warning className="w-5 h-5 text-red-400" />
                        Report Safety Incident
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        All fields marked with * are required for OSHA compliance
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="incident_type" className="text-slate-300">
                                Incident Type *
                            </Label>
                            <Select onValueChange={(value) => setValue('incident_type', value)}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue placeholder="Select incident type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.incident_type && (
                                <p className="text-red-400 text-sm">{errors.incident_type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="severity" className="text-slate-300">
                                Severity Level *
                            </Label>
                            <Select onValueChange={(value: any) => setValue('severity', value)}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEVERITY_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                                                {level.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="incident_date" className="text-slate-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date & Time *
                            </Label>
                            <Input
                                id="incident_date"
                                type="datetime-local"
                                {...register('incident_date', { required: 'Date is required' })}
                                className="bg-slate-800/50 border-slate-600 text-white"
                            />
                            {errors.incident_date && (
                                <p className="text-red-400 text-sm">{errors.incident_date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-slate-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Location *
                            </Label>
                            <Input
                                id="location"
                                {...register('location', { required: 'Location is required' })}
                                placeholder="Enter location or address"
                                className="bg-slate-800/50 border-slate-600 text-white"
                            />
                            {errors.location && (
                                <p className="text-red-400 text-sm">{errors.location.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-slate-300">
                            Incident Description *
                        </Label>
                        <Textarea
                            id="description"
                            {...register('description', {
                                required: 'Description is required',
                                minLength: { value: 20, message: 'Description must be at least 20 characters' }
                            })}
                            placeholder="Provide detailed description of what happened..."
                            className="bg-slate-800/50 border-slate-600 text-white min-h-[120px]"
                        />
                        {errors.description && (
                            <p className="text-red-400 text-sm">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Impact Checkboxes */}
                    <div className="space-y-3">
                        <Label className="text-slate-300">Incident Impact</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('injuries')}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                                />
                                <span className="text-sm">Injuries</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('property_damage')}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                                />
                                <span className="text-sm">Property Damage</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('environmental_impact')}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                                />
                                <span className="text-sm">Environmental</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('osha_recordable')}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                                />
                                <span className="text-sm">OSHA Recordable</span>
                            </label>
                        </div>
                    </div>

                    {/* Witnesses */}
                    <div className="space-y-3">
                        <Label className="text-slate-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Witnesses
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={witnessInput}
                                onChange={(e) => setWitnessInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWitness())}
                                placeholder="Enter witness name or ID"
                                className="bg-slate-800/50 border-slate-600 text-white flex-1"
                            />
                            <Button type="button" onClick={addWitness} variant="outline" size="sm">
                                <Check className="w-4 h-4" />
                            </Button>
                        </div>
                        {witnesses.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {witnesses.map((witness, index) => (
                                    <Badge key={index} variant="secondary" className="gap-2">
                                        {witness}
                                        <button
                                            type="button"
                                            onClick={() => removeWitness(index)}
                                            className="hover:text-red-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-3">
                        <Label className="text-slate-300 flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Photos / Evidence
                        </Label>
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="bg-slate-800/50 border-slate-600 text-white"
                        />
                        {photos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`Evidence ${index + 1}`}
                                            className="w-full h-20 object-cover rounded border border-slate-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Corrective Actions */}
                    <div className="space-y-2">
                        <Label htmlFor="corrective_actions" className="text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Corrective Actions Taken
                        </Label>
                        <Textarea
                            id="corrective_actions"
                            {...register('corrective_actions')}
                            placeholder="Describe immediate actions taken and preventive measures..."
                            className="bg-slate-800/50 border-slate-600 text-white min-h-[100px]"
                        />
                    </div>

                    {/* OSHA Warning */}
                    {hasInjuries && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Warning className="w-5 h-5 text-yellow-400 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-yellow-400 font-medium">OSHA Reporting Required</p>
                                    <p className="text-sm text-slate-300">
                                        This incident involves injuries and may require OSHA 300 log entry.
                                        Ensure all required documentation is completed within 7 calendar days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

export default IncidentReportingForm
