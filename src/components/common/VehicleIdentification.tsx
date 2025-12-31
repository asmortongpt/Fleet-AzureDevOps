import {
  QrCode,
  Barcode,
  Camera,
  MagnifyingGlass,
  CarProfile,
  Check,
  X
} from "@phosphor-icons/react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"
import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import apiClient from "@/lib/api-client"
import logger from '@/utils/logger';

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

interface ApiResponse {
  vehicle?: VehicleInfo
  vehicles?: VehicleInfo[]
}

// QR Scanner Component with real camera integration
function QRScannerView({
  onScan,
  onClose
}: {
  onScan: (data: string) => void
  onClose: () => void
}) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
    }

    scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false)

    scannerRef.current.render(
      (decodedText) => {
        // Success callback
        logger.info("QR Code scanned:", decodedText)
        onScan(decodedText)
        scannerRef.current?.clear()
      },
      (errorMessage) => {
        // Error callback - ignore frame parsing errors
        if (!errorMessage.includes('No QR code found')) {
          logger.debug("QR scan error:", errorMessage)
        }
      }
    )

    setIsInitialized(true)

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore cleanup errors
        })
      }
    }
  }, [onScan])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Camera Scanner</h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div id="qr-reader" className="w-full" />

      {!isInitialized && (
        <div className="text-center py-8 text-muted-foreground">
          Initializing camera...
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Position the QR code or barcode within the frame
      </p>
    </div>
  )
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
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showVINScanner, setShowVINScanner] = useState(false)
  const [showPlateScanner, setShowPlateScanner] = useState(false)

  const handleVINLookup = async () => {
    if (!vinInput.trim()) {
      toast.error("Please enter a VIN")
      return
    }

    try {
      setLoading(true)
      const response: ApiResponse = await apiClient.get("/api/vehicle-identification/vin", {
        method: "POST",
        body: JSON.stringify({ vin: vinInput })
      })

      if (response.vehicle) {
        onVehicleSelected(response.vehicle)
        setOpen(false)
        toast.success("Vehicle identified successfully")
      }
    } catch (error: unknown) {
      logger.error("Error identifying vehicle:", error)
      toast.error(error instanceof Error ? error.message : "Vehicle not found")
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
      const response: ApiResponse = await apiClient.get("/api/vehicle-identification/license-plate", {
        method: "POST",
        body: JSON.stringify({ licensePlate: plateInput })
      })

      if (response.vehicle) {
        onVehicleSelected(response.vehicle)
        setOpen(false)
        toast.success("Vehicle identified successfully")
      }
    } catch (error: unknown) {
      logger.error("Error identifying vehicle:", error)
      toast.error(error instanceof Error ? error.message : "Vehicle not found")
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
      const response: ApiResponse = await apiClient.get(`/api/vehicle-identification/search?q=${encodeURIComponent(searchInput)}`)

      setSearchResults(response.vehicles || [])
    } catch (error: unknown) {
      logger.error("Error searching vehicles:", error)
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

  // Handle QR code scan result
  const handleQRScanResult = useCallback(async (data: string) => {
    setShowQRScanner(false)
    setLoading(true)
    toast.info("QR Code detected, looking up vehicle...")

    try {
      // Try to parse as JSON first (structured QR code)
      let vehicleId = data
      try {
        const parsed = JSON.parse(data)
        vehicleId = parsed.vehicleId || parsed.id || data
      } catch {
        // Not JSON, use raw value
      }

      const response: ApiResponse = await apiClient.get(`/api/vehicle-identification/qr/${encodeURIComponent(vehicleId)}`)

      if (response.vehicle) {
        onVehicleSelected(response.vehicle)
        setOpen(false)
        toast.success("Vehicle identified via QR code")
      } else {
        toast.error("No vehicle found for this QR code")
      }
    } catch (error: unknown) {
      logger.error("QR lookup error:", error)
      toast.error("Failed to identify vehicle from QR code")
    } finally {
      setLoading(false)
    }
  }, [onVehicleSelected, setOpen])

  // Handle VIN barcode scan result
  const handleVINScanResult = useCallback((data: string) => {
    setShowVINScanner(false)
    // VIN is 17 characters, often encoded in Code 39 or Code 128
    const cleanVin = data.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()
    if (cleanVin.length === 17) {
      setVinInput(cleanVin)
      toast.success("VIN barcode scanned successfully")
    } else {
      toast.warning("Scanned value doesn't appear to be a valid VIN. Please verify.")
      setVinInput(data)
    }
  }, [])

  // Handle License plate scan result
  const handlePlateScanResult = useCallback((data: string) => {
    setShowPlateScanner(false)
    setPlateInput(data.toUpperCase())
    toast.success("Code scanned - please verify plate number")
  }, [])

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
                {showQRScanner ? (
                  <QRScannerView
                    onScan={handleQRScanResult}
                    onClose={() => setShowQRScanner(false)}
                  />
                ) : (
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
                      <Button onClick={() => setShowQRScanner(true)} disabled={loading}>
                        <Camera className="w-4 h-4 mr-2" />
                        Open Camera Scanner
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vin" className="space-y-4">
                {showVINScanner ? (
                  <QRScannerView
                    onScan={handleVINScanResult}
                    onClose={() => setShowVINScanner(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Button variant="outline" onClick={() => setShowVINScanner(true)}>
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
                )}
              </TabsContent>

              <TabsContent value="plate" className="space-y-4">
                {showPlateScanner ? (
                  <QRScannerView
                    onScan={handlePlateScanResult}
                    onClose={() => setShowPlateScanner(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Button variant="outline" onClick={() => setShowPlateScanner(true)}>
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Plate Code
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Scans barcode/QR associated with plate
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
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}