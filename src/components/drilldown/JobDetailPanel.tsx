/**
 * JobDetailPanel - Excel-style matrix view for all active jobs/work orders
 *
 * Comprehensive spreadsheet showing:
 * - All jobs/work orders with full operational data
 * - Excel-like grid with filtering, sorting, and export
 * - Real-time status updates
 * - Click any row to drill into job details
 */

import {
  Package,
  User,
  Truck,
  Clock,
  MapPin,
  Navigation,
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

interface JobMatrixData {
  id: string
  number: string
  customer: string
  address: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'pending' | 'completed' | 'delayed' | 'cancelled'
  driverId?: string
  driverName?: string
  vehicleId?: string
  vehicleName?: string
  startTime: string
  eta: string
  duration: number
  progress: number
  delayMinutes?: number
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data) => data?.data ?? data)

export function JobDetailPanel({ jobId }: { jobId?: string }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const { data: jobs, error, isLoading, mutate } = useSWR<JobMatrixData[]>(
    '/api/jobs',
    fetcher,
    {
      shouldRetryOnError: false,
      refreshInterval: 30000 // Real-time updates every 30 seconds
    }
  )

  // Filter and search
  const filteredJobs = useMemo(() => {
    if (!jobs) return []

    return jobs.filter(job => {
      // Status filter
      if (statusFilter !== 'all' && job.status !== statusFilter) return false

      // Priority filter
      if (priorityFilter !== 'all' && job.priority !== priorityFilter) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          job.number.toLowerCase().includes(query) ||
          job.customer.toLowerCase().includes(query) ||
          job.driverName?.toLowerCase().includes(query) ||
          job.address.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [jobs, statusFilter, priorityFilter, searchQuery])

  // Summary metrics
  const metrics = useMemo(() => {
    const active = jobs?.filter(j => j.status === 'active').length || 0
    const delayed = jobs?.filter(j => j.status === 'delayed').length || 0
    const completed = jobs?.filter(j => j.status === 'completed').length || 0
    const pending = jobs?.filter(j => j.status === 'pending').length || 0

    return { active, delayed, completed, pending, total: jobs?.length || 0 }
  }, [jobs])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'outline',
      completed: 'secondary',
      delayed: 'destructive',
      cancelled: 'outline'
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const
    return <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>{priority}</Badge>
  }

  // Excel-style column definitions
  const columns: MatrixColumn<JobMatrixData>[] = [
    {
      key: 'number',
      header: 'Job #',
      sticky: true,
      width: '120px',
      render: (job) => <span className="font-mono font-semibold">{job.number}</span>
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '200px',
      render: (job) => (
        <div>
          <p className="font-medium">{job.customer}</p>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Address',
      width: '250px',
      render: (job) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">{job.address}</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '100px',
      align: 'center',
      render: (job) => getPriorityBadge(job.priority)
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      align: 'center',
      render: (job) => getStatusBadge(job.status)
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      width: '150px',
      drilldown: {
        recordType: 'driver',
        getRecordId: (job) => job.driverId,
        getRecordLabel: (job) => job.driverName || 'Unassigned'
      },
      render: (job) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{job.driverName || '-'}</span>
        </div>
      )
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: '150px',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (job) => job.vehicleId,
        getRecordLabel: (job) => job.vehicleName || 'Unassigned'
      },
      render: (job) => (
        <div className="flex items-center gap-2">
          <Truck className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{job.vehicleName || '-'}</span>
        </div>
      )
    },
    {
      key: 'startTime',
      header: 'Start Time',
      width: '100px',
      align: 'center',
      render: (job) => (
        <div className="flex items-center gap-1 justify-center">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatTime(job.startTime)}</span>
        </div>
      )
    },
    {
      key: 'eta',
      header: 'ETA',
      width: '100px',
      align: 'center',
      render: (job) => (
        <div className="flex items-center gap-1 justify-center">
          <Navigation className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatTime(job.eta)}</span>
        </div>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      width: '100px',
      align: 'right',
      render: (job) => `${Math.floor(job.duration / 60)}h ${job.duration % 60}m`
    },
    {
      key: 'progress',
      header: 'Progress %',
      width: '140px',
      align: 'center',
      render: (job) => (
        <div className="flex items-center gap-2">
          <Progress value={job.progress} className="w-16 h-2" />
          <span className="text-xs font-medium w-8 text-right">{job.progress}%</span>
        </div>
      )
    }
  ]

  const handleExport = () => {
    // Export to CSV
    const headers = columns.map(c => c.header).join(',')
    const rows = filteredJobs.map(job => [
      job.number,
      `"${job.customer}"`,
      `"${job.address}"`,
      job.priority,
      job.status,
      job.driverName || '',
      job.vehicleName || '',
      formatTime(job.startTime),
      formatTime(job.eta),
      job.duration,
      job.progress
    ].join(','))

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      <div className="space-y-2">
        {/* Header with Metrics */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-800" />
              Active Jobs Matrix
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time operational visibility across all jobs and work orders
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
              <div className="text-sm font-bold text-red-600">{metrics.delayed}</div>
              <div className="text-xs text-muted-foreground">Delayed</div>
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
              <div className="text-sm font-bold text-amber-600">{metrics.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold">{metrics.total}</div>
              <div className="text-xs text-muted-foreground">Total Jobs</div>
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
                  placeholder="Job #, customer, driver, address..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
              <span>Jobs List ({filteredJobs.length})</span>
              <span className="text-sm text-muted-foreground font-normal">
                Click any row to view full job details
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DrilldownMatrix
              data={filteredJobs}
              columns={columns}
              recordType="job"
              getRecordId={(job) => job.id}
              getRecordLabel={(job) => `${job.number} - ${job.customer}`}
              getRecordData={(job) => ({ jobId: job.id })}
              emptyMessage="No jobs found matching filters"
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
