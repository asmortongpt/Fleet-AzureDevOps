import {
  ChartBar,
  Warning,
  Clock,
  Engine
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import logger from '@/utils/logger';

interface Equipment {
  id: string
  asset_tag: string
  asset_name: string
  equipment_type: string
  engine_hours: number
  availability_status: string
  current_job_site?: string
  is_rental: boolean
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

interface UtilizationData {
  equipment_id: string
  asset_tag: string
  asset_name: string
  total_productive_hours: number
  total_idle_hours: number
  utilization_percentage: number
  total_revenue: number
}

interface ApiResponse<T> {
  equipment?: T;
  schedules?: T;
  alerts?: T;
  matrix?: T;
}

export function EquipmentDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [_utilizationData, _setUtilizationData] = useState<UtilizationData[]>([])
  const [certificationMatrix, setCertificationMatrix] = useState<any[]>([])
  const [_loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        equipmentRes,
        schedulesRes,
        certificationsRes,
        matrixRes
      ] = await Promise.all([
        apiClient.get<ApiResponse<Equipment[]>>('/api/heavy-equipment'),
        apiClient.get<ApiResponse<MaintenanceSchedule[]>>('/api/heavy-equipment/maintenance/schedules'),
        apiClient.get<ApiResponse<Certification[]>>('/api/heavy-equipment/certifications/expiring?days=60'),
        apiClient.get<ApiResponse<any[]>>('/api/heavy-equipment/certifications/matrix')
      ])

      setEquipment(equipmentRes.data.equipment || [])
      setMaintenanceSchedules(schedulesRes.data.schedules || [])
      setCertifications(certificationsRes.data.alerts || [])
      setCertificationMatrix(matrixRes.data.matrix || [])
    } catch (error) {
      logger.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Equipment Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive view of heavy equipment utilization, maintenance, and certifications
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
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
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No equipment data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map(eq => (
                      <TableRow key={eq.id}>
                        <TableCell className="font-mono text-sm font-medium">{eq.asset_tag}</TableCell>
                        <TableCell className="font-medium">{eq.asset_name}</TableCell>
                        <TableCell className="capitalize">{eq.equipment_type?.replace('_', ' ')}</TableCell>
                        <TableCell>{parseFloat(eq.engine_hours?.toString() || '0').toFixed(1)} hrs</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(eq.availability_status)} variant="secondary">
                            {eq.availability_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {eq.current_job_site || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
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
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          {/* Certification content would go here */}
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-6">
          {/* Utilization content would go here */}
        </TabsContent>
      </Tabs>
    </div>
  )
}