/**
 * Assets Hub Component
 * Phase 3: Safety and Assets Hubs Implementation
 *
 * Features:
 * - Vehicle/equipment location map
 * - Utilization heatmap
 * - Asset value/depreciation overlay
 * - Lifecycle/replacement planning
 * - Asset inventory panel
 * - ROI tracking metrics
 */

import {
  Barcode,
  TrendUp,
  CurrencyDollar,
  ChartLine,
  Calendar
} from "@phosphor-icons/react"
import { GoogleMap, LoadScript, Marker, HeatmapLayer } from "@react-google-maps/api"
import { useState, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AssetType, OperationalStatus } from "@/types/asset.types"

interface AssetMetrics {
  totalAssets: number
  activeAssets: number
  utilizationRate: number
  totalValue: number
  avgAge: number
  avgMileage: number
  maintenanceCost: number
  roi: number
  trend: "improving" | "stable" | "declining"
}

interface AssetUtilization {
  assetId: string
  assetName: string
  type: AssetType
  utilizationRate: number
  hoursUsed: number
  hoursAvailable: number
  revenue: number
  cost: number
  roi: number
}

interface AssetReplacement {
  assetId: string
  assetName: string
  type: string
  age: number
  condition: "excellent" | "good" | "fair" | "poor"
  replacementYear: number
  estimatedCost: number
  priority: "high" | "medium" | "low"
  reason: string
}

interface AssetLocation {
  id: string
  name: string
  type: AssetType
  location: {
    lat: number
    lng: number
  }
  status: OperationalStatus
  value: number
  utilizationRate: number
}

// Demo data
const demoAssetMetrics: AssetMetrics = {
  totalAssets: 127,
  activeAssets: 94,
  utilizationRate: 78.5,
  totalValue: 8450000,
  avgAge: 4.2,
  avgMileage: 42500,
  maintenanceCost: 245000,
  roi: 18.4,
  trend: "improving"
}

const demoAssetLocations: AssetLocation[] = [
  {
    id: "asset-001",
    name: "Ford F-150 #1001",
    type: "PICKUP_TRUCK",
    location: { lat: 30.4383, lng: -84.2807 },
    status: "IN_USE",
    value: 45000,
    utilizationRate: 85
  },
  {
    id: "asset-002",
    name: "Excavator CAT 320",
    type: "EXCAVATOR",
    location: { lat: 30.4550, lng: -84.2500 },
    status: "IN_USE",
    value: 250000,
    utilizationRate: 92
  },
  {
    id: "asset-003",
    name: "Mercedes Sprinter #2001",
    type: "CARGO_VAN",
    location: { lat: 30.4200, lng: -84.3100 },
    status: "AVAILABLE",
    value: 55000,
    utilizationRate: 65
  },
  {
    id: "asset-004",
    name: "Forklift Toyota 8FG",
    type: "FORKLIFT",
    location: { lat: 30.4400, lng: -84.2600 },
    status: "MAINTENANCE",
    value: 35000,
    utilizationRate: 45
  },
  {
    id: "asset-005",
    name: "Dump Truck Mack #3001",
    type: "DUMP_TRUCK",
    location: { lat: 30.4300, lng: -84.3000 },
    status: "IN_USE",
    value: 180000,
    utilizationRate: 88
  },
  {
    id: "asset-006",
    name: "Backhoe JCB 3CX",
    type: "BACKHOE",
    location: { lat: 30.4500, lng: -84.2700 },
    status: "AVAILABLE",
    value: 95000,
    utilizationRate: 72
  }
]

const demoUtilization: AssetUtilization[] = [
  {
    assetId: "asset-002",
    assetName: "Excavator CAT 320",
    type: "EXCAVATOR",
    utilizationRate: 92,
    hoursUsed: 184,
    hoursAvailable: 200,
    revenue: 45000,
    cost: 12000,
    roi: 275
  },
  {
    assetId: "asset-005",
    assetName: "Dump Truck Mack #3001",
    type: "DUMP_TRUCK",
    utilizationRate: 88,
    hoursUsed: 176,
    hoursAvailable: 200,
    revenue: 38000,
    cost: 9500,
    roi: 300
  },
  {
    assetId: "asset-001",
    assetName: "Ford F-150 #1001",
    type: "PICKUP_TRUCK",
    utilizationRate: 85,
    hoursUsed: 170,
    hoursAvailable: 200,
    revenue: 15000,
    cost: 4200,
    roi: 257
  },
  {
    assetId: "asset-006",
    assetName: "Backhoe JCB 3CX",
    type: "BACKHOE",
    utilizationRate: 72,
    hoursUsed: 144,
    hoursAvailable: 200,
    revenue: 28000,
    cost: 8500,
    roi: 229
  },
  {
    assetId: "asset-003",
    assetName: "Mercedes Sprinter #2001",
    type: "CARGO_VAN",
    utilizationRate: 65,
    hoursUsed: 130,
    hoursAvailable: 200,
    revenue: 12000,
    cost: 3800,
    roi: 216
  },
  {
    assetId: "asset-004",
    assetName: "Forklift Toyota 8FG",
    type: "FORKLIFT",
    utilizationRate: 45,
    hoursUsed: 90,
    hoursAvailable: 200,
    revenue: 8000,
    cost: 2500,
    roi: 220
  }
]

const demoReplacements: AssetReplacement[] = [
  {
    assetId: "asset-101",
    assetName: "Ford F-350 #1025",
    type: "Heavy Truck",
    age: 12,
    condition: "poor",
    replacementYear: 2026,
    estimatedCost: 75000,
    priority: "high",
    reason: "High maintenance costs, safety concerns, reliability issues"
  },
  {
    assetId: "asset-102",
    assetName: "Bulldozer CAT D6",
    type: "Heavy Equipment",
    age: 10,
    condition: "fair",
    replacementYear: 2026,
    estimatedCost: 450000,
    priority: "high",
    reason: "Approaching end of useful life, parts becoming scarce"
  },
  {
    assetId: "asset-103",
    assetName: "Chevrolet Silverado #1045",
    type: "Light Truck",
    age: 8,
    condition: "good",
    replacementYear: 2027,
    estimatedCost: 55000,
    priority: "medium",
    reason: "Normal replacement cycle, technology upgrades available"
  },
  {
    assetId: "asset-104",
    assetName: "Generator Caterpillar 500kW",
    type: "Specialty Equipment",
    age: 7,
    condition: "good",
    replacementYear: 2028,
    estimatedCost: 125000,
    priority: "low",
    reason: "Preventive replacement, efficiency improvements"
  }
]

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const mapCenter = {
  lat: 30.4383,
  lng: -84.2807
}

const getStatusColor = (status: OperationalStatus): string => {
  switch (status) {
    case "AVAILABLE": return "#22c55e"
    case "IN_USE": return "#3b82f6"
    case "MAINTENANCE": return "#f59e0b"
    case "RESERVED": return "#8b5cf6"
    default: return "#6b7280"
  }
}

const getUtilizationColor = (rate: number): string => {
  if (rate >= 80) return "text-green-500"
  if (rate >= 60) return "text-blue-500"
  if (rate >= 40) return "text-yellow-500"
  return "text-red-500"
}

const getConditionBadge = (condition: string) => {
  switch (condition) {
    case "excellent": return <Badge className="bg-green-500">Excellent</Badge>
    case "good": return <Badge className="bg-blue-500">Good</Badge>
    case "fair": return <Badge className="bg-yellow-500">Fair</Badge>
    case "poor": return <Badge variant="destructive">Poor</Badge>
    default: return <Badge variant="outline">{condition}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high": return <Badge variant="destructive">High</Badge>
    case "medium": return <Badge className="bg-yellow-500">Medium</Badge>
    case "low": return <Badge variant="outline">Low</Badge>
    default: return <Badge variant="outline">{priority}</Badge>
  }
}

export function AssetsHub() {
  const [activeTab, setActiveTab] = useState("location")
  const [_categoryFilter, _setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mapLoaded, setMapLoaded] = useState(false)

  const filteredAssets = useMemo(() => {
    return demoAssetLocations.filter(asset => {
      if (statusFilter !== "all" && asset.status !== statusFilter) return false
      return true
    })
  }, [statusFilter])

  // Prepare heatmap data for utilization visualization
  const heatmapData = useMemo(() => {
    if (!mapLoaded) return []
    return demoAssetLocations.map(asset => ({
      location: new window.google.maps.LatLng(asset.location.lat, asset.location.lng),
      weight: asset.utilizationRate
    }))
  }, [mapLoaded])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Barcode className="w-6 h-6 text-blue-500" />
              Assets Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Asset tracking, utilization analysis, and lifecycle management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <ChartLine className="w-4 h-4 mr-2" />
              Analytics Report
            </Button>
            <Button>
              <Barcode className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Asset Metrics Cards */}
      <div className="px-6 py-4 border-b bg-card">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Asset Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  ${(demoAssetMetrics.totalValue / 1000000).toFixed(2)}M
                </div>
                <TrendUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {demoAssetMetrics.totalAssets} total assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilization Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {demoAssetMetrics.utilizationRate}%
              </div>
              <Progress value={demoAssetMetrics.utilizationRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {demoAssetMetrics.activeAssets} assets in use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-green-500">
                  {demoAssetMetrics.roi}%
                </div>
                <TrendUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +2.4% from last quarter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maintenance Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                ${(demoAssetMetrics.maintenanceCost / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                2.9% of total asset value
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 h-full">
          {/* LEFT: Map */}
          <div className="border-r relative">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="location">Asset Locations</TabsTrigger>
                <TabsTrigger value="utilization">Utilization Heatmap</TabsTrigger>
                <TabsTrigger value="value">Asset Value Overlay</TabsTrigger>
              </TabsList>

              <TabsContent value="location" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {mapLoaded && filteredAssets.map(asset => (
                      <Marker
                        key={asset.id}
                        position={{ lat: asset.location.lat, lng: asset.location.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 10,
                          fillColor: getStatusColor(asset.status),
                          fillOpacity: 0.8,
                          strokeColor: "#fff",
                          strokeWeight: 2
                        }}
                        title={`${asset.name} - ${asset.status}`}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>

              <TabsContent value="utilization" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey} libraries={["visualization"]}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {mapLoaded && heatmapData.length > 0 && (
                      <HeatmapLayer
                        data={heatmapData}
                        options={{
                          radius: 20,
                          opacity: 0.6
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>

              <TabsContent value="value" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {mapLoaded && filteredAssets.map(asset => (
                      <Marker
                        key={asset.id}
                        position={{ lat: asset.location.lat, lng: asset.location.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: Math.min(Math.max(asset.value / 100000 * 5, 8), 20),
                          fillColor: "#10b981",
                          fillOpacity: 0.7,
                          strokeColor: "#fff",
                          strokeWeight: 1
                        }}
                        title={`${asset.name} - $${asset.value.toLocaleString()}`}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Data Panels */}
          <div className="h-full overflow-auto">
            <Tabs defaultValue="inventory" className="flex flex-col h-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="utilization">Utilization</TabsTrigger>
                <TabsTrigger value="replacement">Replacement</TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="m-0 p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Asset Inventory</h2>
                    <div className="w-64">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="IN_USE">In Use</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="RESERVED">Reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Utilization</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssets.map(asset => (
                            <TableRow key={asset.id}>
                              <TableCell className="font-medium">{asset.name}</TableCell>
                              <TableCell>{asset.type}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getStatusColor(asset.status) }}
                                  />
                                  {asset.status}
                                </div>
                              </TableCell>
                              <TableCell>${asset.value.toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={getUtilizationColor(asset.utilizationRate)}>
                                  {asset.utilizationRate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="utilization" className="m-0 p-4">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Asset Utilization</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Utilization</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demoUtilization.map(asset => (
                            <TableRow key={asset.assetId}>
                              <TableCell className="font-medium">{asset.assetName}</TableCell>
                              <TableCell>{asset.type}</TableCell>
                              <TableCell>
                                <span className={getUtilizationColor(asset.utilizationRate)}>
                                  {asset.utilizationRate}%
                                </span>
                              </TableCell>
                              <TableCell>
                                {asset.hoursUsed}/{asset.hoursAvailable}
                              </TableCell>
                              <TableCell>${asset.revenue.toLocaleString()}</TableCell>
                              <TableCell className={asset.roi > 0 ? "text-green-500" : "text-red-500"}>
                                {asset.roi}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="replacement" className="m-0 p-4">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Replacement Planning</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Replace By</TableHead>
                            <TableHead>Priority</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {demoReplacements.map(asset => (
                            <TableRow key={asset.assetId}>
                              <TableCell className="font-medium">{asset.assetName}</TableCell>
                              <TableCell>{asset.type}</TableCell>
                              <TableCell>{asset.age} yrs</TableCell>
                              <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                              <TableCell>{asset.replacementYear}</TableCell>
                              <TableCell>{getPriorityBadge(asset.priority)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}