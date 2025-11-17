import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  MapTrifold,
  Buildings,
  MapPin,
  Circle,
  CheckCircle,
  Warning,
  GasPump,
  Wrench,
  CarProfile
} from "@phosphor-icons/react"
import { MetricCard } from "@/components/MetricCard"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"
import { Vehicle, GISFacility } from "@/lib/types"
import { useFacilities } from "@/hooks/use-api"
import { UniversalMap } from "@/components/UniversalMap"

interface GISCommandCenterProps {
  data: ReturnType<typeof useFleetData>
}

export function GISCommandCenter({ data }: GISCommandCenterProps) {
  const vehicles = data.vehicles || []
  const { data: facilities = [] } = useFacilities()
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("map")
  const [layerVisibility, setLayerVisibility] = useState<{
    vehicles: boolean
    facilities: boolean
    routes: boolean
    traffic: boolean
    weather: boolean
    cameras: boolean
    incidents: boolean
    charging: boolean
    geofences: boolean
  }>({
    vehicles: true,
    facilities: true,
    routes: true,
    traffic: false,
    weather: false,
    cameras: false,
    incidents: false,
    charging: false,
    geofences: false
  })

  const regions = useMemo(() => {
    const regionSet = new Set(vehicles.map(v => v.region))
    return ["all", ...Array.from(regionSet)]
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    if (selectedRegion === "all") return vehicles
    return vehicles.filter(v => v.region === selectedRegion)
  }, [vehicles, selectedRegion])

  const filteredFacilities = useMemo(() => {
    if (selectedRegion === "all") return facilities
    return facilities.filter(f => f.region === selectedRegion)
  }, [facilities, selectedRegion])

  const metrics = useMemo(() => {
    const activeVehicles = filteredVehicles.filter(v => v.status === "active")
    const operationalFacilities = filteredFacilities.filter(f => f.status === "operational")
    const emergencyVehicles = filteredVehicles.filter(v => v.status === "emergency")
    const serviceVehicles = filteredVehicles.filter(v => v.status === "service")

    return {
      totalVehicles: filteredVehicles.length,
      active: activeVehicles.length,
      facilities: operationalFacilities.length,
      emergency: emergencyVehicles.length,
      inService: serviceVehicles.length
    }
  }, [filteredVehicles, filteredFacilities])

  const getStatusIcon = (status: Vehicle["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" weight="fill" />
      case "emergency":
        return <Warning className="w-4 h-4" weight="fill" />
      default:
        return <Circle className="w-4 h-4" weight="fill" />
    }
  }

  const getStatusColor = (status: Vehicle["status"]) => {
    const colors = {
      active: "text-success",
      idle: "text-muted-foreground",
      charging: "text-accent",
      service: "text-warning",
      emergency: "text-destructive",
      offline: "text-muted-foreground"
    }
    return colors[status]
  }

  const getFacilityIcon = (type: GISFacility["type"]) => {
    switch (type) {
      case "office":
        return <Buildings className="w-5 h-5" />
      case "depot":
        return <CarProfile className="w-5 h-5" />
      case "service-center":
        return <Wrench className="w-5 h-5" />
      case "fueling-station":
        return <GasPump className="w-5 h-5" />
    }
  }

  const toggleLayer = (layer: "vehicles" | "facilities" | "routes") => {
    const defaultLayers = { 
      vehicles: true, 
      facilities: true, 
      routes: true,
      traffic: false,
      weather: false,
      cameras: false,
      incidents: false,
      charging: false,
      geofences: false
    }
    setLayerVisibility(current => {
      const currentLayers = current || defaultLayers
      return {
        ...currentLayers,
        [layer]: !currentLayers[layer]
      }
    })
  }

  return (
    <div className="space-y-6">
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
            {regions.map(region => (
              <SelectItem key={region} value={region}>
                {region === "all" ? "All Regions" : region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Geographic Map View</CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={(layerVisibility || { vehicles: true, facilities: true, routes: true }).vehicles ? "default" : "outline"}
                  onClick={() => toggleLayer("vehicles")}
                >
                  Vehicles
                </Button>
                <Button 
                  size="sm" 
                  variant={(layerVisibility || { vehicles: true, facilities: true, routes: true }).facilities ? "default" : "outline"}
                  onClick={() => toggleLayer("facilities")}
                >
                  Facilities
                </Button>
                <Button 
                  size="sm" 
                  variant={(layerVisibility || { vehicles: true, facilities: true, routes: true }).routes ? "default" : "outline"}
                  onClick={() => toggleLayer("routes")}
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
                    showVehicles={(layerVisibility || { vehicles: true, facilities: true, routes: true }).vehicles}
                    showFacilities={(layerVisibility || { vehicles: true, facilities: true, routes: true }).facilities}
                    showRoutes={(layerVisibility || { vehicles: true, facilities: true, routes: true }).routes}
                    mapStyle={
                      activeTab === "satellite" ? "satellite_road_labels" :
                      activeTab === "terrain" ? "grayscale_dark" :
                      "road"
                    }
                    className="w-full h-full"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-success" weight="fill" />
                  <span className="text-sm">Active ({metrics.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-muted-foreground" weight="fill" />
                  <span className="text-sm">Idle ({filteredVehicles.filter(v => v.status === "idle").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-destructive" weight="fill" />
                  <span className="text-sm">Emergency ({metrics.emergency})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFacilities.slice(0, 6).map(facility => (
                  <div key={facility.id} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getFacilityIcon(facility.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{facility.name}</p>
                      <p className="text-xs text-muted-foreground">{facility.type.replace("-", " ")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{facility.address}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        facility.status === "operational" 
                          ? "bg-success/10 text-success border-success/20" 
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {facility.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Region Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage Area</span>
                  <span className="font-medium">
                    {selectedRegion === "all" ? "Statewide" : selectedRegion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicles</span>
                  <span className="font-medium">{filteredVehicles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facilities</span>
                  <span className="font-medium">{filteredFacilities.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">12 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region Status</span>
                  <Badge className="bg-success/10 text-success border-success/20">
                    Operational
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
