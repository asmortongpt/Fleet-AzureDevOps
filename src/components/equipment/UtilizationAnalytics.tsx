/**
 * UtilizationAnalytics - Advanced equipment utilization metrics and analytics
 * Features:
 * - Productive vs idle time tracking
 * - Utilization rate calculations
 * - Billable hours tracking
 * - Revenue analytics
 * - Efficiency trends
 */

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { apiClient } from '@/lib/api-client'
import { isSuccessResponse } from '@/lib/schemas/responses'
import type { ApiResponse } from '@/lib/schemas/responses'
import logger from '@/utils/logger'

interface UtilizationSummary {
  total_productive_hours: number
  total_idle_hours: number
  total_maintenance_hours: number
  total_down_hours: number
  total_billable_hours: number
  total_revenue: number
  utilization_rate: number
  records: UtilizationRecord[]
}

interface UtilizationRecord {
  id: string
  log_date: string
  productive_hours: number
  idle_hours: number
  maintenance_hours: number
  down_hours: number
  billable_hours: number
  total_revenue: number
  operator_name: string
  job_site: string
  notes: string
}

interface UtilizationAnalyticsProps {
  equipmentId: string
  startDate?: string
  endDate?: string
}

export function UtilizationAnalytics({
  equipmentId,
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate = new Date().toISOString().split('T')[0]
}: UtilizationAnalyticsProps) {
  const [utilization, setUtilization] = useState<UtilizationSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUtilizationData()
  }, [equipmentId, startDate, endDate])

  const fetchUtilizationData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<ApiResponse<{ utilization: UtilizationSummary }>>(
        `/api/heavy-equipment/${equipmentId}/utilization?start_date=${startDate}&end_date=${endDate}`
      )

      if (isSuccessResponse(response) && response.data?.utilization) {
        setUtilization(response.data.utilization)
      }
    } catch (error) {
      logger.error('Error fetching utilization data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !utilization) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const totalHours = utilization.total_productive_hours + utilization.total_idle_hours +
                     utilization.total_maintenance_hours + utilization.total_down_hours
  const revenuePerHour = utilization.total_billable_hours > 0
    ? utilization.total_revenue / utilization.total_billable_hours
    : 0

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {utilization.utilization_rate.toFixed(1)}%
            </div>
            <Progress value={utilization.utilization_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Productive Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {utilization.total_productive_hours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalHours > 0 ? ((utilization.total_productive_hours / totalHours) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${utilization.total_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${revenuePerHour.toFixed(2)}/hr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Billable Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {utilization.total_billable_hours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {utilization.total_productive_hours > 0
                ? ((utilization.total_billable_hours / utilization.total_productive_hours) * 100).toFixed(1)
                : 0
              }% of productive
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Time Breakdown</TabsTrigger>
          <TabsTrigger value="details">Daily Details</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Time Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hour Distribution</CardTitle>
              <CardDescription>How equipment time is allocated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Productive Hours</span>
                  <span className="text-sm font-semibold text-green-600">
                    {utilization.total_productive_hours.toFixed(1)} hrs
                  </span>
                </div>
                <Progress
                  value={totalHours > 0 ? (utilization.total_productive_hours / totalHours) * 100 : 0}
                  className="h-3 [&>div]:bg-green-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Idle Hours</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {utilization.total_idle_hours.toFixed(1)} hrs
                  </span>
                </div>
                <Progress
                  value={totalHours > 0 ? (utilization.total_idle_hours / totalHours) * 100 : 0}
                  className="h-3 [&>div]:bg-yellow-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Maintenance Hours</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {utilization.total_maintenance_hours.toFixed(1)} hrs
                  </span>
                </div>
                <Progress
                  value={totalHours > 0 ? (utilization.total_maintenance_hours / totalHours) * 100 : 0}
                  className="h-3 [&>div]:bg-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Down Time</span>
                  <span className="text-sm font-semibold text-red-600">
                    {utilization.total_down_hours.toFixed(1)} hrs
                  </span>
                </div>
                <Progress
                  value={totalHours > 0 ? (utilization.total_down_hours / totalHours) * 100 : 0}
                  className="h-3 [&>div]:bg-red-500"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Total Hours</span>
                  <span className="font-bold">{totalHours.toFixed(1)} hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Utilization Rate</span>
                  <span className="font-semibold">{utilization.utilization_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Billable Rate</span>
                  <span className="font-semibold">
                    {utilization.total_productive_hours > 0
                      ? ((utilization.total_billable_hours / utilization.total_productive_hours) * 100).toFixed(1)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Idle Rate</span>
                  <span className="font-semibold">
                    {totalHours > 0
                      ? ((utilization.total_idle_hours / totalHours) * 100).toFixed(1)
                      : 0
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Revenue/Hour</span>
                  <span className="font-semibold">${revenuePerHour.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue/Day</span>
                  <span className="font-semibold">
                    ${utilization.records.length > 0
                      ? (utilization.total_revenue / utilization.records.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Revenue</span>
                  <span className="font-semibold text-blue-600">
                    ${utilization.total_revenue.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Daily Utilization Records
              </CardTitle>
              <CardDescription>Detailed breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Job Site</TableHead>
                    <TableHead>Productive</TableHead>
                    <TableHead>Idle</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilization.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No utilization records for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    utilization.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.log_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{record.operator_name || '-'}</TableCell>
                        <TableCell className="text-sm">{record.job_site || '-'}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {parseFloat(record.productive_hours.toString()).toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          {parseFloat(record.idle_hours.toString()).toFixed(1)}h
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(record.billable_hours.toString()).toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-blue-600 font-semibold">
                          ${parseFloat(record.total_revenue.toString()).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Trends
              </CardTitle>
              <CardDescription>Utilization patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Trend visualization would be displayed here
                <br />
                (Chart integration required)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
