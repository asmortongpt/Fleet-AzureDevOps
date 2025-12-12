/**
 * GIS Command Center - Refactored
 * Geographic fleet monitoring and facility management
 */

import { Circle, CheckCircle, Warning, Wrench, CarProfile, Buildings } from "@phosphor-icons/react"
import { useMemo, useState } from "react"

import { FacilitiesSidebar } from "./gis/components/FacilitiesSidebar"
import { RegionSummary } from "./gis/components/RegionSummary"

import { MetricCard } from "@/components/MetricCard"
import { UniversalMap } from "@/components/UniversalMap"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFacilities } from "@/hooks/use-api"
import { useFleetData } from "@/hooks/use-fleet-data"


interface GISCommandCenterProps {
  data: ReturnType<typeof useFleetData>
}

export function GISCommandCenter() {
  const data = useFleetData()
  const vehicles = data.vehicles || []
  const { data: facilities = [] } = useFacilities()
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("map")
  const [layerVisibility, setLayerVisibility] = useState({
    vehicles: true,
    facilities: true,
    routes: true,
    traffic: false,
    weather: false,
    cameras: false,
    incidents: false,
    charging: false,
    geofences: false,
  })

  const regions = useMemo(() => {
    const regionSet = new Set(vehicles.map((v) => v.region))
    return ["all", ...Array.from(regionSet)]
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    if (selectedRegion === "all") return vehicles
    return vehicles.filter((v) => v.region === selectedRegion)
  }, [vehicles, selectedRegion])

  const filteredFacilities = useMemo(() => {
    if (selectedRegion === "all") return facilities
    return facilities.filter((f) => f.region === selectedRegion)
  }, [facilities, selectedRegion])

  const metrics = useMemo(() => {
    const activeVehicles = filteredVehicles.filter((v) => v.status === "active")
    const operationalFacilities = filteredFacilities.filter((f) => f.status === "operational")
    const emergencyVehicles = filteredVehicles.filter((v) => v.status === "emergency")
    const serviceVehicles = filteredVehicles.filter((v) => v.status === "service")

    return {
      totalVehicles: filteredVehicles.length,
      active: activeVehicles.length,
      facilities: operationalFacilities.length,
      emergency: emergencyVehicles.length,
      inService: serviceVehicles.length,
    }
  }, [filteredVehicles, filteredFacilities])

  const toggleLayer = (layer: "vehicles" | "facilities" | "routes") => {
    setLayerVisibility((current) => ({
      ...current,
      [layer]: !current[layer],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">GIS Command Center</h1>
          <p className="text-muted-foreground mt-1">Geographic fleet monitoring and facility management</p>
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region === "all" ? "All Regions" : region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard
          title="Total Vehicles"
          value={metrics.totalVehicles}
          subtitle="in region"
          icon={<CarProfile className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active"
          value={metrics.active}
          subtitle="on the move"
          icon={<CheckCircle className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Facilities"
          value={metrics.facilities}
          subtitle="operational"
          icon={<Buildings className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Emergency"
          value={metrics.emergency}
          subtitle="urgent response"
          icon={<Warning className="w-5 h-5" />}
          status="warning"
        />
        <MetricCard
          title="In Service"
          value={metrics.inService}
          subtitle="being serviced"
          icon={<Wrench className="w-5 h-5" />}
          status="info"
        />
      </div>

      {/* Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Geographic Map View</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={layerVisibility.vehicles ? "default" : "outline"}
                  onClick={() => toggleLayer("vehicles")} aria-label="Action button"
                >
                  Vehicles
                </Button>
                <Button
                  size="sm"
                  variant={layerVisibility.facilities ? "default" : "outline"}
                  onClick={() => toggleLayer("facilities")} aria-label="Action button"
                >
                  Facilities
                </Button>
                <Button
                  size="sm"
                  variant={layerVisibility.routes ? "default" : "outline"}
                  onClick={() => toggleLayer("routes")} aria-label="Action button"
                >
                  Routes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="satellite">Satellite</TabsTrigger>
                <TabsTrigger value="terrain">Terrain</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab || "map"} className="mt-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <UniversalMap
                    vehicles={filteredVehicles}
                    facilities={filteredFacilities}
                    showVehicles={layerVisibility.vehicles}
                    showFacilities={layerVisibility.facilities}
                    showRoutes={layerVisibility.routes}
                    mapStyle={
                      activeTab === "satellite" ? "satellite_road_labels" : activeTab === "terrain" ? "grayscale_dark" : "road"
                    }
                    className="w-full h-full"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-success" weight="fill" />
                  <span className="text-sm">Active ({metrics.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-muted-foreground" weight="fill" />
                  <span className="text-sm">Idle ({filteredVehicles.filter((v) => v.status === "idle").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-destructive" weight="fill" />
                  <span className="text-sm">Emergency ({metrics.emergency})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <FacilitiesSidebar facilities={filteredFacilities} />
          <RegionSummary
            selectedRegion={selectedRegion}
            vehicleCount={filteredVehicles.length}
            facilityCount={filteredFacilities.length}
          />
        </div>
      </div>
    </div>
  )
}
