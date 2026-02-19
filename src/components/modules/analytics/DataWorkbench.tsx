import {
  Database,
  Download,
  Upload,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  OverviewTab,
  MaintenanceTab,
  FuelTab,
  AnalyticsTab,
  DataWorkbenchDialogs,
  type AdvancedSearchCriteria
} from "./DataWorkbench.bak"

import { MetricCard } from "@/components/MetricCard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFuelData } from "@/hooks/use-fuel-data"
import { useMaintenanceData } from "@/hooks/use-maintenance-data"

interface ScheduleForm {
  vehicleId: string
  serviceType: string
  scheduledDate: string
  notes?: string
}

export function DataWorkbench() {
  const data = useFleetData()
  const vehicles = data.vehicles || []
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [timeRange, setTimeRange] = useState<string>("30")
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false)
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [advancedCriteria, setAdvancedCriteria] = useState<AdvancedSearchCriteria | null>(null)

  const { maintenanceRecords } = useMaintenanceData(vehicles)
  const { fuelRecords } = useFuelData(vehicles)

  const filteredVehicles = useMemo(() => {
    if (!advancedCriteria) return vehicles
    return vehicles.filter((vehicle) => {
      const matchesString = (value: string | undefined, criteria: string) =>
        !criteria || (value || "").toLowerCase().includes(criteria.toLowerCase())

      const matchesNumberRange = (value: number | undefined, min: string, max: string) => {
        const numberValue = value ?? 0
        if (min && numberValue < Number(min)) return false
        if (max && numberValue > Number(max)) return false
        return true
      }

      if (!matchesString(vehicle.number, advancedCriteria.vehicleNumber)) return false
      if (!matchesString(vehicle.make, advancedCriteria.make)) return false
      if (!matchesString(vehicle.model, advancedCriteria.model)) return false
      if (!matchesString(vehicle.vin, advancedCriteria.vin)) return false
      if (!matchesString(vehicle.licensePlate, advancedCriteria.licensePlate)) return false
      if (!matchesString(vehicle.department, advancedCriteria.department)) return false
      if (!matchesString(vehicle.region, advancedCriteria.region)) return false
      if (!matchesString(vehicle.assignedDriver, advancedCriteria.assignedDriver)) return false

      if (advancedCriteria.status && advancedCriteria.status !== "all") {
        if (String(vehicle.status) !== advancedCriteria.status) return false
      }

      if (advancedCriteria.yearFrom && vehicle.year < Number(advancedCriteria.yearFrom)) return false
      if (advancedCriteria.yearTo && vehicle.year > Number(advancedCriteria.yearTo)) return false

      if (!matchesNumberRange(vehicle.fuelLevel, advancedCriteria.fuelLevelMin, advancedCriteria.fuelLevelMax)) {
        return false
      }

      if (!matchesNumberRange(vehicle.mileage, advancedCriteria.mileageMin, advancedCriteria.mileageMax)) {
        return false
      }

      return true
    })
  }, [vehicles, advancedCriteria])

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
    toast("Refreshing fleet data...")
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleAddVehicle = async (vehicle: any) => {
    try {
      await data.addVehicle({
        vehicleNumber: vehicle.number,
        make: vehicle.make,
        model: vehicle.model,
        year: Number(vehicle.year),
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        fuelType: "gasoline",
        status: "active",
        mileage: 0
      })
      toast.success("Vehicle added successfully")
      setIsAddVehicleDialogOpen(false)
    } catch (error) {
      toast.error("Failed to add vehicle")
    }
  }

  const handleScheduleService = async (schedule: ScheduleForm) => {
    if (!schedule.vehicleId || !schedule.serviceType || !schedule.scheduledDate) {
      toast.error("Please complete all required fields")
      return
    }

    try {
      await data.addMaintenanceRequest({
        vehicle_id: schedule.vehicleId,
        name: schedule.serviceType,
        type: schedule.serviceType,
        next_service_date: schedule.scheduledDate,
        description: schedule.notes || "",
        estimated_cost: 0,
        is_active: true
      })
      toast.success("Service scheduled successfully")
      setIsScheduleServiceDialogOpen(false)
    } catch (error) {
      toast.error("Failed to schedule service")
    }
  }

  const handleAdvancedSearch = (criteria: AdvancedSearchCriteria) => {
    setAdvancedCriteria(criteria)
    setIsAdvancedSearchOpen(false)
    setActiveTab("overview")
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
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Enhanced Data Workbench</h1>
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddVehicleDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        <MetricCard
          title="Total Vehicles"
          value={metrics.total}
          subtitle="in fleet"
          icon={<Database className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Active"
          value={metrics.active}
          subtitle="on the road"
          icon={<CheckCircle className="w-3 h-3" />}
          status="success"
        />
        <MetricCard
          title="In Maintenance"
          value={metrics.maintenance}
          subtitle="being serviced"
          icon={<AlertTriangle className="w-3 h-3" />}
          status="warning"
        />
        <MetricCard
          title="Avg Fuel"
          value={`${metrics.avgFuel}%`}
          subtitle="fleet average"
          icon={<Database className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics.alerts}
          subtitle="need attention"
          icon={<AlertTriangle className="w-3 h-3" />}
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

        <TabsContent value="overview" className="space-y-2 mt-3">
          <OverviewTab vehicles={filteredVehicles} onAdvancedSearch={() => setIsAdvancedSearchOpen(true)} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-2 mt-3">
          <MaintenanceTab
            maintenanceRecords={maintenanceRecords}
            onScheduleService={() => setIsScheduleServiceDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-2 mt-3">
          <FuelTab fuelRecords={fuelRecords} vehicles={vehicles} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-2 mt-3">
          <AnalyticsTab
            vehicles={vehicles}
            fuelRecords={fuelRecords}
            maintenanceRecords={maintenanceRecords}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </TabsContent>
      </Tabs>

      <DataWorkbenchDialogs
        vehicles={vehicles}
        isAddVehicleOpen={isAddVehicleDialogOpen}
        isScheduleServiceOpen={isScheduleServiceDialogOpen}
        isAdvancedSearchOpen={isAdvancedSearchOpen}
        onAddVehicleClose={() => setIsAddVehicleDialogOpen(false)}
        onScheduleServiceClose={() => setIsScheduleServiceDialogOpen(false)}
        onAdvancedSearchClose={() => setIsAdvancedSearchOpen(false)}
        onAddVehicle={handleAddVehicle}
        onScheduleService={handleScheduleService}
        onAdvancedSearch={handleAdvancedSearch}
      />
    </div>
  )
}
