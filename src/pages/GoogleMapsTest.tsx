import { GoogleMap } from "@/components/GoogleMap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVehicles } from "@/hooks/use-api"

export default function GoogleMapsTestPage() {
  const { data: vehiclesData, isLoading } = useVehicles()

  const vehicles = vehiclesData?.data || []

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Maps Test - Real Google Maps Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            This page demonstrates the actual Google Maps JavaScript API integration
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span>API Key: ✅ Configured</span>
              <span>Vehicles: {isLoading ? "Loading..." : `${vehicles.length} loaded`}</span>
            </div>

            {/* Real Google Maps Component */}
            <div className="h-[600px] w-full border rounded-lg overflow-hidden">
              <GoogleMap
                vehicles={vehicles}
                showVehicles={true}
                center={[-84.2807, 30.4383]} // Tallahassee, FL [lng, lat]
                zoom={12}
                mapStyle="roadmap"
                onReady={() => console.log("Google Maps loaded successfully!")}
                onError={(error) => console.error("Google Maps error:", error)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Google Maps API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p>Center: Tallahassee, FL (30.4383°N, 84.2807°W)</p>
              <p>Vehicles with GPS: {vehicles.filter((v: any) => v.latitude && v.longitude).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
