import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Wrench,
  CalendarDots,
  ChartBar,
  Warning,
  CheckCircle,
  Clock,
  CurrencyDollar,
  TrendUp,
  Engine,
  Users
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

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

export function EquipmentDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([])
  const [certificationMatrix, setCertificationMatrix] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
        apiClient.get('/api/heavy-equipment'),
        apiClient.get('/api/heavy-equipment/maintenance/schedules'),
        apiClient.get('/api/heavy-equipment/certifications/expiring?days=60'),
        apiClient.get('/api/heavy-equipment/certifications/matrix')
      ])

      setEquipment(equipmentRes.equipment || [])
      setMaintenanceSchedules(schedulesRes.schedules || [])
      setCertifications(certificationsRes.alerts || [])
      setCertificationMatrix(matrixRes.matrix || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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
    ((s.hours_until_due !== null && s.hours_until_due < 50) ||
     (s.days_until_due !== null && s.days_until_due < 30))
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
                    <p className="text-sm text-yellow-600 mt-1">Due within 30 days or 50 hours</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Maintenance Schedule Table */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Hour-based and calendar-based maintenance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Current Hours</TableHead>
                    <TableHead>Due At</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No maintenance schedules found
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenanceSchedules.map(schedule => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.asset_name}</div>
                            <div className="text-xs text-muted-foreground">{schedule.asset_tag}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{schedule.maintenance_type}</TableCell>
                        <TableCell>{schedule.current_engine_hours?.toFixed(1) || '-'} hrs</TableCell>
                        <TableCell>
                          {schedule.next_due_hours && (
                            <div>{schedule.next_due_hours.toFixed(1)} hrs</div>
                          )}
                          {schedule.next_due_date && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(schedule.next_due_date).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {schedule.hours_until_due !== null && schedule.hours_until_due !== undefined && (
                            <div className={schedule.hours_until_due < 0 ? "text-red-600 font-semibold" : ""}>
                              {schedule.hours_until_due.toFixed(1)} hrs
                            </div>
                          )}
                          {schedule.days_until_due !== null && schedule.days_until_due !== undefined && (
                            <div className={`text-xs ${schedule.days_until_due < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                              {schedule.days_until_due} days
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(schedule.priority)} variant="secondary">
                            {schedule.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={schedule.status === 'overdue' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}
                            variant="secondary"
                          >
                            {schedule.status}
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

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          {/* Certification Alerts */}
          {(expiringCertifications > 0 || expiredCertifications > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expiredCertifications > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Warning className="w-5 h-5 text-red-600" />
                      <CardTitle className="text-red-700">Expired Certifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700">{expiredCertifications}</div>
                    <p className="text-sm text-red-600 mt-1">Operators cannot use equipment</p>
                  </CardContent>
                </Card>
              )}
              {expiringCertifications > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-orange-700">Expiring Soon</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-700">{expiringCertifications}</div>
                    <p className="text-sm text-orange-600 mt-1">Within 30 days</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Certifications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Expiring Certifications</CardTitle>
              <CardDescription>Operator certifications requiring renewal</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Equipment Type</TableHead>
                    <TableHead>Cert Number</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No expiring certifications in the next 60 days
                      </TableCell>
                    </TableRow>
                  ) : (
                    certifications.map(cert => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.operator_name}</TableCell>
                        <TableCell className="capitalize">{cert.equipment_type.replace('_', ' ')}</TableCell>
                        <TableCell className="font-mono text-sm">{cert.certification_number}</TableCell>
                        <TableCell>{new Date(cert.expiry_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={cert.days_until_expiry < 0 ? "text-red-600 font-semibold" : cert.days_until_expiry <= 30 ? "text-orange-600 font-semibold" : ""}>
                            {cert.days_until_expiry} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cert.days_until_expiry < 0
                                ? "bg-red-100 text-red-700"
                                : cert.days_until_expiry <= 30
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                            variant="secondary"
                          >
                            {cert.days_until_expiry < 0 ? 'Expired' : cert.days_until_expiry <= 30 ? 'Critical' : 'Warning'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Operator Certification Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Operator Certification Matrix</CardTitle>
              <CardDescription>Which operators can operate which equipment types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificationMatrix.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No operator certifications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    certificationMatrix.map(operator => (
                      <TableRow key={operator.driver_id}>
                        <TableCell className="font-medium">{operator.operator_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {operator.certifications && operator.certifications.length > 0 ? (
                              operator.certifications.map((cert: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  className={cert.days_until_expiry < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
                                  variant="secondary"
                                >
                                  {cert.equipment_type.replace('_', ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No certifications</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {operator.certifications && operator.certifications.length > 0 ? (
                            <Badge className="bg-green-100 text-green-700" variant="secondary">
                              {operator.certifications.length} active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700" variant="secondary">
                              None
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Utilization</CardTitle>
              <CardDescription>Usage patterns and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <ChartBar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Utilization tracking requires daily hour logs</p>
                <p className="text-sm mt-2">Record hour meter readings to see utilization data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
