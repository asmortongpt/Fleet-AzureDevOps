/**
 * VirtualGarage - Enterprise Asset Visualization & Management
 *
 * Supports all asset types:
 * - Vehicles (Passenger, Commercial, Heavy Trucks)
 * - Tractors & Trailers
 * - Heavy Equipment (Excavators, Bulldozers, Cranes, Forklifts)
 * - Specialty Equipment (Generators, Compressors, Pumps)
 * - Tools & Non-Powered Assets
 *
 * Features:
 * - Real-time asset data from API
 * - Category filtering
 * - Damage reporting with AI 3D model generation
 * - Asset inspection tracking
 *
 * Created: 2025-11-24
 */

import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDropzone } from "react-dropzone"
import {
  Car,
  Truck,
  Camera,
  Upload,
  Cube,
  Warning,
  CheckCircle,
  Clock,
  Wrench,
  GearSix,
  Lightning,
  Warehouse,
  MapPin,
  MagnifyingGlass,
  CaretDown,
  Package,
  Crane,
  ForkKnife,
  Engine,
  Gauge,
  Toolbox,
  HardHat,
  Barcode,
  Factory
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  Asset,
  AssetCategory,
  AssetType,
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  ASSET_TYPES_BY_CATEGORY,
  getAssetCategoryLabel,
  getAssetTypeLabel,
  OperationalStatus
} from "@/types/asset.types"

// ============================================================================
// TYPES
// ============================================================================

interface GarageAsset extends Partial<Asset> {
  id: string
  make: string
  model: string
  year: number
  vin?: string
  license_plate?: string
  asset_name?: string
  asset_tag?: string
  department?: string
  vehicle_type?: string
  color?: string
  engine_hours?: number
  odometer?: number
  condition?: string
}

interface DamageReport {
  id: string
  asset_id: string
  vehicle_id?: string
  reported_date: string
  description: string
  severity: "minor" | "moderate" | "severe"
  photos: string[]
  triposr_model_url?: string
  triposr_task_id?: string
  triposr_status?: "pending" | "processing" | "completed" | "failed"
  location?: string
}

interface Inspection {
  id: string
  asset_id: string
  vehicle_id?: string
  inspection_date: string
  inspection_type: "pre_trip" | "post_trip" | "safety" | "equipment"
  status: "pass" | "fail" | "needs_repair"
  photos: string[]
  defects_found?: string
  odometer_reading?: number
  engine_hours?: number
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const CATEGORY_ICONS: Record<AssetCategory | 'ALL', React.ReactNode> = {
  ALL: <Package className="w-5 h-5" />,
  PASSENGER_VEHICLE: <Car className="w-5 h-5" />,
  LIGHT_COMMERCIAL: <Truck className="w-5 h-5" />,
  HEAVY_TRUCK: <Truck className="w-5 h-5" />,
  TRACTOR: <Engine className="w-5 h-5" />,
  TRAILER: <Package className="w-5 h-5" />,
  HEAVY_EQUIPMENT: <Crane className="w-5 h-5" />,
  UTILITY_VEHICLE: <Truck className="w-5 h-5" />,
  SPECIALTY_EQUIPMENT: <GearSix className="w-5 h-5" />,
  NON_POWERED: <Warehouse className="w-5 h-5" />
}

// ============================================================================
// ASSET DISPLAY COMPONENT
// ============================================================================

function AssetDisplay({
  asset,
  damageModel
}: {
  asset: GarageAsset | null
  damageModel?: string
}) {
  if (!asset && !damageModel) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select an asset to view details</p>
        </div>
      </div>
    )
  }

  const getCategoryIcon = (category?: AssetCategory) => {
    if (!category) return <Package className="w-24 h-24" />
    switch (category) {
      case 'PASSENGER_VEHICLE':
      case 'LIGHT_COMMERCIAL':
        return <Car className="w-24 h-24" />
      case 'HEAVY_TRUCK':
      case 'TRACTOR':
        return <Truck className="w-24 h-24" />
      case 'TRAILER':
        return <Package className="w-24 h-24" />
      case 'HEAVY_EQUIPMENT':
        return <Crane className="w-24 h-24" />
      case 'UTILITY_VEHICLE':
        return <Truck className="w-24 h-24" />
      case 'SPECIALTY_EQUIPMENT':
        return <GearSix className="w-24 h-24" />
      case 'NON_POWERED':
        return <Warehouse className="w-24 h-24" />
      default:
        return <Package className="w-24 h-24" />
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        {damageModel ? (
          <>
            <Warning className="w-24 h-24 mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-semibold mb-2">Damage Model</h3>
            <p className="text-muted-foreground">3D visualization available</p>
            <Badge className="mt-4" variant="outline">{damageModel.substring(0, 50)}...</Badge>
          </>
        ) : asset ? (
          <>
            <div className="text-primary mx-auto mb-4">
              {getCategoryIcon(asset.asset_category)}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`}
            </h3>
            {asset.asset_category && (
              <Badge variant="secondary" className="mb-3">
                {getAssetCategoryLabel(asset.asset_category)}
              </Badge>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {asset.license_plate && (
                <Badge variant="outline">{asset.license_plate}</Badge>
              )}
              {asset.asset_tag && (
                <Badge variant="outline">
                  <Barcode className="w-3 h-3 mr-1" />
                  {asset.asset_tag}
                </Badge>
              )}
              {asset.color && (
                <Badge variant="outline" style={{ backgroundColor: asset.color, color: '#fff' }}>
                  {asset.color}
                </Badge>
              )}
            </div>
            {/* Show relevant metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-left max-w-md mx-auto">
              {asset.odometer !== undefined && asset.odometer > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Odometer</p>
                  <p className="font-semibold">{asset.odometer.toLocaleString()} mi</p>
                </div>
              )}
              {asset.engine_hours !== undefined && asset.engine_hours > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Engine Hours</p>
                  <p className="font-semibold">{asset.engine_hours.toLocaleString()} hrs</p>
                </div>
              )}
              {asset.capacity_tons !== undefined && asset.capacity_tons > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{asset.capacity_tons} tons</p>
                </div>
              )}
              {asset.pto_hours !== undefined && asset.pto_hours > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">PTO Hours</p>
                  <p className="font-semibold">{asset.pto_hours.toLocaleString()} hrs</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

async function fetchAllAssets(): Promise<GarageAsset[]> {
  try {
    // Fetch from both vehicles and asset-management endpoints
    const [vehiclesRes, assetsRes] = await Promise.allSettled([
      fetch("/api/vehicles").then(r => r.ok ? r.json() : []),
      apiClient.get("/api/asset-management").then(r => r.assets || [])
    ])

    const vehicles = vehiclesRes.status === 'fulfilled' ? vehiclesRes.value : []
    const assets = assetsRes.status === 'fulfilled' ? assetsRes.value : []

    // Normalize vehicle data to GarageAsset format
    const normalizedVehicles: GarageAsset[] = (Array.isArray(vehicles) ? vehicles : []).map((v: any) => ({
      id: v.id,
      make: v.make || 'Unknown',
      model: v.model || 'Unknown',
      year: v.year || new Date().getFullYear(),
      vin: v.vin,
      license_plate: v.license_plate,
      department: v.department,
      vehicle_type: v.vehicle_type,
      color: v.color,
      status: v.status,
      odometer: v.mileage || v.odometer,
      asset_category: mapVehicleTypeToCategory(v.vehicle_type),
      asset_type: mapVehicleTypeToAssetType(v.vehicle_type)
    }))

    // Normalize asset-management data
    const normalizedAssets: GarageAsset[] = (Array.isArray(assets) ? assets : []).map((a: any) => ({
      id: a.id,
      make: a.manufacturer || 'Unknown',
      model: a.model || 'Unknown',
      year: new Date().getFullYear(),
      asset_name: a.asset_name,
      asset_tag: a.asset_tag,
      vin: a.serial_number,
      department: a.location,
      status: a.status,
      condition: a.condition,
      asset_category: mapAssetTypeToCategory(a.asset_type),
      asset_type: a.asset_type?.toUpperCase()
    }))

    // Combine and deduplicate by ID
    const combined = [...normalizedVehicles, ...normalizedAssets]
    const uniqueAssets = combined.reduce((acc: GarageAsset[], curr) => {
      if (!acc.find(a => a.id === curr.id)) {
        acc.push(curr)
      }
      return acc
    }, [])

    return uniqueAssets
  } catch (error) {
    console.error("Error fetching assets:", error)
    return []
  }
}

function mapVehicleTypeToCategory(vehicleType?: string): AssetCategory | undefined {
  if (!vehicleType) return 'PASSENGER_VEHICLE'
  const type = vehicleType.toLowerCase()
  if (type.includes('sedan') || type.includes('suv') || type.includes('car')) return 'PASSENGER_VEHICLE'
  if (type.includes('van') || type.includes('pickup')) return 'LIGHT_COMMERCIAL'
  if (type.includes('truck') || type.includes('heavy')) return 'HEAVY_TRUCK'
  if (type.includes('tractor')) return 'TRACTOR'
  if (type.includes('trailer')) return 'TRAILER'
  if (type.includes('excavator') || type.includes('bulldozer') || type.includes('crane') || type.includes('forklift')) return 'HEAVY_EQUIPMENT'
  if (type.includes('bucket') || type.includes('utility')) return 'UTILITY_VEHICLE'
  if (type.includes('generator') || type.includes('compressor')) return 'SPECIALTY_EQUIPMENT'
  return 'PASSENGER_VEHICLE'
}

function mapAssetTypeToCategory(assetType?: string): AssetCategory | undefined {
  if (!assetType) return undefined
  const type = assetType.toLowerCase()
  if (type.includes('vehicle')) return 'PASSENGER_VEHICLE'
  if (type.includes('equipment')) return 'HEAVY_EQUIPMENT'
  if (type.includes('tool')) return 'NON_POWERED'
  return undefined
}

function mapVehicleTypeToAssetType(vehicleType?: string): AssetType | undefined {
  if (!vehicleType) return 'PASSENGER_CAR'
  const type = vehicleType.toLowerCase()
  if (type.includes('sedan') || type.includes('car')) return 'PASSENGER_CAR'
  if (type.includes('suv')) return 'SUV'
  if (type.includes('van') && type.includes('passenger')) return 'PASSENGER_VAN'
  if (type.includes('van')) return 'CARGO_VAN'
  if (type.includes('pickup')) return 'PICKUP_TRUCK'
  if (type.includes('dump')) return 'DUMP_TRUCK'
  if (type.includes('excavator')) return 'EXCAVATOR'
  if (type.includes('bulldozer')) return 'BULLDOZER'
  if (type.includes('forklift')) return 'FORKLIFT'
  if (type.includes('crane')) return 'MOBILE_CRANE'
  if (type.includes('generator')) return 'GENERATOR'
  return 'OTHER'
}

async function fetchDamageReports(): Promise<DamageReport[]> {
  try {
    const response = await fetch("/api/damage-reports")
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

async function fetchInspections(): Promise<Inspection[]> {
  try {
    const response = await fetch("/api/inspections")
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

async function submitTripoSRRequest(
  formData: FormData
): Promise<{ task_id: string; status: string }> {
  const response = await fetch(
    "/api/triposr/generate",
    {
      method: "POST",
      body: formData
    }
  )
  if (!response.ok) throw new Error("Failed to submit to TripoSR")
  return response.json()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VirtualGarage({ data }: { data?: any }) {
  const queryClient = useQueryClient()

  // State
  const [selectedAsset, setSelectedAsset] = useState<GarageAsset | null>(null)
  const [selectedDamageReport, setSelectedDamageReport] = useState<DamageReport | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"asset" | "damage">("asset")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState<File[]>([])
  const [damageDescription, setDamageDescription] = useState("")
  const [damageSeverity, setDamageSeverity] = useState<"minor" | "moderate" | "severe">("moderate")
  const [selectedTripoSRTaskId, setSelectedTripoSRTaskId] = useState<string | null>(null)

  // Queries
  const {
    data: assets = [],
    isLoading: loadingAssets,
    error: assetsError
  } = useQuery({
    queryKey: ["garage-assets"],
    queryFn: fetchAllAssets,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  const { data: damageReportsData = [] } = useQuery({
    queryKey: ["damage-reports"],
    queryFn: fetchDamageReports,
    staleTime: 2 * 60 * 1000
  })

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections"],
    queryFn: fetchInspections,
    staleTime: 5 * 60 * 1000
  })

  // Filtered assets
  const filteredAssets = useMemo(() => {
    let filtered = assets

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(a => a.asset_category === selectedCategory)
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a =>
        (a.asset_name?.toLowerCase().includes(term)) ||
        (a.make?.toLowerCase().includes(term)) ||
        (a.model?.toLowerCase().includes(term)) ||
        (a.license_plate?.toLowerCase().includes(term)) ||
        (a.asset_tag?.toLowerCase().includes(term)) ||
        (a.vin?.toLowerCase().includes(term))
      )
    }

    return filtered
  }, [assets, selectedCategory, searchTerm])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: assets.length }
    for (const asset of assets) {
      if (asset.asset_category) {
        counts[asset.asset_category] = (counts[asset.asset_category] || 0) + 1
      }
    }
    return counts
  }, [assets])

  // Stats
  const stats = useMemo(() => {
    const damageReportsForSelected = selectedAsset
      ? damageReportsData.filter(r => r.asset_id === selectedAsset.id || r.vehicle_id === selectedAsset.id)
      : []
    const inspectionsForSelected = selectedAsset
      ? inspections.filter(i => i.asset_id === selectedAsset.id || i.vehicle_id === selectedAsset.id)
      : []
    const modelsReady = damageReportsData.filter(r => r.triposr_status === "completed").length

    return {
      totalAssets: assets.length,
      filteredCount: filteredAssets.length,
      damageReports: damageReportsForSelected.length,
      inspections: inspectionsForSelected.length,
      modelsReady
    }
  }, [assets, filteredAssets, damageReportsData, inspections, selectedAsset])

  // Select first asset by default
  useEffect(() => {
    if (filteredAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(filteredAssets[0])
    }
  }, [filteredAssets, selectedAsset])

  // Damage reports for selected asset
  const assetDamageReports = useMemo(() => {
    if (!selectedAsset) return []
    return damageReportsData.filter(
      r => r.asset_id === selectedAsset.id || r.vehicle_id === selectedAsset.id
    )
  }, [damageReportsData, selectedAsset])

  // Photo upload
  const onDrop = (acceptedFiles: File[]) => {
    setUploadingPhotos(acceptedFiles)
    toast.success(`${acceptedFiles.length} photo(s) uploaded`)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true
  })

  // Submit damage mutation
  const submitDamageReportMutation = useMutation({
    mutationFn: async (formData: FormData) => submitTripoSRRequest(formData),
    onSuccess: (triposrData) => {
      toast.success("Damage report submitted! 3D model generating...")
      setSelectedTripoSRTaskId(triposrData.task_id)
      setIsUploadDialogOpen(false)
      setUploadingPhotos([])
      setDamageDescription("")
      setDamageSeverity("moderate")
      queryClient.invalidateQueries({ queryKey: ["damage-reports"] })
    },
    onError: (error) => {
      console.error("Error submitting damage report:", error)
      toast.error("Failed to submit damage report")
    }
  })

  const handleSubmitDamageReport = async () => {
    if (!selectedAsset || uploadingPhotos.length === 0) {
      toast.error("Please select an asset and upload photos")
      return
    }

    const formData = new FormData()
    formData.append("file", uploadingPhotos[0])
    formData.append("asset_id", selectedAsset.id)
    formData.append("description", damageDescription)
    formData.append("severity", damageSeverity)
    formData.append("remove_bg", "true")

    submitDamageReportMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Virtual Garage</h2>
          <p className="text-muted-foreground">
            Manage all fleet assets including vehicles, equipment, and machinery
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Camera className="w-4 h-4 mr-2" />
                Report Damage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Report Asset Damage</DialogTitle>
                <DialogDescription>
                  Upload photos to generate a 3D damage model with AI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Asset</Label>
                  <Select
                    value={selectedAsset?.id}
                    onValueChange={(id) =>
                      setSelectedAsset(assets.find(a => a.id === id) || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`}
                          {asset.license_plate && ` - ${asset.license_plate}`}
                          {asset.asset_tag && ` (${asset.asset_tag})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Damage Description</Label>
                  <Input
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="Describe the damage..."
                  />
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select
                    value={damageSeverity}
                    onValueChange={(value: any) => setDamageSeverity(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {uploadingPhotos.length > 0 ? (
                    <div>
                      <p className="font-medium">{uploadingPhotos.length} photo(s) uploaded</p>
                      <p className="text-sm text-muted-foreground">
                        Click or drag to add more photos
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Drag photos here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Upload damage photos for 3D reconstruction
                      </p>
                    </div>
                  )}
                </div>

                {uploadingPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadingPhotos.map((file, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={submitDamageReportMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitDamageReport}
                  disabled={submitDamageReportMutation.isPending}
                >
                  <Cube className="w-4 h-4 mr-2" />
                  {submitDamageReportMutation.isPending ? "Submitting..." : "Generate 3D Model"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Showing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filteredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Damage Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{damageReportsData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              3D Models Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.modelsReady}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'ALL' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('ALL')}
            >
              <Package className="w-4 h-4 mr-2" />
              All ({categoryCounts['ALL'] || 0})
            </Button>
            {(Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="gap-2"
              >
                {CATEGORY_ICONS[category]}
                {ASSET_CATEGORY_LABELS[category]} ({categoryCounts[category] || 0})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Asset Viewer */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Asset Viewer</CardTitle>
                <CardDescription>
                  {viewMode === "asset"
                    ? "Asset information display"
                    : "Damage report visualization"}
                </CardDescription>
              </div>
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="asset">
                    <Package className="w-4 h-4 mr-2" />
                    Asset
                  </TabsTrigger>
                  <TabsTrigger value="damage">
                    <Warning className="w-4 h-4 mr-2" />
                    Damage
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <AssetDisplay
                asset={viewMode === "asset" ? selectedAsset : null}
                damageModel={
                  viewMode === "damage" ? selectedDamageReport?.triposr_model_url : undefined
                }
              />
            </div>
            {selectedAsset && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Asset</p>
                    <p className="font-medium">
                      {selectedAsset.asset_name || `${selectedAsset.year} ${selectedAsset.make} ${selectedAsset.model}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID / Tag</p>
                    <p className="font-medium font-mono text-sm">
                      {selectedAsset.asset_tag || selectedAsset.license_plate || selectedAsset.id?.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">
                      {selectedAsset.asset_category ? getAssetCategoryLabel(selectedAsset.asset_category) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedAsset.department || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Fleet Assets</CardTitle>
            <CardDescription>Select an asset to view</CardDescription>
            <div className="relative mt-2">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {loadingAssets ? (
                  <p className="text-sm text-muted-foreground">Loading assets...</p>
                ) : filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <Button
                      key={asset.id}
                      variant={selectedAsset?.id === asset.id ? "default" : "outline"}
                      className="w-full justify-start h-auto py-3"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="mr-3">
                        {asset.asset_category && CATEGORY_ICONS[asset.asset_category]}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {asset.asset_name || `${asset.year} ${asset.make} ${asset.model}`}
                        </div>
                        <div className="text-xs opacity-70 flex items-center gap-2">
                          {asset.license_plate && <span>{asset.license_plate}</span>}
                          {asset.asset_tag && <span>{asset.asset_tag}</span>}
                          {asset.asset_category && (
                            <Badge variant="secondary" className="text-xs py-0">
                              {getAssetCategoryLabel(asset.asset_category)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No assets found. Try adjusting your filters.
                  </p>
                )}
              </div>
            </ScrollArea>

            {assetDamageReports.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Damage Reports</h4>
                <div className="space-y-2">
                  {assetDamageReports.map((report) => (
                    <Button
                      key={report.id}
                      variant={selectedDamageReport?.id === report.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedDamageReport(report)
                        setViewMode("damage")
                      }}
                    >
                      <Warning className="w-4 h-4 mr-2" />
                      <div className="flex-1 text-left">
                        <div className="text-sm">{report.description || 'Damage Report'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              report.severity === "severe"
                                ? "destructive"
                                : report.severity === "moderate"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {report.severity}
                          </Badge>
                          {report.triposr_status === "completed" && (
                            <Cube className="w-3 h-3 text-green-500" />
                          )}
                          {report.triposr_status === "processing" && (
                            <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
