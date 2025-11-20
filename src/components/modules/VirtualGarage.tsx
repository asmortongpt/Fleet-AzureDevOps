import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDropzone } from "react-dropzone"
import {
  Car,
  Camera,
  Upload,
  Eye,
  Cube,
  Lightning,
  MapPin,
  Info,
  Warning,
  CheckCircle,
  Clock,
  Image as ImageIcon
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  license_plate: string
  department?: string
  vehicle_type?: string
  color?: string
  status?: string
}

interface DamageReport {
  id: string
  vehicle_id: string
  reported_date: string
  description: string
  severity: "minor" | "moderate" | "severe"
  photos: string[]
  triposr_model_url?: string
  triposr_task_id?: string
  triposr_status?: "pending" | "processing" | "completed" | "failed"
  location?: string
  inspection_id?: string
}

interface Inspection {
  id: string
  vehicle_id: string
  inspection_date: string
  inspection_type: "pre_trip" | "post_trip" | "safety"
  status: "pass" | "fail" | "needs_repair"
  photos: string[]
  defects_found?: string
  odometer_reading?: number
}

// Simple 2D Vehicle Display Component (replacing 3D viewer)
function VehicleDisplay({ vehicleData, damageModel }: { vehicleData: Vehicle | null; damageModel?: string }) {
  if (!vehicleData && !damageModel) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a vehicle to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        {damageModel ? (
          <>
            <Warning className="w-24 h-24 mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-semibold mb-2">Damage Model</h3>
            <p className="text-muted-foreground">3D visualization temporarily unavailable</p>
            <Badge className="mt-4">Model URL: {damageModel}</Badge>
          </>
        ) : vehicleData ? (
          <>
            <Car className="w-24 h-24 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">
              {vehicleData.year} {vehicleData.make} {vehicleData.model}
            </h3>
            <div className="space-y-2 mt-4">
              <Badge variant="outline" className="mr-2">
                {vehicleData.license_plate}
              </Badge>
              {vehicleData.color && (
                <Badge variant="outline" style={{ backgroundColor: vehicleData.color, color: '#fff' }}>
                  {vehicleData.color}
                </Badge>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// Fetch functions for TanStack Query
async function fetchVehicles(): Promise<Vehicle[]> {
  const response = await fetch("/vehicles")
  if (!response.ok) throw new Error("Failed to fetch vehicles")
  return response.json()
}

async function fetchInspections(): Promise<Inspection[]> {
  const response = await fetch("/inspections")
  if (!response.ok) throw new Error("Failed to fetch inspections")
  return response.json()
}

async function fetchDamageReports(): Promise<DamageReport[]> {
  const response = await fetch("/damage-reports")
  if (!response.ok) throw new Error("Failed to fetch damage reports")
  return response.json()
}

async function submitTripoSRRequest(
  formData: FormData
): Promise<{ task_id: string; status: string }> {
  const response = await fetch(
    "http://triposr-service.fleet-management.svc.cluster.local:8000/api/generate",
    {
      method: "POST",
      body: formData
    }
  )
  if (!response.ok) throw new Error("Failed to submit to TripoSR")
  return response.json()
}

async function fetchTripoSRStatus(taskId: string): Promise<{
  task_id: string
  status: "pending" | "processing" | "succeeded" | "failed"
  model_url?: string
}> {
  const response = await fetch(
    `http://triposr-service.fleet-management.svc.cluster.local:8000/api/tasks/${taskId}`
  )
  if (!response.ok) throw new Error("Failed to fetch TripoSR status")
  return response.json()
}

// Main Virtual Garage Component
export function VirtualGarage({ data }: { data: any }) {
  const queryClient = useQueryClient()

  // Fetch queries
  const {
    data: vehicles = [],
    isLoading: loadingVehicles,
    error: vehiclesError
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })

  const {
    data: inspections = [],
    error: inspectionsError
  } = useQuery({
    queryKey: ["inspections"],
    queryFn: fetchInspections,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  const {
    data: damageReportsData = [],
    error: damageReportsError
  } = useQuery({
    queryKey: ["damage-reports"],
    queryFn: fetchDamageReports,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000
  })

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedDamageReport, setSelectedDamageReport] = useState<DamageReport | null>(null)
  const [selectedTripoSRTaskId, setSelectedTripoSRTaskId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"vehicle" | "damage">("vehicle")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState<File[]>([])
  const [damageDescription, setDamageDescription] = useState("")
  const [damageSeverity, setDamageSeverity] = useState<"minor" | "moderate" | "severe">("moderate")

  // Poll TripoSR status
  const {
    data: triposrStatus,
    isLoading: isPollingTripoSR
  } = useQuery({
    queryKey: ["triposr-status", selectedTripoSRTaskId],
    queryFn: () => fetchTripoSRStatus(selectedTripoSRTaskId!),
    enabled: !!selectedTripoSRTaskId, // Only run if taskId exists
    refetchInterval: selectedTripoSRTaskId ? 2000 : false, // Poll every 2 seconds
    refetchIntervalInBackground: false,
    retry: 3,
    staleTime: 0 // Always refetch
  })

  // Handle TripoSR polling completion
  useEffect(() => {
    if (triposrStatus?.status === "succeeded") {
      toast.success("3D damage model ready!")
      setSelectedTripoSRTaskId(null)
      // Refetch damage reports to get updated status
      queryClient.invalidateQueries({ queryKey: ["damage-reports"] })
    } else if (triposrStatus?.status === "failed") {
      toast.error("3D model generation failed")
      setSelectedTripoSRTaskId(null)
    }
  }, [triposrStatus, queryClient])

  // Submit damage report mutation
  const submitDamageReportMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return submitTripoSRRequest(formData)
    },
    onSuccess: (triposrData) => {
      toast.success("Damage report submitted! 3D model generating...")
      // Start polling TripoSR status
      setSelectedTripoSRTaskId(triposrData.task_id)
      // Reset form
      setIsUploadDialogOpen(false)
      setUploadingPhotos([])
      setDamageDescription("")
      setDamageSeverity("moderate")
    },
    onError: (error) => {
      console.error("Error submitting damage report:", error)
      toast.error("Failed to submit damage report")
    }
  })

  // Select first vehicle by default
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0])
    }
  }, [vehicles, selectedVehicle])

  // Damage reports for selected vehicle
  const vehicleDamageReports = damageReportsData?.filter(
    (report) => report.vehicle_id === selectedVehicle?.id
  ) || []

  // Inspections for selected vehicle
  const vehicleInspections = inspections?.filter(
    (inspection) => inspection.vehicle_id === selectedVehicle?.id
  ) || []

  // Photo upload handler
  const onDrop = (acceptedFiles: File[]) => {
    setUploadingPhotos(acceptedFiles)
    toast.success(`${acceptedFiles.length} photo(s) uploaded`)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"]
    },
    multiple: true
  })

  // Submit damage report with TripoSR processing
  const handleSubmitDamageReport = async () => {
    if (!selectedVehicle || uploadingPhotos.length === 0) {
      toast.error("Please select a vehicle and upload photos")
      return
    }

    // Upload photos to Azure Blob Storage (placeholder)
    const photoUrls: string[] = []

    // In production, upload to Azure Blob and get URLs
    for (const photo of uploadingPhotos) {
      // Placeholder - replace with actual Azure Blob upload
      const url = URL.createObjectURL(photo)
      photoUrls.push(url)
    }

    // Prepare FormData for TripoSR submission
    const formData = new FormData()
    formData.append("file", uploadingPhotos[0]) // Use first photo for 3D
    formData.append("remove_bg", "true")

    // Create damage report object
    const damageReport: Partial<DamageReport> = {
      vehicle_id: selectedVehicle.id,
      description: damageDescription,
      severity: damageSeverity,
      photos: photoUrls,
      triposr_status: "processing",
      reported_date: new Date().toISOString()
    }

    // Submit using mutation
    submitDamageReportMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Virtual Garage</h2>
          <p className="text-muted-foreground">
            Vehicle management with AI-powered damage reporting
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
                <DialogTitle>Report Vehicle Damage</DialogTitle>
                <DialogDescription>
                  Upload photos to generate a 3D damage model with TripoSR AI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Vehicle</Label>
                  <Select
                    value={selectedVehicle?.id}
                    onValueChange={(id) =>
                      setSelectedVehicle(vehicles?.find((v) => v.id === id) || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
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
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Damage Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleDamageReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleInspections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              3D Models Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicleDamageReports.filter((r) => r.triposr_status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vehicle Viewer</CardTitle>
                <CardDescription>
                  {viewMode === "vehicle"
                    ? "Vehicle information display"
                    : "Damage report visualization"}
                </CardDescription>
              </div>
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="vehicle">
                    <Car className="w-4 h-4 mr-2" />
                    Vehicle
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
              <VehicleDisplay
                vehicleData={viewMode === "vehicle" ? selectedVehicle : null}
                damageModel={
                  viewMode === "damage" ? selectedDamageReport?.triposr_model_url : undefined
                }
              />
            </div>
            {selectedVehicle && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Plate</p>
                    <p className="font-medium">{selectedVehicle.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedVehicle.department || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle List & Damage Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Vehicles</CardTitle>
            <CardDescription>Select a vehicle to view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingVehicles ? (
                <p className="text-sm text-muted-foreground">Loading vehicles...</p>
              ) : vehicles && vehicles.length > 0 ? (
                (vehicles || []).map((vehicle) => (
                  <Button
                    key={vehicle.id}
                    variant={selectedVehicle?.id === vehicle.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs opacity-70">{vehicle.license_plate}</div>
                    </div>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No vehicles found</p>
              )}
            </div>

            {vehicleDamageReports.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Damage Reports</h4>
                <div className="space-y-2">
                  {vehicleDamageReports.map((report) => (
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
                        <div className="text-sm">{report.description}</div>
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
