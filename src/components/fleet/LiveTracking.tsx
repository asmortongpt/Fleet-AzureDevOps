import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock } from "lucide-react"
import { GoogleMapView } from "@/components/Maps/GoogleMapView"
import { useVehicles } from "@/hooks/use-api"
import { Skeleton } from "@/components/ui/skeleton"

export default function LiveTracking() {
  const { data, isLoading } = useVehicles()

  // Transform API data to match GoogleMapView expected format
  // API uses camelCase (licensePlate, fuelLevel) so we map accordingly
  const vehicles = (data || []).map((v: any) => ({
    id: v.id,
    name: v.name || `${v.make} ${v.model}`,
    number: v.licensePlate || v.license_plate, // Support both formats
    make: v.make,
    model: v.model,
    type: 'truck' as const,
    status: v.status === 'active' ? 'active' : v.status === 'maintenance' ? 'service' : 'idle',
    fuelLevel: typeof v.fuelLevel === 'string' ? parseFloat(v.fuelLevel) : (v.fuelLevel || v.fuel_level || 0),
    location: {
      lat: parseFloat(v.latitude || v.current_latitude) || 40.7128,
      lng: parseFloat(v.longitude || v.current_longitude) || -74.0060,
      address: v.location || 'Unknown'
    },
    driver: null
  }))

  const activeCount = vehicles.filter((v: any) => v.status === 'active').length
  const idleCount = vehicles.filter((v: any) => v.status === 'idle').length
  const serviceCount = vehicles.filter((v: any) => v.status === 'service').length

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
                  zoom={4}
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
              vehicles.map((vehicle: any) => (
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
            <p className="text-sm text-muted-foreground">In Service</p>
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
