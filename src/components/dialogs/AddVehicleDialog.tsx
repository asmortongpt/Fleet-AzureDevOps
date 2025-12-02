import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { toast } from "sonner"
import {
  AssetCategory,
  AssetType,
  PowerType,
  OperationalStatus,
  UsageMetric,
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  OPERATIONAL_STATUS_LABELS,
  getAssetTypesForCategory,
  requiresHeavyEquipmentFields,
  supportsPTOTracking
} from "@/types/asset.types"

interface AddVehicleDialogProps {
  onAdd: (vehicle: Vehicle) => void
}

export function AddVehicleDialog({ onAdd }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    number: "",
    type: "sedan" as Vehicle["type"],
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    vin: "",
    licensePlate: "",
    fuelType: "gasoline" as Vehicle["fuelType"],
    ownership: "owned" as Vehicle["ownership"],
    department: "Operations",
    region: "Central",

    // Asset Classification (NEW)
    asset_category: "" as AssetCategory | "",
    asset_type: "" as AssetType | "",
    power_type: "" as PowerType | "",
    operational_status: "AVAILABLE" as OperationalStatus,
    primary_metric: "ODOMETER" as UsageMetric,

    // Multi-Metric Tracking (NEW)
    odometer: "0",
    engine_hours: "0",
    pto_hours: "0",
    aux_hours: "0",

    // Heavy Equipment Specs (NEW)
    capacity_tons: "",
    max_reach_feet: "",
    lift_height_feet: "",
    bucket_capacity_yards: "",
    operating_weight_lbs: "",

    // Equipment Capabilities (NEW)
    has_pto: false,
    has_aux_power: false,
    is_road_legal: true,
    requires_cdl: false,
    requires_special_license: false,
    is_off_road_only: false,

    // Trailer Specs (NEW)
    axle_count: "",
    max_payload_kg: "",
    tank_capacity_l: ""
  })

  // Available asset types based on selected category
  const [availableAssetTypes, setAvailableAssetTypes] = useState<AssetType[]>([])

  // Update available asset types when category changes
  useEffect(() => {
    if (formData.asset_category) {
      const types = getAssetTypesForCategory(formData.asset_category)
      setAvailableAssetTypes(types)
      // Reset asset type if it's not valid for the new category
      if (formData.asset_type && !types.includes(formData.asset_type)) {
        setFormData(prev => ({ ...prev, asset_type: "" }))
      }
    } else {
      setAvailableAssetTypes([])
    }
  }, [formData.asset_category])

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.number || !formData.make || !formData.model || !formData.vin || !formData.licensePlate) {
      toast.error("Please fill in all required fields")
      return
    }

    // Build the new vehicle object with all fields
    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      tenantId: "default-tenant", // TODO: Get from tenant context
      number: formData.number,
      type: formData.type,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      status: "active",
      location: {
        lat: 27.9506 + (Math.random() - 0.5) * 2,
        lng: -82.4572 + (Math.random() - 0.5) * 2,
        address: "Fleet Headquarters, FL"
      },
      region: formData.region,
      department: formData.department,
      fuelLevel: 100,
      fuelType: formData.fuelType,
      mileage: parseInt(formData.odometer) || 0,
      hoursUsed: parseFloat(formData.engine_hours) || 0,
      ownership: formData.ownership,
      lastService: new Date().toISOString().split('T')[0],
      nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alerts: [],
      // Add custom fields for asset data
      customFields: {
        // Asset Classification
        asset_category: formData.asset_category || undefined,
        asset_type: formData.asset_type || undefined,
        power_type: formData.power_type || undefined,
        operational_status: formData.operational_status,
        primary_metric: formData.primary_metric,

        // Multi-Metric Tracking
        odometer: parseInt(formData.odometer) || 0,
        engine_hours: parseFloat(formData.engine_hours) || 0,
        pto_hours: formData.has_pto ? parseFloat(formData.pto_hours) || 0 : undefined,
        aux_hours: formData.has_aux_power ? parseFloat(formData.aux_hours) || 0 : undefined,

        // Heavy Equipment Specifications
        capacity_tons: formData.capacity_tons ? parseFloat(formData.capacity_tons) : undefined,
        max_reach_feet: formData.max_reach_feet ? parseFloat(formData.max_reach_feet) : undefined,
        lift_height_feet: formData.lift_height_feet ? parseFloat(formData.lift_height_feet) : undefined,
        bucket_capacity_yards: formData.bucket_capacity_yards ? parseFloat(formData.bucket_capacity_yards) : undefined,
        operating_weight_lbs: formData.operating_weight_lbs ? parseFloat(formData.operating_weight_lbs) : undefined,

        // Equipment Capabilities
        has_pto: formData.has_pto,
        has_aux_power: formData.has_aux_power,
        is_road_legal: formData.is_road_legal,
        requires_cdl: formData.requires_cdl,
        requires_special_license: formData.requires_special_license,
        is_off_road_only: formData.is_off_road_only,

        // Trailer Specifications
        axle_count: formData.axle_count ? parseInt(formData.axle_count) : undefined,
        max_payload_kg: formData.max_payload_kg ? parseFloat(formData.max_payload_kg) : undefined,
        tank_capacity_l: formData.tank_capacity_l ? parseFloat(formData.tank_capacity_l) : undefined,
      }
    }

    console.log('Submitting new vehicle with asset data:', newVehicle)

    onAdd(newVehicle)
    toast.success(`Vehicle ${formData.number} added successfully`)
    setOpen(false)

    // Reset form
    setFormData({
      number: "",
      type: "sedan",
      make: "",
      model: "",
      year: new Date().getFullYear().toString(),
      vin: "",
      licensePlate: "",
      fuelType: "gasoline",
      ownership: "owned",
      department: "Operations",
      region: "Central",
      asset_category: "",
      asset_type: "",
      power_type: "",
      operational_status: "AVAILABLE",
      primary_metric: "ODOMETER",
      odometer: "0",
      engine_hours: "0",
      pto_hours: "0",
      aux_hours: "0",
      capacity_tons: "",
      max_reach_feet: "",
      lift_height_feet: "",
      bucket_capacity_yards: "",
      operating_weight_lbs: "",
      has_pto: false,
      has_aux_power: false,
      is_road_legal: true,
      requires_cdl: false,
      requires_special_license: false,
      is_off_road_only: false,
      axle_count: "",
      max_payload_kg: "",
      tank_capacity_l: ""
    })
  }

  // Show/hide conditional sections
  const showHeavyEquipmentFields = requiresHeavyEquipmentFields(formData.asset_category as AssetCategory)
  const showPTOFields = supportsPTOTracking(formData.asset_type as AssetType)
  const showTrailerFields = formData.asset_category === 'TRAILER'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle / Asset</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-1">
          {/* Asset Classification Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-blue-600 border-b pb-1">Asset Classification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset_category">Asset Category</Label>
                <Select
                  value={formData.asset_category}
                  onValueChange={(v) => setFormData({ ...formData, asset_category: v as AssetCategory })}
                >
                  <SelectTrigger id="asset_category">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_type">Asset Type</Label>
                <Select
                  value={formData.asset_type}
                  onValueChange={(v) => setFormData({ ...formData, asset_type: v as AssetType })}
                  disabled={!formData.asset_category}
                >
                  <SelectTrigger id="asset_type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssetTypes.map((type) => (
                      <SelectItem key={type} value={type}>{ASSET_TYPE_LABELS[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="power_type">Power Type</Label>
                <Select
                  value={formData.power_type}
                  onValueChange={(v) => setFormData({ ...formData, power_type: v as PowerType })}
                >
                  <SelectTrigger id="power_type">
                    <SelectValue placeholder="Select power type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POWER_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-blue-600 border-b pb-1">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Vehicle Number *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="FL-1001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Legacy Vehicle Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Vehicle["type"] })}>
                  <SelectTrigger id="type">
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

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Ford"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Explorer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  placeholder="1HGBH41JXMN109186"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="ABC1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={formData.fuelType} onValueChange={(v) => setFormData({ ...formData, fuelType: v as Vehicle["fuelType"] })}>
                  <SelectTrigger id="fuelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="propane">Propane</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership</Label>
                <Select value={formData.ownership} onValueChange={(v) => setFormData({ ...formData, ownership: v as Vehicle["ownership"] })}>
                  <SelectTrigger id="ownership">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="leased">Leased</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational_status">Operational Status</Label>
                <Select
                  value={formData.operational_status}
                  onValueChange={(v) => setFormData({ ...formData, operational_status: v as OperationalStatus })}
                >
                  <SelectTrigger id="operational_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATIONAL_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Multi-Metric Tracking Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-blue-600 border-b pb-1">Usage Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer (miles)</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine_hours">Engine Hours</Label>
                <Input
                  id="engine_hours"
                  type="number"
                  step="0.1"
                  value={formData.engine_hours}
                  onChange={(e) => setFormData({ ...formData, engine_hours: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_metric">Primary Metric</Label>
                <Select
                  value={formData.primary_metric}
                  onValueChange={(v) => setFormData({ ...formData, primary_metric: v as UsageMetric })}
                >
                  <SelectTrigger id="primary_metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ODOMETER">Odometer</SelectItem>
                    <SelectItem value="ENGINE_HOURS">Engine Hours</SelectItem>
                    <SelectItem value="PTO_HOURS">PTO Hours</SelectItem>
                    <SelectItem value="AUX_HOURS">Aux Hours</SelectItem>
                    <SelectItem value="CYCLES">Cycles</SelectItem>
                    <SelectItem value="CALENDAR">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* PTO Fields - Conditional on asset type */}
          {showPTOFields && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-green-600 border-b pb-1">PTO & Auxiliary Power</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Checkbox
                    id="has_pto"
                    checked={formData.has_pto}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_pto: checked as boolean })}
                  />
                  <Label htmlFor="has_pto" className="cursor-pointer">Has PTO</Label>
                </div>

                {formData.has_pto && (
                  <div className="space-y-2">
                    <Label htmlFor="pto_hours">PTO Hours</Label>
                    <Input
                      id="pto_hours"
                      type="number"
                      step="0.1"
                      value={formData.pto_hours}
                      onChange={(e) => setFormData({ ...formData, pto_hours: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="space-y-2 flex items-center gap-2">
                  <Checkbox
                    id="has_aux_power"
                    checked={formData.has_aux_power}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_aux_power: checked as boolean })}
                  />
                  <Label htmlFor="has_aux_power" className="cursor-pointer">Has Aux Power</Label>
                </div>

                {formData.has_aux_power && (
                  <div className="space-y-2">
                    <Label htmlFor="aux_hours">Aux Hours</Label>
                    <Input
                      id="aux_hours"
                      type="number"
                      step="0.1"
                      value={formData.aux_hours}
                      onChange={(e) => setFormData({ ...formData, aux_hours: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Heavy Equipment Specifications - Conditional */}
          {showHeavyEquipmentFields && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-orange-600 border-b pb-1">Heavy Equipment Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity_tons">Capacity (tons)</Label>
                  <Input
                    id="capacity_tons"
                    type="number"
                    step="0.1"
                    value={formData.capacity_tons}
                    onChange={(e) => setFormData({ ...formData, capacity_tons: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lift_height_feet">Lift Height (feet)</Label>
                  <Input
                    id="lift_height_feet"
                    type="number"
                    step="0.1"
                    value={formData.lift_height_feet}
                    onChange={(e) => setFormData({ ...formData, lift_height_feet: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bucket_capacity_yards">Bucket Capacity (yd³)</Label>
                  <Input
                    id="bucket_capacity_yards"
                    type="number"
                    step="0.1"
                    value={formData.bucket_capacity_yards}
                    onChange={(e) => setFormData({ ...formData, bucket_capacity_yards: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_reach_feet">Max Reach (feet)</Label>
                  <Input
                    id="max_reach_feet"
                    type="number"
                    step="0.1"
                    value={formData.max_reach_feet}
                    onChange={(e) => setFormData({ ...formData, max_reach_feet: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operating_weight_lbs">Operating Weight (lbs)</Label>
                  <Input
                    id="operating_weight_lbs"
                    type="number"
                    value={formData.operating_weight_lbs}
                    onChange={(e) => setFormData({ ...formData, operating_weight_lbs: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trailer Specifications - Conditional */}
          {showTrailerFields && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-purple-600 border-b pb-1">Trailer Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="axle_count">Axle Count</Label>
                  <Input
                    id="axle_count"
                    type="number"
                    value={formData.axle_count}
                    onChange={(e) => setFormData({ ...formData, axle_count: e.target.value })}
                    placeholder="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_payload_kg">Max Payload (kg)</Label>
                  <Input
                    id="max_payload_kg"
                    type="number"
                    value={formData.max_payload_kg}
                    onChange={(e) => setFormData({ ...formData, max_payload_kg: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tank_capacity_l">Tank Capacity (L)</Label>
                  <Input
                    id="tank_capacity_l"
                    type="number"
                    value={formData.tank_capacity_l}
                    onChange={(e) => setFormData({ ...formData, tank_capacity_l: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Equipment Capabilities Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-blue-600 border-b pb-1">Capabilities & Requirements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="is_road_legal"
                  checked={formData.is_road_legal}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_road_legal: checked as boolean })}
                />
                <Label htmlFor="is_road_legal" className="cursor-pointer">Road Legal</Label>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="requires_cdl"
                  checked={formData.requires_cdl}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_cdl: checked as boolean })}
                />
                <Label htmlFor="requires_cdl" className="cursor-pointer">Requires CDL</Label>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="requires_special_license"
                  checked={formData.requires_special_license}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_special_license: checked as boolean })}
                />
                <Label htmlFor="requires_special_license" className="cursor-pointer">Special License Required</Label>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="is_off_road_only"
                  checked={formData.is_off_road_only}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_off_road_only: checked as boolean })}
                />
                <Label htmlFor="is_off_road_only" className="cursor-pointer">Off-Road Only</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
