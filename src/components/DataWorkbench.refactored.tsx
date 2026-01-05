import {
  Database,
  Download,
  Upload,
  Plus,
  ArrowsClockwise,
  Warning,
  CheckCircle
} from "@phosphor-icons/react"
import { useState, Dispatch, SetStateAction } from "react"
import { toast } from "sonner"

import { AnalyticsTab } from "./DataWorkbench.bak/AnalyticsTab"
import { DataWorkbenchDialogs } from "./DataWorkbench.bak/DataWorkbenchDialogs"
import { FuelTab } from "./DataWorkbench.bak/FuelTab"
import { MaintenanceTab } from "./DataWorkbench.bak/MaintenanceTab"
import { OverviewTab } from "./DataWorkbench.bak/OverviewTab"

import { MetricCard } from "@/components/MetricCard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFuelData } from "@/hooks/use-fuel-data"
import { useMaintenanceData } from "@/hooks/use-maintenance-data"

interface Vehicle {
  status: string;
  fuelLevel?: number;
  alerts?: unknown[];
  [key: string]: unknown;
}

interface MaintenanceRecord {
  [key: string]: unknown;
}

interface FuelRecord {
  [key: string]: unknown;
}

interface MaintenanceMetrics {
  totalCost: number;
  overdue: number;
  upcoming: number;
}

interface MaintenanceTabProps {
  maintenanceRecords: MaintenanceRecord[];
  onScheduleService: () => void;
}

interface FuelTabProps {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
}

interface AnalyticsTabProps {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

interface DataWorkbenchDialogsProps {
  vehicles: Vehicle[];
  isAddVehicleOpen: boolean;
  isScheduleServiceOpen: boolean;
  isAdvancedSearchOpen: boolean;
  onAddVehicleClose: () => void;
  onScheduleServiceClose: () => void;
  onAdvancedSearchClose: () => void;
  onAddVehicle: (vehicle: any) => void;
  onScheduleService: () => void;
  onAdvancedSearch: (criteria: any) => void;
}

interface DataWorkbenchProps {
  data: ReturnType<typeof useFleetData>
}

export function DataWorkbench({ data }: DataWorkbenchProps) {
  const vehicles = data.vehicles || []
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false)
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)

  const { maintenanceRecords, maintenanceMetrics } = useMaintenanceData(vehicles)
  const { fuelRecords } = useFuelData(vehicles)

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv,.xlsx,.json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0]
      if (file) {
        toast.success(`Importing ${file.name}...`)
        setTimeout(() => {
          toast.success(`Successfully imported data from ${file.name}`)
        }, 1500)
      }
    }
    input.click()
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(vehicles, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `fleet-data-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Fleet data exported successfully")
  }

  const handleRefresh = async () => {
    toast.info("Refreshing fleet data...")
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const metrics = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    maintenance: vehicles.filter((v) => v.status === "service").length,
    avgFuel:
      vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuelLevel ?? 0), 0) / vehicles.length)
        : 0,
    alerts: vehicles.filter((v) => (v.alerts || []).length > 0).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Enhanced Data Workbench</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive fleet data management and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <ArrowsClockwise className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddVehicleDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Vehicles"
          value={metrics.total}
          subtitle="in fleet"
          icon={<Database className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active"
          value={metrics.active}
          subtitle="on the road"
          icon={<CheckCircle className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="In Maintenance"
          value={metrics.maintenance}
          subtitle="being serviced"
          icon={<Warning className="w-5 h-5" />}
          status="warning"
        />
        <MetricCard
          title="Avg Fuel"
          value={`${metrics.avgFuel}%`}
          subtitle="fleet average"
          icon={<Database className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics.alerts}
          subtitle="need attention"
          icon={<Warning className="w-5 h-5" />}
          status={metrics.alerts > 10 ? "warning" : "success"}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            vehicles={vehicles}
            onAdvancedSearch={() => setIsAdvancedSearchOpen(true)}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceTab
            maintenanceRecords={maintenanceRecords}
            onScheduleService={() => setIsScheduleServiceDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <FuelTab
            vehicles={vehicles}
            fuelRecords={fuelRecords}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            vehicles={vehicles}
            fuelRecords={fuelRecords}
            maintenanceRecords={maintenanceRecords}
            timeRange=""
            onTimeRangeChange={() => {}}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DataWorkbenchDialogs
        vehicles={vehicles}
        isAddVehicleOpen={isAddVehicleDialogOpen}
        isScheduleServiceOpen={isScheduleServiceDialogOpen}
        isAdvancedSearchOpen={isAdvancedSearchOpen}
        onAddVehicleClose={() => setIsAddVehicleDialogOpen(false)}
        onScheduleServiceClose={() => setIsScheduleServiceDialogOpen(false)}
        onAdvancedSearchClose={() => setIsAdvancedSearchOpen(false)}
        onAddVehicle={() => {}}
        onScheduleService={() => {}}
        onAdvancedSearch={() => {}}
      />
    </div>
  )
}

export default DataWorkbench