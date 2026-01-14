/**
 * RouteDetailPanel - Excel-style matrix view for all routes with stops
 *
 * Comprehensive spreadsheet showing:
 * - All routes with stop details in Excel format
 * - Filter by driver, vehicle, status, date
 * - Sort by start time, total stops
 * - Click row to see all stops in Excel format
 * - Export routes for dispatch planning
 */

import {
  Navigation,
  User,
  Truck,
  Clock,
  Flag,
  Download
} from 'lucide-react'
import { useState, useMemo } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { DrilldownMatrix, MatrixColumn } from '@/components/drilldown/DrilldownMatrix'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RouteMatrixData {
  id: string
  number: string
  name: string
  driverId?: string
  driverName?: string
  vehicleId?: string
  vehicleName?: string
  startTime: string
  endTime: string
  totalStops: number
  completedStops: number
  remainingStops: number
  distance: number
  eta: string
  status: 'active' | 'planned' | 'completed' | 'cancelled'
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Demo data for fallback
const demoRoutes: RouteMatrixData[] = [
  {
    id: 'route-001',
    number: 'RT-1001',
    name: 'Downtown Morning Circuit',
    driverId: 'drv-001',
    driverName: 'John Smith',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    startTime: '2026-01-03T08:00:00',
    endTime: '2026-01-03T12:00:00',
    totalStops: 12,
    completedStops: 8,
    remainingStops: 4,
    distance: 45.5,
    eta: '2026-01-03T11:45:00',
    status: 'active'
  },
  {
    id: 'route-002',
    number: 'RT-1002',
    name: 'Airport Express Route',
    driverId: 'drv-002',
    driverName: 'Sarah Johnson',
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    startTime: '2026-01-03T10:00:00',
    endTime: '2026-01-03T12:00:00',
    totalStops: 2,
    completedStops: 1,
    remainingStops: 1,
    distance: 28.0,
    eta: '2026-01-03T12:00:00',
    status: 'active'
  },
  {
    id: 'route-003',
    number: 'RT-1003',
    name: 'University Campus Loop',
    driverId: 'drv-003',
    driverName: 'Mike Davis',
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    startTime: '2026-01-03T06:00:00',
    endTime: '2026-01-03T09:45:00',
    totalStops: 8,
    completedStops: 8,
    remainingStops: 0,
    distance: 32.5,
    eta: '2026-01-03T09:45:00',
    status: 'completed'
  },
  {
    id: 'route-004',
    number: 'RT-1004',
    name: 'Medical District Route',
    driverId: 'drv-004',
    driverName: 'Lisa Chen',
    vehicleId: 'veh-demo-1005',
    vehicleName: 'Ford Transit #1005',
    startTime: '2026-01-03T14:00:00',
    endTime: '2026-01-03T18:00:00',
    totalStops: 15,
    completedStops: 0,
    remainingStops: 15,
    distance: 52.3,
    eta: '2026-01-03T18:00:00',
    status: 'planned'
  },
  {
    id: 'route-005',
    number: 'RT-1005',
    name: 'Industrial Park Circuit',
    startTime: '2026-01-03T13:00:00',
    endTime: '2026-01-03T16:00:00',
    totalStops: 10,
    completedStops: 0,
    remainingStops: 10,
    distance: 38.7,
    eta: '2026-01-03T16:00:00',
    status: 'planned'
  }
]

export function RouteDetailPanel({ routeId }: { routeId?: string }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [driverFilter, setDriverFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const { data: routes, error, isLoading, mutate } = useSWR<RouteMatrixData[]>(
    '/api/routes',
    fetcher,
    {
      fallbackData: demoRoutes,
      shouldRetryOnError: false,
      refreshInterval: 30000 // Real-time updates every 30 seconds
    }
  )

  // Filter and search
  const filteredRoutes = useMemo(() => {
    if (!routes) return []

    return routes.filter(route => {
      // Status filter
      if (statusFilter !== 'all' && route.status !== statusFilter) return false

      // Driver filter
      if (driverFilter !== 'all' && route.driverId !== driverFilter) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          route.number.toLowerCase().includes(query) ||
          route.name.toLowerCase().includes(query) ||
          route.driverName?.toLowerCase().includes(query) ||
          route.vehicleName?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [routes, statusFilter, driverFilter, searchQuery])

  // Summary metrics
  const metrics = useMemo(() => {
    const active = routes?.filter(r => r.status === 'active').length || 0
    const planned = routes?.filter(r => r.status === 'planned').length || 0
    const completed = routes?.filter(r => r.status === 'completed').length || 0
    const totalStops = routes?.reduce((sum, r) => sum + r.totalStops, 0) || 0
    const completedStops = routes?.reduce((sum, r) => sum + r.completedStops, 0) || 0

    return { active, planned, completed, totalStops, completedStops, total: routes?.length || 0 }
  }, [routes])

  // Get unique drivers for filter
  const drivers = useMemo(() => {
    const uniqueDrivers = new Set<string>()
    routes?.forEach(route => {
      if (route.driverId && route.driverName) {
        uniqueDrivers.add(`${route.driverId}:${route.driverName}`)
      }
    })
    return Array.from(uniqueDrivers).map(d => {
      const [id, name] = d.split(':')
      return { id, name }
    })
  }, [routes])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      planned: 'outline',
      completed: 'secondary',
      cancelled: 'destructive'
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  // Excel-style column definitions
  const columns: MatrixColumn<RouteMatrixData>[] = [
    {
      key: 'number',
      header: 'Route #',
      sticky: true,
      width: '120px',
      render: (route) => <span className="font-mono font-semibold">{route.number}</span>
    },
    {
      key: 'name',
      header: 'Route Name',
      width: '200px',
      render: (route) => <span className="font-medium">{route.name}</span>
    },
    {
      key: 'driver',
      header: 'Driver',
      width: '150px',
      drilldown: {
        recordType: 'driver',
        getRecordId: (route) => route.driverId,
        getRecordLabel: (route) => route.driverName || 'Unassigned'
      },
      render: (route) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{route.driverName || '-'}</span>
        </div>
      )
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: '150px',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (route) => route.vehicleId,
        getRecordLabel: (route) => route.vehicleName || 'Unassigned'
      },
      render: (route) => (
        <div className="flex items-center gap-2">
          <Truck className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{route.vehicleName || '-'}</span>
        </div>
      )
    },
    {
      key: 'startTime',
      header: 'Start Time',
      width: '100px',
      align: 'center',
      render: (route) => (
        <div className="flex items-center gap-1 justify-center">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatTime(route.startTime)}</span>
        </div>
      )
    },
    {
      key: 'endTime',
      header: 'End Time',
      width: '100px',
      align: 'center',
      render: (route) => (
        <div className="flex items-center gap-1 justify-center">
          <Flag className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatTime(route.endTime)}</span>
        </div>
      )
    },
    {
      key: 'stops',
      header: 'Stops',
      width: '120px',
      align: 'center',
      render: (route) => (
        <div className="flex flex-col items-center">
          <span className="font-semibold">{route.completedStops} / {route.totalStops}</span>
          <span className="text-xs text-muted-foreground">{route.remainingStops} remaining</span>
        </div>
      )
    },
    {
      key: 'distance',
      header: 'Miles',
      width: '80px',
      align: 'right',
      render: (route) => (
        <span className="font-medium">{route.distance.toFixed(1)}</span>
      )
    },
    {
      key: 'eta',
      header: 'ETA',
      width: '100px',
      align: 'center',
      render: (route) => (
        <div className="flex items-center gap-1 justify-center">
          <Navigation className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatTime(route.eta)}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      align: 'center',
      render: (route) => getStatusBadge(route.status)
    },
    {
      key: 'completion',
      header: 'Completion',
      width: '140px',
      align: 'center',
      render: (route) => {
        const progress = route.totalStops > 0 ? Math.round((route.completedStops / route.totalStops) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="w-16 h-2" />
            <span className="text-xs font-medium w-8 text-right">{progress}%</span>
          </div>
        )
      }
    }
  ]

  const handleExport = () => {
    // Export to CSV
    const headers = columns.map(c => c.header).join(',')
    const rows = filteredRoutes.map(route => [
      route.number,
      `"${route.name}"`,
      route.driverName || '',
      route.vehicleName || '',
      formatTime(route.startTime),
      formatTime(route.endTime),
      `${route.completedStops}/${route.totalStops}`,
      route.distance.toFixed(1),
      formatTime(route.eta),
      route.status,
      route.totalStops > 0 ? Math.round((route.completedStops / route.totalStops) * 100) : 0
    ].join(','))

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `routes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      <div className="space-y-2">
        {/* Header with Metrics */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Navigation className="h-7 w-7 text-blue-800" />
              Routes Matrix
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete route visibility with stops, timing, and progress tracking
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-blue-800">{metrics.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-amber-600">{metrics.planned}</div>
              <div className="text-xs text-muted-foreground">Planned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-green-600">{metrics.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold">{metrics.total}</div>
              <div className="text-xs text-muted-foreground">Total Routes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-purple-600">
                {metrics.completedStops}/{metrics.totalStops}
              </div>
              <div className="text-xs text-muted-foreground">Stops Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Route #, name, driver, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Driver</label>
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Excel-Style Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Routes List ({filteredRoutes.length})</span>
              <span className="text-sm text-muted-foreground font-normal">
                Click any row to view all stops in Excel format
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DrilldownMatrix
              data={filteredRoutes}
              columns={columns}
              recordType="route"
              getRecordId={(route) => route.id}
              getRecordLabel={(route) => `${route.number} - ${route.name}`}
              getRecordData={(route) => ({ routeId: route.id })}
              emptyMessage="No routes found matching filters"
              rowHeight="compact"
              maxHeight="600px"
              striped
              showGridLines
            />
          </CardContent>
        </Card>
      </div>
    </DrilldownContent>
  )
}
