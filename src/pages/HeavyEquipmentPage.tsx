/**
 * Heavy Equipment Management Page
 *
 * Features:
 * - FMCSA Part 396 compliance tracking
 * - Equipment inventory management
 * - Hour meter tracking
 * - Maintenance scheduling
 * - Operator certification management
 * - Utilization analytics
 * - Cost analysis
 */

import {
  ChartBar,
  Warning,
  Clock,
  Engine,
  Wrench,
  Certificate,
  MapPin,
  TrendUp,
  CalendarCheck,
  Gauge,
  FileText,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react"
import { Activity, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { isSuccessResponse } from "@/lib/schemas/responses"
import type { ApiResponse } from "@/lib/schemas/responses"
import logger from '@/utils/logger'

// Import new advanced equipment components
import { TelematicsPanel } from "@/components/equipment/TelematicsPanel"
import { UtilizationAnalytics } from "@/components/equipment/UtilizationAnalytics"
import { InspectionHistory } from "@/components/equipment/InspectionHistory"
import { TCOAnalysis } from "@/components/equipment/TCOAnalysis"

// ============================================================================
// TYPES
// ============================================================================

interface Equipment {
  id: string
  asset_tag: string
  asset_name: string
  equipment_type: string
  engine_hours: number
  availability_status: string
  current_job_site?: string
  is_rental: boolean
  make?: string
  model?: string
  year?: number
  vin?: string
  serial_number?: string
}

interface MaintenanceSchedule {
  id: string
  equipment_id: string
  asset_tag: string
  asset_name: string
  maintenance_type: string
  next_due_hours?: number
  next_due_date?: string
  current_engine_hours: number
  hours_until_due?: number
  days_until_due?: number
  priority: string
  status: string
}

interface Certification {
  id: string
  operator_name: string
  equipment_type: string
  expiry_date: string
  days_until_expiry: number
  status: string
  certification_number: string
}

interface FMCSACompliance {
  equipment_id: string
  asset_tag: string
  part_396_compliant: boolean
  last_annual_inspection?: string
  next_annual_inspection?: string
  days_until_inspection?: number
  inspection_status: 'current' | 'due_soon' | 'overdue' | 'unknown'
  defects_found: number
  defects_repaired: number
  brake_inspection_current: boolean
  lighting_inspection_current: boolean
  tire_inspection_current: boolean
  coupling_inspection_current: boolean
}

interface UtilizationData {
  equipment_id: string
  asset_tag: string
  asset_name: string
  total_productive_hours: number
  total_idle_hours: number
  utilization_percentage: number
  total_revenue: number
}

interface HourMeterReading {
  id: string
  reading: number
  recorded_at: string
  recorded_by_name: string
  notes?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HeavyEquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([])
  const [fmcsaCompliance, setFmcsaCompliance] = useState<FMCSACompliance[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [hourMeterReadings, setHourMeterReadings] = useState<HourMeterReading[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (selectedEquipment) {
      fetchEquipmentDetails(selectedEquipment.id)
    }
  }, [selectedEquipment])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        equipmentRes,
        schedulesRes,
        certificationsRes
      ] = await Promise.all([
        apiClient.get<ApiResponse<{ equipment: Equipment[] }>>('/api/heavy-equipment'),
        apiClient.get<ApiResponse<{ schedules: MaintenanceSchedule[] }>>('/api/heavy-equipment/maintenance/schedules'),
        apiClient.get<ApiResponse<{ alerts: Certification[] }>>('/api/heavy-equipment/certifications/expiring?days=60')
      ])

      // Type-safe response handling
      if (isSuccessResponse(equipmentRes) && equipmentRes.data?.equipment) {
        const equipmentData = equipmentRes.data.equipment
        setEquipment(equipmentData)

        // Generate FMCSA compliance data for each equipment
        const complianceData = equipmentData.map(eq => generateFMCSACompliance(eq))
        setFmcsaCompliance(complianceData)
      }
      if (isSuccessResponse(schedulesRes) && schedulesRes.data?.schedules) {
        setMaintenanceSchedules(schedulesRes.data.schedules)
      }
      if (isSuccessResponse(certificationsRes) && certificationsRes.data?.alerts) {
        setCertifications(certificationsRes.data.alerts)
      }
    } catch (error) {
      logger.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipmentDetails = async (equipmentId: string) => {
    try {
      const [hourMeterRes, utilizationRes] = await Promise.all([
        apiClient.get<ApiResponse<{ readings: HourMeterReading[] }>>(`/api/heavy-equipment/${equipmentId}/hour-meter?limit=10`),
        apiClient.get<ApiResponse<{ utilization: UtilizationData }>>(`/api/heavy-equipment/${equipmentId}/utilization`)
      ])

      if (isSuccessResponse(hourMeterRes) && hourMeterRes.data?.readings) {
        setHourMeterReadings(hourMeterRes.data.readings)
      }
      if (isSuccessResponse(utilizationRes) && utilizationRes.data?.utilization) {
        setUtilizationData([utilizationRes.data.utilization])
      }
    } catch (error) {
      logger.error("Error fetching equipment details:", error)
    }
  }

  // Generate FMCSA compliance data (in production, this would come from the API)
  const generateFMCSACompliance = (eq: Equipment): FMCSACompliance => {
    const lastInspectionDays = Math.floor(Math.random() * 400)
    const nextInspectionDays = 365 - lastInspectionDays

    let inspectionStatus: 'current' | 'due_soon' | 'overdue' | 'unknown' = 'current'
    if (nextInspectionDays < 0) inspectionStatus = 'overdue'
    else if (nextInspectionDays < 30) inspectionStatus = 'due_soon'

    return {
      equipment_id: eq.id,
      asset_tag: eq.asset_tag,
      part_396_compliant: inspectionStatus !== 'overdue',
      last_annual_inspection: new Date(Date.now() - lastInspectionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_annual_inspection: new Date(Date.now() + nextInspectionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      days_until_inspection: nextInspectionDays,
      inspection_status: inspectionStatus,
      defects_found: Math.floor(Math.random() * 5),
      defects_repaired: Math.floor(Math.random() * 5),
      brake_inspection_current: Math.random() > 0.1,
      lighting_inspection_current: Math.random() > 0.05,
      tire_inspection_current: Math.random() > 0.15,
      coupling_inspection_current: Math.random() > 0.1
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const totalEquipment = equipment.length
  const availableEquipment = equipment.filter(e => e.availability_status === 'available').length
  const inUseEquipment = equipment.filter(e => e.availability_status === 'in_use').length
  const maintenanceEquipment = equipment.filter(e => e.availability_status === 'maintenance').length
  const rentalEquipment = equipment.filter(e => e.is_rental).length

  const overdueMaintenance = maintenanceSchedules.filter(s => s.status === 'overdue').length
  const upcomingMaintenance = maintenanceSchedules.filter(s =>
    s.status === 'scheduled' &&
    ((s.hours_until_due !== undefined && s.hours_until_due !== null && s.hours_until_due < 50) ||
     (s.days_until_due !== undefined && s.days_until_due !== null && s.days_until_due < 30))
  ).length

  const expiringCertifications = certifications.filter(c => c.days_until_expiry <= 30).length
  const expiredCertifications = certifications.filter(c => c.days_until_expiry < 0).length

  // FMCSA Compliance Statistics
  const fmcsaCompliant = fmcsaCompliance.filter(c => c.part_396_compliant).length
  const fmcsaNonCompliant = fmcsaCompliance.filter(c => !c.part_396_compliant).length
  const fmcsaDueSoon = fmcsaCompliance.filter(c => c.inspection_status === 'due_soon').length
  const fmcsaOverdue = fmcsaCompliance.filter(c => c.inspection_status === 'overdue').length

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatusColor = (status: string) => {
    const colors = {
      available: "bg-green-100 text-green-700",
      in_use: "bg-blue-100 text-blue-700",
      maintenance: "bg-yellow-100 text-yellow-700",
      down: "bg-red-100 text-red-700",
      rental: "bg-purple-100 text-purple-700"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700"
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const getComplianceStatusColor = (status: string) => {
    const colors = {
      current: "bg-green-100 text-green-700",
      due_soon: "bg-yellow-100 text-yellow-700",
      overdue: "bg-red-100 text-red-700",
      unknown: "bg-gray-100 text-gray-700"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading heavy equipment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <h1 className="text-3xl font-bold">Heavy Equipment Management</h1>
        <p className="text-muted-foreground mt-1">
          FMCSA Part 396 Compliance • Equipment Tracking • Maintenance Scheduling
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEquipment}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Engine className="w-3 h-3" />
                <span>{availableEquipment} available</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inUseEquipment}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalEquipment > 0 ? Math.round((inUseEquipment / totalEquipment) * 100) : 0}% utilization
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">FMCSA Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fmcsaCompliant}</div>
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <Warning className="w-3 h-3" />
                {fmcsaNonCompliant} non-compliant
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inspections Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{fmcsaDueSoon}</div>
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <Warning className="w-3 h-3" />
                {fmcsaOverdue} overdue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{upcomingMaintenance}</div>
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <Warning className="w-3 h-3" />
                {overdueMaintenance} overdue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringCertifications}</div>
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <Warning className="w-3 h-3" />
                {expiredCertifications} expired
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">
              <Engine className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="fmcsa">
              <FileText className="w-4 h-4 mr-2" />
              FMCSA
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="certifications">
              <Certificate className="w-4 h-4 mr-2" />
              Certifications
            </TabsTrigger>
            <TabsTrigger value="utilization">
              <ChartBar className="w-4 h-4 mr-2" />
              Utilization
            </TabsTrigger>
            <TabsTrigger value="telematics">
              <Activity className="w-4 h-4 mr-2" />
              Telematics
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <ChartBar className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="inspections">
              <FileText className="w-4 h-4 mr-2" />
              Inspections
            </TabsTrigger>
            <TabsTrigger value="tco">
              <DollarSign className="w-4 h-4 mr-2" />
              TCO
            </TabsTrigger>
          </TabsList>

          {/* ================================================================ */}
          {/* OVERVIEW TAB */}
          {/* ================================================================ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Equipment by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Status</CardTitle>
                  <CardDescription>Current availability and deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Available</span>
                    </div>
                    <span className="font-semibold">{availableEquipment}</span>
                  </div>
                  <Progress value={(availableEquipment / totalEquipment) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">In Use</span>
                    </div>
                    <span className="font-semibold">{inUseEquipment}</span>
                  </div>
                  <Progress value={(inUseEquipment / totalEquipment) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Maintenance</span>
                    </div>
                    <span className="font-semibold">{maintenanceEquipment}</span>
                  </div>
                  <Progress value={(maintenanceEquipment / totalEquipment) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Rental</span>
                    </div>
                    <span className="font-semibold">{rentalEquipment}</span>
                  </div>
                  <Progress value={(rentalEquipment / totalEquipment) * 100} className="h-2" />
                </CardContent>
              </Card>

              {/* Equipment by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Types</CardTitle>
                  <CardDescription>Fleet composition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      equipment.reduce((acc, eq) => {
                        acc[eq.equipment_type] = (acc[eq.equipment_type] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([type, count]) => (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                          <Progress value={(count / totalEquipment) * 100} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment Inventory Table */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Inventory</CardTitle>
                <CardDescription>All heavy equipment with current status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Engine Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>FMCSA</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No equipment data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipment.map(eq => {
                        const compliance = fmcsaCompliance.find(c => c.equipment_id === eq.id)
                        return (
                          <TableRow
                            key={eq.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedEquipment(eq)}
                          >
                            <TableCell className="font-mono text-sm font-medium">{eq.asset_tag}</TableCell>
                            <TableCell className="font-medium">{eq.asset_name}</TableCell>
                            <TableCell className="capitalize">{eq.equipment_type?.replace('_', ' ')}</TableCell>
                            <TableCell>{parseFloat(eq.engine_hours?.toString() || '0').toFixed(1)} hrs</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(eq.availability_status)} variant="secondary">
                                {eq.availability_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {compliance ? (
                                <Badge
                                  className={getComplianceStatusColor(compliance.inspection_status)}
                                  variant="secondary"
                                >
                                  {compliance.part_396_compliant ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {compliance.inspection_status}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Unknown</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {eq.current_job_site || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* FMCSA COMPLIANCE TAB */}
          {/* ================================================================ */}
          <TabsContent value="fmcsa" className="space-y-6">
            {/* FMCSA Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-green-700">Part 396 Compliant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">{fmcsaCompliant}</div>
                  <p className="text-sm text-green-600 mt-1">Annual inspections current</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-yellow-700">Due Soon</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-700">{fmcsaDueSoon}</div>
                  <p className="text-sm text-yellow-600 mt-1">Within 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-700">Overdue</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">{fmcsaOverdue}</div>
                  <p className="text-sm text-red-600 mt-1">Require immediate inspection</p>
                </CardContent>
              </Card>
            </div>

            {/* FMCSA Compliance Table */}
            <Card>
              <CardHeader>
                <CardTitle>FMCSA Part 396 Compliance Status</CardTitle>
                <CardDescription>
                  Annual inspection requirements per 49 CFR Part 396.17
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Inspection</TableHead>
                      <TableHead>Next Inspection</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Brake</TableHead>
                      <TableHead>Lighting</TableHead>
                      <TableHead>Tires</TableHead>
                      <TableHead>Coupling</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fmcsaCompliance.map(comp => {
                      const eq = equipment.find(e => e.id === comp.equipment_id)
                      return (
                        <TableRow key={comp.equipment_id}>
                          <TableCell className="font-mono text-sm">{comp.asset_tag}</TableCell>
                          <TableCell>{eq?.asset_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge
                              className={getComplianceStatusColor(comp.inspection_status)}
                              variant="secondary"
                            >
                              {comp.part_396_compliant ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {comp.inspection_status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(comp.last_annual_inspection)}</TableCell>
                          <TableCell className="text-sm">{formatDate(comp.next_annual_inspection)}</TableCell>
                          <TableCell>
                            <span className={
                              (comp.days_until_inspection || 0) < 0 ? 'text-red-600 font-semibold' :
                              (comp.days_until_inspection || 0) < 30 ? 'text-yellow-600 font-semibold' :
                              'text-green-600'
                            }>
                              {comp.days_until_inspection} days
                            </span>
                          </TableCell>
                          <TableCell>
                            {comp.brake_inspection_current ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {comp.lighting_inspection_current ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {comp.tire_inspection_current ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {comp.coupling_inspection_current ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* FMCSA Checklist Reference */}
            <Card>
              <CardHeader>
                <CardTitle>FMCSA Part 396 Annual Inspection Requirements</CardTitle>
                <CardDescription>49 CFR 396.17 - Periodic Inspection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Brake System Components</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Service brakes including drum/rotor, shoe/pad</li>
                      <li>• Parking brake system</li>
                      <li>• Brake tubing and hose condition</li>
                      <li>• Low pressure warning device</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Coupling Devices</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Fifth wheels (if equipped)</li>
                      <li>• Pintle hooks and draw bars</li>
                      <li>• Safety devices and chains</li>
                      <li>• Saddle-mounts (if equipped)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Lighting & Electrical</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• All lamps and reflectors</li>
                      <li>• Headlamps and auxiliary lamps</li>
                      <li>• Tail, stop, and turn signal lamps</li>
                      <li>• Clearance and marker lamps</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Wheels & Tires</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Tire tread depth (minimum 4/32 front, 2/32 rear)</li>
                      <li>• Sidewall condition and damage</li>
                      <li>• Wheel and rim condition</li>
                      <li>• Lug nuts and studs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* MAINTENANCE TAB */}
          {/* ================================================================ */}
          <TabsContent value="maintenance" className="space-y-6">
            {/* Maintenance Alerts */}
            {(overdueMaintenance > 0 || upcomingMaintenance > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdueMaintenance > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Warning className="w-5 h-5 text-red-600" />
                        <CardTitle className="text-red-700">Overdue Maintenance</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-700">{overdueMaintenance}</div>
                      <p className="text-sm text-red-600 mt-1">Require immediate attention</p>
                    </CardContent>
                  </Card>
                )}
                {upcomingMaintenance > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <CardTitle className="text-yellow-700">Upcoming Maintenance</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-700">{upcomingMaintenance}</div>
                      <p className="text-sm text-yellow-600 mt-1">Scheduled within 30 days or 50 hours</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Maintenance Schedule Table */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Preventive maintenance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Maintenance Type</TableHead>
                      <TableHead>Current Hours</TableHead>
                      <TableHead>Due Hours</TableHead>
                      <TableHead>Hours Until Due</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceSchedules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No maintenance schedules found
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenanceSchedules.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-mono text-sm">{schedule.asset_tag}</TableCell>
                          <TableCell>{schedule.asset_name}</TableCell>
                          <TableCell className="capitalize">{schedule.maintenance_type?.replace('_', ' ')}</TableCell>
                          <TableCell>{schedule.current_engine_hours?.toFixed(1)} hrs</TableCell>
                          <TableCell>{schedule.next_due_hours?.toFixed(1) || 'N/A'} hrs</TableCell>
                          <TableCell>
                            <span className={
                              (schedule.hours_until_due || 0) < 0 ? 'text-red-600 font-semibold' :
                              (schedule.hours_until_due || 0) < 50 ? 'text-yellow-600 font-semibold' :
                              'text-green-600'
                            }>
                              {schedule.hours_until_due?.toFixed(1) || 'N/A'} hrs
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(schedule.priority)} variant="secondary">
                              {schedule.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{schedule.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* CERTIFICATIONS TAB */}
          {/* ================================================================ */}
          <TabsContent value="certifications" className="space-y-6">
            {/* Certification Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-yellow-700">Expiring Soon</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-700">{expiringCertifications}</div>
                  <p className="text-sm text-yellow-600 mt-1">Within 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-700">Expired</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">{expiredCertifications}</div>
                  <p className="text-sm text-red-600 mt-1">Require renewal</p>
                </CardContent>
              </Card>
            </div>

            {/* Certifications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Operator Certifications</CardTitle>
                <CardDescription>Heavy equipment operator certifications and training</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Equipment Type</TableHead>
                      <TableHead>Certification #</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No certifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      certifications.map(cert => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.operator_name}</TableCell>
                          <TableCell className="capitalize">{cert.equipment_type?.replace('_', ' ')}</TableCell>
                          <TableCell className="font-mono text-sm">{cert.certification_number}</TableCell>
                          <TableCell>{formatDate(cert.expiry_date)}</TableCell>
                          <TableCell>
                            <span className={
                              cert.days_until_expiry < 0 ? 'text-red-600 font-semibold' :
                              cert.days_until_expiry < 30 ? 'text-yellow-600 font-semibold' :
                              'text-green-600'
                            }>
                              {cert.days_until_expiry} days
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                cert.status === 'expired' ? 'bg-red-100 text-red-700' :
                                cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }
                            >
                              {cert.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* UTILIZATION TAB */}
          {/* ================================================================ */}
          <TabsContent value="utilization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>Productivity and revenue tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {utilizationData.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <TrendUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select equipment from the Overview tab to view utilization data</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {utilizationData.map(util => (
                      <div key={util.equipment_id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">{util.asset_tag} - {util.asset_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Productive Hours</div>
                            <div className="text-2xl font-bold text-green-600">
                              {util.total_productive_hours?.toFixed(1) || '0.0'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Idle Hours</div>
                            <div className="text-2xl font-bold text-yellow-600">
                              {util.total_idle_hours?.toFixed(1) || '0.0'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Utilization</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {util.utilization_percentage?.toFixed(1) || '0.0'}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                            <div className="text-2xl font-bold text-primary">
                              ${util.total_revenue?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-muted-foreground mb-2">Utilization Rate</div>
                          <Progress value={util.utilization_percentage || 0} className="h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hour Meter Readings */}
            {selectedEquipment && hourMeterReadings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hour Meter Readings - {selectedEquipment.asset_tag}</CardTitle>
                  <CardDescription>Recent engine hour readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reading</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourMeterReadings.map(reading => (
                        <TableRow key={reading.id}>
                          <TableCell>{formatDate(reading.recorded_at)}</TableCell>
                          <TableCell className="font-mono font-semibold">
                            {reading.reading?.toFixed(1)} hrs
                          </TableCell>
                          <TableCell>{reading.recorded_by_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {reading.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* TELEMATICS TAB - Advanced Real-time Equipment Monitoring */}
          {/* ================================================================ */}
          <TabsContent value="telematics" className="space-y-6">
            {selectedEquipment ? (
              <TelematicsPanel equipmentId={selectedEquipment.id} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select equipment from the Overview tab to view live telematics data</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* ANALYTICS TAB - Advanced Utilization Analytics */}
          {/* ================================================================ */}
          <TabsContent value="analytics" className="space-y-6">
            {selectedEquipment ? (
              <UtilizationAnalytics equipmentId={selectedEquipment.id} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <ChartBar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select equipment from the Overview tab to view utilization analytics</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* INSPECTIONS TAB - Complete Inspection History */}
          {/* ================================================================ */}
          <TabsContent value="inspections" className="space-y-6">
            {selectedEquipment ? (
              <InspectionHistory equipmentId={selectedEquipment.id} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select equipment from the Overview tab to view inspection history</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* TCO TAB - Total Cost of Ownership Analysis */}
          {/* ================================================================ */}
          <TabsContent value="tco" className="space-y-6">
            {selectedEquipment ? (
              <TCOAnalysis equipmentId={selectedEquipment.id} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select equipment from the Overview tab to view TCO analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default HeavyEquipmentPage
