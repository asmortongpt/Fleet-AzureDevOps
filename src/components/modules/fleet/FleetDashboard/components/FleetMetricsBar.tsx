import { Car, Wrench, BatteryLow, Warning } from "@phosphor-icons/react"

import { MetricsBar } from "@/components/shared/MetricCard"

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
  const metrics = [
    {
      label: "Total Vehicles",
      value: totalVehicles,
      icon: <Car className="w-5 h-5" />,
      variant: "primary" as const,
      onClick: () => onMetricClick?.("total", {}, `All Vehicles (${totalVehicles})`),
      testId: "total-vehicles"
    },
    {
      label: "Active",
      value: activeVehicles,
      icon: <Car className="w-5 h-5" />,
      variant: "success" as const,
      onClick: () => onMetricClick?.("status", { status: "active" }, `Active Vehicles (${activeVehicles})`),
      testId: "active-vehicles"
    },
    {
      label: "In Service",
      value: inService,
      icon: <Wrench className="w-5 h-5" />,
      variant: "warning" as const,
      onClick: () => onMetricClick?.("status", { status: "service" }, `In Service (${inService})`),
      testId: "maintenance-due"
    },
    {
      label: "Low Fuel",
      value: lowFuelVehicles,
      icon: <BatteryLow className="w-5 h-5" />,
      variant: "destructive" as const,
      onClick: () => onMetricClick?.("fuel", { fuelLevel: "<25" }, `Low Fuel (${lowFuelVehicles})`),
      testId: "fuel-efficiency"
    },
    {
      label: "Alerts",
      value: criticalAlerts,
      icon: <Warning className="w-5 h-5" />,
      variant: "destructive" as const,
      onClick: () => onMetricClick?.("alerts", { alertType: "critical" }, `Critical Alerts (${criticalAlerts})`),
      testId: "critical-alerts"
    }
  ]

  return <MetricsBar metrics={metrics} columns={{ base: 2, sm: 3, lg: 5 }} testId="fleet-metrics" />
}
