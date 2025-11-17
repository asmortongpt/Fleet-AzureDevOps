import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Lightbulb,
  ChartBar,
  TrendUp,
  CarProfile,
  Warning,
  CheckCircle,
  CurrencyDollar,
  Info
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface UtilizationMetric {
  vehicleId: string
  vehicleNumber: string
  utilizationRate: number
  totalHours: number
  activeHours: number
  idleHours: number
  totalMiles: number
  tripsCount: number
  costPerMile: number
  roi: number
  recommendation: string
  recommendationType: string
  potentialSavings: number
}

interface Recommendation {
  id?: string
  type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  potentialSavings: number
  implementationCost: number
  paybackPeriodMonths: number
  confidenceScore: number
  vehicleIds: string[]
  status?: string
}

interface FleetSize {
  currentSize: number
  optimalSize: number
  recommendation: string
  potentialSavings: number
}

export function FleetOptimizer() {
  const [utilizationData, setUtilizationData] = useState<UtilizationMetric[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [fleetSize, setFleetSize] = useState<FleetSize | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("heatmap")

  useEffect(() => {
    fetchUtilizationData()
    fetchRecommendations()
    fetchFleetSize()
  }, [])

  const fetchUtilizationData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/fleet-optimizer/utilization-heatmap")
      setUtilizationData(response)
    } catch (error) {
      console.error("Error fetching utilization data:", error)
      toast.error("Failed to load utilization data")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const response = await apiClient.get("/fleet-optimizer/recommendations")
      setRecommendations(response)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      toast.error("Failed to load recommendations")
    }
  }

  const fetchFleetSize = async () => {
    try {
      const response = await apiClient.get("/fleet-optimizer/optimal-fleet-size?avgDailyDemand=50")
      setFleetSize(response)
    } catch (error) {
      console.error("Error fetching fleet size:", error)
    }
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 60 && rate <= 85) return "bg-green-500"
    if (rate >= 30 && rate < 60) return "bg-yellow-500"
    if (rate < 30) return "bg-red-500"
    return "bg-blue-500"
  }

  const getUtilizationBgColor = (rate: number) => {
    if (rate >= 60 && rate <= 85) return "bg-green-100"
    if (rate >= 30 && rate < 60) return "bg-yellow-100"
    if (rate < 30) return "bg-red-100"
    return "bg-blue-100"
  }

  const getUtilizationTextColor = (rate: number) => {
    if (rate >= 60 && rate <= 85) return "text-green-700"
    if (rate >= 30 && rate < 60) return "text-yellow-700"
    if (rate < 30) return "text-red-700"
    return "text-blue-700"
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: { color: "destructive", icon: Warning },
      high: { color: "default", icon: Info },
      medium: { color: "secondary", icon: Info },
      low: { color: "outline", icon: CheckCircle }
    }
    const variant = variants[priority as keyof typeof variants] || variants.medium
    const Icon = variant.icon

    return (
      <Badge variant={variant.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" weight="fill" />
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getRecommendationTypeIcon = (type: string) => {
    const typeMap: Record<string, any> = {
      'retire': { icon: Warning, color: 'text-red-600' },
      'reassign': { icon: TrendUp, color: 'text-blue-600' },
      'optimize': { icon: Lightbulb, color: 'text-yellow-600' },
      'maintain': { icon: CheckCircle, color: 'text-green-600' },
      'expand': { icon: ChartBar, color: 'text-purple-600' }
    }
    const config = typeMap[type] || typeMap['maintain']
    const Icon = config.icon
    return <Icon className={`h-4 w-4 ${config.color}`} weight="fill" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fleet optimization data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChartBar className="h-8 w-8 text-blue-600" weight="fill" />
          Fleet Utilization Optimizer
        </h1>
        <p className="text-gray-600 mt-2">
          ML-powered analysis and recommendations for fleet optimization
        </p>
      </div>

      {/* Fleet Size Overview */}
      {fleetSize && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CarProfile className="h-5 w-5" weight="fill" />
              Fleet Size Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Fleet Size</div>
                <div className="text-3xl font-bold">{fleetSize.currentSize}</div>
                <div className="text-xs text-gray-500 mt-1">Active vehicles</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Optimal Fleet Size</div>
                <div className="text-3xl font-bold text-blue-600">{fleetSize.optimalSize}</div>
                <div className="text-xs text-gray-500 mt-1">Recommended</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Potential Savings</div>
                <div className="text-3xl font-bold text-green-600">
                  ${fleetSize.potentialSavings.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Annual</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">{fleetSize.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="heatmap">Utilization Heatmap</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-6">
          {/* Utilization Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Optimal Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {utilizationData.filter(v => v.utilizationRate >= 60 && v.utilizationRate <= 85).length}
                </div>
                <div className="text-xs text-gray-600">60-85% range</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Underutilized</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {utilizationData.filter(v => v.utilizationRate < 30).length}
                </div>
                <div className="text-xs text-gray-600">Below 30%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overutilized</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {utilizationData.filter(v => v.utilizationRate > 90).length}
                </div>
                <div className="text-xs text-gray-600">Above 90%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Savings Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${utilizationData.reduce((sum, v) => sum + v.potentialSavings, 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Potential annual</div>
              </CardContent>
            </Card>
          </div>

          {/* Utilization Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization Heatmap</CardTitle>
              <CardDescription>Visual representation of fleet utilization efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Utilization Rate</TableHead>
                    <TableHead>Total Miles</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Cost/Mile</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilizationData.map((vehicle) => (
                    <TableRow key={vehicle.vehicleId}>
                      <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getUtilizationBgColor(vehicle.utilizationRate)}`}>
                            <span className={getUtilizationTextColor(vehicle.utilizationRate)}>
                              {vehicle.utilizationRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={vehicle.utilizationRate}
                            className="h-2"
                            indicatorClassName={getUtilizationColor(vehicle.utilizationRate)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.totalMiles.toLocaleString()}</TableCell>
                      <TableCell>{vehicle.tripsCount}</TableCell>
                      <TableCell>${vehicle.costPerMile.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={vehicle.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {vehicle.roi.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {getRecommendationTypeIcon(vehicle.recommendationType)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm">{vehicle.recommendation}</div>
                        {vehicle.potentialSavings > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            <CurrencyDollar className="h-3 w-3 inline" weight="fill" />
                            Save ${vehicle.potentialSavings.toLocaleString()}/year
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" weight="fill" />
                AI-Generated Recommendations
              </CardTitle>
              <CardDescription>Machine learning insights for fleet optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <Card key={rec.id || idx} className="border-l-4 border-l-blue-600">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{rec.title}</h3>
                            {getPriorityBadge(rec.priority)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Potential Savings</div>
                          <div className="text-lg font-bold text-green-600">
                            ${rec.potentialSavings.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Implementation Cost</div>
                          <div className="text-lg font-bold">
                            ${rec.implementationCost.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Payback Period</div>
                          <div className="text-lg font-bold">
                            {rec.paybackPeriodMonths} months
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-lg font-bold">
                            {rec.confidenceScore.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {rec.vehicleIds && rec.vehicleIds.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Affects {rec.vehicleIds.length} vehicle(s)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No recommendations available</p>
                  <p className="text-sm">Analyze fleet data to generate recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
