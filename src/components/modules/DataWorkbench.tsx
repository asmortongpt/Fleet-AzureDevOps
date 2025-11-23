import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/MetricCard"
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
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

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
        // TODO: Implement actual file parsing and data import
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
    // TODO: Implement actual data refresh from API
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
          !v.department?.toLowerCase().includes(advancedSearchCriteria.department.toLowerCase())) {
        return false
      }

      // Region
      if (advancedSearchCriteria.region &&
          !v.region?.toLowerCase().includes(advancedSearchCriteria.region.toLowerCase())) {
        return false
      }

      // Assigned Driver
      if (advancedSearchCriteria.assignedDriver &&
          !v.assignedDriver?.toLowerCase().includes(advancedSearchCriteria.assignedDriver.toLowerCase())) {
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

  // Sort maintenance records
  const sortedMaintenanceRecords = useMemo(() => {
    let filtered = maintenanceRecords

    if (maintenanceFilter !== "all") {
      filtered = filtered.filter(r => r.status === maintenanceFilter)
    }

    return [...filtered].sort((a, b) => {
      let aVal: any = a[maintenanceSortField as keyof MaintenanceRecord]
      let bVal: any = b[maintenanceSortField as keyof MaintenanceRecord]

      if (maintenanceSortField === "cost") {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }

      if (aVal < bVal) return maintenanceSortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return maintenanceSortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [maintenanceRecords, maintenanceFilter, maintenanceSortField, maintenanceSortDirection])

  // Sort fuel records
  const sortedFuelRecords = useMemo(() => {
    let filtered = fuelRecords

    if (fuelVehicleFilter !== "all") {
      filtered = filtered.filter(r => r.vehicleNumber === fuelVehicleFilter)
    }

    const daysAgo = parseInt(fuelDateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)
    filtered = filtered.filter(r => new Date(r.date) >= cutoffDate)

    return [...filtered].sort((a, b) => {
      let aVal: any = a[fuelSortField as keyof FuelRecord]
      let bVal: any = b[fuelSortField as keyof FuelRecord]

      if (["gallons", "cost", "odometer", "mpg"].includes(fuelSortField)) {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }

      if (aVal < bVal) return fuelSortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return fuelSortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [fuelRecords, fuelVehicleFilter, fuelDateRange, fuelSortField, fuelSortDirection])

  // Maintenance metrics
  const maintenanceMetrics = useMemo(() => {
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const totalCost = maintenanceRecords
      .filter(r => new Date(r.date) >= thisMonth && r.status === "completed")
      .reduce((sum, r) => sum + r.cost, 0)

    const overdue = maintenanceRecords.filter(r => r.status === "overdue").length

    const upcoming = maintenanceRecords.filter(r => {
      if (r.status !== "upcoming") return false
      const nextDue = new Date(r.date)
      const thirtyDaysOut = new Date()
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)
      return nextDue <= thirtyDaysOut
    }).length

    return { totalCost, overdue, upcoming }
  }, [maintenanceRecords])

  // Fuel metrics
  const fuelMetrics = useMemo(() => {
    const daysAgo = parseInt(fuelDateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const recentRecords = fuelRecords.filter(r => new Date(r.date) >= cutoffDate)

    const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0)
    const totalGallons = recentRecords.reduce((sum, r) => sum + r.gallons, 0)
    const avgMPG = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.mpg, 0) / recentRecords.length
      : 0

    const totalMiles = recentRecords.reduce((sum, r) => sum + (r.mpg * r.gallons), 0)
    const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0

    return {
      totalCost: totalCost.toFixed(2),
      avgMPG: avgMPG.toFixed(1),
      totalGallons: totalGallons.toFixed(1),
      costPerMile: costPerMile.toFixed(3)
    }
  }, [fuelRecords, fuelDateRange])

  // Analytics metrics
  const analyticsMetrics = useMemo(() => {
    const activeVehicles = (vehicles || []).filter(v => v.status === "active")
    const totalMileage = (vehicles || []).reduce((sum, v) => sum + v.mileage, 0)
    const avgMilesPerDay = vehicles.length > 0 ? totalMileage / vehicles.length / 365 : 0

    // Calculate costs
    const daysAgo = parseInt(analyticsTimeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const recentFuelRecords = fuelRecords.filter(r => new Date(r.date) >= cutoffDate)
    const recentMaintenanceRecords = maintenanceRecords.filter(r =>
      new Date(r.date) >= cutoffDate && r.status === "completed"
    )

    const fuelCost = recentFuelRecords.reduce((sum, r) => sum + r.cost, 0)
    const maintenanceCost = recentMaintenanceRecords.reduce((sum, r) => sum + r.cost, 0)
    const totalCost = fuelCost + maintenanceCost
    const costPerVehicle = vehicles.length > 0 ? totalCost / vehicles.length : 0

    // Most efficient vehicle (highest MPG)
    const vehicleMPGs = new Map<string, number[]>()
    recentFuelRecords.forEach(r => {
      const mpgs = vehicleMPGs.get(r.vehicleNumber) || []
      mpgs.push(r.mpg)
      vehicleMPGs.set(r.vehicleNumber, mpgs)
    })

    let mostEfficient = { vehicle: "N/A", mpg: 0 }
    vehicleMPGs.forEach((mpgs, vehicleNum) => {
      const avgMPG = mpgs.reduce((a, b) => a + b, 0) / mpgs.length
      if (avgMPG > mostEfficient.mpg) {
        const vehicle = (vehicles || []).find(v => v.number === vehicleNum)
        mostEfficient = {
          vehicle: vehicle ? `${vehicle.number} (${vehicle.make} ${vehicle.model})` : vehicleNum,
          mpg: avgMPG
        }
      }
    })

    return {
      activeVehicles: activeVehicles.length,
      totalVehicles: vehicles.length,
      avgMilesPerDay: avgMilesPerDay.toFixed(1),
      totalCost: totalCost.toFixed(2),
      costPerVehicle: costPerVehicle.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      maintenanceCost: maintenanceCost.toFixed(2),
      mostEfficient
    }
  }, [vehicles, fuelRecords, maintenanceRecords, analyticsTimeRange])

  const metrics = {
    total: vehicles.length,
    active: (vehicles || []).filter(v => v.status === "active").length,
    maintenance: (vehicles || []).filter(v => v.status === "service").length,
    avgFuel: vehicles.length > 0 ? Math.round((vehicles || []).reduce((sum, v) => sum + (v.fuelLevel ?? 0), 0) / vehicles.length) : 0,
    alerts: vehicles.filter(v => ((v.alerts || [])).length > 0).length
  }

  // Apply simple search first
  let filteredVehicles = (vehicles || []).filter(v =>
    v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Then apply advanced filters if any are active
  if (activeFilters.length > 0) {
    filteredVehicles = applyAdvancedFilters(filteredVehicles)
  }

  const handleMaintenanceSort = (field: SortField) => {
    if (maintenanceSortField === field) {
      setMaintenanceSortDirection(maintenanceSortDirection === "asc" ? "desc" : "asc")
    } else {
      setMaintenanceSortField(field)
      setMaintenanceSortDirection("asc")
    }
  }

  const handleFuelSort = (field: SortField) => {
    if (fuelSortField === field) {
      setFuelSortDirection(fuelSortDirection === "asc" ? "desc" : "asc")
    } else {
      setFuelSortField(field)
      setFuelSortDirection("asc")
    }
  }

  const SortIcon = ({ field, currentField, direction }: { field: string; currentField: string; direction: SortDirection }) => {
    if (field !== currentField) return null
    return direction === "asc" ? <CaretUp className="w-4 h-4 inline ml-1" /> : <CaretDown className="w-4 h-4 inline ml-1" />
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
          <Button onClick={handleAddVehicle}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles by number, make, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="gap-2"
            >
              <Funnel className="w-4 h-4" />
              Advanced Search
            </Button>
            {(activeFilters.length > 0 || searchQuery) && (
              <Button
                variant="outline"
                onClick={handleClearAllFilters}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active Filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="gap-1.5 pr-1 py-1"
                >
                  <span className="text-xs">
                    <strong>{filter.label}:</strong> {filter.value}
                  </span>
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="hover:bg-muted rounded-sm p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Vehicle</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Mileage</th>
                      <th className="text-left p-4 font-medium">Fuel</th>
                      <th className="text-left p-4 font-medium">Driver</th>
                      <th className="text-left p-4 font-medium">Department</th>
                      <th className="text-left p-4 font-medium">Region</th>
                      <th className="text-left p-4 font-medium">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.slice(0, 15).map(vehicle => (
                      <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{vehicle.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline"
                            className={
                              vehicle.status === "active"
                                ? "bg-success/10 text-success border-success/20"
                                : vehicle.status === "service"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  vehicle.fuelLevel > 50 
                                    ? "bg-success" 
                                    : vehicle.fuelLevel > 25 
                                    ? "bg-warning" 
                                    : "bg-destructive"
                                }`}
                                style={{ width: `${vehicle.fuelLevel}%` }}
                              />
                            </div>
                            <span className="text-sm">{vehicle.fuelLevel}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {vehicle.assignedDriver || "Unassigned"}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.department}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{vehicle.region}</span>
                        </td>
                        <td className="p-4">
                          {((vehicle.alerts || [])).length > 0 ? (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {((vehicle.alerts || [])).length}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {filteredVehicles.length > 15 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 15 of {filteredVehicles.length} vehicles
            </p>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Maintenance Cost"
              value={`$${maintenanceMetrics.totalCost.toLocaleString()}`}
              subtitle="this month"
              icon={<Wrench className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Overdue Services"
              value={maintenanceMetrics.overdue}
              subtitle="need immediate attention"
              icon={<Warning className="w-5 h-5" />}
              status={maintenanceMetrics.overdue > 0 ? "warning" : "success"}
            />
            <MetricCard
              title="Upcoming Services"
              value={maintenanceMetrics.upcoming}
              subtitle="next 30 days"
              icon={<Calendar className="w-5 h-5" />}
              status="info"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={maintenanceFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setMaintenanceFilter("all")}
              >
                All
              </Button>
              <Button
                variant={maintenanceFilter === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setMaintenanceFilter("upcoming")}
              >
                Upcoming
              </Button>
              <Button
                variant={maintenanceFilter === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setMaintenanceFilter("overdue")}
              >
                Overdue
              </Button>
              <Button
                variant={maintenanceFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setMaintenanceFilter("completed")}
              >
                Completed
              </Button>
            </div>
            <Button onClick={() => setIsScheduleServiceDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Service
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleMaintenanceSort("vehicleNumber")}
                      >
                        Vehicle
                        <SortIcon field="vehicleNumber" currentField={maintenanceSortField} direction={maintenanceSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleMaintenanceSort("serviceType")}
                      >
                        Service Type
                        <SortIcon field="serviceType" currentField={maintenanceSortField} direction={maintenanceSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleMaintenanceSort("date")}
                      >
                        Date
                        <SortIcon field="date" currentField={maintenanceSortField} direction={maintenanceSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleMaintenanceSort("cost")}
                      >
                        Cost
                        <SortIcon field="cost" currentField={maintenanceSortField} direction={maintenanceSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleMaintenanceSort("status")}
                      >
                        Status
                        <SortIcon field="status" currentField={maintenanceSortField} direction={maintenanceSortDirection} />
                      </th>
                      <th className="text-left p-4 font-medium">Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMaintenanceRecords.slice(0, 20).map(record => (
                      <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{record.vehicleNumber}</p>
                          <p className="text-sm text-muted-foreground">{record.vehicleName}</p>
                        </td>
                        <td className="p-4">{record.serviceType}</td>
                        <td className="p-4">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-medium">
                          ${record.cost.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              record.status === "completed"
                                ? "bg-success/10 text-success border-success/20"
                                : record.status === "upcoming"
                                ? "bg-info/10 text-info border-info/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }
                          >
                            {record.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {record.nextDue ? new Date(record.nextDue).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {sortedMaintenanceRecords.length > 20 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 20 of {sortedMaintenanceRecords.length} records
            </p>
          )}
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Fuel Cost"
              value={`$${fuelMetrics.totalCost}`}
              subtitle={`last ${fuelDateRange} days`}
              icon={<GasPump className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Average MPG"
              value={fuelMetrics.avgMPG}
              subtitle="fleet average"
              icon={<TrendUp className="w-5 h-5" />}
              status="success"
            />
            <MetricCard
              title="Total Gallons"
              value={fuelMetrics.totalGallons}
              subtitle="consumed"
              icon={<GasPump className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Cost per Mile"
              value={`$${fuelMetrics.costPerMile}`}
              subtitle="average"
              icon={<ChartLine className="w-5 h-5" />}
              status="info"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Date Range:</Label>
              <Select value={fuelDateRange} onValueChange={setFuelDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Vehicle:</Label>
              <Select value={fuelVehicleFilter} onValueChange={setFuelVehicleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.slice(0, 10).map(v => (
                    <SelectItem key={v.id} value={v.number}>
                      {v.number} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuel Consumption Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization placeholder</p>
                  <p className="text-sm">Line chart showing fuel consumption over last {fuelDateRange} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("vehicleNumber")}
                      >
                        Vehicle
                        <SortIcon field="vehicleNumber" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("date")}
                      >
                        Date
                        <SortIcon field="date" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("gallons")}
                      >
                        Gallons
                        <SortIcon field="gallons" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("cost")}
                      >
                        Cost
                        <SortIcon field="cost" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("odometer")}
                      >
                        Odometer
                        <SortIcon field="odometer" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th
                        className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                        onClick={() => handleFuelSort("mpg")}
                      >
                        MPG
                        <SortIcon field="mpg" currentField={fuelSortField} direction={fuelSortDirection} />
                      </th>
                      <th className="text-left p-4 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFuelRecords.slice(0, 20).map(record => (
                      <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{record.vehicleNumber}</p>
                          <p className="text-sm text-muted-foreground">{record.vehicleName}</p>
                        </td>
                        <td className="p-4">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">{(record.gallons ?? 0).toFixed(1)}</td>
                        <td className="p-4 font-medium">${(record.cost ?? 0).toFixed(2)}</td>
                        <td className="p-4">{record.odometer.toLocaleString()} mi</td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            {record.mpg} MPG
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {record.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {sortedFuelRecords.length > 20 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 20 of {sortedFuelRecords.length} records
            </p>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Fleet Analytics</h2>
            <Select value={analyticsTimeRange} onValueChange={setAnalyticsTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilization Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {((analyticsMetrics.activeVehicles / analyticsMetrics.totalVehicles) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {analyticsMetrics.activeVehicles} of {analyticsMetrics.totalVehicles} vehicles active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Miles per Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsMetrics.avgMilesPerDay}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  per vehicle
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Most Efficient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">
                  {analyticsMetrics.mostEfficient.vehicle}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {analyticsMetrics.mostEfficient.mpg.toFixed(1)} MPG average
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Analysis (Last {analyticsTimeRange} days)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Operating Cost</span>
                    <span className="font-semibold text-lg">${analyticsMetrics.totalCost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost per Vehicle</span>
                    <span className="font-medium">${analyticsMetrics.costPerVehicle}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Cost Breakdown</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Fuel</span>
                        <span className="text-sm font-medium">${analyticsMetrics.fuelCost}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(parseFloat(analyticsMetrics.fuelCost) / parseFloat(analyticsMetrics.totalCost)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Maintenance</span>
                        <span className="text-sm font-medium">${analyticsMetrics.maintenanceCost}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{
                            width: `${(parseFloat(analyticsMetrics.maintenanceCost) / parseFloat(analyticsMetrics.totalCost)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization placeholder</p>
                    <p className="text-sm">Bar chart showing vehicle utilization by department</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Vehicle</th>
                      <th className="text-left p-4 font-medium">Metric</th>
                      <th className="text-left p-4 font-medium">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">Most Efficient</td>
                      <td className="p-4">
                        <p className="font-medium">{vehicles[0]?.number || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicles[0] ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}` : ""}
                        </p>
                      </td>
                      <td className="p-4">Fuel Economy</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <TrendUp className="w-3 h-3 mr-1" />
                          28.5 MPG
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">Most Reliable</td>
                      <td className="p-4">
                        <p className="font-medium">{vehicles[2]?.number || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicles[2] ? `${vehicles[2].year} ${vehicles[2].make} ${vehicles[2].model}` : ""}
                        </p>
                      </td>
                      <td className="p-4">Uptime</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          99.2%
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">Lowest Cost</td>
                      <td className="p-4">
                        <p className="font-medium">{vehicles[4]?.number || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicles[4] ? `${vehicles[4].year} ${vehicles[4].make} ${vehicles[4].model}` : ""}
                        </p>
                      </td>
                      <td className="p-4">Operating Cost</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <TrendDown className="w-3 h-3 mr-1" />
                          $0.42/mi
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization placeholder</p>
                  <p className="text-sm">Line chart showing cost trends over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter the vehicle information to add it to your fleet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number *</Label>
              <Input
                id="vehicle-number"
                placeholder="e.g., UNIT-021"
                value={newVehicle.number}
                onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="e.g., Ford"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g., F-150"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                placeholder="1FTFW1E12345678"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-plate">License Plate</Label>
              <Input
                id="license-plate"
                placeholder="FL-1234"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVehicle}>
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogDescription>
              Search vehicles using multiple criteria to find exactly what you need
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Vehicle Identification */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Vehicle Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-vehicle-number">Vehicle Number</Label>
                  <Input
                    id="adv-vehicle-number"
                    placeholder="e.g., UNIT-021"
                    value={advancedSearchCriteria.vehicleNumber}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, vehicleNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-vin">VIN</Label>
                  <Input
                    id="adv-vin"
                    placeholder="Vehicle Identification Number"
                    value={advancedSearchCriteria.vin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, vin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-license">License Plate</Label>
                  <Input
                    id="adv-license"
                    placeholder="e.g., FL-1234"
                    value={advancedSearchCriteria.licensePlate}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, licensePlate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-status">Status</Label>
                  <Select
                    value={advancedSearchCriteria.status}
                    onValueChange={(value) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, status: value })}
                  >
                    <SelectTrigger id="adv-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="service">In Service</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Vehicle Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-make">Make</Label>
                  <Input
                    id="adv-make"
                    placeholder="e.g., Ford, Chevrolet"
                    value={advancedSearchCriteria.make}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-model">Model</Label>
                  <Input
                    id="adv-model"
                    placeholder="e.g., F-150, Silverado"
                    value={advancedSearchCriteria.model}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-year-from">Year From</Label>
                  <Input
                    id="adv-year-from"
                    type="number"
                    placeholder="e.g., 2020"
                    value={advancedSearchCriteria.yearFrom}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, yearFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-year-to">Year To</Label>
                  <Input
                    id="adv-year-to"
                    type="number"
                    placeholder="e.g., 2024"
                    value={advancedSearchCriteria.yearTo}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, yearTo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Assignment & Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Assignment & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-department">Department</Label>
                  <Input
                    id="adv-department"
                    placeholder="e.g., Operations, Maintenance"
                    value={advancedSearchCriteria.department}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-region">Region</Label>
                  <Input
                    id="adv-region"
                    placeholder="e.g., North, South, Central"
                    value={advancedSearchCriteria.region}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, region: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="adv-driver">Assigned Driver</Label>
                  <Input
                    id="adv-driver"
                    placeholder="Driver name"
                    value={advancedSearchCriteria.assignedDriver}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, assignedDriver: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-fuel-min">Fuel Level Min (%)</Label>
                  <Input
                    id="adv-fuel-min"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={advancedSearchCriteria.fuelLevelMin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, fuelLevelMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-fuel-max">Fuel Level Max (%)</Label>
                  <Input
                    id="adv-fuel-max"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={advancedSearchCriteria.fuelLevelMax}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, fuelLevelMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-mileage-min">Mileage Min</Label>
                  <Input
                    id="adv-mileage-min"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advancedSearchCriteria.mileageMin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, mileageMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-mileage-max">Mileage Max</Label>
                  <Input
                    id="adv-mileage-max"
                    type="number"
                    min="0"
                    placeholder="999999"
                    value={advancedSearchCriteria.mileageMax}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, mileageMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdvancedSearchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdvancedSearch}>
              <MagnifyingGlass className="w-4 h-4 mr-2" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Service Dialog */}
      <Dialog open={isScheduleServiceDialogOpen} onOpenChange={setIsScheduleServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Service</DialogTitle>
            <DialogDescription>
              Schedule maintenance service for a vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-vehicle">Vehicle *</Label>
              <Select>
                <SelectTrigger id="service-vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.slice(0, 10).map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.number} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type *</Label>
              <Select>
                <SelectTrigger id="service-type">
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
            <div className="space-y-2">
              <Label htmlFor="service-date">Scheduled Date *</Label>
              <Input
                id="service-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-notes">Notes</Label>
              <Input
                id="service-notes"
                placeholder="Additional notes or instructions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleService}>
              Schedule Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
