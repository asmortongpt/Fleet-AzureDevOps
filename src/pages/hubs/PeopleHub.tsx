import { Suspense, lazy, useState } from 'react'
import { HubLayout, HubGrid, HubPanel } from '@/components/layout/HubLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetData } from '@/hooks/use-fleet-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  User,
  Award,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Search,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'

// Lazy load heavy components
const PeopleManagement = lazy(() => import('@/components/modules/PeopleManagement'))
const DriverPerformance = lazy(() => import('@/components/modules/DriverPerformance'))
const DriverScorecard = lazy(() => import('@/components/modules/DriverScorecard'))

/**
 * PeopleHub - Driver and staff management center
 *
 * Combines:
 * - Driver list (left)
 * - Compliance panel (right top)
 * - Performance summary (right bottom)
 *
 * Primary use: Driver management, compliance tracking, performance monitoring
 */
export default function PeopleHub() {
  const fleetData = useFleetData()
  const drivers = fleetData.drivers || []
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<string>('overview')

  // Filter drivers by search
  const filteredDrivers = drivers.filter(d =>
    !searchQuery ||
    (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.employeeId && d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate compliance stats
  const totalDrivers = drivers.length
  const compliantDrivers = drivers.filter(d => d.certificationStatus === 'valid').length
  const expiringSoon = drivers.filter(d => d.certificationStatus === 'expiring').length
  const nonCompliant = drivers.filter(d => d.certificationStatus === 'expired').length

  return (
    <HubLayout
      title="People Management"
      description="Driver management, compliance tracking, and performance monitoring"
    >
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Driver List - Left Side */}
            <div>
              <HubPanel title="Driver List" description={`${totalDrivers} active drivers`}>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drivers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredDrivers.map(driver => (
                      <Card key={driver.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                                {(driver.name || 'U').split(' ').map(n => n[0] || '').join('').slice(0, 2) || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold">{driver.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{driver.employeeId || 'N/A'}</p>
                              </div>
                            </div>
                            <ComplianceBadge status={driver.certificationStatus || 'unknown'} />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {driver.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {driver.email || 'N/A'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>

            {/* Right Side - Compliance & Performance */}
            <div className="space-y-6">
              {/* Compliance Panel */}
              <HubPanel title="Compliance Status">
                <HubGrid columns={2} className="mb-6">
                  <ComplianceMetric
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    label="Compliant"
                    value={compliantDrivers}
                    total={totalDrivers}
                  />
                  <ComplianceMetric
                    icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    label="Expiring Soon"
                    value={expiringSoon}
                    total={totalDrivers}
                  />
                  <ComplianceMetric
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    label="Non-Compliant"
                    value={nonCompliant}
                    total={totalDrivers}
                  />
                  <ComplianceMetric
                    icon={<Award className="h-5 w-5 text-blue-500" />}
                    label="Certifications"
                    value={128}
                    total={totalDrivers * 2}
                  />
                </HubGrid>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Upcoming Expirations</h4>
                  <ExpirationItem
                    driver="John Smith"
                    certification="CDL Class A"
                    expiresIn="15 days"
                    priority="medium"
                  />
                  <ExpirationItem
                    driver="Jane Doe"
                    certification="Medical Card"
                    expiresIn="3 days"
                    priority="high"
                  />
                </div>
              </HubPanel>

              {/* Performance Summary */}
              <HubPanel title="Performance Summary">
                <div className="space-y-4">
                  <PerformanceMetric
                    label="Average Safety Score"
                    value={87}
                    max={100}
                    trend="+3%"
                    color="green"
                  />
                  <PerformanceMetric
                    label="On-Time Delivery Rate"
                    value={94}
                    max={100}
                    trend="+1%"
                    color="blue"
                  />
                  <PerformanceMetric
                    label="Fuel Efficiency Score"
                    value={78}
                    max={100}
                    trend="-2%"
                    color="yellow"
                  />
                </div>
              </HubPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <DriverPerformance data={fleetData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="scorecard" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <DriverScorecard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </HubLayout>
  )
}

// Helper Components
function ComplianceBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    valid: { variant: 'default', label: 'Compliant' },
    expiring: { variant: 'outline', label: 'Expiring' },
    expired: { variant: 'destructive', label: 'Expired' },
    unknown: { variant: 'secondary', label: 'Unknown' }
  }

  const config = variants[status] || variants.unknown

  return <Badge variant={config.variant}>{config.label}</Badge>
}

interface ComplianceMetricProps {
  icon: React.ReactNode
  label: string
  value: number
  total: number
}

function ComplianceMetric({ icon, label, value, total }: ComplianceMetricProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          <span className="text-xs text-muted-foreground">{percentage}%</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

interface ExpirationItemProps {
  driver: string
  certification: string
  expiresIn: string
  priority: 'low' | 'medium' | 'high'
}

function ExpirationItem({ driver, certification, expiresIn, priority }: ExpirationItemProps) {
  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500'
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="space-y-1">
        <p className="font-medium text-sm">{driver}</p>
        <p className="text-xs text-muted-foreground">{certification}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${priorityColors[priority]}`}>{expiresIn}</p>
        <Button size="sm" variant="ghost" className="h-7 text-xs mt-1">
          Renew
        </Button>
      </div>
    </div>
  )
}

interface PerformanceMetricProps {
  label: string
  value: number
  max: number
  trend: string
  color: 'green' | 'blue' | 'yellow' | 'red'
}

function PerformanceMetric({ label, value, max, trend, color }: PerformanceMetricProps) {
  const percentage = (value / max) * 100
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{value}/{max}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClasses[color]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
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
