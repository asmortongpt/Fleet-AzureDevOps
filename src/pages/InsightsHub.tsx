/**
 * InsightsHub - Modern Analytics and Intelligence Dashboard
 * Real-time insights, AI predictions, and actionable recommendations with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  ChartLine as InsightsIcon,
  Brain,
  TrendUp,
  Lightbulb,
  Target,
  Sparkle,
  Warning,
  CheckCircle,
  Clock,
  CurrencyDollar,
  Pulse,
  ChartPie,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveInsightsData } from '@/hooks/use-reactive-insights-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorBoundary from '@/components/common/ErrorBoundary'

/**
 * Overview Tab - Key analytics metrics
 */
function InsightsOverview() {
  const {
    aggregatedMetrics,
    categoryDistribution,
    costSavingsTrend,
    efficiencyTrend,
    isLoading,
    lastUpdate,
  } = useReactiveInsightsData()

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Real-time insights and intelligence across your fleet
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Insights"
          value={aggregatedMetrics?.totalInsights?.toString() || '0'}
          icon={Brain}
          trend="up"
          change={12}
          description="AI-generated insights"
          loading={isLoading}
        />
        <StatCard
          title="Critical Alerts"
          value={aggregatedMetrics?.criticalAlerts?.toString() || '0'}
          icon={Warning}
          trend="down"
          change={-3}
          description="Requiring attention"
          loading={isLoading}
        />
        <StatCard
          title="Potential Savings"
          value={`$${(aggregatedMetrics?.potentialSavings || 0).toLocaleString()}`}
          icon={CurrencyDollar}
          trend="up"
          change={15}
          description="From recommendations"
          loading={isLoading}
        />
        <StatCard
          title="Avg Confidence"
          value={`${aggregatedMetrics?.avgConfidence || 0}%`}
          icon={Target}
          trend="up"
          change={5}
          description="Model accuracy"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Savings Trend */}
        <ResponsiveLineChart
          title="Cost Savings Trend"
          description="Monthly cost savings vs target over 6 months"
          data={costSavingsTrend}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Category Distribution */}
        <ResponsivePieChart
          title="Insights by Category"
          description="Distribution of insights across fleet operations"
          data={categoryDistribution}
          innerRadius={60}
          loading={isLoading}
        />
      </div>

      {/* Efficiency Metrics */}
      <ResponsiveBarChart
        title="Weekly Efficiency Metrics"
        description="Fleet utilization, fuel efficiency, and downtime tracking"
        data={efficiencyTrend}
        height={300}
        loading={isLoading}
      />

      {/* Quick Insights Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-amber-500" />
            <CardTitle>Key Performance Indicators</CardTitle>
          </div>
          <CardDescription>Current fleet performance snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Fleet Utilization</span>
                <TrendUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">87%</p>
              <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Avg Fuel Efficiency</span>
                <TrendUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">8.9 MPG</p>
              <p className="text-xs text-muted-foreground mt-1">+0.7 MPG improvement</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Downtime</span>
                <TrendUp className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold">4 hrs</p>
              <p className="text-xs text-muted-foreground mt-1">Avg per vehicle/week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * AI Insights Tab - AI-powered insights and anomalies
 */
function AIInsightsContent() {
  const {
    topInsights,
    insightPriorityDistribution,
    aggregatedMetrics,
    isLoading,
    lastUpdate,
  } = useReactiveInsightsData()

  const priorityColors = {
    critical: 'destructive',
    high: 'warning',
    medium: 'secondary',
    low: 'default',
  } as const

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI-Powered Insights</h2>
          <p className="text-muted-foreground">
            Machine learning insights and anomaly detection
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Critical Insights"
          value={insightPriorityDistribution?.critical?.toString() || '0'}
          icon={Warning}
          trend="down"
          change={-2}
          description="High priority alerts"
          loading={isLoading}
        />
        <StatCard
          title="High Priority"
          value={insightPriorityDistribution?.high?.toString() || '0'}
          icon={Pulse}
          trend="neutral"
          description="Requires attention"
          loading={isLoading}
        />
        <StatCard
          title="Medium Priority"
          value={insightPriorityDistribution?.medium?.toString() || '0'}
          icon={Brain}
          trend="up"
          description="Review recommended"
          loading={isLoading}
        />
        <StatCard
          title="Total Insights"
          value={aggregatedMetrics?.totalInsights?.toString() || '0'}
          icon={Sparkle}
          trend="up"
          change={8}
          description="All insights"
          loading={isLoading}
        />
      </div>

      {/* Top Insights List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>Top AI Insights</CardTitle>
          </div>
          <CardDescription>Most critical insights based on priority and confidence</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : topInsights.length > 0 ? (
            <div className="space-y-3">
              {topInsights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={priorityColors[insight.priority]}>
                          {insight.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{insight.type}</Badge>
                        <Badge variant="secondary">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Impact: {insight.impact}
                        </span>
                        <span className="flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Action: {insight.action}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No critical insights at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Types Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { type: 'Alert', count: topInsights.filter((i) => i.type === 'alert').length, color: 'text-red-500' },
          { type: 'Recommendation', count: topInsights.filter((i) => i.type === 'recommendation').length, color: 'text-blue-500' },
          { type: 'Anomaly', count: topInsights.filter((i) => i.type === 'anomaly').length, color: 'text-amber-500' },
          { type: 'Opportunity', count: topInsights.filter((i) => i.type === 'opportunity').length, color: 'text-green-500' },
        ].map((item) => (
          <Card key={item.type}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.type}</span>
                <span className={`text-2xl font-bold ${item.color}`}>{item.count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Predictions Tab - Predictive analytics
 */
function PredictionsContent() {
  const {
    highProbabilityPredictionsList,
    predictionTypeDistribution,
    aggregatedMetrics,
    isLoading,
    lastUpdate,
  } = useReactiveInsightsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">
            AI-powered predictions for maintenance, costs, and failures
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Predictions"
          value={aggregatedMetrics?.totalPredictions?.toString() || '0'}
          icon={Brain}
          trend="up"
          description="Active predictions"
          loading={isLoading}
        />
        <StatCard
          title="High Probability"
          value={aggregatedMetrics?.highProbabilityPredictions?.toString() || '0'}
          icon={Target}
          trend="neutral"
          description="≥80% confidence"
          loading={isLoading}
        />
        <StatCard
          title="Avg Confidence"
          value="82%"
          icon={ChartPie}
          trend="up"
          change={3}
          description="Model accuracy"
          loading={isLoading}
        />
      </div>

      {/* Prediction Types Distribution */}
      <ResponsiveBarChart
        title="Predictions by Type"
        description="Distribution of predictions across different categories"
        data={predictionTypeDistribution}
        height={300}
        loading={isLoading}
      />

      {/* High Probability Predictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle>High Probability Predictions</CardTitle>
          </div>
          <CardDescription>Predictions with 70%+ confidence requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : highProbabilityPredictionsList.length > 0 ? (
            <div className="space-y-3">
              {highProbabilityPredictionsList.map((prediction, idx) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={prediction.probability >= 0.9 ? 'destructive' : 'warning'}>
                          {Math.round(prediction.probability * 100)}% probability
                        </Badge>
                        <Badge variant="outline">
                          {prediction.predictionType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-1">
                        {prediction.targetEntity} {prediction.targetId}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Estimated Impact: {prediction.estimatedImpact}
                        {prediction.estimatedCost && ` • Cost: $${prediction.estimatedCost.toLocaleString()}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Predicted Date: {new Date(prediction.predictedDate).toLocaleDateString()}
                      </div>
                      {prediction.preventiveActions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium">Preventive Actions:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {prediction.preventiveActions.slice(0, 3).map((action, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No high probability predictions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Recommendations Tab - Actionable recommendations
 */
function RecommendationsContent() {
  const {
    highRoiRecommendations,
    roiByCategory,
    aggregatedMetrics,
    isLoading,
    lastUpdate,
  } = useReactiveInsightsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Action Recommendations</h2>
          <p className="text-muted-foreground">
            AI-generated recommendations to optimize fleet operations
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Recommendations"
          value={aggregatedMetrics?.totalRecommendations?.toString() || '0'}
          icon={Lightbulb}
          trend="up"
          change={4}
          description="Active recommendations"
          loading={isLoading}
        />
        <StatCard
          title="Potential Savings"
          value={`$${(aggregatedMetrics?.potentialSavings || 0).toLocaleString()}`}
          icon={CurrencyDollar}
          trend="up"
          change={15}
          description="Total identified"
          loading={isLoading}
        />
        <StatCard
          title="Avg ROI"
          value="195%"
          icon={TrendUp}
          trend="up"
          change={12}
          description="Return on investment"
          loading={isLoading}
        />
      </div>

      {/* ROI by Category */}
      <ResponsiveBarChart
        title="ROI by Category"
        description="Return on investment and potential savings by recommendation category"
        data={roiByCategory}
        height={300}
        loading={isLoading}
      />

      {/* High ROI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle>High ROI Recommendations</CardTitle>
          </div>
          <CardDescription>Top recommendations with &gt;100% return on investment</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : highRoiRecommendations.length > 0 ? (
            <div className="space-y-3">
              {highRoiRecommendations.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rec.priority === 'high' ? 'default' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge variant="outline">
                          {rec.category.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {rec.roi && (
                          <Badge variant="default" className="bg-green-500">
                            {rec.roi}% ROI
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        {rec.potentialSavings && (
                          <span className="flex items-center gap-1">
                            <CurrencyDollar className="h-3 w-3" />
                            Savings: ${rec.potentialSavings.toLocaleString()}
                          </span>
                        )}
                        {rec.implementationCost && (
                          <span className="flex items-center gap-1">
                            Cost: ${rec.implementationCost.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Timeline: {rec.timeline}
                        </span>
                      </div>
                      {rec.steps.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium">Implementation Steps:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {rec.steps.slice(0, 3).map((step, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No recommendations at this time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main InsightsHub Component
 */
export default function InsightsHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartPie className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <InsightsOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: <Brain className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading AI insights...</div>}>
            <AIInsightsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'predictions',
      label: 'Predictions',
      icon: <Target className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading predictions...</div>}>
            <PredictionsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading recommendations...</div>}>
            <RecommendationsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Insights Hub"
      description="Analytics, AI insights, and predictive intelligence"
      icon={<InsightsIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
