import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Calendar,
  Phone,
  Mail,
  Shield,
  Settings,
  Plus,
  Search,
  Filter,
  Award,
  BarChart3
} from "lucide-react"
import { useDrivers, useVehicles } from "@/hooks/use-api"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { cn } from "@/lib/utils"

// Driver Roster Panel
const DriverRoster = ({ drivers }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  // Enhance drivers with mock performance data
  const enhancedDrivers = useMemo(() => {
    return (drivers || []).map(driver => ({
      ...driver,
      status: driver.status || 'active',
      safetyScore: Math.floor(Math.random() * 30) + 70,
      efficiency: Math.floor(Math.random() * 30) + 70,
      completedTrips: Math.floor(Math.random() * 100) + 50,
      assignedVehicle: driver.assignedVehicle || `V-${Math.floor(Math.random() * 100)}`
    }))
  }, [drivers])

  const filteredDrivers = useMemo(() => {
    return enhancedDrivers.filter(driver => {
      const matchesSearch = !searchQuery ||
        driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [enhancedDrivers, searchQuery, statusFilter])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch(status) {
      case 'active': return 'default'
      case 'on_duty': return 'default'
      case 'off_duty': return 'secondary'
      case 'suspended': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Driver Roster</h2>
            <p className="text-muted-foreground">Manage driver assignments and performance</p>
          </div>
          <Button data-testid="add-driver-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="driver-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="driver-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_duty">On Duty</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="score">Sort by Score</SelectItem>
              <SelectItem value="trips">Sort by Trips</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Driver List */}
        <div className="space-y-3">
          {filteredDrivers.map(driver => (
            <Card key={driver.id} data-testid={`driver-card-${driver.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{driver.name}</h4>
                        <Badge variant={getStatusVariant(driver.status)}>
                          {driver.status}
                        </Badge>
                        {driver.safetyScore >= 90 && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {driver.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {driver.phone || 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <Truck className="h-3 w-3 mr-1" />
                          Vehicle: {driver.assignedVehicle}
                        </div>
                        <div className="flex items-center">
                          <Star className={cn("h-3 w-3 mr-1", getScoreColor(driver.safetyScore))}>
                          </Star>
                          Score: <span className={cn("font-medium ml-1", getScoreColor(driver.safetyScore))}>
                            {driver.safetyScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {driver.completedTrips} trips
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDrivers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No drivers found matching your criteria
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Driver Performance Panel
const DriverPerformancePanel = ({ drivers }) => {
  const [selectedDriver, setSelectedDriver] = useState<any>(null)

  // Enhance drivers with mock performance data
  const enhancedDrivers = useMemo(() => {
    return (drivers || []).map(driver => ({
      ...driver,
      safetyScore: Math.floor(Math.random() * 30) + 70,
      efficiency: Math.floor(Math.random() * 30) + 70,
      onTimeDelivery: Math.floor(Math.random() * 20) + 80,
      customerRating: (Math.random() * 1.5 + 3.5).toFixed(1),
      violations: Math.floor(Math.random() * 5),
      completedTrips: Math.floor(Math.random() * 100) + 50,
      totalMiles: Math.floor(Math.random() * 5000) + 1000
    }))
  }, [drivers])

  // Top performers
  const topPerformers = useMemo(() => {
    return [...enhancedDrivers]
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 5)
  }, [enhancedDrivers])

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Driver Performance</h2>
          <p className="text-muted-foreground">Monitor driver performance metrics</p>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  data-testid={`top-performer-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{driver.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {driver.completedTrips} trips • {driver.totalMiles.toLocaleString()} miles
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{driver.safetyScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="performance-metrics">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Safety Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(enhancedDrivers.reduce((sum, d) => sum + d.safetyScore, 0) / enhancedDrivers.length).toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Fleet average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {enhancedDrivers.reduce((sum, d) => sum + d.violations, 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total across fleet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">On-Time Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(enhancedDrivers.reduce((sum, d) => sum + d.onTimeDelivery, 0) / enhancedDrivers.length).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Average rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(enhancedDrivers.reduce((sum, d) => sum + parseFloat(d.customerRating), 0) / enhancedDrivers.length).toFixed(1)} ⭐
              </div>
              <p className="text-sm text-muted-foreground mt-1">Average rating</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// Driver Assignment Panel
const DriverAssignmentPanel = ({ drivers, vehicles }) => {
  const [assignmentFilter, setAssignmentFilter] = useState('all')

  // Mock assignments
  const assignments = useMemo(() => {
    return (drivers || []).map(driver => ({
      driverId: driver.id,
      driverName: driver.name,
      vehicleId: `V-${Math.floor(Math.random() * 100)}`,
      vehicleName: `Vehicle ${Math.floor(Math.random() * 100)}`,
      shift: ['Morning', 'Afternoon', 'Night'][Math.floor(Math.random() * 3)],
      route: `Route ${Math.floor(Math.random() * 20) + 1}`,
      status: ['active', 'scheduled', 'completed'][Math.floor(Math.random() * 3)]
    }))
  }, [drivers])

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Driver Assignments</h2>
            <p className="text-muted-foreground">Manage driver-vehicle assignments and schedules</p>
          </div>
          <Button data-testid="create-assignment-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Filters */}
        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger className="w-48" data-testid="assignment-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignments</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignment List */}
        <div className="space-y-3">
          {assignments.map((assignment, index) => (
            <Card key={index} data-testid={`assignment-card-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">Driver</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{assignment.driverName}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.shift} Shift
                      </div>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="flex-1">
                      <div className="font-semibold">{assignment.vehicleName}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.route}
                      </div>
                    </div>
                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Main Drivers Workspace Component
export function DriversWorkspace({ data }: { data?: any }) {
  const [activeView, setActiveView] = useState('roster')

  // API hooks
  const { data: drivers = [] } = useDrivers()
  const { data: vehicles = [] } = useVehicles()

  return (
    <div className="h-screen flex flex-col" data-testid="drivers-workspace">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Drivers Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Manage drivers, performance, and assignments
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b px-4 py-2">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList data-testid="drivers-view-tabs">
            <TabsTrigger value="roster" data-testid="drivers-tab-roster">
              <Users className="h-4 w-4 mr-2" />
              Driver Roster
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="drivers-tab-performance">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="drivers-tab-assignments">
              <Truck className="h-4 w-4 mr-2" />
              Assignments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'roster' && <DriverRoster drivers={drivers} />}
        {activeView === 'performance' && <DriverPerformancePanel drivers={drivers} />}
        {activeView === 'assignments' && (
          <DriverAssignmentPanel drivers={drivers} vehicles={vehicles} />
        )}
      </div>
    </div>
  )
}
