import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Warning,
  ChartPie,
  Calendar,
  Download,
  Target,
  Bell,
  CheckCircle
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface CostSummary {
  totalCost: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'increasing' | 'decreasing' | 'stable'
    forecastedAmount: number
  }>
  topExpenses: Array<{
    description: string
    amount: number
    category: string
    date: Date
  }>
  anomalies: Array<{
    id: string
    amount: number
    category: string
    reason: string
    date: Date
  }>
}

interface BudgetStatus {
  category: string
  allocated: number
  spent: number
  remaining: number
  percentageUsed: number
  isOverBudget: boolean
  forecastedSpend: number
}

interface CostForecast {
  period: string
  predictedAmount: number
  lowerBound: number
  upperBound: number
  confidence: number
}

export function CostAnalysisCenter() {
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([])
  const [forecasts, setForecasts] = useState<CostForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  })

  useEffect(() => {
    fetchCostData()
  }, [dateRange])

  const fetchCostData = async () => {
    setLoading(true)
    try {
      // Fetch cost summary
      const summaryResponse = await apiClient.get(
        `/cost-analysis/summary?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`
      )
      setCostSummary(summaryResponse)

      // Fetch budget status
      const budgetResponse = await apiClient.get("/cost-analysis/budget-status")
      setBudgetStatus(budgetResponse)

      // Fetch forecasts
      const forecastResponse = await apiClient.get("/cost-analysis/forecast?months=3")
      setForecasts(forecastResponse)
    } catch (error) {
      console.error("Error fetching cost data:", error)
      toast.error("Failed to load cost analysis data")
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/cost-analysis/export?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cost-analysis-${dateRange.startDate.toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Cost data exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendUp className="h-4 w-4 text-red-500" weight="bold" />
    if (trend === 'decreasing') return <TrendDown className="h-4 w-4 text-green-500" weight="bold" />
    return <TrendDown className="h-4 w-4 text-gray-500" weight="bold" />
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fuel': 'bg-blue-500',
      'Maintenance': 'bg-orange-500',
      'Insurance': 'bg-purple-500',
      'Depreciation': 'bg-gray-500',
      'Driver': 'bg-green-500',
      'Administrative': 'bg-yellow-500'
    }
    return colors[category] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cost analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CurrencyDollar className="h-8 w-8 text-green-600" weight="fill" />
            Cost Analysis Command Center
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time cost tracking, forecasting, and anomaly detection
          </p>
        </div>
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" weight="bold" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      {costSummary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CurrencyDollar className="h-4 w-4" weight="fill" />
                Total Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costSummary.totalCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">Current period</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ChartPie className="h-4 w-4" weight="fill" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {costSummary.categoryBreakdown.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Active cost categories</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Warning className="h-4 w-4 text-red-600" weight="fill" />
                Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {costSummary.anomalies.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Unusual spending detected</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" weight="fill" />
                Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {budgetStatus.filter(b => !b.isOverBudget).length}/{budgetStatus.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">On track</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="budget">Budget Tracking</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {costSummary && (
            <>
              {/* Category Breakdown Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Distribution</CardTitle>
                  <CardDescription>Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {costSummary.categoryBreakdown.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.category)}`} />
                            <span className="font-medium">{category.category}</span>
                            {getTrendIcon(category.trend)}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${category.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getCategoryColor(category.category)}`}
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Expenses</CardTitle>
                  <CardDescription>Largest individual costs this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costSummary.topExpenses.map((expense, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-bold">
                            ${expense.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {costSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Category Analysis</CardTitle>
                <CardDescription>Cost trends and forecasts by category</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Spend</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Forecasted</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costSummary.categoryBreakdown.map((category) => {
                      const change = category.forecastedAmount - category.amount
                      const changePercent = (change / category.amount) * 100

                      return (
                        <TableRow key={category.category}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.category)}`} />
                              {category.category}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">${category.amount.toLocaleString()}</TableCell>
                          <TableCell>{category.percentage.toFixed(1)}%</TableCell>
                          <TableCell>{getTrendIcon(category.trend)}</TableCell>
                          <TableCell>${category.forecastedAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={change > 0 ? 'text-red-600' : 'text-green-600'}>
                              {change > 0 ? '+' : ''}${change.toLocaleString()}
                              {' '}({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
              <CardDescription>Track spending against allocated budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {budgetStatus.map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{budget.category}</div>
                        <div className="text-sm text-gray-600">
                          ${budget.spent.toLocaleString()} of ${budget.allocated.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={budget.isOverBudget ? "destructive" : budget.percentageUsed > 90 ? "default" : "secondary"}
                          className="mb-1"
                        >
                          {budget.percentageUsed.toFixed(0)}% Used
                        </Badge>
                        <div className="text-sm text-gray-600">
                          ${budget.remaining.toLocaleString()} remaining
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          budget.isOverBudget
                            ? 'bg-red-500'
                            : budget.percentageUsed > 90
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                      />
                    </div>
                    {budget.forecastedSpend > budget.allocated && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <Bell className="h-4 w-4" weight="fill" />
                        <span>
                          Forecasted to exceed budget by ${(budget.forecastedSpend - budget.allocated).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Forecasting</CardTitle>
              <CardDescription>ML-powered predictions for upcoming periods</CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Predicted Amount</TableHead>
                      <TableHead>Lower Bound</TableHead>
                      <TableHead>Upper Bound</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.map((forecast, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <Calendar className="h-4 w-4 inline mr-2" />
                          {forecast.period}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          ${forecast.predictedAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          ${forecast.lowerBound.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          ${forecast.upperBound.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{forecast.confidence}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No forecast data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          {costSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="h-5 w-5 text-red-600" weight="fill" />
                  Cost Anomalies Detected
                </CardTitle>
                <CardDescription>Unusual spending patterns flagged by ML algorithms</CardDescription>
              </CardHeader>
              <CardContent>
                {costSummary.anomalies.length > 0 ? (
                  <div className="space-y-4">
                    {costSummary.anomalies.map((anomaly) => (
                      <Card key={anomaly.id} className="border-l-4 border-l-red-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive">{anomaly.category}</Badge>
                                <span className="text-sm text-gray-600">
                                  {new Date(anomaly.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm mb-2">{anomaly.reason}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">
                                ${anomaly.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-16 w-16 mx-auto mb-3 opacity-50 text-green-500" />
                    <p className="text-lg font-medium">No anomalies detected</p>
                    <p className="text-sm">All spending patterns appear normal</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
