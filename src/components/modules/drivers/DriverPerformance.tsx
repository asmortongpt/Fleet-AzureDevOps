import {
  Car,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Target
} from "lucide-react"
import { useMemo, useState } from "react"
import useSWR from "swr"

import { ChartCard } from "@/components/ChartCard"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useInspect } from "@/services/inspect/InspectContext"

interface DriverPerformanceProps {
  data?: ReturnType<typeof useFleetData>
}

interface Driver {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  licenseType: string;
  status: string;
  safetyScore: number;
  trips: number;
  miles: number;
  fuelEfficiency: number;
  incidents: number;
  onTimeDelivery: number;
  violations: number;
  overallScore: number;
  trend: 'up' | 'down';
}

interface LeaderboardEntry {
  driverId: string
  driverName: string
  overallScore: number
  safetyScore: number
  efficiencyScore: number
  complianceScore: number
  trend: string
  achievementCount: number
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const parseMetadata = (value: any) => {
  if (!value) return {}
  if (typeof value === "object") return value
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

/** Safely coerce a value to a finite number, returning fallback (default 0) if NaN/Infinity/undefined/null */
const safeNum = (value: unknown, fallback = 0): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const mapTrend = (trend?: string): 'up' | 'down' => {
  if (!trend) return 'up'
  const normalized = trend.toLowerCase()
  if (normalized === 'declining' || normalized === 'down') return 'down'
  return 'up'
}

export function DriverPerformance(_props: DriverPerformanceProps) {
  const data = useFleetData()
  const drivers = data.drivers || []
  const { openInspect } = useInspect()
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false)
  const { data: leaderboardRaw } = useSWR<any[]>(
    "/api/driver-scorecard/leaderboard?limit=200",
    fetcher,
    { shouldRetryOnError: false }
  )

  const leaderboard = useMemo(() => (Array.isArray(leaderboardRaw) ? leaderboardRaw : []), [leaderboardRaw])
  const leaderboardById = useMemo(() => {
    return leaderboard.reduce<Record<string, any>>((acc, entry) => {
      acc[String(entry.driverId || entry.driver_id)] = entry
      return acc
    }, {})
  }, [leaderboard])

  const enhancedDrivers: typeof drivers[number][] = useMemo(() => {
    return drivers.map(driver => {
      const metadata = parseMetadata((driver as any).metadata)
      const leaderboardEntry = leaderboardById[String(driver.id)] || {}

      const safetyScore = safeNum(leaderboardEntry.safetyScore ?? (driver as any).performance_score ?? (driver as any).safetyScore)
      const overallScore = safeNum(leaderboardEntry.overallScore ?? safetyScore)
      const incidents = safeNum(metadata.incidents ?? metadata.incident_count)
      const violations = safeNum(metadata.violations ?? metadata.violation_count)
      const trips = safeNum(metadata.trips ?? metadata.trip_count)
      const miles = safeNum(metadata.miles ?? metadata.mileage)
      const fuelEfficiency = safeNum(metadata.fuelEfficiency ?? metadata.fuel_efficiency)
      const onTimeDelivery = safeNum(metadata.onTimeDelivery ?? metadata.on_time_delivery)

      return {
        ...driver,
        safetyScore,
        trips,
        miles,
        fuelEfficiency,
        incidents,
        onTimeDelivery,
        violations,
        overallScore,
        trend: mapTrend(leaderboardEntry.trend)
      }
    })
  }, [drivers, leaderboardById])

  const topPerformers = useMemo(() => {
    return [...enhancedDrivers]
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 5)
  }, [enhancedDrivers])

  const needsAttention = useMemo(() => {
    return enhancedDrivers.filter(d => (d as any).incidents > 2 || (d as any).safetyScore < 75)
  }, [enhancedDrivers])

  const metrics = useMemo(() => {
    const totalTrips = enhancedDrivers.reduce((sum, d) => sum + safeNum((d as any).trips), 0)
    const totalMiles = enhancedDrivers.reduce((sum, d) => sum + safeNum((d as any).miles), 0)
    const avgSafetyScore = enhancedDrivers.length > 0
      ? Math.round(enhancedDrivers.reduce((sum, d) => sum + safeNum((d as any).safetyScore), 0) / enhancedDrivers.length)
      : 0
    const totalIncidents = enhancedDrivers.reduce((sum, d) => sum + safeNum((d as any).incidents), 0)

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
    return topPerformers.map((driver) => {
      const driverName =
        (driver as any).name ||
        `${(driver as any).first_name || ''} ${(driver as any).last_name || ''}`.trim() ||
        (driver as any).email ||
        String(driver.id)
      return { name: driverName, score: safeNum((driver as any).safetyScore) }
    })
  }, [topPerformers])

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-success"
    if (score >= 75) return "text-accent"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getScoreBadge = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: "Excellent", color: "bg-success/10 text-success border-success/20" }
    if (score >= 75) return { label: "Good", color: "bg-accent/10 text-accent border-accent/20" }
    if (score >= 60) return { label: "Fair", color: "bg-warning/10 text-warning border-warning/20" }
    return { label: "Needs Improvement", color: "bg-destructive/10 text-destructive border-destructive/20" }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Driver Performance</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          title="Total Drivers"
          value={metrics.totalDrivers}
          subtitle={`${metrics.activeDrivers} active`}
          icon={<Car className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Avg Safety Score"
          value={metrics.avgSafetyScore}
          subtitle="fleet average"
          icon={<Star className="w-3 h-3" />}
          status={metrics.avgSafetyScore >= 85 ? "success" : "warning"}
        />
        <MetricCard
          title="Total Trips"
          value={metrics.totalTrips.toLocaleString()}
          subtitle="completed"
          icon={<Target className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Total Incidents"
          value={metrics.totalIncidents}
          subtitle="reported"
          icon={<AlertTriangle className="w-3 h-3" />}
          status={metrics.totalIncidents < 10 ? "success" : "warning"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <ChartCard
            title="Safety Score Leaders"
            type="bar"
            data={performanceData}
            dataKey="score"
            color="hsl(var(--accent))"
            height={280}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-3 h-3 text-warning" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPerformers.map((driver, index: number) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => push({ type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && push({ type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center font-semibold text-sm ${
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
                    <p className={`font-semibold ${getScoreColor(safeNum(driver.safetyScore))}`}>
                      {safeNum(driver.safetyScore)}
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

        <TabsContent value="overview" className="space-y-2 mt-3">
          <div className="grid grid-cols-1 gap-2">
            {enhancedDrivers.map((driver) => {
              const badge = getScoreBadge(driver.safetyScore)
              return (
                <Card
                  key={driver.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => push({ type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && push({ type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 flex-1">
                        <div className="w-12 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {driver.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-sm">{driver.name}</h3>
                            <Badge className={badge.color}>
                              {badge.label}
                            </Badge>
                            {(driver as any).trend === "up" && (
                              <TrendingUp className="w-4 h-4 text-success" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {driver.employeeId} • {driver.department} • {driver.licenseType}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Safety Score</p>
                              <p className={`font-semibold text-sm ${getScoreColor(safeNum(driver.safetyScore))}`}>
                                {safeNum(driver.safetyScore)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Trips</p>
                              <p className="font-semibold text-sm">{safeNum((driver as any).trips)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Miles Driven</p>
                              <p className="font-semibold text-sm">{safeNum((driver as any).miles).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Incidents</p>
                              <p className={`font-semibold text-sm ${safeNum((driver as any).incidents) > 2 ? "text-destructive" : ""}`}>
                                {safeNum((driver as any).incidents)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">On-Time Delivery</span>
                              <span className="text-xs font-medium">{safeNum((driver as any).onTimeDelivery)}%</span>
                            </div>
                            <Progress value={safeNum((driver as any).onTimeDelivery)} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Open inspect drawer for detailed view
                          openInspect({ type: 'driver', id: driver.id })

                          // Also maintain dialog state for legacy UI
                          // Cast to base Driver type
                          const baseDriver = {
                            id: driver.id,
                            name: driver.name,
                            employeeId: driver.employeeId,
                            department: driver.department,
                            licenseType: driver.licenseType,
                            status: driver.status,
                            safetyScore: driver.safetyScore
                          } as Driver
                          setSelectedDriver(baseDriver)
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

        <TabsContent value="top" className="space-y-2 mt-3">
          <div className="grid grid-cols-1 gap-2">
            {topPerformers.map((driver, index) => {
              const badge = getScoreBadge(driver.safetyScore)
              return (
                <Card key={driver.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-9 rounded-full flex items-center justify-center font-bold text-base ${
                        index === 0 ? "bg-warning/20 text-warning" :
                        index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                        "bg-accent/20 text-accent"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-sm">{driver.name}</h3>
                          <Badge className={badge.color}>{badge.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Safety Score: <span className={`font-semibold ${getScoreColor(safeNum(driver.safetyScore))}`}>
                            {safeNum(driver.safetyScore)}
                          </span> • {safeNum((driver as any).trips)} trips • {safeNum((driver as any).miles).toLocaleString()} miles
                        </p>
                      </div>
                      <Trophy className="w-4 h-4 text-warning" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="attention" className="space-y-2 mt-3">
          {needsAttention.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-9 mx-auto text-success mb-2" />
                <p className="text-muted-foreground">All drivers are performing well!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {needsAttention.map((driver) => (
                <Card key={driver.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 flex-1">
                        <div className="w-12 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{driver.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{driver.department}</p>
                          <div className="space-y-2">
                            {/* Content for needs attention */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
