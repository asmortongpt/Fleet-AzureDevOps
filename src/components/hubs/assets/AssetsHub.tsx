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
  TrendingUp,
  LineChart
} from "lucide-react"
import { GoogleMap, LoadScript, Marker, HeatmapLayer } from "@react-google-maps/api"
import { useState, useMemo } from "react"
import useSWR from "swr"

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
  maintenanceCost: number
  totalCost: number
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
  status: OperationalStatus | string
  value: number
  utilizationRate: number
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const mapCenter = {
  lat: 30.4383,
  lng: -84.2807
}

const getStatusColor = (status: OperationalStatus | string): string => {
  const normalized = (status || "").toString().toLowerCase()
  switch (normalized) {
    case "available":
      return "#22c55e"
    case "in_use":
    case "active":
      return "#3b82f6"
    case "maintenance":
      return "#f59e0b"
    case "reserved":
      return "#8b5cf6"
    case "inactive":
    case "retired":
    case "disposed":
      return "#6b7280"
    default:
      return "#6b7280"
  }
}

const getUtilizationColor = (rate: number): string => {
  if (rate >= 80) return "text-green-500"
  if (rate >= 60) return "text-blue-800"
  if (rate >= 40) return "text-yellow-500"
  return "text-red-500"
}

const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-red-500"
}

const getHealthScoreTextColor = (score: number): string => {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-yellow-500"
  if (score >= 40) return "text-orange-500"
  return "text-red-500"
}

const formatStatusLabel = (status: string) =>
  status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

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

  const { data: assetAnalytics = [], error: assetError } = useSWR<any[]>(
    "/api/assets/analytics",
    fetcher,
    { shouldRetryOnError: false }
  )

  const assets = Array.isArray(assetAnalytics) ? assetAnalytics : []

  const statusOptions = useMemo(() => {
    const values = new Set<string>()
    assets.forEach((asset: any) => {
      if (asset.status) values.add(asset.status)
    })
    return Array.from(values)
  }, [assets])

  const filteredAssets = useMemo(() => {
    return assets.filter((asset: any) => {
      if (statusFilter !== "all" && asset.status !== statusFilter) return false
      return true
    })
  }, [assets, statusFilter])

  const assetLocations: AssetLocation[] = useMemo(() => {
    return assets
      .filter((asset: any) => asset.facility_latitude && asset.facility_longitude)
      .map((asset: any) => ({
        id: asset.id,
        name: asset.asset_name || asset.name,
        type: (asset.asset_type || "OTHER") as AssetType,
        location: {
          lat: Number(asset.facility_latitude),
          lng: Number(asset.facility_longitude),
        },
        status: (asset.status || "AVAILABLE") as OperationalStatus,
        value: Number(asset.current_value || asset.purchase_price || 0),
        utilizationRate: Number(asset.utilization_percentage || 0)
      }))
  }, [assets])

  const filteredLocations = useMemo(() => {
    return assetLocations.filter((asset) => {
      if (statusFilter !== "all" && asset.status !== statusFilter) return false
      return true
    })
  }, [assetLocations, statusFilter])

  const metrics: AssetMetrics = useMemo(() => {
    const totalAssets = assets.length
    const activeAssets = assets.filter((asset: any) => {
      const status = (asset.status || "").toString().toLowerCase()
      return status === "active" || status === "in_use" || status === "available"
    }).length
    // Prefer actual uptime_percentage / uptime_hours when available, fall back to utilization_percentage
    const utilizationValues = assets
      .map((asset: any) => {
        const uptime = Number(asset.uptime_percentage || asset.uptimePercentage)
        if (Number.isFinite(uptime) && uptime > 0) return uptime
        return Number(asset.utilization_percentage)
      })
      .filter((value: number) => Number.isFinite(value) && value > 0)
    const utilizationRate = utilizationValues.length > 0
      ? utilizationValues.reduce((sum, v) => sum + v, 0) / utilizationValues.length
      : (totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0)

    const totalValue = assets.reduce(
      (sum: number, asset: any) => sum + Number(asset.current_value || asset.purchase_price || 0),
      0
    )

    const ages = assets
      .map((asset: any) => asset.purchase_date)
      .filter(Boolean)
      .map((date: string) => {
        const purchaseDate = new Date(date)
        if (Number.isNaN(purchaseDate.getTime())) return 0
        const years = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        return years
      })
      .filter((years: number) => years > 0)

    const avgAge = ages.length > 0 ? ages.reduce((sum, v) => sum + v, 0) / ages.length : 0

    const maintenanceCost = assets.reduce(
      (sum: number, asset: any) => sum + Number(asset.maintenance_cost || 0),
      0
    )

    const roiValues = assets
      .map((asset: any) => {
        const purchasePrice = Number(asset.purchase_price || 0)
        const currentValue = Number(asset.current_value || 0)
        if (!purchasePrice || !currentValue) return null
        return ((currentValue - purchasePrice) / purchasePrice) * 100
      })
      .filter((value: number | null) => typeof value === "number")
    const roi = roiValues.length > 0
      ? roiValues.reduce((sum, v) => sum + (v || 0), 0) / roiValues.length
      : 0

    const trend: AssetMetrics["trend"] = utilizationRate >= 70 ? "improving" : utilizationRate >= 50 ? "stable" : "declining"

    return {
      totalAssets,
      activeAssets,
      utilizationRate,
      totalValue,
      avgAge,
      avgMileage: 0,
      maintenanceCost,
      roi,
      trend
    }
  }, [assets])

  // Prepare heatmap data for utilization visualization
  const heatmapData = useMemo(() => {
    if (!mapLoaded) return []
    return filteredLocations.map(asset => ({
      location: new window.google.maps.LatLng(asset.location.lat, asset.location.lng),
      weight: asset.utilizationRate || 0
    }))
  }, [filteredLocations, mapLoaded])

  const utilizationRows: AssetUtilization[] = useMemo(() => {
    return assets.map((asset: any) => {
      // Prefer uptime-based values when available
      const uptime = Number(asset.uptime_percentage || asset.uptimePercentage)
      const utilPct = Number(asset.utilization_percentage || 0)
      const effectiveUtilization = (Number.isFinite(uptime) && uptime > 0) ? uptime : utilPct
      return {
        assetId: asset.id,
        assetName: asset.asset_name || asset.name,
        type: (asset.asset_type || asset.type || "OTHER") as AssetType,
        utilizationRate: effectiveUtilization,
        maintenanceCost: Number(asset.maintenance_cost || 0),
        totalCost: Number(asset.total_cost || 0),
        roi: (() => {
          const purchasePrice = Number(asset.purchase_price || 0)
          const currentValue = Number(asset.current_value || 0)
          if (!purchasePrice || !currentValue) return 0
          return Math.round(((currentValue - purchasePrice) / purchasePrice) * 100)
        })()
      }
    })
  }, [assets])

  const replacementRows: AssetReplacement[] = useMemo(() => {
    const now = new Date()
    return assets
      .map((asset: any) => {
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : null
        const age = purchaseDate && !Number.isNaN(purchaseDate.getTime())
          ? Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
          : 0
        const condition = (asset.condition || "good").toLowerCase()
        const replacementYear = purchaseDate ? purchaseDate.getFullYear() + 8 : now.getFullYear() + 1
        let priority: AssetReplacement["priority"] = "low"
        if (age >= 10 || condition === "poor") priority = "high"
        else if (age >= 7 || condition === "fair") priority = "medium"
        const reason = condition === "poor"
          ? "Condition below operational standard"
          : age >= 10
            ? "Exceeds recommended service life"
            : "Approaching replacement cycle"
        return {
          assetId: asset.id,
          assetName: asset.asset_name || asset.name,
          type: asset.asset_type || asset.type || "Other",
          age,
          condition: (condition as AssetReplacement["condition"]) || "good",
          replacementYear,
          estimatedCost: Number(asset.current_value || asset.purchase_price || 0),
          priority,
          reason
        }
      })
      .sort((a, b) => (a.priority === b.priority ? b.age - a.age : a.priority === "high" ? -1 : a.priority === "medium" && b.priority === "low" ? -1 : 1))
      .slice(0, 10)
  }, [assets])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Barcode className="w-4 h-4 text-blue-800" />
              Assets Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Asset tracking, utilization analysis, and lifecycle management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <LineChart className="w-4 h-4 mr-2" />
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
      <div className="px-3 py-2 border-b bg-card">
        {assetError && (
          <div className="mb-2 text-xs text-red-500">
            Failed to load asset analytics. Please refresh.
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Asset Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-base font-bold">
                  {metrics.totalValue > 0 ? `$${(metrics.totalValue / 1000000).toFixed(2)}M` : "—"}
                </div>
                {metrics.totalValue > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalAssets} total assets
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
              <div className="text-base font-bold text-blue-800">
                {metrics.utilizationRate > 0 ? `${metrics.utilizationRate.toFixed(1)}%` : "—"}
              </div>
              <Progress value={metrics.utilizationRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.activeAssets} assets in use
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
                <div className="text-base font-bold text-green-500">
                  {metrics.roi > 0 ? `${metrics.roi.toFixed(1)}%` : "—"}
                </div>
                {metrics.roi > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average ROI based on purchase price
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
              <div className="text-base font-bold text-orange-500">
                {metrics.maintenanceCost > 0 ? `$${(metrics.maintenanceCost / 1000).toFixed(0)}K` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Latest period maintenance spend
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
                    {mapLoaded && filteredLocations.map(asset => (
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
                    {mapLoaded && filteredLocations.map(asset => (
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

              <TabsContent value="inventory" className="m-0 p-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold">Asset Inventory</h2>
                    <div className="w-64">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatStatusLabel(status)}
                            </SelectItem>
                          ))}
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
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Health</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Utilization</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssets.map((asset: any) => {
                            const utilization = Number(asset.utilization_percentage || 0)
                            const utilizationLabel = utilization > 0 ? `${utilization.toFixed(1)}%` : "—"
                            const healthScore = Number(asset.health_score || asset.healthScore || 0)
                            const department = asset.department || asset.dept || "—"
                            return (
                            <TableRow key={asset.id}>
                              <TableCell className="font-medium">{asset.asset_name || asset.name}</TableCell>
                              <TableCell>{asset.asset_type || asset.type || "—"}</TableCell>
                              <TableCell className="text-sm">{department}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getStatusColor(asset.status) }}
                                  />
                                  {formatStatusLabel(asset.status || "unknown")}
                                </div>
                              </TableCell>
                              <TableCell>
                                {healthScore > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${getHealthScoreColor(healthScore)}`} />
                                    <span className={`text-sm font-medium ${getHealthScoreTextColor(healthScore)}`}>
                                      {healthScore}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {asset.current_value || asset.purchase_price
                                  ? `$${Number(asset.current_value || asset.purchase_price).toLocaleString()}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <span className={getUtilizationColor(utilization)}>
                                  {utilizationLabel}
                                </span>
                              </TableCell>
                            </TableRow>
                          )})}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="utilization" className="m-0 p-2">
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">Asset Utilization</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Utilization</TableHead>
                            <TableHead>Maintenance Cost</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {utilizationRows.map(asset => (
                            <TableRow key={asset.assetId}>
                              <TableCell className="font-medium">{asset.assetName}</TableCell>
                              <TableCell>{asset.type}</TableCell>
                              <TableCell>
                                <span className={getUtilizationColor(asset.utilizationRate)}>
                                  {asset.utilizationRate > 0 ? `${asset.utilizationRate.toFixed(1)}%` : "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {asset.maintenanceCost > 0 ? `$${asset.maintenanceCost.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell>{asset.totalCost > 0 ? `$${asset.totalCost.toLocaleString()}` : "—"}</TableCell>
                              <TableCell className={asset.roi > 0 ? "text-green-500" : "text-muted-foreground"}>
                                {asset.roi > 0 ? `${asset.roi}%` : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="replacement" className="m-0 p-2">
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">Replacement Planning</h2>
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
                          {replacementRows.map(asset => (
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
