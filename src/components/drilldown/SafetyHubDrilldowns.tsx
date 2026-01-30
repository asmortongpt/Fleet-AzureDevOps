/**
 * SafetyHubDrilldowns - List/Detail views for Safety Hub drill-down navigation
 */

import { AlertTriangle, ShieldCheck, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============ DEMO DATA ============

interface IncidentData {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  date: string
  location: string
  vehicleId?: string
  vehicleName?: string
  driverId?: string
  driverName?: string
  oshaRecordable: boolean
  workDaysLost: number
}

const demoIncidents: IncidentData[] = [
  {
    id: "inc-001",
    type: "Vehicle Collision",
    severity: "critical",
    status: "investigating",
    date: "2025-12-15",
    location: "1500 S Adams St, Tallahassee, FL",
    vehicleId: "veh-demo-1001",
    vehicleName: "Ford F-150 #1001",
    driverId: "drv-001",
    driverName: "John Smith",
    oshaRecordable: true,
    workDaysLost: 5
  },
  {
    id: "inc-002",
    type: "Slip and Fall",
    severity: "medium",
    status: "resolved",
    date: "2025-12-10",
    location: "North Service Center, Tallahassee, FL",
    vehicleId: "veh-demo-1002",
    vehicleName: "Chevrolet Silverado #1002",
    oshaRecordable: true,
    workDaysLost: 2
  },
  {
    id: "inc-003",
    type: "Near Miss",
    severity: "low",
    status: "closed",
    date: "2025-12-08",
    location: "South Warehouse, Tallahassee, FL",
    oshaRecordable: false,
    workDaysLost: 0
  },
  {
    id: "inc-004",
    type: "Equipment Malfunction",
    severity: "high",
    status: "open",
    date: "2025-12-14",
    location: "East Depot, Tallahassee, FL",
    vehicleId: "veh-demo-1015",
    vehicleName: "Mercedes Sprinter #1015",
    oshaRecordable: false,
    workDaysLost: 0
  },
  {
    id: "inc-005",
    type: "Chemical Exposure",
    severity: "medium",
    status: "investigating",
    date: "2025-12-12",
    location: "West Facility, Tallahassee, FL",
    oshaRecordable: true,
    workDaysLost: 1
  }
]

// ============ INCIDENT LIST VIEW ============

export function IncidentListView({ filter }: { filter?: string }) {
  const { data: incidents } = useSWR<IncidentData[]>(
    filter ? `/api/incidents?filter=${filter}` : '/api/incidents',
    fetcher,
    {
      fallbackData: demoIncidents,
      shouldRetryOnError: false
    }
  )

  const filteredIncidents = useMemo(() => {
    if (!filter || !incidents) return incidents || []

    switch (filter) {
      case 'recordable':
        return incidents.filter(i => i.oshaRecordable)
      case 'open':
        return incidents.filter(i => i.status === 'open' || i.status === 'investigating')
      case 'high-severity':
        return incidents.filter(i => i.severity === 'high' || i.severity === 'critical')
      default:
        return incidents
    }
  }, [incidents, filter])

  const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<IncidentData>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (incident) => new Date(incident.date).toLocaleDateString(),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (incident) => (
        <Badge variant={getSeverityColor(incident.severity)}>
          {incident.severity}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (incident) => (
        <Badge variant="outline">
          {incident.status}
        </Badge>
      ),
    },
    {
      key: 'vehicleName',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (incident) => incident.vehicleId,
        getRecordLabel: (incident) => incident.vehicleName || `Vehicle ${incident.vehicleId}`,
      },
      render: (incident) => incident.vehicleName || '-',
    },
    {
      key: 'oshaRecordable',
      header: 'OSHA',
      render: (incident) => incident.oshaRecordable ? (
        <CheckCircle className="w-4 h-4 text-orange-500" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      ),
    },
    {
      key: 'workDaysLost',
      header: 'Days Lost',
      sortable: true,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-red-400">
              {filteredIncidents.filter(i => i.status === 'open' || i.status === 'investigating').length}
            </div>
            <div className="text-xs text-slate-400">Open/Investigating</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-amber-400">
              {filteredIncidents.filter(i => i.oshaRecordable).length}
            </div>
            <div className="text-xs text-slate-400">OSHA Recordable</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-emerald-400">
              {filteredIncidents.reduce((sum, i) => sum + i.workDaysLost, 0)}
            </div>
            <div className="text-xs text-slate-400">Total Days Lost</div>
          </CardContent>
        </Card>
      </div>

      {/* Incident Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {filter ? `Filtered Incidents (${filteredIncidents.length})` : `All Incidents (${filteredIncidents.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredIncidents}
            columns={columns}
            recordType="incident"
            getRecordId={(incident) => incident.id}
            getRecordLabel={(incident) => `${incident.type} - ${new Date(incident.date).toLocaleDateString()}`}
            getRecordData={(incident) => ({ incidentId: incident.id })}
            emptyMessage="No incidents found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ LOST TIME INCIDENTS VIEW ============

export function LostTimeIncidentsView() {
  const { data: incidents } = useSWR<IncidentData[]>(
    '/api/incidents?filter=lost-time',
    fetcher,
    {
      fallbackData: demoIncidents.filter(i => i.workDaysLost > 0),
      shouldRetryOnError: false
    }
  )

  const totalDaysLost = incidents?.reduce((sum, i) => sum + i.workDaysLost, 0) || 0

  const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<IncidentData>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (incident) => new Date(incident.date).toLocaleDateString(),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (incident) => (
        <Badge variant={getSeverityColor(incident.severity)}>
          {incident.severity}
        </Badge>
      ),
    },
    {
      key: 'vehicleName',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (incident) => incident.vehicleId,
        getRecordLabel: (incident) => incident.vehicleName || `Vehicle ${incident.vehicleId}`,
      },
      render: (incident) => incident.vehicleName || '-',
    },
    {
      key: 'workDaysLost',
      header: 'Days Lost',
      sortable: true,
      className: 'text-right font-bold text-red-500',
    },
  ]

  return (
    <div className="space-y-2">
      {/* Summary */}
      <Card className="bg-red-900/30 border-red-700/50">
        <CardContent className="p-3 text-center">
          <AlertTriangle className="w-10 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-white">{totalDaysLost}</div>
          <div className="text-sm text-slate-400">Total Work Days Lost</div>
          <div className="text-xs text-slate-500 mt-1">
            from {incidents?.length || 0} incidents
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Calendar className="w-3 h-3 text-red-400" />
            Lost Time Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={incidents || []}
            columns={columns}
            recordType="incident"
            getRecordId={(incident) => incident.id}
            getRecordLabel={(incident) => `${incident.type} - ${new Date(incident.date).toLocaleDateString()}`}
            getRecordData={(incident) => ({ incidentId: incident.id })}
            emptyMessage="No lost time incidents"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ OSHA COMPLIANCE VIEW ============

export function OSHAComplianceView() {
  return (
    <div className="space-y-2">
      {/* Overall Score */}
      <Card className="bg-emerald-900/30 border-emerald-700/50">
        <CardContent className="p-3 text-center">
          <ShieldCheck className="w-10 h-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-white">87%</div>
          <div className="text-sm text-slate-400">OSHA Compliance Score</div>
          <div className="text-xs text-emerald-400 mt-1">+3% from last month</div>
        </CardContent>
      </Card>

      {/* Component Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Compliance Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Recordkeeping', score: 92, color: 'bg-emerald-500' },
            { label: 'Hazard Communication', score: 88, color: 'bg-blue-500' },
            { label: 'Personal Protective Equipment', score: 85, color: 'bg-amber-500' },
            { label: 'Emergency Procedures', score: 90, color: 'bg-emerald-500' },
            { label: 'Incident Reporting', score: 80, color: 'bg-orange-500' },
          ].map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.score}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Recent OSHA Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { date: '2025-12-15', action: 'OSHA 300 Log Updated', status: 'completed' },
            { date: '2025-12-10', action: 'Safety Training Completed', status: 'completed' },
            { date: '2025-12-05', action: 'Hazard Assessment Conducted', status: 'completed' },
            { date: '2025-12-01', action: 'PPE Inspection Due', status: 'pending' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div>
                <div className="font-medium text-white">{item.action}</div>
                <div className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</div>
              </div>
              <Badge variant={item.status === 'completed' ? 'outline' : 'default'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ DAYS INCIDENT FREE VIEW ============

export function DaysIncidentFreeView() {
  const currentStreak = 2
  const longestStreak = 45
  const target = 30

  return (
    <div className="space-y-2">
      {/* Current Streak */}
      <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-700/50">
        <CardContent className="p-3 text-center">
          <ShieldCheck className="w-12 h-9 text-emerald-400 mx-auto mb-2" />
          <div className="text-6xl font-bold text-white mb-2">{currentStreak}</div>
          <div className="text-sm text-slate-300 mb-2">Days Without Incident</div>
          <div className="flex justify-center gap-2 text-sm">
            <div>
              <div className="text-slate-400">Target</div>
              <div className="text-base font-bold text-white">{target}</div>
            </div>
            <div>
              <div className="text-slate-400">Record</div>
              <div className="text-base font-bold text-emerald-400">{longestStreak}</div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
              style={{ width: `${Math.min((currentStreak / target) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {Math.round((currentStreak / target) * 100)}% to target
          </div>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Historical Streaks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { period: 'Oct - Dec 2025', days: 45, status: 'longest' },
            { period: 'Jul - Aug 2025', days: 32, status: 'past' },
            { period: 'Apr - May 2025', days: 28, status: 'past' },
            { period: 'Jan - Feb 2025', days: 21, status: 'past' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div>
                <div className="font-medium text-white">{item.period}</div>
                <div className="text-xs text-slate-400">{item.days} days</div>
              </div>
              {item.status === 'longest' && (
                <Badge variant="default" className="bg-emerald-600">
                  Record
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
