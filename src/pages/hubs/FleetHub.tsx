import { Suspense, lazy, useState } from 'react'
import { HubLayout, HubGrid, HubPanel } from '@/components/layout/HubLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetData } from '@/hooks/use-fleet-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Car,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

// Lazy load heavy components
const FleetDashboard = lazy(() => import('@/components/modules/FleetDashboard'))
const GarageService = lazy(() => import('@/components/modules/GarageService'))
const VehicleTelemetry = lazy(() => import('@/components/modules/VehicleTelemetry'))

/**
 * FleetHub - Vehicle and maintenance management center
 *
 * Combines:
 * - Vehicle list (35% left)
 * - Fleet health summary (65% right top)
 * - Maintenance queue (65% right bottom)
 *
 * Primary use: Vehicle management, maintenance scheduling, health monitoring
 * NOTE: OBD2 diagnostics moved to Vehicle Inspector drilldown
 */
export default function FleetHub() {
  const fleetData = useFleetData()
  const vehicles = fleetData.vehicles || []
  const [selectedTab, setSelectedTab] = useState<string>('overview')

  // Calculate fleet stats
  const activeVehicles = vehicles.filter(v => v.status === 'active').length
  const inServiceVehicles = vehicles.filter(v => v.status === 'maintenance').length
  const idleVehicles = vehicles.filter(v => v.status === 'idle').length

  return (
    <HubLayout
      title="Fleet Management"
      description="Vehicle inventory, health monitoring, and maintenance scheduling"
    >
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle List - 35% */}
            <div className="lg:col-span-1">
              <HubPanel title="Vehicle List" description={`${vehicles.length} total vehicles`}>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {vehicles.map(vehicle => (
                      <Card key={vehicle.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{vehicle.vehicleNumber || 'Unknown'}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.make} {vehicle.model} • {vehicle.year}
                              </p>
                            </div>
                            <StatusBadge status={vehicle.status} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>

            {/* Right side - 65% */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fleet Health Summary */}
              <HubPanel title="Fleet Health Summary">
                <HubGrid columns={3} className="mb-6">
                  <MetricCard
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    label="Active"
                    value={activeVehicles}
                    trend="+5%"
                  />
                  <MetricCard
                    icon={<Wrench className="h-5 w-5 text-yellow-500" />}
                    label="In Service"
                    value={inServiceVehicles}
                    trend="-2%"
                  />
                  <MetricCard
                    icon={<Clock className="h-5 w-5 text-blue-500" />}
                    label="Idle"
                    value={idleVehicles}
                    trend="0%"
                  />
                </HubGrid>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Fleet Utilization</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </HubPanel>

              {/* Maintenance Queue */}
              <HubPanel title="Maintenance Queue" description="Upcoming and overdue services">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    <MaintenanceItem
                      vehicleId="101"
                      service="Oil Change"
                      dueDate="2 days"
                      priority="high"
                    />
                    <MaintenanceItem
                      vehicleId="205"
                      service="Tire Rotation"
                      dueDate="5 days"
                      priority="medium"
                    />
                    <MaintenanceItem
                      vehicleId="312"
                      service="Brake Inspection"
                      dueDate="OVERDUE"
                      priority="critical"
                    />
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <GarageService data={fleetData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="telemetry" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <VehicleTelemetry />
          </Suspense>
        </TabsContent>
      </Tabs>
    </HubLayout>
  )
}

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    active: { variant: 'default', label: 'Active' },
    idle: { variant: 'secondary', label: 'Idle' },
    maintenance: { variant: 'outline', label: 'Service' },
    unavailable: { variant: 'destructive', label: 'Unavailable' }
  }

  const config = variants[status] || variants.idle

  return <Badge variant={config.variant}>{config.label}</Badge>
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number
  trend?: string
}

function MetricCard({ icon, label, value, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {trend && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

interface MaintenanceItemProps {
  vehicleId: string
  service: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

function MaintenanceItem({ vehicleId, service, dueDate, priority }: MaintenanceItemProps) {
  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Vehicle {vehicleId}</span>
              <Badge variant="outline" className={priorityColors[priority]}>
                {priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{service}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{dueDate}</p>
            <Button size="sm" variant="ghost" className="h-8 mt-1">
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
