/**
 * EditVehicleDialog — edits an existing vehicle record.
 * Mirrors AddVehicleDialog structure but fetches current data and PUTs updates.
 */

import { Pencil, Save, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCsrfToken } from '@/hooks/use-api'
import { apiFetcher } from '@/lib/api-fetcher'
import {
  AssetCategory,
  AssetType,
  PowerType,
  OperationalStatus,
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  getAssetTypesForCategory,
  requiresHeavyEquipmentFields,
  supportsPTOTracking,
} from '@/types/asset.types'
import { formatVehicleName } from '@/utils/vehicle-display'
import logger from '@/utils/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditVehicleDialogProps {
  vehicleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

interface VehicleFormData {
  // Basic Info
  make: string
  model: string
  year: string
  number: string
  license_plate: string
  type: string
  fuel_type: string
  department: string
  region: string

  // Asset Classification
  asset_category: AssetCategory | ''
  asset_type: AssetType | ''
  power_type: PowerType | ''
  operational_status: OperationalStatus | ''

  // Location
  location_address: string
  location_lat: string
  location_lng: string

  // Status & Odometer
  status: string
  odometer: string

  // Multi-metric
  engine_hours: string
  pto_hours: string
  aux_hours: string

  // Heavy Equipment Specs
  capacity_tons: string
  max_reach_feet: string
  lift_height_feet: string
  bucket_capacity_yards: string
  operating_weight_lbs: string

  // Equipment Capabilities
  has_pto: boolean
  has_aux_power: boolean
  is_road_legal: boolean
  requires_cdl: boolean
  requires_special_license: boolean
  is_off_road_only: boolean

  // Trailer Specs
  axle_count: string
  max_payload_kg: string
  tank_capacity_l: string

  // Insurance
  insurance_provider: string
  insurance_policy_number: string
  insurance_expiry: string

  // Financial
  purchase_date: string
  purchase_price: string
  current_value: string
}

const EMPTY_FORM: VehicleFormData = {
  make: '',
  model: '',
  year: '',
  number: '',
  license_plate: '',
  type: 'sedan',
  fuel_type: 'gasoline',
  department: '',
  region: '',
  asset_category: '',
  asset_type: '',
  power_type: '',
  operational_status: '',
  location_address: '',
  location_lat: '',
  location_lng: '',
  status: 'active',
  odometer: '0',
  engine_hours: '0',
  pto_hours: '0',
  aux_hours: '0',
  capacity_tons: '',
  max_reach_feet: '',
  lift_height_feet: '',
  bucket_capacity_yards: '',
  operating_weight_lbs: '',
  has_pto: false,
  has_aux_power: false,
  is_road_legal: true,
  requires_cdl: false,
  requires_special_license: false,
  is_off_road_only: false,
  axle_count: '',
  max_payload_kg: '',
  tank_capacity_l: '',
  insurance_provider: '',
  insurance_policy_number: '',
  insurance_expiry: '',
  purchase_date: '',
  purchase_price: '',
  current_value: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditVehicleDialog({
  vehicleId,
  open,
  onOpenChange,
  onSaved,
}: EditVehicleDialogProps) {
  const [formData, setFormData] = useState<VehicleFormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Fetch current vehicle data
  const { data: vehicle, isLoading } = useSWR(
    open ? `/api/vehicles/${vehicleId}` : null,
    apiFetcher,
  )

  // VIN — read-only, extracted from fetched data
  const vin: string = (vehicle as Record<string, unknown>)?.vin as string ?? ''

  // Available asset types based on selected category
  const [availableAssetTypes, setAvailableAssetTypes] = useState<AssetType[]>([])

  // Update available asset types when category changes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-run when category changes; asset_type is read but should not trigger this effect
  useEffect(() => {
    if (formData.asset_category) {
      const types = getAssetTypesForCategory(formData.asset_category as AssetCategory)
      setAvailableAssetTypes(types)
      if (formData.asset_type && !types.includes(formData.asset_type as AssetType)) {
        setFormData((prev) => ({ ...prev, asset_type: '' }))
      }
    } else {
      setAvailableAssetTypes([])
    }
  }, [formData.asset_category])

  // Initialize form when vehicle data arrives
  useEffect(() => {
    if (!vehicle || initialized) return
    const v = vehicle as Record<string, unknown>

    // Handle location — may be a nested object or flat fields
    const loc = v.location as { lat?: number; lng?: number; address?: string } | undefined
    const locAddress = (loc?.address ?? v.location_address ?? '') as string
    const locLat = String(loc?.lat ?? v.location_lat ?? '')
    const locLng = String(loc?.lng ?? v.location_lng ?? '')

    setFormData({
      make: (v.make as string) ?? '',
      model: (v.model as string) ?? '',
      year: v.year != null ? String(v.year) : '',
      number: (v.number as string) ?? '',
      license_plate: ((v.license_plate ?? v.licensePlate) as string) ?? '',
      type: (v.type as string) ?? 'sedan',
      fuel_type: ((v.fuel_type ?? v.fuelType) as string) ?? 'gasoline',
      department: (v.department as string) ?? '',
      region: (v.region as string) ?? '',
      asset_category: ((v.asset_category as string) ?? '') as AssetCategory | '',
      asset_type: ((v.asset_type as string) ?? '') as AssetType | '',
      power_type: ((v.power_type as string) ?? '') as PowerType | '',
      operational_status: ((v.operational_status as string) ?? '') as OperationalStatus | '',
      location_address: locAddress,
      location_lat: locLat,
      location_lng: locLng,
      status: (v.status as string) ?? 'active',
      odometer: v.odometer != null ? String(v.odometer) : (v.mileage != null ? String(v.mileage) : '0'),
      engine_hours: v.engine_hours != null ? String(v.engine_hours) : '0',
      pto_hours: v.pto_hours != null ? String(v.pto_hours) : '0',
      aux_hours: v.aux_hours != null ? String(v.aux_hours) : '0',
      capacity_tons: v.capacity_tons != null ? String(v.capacity_tons) : '',
      max_reach_feet: v.max_reach_feet != null ? String(v.max_reach_feet) : '',
      lift_height_feet: v.lift_height_feet != null ? String(v.lift_height_feet) : '',
      bucket_capacity_yards: v.bucket_capacity_yards != null ? String(v.bucket_capacity_yards) : '',
      operating_weight_lbs: v.operating_weight_lbs != null ? String(v.operating_weight_lbs) : '',
      has_pto: !!v.has_pto,
      has_aux_power: !!v.has_aux_power,
      is_road_legal: v.is_road_legal != null ? !!v.is_road_legal : true,
      requires_cdl: !!v.requires_cdl,
      requires_special_license: !!v.requires_special_license,
      is_off_road_only: !!v.is_off_road_only,
      axle_count: v.axle_count != null ? String(v.axle_count) : '',
      max_payload_kg: v.max_payload_kg != null ? String(v.max_payload_kg) : '',
      tank_capacity_l: v.tank_capacity_l != null ? String(v.tank_capacity_l) : '',
      insurance_provider: (v.insurance_provider as string) ?? '',
      insurance_policy_number: (v.insurance_policy_number as string) ?? '',
      insurance_expiry: v.insurance_expiry ? String(v.insurance_expiry).slice(0, 10) : '',
      purchase_date: v.purchase_date ? String(v.purchase_date).slice(0, 10) : '',
      purchase_price: v.purchase_price != null ? String(v.purchase_price) : '',
      current_value: v.current_value != null ? String(v.current_value) : '',
    })
    setInitialized(true)
  }, [vehicle, initialized])

  // Reset initialization when dialog closes so re-opening fetches fresh data
  useEffect(() => {
    if (!open) {
      setInitialized(false)
      setFormData({ ...EMPTY_FORM })
    }
  }, [open])

  // Shorthand updater
  const set = (field: keyof VehicleFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  // Conditional sections
  const showHeavyEquipmentFields = formData.asset_category
    ? requiresHeavyEquipmentFields(formData.asset_category as AssetCategory)
    : false
  const showPTOFields = formData.asset_type
    ? supportsPTOTracking(formData.asset_type as AssetType)
    : false
  const showTrailerFields = formData.asset_category === 'TRAILER'

  // ------ Validation + Save ------
  const handleSave = async () => {
    // Basic validation
    if (!formData.make?.trim() || !formData.model?.trim()) {
      toast.error('Make and Model are required')
      return
    }

    // Year range
    const currentYear = new Date().getFullYear()
    const yearNum = Number(formData.year)
    if (formData.year && (yearNum < 1900 || yearNum > currentYear + 2)) {
      toast.error(`Year must be between 1900 and ${currentYear + 2}`)
      return
    }

    if (!formData.location_address?.trim()) {
      toast.error('Please enter a location address')
      return
    }

    let latitude = Number(formData.location_lat)
    let longitude = Number(formData.location_lng)

    // Geocode if coordinates are missing
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (!formData.location_lat && !formData.location_lng)) {
      try {
        const csrf = await getCsrfToken()
        const geoRes = await fetch('/api/documents/geo/geocode', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body: JSON.stringify({ address: formData.location_address }),
        })
        if (!geoRes.ok) throw new Error('Unable to geocode address')
        const geoPayload = await geoRes.json()
        const result = geoPayload?.result
        if (!result) throw new Error('No geocoding result')
        latitude = Number(result.lat)
        longitude = Number(result.lng)
      } catch {
        toast.error('Location could not be geocoded. Please provide coordinates.')
        return
      }
    }

    setSaving(true)

    try {
      const csrf = await getCsrfToken()
      const body: Record<string, unknown> = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: yearNum || undefined,
        number: formData.number.trim() || undefined,
        license_plate: formData.license_plate.trim() || undefined,
        type: formData.type,
        fuel_type: formData.fuel_type,
        department: formData.department.trim() || undefined,
        region: formData.region.trim() || undefined,
        status: formData.status,
        odometer: parseInt(formData.odometer) || 0,
        location_address: formData.location_address.trim(),
        location_lat: latitude,
        location_lng: longitude,
        // Asset classification
        asset_category: formData.asset_category || undefined,
        asset_type: formData.asset_type || undefined,
        power_type: formData.power_type || undefined,
        operational_status: formData.operational_status || undefined,
        // Multi-metric
        engine_hours: parseFloat(formData.engine_hours) || 0,
        pto_hours: formData.has_pto ? parseFloat(formData.pto_hours) || 0 : undefined,
        aux_hours: formData.has_aux_power ? parseFloat(formData.aux_hours) || 0 : undefined,
        // Heavy equipment specs
        capacity_tons: formData.capacity_tons ? parseFloat(formData.capacity_tons) : undefined,
        max_reach_feet: formData.max_reach_feet ? parseFloat(formData.max_reach_feet) : undefined,
        lift_height_feet: formData.lift_height_feet ? parseFloat(formData.lift_height_feet) : undefined,
        bucket_capacity_yards: formData.bucket_capacity_yards ? parseFloat(formData.bucket_capacity_yards) : undefined,
        operating_weight_lbs: formData.operating_weight_lbs ? parseFloat(formData.operating_weight_lbs) : undefined,
        // Equipment capabilities
        has_pto: formData.has_pto,
        has_aux_power: formData.has_aux_power,
        is_road_legal: formData.is_road_legal,
        requires_cdl: formData.requires_cdl,
        requires_special_license: formData.requires_special_license,
        is_off_road_only: formData.is_off_road_only,
        // Trailer specs
        axle_count: formData.axle_count ? parseInt(formData.axle_count) : undefined,
        max_payload_kg: formData.max_payload_kg ? parseFloat(formData.max_payload_kg) : undefined,
        tank_capacity_l: formData.tank_capacity_l ? parseFloat(formData.tank_capacity_l) : undefined,
      }

      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error((errData as { message?: string }).message || 'Failed to update vehicle')
        return
      }

      toast.success('Vehicle updated successfully')
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      logger.error('Failed to update vehicle:', error)
      toast.error('Failed to update vehicle')
    } finally {
      setSaving(false)
    }
  }

  // Title text
  const titleText = vehicle
    ? `Edit ${formatVehicleName(vehicle as { year?: number; make?: string; model?: string; number?: string })}`
    : 'Edit Vehicle'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-white/60" />
            {titleText}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="max-h-[calc(85vh-140px)] overflow-y-auto pr-1 space-y-4">
            {/* VIN — read-only */}
            {vin && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider">VIN (read-only)</Label>
                <Input
                  value={vin}
                  readOnly
                  className="opacity-60 cursor-not-allowed font-mono text-xs"
                  tabIndex={-1}
                />
              </div>
            )}

            {/* ---- Asset Classification ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Asset Classification
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-asset-category">Category</Label>
                  <Select
                    value={formData.asset_category}
                    onValueChange={(v) => set('asset_category', v)}
                  >
                    <SelectTrigger id="edit-asset-category">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSET_CATEGORY_LABELS).map(([val, lbl]) => (
                        <SelectItem key={val} value={val}>{lbl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-asset-type">Asset Type</Label>
                  <Select
                    value={formData.asset_type}
                    onValueChange={(v) => set('asset_type', v)}
                    disabled={!formData.asset_category}
                  >
                    <SelectTrigger id="edit-asset-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssetTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ASSET_TYPE_LABELS[t] ?? t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-power-type">Power Type</Label>
                  <Select
                    value={formData.power_type}
                    onValueChange={(v) => set('power_type', v)}
                  >
                    <SelectTrigger id="edit-power-type">
                      <SelectValue placeholder="Select power type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POWER_TYPE_LABELS).map(([val, lbl]) => (
                        <SelectItem key={val} value={val}>{lbl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-op-status">Operational Status</Label>
                  <Select
                    value={formData.operational_status}
                    onValueChange={(v) => set('operational_status', v)}
                  >
                    <SelectTrigger id="edit-op-status">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="IN_USE">In Use</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ---- Basic Info ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Basic Information
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-make">Make *</Label>
                  <Input
                    id="edit-make"
                    value={formData.make}
                    onChange={(e) => set('make', e.target.value)}
                    placeholder="Ford"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-model">Model *</Label>
                  <Input
                    id="edit-model"
                    value={formData.model}
                    onChange={(e) => set('model', e.target.value)}
                    placeholder="Explorer"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => set('year', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-number">Vehicle Number</Label>
                  <Input
                    id="edit-number"
                    value={formData.number}
                    onChange={(e) => set('number', e.target.value)}
                    placeholder="FL-1001"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-license-plate">License Plate</Label>
                  <Input
                    id="edit-license-plate"
                    value={formData.license_plate}
                    onChange={(e) => set('license_plate', e.target.value.toUpperCase())}
                    placeholder="ABC1234"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-type">Vehicle Type</Label>
                  <Select value={formData.type} onValueChange={(v) => set('type', v)}>
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="specialty">Specialty</SelectItem>
                      <SelectItem value="tractor">Tractor</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-fuel-type">Fuel Type</Label>
                  <Select value={formData.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
                    <SelectTrigger id="edit-fuel-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={formData.department}
                    onChange={(e) => set('department', e.target.value)}
                    placeholder="Operations"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-region">Region</Label>
                  <Input
                    id="edit-region"
                    value={formData.region}
                    onChange={(e) => set('region', e.target.value)}
                    placeholder="Central"
                  />
                </div>
              </div>
            </div>

            {/* ---- Location ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Location
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="edit-loc-address">Address *</Label>
                  <Input
                    id="edit-loc-address"
                    value={formData.location_address}
                    onChange={(e) => set('location_address', e.target.value)}
                    placeholder="123 Main St, Tallahassee, FL"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-loc-lat">Latitude (optional)</Label>
                  <Input
                    id="edit-loc-lat"
                    value={formData.location_lat}
                    onChange={(e) => set('location_lat', e.target.value)}
                    placeholder="30.4383"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-loc-lng">Longitude (optional)</Label>
                  <Input
                    id="edit-loc-lng"
                    value={formData.location_lng}
                    onChange={(e) => set('location_lng', e.target.value)}
                    placeholder="-84.2807"
                  />
                </div>
              </div>
            </div>

            {/* ---- Status & Odometer ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Status & Metrics
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="charging">Charging</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-odometer">Odometer</Label>
                  <Input
                    id="edit-odometer"
                    type="number"
                    value={formData.odometer}
                    onChange={(e) => set('odometer', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-engine-hours">Engine Hours</Label>
                  <Input
                    id="edit-engine-hours"
                    type="number"
                    value={formData.engine_hours}
                    onChange={(e) => set('engine_hours', e.target.value)}
                  />
                </div>
                {showPTOFields && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-pto-hours">PTO Hours</Label>
                    <Input
                      id="edit-pto-hours"
                      type="number"
                      value={formData.pto_hours}
                      onChange={(e) => set('pto_hours', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ---- Heavy Equipment Specs (conditional) ---- */}
            {showHeavyEquipmentFields && (
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Heavy Equipment Specifications
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-capacity-tons">Capacity (tons)</Label>
                    <Input
                      id="edit-capacity-tons"
                      type="number"
                      value={formData.capacity_tons}
                      onChange={(e) => set('capacity_tons', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-max-reach">Max Reach (ft)</Label>
                    <Input
                      id="edit-max-reach"
                      type="number"
                      value={formData.max_reach_feet}
                      onChange={(e) => set('max_reach_feet', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-lift-height">Lift Height (ft)</Label>
                    <Input
                      id="edit-lift-height"
                      type="number"
                      value={formData.lift_height_feet}
                      onChange={(e) => set('lift_height_feet', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-bucket-cap">Bucket Capacity (yd)</Label>
                    <Input
                      id="edit-bucket-cap"
                      type="number"
                      value={formData.bucket_capacity_yards}
                      onChange={(e) => set('bucket_capacity_yards', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-op-weight">Operating Weight (lbs)</Label>
                    <Input
                      id="edit-op-weight"
                      type="number"
                      value={formData.operating_weight_lbs}
                      onChange={(e) => set('operating_weight_lbs', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---- Insurance ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Insurance
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-ins-provider">Provider</Label>
                  <Input
                    id="edit-ins-provider"
                    value={formData.insurance_provider}
                    onChange={(e) => set('insurance_provider', e.target.value)}
                    placeholder="e.g. State Farm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-ins-policy">Policy Number</Label>
                  <Input
                    id="edit-ins-policy"
                    value={formData.insurance_policy_number}
                    onChange={(e) => set('insurance_policy_number', e.target.value)}
                    placeholder="POL-123456"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-ins-expiry">Expiry Date</Label>
                  <Input
                    id="edit-ins-expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => set('insurance_expiry', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ---- Financial ---- */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Financial
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-purchase-date">Purchase Date</Label>
                  <Input
                    id="edit-purchase-date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => set('purchase_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-purchase-price">Purchase Price ($)</Label>
                  <Input
                    id="edit-purchase-price"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => set('purchase_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-current-value">Current Value ($)</Label>
                  <Input
                    id="edit-current-value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => set('current_value', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* ---- Trailer Specs (conditional) ---- */}
            {showTrailerFields && (
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Trailer Specifications
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-axle-count">Axle Count</Label>
                    <Input
                      id="edit-axle-count"
                      type="number"
                      value={formData.axle_count}
                      onChange={(e) => set('axle_count', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-payload">Max Payload (kg)</Label>
                    <Input
                      id="edit-payload"
                      type="number"
                      value={formData.max_payload_kg}
                      onChange={(e) => set('max_payload_kg', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-tank-cap">Tank Capacity (L)</Label>
                    <Input
                      id="edit-tank-cap"
                      type="number"
                      value={formData.tank_capacity_l}
                      onChange={(e) => set('tank_capacity_l', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.08]">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
