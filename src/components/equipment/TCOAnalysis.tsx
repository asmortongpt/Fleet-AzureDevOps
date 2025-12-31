/**
 * TCOAnalysis - Total Cost of Ownership tracking and analysis
 * Features:
 * - Acquisition cost tracking
 * - Operating costs (fuel, maintenance, labor)
 * - Depreciation calculations
 * - ROI analysis
 * - Cost per hour calculations
 * - Rent vs buy analysis
 */

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calculator,
  PieChart,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { isSuccessResponse } from '@/lib/schemas/responses'
import type { ApiResponse } from '@/lib/schemas/responses'
import logger from '@/utils/logger'
import { toast } from 'sonner'

interface CostAnalysis {
  equipment_id: string
  analysis_period_start: string
  analysis_period_end: string

  // Cost breakdown
  acquisition_cost: number
  depreciation: number
  maintenance_cost: number
  fuel_cost: number
  labor_cost: number
  insurance_cost: number
  storage_cost: number
  total_operating_cost: number

  // Utilization
  total_hours: number
  productive_hours: number
  utilization_rate: number

  // Financial metrics
  cost_per_hour: number
  revenue_generated: number
  profit_loss: number
  roi_percentage: number

  // Depreciation
  current_value: number
  residual_value: number
  depreciation_rate: number
}

interface TCOAnalysisProps {
  equipmentId: string
  startDate?: string
  endDate?: string
}

export function TCOAnalysis({
  equipmentId,
  startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate = new Date().toISOString().split('T')[0]
}: TCOAnalysisProps) {
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCostAnalysis()
  }, [equipmentId, startDate, endDate])

  const fetchCostAnalysis = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<ApiResponse<{ analysis: CostAnalysis }>>(
        `/api/heavy-equipment/${equipmentId}/cost-analysis?start_date=${startDate}&end_date=${endDate}`
      )

      if (isSuccessResponse(response) && response.data?.analysis) {
        setCostAnalysis(response.data.analysis)
      }
    } catch (error) {
      logger.error('Error fetching cost analysis:', error)
      toast.error('Failed to load cost analysis')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !costAnalysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const totalCost = costAnalysis.total_operating_cost + costAnalysis.depreciation
  const profitMargin = costAnalysis.revenue_generated > 0
    ? ((costAnalysis.profit_loss / costAnalysis.revenue_generated) * 100)
    : 0

  // Cost breakdown for pie chart
  const costBreakdown = [
    { label: 'Maintenance', value: costAnalysis.maintenance_cost, color: 'bg-blue-500' },
    { label: 'Fuel', value: costAnalysis.fuel_cost, color: 'bg-green-500' },
    { label: 'Labor', value: costAnalysis.labor_cost, color: 'bg-yellow-500' },
    { label: 'Insurance', value: costAnalysis.insurance_cost, color: 'bg-purple-500' },
    { label: 'Storage', value: costAnalysis.storage_cost, color: 'bg-orange-500' },
    { label: 'Depreciation', value: costAnalysis.depreciation, color: 'bg-red-500' }
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-4">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${costAnalysis.cost_per_hour.toFixed(2)}/hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${costAnalysis.revenue_generated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costAnalysis.productive_hours > 0
                ? `$${(costAnalysis.revenue_generated / costAnalysis.productive_hours).toFixed(2)}/hour`
                : '$0.00/hour'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Profit/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${costAnalysis.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {costAnalysis.profit_loss >= 0 ? '+' : ''}${costAnalysis.profit_loss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${costAnalysis.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {costAnalysis.roi_percentage >= 0 ? '+' : ''}{costAnalysis.roi_percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Operating Costs
                </CardTitle>
                <CardDescription>Breakdown of operating expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Maintenance</span>
                  <span className="font-semibold">${costAnalysis.maintenance_cost.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalCost > 0 ? (costAnalysis.maintenance_cost / totalCost) * 100 : 0}
                  className="h-2 [&>div]:bg-blue-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Fuel</span>
                  <span className="font-semibold">${costAnalysis.fuel_cost.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalCost > 0 ? (costAnalysis.fuel_cost / totalCost) * 100 : 0}
                  className="h-2 [&>div]:bg-green-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Labor</span>
                  <span className="font-semibold">${costAnalysis.labor_cost.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalCost > 0 ? (costAnalysis.labor_cost / totalCost) * 100 : 0}
                  className="h-2 [&>div]:bg-yellow-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Insurance</span>
                  <span className="font-semibold">${costAnalysis.insurance_cost.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalCost > 0 ? (costAnalysis.insurance_cost / totalCost) * 100 : 0}
                  className="h-2 [&>div]:bg-purple-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage</span>
                  <span className="font-semibold">${costAnalysis.storage_cost.toLocaleString()}</span>
                </div>
                <Progress
                  value={totalCost > 0 ? (costAnalysis.storage_cost / totalCost) * 100 : 0}
                  className="h-2 [&>div]:bg-orange-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
                <CardDescription>Total cost analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {costBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${item.color}`}></div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-semibold">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Operating Cost</span>
                    <span>${costAnalysis.total_operating_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Depreciation</span>
                    <span>${costAnalysis.depreciation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Cost</span>
                    <span className="text-red-600">${totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Depreciation Tab */}
        <TabsContent value="depreciation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Acquisition Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalysis.acquisition_cost.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Original purchase price</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${costAnalysis.current_value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {costAnalysis.acquisition_cost > 0
                    ? `${((costAnalysis.current_value / costAnalysis.acquisition_cost) * 100).toFixed(1)}% of original`
                    : 'N/A'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Depreciation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${costAnalysis.depreciation.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {costAnalysis.depreciation_rate.toFixed(2)}% rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Value Retention</CardTitle>
              <CardDescription>Equipment value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Value</span>
                  <Badge variant="default">${costAnalysis.current_value.toLocaleString()}</Badge>
                </div>
                <Progress
                  value={costAnalysis.acquisition_cost > 0
                    ? (costAnalysis.current_value / costAnalysis.acquisition_cost) * 100
                    : 0
                  }
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>Residual: ${costAnalysis.residual_value.toLocaleString()}</span>
                  <span>${costAnalysis.acquisition_cost.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Cost Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Cost per Hour</span>
                  <span className="font-semibold">${costAnalysis.cost_per_hour.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue per Hour</span>
                  <span className="font-semibold">
                    ${costAnalysis.productive_hours > 0
                      ? (costAnalysis.revenue_generated / costAnalysis.productive_hours).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Profit per Hour</span>
                  <span className={`font-semibold ${
                    costAnalysis.total_hours > 0 && (costAnalysis.profit_loss / costAnalysis.total_hours) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    ${costAnalysis.total_hours > 0
                      ? (costAnalysis.profit_loss / costAnalysis.total_hours).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilization Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Hours</span>
                  <span className="font-semibold">{costAnalysis.total_hours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Productive Hours</span>
                  <span className="font-semibold text-green-600">
                    {costAnalysis.productive_hours.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Utilization Rate</span>
                  <span className="font-semibold">{costAnalysis.utilization_rate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
              <CardDescription>Performance and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Profitability</h4>
                  <div className="space-y-2 text-sm">
                    <p>Total Profit/Loss: <span className={`font-bold ${costAnalysis.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${costAnalysis.profit_loss.toLocaleString()}
                    </span></p>
                    <p>Profit Margin: <span className="font-semibold">{profitMargin.toFixed(1)}%</span></p>
                    <p>ROI: <span className={`font-semibold ${costAnalysis.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {costAnalysis.roi_percentage.toFixed(1)}%
                    </span></p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Cost Efficiency</h4>
                  <div className="space-y-2 text-sm">
                    <p>Operating Cost/Hour: <span className="font-semibold">${costAnalysis.cost_per_hour.toFixed(2)}</span></p>
                    <p>Utilization: <span className="font-semibold">{costAnalysis.utilization_rate.toFixed(1)}%</span></p>
                    <p>
                      Status: <Badge variant={costAnalysis.profit_loss >= 0 ? 'default' : 'destructive'}>
                        {costAnalysis.profit_loss >= 0 ? 'Profitable' : 'Loss'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Recommendations</h4>
                <ul className="space-y-2 text-sm">
                  {costAnalysis.utilization_rate < 70 && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 text-yellow-600" />
                      <span>Increase utilization rate to improve cost efficiency (currently {costAnalysis.utilization_rate.toFixed(1)}%)</span>
                    </li>
                  )}
                  {costAnalysis.maintenance_cost > costAnalysis.total_operating_cost * 0.4 && (
                    <li className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 mt-0.5 text-red-600" />
                      <span>High maintenance costs detected. Consider preventive maintenance review.</span>
                    </li>
                  )}
                  {costAnalysis.roi_percentage < 0 && (
                    <li className="flex items-start gap-2">
                      <Calculator className="w-4 h-4 mt-0.5 text-red-600" />
                      <span>Negative ROI. Review pricing strategy or consider equipment replacement.</span>
                    </li>
                  )}
                  {costAnalysis.utilization_rate >= 70 && costAnalysis.profit_loss > 0 && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 text-green-600" />
                      <span>Equipment is performing well with strong utilization and profitability.</span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
