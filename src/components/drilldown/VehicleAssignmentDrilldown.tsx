/**
 * VehicleAssignmentDrilldown - Vehicle assignment and utilization tracking for Operations Hub
 * Shows current assignments, historical assignments, utilization rates, and idle vehicles
 */

import {
  Truck,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity,
  Zap
} from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data) => data?.data ?? data)

interface VehicleAssignment {
  id: string
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverEmail?: string
  jobId?: string
  jobNumber?: string
  jobTitle?: string
  assignedDate: string
  startTime?: string
  endTime?: string
  estimatedEnd?: string
  status: 'active' | 'scheduled' | 'completed' | 'cancelled'
  utilizationPercent?: number
  hoursActive?: number
  hoursIdle?: number
}

interface VehicleUtilization {
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  totalHours: number
  activeHours: number
  idleHours: number
  utilizationRate: number
  assignmentCount: number
  lastAssignment?: string
  status: 'active' | 'idle' | 'maintenance'
  currentDriver?: string
  currentJob?: string
}

export function VehicleAssignmentDrilldown({ filter }: { filter?: string }) {
  const { push } = useDrilldown()

  const { data: assignments } = useSWR<VehicleAssignment[]>(
    filter ? `/api/assignments?filter=${filter}` : '/api/assignments',
    fetcher,
    {
      shouldRetryOnError: false
    }
  )

  const { data: utilization } = useSWR<VehicleUtilization[]>(
    '/api/vehicles/utilization',
    fetcher,
    {
      shouldRetryOnError: false
    }
  )

  const filteredAssignments = useMemo(() => {
    if (!filter || !assignments) return assignments || []

    switch (filter) {
      case 'active':
        return assignments.filter(a => a.status === 'active')
      case 'scheduled':
        return assignments.filter(a => a.status === 'scheduled')
      case 'completed':
        return assignments.filter(a => a.status === 'completed')
      default:
        return assignments
    }
  }, [assignments, filter])

  const metrics = useMemo(() => {
    const activeVehicles = utilization?.filter(v => v.status === 'active').length || 0
    const idleVehicles = utilization?.filter(v => v.status === 'idle').length || 0
    const maintenanceVehicles = utilization?.filter(v => v.status === 'maintenance').length || 0
    const avgUtilization = utilization
      ? Math.round(utilization.reduce((sum, v) => sum + v.utilizationRate, 0) / utilization.length)
      : 0

    return {
      activeVehicles,
      idleVehicles,
      maintenanceVehicles,
      avgUtilization,
      totalVehicles: (utilization?.length || 0)
    }
  }, [utilization])

  const assignmentColumns: DrilldownColumn<VehicleAssignment>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (a) => a.vehicleId,
        getRecordLabel: (a) => a.vehicleName
      },
      render: (a) => a.vehicleNumber
    },
    {
      key: 'driverName',
      header: 'Driver',
      drilldown: {
        recordType: 'driver',
        getRecordId: (a) => a.driverId,
        getRecordLabel: (a) => a.driverName || 'Unassigned'
      },
      render: (a) => a.driverName || 'Unassigned'
    },
    {
      key: 'jobNumber',
      header: 'Job',
      drilldown: {
        recordType: 'job',
        getRecordId: (a) => a.jobId,
        getRecordLabel: (a) => a.jobTitle || a.jobNumber || ''
      },
      render: (a) => a.jobNumber || '-'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => (
        <Badge variant={a.status === 'active' ? 'default' : a.status === 'completed' ? 'secondary' : 'outline'}>
          {a.status}
        </Badge>
      )
    },
    {
      key: 'utilizationPercent',
      header: 'Utilization',
      sortable: true,
      render: (a) => a.utilizationPercent ? (
        <div className="flex items-center gap-2">
          <Progress value={a.utilizationPercent} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground">{a.utilizationPercent}%</span>
        </div>
      ) : '-'
    }
  ]

  const utilizationColumns: DrilldownColumn<VehicleUtilization>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (v) => v.vehicleId,
        getRecordLabel: (v) => v.vehicleName
      },
      render: (v) => v.vehicleNumber
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <Badge variant={v.status === 'active' ? 'default' : v.status === 'idle' ? 'outline' : 'destructive'}>
          {v.status}
        </Badge>
      )
    },
    {
      key: 'utilizationRate',
      header: 'Utilization',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <Progress value={v.utilizationRate} className="w-16 h-2" />
          <span className="text-xs font-medium">{v.utilizationRate}%</span>
        </div>
      )
    },
    {
      key: 'activeHours',
      header: 'Active Hours',
      sortable: true,
      render: (v) => `${v.activeHours.toFixed(1)}h`
    },
    {
      key: 'idleHours',
      header: 'Idle Hours',
      sortable: true,
      render: (v) => `${v.idleHours.toFixed(1)}h`
    },
    {
      key: 'assignmentCount',
      header: 'Assignments',
      sortable: true,
      render: (v) => v.assignmentCount
    },
    {
      key: 'currentDriver',
      header: 'Current Driver',
      render: (v) => v.currentDriver || '-'
    }
  ]

  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-2 text-center">
            <Truck className="w-4 h-4 text-blue-700 mx-auto mb-1" />
            <div className="text-sm font-bold text-blue-700">{metrics.activeVehicles}</div>
            <div className="text-xs text-slate-700">Active</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-2 text-center">
            <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-amber-400">{metrics.idleVehicles}</div>
            <div className="text-xs text-slate-700">Idle</div>
          </CardContent>
        </Card>

        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-2 text-center">
            <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-red-400">{metrics.maintenanceVehicles}</div>
            <div className="text-xs text-slate-700">Maintenance</div>
          </CardContent>
        </Card>

        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-2 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-green-400">{metrics.avgUtilization}%</div>
            <div className="text-xs text-slate-700">Avg Utilization</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-700" />
            Current Assignments ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredAssignments}
            columns={assignmentColumns}
            recordType="assignment"
            getRecordId={(a) => a.id}
            getRecordLabel={(a) => `${a.vehicleName} - ${a.driverName || 'Unassigned'}`}
            getRecordData={(a) => ({ assignmentId: a.id })}
            emptyMessage="No assignments found"
            compact
          />
        </CardContent>
      </Card>

      {/* Vehicle Utilization */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-3 h-3 text-green-400" />
            Vehicle Utilization ({utilization?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={utilization || []}
            columns={utilizationColumns}
            recordType="vehicle"
            getRecordId={(v) => v.vehicleId}
            getRecordLabel={(v) => v.vehicleName}
            getRecordData={(v) => ({ vehicleId: v.vehicleId })}
            emptyMessage="No utilization data available"
            compact
          />
        </CardContent>
      </Card>

      {/* Idle Vehicles Alert */}
      {metrics.idleVehicles > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              {metrics.idleVehicles} Idle Vehicle{metrics.idleVehicles > 1 ? 's' : ''} Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              These vehicles are available for immediate assignment:
            </p>
            <div className="space-y-2">
              {utilization
                ?.filter(v => v.status === 'idle')
                .map(v => (
                  <div
                    key={v.vehicleId}
                    className="flex items-center justify-between p-3 rounded bg-background/50"
                  >
                    <div>
                      <p className="font-medium">{v.vehicleName}</p>
                      <p className="text-xs text-muted-foreground">
                        Last used: {v.lastAssignment ? new Date(v.lastAssignment).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => push({
                        id: `vehicle-${v.vehicleId}`,
                        type: 'vehicle',
                        label: v.vehicleName,
                        data: { vehicleId: v.vehicleId }
                      })}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
