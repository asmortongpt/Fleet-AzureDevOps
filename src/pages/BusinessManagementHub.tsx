/**
 * BusinessManagementHub - Consolidated Business Management Dashboard
 *
 * Consolidates:
 * - FinancialHub (budget tracking, cost analysis)
 * - ProcurementHub (vendor management, purchasing)
 * - AnalyticsHub (business intelligence, metrics)
 * - ReportsHub (report generation, dashboards)
 *
 * Features:
 * - Financial oversight and cost analysis
 * - Procurement and vendor management
 * - Business analytics and insights
 * - Comprehensive reporting
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  ShoppingCart,
  BarChart,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  Wallet,
  PieChart,
  LineChart,
  Download,
  Calendar,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Receipt,
  Tag,
  Percent
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Financial Tab - Budget tracking and cost analysis
 */
const FinancialTabContent = memo(function FinancialTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Financial Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Budget"
          value="$125,000"
          icon={Wallet}
          change={8}
          trend="up"
          description="Current month"
        />
        <StatCard
          title="Actual Spend"
          value="$98,500"
          icon={DollarSign}
          change={12}
          trend="down"
          description="79% of budget"
        />
        <StatCard
          title="Cost Per Mile"
          value="$0.42"
          icon={TrendingDown}
          change={5}
          trend="up"
          description="Fleet average"
        />
        <StatCard
          title="Savings YTD"
          value="$47,200"
          icon={Target}
          change={15}
          trend="up"
          description="vs last year"
        />
      </motion.div>

      {/* Budget vs Actual */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Budget vs Actual Spending
            </CardTitle>
            <CardDescription>Monthly comparison of budgeted vs actual costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveBarChart
              title="Budget vs Actual Costs"
              data={[
                { name: 'Jan', month: 'Jan', budget: 125000, actual: 118000 },
                { name: 'Feb', month: 'Feb', budget: 125000, actual: 122000 },
                { name: 'Mar', month: 'Mar', budget: 125000, actual: 115000 },
                { name: 'Apr', month: 'Apr', budget: 125000, actual: 128000 },
                { name: 'May', month: 'May', budget: 125000, actual: 121000 },
                { name: 'Jun', month: 'Jun', budget: 125000, actual: 98500 },
              ]}
              dataKeys={['budget', 'actual']}
              colors={['#3b82f6', '#10b981']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost Breakdown */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cost Breakdown by Category
            </CardTitle>
            <CardDescription>Distribution of fleet expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsivePieChart
              title="Cost Breakdown by Category"
              data={[
                { name: 'Fuel', value: 35000, fill: '#3b82f6' },
                { name: 'Maintenance', value: 25000, fill: '#10b981' },
                { name: 'Insurance', value: 15000, fill: '#f59e0b' },
                { name: 'Personnel', value: 18500, fill: '#ef4444' },
                { name: 'Other', value: 5000, fill: '#8b5cf6' },
              ]}
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest fleet expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { description: 'Fuel Purchase - Station A', amount: 450.25, category: 'Fuel', date: '2026-01-29' },
                { description: 'Tire Replacement - Vehicle 1234', amount: 800.00, category: 'Maintenance', date: '2026-01-28' },
                { description: 'Monthly Insurance Premium', amount: 2500.00, category: 'Insurance', date: '2026-01-27' },
                { description: 'Oil Change - Vehicle 5678', amount: 75.00, category: 'Maintenance', date: '2026-01-26' },
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} · {transaction.date}
                    </p>
                  </div>
                  <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Procurement Tab - Vendor management and purchasing
 */
const ProcurementTabContent = memo(function ProcurementTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Procurement Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Vendors"
          value={24}
          icon={Building}
          change={3}
          trend="up"
          description="Approved suppliers"
        />
        <StatCard
          title="Open Purchase Orders"
          value={18}
          icon={ShoppingCart}
          change={5}
          trend="down"
          description="Pending delivery"
        />
        <StatCard
          title="Avg Vendor Rating"
          value="4.6/5"
          icon={Award}
          change={0.2}
          trend="up"
          description="Supplier quality"
        />
        <StatCard
          title="Cost Savings"
          value="$12,450"
          icon={Percent}
          change={18}
          trend="up"
          description="Through negotiation"
        />
      </motion.div>

      {/* Active Vendors */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Top Vendors
            </CardTitle>
            <CardDescription>Most frequently used suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'ABC Auto Parts', category: 'Parts & Supplies', orders: 45, rating: 4.8 },
                { name: 'Quality Fuel Co.', category: 'Fuel Supply', orders: 38, rating: 4.7 },
                { name: 'Fleet Maintenance Pros', category: 'Service Provider', orders: 32, rating: 4.9 },
                { name: 'Tire World', category: 'Tires', orders: 28, rating: 4.5 },
              ].map((vendor) => (
                <div key={vendor.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.category} · {vendor.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{vendor.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Purchase Orders */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Purchase Orders
            </CardTitle>
            <CardDescription>Latest procurement requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { po: 'PO-2026-001', vendor: 'ABC Auto Parts', items: 'Brake Pads (x12)', status: 'Delivered', amount: 1200 },
                { po: 'PO-2026-002', vendor: 'Quality Fuel Co.', items: 'Diesel Fuel (500 gal)', status: 'In Transit', amount: 1750 },
                { po: 'PO-2026-003', vendor: 'Tire World', items: 'Truck Tires (x8)', status: 'Pending', amount: 3200 },
              ].map((order) => (
                <div key={order.po} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.po}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.vendor} · {order.items}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      order.status === 'Delivered' ? 'default' :
                      order.status === 'In Transit' ? 'secondary' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                    <p className="font-semibold">${order.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Analytics Tab - Business intelligence and metrics
 */
const AnalyticsTabContent = memo(function AnalyticsTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Analytics Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fleet Utilization"
          value="87%"
          icon={BarChart}
          change={5}
          trend="up"
          description="Vehicle usage"
        />
        <StatCard
          title="ROI"
          value="142%"
          icon={TrendingUp}
          change={8}
          trend="up"
          description="Return on investment"
        />
        <StatCard
          title="Efficiency Score"
          value="8.4/10"
          icon={Target}
          change={0.3}
          trend="up"
          description="Overall performance"
        />
        <StatCard
          title="Cost Reduction"
          value="18%"
          icon={TrendingDown}
          change={4}
          trend="up"
          description="vs last year"
        />
      </motion.div>

      {/* Performance Trends */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <CardDescription>Tracking critical business metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              title="Key Performance Indicators"
              data={[
                { name: 'Jan', month: 'Jan', utilization: 82, efficiency: 7.8, roi: 135 },
                { name: 'Feb', month: 'Feb', utilization: 85, efficiency: 8.0, roi: 138 },
                { name: 'Mar', month: 'Mar', utilization: 84, efficiency: 8.1, roi: 140 },
                { name: 'Apr', month: 'Apr', utilization: 86, efficiency: 8.2, roi: 141 },
                { name: 'May', month: 'May', utilization: 88, efficiency: 8.3, roi: 142 },
                { name: 'Jun', month: 'Jun', utilization: 87, efficiency: 8.4, roi: 142 },
              ]}
              dataKeys={['utilization', 'efficiency']}
              colors={['#3b82f6', '#10b981']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Insights */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
            <CardDescription>Business objectives and targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { goal: 'Reduce Fuel Costs', current: 85, target: 100 },
                { goal: 'Increase Utilization', current: 87, target: 90 },
                { goal: 'Improve Safety Score', current: 95, target: 98 },
                { goal: 'Vendor Cost Savings', current: 78, target: 80 },
              ].map((item) => (
                <div key={item.goal} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.goal}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.current}% / {item.target}%
                    </p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(item.current / item.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Insights
            </CardTitle>
            <CardDescription>Data-driven recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { insight: 'Fuel costs trending down 12% this month', type: 'positive' },
                { insight: 'Vehicle 1234 maintenance overdue by 7 days', type: 'warning' },
                { insight: '3 drivers eligible for performance bonus', type: 'positive' },
                { insight: 'Fleet utilization below target in Region B', type: 'warning' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {item.type === 'positive' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <p className="text-sm">{item.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Reports Tab - Report generation and dashboards
 */
const ReportsTabContent = memo(function ReportsTabContent() {
  // Handler for generating reports
  const handleGenerateReport = (reportName: string) => {
    toast.success(`Generating report: ${reportName}`)
    logger.info('Generate report:', reportName)
    // TODO: Add real API call to generate report
  }

  // Handler for downloading reports
  const handleDownloadReport = (reportName: string) => {
    toast.success(`Downloading report: ${reportName}`)
    logger.info('Download report:', reportName)
    // TODO: Add real API call to download report
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Report Categories */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Reports"
          value={36}
          icon={FileText}
          description="Report templates"
        />
        <StatCard
          title="Generated This Month"
          value={142}
          icon={Download}
          change={12}
          trend="up"
          description="Report instances"
        />
        <StatCard
          title="Scheduled Reports"
          value={8}
          icon={Calendar}
          description="Auto-generated"
        />
        <StatCard
          title="Custom Dashboards"
          value={5}
          icon={BarChart}
          description="User created"
        />
      </motion.div>

      {/* Report Library */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Library
            </CardTitle>
            <CardDescription>Available reports and templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Monthly Financial Summary', category: 'Financial', schedule: 'Monthly', format: 'PDF' },
                { name: 'Fleet Utilization Report', category: 'Analytics', schedule: 'Weekly', format: 'Excel' },
                { name: 'Vendor Performance Review', category: 'Procurement', schedule: 'Quarterly', format: 'PDF' },
                { name: 'Cost Analysis Dashboard', category: 'Financial', schedule: 'On Demand', format: 'Interactive' },
                { name: 'Executive Summary', category: 'Management', schedule: 'Monthly', format: 'PowerPoint' },
              ].map((report) => (
                <div key={report.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.category} · {report.schedule} · {report.format}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleGenerateReport(report.name)}>
                      <Download className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Reports */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Generated
            </CardTitle>
            <CardDescription>Latest report outputs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Monthly Financial Summary - January 2026', generatedBy: 'System', date: '2026-01-29' },
                { name: 'Fleet Utilization Report - Week 4', generatedBy: 'John Smith', date: '2026-01-28' },
                { name: 'Cost Analysis Dashboard - Q4 2025', generatedBy: 'Jane Doe', date: '2026-01-25' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated by {item.generatedBy} · {item.date}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport(item.name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessManagementHub() {
  const [activeTab, setActiveTab] = useState('financial')
  const { user } = useAuth()

  return (
    <HubPage
      title="Business Management"
      description="Financial oversight, procurement, analytics, and comprehensive reporting"
      icon={<BarChart className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial" className="flex items-center gap-2" data-testid="hub-tab-financial">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="procurement" className="flex items-center gap-2" data-testid="hub-tab-procurement">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Procurement</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="hub-tab-analytics">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2" data-testid="hub-tab-reports">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="financial" className="mt-6">
                <ErrorBoundary>
                  <FinancialTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="procurement" className="mt-6">
                <ErrorBoundary>
                  <ProcurementTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <ErrorBoundary>
                  <AnalyticsTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <ErrorBoundary>
                  <ReportsTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
