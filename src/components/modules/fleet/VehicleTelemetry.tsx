import { Gauge, Thermometer, Battery, Fuel, MapPin, Clock } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

interface TelemetryRecord {
  gps?: {
    latitude?: number
    longitude?: number
    speed?: number
    heading?: number
  }
  obd?: {
    rpm?: number
    speed?: number
    fuelLevel?: number
    engineTemp?: number
    coolantTemp?: number
    batteryVoltage?: number
  }
  speed?: number
  fuelLevel?: number
  batteryVoltage?: number
  engineTemp?: number
  coolantTemp?: number
  timestamp?: string
  address?: string
}

export function VehicleTelemetry() {
  const { data: vehiclesRaw, isLoading: vehiclesLoading } = useSWR<any[]>(
    "/api/emulator/vehicles",
    fetcher,
    { refreshInterval: 30000, shouldRetryOnError: false }
  )

  const vehicles = useMemo(() => (Array.isArray(vehiclesRaw) ? vehiclesRaw : []), [vehiclesRaw])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(String(vehicles[0].id))
    }
  }, [vehicles, selectedVehicleId])

  const { data: telemetryRaw, isLoading: telemetryLoading } = useSWR<TelemetryRecord>(
    selectedVehicleId ? `/api/emulator/vehicles/${selectedVehicleId}/telemetry` : null,
    fetcher,
    { refreshInterval: 5000, shouldRetryOnError: false }
  )

  const telemetry = telemetryRaw || {}
  const gps = telemetry.gps || {}
  const obd = telemetry.obd || {}

  const speed = obd.speed ?? gps.speed ?? telemetry.speed ?? 0
  const engineTemp = obd.engineTemp ?? obd.coolantTemp ?? telemetry.engineTemp ?? telemetry.coolantTemp
  const batteryVoltage = obd.batteryVoltage ?? telemetry.batteryVoltage
  const fuelLevel = obd.fuelLevel ?? telemetry.fuelLevel

  const locationText = gps.latitude && gps.longitude
    ? `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`
    : telemetry.address || "Location unavailable"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Telemetry</h1>
          <p className="text-muted-foreground">Real-time vehicle diagnostics and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {vehiclesLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : vehicles.length === 0 ? (
            <Badge variant="outline">No vehicles available</Badge>
          ) : (
            <Select value={selectedVehicleId ?? undefined} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.name || vehicle.number || `${vehicle.make} ${vehicle.model}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {telemetryLoading ? <Badge variant="secondary">Updating...</Badge> : <Badge>Live</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Speed</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{speed.toFixed(0)} mph</div>
            <p className="text-xs text-muted-foreground">Current speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engine Temp</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engineTemp ? `${engineTemp}°F` : "—"}</div>
            <p className="text-xs text-muted-foreground">Current reading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battery</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batteryVoltage ? `${batteryVoltage.toFixed(1)}V` : "—"}</div>
            <p className="text-xs text-muted-foreground">Voltage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fuel Level</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fuelLevel !== undefined ? `${fuelLevel.toFixed(0)}%` : "—"}</div>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{locationText}</div>
            <p className="text-xs text-muted-foreground">Last known position</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {telemetry.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Telemetry timestamp</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telemetry Stream</CardTitle>
          <CardDescription>Live data from connected vehicles</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px] flex items-center justify-center text-muted-foreground">
          {telemetryLoading ? "Waiting for telemetry updates..." : "Telemetry stream available via emulator or telematics integration."}
        </CardContent>
      </Card>
    </div>
  )
}
