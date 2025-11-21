import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  CarProfile,
  TrendUp,
  TrendDown,
  Star,
  Warning,
  CheckCircle,
  Trophy,
  Target
} from "@phosphor-icons/react"
import { MetricCard } from "@/components/MetricCard"
import { ChartCard } from "@/components/ChartCard"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"

interface DriverPerformanceProps {
  data?: any
  data: ReturnType<typeof useFleetData>
}

export function DriverPerformance({ data }: DriverPerformanceProps) {
  const drivers = data.drivers || []
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false)

  const enhancedDrivers = useMemo(() => {
    return drivers.map(driver => ({
      ...driver,
      trips: Math.floor(Math.random() * 200 + 50),
      miles: Math.floor(Math.random() * 5000 + 1000),
      fuelEfficiency: Math.floor(Math.random() * 10 + 20),
      incidents: Math.floor(Math.random() * 5),
      onTimeDelivery: Math.floor(Math.random() * 20 + 80),
      violations: Math.floor(Math.random() * 3),
      overallScore: Math.floor(Math.random() * 30 + 70),
      trend: Math.random() > 0.5 ? "up" : "down"
    }))
  }, [drivers])

  const topPerformers = useMemo(() => {
    return [...enhancedDrivers]
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 5)
  }, [enhancedDrivers])

  const needsAttention = useMemo(() => {
    return enhancedDrivers.filter(d => d.incidents > 2 || d.safetyScore < 75)
  }, [enhancedDrivers])

  const metrics = useMemo(() => {
    const totalTrips = enhancedDrivers.reduce((sum, d) => sum + d.trips, 0)
    const totalMiles = enhancedDrivers.reduce((sum, d) => sum + d.miles, 0)
    const avgSafetyScore = enhancedDrivers.length > 0 
      ? Math.round(enhancedDrivers.reduce((sum, d) => sum + d.safetyScore, 0) / enhancedDrivers.length)
      : 0
    const totalIncidents = enhancedDrivers.reduce((sum, d) => sum + d.incidents, 0)

    return {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === "active").length,
      totalTrips,
      totalMiles,
      avgSafetyScore,
      totalIncidents
    }
  }, [drivers, enhancedDrivers])

  const performanceData = useMemo(() => {
    return [
      { name: "Week 1", score: 85 },
      { name: "Week 2", score: 88 },
      { name: "Week 3", score: 87 },
      { name: "Week 4", score: 92 }
    ]
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success"
    if (score >= 75) return "text-accent"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "bg-success/10 text-success border-success/20" }
    if (score >= 75) return { label: "Good", color: "bg-accent/10 text-accent border-accent/20" }
    if (score >= 60) return { label: "Fair", color: "bg-warning/10 text-warning border-warning/20" }
    return { label: "Needs Improvement", color: "bg-destructive/10 text-destructive border-destructive/20" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Driver Performance</h1>
          <p className="text-muted-foreground mt-1">Monitor and analyze driver metrics and safety scores</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Drivers"
          value={metrics.totalDrivers}
          subtitle={`${metrics.activeDrivers} active`}
          icon={<CarProfile className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Avg Safety Score"
          value={metrics.avgSafetyScore}
          subtitle="fleet average"
          icon={<Star className="w-5 h-5" />}
          status={metrics.avgSafetyScore >= 85 ? "success" : "warning"}
        />
        <MetricCard
          title="Total Trips"
          value={metrics.totalTrips.toLocaleString()}
          subtitle="completed"
          icon={<Target className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Total Incidents"
          value={metrics.totalIncidents}
          subtitle="reported"
          icon={<Warning className="w-5 h-5" />}
          status={metrics.totalIncidents < 10 ? "success" : "warning"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Safety Score Trend"
            type="line"
            data={performanceData}
            dataKey="score"
            color="hsl(var(--accent))"
            height={280}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((driver, index) => (
                <div key={driver.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    index === 0 ? "bg-warning/20 text-warning" :
                    index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                    "bg-accent/20 text-accent"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.department}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getScoreColor(driver.safetyScore)}`}>
                      {driver.safetyScore}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">All Drivers</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
          <TabsTrigger value="attention">Needs Attention</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {enhancedDrivers.map(driver => {
              const badge = getScoreBadge(driver.safetyScore)
              return (
                <Card key={driver.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{driver.name}</h3>
                            <Badge className={badge.color}>
                              {badge.label}
                            </Badge>
                            {driver.trend === "up" && (
                              <TrendUp className="w-4 h-4 text-success" weight="bold" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {driver.employeeId} • {driver.department} • {driver.licenseType}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Safety Score</p>
                              <p className={`font-semibold text-lg ${getScoreColor(driver.safetyScore)}`}>
                                {driver.safetyScore}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Trips</p>
                              <p className="font-semibold text-lg">{driver.trips}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Miles Driven</p>
                              <p className="font-semibold text-lg">{driver.miles.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Incidents</p>
                              <p className={`font-semibold text-lg ${driver.incidents > 2 ? "text-destructive" : ""}`}>
                                {driver.incidents}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">On-Time Delivery</span>
                              <span className="text-xs font-medium">{driver.onTimeDelivery}%</span>
                            </div>
                            <Progress value={driver.onTimeDelivery} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDriver(driver)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="top" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {topPerformers.map((driver, index) => {
              const badge = getScoreBadge(driver.safetyScore)
              return (
                <Card key={driver.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        index === 0 ? "bg-warning/20 text-warning" :
                        index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                        "bg-accent/20 text-accent"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{driver.name}</h3>
                          <Badge className={badge.color}>{badge.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Safety Score: <span className={`font-semibold ${getScoreColor(driver.safetyScore)}`}>
                            {driver.safetyScore}
                          </span> • {driver.trips} trips • {driver.miles.toLocaleString()} miles
                        </p>
                      </div>
                      <Trophy className="w-8 h-8 text-warning" weight="fill" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="attention" className="space-y-4 mt-6">
          {needsAttention.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
                <p className="text-muted-foreground">All drivers are performing well!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {needsAttention.map(driver => (
                <Card key={driver.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                          <Warning className="w-6 h-6" weight="fill" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{driver.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{driver.department}</p>
                          <div className="space-y-2">
                            {driver.safetyScore < 75 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Warning className="w-4 h-4 text-destructive" />
                                <span>Low safety score: {driver.safetyScore}</span>
                              </div>
                            )}
                            {driver.incidents > 2 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Warning className="w-4 h-4 text-destructive" />
                                <span>High incident count: {driver.incidents}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button size="sm">
                        Schedule Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Performance Details</DialogTitle>
            <DialogDescription>
              Complete performance profile for {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Driver Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedDriver.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employee ID:</span>
                      <p className="font-medium">{selectedDriver.employeeId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">{selectedDriver.department}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">License Type:</span>
                      <p className="font-medium">{selectedDriver.licenseType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">License Expiry:</span>
                      <p className="font-medium">{selectedDriver.licenseExpiry}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium">{selectedDriver.email}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${selectedDriver.email}`}
                        >
                          Email
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium">{selectedDriver.phone}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `tel:${selectedDriver.phone}`}
                        >
                          Call
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge variant={selectedDriver.status === "active" ? "default" : "secondary"}>
                          {selectedDriver.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-1">Safety Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(selectedDriver.safetyScore)}`}>
                          {selectedDriver.safetyScore}
                        </p>
                        <Badge className={`mt-2 ${getScoreBadge(selectedDriver.safetyScore).color}`}>
                          {getScoreBadge(selectedDriver.safetyScore).label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-1">Total Trips</p>
                        <p className="text-2xl font-bold">{selectedDriver.trips}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {selectedDriver.miles.toLocaleString()} miles
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs mb-1">Incidents</p>
                        <p className={`text-2xl font-bold ${selectedDriver.incidents > 2 ? "text-destructive" : "text-success"}`}>
                          {selectedDriver.incidents}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Fuel: {selectedDriver.fuelEfficiency} MPG
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">On-Time Delivery Rate</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Performance</span>
                    <span className="text-sm font-medium">{selectedDriver.onTimeDelivery}%</span>
                  </div>
                  <Progress value={selectedDriver.onTimeDelivery} className="h-3" />
                </div>
              </div>

              {selectedDriver.certifications && selectedDriver.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDriver.certifications.map((cert: string, index: number) => (
                      <Badge key={index} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDriver.assignedVehicle && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Assigned Vehicle</h3>
                  <p className="text-sm">{selectedDriver.assignedVehicle}</p>
                </div>
              )}

              {selectedDriver.emergencyContact && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedDriver.emergencyContact.name}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedDriver.emergencyContact.phone}</p>
                    <p><span className="text-muted-foreground">Relationship:</span> {selectedDriver.emergencyContact.relationship}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button>Schedule Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
