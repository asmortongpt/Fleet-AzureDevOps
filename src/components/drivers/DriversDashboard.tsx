import {
  User,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Truck,
  Coffee,
  Moon,
  Search,
  Download,
  Send,
  MapPin,
  BarChart3,
  AlertTriangle
} from "lucide-react"
import { useState, useMemo } from "react"

import { DriversMapView } from "./DriversMapView"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Driver, Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"


interface DriversDashboardProps {
  data?: {
    drivers?: Driver[]
    vehicles?: Vehicle[]
  }
}

export function DriversDashboard({ data }: DriversDashboardProps) {
  const drivers = data?.drivers || []
  const vehicles = data?.vehicles || []

  const [activeView, setActiveView] = useState("map")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Calculate statistics
  const stats = useMemo(() => {
    const activeDrivers = drivers.filter(d => d.status === "active")
    const offDutyDrivers = drivers.filter(d => d.status === "off-duty")
    const onLeaveDrivers = drivers.filter(d => d.status === "on-leave")
    const avgSafetyScore = drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length
    const highPerformers = drivers.filter(d => d.safetyScore >= 90).length
    const atRiskDrivers = drivers.filter(d => d.safetyScore < 75).length

    // License expiration alerts (within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const expiringLicenses = drivers.filter(d => {
      const expiryDate = new Date(d.licenseExpiry)
      return expiryDate <= thirtyDaysFromNow
    }).length

    return {
      total: drivers.length,
      active: activeDrivers.length,
      offDuty: offDutyDrivers.length,
      onLeave: onLeaveDrivers.length,
      avgSafetyScore: Math.round(avgSafetyScore),
      highPerformers,
      atRiskDrivers,
      expiringLicenses,
      utilizationRate: Math.round((activeDrivers.length / drivers.length) * 100)
    }
  }, [drivers])

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(drivers.map(d => d.department))
    return Array.from(depts)
  }, [drivers])

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    let filtered = drivers

    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(d => d.department === departmentFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter)
    }

    return filtered
  }, [drivers, searchQuery, departmentFilter, statusFilter])

  const getStatusBadgeVariant = (status: Driver["status"]) => {
    switch (status) {
      case "active":
        return "default"
      case "off-duty":
        return "secondary"
      case "on-leave":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getSafetyScoreBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, label: "Excellent", icon: CheckCircle2 }
    if (score >= 75) return { variant: "secondary" as const, label: "Good", icon: Activity }
    return { variant: "destructive" as const, label: "At Risk", icon: AlertCircle }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Stats Cards */}
      <div className="border-b bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Management</h1>
            <p className="text-muted-foreground">Monitor and manage your fleet drivers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Dispatch
            </Button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Drivers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">On Duty</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Off-Duty</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.offDuty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Coffee className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Break</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-gray-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.onLeave}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Moon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Away</span>
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Safety Score</p>
                  <p className={cn("text-2xl font-bold", getSafetyScoreColor(stats.avgSafetyScore))}>
                    {stats.avgSafetyScore}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">+2.5%</span>
                  </div>
                </div>
                <Award className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiringLicenses}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-muted-foreground">Expiring</span>
                  </div>
                </div>
                <Shield className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeView} onValueChange={setActiveView} className="h-full flex flex-col">
          <div className="border-b px-6 py-2">
            <TabsList>
              <TabsTrigger value="map">
                <MapPin className="h-4 w-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="table">
                <Users className="h-4 w-4 mr-2" />
                Driver List
              </TabsTrigger>
              <TabsTrigger value="performance">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Scheduling
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="map" className="h-full m-0 p-0">
              <DriversMapView
                drivers={drivers}
                vehicles={vehicles}
                onDriverSelect={setSelectedDriver}
              />
            </TabsContent>

            <TabsContent value="table" className="h-full m-0 p-6">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Driver Directory</CardTitle>
                      <CardDescription>{filteredDrivers.length} drivers found</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search drivers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="off-duty">Off-Duty</SelectItem>
                          <SelectItem value="on-leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>License</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Safety Score</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDrivers.map(driver => {
                          const assignedVehicle = vehicles.find(v => v.id === driver.assignedVehicle)
                          const scoreBadge = getSafetyScoreBadge(driver.safetyScore)
                          const ScoreIcon = scoreBadge.icon

                          return (
                            <TableRow key={driver.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{driver.name}</div>
                                  <div className="text-sm text-muted-foreground">{driver.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {driver.employeeId}
                                </code>
                              </TableCell>
                              <TableCell>{driver.department}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm font-medium">{driver.licenseType}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Exp: {driver.licenseExpiry}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(driver.status)}>
                                  {driver.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-lg font-bold", getSafetyScoreColor(driver.safetyScore))}>
                                    {driver.safetyScore}
                                  </span>
                                  <Badge variant={scoreBadge.variant} className="gap-1">
                                    <ScoreIcon className="h-3 w-3" />
                                    {scoreBadge.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {assignedVehicle ? (
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{assignedVehicle.number}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDriver(driver)}>
                                    <User className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="h-full m-0 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Drivers with safety scores ≥ 90</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {drivers
                          .filter(d => d.safetyScore >= 90)
                          .sort((a, b) => b.safetyScore - a.safetyScore)
                          .map((driver, index) => (
                            <div key={driver.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{driver.name}</div>
                                <div className="text-sm text-muted-foreground">{driver.department}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{driver.safetyScore}</div>
                                <Award className="h-4 w-4 text-yellow-500 mx-auto" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>At-Risk Drivers</CardTitle>
                    <CardDescription>Drivers with safety scores &lt; 75</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {drivers
                          .filter(d => d.safetyScore < 75)
                          .sort((a, b) => a.safetyScore - b.safetyScore)
                          .map(driver => (
                            <div key={driver.id} className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <div className="flex-1">
                                <div className="font-medium">{driver.name}</div>
                                <div className="text-sm text-muted-foreground">{driver.department}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{driver.safetyScore}</div>
                                <Button size="sm" variant="outline" className="mt-1">
                                  Action Required
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="h-full m-0 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Scheduling</CardTitle>
                  <CardDescription>Manage driver schedules and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Schedule Management Coming Soon</p>
                    <p className="text-sm">Driver shift scheduling and calendar integration</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
