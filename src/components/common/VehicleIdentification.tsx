import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  QrCode,
  Barcode,
  Camera,
  MagnifyingGlass,
  CarProfile,
  Check
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

export interface VehicleInfo {
  vehicleId: string
  vehicleNumber: string
  vin?: string
  licensePlate?: string
  make?: string
  model?: string
  year?: number
  qrCode?: string
}

interface VehicleIdentificationProps {
  onVehicleSelected: (vehicle: VehicleInfo) => void
  selectedVehicle?: VehicleInfo | null
  trigger?: React.ReactNode
}

export function VehicleIdentification({
  onVehicleSelected,
  selectedVehicle,
  trigger
}: VehicleIdentificationProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [vinInput, setVinInput] = useState("")
  const [plateInput, setPlateInput] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState<VehicleInfo[]>([])

  const handleVINLookup = async () => {
    if (!vinInput.trim()) {
      toast.error("Please enter a VIN")
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.get("/api/vehicle-identification/vin", {
        method: "POST",
        body: JSON.stringify({ vin: vinInput })
      })

      if (response.vehicle) {
        onVehicleSelected(response.vehicle)
        setOpen(false)
        toast.success("Vehicle identified successfully")
      }
    } catch (error: any) {
      console.error("Error identifying vehicle:", error)
      toast.error(error.message || "Vehicle not found")
    } finally {
      setLoading(false)
    }
  }

  const handleLicensePlateLookup = async () => {
    if (!plateInput.trim()) {
      toast.error("Please enter a license plate")
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.get("/api/vehicle-identification/license-plate", {
        method: "POST",
        body: JSON.stringify({ licensePlate: plateInput })
      })

      if (response.vehicle) {
        onVehicleSelected(response.vehicle)
        setOpen(false)
        toast.success("Vehicle identified successfully")
      }
    } catch (error: any) {
      console.error("Error identifying vehicle:", error)
      toast.error(error.message || "Vehicle not found")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.get(`/api/vehicle-identification/search?q=${encodeURIComponent(searchInput)}`)

      setSearchResults(response.vehicles || [])
    } catch (error) {
      console.error("Error searching vehicles:", error)
      toast.error("Failed to search vehicles")
    } finally {
      setLoading(false)
    }
  }

  const selectVehicle = (vehicle: VehicleInfo) => {
    onVehicleSelected(vehicle)
    setOpen(false)
    toast.success("Vehicle selected")
  }

  const handleQRScan = () => {
    toast.info("QR code scanner integration coming soon", {
      description: "Use browser camera API or dedicated QR scanner app"
    })
    // PRODUCTION TODO: Integrate with browser camera API or QR scanner library
    // Example: https://github.com/nimiq/qr-scanner
  }

  const handleVINScan = () => {
    toast.info("VIN barcode scanner coming soon", {
      description: "Use barcode scanner hardware or mobile app"
    })
    // PRODUCTION TODO: Integrate with barcode scanner hardware or library
  }

  const handlePlateScan = () => {
    toast.info("License plate OCR coming soon", {
      description: "Azure Computer Vision integration required for OCR"
    })
    // PRODUCTION TODO: Implement camera capture and Azure OCR integration
  }

  return (
    <div>
      {selectedVehicle ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" weight="bold" />
                <CardTitle className="text-sm text-green-700">Vehicle Selected</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
              >
                Change
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CarProfile className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{selectedVehicle.vehicleNumber}</span>
              </div>
              {selectedVehicle.make && selectedVehicle.model && (
                <div className="text-muted-foreground">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </div>
              )}
              {selectedVehicle.vin && (
                <div className="text-xs text-muted-foreground font-mono">
                  VIN: {selectedVehicle.vin}
                </div>
              )}
              {selectedVehicle.licensePlate && (
                <div className="text-xs text-muted-foreground">
                  Plate: {selectedVehicle.licensePlate}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="outline">
                <CarProfile className="w-4 h-4 mr-2" />
                Select Vehicle
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Identify Vehicle</DialogTitle>
              <DialogDescription>
                Scan QR code, VIN barcode, license plate, or search manually
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">
                  <MagnifyingGlass className="w-4 h-4 mr-1" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="qr">
                  <QrCode className="w-4 h-4 mr-1" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="vin">
                  <Barcode className="w-4 h-4 mr-1" />
                  VIN
                </TabsTrigger>
                <TabsTrigger value="plate">
                  <Camera className="w-4 h-4 mr-1" />
                  Plate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Vehicles</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Vehicle number, VIN, plate, make, model..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Results ({searchResults.length})</Label>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map(vehicle => (
                        <Card
                          key={vehicle.vehicleId}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => selectVehicle(vehicle)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold">{vehicle.vehicleNumber}</div>
                                {vehicle.make && vehicle.model && (
                                  <div className="text-sm text-muted-foreground">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {vehicle.vin && <div className="font-mono">VIN: {vehicle.vin}</div>}
                                  {vehicle.licensePlate && <div>Plate: {vehicle.licensePlate}</div>}
                                </div>
                              </div>
                              <CarProfile className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {searchInput && searchResults.length === 0 && !loading && (
                  <div className="text-center text-muted-foreground py-8">
                    No vehicles found matching "{searchInput}"
                  </div>
                )}
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Scan Vehicle QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use your device camera to scan the QR code affixed to the vehicle
                    </p>
                    <Button onClick={handleQRScan}>
                      <Camera className="w-4 h-4 mr-2" />
                      Open Scanner
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vin" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Button variant="outline" onClick={handleVINScan}>
                      <Barcode className="w-4 h-4 mr-2" />
                      Scan VIN Barcode
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or enter manually
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vin-input">VIN (17 characters)</Label>
                    <Input
                      id="vin-input"
                      placeholder="1HGBH41JXMN109186"
                      value={vinInput}
                      onChange={e => setVinInput(e.target.value.toUpperCase())}
                      onKeyPress={e => e.key === 'Enter' && handleVINLookup()}
                      maxLength={17}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      17 alphanumeric characters (excluding I, O, Q)
                    </p>
                  </div>

                  <Button onClick={handleVINLookup} disabled={loading || vinInput.length !== 17} className="w-full">
                    {loading ? "Looking up..." : "Identify Vehicle"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="plate" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Button variant="outline" onClick={handlePlateScan}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo of License Plate
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      AI will automatically read the plate number
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or enter manually
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plate-input">License Plate Number</Label>
                    <Input
                      id="plate-input"
                      placeholder="ABC1234"
                      value={plateInput}
                      onChange={e => setPlateInput(e.target.value.toUpperCase())}
                      onKeyPress={e => e.key === 'Enter' && handleLicensePlateLookup()}
                      className="font-mono"
                    />
                  </div>

                  <Button onClick={handleLicensePlateLookup} disabled={loading || !plateInput.trim()} className="w-full">
                    {loading ? "Looking up..." : "Identify Vehicle"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
