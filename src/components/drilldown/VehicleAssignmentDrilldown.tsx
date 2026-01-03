/**
 * VehicleAssignmentDrilldown - Vehicle assignment and utilization tracking for Operations Hub
 * Shows current assignments, historical assignments, utilization rates, and idle vehicles
 */

import {
  Truck,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Activity,
  Zap,
  Phone,
  Mail
} from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { useDrilldown } from '@/contexts/DrilldownContext'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

// Demo data
const demoAssignments: VehicleAssignment[] = [
  {
    id: 'assign-001',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    vehicleNumber: 'V-1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    driverPhone: '(850) 555-0101',
    driverEmail: 'john.smith@fleet.com',
    jobId: 'job-001',
    jobNumber: 'JOB-1001',
    jobTitle: 'Downtown Delivery Route',
    assignedDate: '2026-01-03T08:00:00',
    startTime: '2026-01-03T08:15:00',
    estimatedEnd: '2026-01-03T16:00:00',
    status: 'active',
    utilizationPercent: 85,
    hoursActive: 6.5,
    hoursIdle: 0.5
  },
  {
    id: 'assign-002',
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    vehicleNumber: 'V-1002',
    driverId: 'drv-002',
    driverName: 'Sarah Johnson',
    driverPhone: '(850) 555-0102',
    driverEmail: 'sarah.johnson@fleet.com',
    jobId: 'job-002',
    jobNumber: 'JOB-1002',
    jobTitle: 'Airport Cargo Pickup',
    assignedDate: '2026-01-03T10:00:00',
    startTime: '2026-01-03T10:25:00',
    estimatedEnd: '2026-01-03T12:00:00',
    status: 'active',
    utilizationPercent: 92,
    hoursActive: 1.5,
    hoursIdle: 0.2
  },
  {
    id: 'assign-003',
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    vehicleNumber: 'V-1003',
    driverId: 'drv-003',
    driverName: 'Mike Davis',
    assignedDate: '2026-01-03T06:00:00',
    startTime: '2026-01-03T06:00:00',
    endTime: '2026-01-03T09:45:00',
    status: 'completed',
    utilizationPercent: 88,
    hoursActive: 3.75,
    hoursIdle: 0.5
  },
  {
    id: 'assign-004',
    vehicleId: 'veh-demo-1005',
    vehicleName: 'Ford Transit #1005',
    vehicleNumber: 'V-1005',
    driverId: 'drv-004',
    driverName: 'Lisa Chen',
    driverPhone: '(850) 555-0104',
    driverEmail: 'lisa.chen@fleet.com',
    jobId: 'job-005',
    jobNumber: 'JOB-1005',
    jobTitle: 'Emergency Medical Supply Transport',
    assignedDate: '2026-01-03T11:00:00',
    startTime: '2026-01-03T11:05:00',
    estimatedEnd: '2026-01-03T12:00:00',
    status: 'active',
    utilizationPercent: 95,
    hoursActive: 0.8,
    hoursIdle: 0.05
  }
]

const demoUtilization: VehicleUtilization[] = [
  {
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    vehicleNumber: 'V-1001',
    totalHours: 8,
    activeHours: 6.5,
    idleHours: 1.5,
    utilizationRate: 81,
    assignmentCount: 1,
    lastAssignment: '2026-01-03T08:00:00',
    status: 'active',
    currentDriver: 'John Smith',
    currentJob: 'JOB-1001'
  },
  {
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    vehicleNumber: 'V-1002',
    totalHours: 8,
    activeHours: 7.2,
    idleHours: 0.8,
    utilizationRate: 90,
    assignmentCount: 2,
    lastAssignment: '2026-01-03T10:00:00',
    status: 'active',
    currentDriver: 'Sarah Johnson',
    currentJob: 'JOB-1002'
  },
  {
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    vehicleNumber: 'V-1003',
    totalHours: 4,
    activeHours: 3.75,
    idleHours: 0.25,
    utilizationRate: 94,
    assignmentCount: 1,
    lastAssignment: '2026-01-03T06:00:00',
    status: 'idle'
  },
  {
    vehicleId: 'veh-demo-1004',
    vehicleName: 'Dodge Ram #1004',
    vehicleNumber: 'V-1004',
    totalHours: 8,
    activeHours: 0,
    idleHours: 8,
    utilizationRate: 0,
    assignmentCount: 0,
    status: 'idle'
  },
  {
    vehicleId: 'veh-demo-1005',
    vehicleName: 'Ford Transit #1005',
    vehicleNumber: 'V-1005',
    totalHours: 8,
    activeHours: 5.5,
    idleHours: 2.5,
    utilizationRate: 69,
    assignmentCount: 2,
    lastAssignment: '2026-01-03T11:00:00',
    status: 'active',
    currentDriver: 'Lisa Chen',
    currentJob: 'JOB-1005'
  },
  {
    vehicleId: 'veh-demo-1006',
    vehicleName: 'GMC Sierra #1006',
    vehicleNumber: 'V-1006',
    totalHours: 8,
    activeHours: 0,
    idleHours: 8,
    utilizationRate: 0,
    assignmentCount: 0,
    status: 'maintenance'
  }
]

export function VehicleAssignmentDrilldown({ filter }: { filter?: string }) {
  const { push } = useDrilldown()

  const { data: assignments } = useSWR<VehicleAssignment[]>(
    filter ? `/api/assignments?filter=${filter}` : '/api/assignments',
    fetcher,
    {
      fallbackData: demoAssignments,
      shouldRetryOnError: false
    }
  )

  const { data: utilization } = useSWR<VehicleUtilization[]>(
    '/api/vehicles/utilization',
    fetcher,
    {
      fallbackData: demoUtilization,
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-400">{metrics.activeVehicles}</div>
            <div className="text-xs text-slate-400">Active</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-400">{metrics.idleVehicles}</div>
            <div className="text-xs text-slate-400">Idle</div>
          </CardContent>
        </Card>

        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{metrics.maintenanceVehicles}</div>
            <div className="text-xs text-slate-400">Maintenance</div>
          </CardContent>
        </Card>

        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">{metrics.avgUtilization}%</div>
            <div className="text-xs text-slate-400">Avg Utilization</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
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
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
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
