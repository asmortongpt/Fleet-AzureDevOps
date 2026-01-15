/**
 * OperationsPerformanceDrilldown - Performance metrics for Operations Hub
 * Shows efficiency, fuel consumption, route optimization, and cost analysis
 */

import {
  TrendingUp,
  Fuel,
  Navigation,
  DollarSign,
  Zap,
  Route as RouteIcon,
  Target,
  Activity
} from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PerformanceMetric {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  period: string
}

interface VehiclePerformance {
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  efficiency: number // %
  fuelEconomy: number // MPG
  routeOptimization: number // %
  onTimeDelivery: number // %
  idleTime: number // minutes
  avgSpeed: number // MPH
  totalMiles: number
  totalCost: number
}

interface RouteEfficiency {
  routeId: string
  routeName: string
  routeNumber: string
  plannedDistance: number
  actualDistance: number
  plannedTime: number
  actualTime: number
  efficiency: number // %
  fuelUsed: number
  cost: number
  optimization: number // %
  status: 'completed' | 'active' | 'planned'
}

// Demo data
const demoMetrics: PerformanceMetric[] = [
  {
    id: 'metric-001',
    name: 'Fleet Efficiency',
    value: 92,
    target: 90,
    unit: '%',
    trend: 'up',
    changePercent: 3.5,
    period: 'vs. last week'
  },
  {
    id: 'metric-002',
    name: 'Average MPG',
    value: 18.5,
    target: 17.0,
    unit: 'MPG',
    trend: 'up',
    changePercent: 8.8,
    period: 'vs. last month'
  },
  {
    id: 'metric-003',
    name: 'Route Optimization',
    value: 87,
    target: 85,
    unit: '%',
    trend: 'up',
    changePercent: 2.3,
    period: 'vs. last week'
  },
  {
    id: 'metric-004',
    name: 'On-Time Delivery',
    value: 94,
    target: 95,
    unit: '%',
    trend: 'down',
    changePercent: -1.5,
    period: 'vs. last week'
  },
  {
    id: 'metric-005',
    name: 'Fuel Cost per Mile',
    value: 0.42,
    target: 0.45,
    unit: '$/mi',
    trend: 'down',
    changePercent: -6.7,
    period: 'vs. last month'
  },
  {
    id: 'metric-006',
    name: 'Average Idle Time',
    value: 12.5,
    target: 15.0,
    unit: 'min',
    trend: 'down',
    changePercent: -16.7,
    period: 'vs. last week'
  }
]

const demoVehiclePerformance: VehiclePerformance[] = [
  {
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    vehicleNumber: 'V-1001',
    efficiency: 95,
    fuelEconomy: 19.2,
    routeOptimization: 92,
    onTimeDelivery: 97,
    idleTime: 8,
    avgSpeed: 42,
    totalMiles: 145.5,
    totalCost: 61.11
  },
  {
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    vehicleNumber: 'V-1002',
    efficiency: 88,
    fuelEconomy: 17.8,
    routeOptimization: 85,
    onTimeDelivery: 91,
    idleTime: 15,
    avgSpeed: 38,
    totalMiles: 98.3,
    totalCost: 41.29
  },
  {
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    vehicleNumber: 'V-1003',
    efficiency: 93,
    fuelEconomy: 20.1,
    routeOptimization: 94,
    onTimeDelivery: 96,
    idleTime: 10,
    avgSpeed: 45,
    totalMiles: 128.7,
    totalCost: 54.03
  },
  {
    vehicleId: 'veh-demo-1005',
    vehicleName: 'Ford Transit #1005',
    vehicleNumber: 'V-1005',
    efficiency: 90,
    fuelEconomy: 18.5,
    routeOptimization: 88,
    onTimeDelivery: 95,
    idleTime: 12,
    avgSpeed: 40,
    totalMiles: 87.2,
    totalCost: 36.62
  }
]

const demoRouteEfficiency: RouteEfficiency[] = [
  {
    routeId: 'route-001',
    routeName: 'Downtown Morning Circuit',
    routeNumber: 'RT-1001',
    plannedDistance: 45.5,
    actualDistance: 43.2,
    plannedTime: 240,
    actualTime: 225,
    efficiency: 95,
    fuelUsed: 2.25,
    cost: 8.10,
    optimization: 92,
    status: 'active'
  },
  {
    routeId: 'route-002',
    routeName: 'Campus Delivery Loop',
    routeNumber: 'RT-1002',
    plannedDistance: 32.0,
    actualDistance: 32.5,
    plannedTime: 180,
    actualTime: 175,
    efficiency: 97,
    fuelUsed: 1.62,
    cost: 5.83,
    optimization: 94,
    status: 'completed'
  },
  {
    routeId: 'route-003',
    routeName: 'Airport Shuttle Route',
    routeNumber: 'RT-1003',
    plannedDistance: 28.0,
    actualDistance: 0,
    plannedTime: 120,
    actualTime: 0,
    efficiency: 0,
    fuelUsed: 0,
    cost: 0,
    optimization: 88,
    status: 'planned'
  }
]

export function OperationsPerformanceDrilldown() {
  const { data: metrics } = useSWR<PerformanceMetric[]>(
    '/api/operations/metrics',
    fetcher,
    {
      fallbackData: demoMetrics,
      shouldRetryOnError: false
    }
  )

  const { data: vehiclePerformance } = useSWR<VehiclePerformance[]>(
    '/api/vehicles/performance',
    fetcher,
    {
      fallbackData: demoVehiclePerformance,
      shouldRetryOnError: false
    }
  )

  const { data: routeEfficiency } = useSWR<RouteEfficiency[]>(
    '/api/routes/efficiency',
    fetcher,
    {
      fallbackData: demoRouteEfficiency,
      shouldRetryOnError: false
    }
  )

  const summary = useMemo(() => {
    const avgEfficiency = vehiclePerformance
      ? Math.round(vehiclePerformance.reduce((sum, v) => sum + v.efficiency, 0) / vehiclePerformance.length)
      : 0
    const avgFuelEconomy = vehiclePerformance
      ? (vehiclePerformance.reduce((sum, v) => sum + v.fuelEconomy, 0) / vehiclePerformance.length).toFixed(1)
      : '0.0'
    const totalMiles = vehiclePerformance
      ? vehiclePerformance.reduce((sum, v) => sum + v.totalMiles, 0).toFixed(1)
      : '0.0'
    const totalCost = vehiclePerformance
      ? vehiclePerformance.reduce((sum, v) => sum + v.totalCost, 0).toFixed(2)
      : '0.00'

    return { avgEfficiency, avgFuelEconomy, totalMiles, totalCost }
  }, [vehiclePerformance])

  const vehicleColumns: DrilldownColumn<VehiclePerformance>[] = [
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
      key: 'efficiency',
      header: 'Efficiency',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <Progress value={v.efficiency} className="w-16 h-2" />
          <span className="text-xs font-medium">{v.efficiency}%</span>
        </div>
      )
    },
    {
      key: 'fuelEconomy',
      header: 'MPG',
      sortable: true,
      render: (v) => `${v.fuelEconomy} MPG`
    },
    {
      key: 'routeOptimization',
      header: 'Route Opt.',
      sortable: true,
      render: (v) => `${v.routeOptimization}%`
    },
    {
      key: 'onTimeDelivery',
      header: 'On-Time',
      sortable: true,
      render: (v) => `${v.onTimeDelivery}%`
    },
    {
      key: 'idleTime',
      header: 'Idle Time',
      sortable: true,
      render: (v) => `${v.idleTime}m`
    },
    {
      key: 'totalCost',
      header: 'Cost',
      sortable: true,
      render: (v) => `$${v.totalCost.toFixed(2)}`
    }
  ]

  const routeColumns: DrilldownColumn<RouteEfficiency>[] = [
    {
      key: 'routeNumber',
      header: 'Route',
      sortable: true,
      drilldown: {
        recordType: 'route',
        getRecordId: (r) => r.routeId,
        getRecordLabel: (r) => r.routeName
      },
      render: (r) => r.routeNumber
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'completed' ? 'secondary' : r.status === 'active' ? 'default' : 'outline'}>
          {r.status}
        </Badge>
      )
    },
    {
      key: 'efficiency',
      header: 'Efficiency',
      sortable: true,
      render: (r) => r.status !== 'planned' ? (
        <div className="flex items-center gap-2">
          <Progress value={r.efficiency} className="w-16 h-2" />
          <span className="text-xs font-medium">{r.efficiency}%</span>
        </div>
      ) : '-'
    },
    {
      key: 'actualDistance',
      header: 'Distance',
      sortable: true,
      render: (r) => r.status !== 'planned'
        ? `${r.actualDistance} / ${r.plannedDistance} mi`
        : `${r.plannedDistance} mi (planned)`
    },
    {
      key: 'actualTime',
      header: 'Time',
      sortable: true,
      render: (r) => r.status !== 'planned'
        ? `${r.actualTime} / ${r.plannedTime} min`
        : `${r.plannedTime} min (planned)`
    },
    {
      key: 'cost',
      header: 'Fuel Cost',
      sortable: true,
      render: (r) => r.status !== 'planned' ? `$${r.cost.toFixed(2)}` : '-'
    },
    {
      key: 'optimization',
      header: 'Optimization',
      sortable: true,
      render: (r) => `${r.optimization}%`
    }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (trend: string, metricName: string) => {
    // For some metrics, down is good (cost, idle time)
    const lowerIsBetter = ['Fuel Cost per Mile', 'Average Idle Time']
    const isGood = lowerIsBetter.includes(metricName)
      ? trend === 'down'
      : trend === 'up'

    return isGood ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-2 text-center">
            <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-blue-400">{summary.avgEfficiency}%</div>
            <div className="text-xs text-slate-400">Avg Efficiency</div>
          </CardContent>
        </Card>

        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-2 text-center">
            <Fuel className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-green-400">{summary.avgFuelEconomy}</div>
            <div className="text-xs text-slate-400">Avg MPG</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-900/30 border-purple-700/50">
          <CardContent className="p-2 text-center">
            <Navigation className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-purple-400">{summary.totalMiles}</div>
            <div className="text-xs text-slate-400">Total Miles</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-2 text-center">
            <DollarSign className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-amber-400">${summary.totalCost}</div>
            <div className="text-xs text-slate-400">Total Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Metrics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Target className="w-3 h-3 text-blue-400" />
            Key Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {metrics?.map(metric => (
              <Card key={metric.id}>
                <CardContent className="pt-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.name}</p>
                      <p className="text-sm font-bold">
                        {metric.value.toLocaleString()} {metric.unit}
                      </p>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Target: {metric.target} {metric.unit}</span>
                      <span className={getTrendColor(metric.trend, metric.name)}>
                        {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min((metric.value / metric.target) * 100, 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{metric.period}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Performance */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            Vehicle Performance ({vehiclePerformance?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={vehiclePerformance || []}
            columns={vehicleColumns}
            recordType="vehicle"
            getRecordId={(v) => v.vehicleId}
            getRecordLabel={(v) => v.vehicleName}
            getRecordData={(v) => ({ vehicleId: v.vehicleId })}
            emptyMessage="No vehicle performance data available"
            compact
          />
        </CardContent>
      </Card>

      {/* Route Efficiency */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <RouteIcon className="w-3 h-3 text-purple-400" />
            Route Efficiency ({routeEfficiency?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={routeEfficiency || []}
            columns={routeColumns}
            recordType="route"
            getRecordId={(r) => r.routeId}
            getRecordLabel={(r) => r.routeName}
            getRecordData={(r) => ({ routeId: r.routeId })}
            emptyMessage="No route efficiency data available"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
