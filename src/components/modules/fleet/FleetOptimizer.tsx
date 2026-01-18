import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Route, DollarSign, Clock, TrendingUp, Settings } from "lucide-react"

export function FleetOptimizer() {
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
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chart placeholder - Performance trend data
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
