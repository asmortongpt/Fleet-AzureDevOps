import { Zap, Route, DollarSign, Clock, TrendingUp, Settings, BarChart3 } from "lucide-react"
import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFleetData } from "@/hooks/use-fleet-data"

export function FleetOptimizer() {
  const { vehicles, fuelTransactions } = useFleetData()

  // Build performance trend data from fuel transactions grouped by month
  const trendData = useMemo(() => {
    if (!fuelTransactions || fuelTransactions.length === 0) return []

    const monthMap = new Map<string, { gallons: number; cost: number; count: number }>()
    fuelTransactions.forEach((t: any) => {
      const date = t.transactionDate || t.created_at || t.date
      if (!date) return
      const d = new Date(date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = monthMap.get(key) || { gallons: 0, cost: 0, count: 0 }
      existing.gallons += t.quantity || 0
      existing.cost += (t.quantity || 0) * (t.pricePerGallon || 0)
      existing.count += 1
      monthMap.set(key, existing)
    })

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fuelCost: Math.round(data.cost),
        efficiency: data.gallons > 0 ? Math.round((data.count / data.gallons) * 100) / 100 : 0,
      }))
  }, [fuelTransactions])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Optimizer</h1>
          <p className="text-muted-foreground">AI-powered fleet optimization recommendations</p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Run Optimization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-green-600">+5% potential improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">Monthly potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156 hrs</div>
            <p className="text-xs text-muted-foreground">Monthly estimate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A-</div>
            <p className="text-xs text-muted-foreground">Room for improvement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>AI-generated suggestions to improve fleet efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">High Impact</span>
              </div>
              <p className="text-sm text-green-700">Consolidate delivery routes in downtown area to reduce fuel consumption by 15%</p>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Medium Impact</span>
              </div>
              <p className="text-sm text-yellow-700">Schedule preventive maintenance for 3 vehicles to avoid potential breakdowns</p>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Quick Win</span>
              </div>
              <p className="text-sm text-blue-700">Reassign Vehicle 003 to shorter routes to match its fuel efficiency profile</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Performance Trend</CardTitle>
            <CardDescription>Optimization score over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))' }}
                    formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Fuel Cost']}
                  />
                  <Area type="monotone" dataKey="fuelCost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Fuel Cost ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">No performance data available</p>
                <p className="text-xs mt-1">Fuel transaction data will appear here once available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
