import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock } from "lucide-react"
import { GoogleMapView } from "@/components/Maps/GoogleMapView"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vehicle } from "@/types/Vehicle"
import useSWR from "swr"
import { useMemo } from "react"

interface GpsRecord {
  id?: string
  vehicle_id?: string
  vehicle_number?: string
  vehicle_name?: string
  vehicle_status?: string
  motion_status?: string
  latitude?: number | string
  longitude?: number | string
  speed?: number | string
  address?: string
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((data) => data?.data ?? data)

export default function LiveTracking() {
  const { data, isLoading } = useSWR<GpsRecord[]>(
    "/api/gps?limit=200",
    fetcher,
    { refreshInterval: 15000, shouldRetryOnError: false }
  )

  const vehicles = useMemo(() => {
    const records = Array.isArray(data) ? data : []
    return records
      .map((record) => {
        const lat = record.latitude !== undefined ? Number(record.latitude) : undefined
        const lng = record.longitude !== undefined ? Number(record.longitude) : undefined
        if (lat === undefined || lng === undefined) return null

        const motion = (record.motion_status || "").toLowerCase()
        const status: Vehicle["status"] = motion === "moving"
          ? "active"
          : motion === "idle"
            ? "idle"
            : "offline"

        return {
          id: String(record.vehicle_id || record.id || "unknown"),
          tenantId: "",
          name: record.vehicle_name || record.vehicle_number || "Vehicle",
          number: record.vehicle_number || "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          vin: "",
          licensePlate: "",
          type: "truck",
          status,
          fuelLevel: 0,
          fuelType: "gasoline",
          mileage: 0,
          region: "",
          department: "",
          ownership: "owned",
          lastService: "",
          nextService: "",
          alerts: [],
          location: {
            lat,
            lng,
            latitude: lat,
            longitude: lng,
            address: record.address || ""
          }
        } as Vehicle
      })
      .filter(Boolean) as Vehicle[]
  }, [data])

  const activeCount = vehicles.filter((v) => v.status === "active").length
  const idleCount = vehicles.filter((v) => v.status === "idle").length
  const serviceCount = vehicles.filter((v) => v.status === "offline").length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Tracking</h2>
          <p className="text-muted-foreground">Real-time vehicle location monitoring</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Map</CardTitle>
            <CardDescription>Live vehicle positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg overflow-hidden">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <GoogleMapView
                  vehicles={vehicles}
                  zoom={6}
                  showClustering={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Vehicles</CardTitle>
            <CardDescription>{vehicles.length} vehicles tracked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      vehicle.status === "active" ? "bg-green-100" :
                      vehicle.status === "idle" ? "bg-yellow-100" : "bg-slate-100"
                    }`}>
                      <Navigation className={`h-4 w-4 ${
                        vehicle.status === "active" ? "text-green-600" :
                        vehicle.status === "idle" ? "text-yellow-600" : "text-slate-600"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{vehicle.name}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.number}</p>
                    </div>
                  </div>
                  <Badge variant={
                    vehicle.status === "active" ? "default" :
                    vehicle.status === "idle" ? "secondary" : "outline"
                  }>
                    {vehicle.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{activeCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{idleCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Idle</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{serviceCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Stopped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{vehicles.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Vehicles</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
