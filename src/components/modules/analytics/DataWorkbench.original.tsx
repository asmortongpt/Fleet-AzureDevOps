import {
  Database,
  Download,
  Upload,
  Plus,
  ArrowsClockwise,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  Funnel,
  X,
  Wrench,
  GasPump,
  ChartLine,
  Calendar,
  TrendUp,
  TrendDown,
  CaretUp,
  CaretDown
} from "@phosphor-icons/react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"
import { Vehicle } from "@/lib/types"

interface DataWorkbenchProps {
  data: ReturnType<typeof useFleetData>
}

interface AdvancedSearchCriteria {
  vehicleNumber: string
  make: string
  model: string
  vin: string
  licensePlate: string
  yearFrom: string
  yearTo: string
  status: string
  department: string
  region: string
  assignedDriver: string
  fuelLevelMin: string
  fuelLevelMax: string
  mileageMin: string
  mileageMax: string
}

interface ActiveFilter {
  id: string
  label: string
  value: string
}

// Maintenance record type
interface MaintenanceRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  serviceType: string
  date: string
  cost: number
  status: "upcoming" | "overdue" | "completed"
  nextDue: string | null
  notes?: string
}

// Fuel record type
interface FuelRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  date: string
  gallons: number
  cost: number
  odometer: number
  mpg: number
  location?: string
}

// Sort configuration
type SortField = string
type SortDirection = "asc" | "desc"

export function DataWorkbench({ data }: DataWorkbenchProps) {
  const vehicles = data.vehicles || []
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false)
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<AdvancedSearchCriteria>({
    vehicleNumber: "",
    make: "",
    model: "",
    vin: "",
    licensePlate: "",
    yearFrom: "",
    yearTo: "",
    status: "all",
    department: "",
    region: "",
    assignedDriver: "",
    fuelLevelMin: "",
    fuelLevelMax: "",
    mileageMin: "",
    mileageMax: ""
  })
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [newVehicle, setNewVehicle] = useState({
    number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    licensePlate: ""
  })

  // Maintenance tab state
  const [maintenanceFilter, setMaintenanceFilter] = useState<"all" | "upcoming" | "overdue" | "completed">("all")
  const [maintenanceSortField, setMaintenanceSortField] = useState<SortField>("date")
  const [maintenanceSortDirection, setMaintenanceSortDirection] = useState<SortDirection>("desc")

  // Fuel tab state
  const [fuelDateRange, setFuelDateRange] = useState("30")
  const [fuelVehicleFilter, setFuelVehicleFilter] = useState("all")
  const [fuelSortField, setFuelSortField] = useState<SortField>("date")
  const [fuelSortDirection, setFuelSortDirection] = useState<SortDirection>("desc")

  // Analytics tab state
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState("30")

  // Generate realistic maintenance data
  const maintenanceRecords = useMemo((): MaintenanceRecord[] => {
    const serviceTypes = ["Oil Change", "Tire Rotation", "Brake Service", "Engine Tune-up", "Transmission Service", "Battery Replacement", "Air Filter", "Inspection"]

    const records: MaintenanceRecord[] = []
    vehicles.slice(0, 25).forEach((vehicle, idx) => {
      const numRecords = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numRecords; i++) {
        const daysAgo = Math.floor(Math.random() * 90) - 30
        const date = new Date()
        date.setDate(date.getDate() + daysAgo)

        const status = daysAgo < 0 ? "upcoming" : (daysAgo > 60 ? "overdue" : "completed")
        const nextDueDate = new Date()
        nextDueDate.setDate(nextDueDate.getDate() + Math.floor(Math.random() * 90) + 30)

        records.push({
          id: `maint-${idx}-${i}`,
          vehicleNumber: vehicle.number,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
          date: date.toISOString().split('T')[0],
          cost: Math.floor(Math.random() * 500) + 50,
          status: status,
          nextDue: status === "completed" ? nextDueDate.toISOString().split('T')[0] : null,
          notes: i % 3 === 0 ? "Routine maintenance" : undefined
        })
      }
    })

    return records
  }, [vehicles])

  // Generate realistic fuel data
  const fuelRecords = useMemo((): FuelRecord[] => {
    const records: FuelRecord[] = []
    const locations = ["Main Depot", "North Station", "South Station", "Highway 95", "Downtown"]

    vehicles.slice(0, 20).forEach((vehicle, idx) => {
      const numRecords = Math.floor(Math.random() * 8) + 3
      let currentOdometer = vehicle.mileage

      for (let i = 0; i < numRecords; i++) {
        const daysAgo = (numRecords - i - 1) * 3
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        const gallons = Math.floor(Math.random() * 20) + 5
        const costPerGallon = 3.2 + (Math.random() * 0.8)
        const milesDriven = Math.floor(Math.random() * 300) + 50
        currentOdometer -= milesDriven

        records.push({
          id: `fuel-${idx}-${i}`,
          vehicleNumber: vehicle.number,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          date: date.toISOString().split('T')[0],
          gallons: gallons,
          cost: parseFloat((gallons * costPerGallon).toFixed(2)),
          odometer: currentOdometer,
          mpg: parseFloat((milesDriven / gallons).toFixed(1)),
          location: locations[Math.floor(Math.random() * locations.length)]
        })
      }
    })

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [vehicles])

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast.success(`Importing ${file.name}...`)
        // FUTURE: Implement actual file parsing and data import
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
    // FUTURE: Implement actual data refresh from API
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleAddVehicle = () => {
    setIsAddVehicleDialogOpen(true)
  }

  const handleSaveVehicle = () => {
    if (!newVehicle.number || !newVehicle.make || !newVehicle.model) {
      toast.error('Please fill in all required fields')
      return
    }

    toast.success(`Vehicle ${newVehicle.number} added successfully`)
    setIsAddVehicleDialogOpen(false)
    setNewVehicle({
      number: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      vin: "",
      licensePlate: ""
    })
  }

  const handleScheduleService = () => {
    toast.success('Service scheduled successfully')
    setIsScheduleServiceDialogOpen(false)
  }

  const handleAdvancedSearch = () => {
    const filters: ActiveFilter[] = []

    // Build active filters array
    if (advancedSearchCriteria.vehicleNumber) {
      filters.push({ id: 'vehicleNumber', label: 'Vehicle Number', value: advancedSearchCriteria.vehicleNumber })
    }
    if (advancedSearchCriteria.make) {
      filters.push({ id: 'make', label: 'Make', value: advancedSearchCriteria.make })
    }
    if (advancedSearchCriteria.model) {
      filters.push({ id: 'model', label: 'Model', value: advancedSearchCriteria.model })
    }
    if (advancedSearchCriteria.vin) {
      filters.push({ id: 'vin', label: 'VIN', value: advancedSearchCriteria.vin })
    }
    if (advancedSearchCriteria.licensePlate) {
      filters.push({ id: 'licensePlate', label: 'License Plate', value: advancedSearchCriteria.licensePlate })
    }
    if (advancedSearchCriteria.yearFrom || advancedSearchCriteria.yearTo) {
      const yearRange = `${advancedSearchCriteria.yearFrom || 'Any'} - ${advancedSearchCriteria.yearTo || 'Any'}`
      filters.push({ id: 'year', label: 'Year Range', value: yearRange })
    }
    if (advancedSearchCriteria.status !== 'all') {
      filters.push({ id: 'status', label: 'Status', value: advancedSearchCriteria.status })
    }
    if (advancedSearchCriteria.department) {
      filters.push({ id: 'department', label: 'Department', value: advancedSearchCriteria.department })
    }
    if (advancedSearchCriteria.region) {
      filters.push({ id: 'region', label: 'Region', value: advancedSearchCriteria.region })
    }
    if (advancedSearchCriteria.assignedDriver) {
      filters.push({ id: 'assignedDriver', label: 'Driver', value: advancedSearchCriteria.assignedDriver })
    }
    if (advancedSearchCriteria.fuelLevelMin || advancedSearchCriteria.fuelLevelMax) {
      const fuelRange = `${advancedSearchCriteria.fuelLevelMin || '0'}% - ${advancedSearchCriteria.fuelLevelMax || '100'}%`
      filters.push({ id: 'fuel', label: 'Fuel Level', value: fuelRange })
    }
    if (advancedSearchCriteria.mileageMin || advancedSearchCriteria.mileageMax) {
      const mileageRange = `${advancedSearchCriteria.mileageMin || '0'} - ${advancedSearchCriteria.mileageMax || '∞'} mi`
      filters.push({ id: 'mileage', label: 'Mileage', value: mileageRange })
    }

    setActiveFilters(filters)

    // Count results
    const results = applyAdvancedFilters(vehicles)

    toast.success(`Found ${results.length} vehicle${results.length !== 1 ? 's' : ''} matching your criteria`)
    setIsAdvancedSearchOpen(false)
  }

  const applyAdvancedFilters = (vehicleList: Vehicle[]) => {
    return vehicleList.filter(v => {
      // Vehicle Number
      if (advancedSearchCriteria.vehicleNumber &&
          !v.number.toLowerCase().includes(advancedSearchCriteria.vehicleNumber.toLowerCase())) {
        return false
      }

      // Make
      if (advancedSearchCriteria.make &&
          !v.make.toLowerCase().includes(advancedSearchCriteria.make.toLowerCase())) {
        return false
      }

      // Model
      if (advancedSearchCriteria.model &&
          !v.model.toLowerCase().includes(advancedSearchCriteria.model.toLowerCase())) {
        return false
      }

      // VIN
      if (advancedSearchCriteria.vin &&
          !v.vin?.toLowerCase().includes(advancedSearchCriteria.vin.toLowerCase())) {
        return false
      }

      // License Plate
      if (advancedSearchCriteria.licensePlate &&
          !v.licensePlate?.toLowerCase().includes(advancedSearchCriteria.licensePlate.toLowerCase())) {
        return false
      }

      // Year Range
      if (advancedSearchCriteria.yearFrom && v.year < parseInt(advancedSearchCriteria.yearFrom)) {
        return false
      }
      if (advancedSearchCriteria.yearTo && v.year > parseInt(advancedSearchCriteria.yearTo)) {
        return false
      }

      // Status
      if (advancedSearchCriteria.status !== 'all' && v.status !== advancedSearchCriteria.status) {
        return false
      }

      // Department
      if (advancedSearchCriteria.department &&
          !v.department?.toLowerCase().includes(advancedSearchCriteria.department.toLowerCase() ?? "")) {
        return false
      }

      // Region
      if (advancedSearchCriteria.region &&
          !v.region?.toLowerCase().includes(advancedSearchCriteria.region.toLowerCase() ?? "")) {
        return false
      }

      // Assigned Driver
      if (advancedSearchCriteria.assignedDriver &&
          !v.assignedDriver?.toLowerCase().includes(advancedSearchCriteria.assignedDriver.toLowerCase() ?? "")) {
        return false
      }

      // Fuel Level Range
      if (advancedSearchCriteria.fuelLevelMin && v.fuelLevel < parseFloat(advancedSearchCriteria.fuelLevelMin)) {
        return false
      }
      if (advancedSearchCriteria.fuelLevelMax && v.fuelLevel > parseFloat(advancedSearchCriteria.fuelLevelMax)) {
        return false
      }

      // Mileage Range
      if (advancedSearchCriteria.mileageMin && v.mileage < parseFloat(advancedSearchCriteria.mileageMin)) {
        return false
      }
      if (advancedSearchCriteria.mileageMax && v.mileage > parseFloat(advancedSearchCriteria.mileageMax)) {
        return false
      }

      return true
    })
  }

  const handleClearAllFilters = () => {
    setAdvancedSearchCriteria({
      vehicleNumber: "",
      make: "",
      model: "",
      vin: "",
      licensePlate: "",
      yearFrom: "",
      yearTo: "",
      status: "all",
      department: "",
      region: "",
      assignedDriver: "",
      fuelLevelMin: "",
      fuelLevelMax: "",
      mileageMin: "",
      mileageMax: ""
    })
    setActiveFilters([])
    setSearchQuery("")
    toast.info('All filters cleared')
  }

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId))

    // Clear the corresponding criteria
    setAdvancedSearchCriteria(prev => {
      const updated = { ...prev }
      if (filterId === 'vehicleNumber') updated.vehicleNumber = ""
      if (filterId === 'make') updated.make = ""
      if (filterId === 'model') updated.model = ""
      if (filterId === 'vin') updated.vin = ""
      if (filterId === 'licensePlate') updated.licensePlate = ""
      if (filterId === 'year') {
        updated.yearFrom = ""
        updated.yearTo = ""
      }
      if (filterId === 'status') updated.status = "all"
      if (filterId === 'department') updated.department = ""
      if (filterId === 'region') updated.region = ""
      if (filterId === 'assignedDriver') updated.assignedDriver = ""
      if (filterId === 'fuel') {
        updated.fuelLevelMin = ""
        updated.fuelLevelMax = ""
      }
      if (filterId === 'mileage') {
        updated.mileageMin = ""
        updated.mileageMax = ""
      }
      return updated
    })
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet Data Workbench</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze your fleet data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <ArrowsClockwise className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleAddVehicle}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Vehicles"
          value={vehicles.length.toString()}
          icon={<Database className="h-5 w-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Vehicles"
          value={vehicles.filter(v => v.status === 'active').length.toString()}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Maintenance Due"
          value={maintenanceRecords.filter(r => r.status === 'upcoming' || r.status === 'overdue').length.toString()}
          icon={<Warning className="h-5 w-5 text-amber-500" />}
        />
        <MetricCard
          title="Avg. Fuel Cost"
          value={`$${fuelRecords.length > 0 ? (fuelRecords.reduce((sum, r) => sum + r.cost, 0) / fuelRecords.length).toFixed(2) : '0.00'}`}
          icon={<GasPump className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Comprehensive fleet data overview coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicles" className="space-y-4">
          {/* Vehicle Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAdvancedSearchOpen(true)}>
              <Funnel className="mr-2 h-4 w-4" />
              Advanced Search
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {activeFilters.map(filter => (
                <Badge key={filter.id} variant="secondary" className="bg-secondary/50">
                  {filter.label}: {filter.value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0"
                    onClick={() => handleRemoveFilter(filter.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={handleClearAllFilters}>
                Clear all
              </Button>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Vehicle list and details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-wrap gap-2">
              <Select value={maintenanceFilter} onValueChange={(value: string) => setMaintenanceFilter(value as "all" | "completed" | "overdue" | "upcoming")}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMaintenanceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                }}
              >
                {maintenanceSortDirection === 'asc' ? <CaretUp className="mr-1 h-4 w-4" /> : <CaretDown className="mr-1 h-4 w-4" />}
                {maintenanceSortField.charAt(0).toUpperCase() + maintenanceSortField.slice(1)}
              </Button>
            </div>
            <Button variant="default" size="sm" onClick={() => setIsScheduleServiceDialogOpen(true)}>
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Service
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Maintenance records coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="fuel" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-wrap gap-2">
              <Select value={fuelDateRange} onValueChange={setFuelDateRange}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fuelVehicleFilter} onValueChange={setFuelVehicleFilter}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.slice(0, 10).map(v => (
                    <SelectItem key={v.number} value={v.number}>{v.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFuelSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                }}
              >
                {fuelSortDirection === 'asc' ? <CaretUp className="mr-1 h-4 w-4" /> : <CaretDown className="mr-1 h-4 w-4" />}
                {fuelSortField.charAt(0).toUpperCase() + fuelSortField.slice(1)}
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Fuel records coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-wrap gap-2">
              <Select value={analyticsTimeRange} onValueChange={setAnalyticsTimeRange}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Fleet Utilization"
              value={`${Math.floor(Math.random() * 30 + 60)}%`}
              icon={<ChartLine className="h-5 w-5 text-muted-foreground" />}
              trend="up"
              change={5.2}
            />
            <MetricCard
              title="Maintenance Costs"
              value={`$${Math.floor(Math.random() * 1000 + 2000)}`}
              icon={<Wrench className="h-5 w-5 text-muted-foreground" />}
              trend="down"
              change={3.1}
            />
            <MetricCard
              title="Fuel Efficiency"
              value={`${(Math.random() * 10 + 15).toFixed(1)} MPG`}
              icon={<GasPump className="h-5 w-5 text-muted-foreground" />}
              trend="up"
              change={1.8}
            />
            <MetricCard
              title="Downtime Incidents"
              value={Math.floor(Math.random() * 10).toString()}
              icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
              trend="down"
              change={2.4}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Fleet analytics and charts coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Enter the details of the new vehicle to add to your fleet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number" className="text-right">
                Vehicle #
              </Label>
              <Input
                id="number"
                value={newVehicle.number}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, number: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="make" className="text-right">
                Make
              </Label>
              <Input
                id="make"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Input
                id="model"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vin" className="text-right">
                VIN
              </Label>
              <Input
                id="vin"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, vin: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="licensePlate" className="text-right">
                License Plate
              </Label>
              <Input
                id="licensePlate"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, licensePlate: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsAddVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveVehicle}>
              Save Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Service Dialog */}
      <Dialog open={isScheduleServiceDialogOpen} onOpenChange={setIsScheduleServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Schedule a new maintenance service for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceVehicle" className="text-right">
                Vehicle
              </Label>
              <Select defaultValue={vehicles.length > 0 ? vehicles[0].number : ""}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.number} value={v.number}>{v.number} - {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceType" className="text-right">
                Service Type
              </Label>
              <Select defaultValue="oil-change">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oil-change">Oil Change</SelectItem>
                  <SelectItem value="tire-rotation">Tire Rotation</SelectItem>
                  <SelectItem value="brake-service">Brake Service</SelectItem>
                  <SelectItem value="engine-tuneup">Engine Tune-up</SelectItem>
                  <SelectItem value="transmission">Transmission Service</SelectItem>
                  <SelectItem value="battery">Battery Replacement</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceDate" className="text-right">
                Date
              </Label>
              <Input
                id="serviceDate"
                type="date"
                className="col-span-3"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsScheduleServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleScheduleService}>
              Schedule Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Advanced Vehicle Search</DialogTitle>
            <DialogDescription>Search for vehicles using detailed criteria.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="searchVehicleNumber">Vehicle Number</Label>
                <Input
                  id="searchVehicleNumber"
                  value={advancedSearchCriteria.vehicleNumber}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchMake">Make</Label>
                <Input
                  id="searchMake"
                  value={advancedSearchCriteria.make}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, make: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchModel">Model</Label>
                <Input
                  id="searchModel"
                  value={advancedSearchCriteria.model}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchVin">VIN</Label>
                <Input
                  id="searchVin"
                  value={advancedSearchCriteria.vin}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, vin: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchLicensePlate">License Plate</Label>
                <Input
                  id="searchLicensePlate"
                  value={advancedSearchCriteria.licensePlate}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, licensePlate: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="searchYearFrom">Year From</Label>
                  <Input
                    id="searchYearFrom"
                    type="number"
                    value={advancedSearchCriteria.yearFrom}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, yearFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="searchYearTo">Year To</Label>
                  <Input
                    id="searchYearTo"
                    type="number"
                    value={advancedSearchCriteria.yearTo}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, yearTo: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="searchStatus">Status</Label>
                <Select value={advancedSearchCriteria.status} onValueChange={(value) => setAdvancedSearchCriteria(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">In Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="searchDepartment">Department</Label>
                <Input
                  id="searchDepartment"
                  value={advancedSearchCriteria.department}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchRegion">Region/Location</Label>
                <Input
                  id="searchRegion"
                  value={advancedSearchCriteria.region}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, region: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="searchDriver">Assigned Driver</Label>
                <Input
                  id="searchDriver"
                  value={advancedSearchCriteria.assignedDriver}
                  onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, assignedDriver: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="searchFuelMin">Fuel Level Min (%)</Label>
                  <Input
                    id="searchFuelMin"
                    type="number"
                    value={advancedSearchCriteria.fuelLevelMin}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, fuelLevelMin: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="searchFuelMax">Fuel Level Max (%)</Label>
                  <Input
                    id="searchFuelMax"
                    type="number"
                    value={advancedSearchCriteria.fuelLevelMax}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, fuelLevelMax: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="searchMileageMin">Mileage Min</Label>
                  <Input
                    id="searchMileageMin"
                    type="number"
                    value={advancedSearchCriteria.mileageMin}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, mileageMin: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="searchMileageMax">Mileage Max</Label>
                  <Input
                    id="searchMileageMax"
                    type="number"
                    value={advancedSearchCriteria.mileageMax}
                    onChange={(e) => setAdvancedSearchCriteria(prev => ({ ...prev, mileageMax: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsAdvancedSearchOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={handleClearAllFilters}>
              Clear Filters
            </Button>
            <Button type="submit" onClick={handleAdvancedSearch}>
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}