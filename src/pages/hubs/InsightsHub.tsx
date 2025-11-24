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
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  Activity,
  Calendar
} from 'lucide-react'

// Lazy load heavy components
const FleetAnalytics = lazy(() => import('@/components/modules/FleetAnalytics'))
const CustomReportBuilder = lazy(() => import('@/components/modules/CustomReportBuilder'))
const ExecutiveDashboard = lazy(() => import('@/components/modules/ExecutiveDashboard'))

/**
 * InsightsHub - Analytics, reports, and business intelligence
 *
 * Combines:
 * - Reports panel
 * - Exports panel
 * - Analytics dashboard
 *
 * Primary use: Data analysis, reporting, business intelligence
 */
export default function InsightsHub() {
  const fleetData = useFleetData()
  const [selectedTab, setSelectedTab] = useState<string>('overview')

  return (
    <HubLayout
      title="Insights & Analytics"
      description="Reports, analytics, and business intelligence"
    >
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-6">
          <div className="space-y-6">
            {/* Key Metrics */}
            <HubPanel title="Key Performance Indicators" description="Last 30 days">
              <HubGrid columns={4}>
                <MetricCard
                  icon={<DollarSign className="h-5 w-5 text-green-500" />}
                  label="Total Cost"
                  value="$127,450"
                  change="-5.2%"
                  trend="down"
                />
                <MetricCard
                  icon={<Fuel className="h-5 w-5 text-blue-500" />}
                  label="Fuel Consumption"
                  value="8,234 gal"
                  change="+2.1%"
                  trend="up"
                />
                <MetricCard
                  icon={<Activity className="h-5 w-5 text-purple-500" />}
                  label="Total Miles"
                  value="45,892 mi"
                  change="+8.3%"
                  trend="up"
                />
                <MetricCard
                  icon={<BarChart3 className="h-5 w-5 text-orange-500" />}
                  label="Utilization Rate"
                  value="82%"
                  change="+3.5%"
                  trend="up"
                />
              </HubGrid>
            </HubPanel>

            {/* Reports & Exports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Reports */}
              <HubPanel title="Available Reports" description="Pre-built report templates">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    <ReportItem
                      title="Monthly Fleet Summary"
                      description="Comprehensive fleet performance overview"
                      lastGenerated="2 days ago"
                      category="Summary"
                    />
                    <ReportItem
                      title="Maintenance Cost Analysis"
                      description="Detailed breakdown of maintenance expenses"
                      lastGenerated="1 week ago"
                      category="Financial"
                    />
                    <ReportItem
                      title="Driver Performance Report"
                      description="Individual driver metrics and scores"
                      lastGenerated="3 days ago"
                      category="People"
                    />
                    <ReportItem
                      title="Fuel Efficiency Report"
                      description="Fuel consumption and efficiency analysis"
                      lastGenerated="5 days ago"
                      category="Operations"
                    />
                    <ReportItem
                      title="Compliance Status Report"
                      description="Certification and compliance tracking"
                      lastGenerated="1 day ago"
                      category="Compliance"
                    />
                  </div>
                </ScrollArea>
              </HubPanel>

              {/* Export Center */}
              <HubPanel title="Export Center" description="Download data exports">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Quick Exports</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <ExportButton label="Vehicle Data" format="CSV" />
                      <ExportButton label="Trip Logs" format="Excel" />
                      <ExportButton label="Fuel Records" format="PDF" />
                      <ExportButton label="Maintenance Log" format="CSV" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Recent Exports</h4>
                    <div className="space-y-2">
                      <ExportHistoryItem
                        name="fleet-summary-2024-11.csv"
                        size="2.3 MB"
                        date="Nov 24, 2024"
                      />
                      <ExportHistoryItem
                        name="maintenance-report.pdf"
                        size="1.8 MB"
                        date="Nov 22, 2024"
                      />
                      <ExportHistoryItem
                        name="driver-performance.xlsx"
                        size="945 KB"
                        date="Nov 20, 2024"
                      />
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Custom Export Builder
                  </Button>
                </div>
              </HubPanel>
            </div>

            {/* Analytics Preview */}
            <HubPanel title="Analytics Dashboard Preview">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChartPreview
                    title="Cost Trends"
                    subtitle="Monthly comparison"
                    height={200}
                  />
                  <ChartPreview
                    title="Fleet Utilization"
                    subtitle="By vehicle type"
                    height={200}
                  />
                </div>
                <Button className="w-full" variant="outline">
                  View Full Analytics Dashboard
                </Button>
              </div>
            </HubPanel>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <FleetAnalytics data={fleetData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <CustomReportBuilder />
          </Suspense>
        </TabsContent>
      </Tabs>
    </HubLayout>
  )
}

// Helper Components
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
}

function MetricCard({ icon, label, value, change, trend }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          {icon}
          <span className={`text-xs flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {change}
          </span>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

interface ReportItemProps {
  title: string
  description: string
  lastGenerated: string
  category: string
}

function ReportItem({ title, description, lastGenerated, category }: ReportItemProps) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Last generated: {lastGenerated}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                View
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ExportButtonProps {
  label: string
  format: string
}

function ExportButton({ label, format }: ExportButtonProps) {
  return (
    <Button variant="outline" className="w-full h-auto p-3 flex flex-col items-start gap-1">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{format}</span>
    </Button>
  )
}

interface ExportHistoryItemProps {
  name: string
  size: string
  date: string
}

function ExportHistoryItem({ name, size, date }: ExportHistoryItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{name}</p>
          <p className="text-muted-foreground">{size} • {date}</p>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="h-7 text-xs flex-shrink-0">
        Download
      </Button>
    </div>
  )
}

interface ChartPreviewProps {
  title: string
  subtitle: string
  height: number
}

function ChartPreview({ title, subtitle, height }: ChartPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <div
          className="bg-muted rounded-lg flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
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
