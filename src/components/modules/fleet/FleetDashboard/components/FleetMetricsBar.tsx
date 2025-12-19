import { Car, Wrench, BatteryLow, Warning } from "@phosphor-icons/react"

import { Card } from "@/components/ui/card"

interface FleetMetricsBarProps {
  totalVehicles: number
  activeVehicles: number
  inService: number
  lowFuelVehicles: number
  criticalAlerts: number
  onMetricClick?: (metricType: string, filter: any, label: string) => void
}

export function FleetMetricsBar({
  totalVehicles,
  activeVehicles,
  inService,
  lowFuelVehicles,
  criticalAlerts,
  onMetricClick
}: FleetMetricsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() =>
          onMetricClick?.(
            "total",
            {},
            `All Vehicles (${totalVehicles})`
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalVehicles}</p>
            <p className="text-xs text-muted-foreground">Total Vehicles</p>
          </div>
        </div>
      </Card>

      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() =>
          onMetricClick?.(
            "status",
            { status: "active" },
            `Active Vehicles (${activeVehicles})`
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Car className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeVehicles}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
      </Card>

      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() =>
          onMetricClick?.(
            "status",
            { status: "service" },
            `In Service (${inService})`
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Wrench className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{inService}</p>
            <p className="text-xs text-muted-foreground">In Service</p>
          </div>
        </div>
      </Card>

      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() =>
          onMetricClick?.(
            "fuel",
            { fuelLevel: "<25" },
            `Low Fuel (${lowFuelVehicles})`
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <BatteryLow className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{lowFuelVehicles}</p>
            <p className="text-xs text-muted-foreground">Low Fuel</p>
          </div>
        </div>
      </Card>

      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() =>
          onMetricClick?.(
            "alerts",
            { alertType: "critical" },
            `Critical Alerts (${criticalAlerts})`
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Warning className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{criticalAlerts}</p>
            <p className="text-xs text-muted-foreground">Alerts</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
