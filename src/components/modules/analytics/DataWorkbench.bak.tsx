import {
  Database,
  Download,
  Upload,
  Plus,
  ArrowsClockwise,
  Warning,
  CheckCircle
} from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

import { MetricCard } from "@/components/MetricCard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useDataWorkbenchData } from "@/hooks/useDataWorkbenchData"

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

interface AdvancedSearchCriteria {
  vehicleNumber: string;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  yearFrom: string;
  yearTo: string;
  status: string;
  department: string;
  region: string;
  assignedDriver: string;
  fuelLevelMin: string;
  fuelLevelMax: string;
  mileageMin: string;
  mileageMax: string;
}

interface DataWorkbenchProps {
  data: ReturnType<typeof useFleetData>
}

const OverviewTab = ({ vehicles, onAdvancedSearch }: { vehicles: any[]; onAdvancedSearch: () => void }) => {
  return (
    <div>
      {/* Placeholder for OverviewTab content */}
      <Button onClick={onAdvancedSearch}>Advanced Search</Button>
      <div>{vehicles?.length} vehicles</div>
    </div>
  );
};

const MaintenanceTab = ({ 
  maintenanceRecords, 
  filter, 
  onFilterChange, 
  onScheduleService 
}: { 
  maintenanceRecords: any[]; 
  filter: "all" | "upcoming" | "overdue" | "completed"; 
  onFilterChange: (filter: "all" | "upcoming" | "overdue" | "completed") => void;
  onScheduleService: () => void;
}) => {
  return (
    <div>
      {/* Placeholder for MaintenanceTab content */}
      <Button onClick={onScheduleService}>Schedule Service</Button>
      <div>{maintenanceRecords?.length} records for {filter}</div>
    </div>
  );
};

const FuelTab = ({ 
  fuelRecords, 
  vehicles, 
  dateRange, 
  vehicleFilter, 
  onDateRangeChange, 
  onVehicleFilterChange 
}: { 
  fuelRecords: any[]; 
  vehicles: any[]; 
  dateRange: string; 
  vehicleFilter: string; 
  onDateRangeChange: (range: string) => void; 
  onVehicleFilterChange: (filter: string) => void;
}) => {
  return (
    <div>
      {/* Placeholder for FuelTab content */}
      <div>{fuelRecords?.length} fuel records for {vehicles?.length} vehicles in {dateRange} days for {vehicleFilter}</div>
    </div>
  );
};

const AnalyticsTab = ({ 
  vehicles, 
  fuelRecords, 
  maintenanceRecords, 
  timeRange, 
  onTimeRangeChange 
}: { 
  vehicles: any[]; 
  fuelRecords: any[]; 
  maintenanceRecords: any[]; 
  timeRange: string; 
  onTimeRangeChange: (range: string) => void;
}) => {
  return (
    <div>
      {/* Placeholder for AnalyticsTab content */}
      <div>Analytics for {vehicles?.length} vehicles, {fuelRecords?.length} fuel records, {maintenanceRecords?.length} maintenance records in {timeRange} days</div>
    </div>
  );
};

const DataWorkbenchDialogs = ({ 
  vehicles, 
  isAddVehicleOpen, 
  isScheduleServiceOpen, 
  isAdvancedSearchOpen, 
  onAddVehicleClose, 
  onScheduleServiceClose, 
  onAdvancedSearchClose, 
  onAddVehicle, 
  onScheduleService, 
  onAdvancedSearch 
}: { 
  vehicles: any[]; 
  isAddVehicleOpen: boolean; 
  isScheduleServiceOpen: boolean; 
  isAdvancedSearchOpen: boolean; 
  onAddVehicleClose: () => void; 
  onScheduleServiceClose: () => void; 
  onAdvancedSearchClose: () => void; 
  onAddVehicle: (vehicle: any) => void; 
  onScheduleService: () => void; 
  onAdvancedSearch: (criteria: AdvancedSearchCriteria) => void;
}) => {
  return (
    <div>
      {/* Placeholder for dialogs */}
      <div>{vehicles?.length} vehicles in dialogs</div>
      <div>Add Vehicle Dialog: {isAddVehicleOpen.toString()}</div>
      <div>Schedule Service Dialog: {isScheduleServiceOpen.toString()}</div>
      <div>Advanced Search Dialog: {isAdvancedSearchOpen.toString()}</div>
    </div>
  );
};

export function DataWorkbench({ data }: DataWorkbenchProps) {
  const vehicles = data.vehicles || []
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Dialog states
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false)
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)

  // Tab-specific states
  const [maintenanceFilter, setMaintenanceFilter] = useState<"all" | "upcoming" | "overdue" | "completed">("all")
  const [fuelDateRange, setFuelDateRange] = useState("30")
  const [fuelVehicleFilter, setFuelVehicleFilter] = useState("all")
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState("30")
  const [_activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  // Get generated data
  const { maintenanceRecords, fuelRecords, metrics } = useDataWorkbenchData(vehicles)

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.json'
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
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fleet-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Fleet data exported successfully')
  }

  const handleRefresh = async () => {
    toast.info('Refreshing fleet data...')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleAddVehicle = (vehicle: any) => {
    if (!vehicle?.number || !vehicle?.make || !vehicle?.model) {
      toast.error('Please fill in all required fields')
      return
    }
    toast.success(`Vehicle ${vehicle.number} added successfully`)
    setIsAddVehicleDialogOpen(false)
  }

  const handleScheduleService = () => {
    toast.success('Service scheduled successfully')
    setIsScheduleServiceDialogOpen(false)
  }

  const handleAdvancedSearch = (criteria: AdvancedSearchCriteria) => {
    const filters: ActiveFilter[] = []

    if (criteria.vehicleNumber) {
      filters.push({ id: 'vehicleNumber', label: 'Vehicle Number', value: criteria.vehicleNumber })
    }
    if (criteria.make) {
      filters.push({ id: 'make', label: 'Make', value: criteria.make })
    }
    if (criteria.model) {
      filters.push({ id: 'model', label: 'Model', value: criteria.model })
    }
    if (criteria.vin) {
      filters.push({ id: 'vin', label: 'VIN', value: criteria.vin })
    }
    if (criteria.licensePlate) {
      filters.push({ id: 'licensePlate', label: 'License Plate', value: criteria.licensePlate })
    }
    if (criteria.yearFrom || criteria.yearTo) {
      const yearRange = `${criteria.yearFrom || 'Any'} - ${criteria.yearTo || 'Any'}`
      filters.push({ id: 'year', label: 'Year Range', value: yearRange })
    }
    if (criteria.status !== 'all') {
      filters.push({ id: 'status', label: 'Status', value: criteria.status })
    }
    if (criteria.department) {
      filters.push({ id: 'department', label: 'Department', value: criteria.department })
    }
    if (criteria.region) {
      filters.push({ id: 'region', label: 'Region', value: criteria.region })
    }
    if (criteria.assignedDriver) {
      filters.push({ id: 'assignedDriver', label: 'Driver', value: criteria.assignedDriver })
    }
    if (criteria.fuelLevelMin || criteria.fuelLevelMax) {
      const fuelRange = `${criteria.fuelLevelMin || '0'}% - ${criteria.fuelLevelMax || '100'}%`
      filters.push({ id: 'fuel', label: 'Fuel Level', value: fuelRange })
    }
    if (criteria.mileageMin || criteria.mileageMax) {
      const mileageRange = `${criteria.mileageMin || '0'} - ${criteria.mileageMax || '∞'} mi`
      filters.push({ id: 'mileage', label: 'Mileage', value: mileageRange })
    }

    setActiveFilters(filters)

    const results = vehicles.filter(v => {
      if (criteria.vehicleNumber && !v?.number?.toLowerCase()?.includes(criteria.vehicleNumber.toLowerCase())) return false
      if (criteria.make && !v?.make?.toLowerCase()?.includes(criteria.make.toLowerCase())) return false
      if (criteria.model && !v?.model?.toLowerCase()?.includes(criteria.model.toLowerCase())) return false
      if (criteria.vin && !v?.vin?.toLowerCase()?.includes(criteria.vin.toLowerCase())) return false
      if (criteria.licensePlate && !v?.licensePlate?.toLowerCase()?.includes(criteria.licensePlate.toLowerCase())) return false
      if (criteria.yearFrom && v?.year < parseInt(criteria.yearFrom)) return false
      if (criteria.yearTo && v?.year > parseInt(criteria.yearTo)) return false
      if (criteria.status !== 'all' && v?.status !== criteria.status) return false
      if (criteria.department && !v?.department?.toLowerCase()?.includes(criteria.department.toLowerCase())) return false
      if (criteria.region && !v?.region?.toLowerCase()?.includes(criteria.region.toLowerCase())) return false
      if (criteria.assignedDriver && !v?.assignedDriver?.toLowerCase()?.includes(criteria.assignedDriver.toLowerCase())) return false
      if (criteria.fuelLevelMin && v?.fuelLevel < parseFloat(criteria.fuelLevelMin)) return false
      if (criteria.fuelLevelMax && v?.fuelLevel > parseFloat(criteria.fuelLevelMax)) return false
      if (criteria.mileageMin && v?.mileage < parseFloat(criteria.mileageMin)) return false
      if (criteria.mileageMax && v?.mileage > parseFloat(criteria.mileageMax)) return false
      return true
    })

    toast.success(`Found ${results.length} vehicle${results.length !== 1 ? 's' : ''} matching your criteria`)
    setIsAdvancedSearchOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Enhanced Data Workbench</h1>
          <p className="text-muted-foreground mt-1">Comprehensive fleet data management and analytics</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Vehicles"
          value={metrics?.total ?? 0}
          subtitle="in fleet"
          icon={<Database className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active"
          value={metrics?.active ?? 0}
          subtitle="on the road"
          icon={<CheckCircle className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="In Maintenance"
          value={metrics?.maintenance ?? 0}
          subtitle="being serviced"
          icon={<Warning className="w-5 h-5" />}
          status="warning"
        />
        <MetricCard
          title="Avg Fuel"
          value={`${metrics?.avgFuel ?? 0}%`}
          subtitle="fleet average"
          icon={<Database className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics?.alerts ?? 0}
          subtitle="need attention"
          icon={<Warning className="w-5 h-5" />}
          status={(metrics?.alerts ?? 0) > 10 ? "warning" : "success"}
        />
      </div>

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
            filter={maintenanceFilter}
            onFilterChange={setMaintenanceFilter}
            onScheduleService={() => setIsScheduleServiceDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <FuelTab
            fuelRecords={fuelRecords}
            vehicles={vehicles}
            dateRange={fuelDateRange}
            vehicleFilter={fuelVehicleFilter}
            onDateRangeChange={setFuelDateRange}
            onVehicleFilterChange={setFuelVehicleFilter}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            vehicles={vehicles}
            fuelRecords={fuelRecords}
            maintenanceRecords={maintenanceRecords}
            timeRange={analyticsTimeRange}
            onTimeRangeChange={setAnalyticsTimeRange}
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

export default DataWorkbench