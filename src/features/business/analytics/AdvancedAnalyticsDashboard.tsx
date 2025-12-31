import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  PsychologyAlt as AIIcon,
  Speed as SpeedIcon,
  AccountBalance as AccountBalanceIcon,
  Eco as EcoIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  Lightbulb as LightbulbIcon,
  Flag as FlagIcon,
  Star as StarIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { format, parseISO } from 'date-fns';
import AdvancedAnalyticsService, {
  FleetMetrics,
  PredictiveInsight,
  KPITrend,
  BenchmarkData,
  CostOptimization,
  ExecutiveReport
} from '../../services/analytics/AdvancedAnalyticsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [kpiTrends, setKpiTrends] = useState<KPITrend[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);
  const [executiveReport, setExecutiveReport] = useState<ExecutiveReport | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<PredictiveInsight | null>(null);
  const [realtimeKPIs, setRealtimeKPIs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '2024-10-01',
    end: '2024-10-31'
  });

  useEffect(() => {
    initializeData();

    // Set up real-time data refresh
    const interval = setInterval(refreshRealtimeData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      const [metricsData, insightsData, trendsData, benchmarkData, optimizationData, reportData, realtimeData] = await Promise.all([
        AdvancedAnalyticsService.getFleetMetrics(),
        AdvancedAnalyticsService.getPredictiveInsights(),
        AdvancedAnalyticsService.getKPITrends(),
        AdvancedAnalyticsService.getBenchmarkData(),
        AdvancedAnalyticsService.getCostOptimizations(),
        AdvancedAnalyticsService.generateExecutiveReport({
          start: dateRange.start,
          end: dateRange.end
        }),
        AdvancedAnalyticsService.getRealtimeKPIs()
      ]);

      setFleetMetrics(metricsData);
      setInsights(insightsData);
      setKpiTrends(trendsData);
      setBenchmarks(benchmarkData);
      setOptimizations(optimizationData);
      setExecutiveReport(reportData);
      setRealtimeKPIs(realtimeData);
    } catch (error) {
      console.error('Error initializing analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRealtimeData = async () => {
    try {
      setRefreshing(true);
      const realtimeData = await AdvancedAnalyticsService.getRealtimeKPIs();
      setRealtimeKPIs(realtimeData);
    } catch (error) {
      console.error('Error refreshing real-time data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return <TrendingUpIcon color="success" />;
      case 'DOWN': return <TrendingDownIcon color="error" />;
      default: return <SpeedIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'info';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'TOP_10': return 'success';
      case 'TOP_25': return 'info';
      case 'AVERAGE': return 'warning';
      case 'BELOW_AVERAGE': return 'error';
      default: return 'default';
    }
  };

  const downloadReport = async () => {
    if (!executiveReport) return;

    const reportBlob = new Blob([JSON.stringify(executiveReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive-report-${executiveReport.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading Advanced Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Advanced Fleet Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={refreshRealtimeData}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
          >
            Download Report
          </Button>
        </Box>
      </Box>

      {/* Real-time KPI Bar */}
      {realtimeKPIs && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary: main', color: 'primary: contrastText' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">Active Vehicles</Typography>
              <Typography variant="h6">{realtimeKPIs.activeVehicles}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">In Transit</Typography>
              <Typography variant="h6">{realtimeKPIs.vehiclesInTransit}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">Utilization</Typography>
              <Typography variant="h6">{realtimeKPIs.utilizationRateNow}%</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">Revenue Today</Typography>
              <Typography variant="h6">${realtimeKPIs.revenueToday.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">Fuel Today</Typography>
              <Typography variant="h6">{realtimeKPIs.fuelConsumptionToday}L</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2">Safety Incidents</Typography>
              <Typography variant="h6" color={realtimeKPIs.safetyIncidentsToday === 0 ? 'success: main' : 'error: main'}>
                {realtimeKPIs.safetyIncidentsToday}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="AI Insights" icon={<AIIcon />} />
          <Tab label="KPI Trends" icon={<TimelineIcon />} />
          <Tab label="Benchmarks" icon={<FlagIcon />} />
          <Tab label="Cost Optimization" icon={<AccountBalanceIcon />} />
          <Tab label="Executive Report" icon={<StarIcon />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {fleetMetrics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Fleet Overview
                    </Typography>
                    <Typography variant="h4">{fleetMetrics.totalVehicles}</Typography>
                    <Typography variant="body2" color="text: secondary">
                      Total Vehicles
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Active: {fleetMetrics.activeVehicles} ({((fleetMetrics.activeVehicles / fleetMetrics.totalVehicles) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success: main" gutterBottom>
                      Utilization Rate
                    </Typography>
                    <Typography variant="h4">{fleetMetrics.utilizationRate}%</Typography>
                    <Typography variant="body2" color="text: secondary">
                      Fleet Efficiency
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={fleetMetrics.utilizationRate}
                      sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      color="success"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="info: main" gutterBottom>
                      Fuel Efficiency
                    </Typography>
                    <Typography variant="h4">{fleetMetrics.fuelEfficiency} MPG</Typography>
                    <Typography variant="body2" color="text: secondary">
                      Average Across Fleet
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {fleetMetrics.totalMilesDriven.toLocaleString()} miles driven
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="warning: main" gutterBottom>
                      Profit Margin
                    </Typography>
                    <Typography variant="h4">{fleetMetrics.profitMargin}%</Typography>
                    <Typography variant="body2" color="text: secondary">
                      Revenue Efficiency
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      ${fleetMetrics.revenuePerVehicle}/vehicle
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Trends (Last 30 Days)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={kpiTrends[0]?.forecast || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => format(parseISO(date), 'MMM dd')} />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cost Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Fuel', value: 285000 },
                            { name: 'Maintenance', value: 145780 },
                            { name: 'Insurance', value: 124600 },
                            { name: 'Operations', value: 234500 },
                            { name: 'Other', value: 102460 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {[
                            { name: 'Fuel', value: 285000 },
                            { name: 'Maintenance', value: 145780 },
                            { name: 'Insurance', value: 124600 },
                            { name: 'Operations', value: 234500 },
                            { name: 'Other', value: 102460 }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI-Powered Predictive Insights
            </Typography>
            <Typography variant="body2" color="text: secondary">
              Machine learning models analyze fleet data to predict issues and identify opportunities
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {insights.map((insight) => (
              <Grid item xs={12} md={6} key={insight.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {insight.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            label={insight.category}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={insight.impact}
                            size="small"
                            color={getImpactColor(insight.impact)}
                          />
                          <Chip
                            label={`${insight.confidence}% confidence`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      {insight.trend === 'IMPROVING' && <TrendingUpIcon color="success" />}
                      {insight.trend === 'DECLINING' && <TrendingDownIcon color="error" />}
                      {insight.trend === 'STABLE' && <SpeedIcon color="info" />}
                    </Box>

                    <Typography variant="body2" paragraph>
                      {insight.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Recommended Action:
                      </Typography>
                      <Typography variant="body2">
                        {insight.recommendedAction}
                      </Typography>
                    </Box>

                    {insight.potentialSavings && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Potential savings: ${insight.potentialSavings.toLocaleString()}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={insight.timeframe}
                        size="small"
                        icon={<TimelineIcon />}
                      />
                      <Chip
                        label={insight.riskLevel}
                        size="small"
                        color={insight.riskLevel === 'CRITICAL' ? 'error' : insight.riskLevel === 'HIGH' ? 'warning' : 'default'}
                      />
                      {insight.affectedVehicles.length > 0 && (
                        <Chip
                          label={`${insight.affectedVehicles.length} vehicles affected`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => setSelectedInsight(insight)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Key Performance Indicator Trends
          </Typography>

          <Grid container spacing={3}>
            {kpiTrends.map((kpi, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{kpi.metric}</Typography>
                      {getTrendIcon(kpi.trend)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2 }}>
                      <Typography variant="h4">{kpi.current}</Typography>
                      <Chip
                        label={`${kpi.change >= 0 ? '+' : ''}${kpi.changePercent.toFixed(1)}%`}
                        size="small"
                        color={kpi.trend === 'UP' ? 'success' : kpi.trend === 'DOWN' ? 'error' : 'default'}
                      />
                    </Box>

                    {kpi.target && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text: secondary">
                          Target: {kpi.target} | Status:
                        </Typography>
                        <Chip
                          label={kpi.status}
                          size="small"
                          color={getStatusColor(kpi.status)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    )}

                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={kpi.forecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => format(parseISO(date), 'MMM')} />
                        <YAxis />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Industry Benchmarks
          </Typography>
          <Typography variant="body2" color="text: secondary" gutterBottom>
            Compare your fleet performance against industry standards
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Your Fleet</TableCell>
                  <TableCell>Industry Average</TableCell>
                  <TableCell>Top Quartile</TableCell>
                  <TableCell>Ranking</TableCell>
                  <TableCell>Gap to Top</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {benchmarks.map((benchmark, index) => (
                  <TableRow key={index}>
                    <TableCell>{benchmark.metric}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {benchmark.fleetValue}
                      </Typography>
                    </TableCell>
                    <TableCell>{benchmark.industryAverage}</TableCell>
                    <TableCell>{benchmark.topQuartile}</TableCell>
                    <TableCell>
                      <Chip
                        label={benchmark.ranking.replace('_', ' ')}
                        size="small"
                        color={getRankingColor(benchmark.ranking)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={benchmark.improvement >= 0 ? 'success: main' : 'error: main'}
                      >
                        {benchmark.improvement >= 0 ? '+' : ''}{benchmark.improvement}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Cost Optimization Opportunities
          </Typography>

          <Grid container spacing={3}>
            {optimizations.map((opt) => (
              <Grid item xs={12} key={opt.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {opt.opportunity}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip label={opt.area} size="small" color="primary" />
                          <Chip label={opt.implementation} size="small" variant="outlined" />
                          <Chip label={`${opt.effort} effort`} size="small" />
                        </Box>
                        <Typography variant="body2" color="text: secondary">
                          {opt.details}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 150 }}>
                        <Typography variant="h5" color="success: main">
                          ${opt.savings.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text: secondary">
                          Annual Savings
                        </Typography>
                        <Typography variant="body2">
                          ROI: {opt.roi}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Box>
                        <Typography variant="body2">
                          Current: ${opt.currentCost.toLocaleString()} →
                          Optimized: ${opt.optimizedCost.toLocaleString()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(opt.savings / opt.currentCost) * 100}
                        sx={{ width: 100, ml: 2 }}
                        color="success"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Optimization Impact
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text: secondary">Total Potential Savings</Typography>
                  <Typography variant="h4" color="success: main">
                    ${optimizations.reduce((sum, opt) => sum + opt.savings, 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text: secondary">Average ROI</Typography>
                  <Typography variant="h4">
                    {(optimizations.reduce((sum, opt) => sum + opt.roi, 0) / optimizations.length).toFixed(0)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text: secondary">Immediate Opportunities</Typography>
                  <Typography variant="h4">
                    {optimizations.filter(opt => opt.implementation === 'IMMEDIATE').length}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text: secondary">Cost Reduction</Typography>
                  <Typography variant="h4">
                    {(optimizations.reduce((sum, opt) => sum + opt.savings, 0) / optimizations.reduce((sum, opt) => sum + opt.currentCost, 0) * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          {executiveReport && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Executive Summary Report
                </Typography>
                <Typography variant="body2" color="text: secondary">
                  Generated: {format(parseISO(executiveReport.reportDate), 'MMM dd, yyyy HH:mm')}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Fleet Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text: secondary">Total Fleet Value</Typography>
                          <Typography variant="h6">${executiveReport.summary.totalFleetValue.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text: secondary">Operational Cost</Typography>
                          <Typography variant="h6">${executiveReport.summary.operationalCost.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text: secondary">Revenue</Typography>
                          <Typography variant="h6">${executiveReport.summary.revenue.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text: secondary">Profitability</Typography>
                          <Typography variant="h6">{executiveReport.summary.profitability}%</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Key Achievements</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {executiveReport.summary.keyAchievements.map((achievement, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={achievement} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Major Concerns</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {executiveReport.summary.majorConcerns.map((concern, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <WarningIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText primary={concern} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Strategic Recommendations</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {executiveReport.recommendations.map((recommendation, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <LightbulbIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={recommendation} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Financial Projections
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text: secondary">Next Quarter</Typography>
                        <Typography variant="body2">
                          Revenue: ${executiveReport.financialProjections.nextQuarter.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Profit: ${executiveReport.financialProjections.nextQuarter.profit.toLocaleString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box>
                        <Typography variant="body2" color="text: secondary">Next Year</Typography>
                        <Typography variant="body2">
                          Revenue: ${executiveReport.financialProjections.nextYear.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Profit: ${executiveReport.financialProjections.nextYear.profit.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        High-Impact Insights
                      </Typography>
                      {executiveReport.insights.map((insight, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {insight.title}
                          </Typography>
                          <Typography variant="caption" color="text: secondary">
                            {insight.timeframe} • {insight.confidence}% confidence
                          </Typography>
                          {insight.potentialSavings && (
                            <Typography variant="body2" color="success: main">
                              Potential savings: ${insight.potentialSavings.toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Insight Details Dialog */}
      <Dialog open={!!selectedInsight} onClose={() => setSelectedInsight(null)} maxWidth="md" fullWidth>
        {selectedInsight && (
          <>
            <DialogTitle>{selectedInsight.title}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" paragraph>
                    {selectedInsight.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Analysis Details</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">Category: {selectedInsight.category}</Typography>
                    <Typography variant="body2">Impact Level: {selectedInsight.impact}</Typography>
                    <Typography variant="body2">Confidence: {selectedInsight.confidence}%</Typography>
                    <Typography variant="body2">Risk Level: {selectedInsight.riskLevel}</Typography>
                    <Typography variant="body2">Trend: {selectedInsight.trend}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  <Typography variant="body2">{selectedInsight.recommendedAction}</Typography>
                  {selectedInsight.potentialSavings && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Potential annual savings: ${selectedInsight.potentialSavings.toLocaleString()}
                    </Alert>
                  )}
                </Grid>
                {selectedInsight.affectedVehicles.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Affected Vehicles</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedInsight.affectedVehicles.map((vehicle) => (
                        <Chip key={vehicle} label={vehicle} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedInsight(null)}>Close</Button>
              <Button variant="contained">Create Action Plan</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdvancedAnalyticsDashboard;