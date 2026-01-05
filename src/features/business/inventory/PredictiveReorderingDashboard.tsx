/**
 * Predictive Reordering Dashboard
 * AI-powered inventory management interface for CTAFleet
 */

import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Analytics,
  Tune,
  Info,
  LocalShipping,
  AttachMoney,
  Speed,
  Build,
  AutoAwesome,
  Science,
  Timeline,
  PrecisionManufacturing
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  Badge
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

import {
  predictiveReorderingService,
  ReorderRecommendation,
  PartUsagePattern,
  MaintenanceScheduleInput
} from '../../services/inventory/PredictiveReorderingService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const PredictiveReorderingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ReorderRecommendation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadRecommendations();
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // Load sample usage patterns
    const samplePatterns: PartUsagePattern[] = [
      {
        partId: 'P001',
        partNumber: 'OF-2234',
        name: 'Oil Filter',
        category: 'Filters',
        averageMonthlyUsage: 25,
        usageVariability: 5,
        seasonalityFactor: 1.1,
        trendDirection: 'stable',
        currentStock: 15,
        safetyStock: 10,
        reorderPoint: 20,
        economicOrderQuantity: 50,
        averageLeadTime: 3,
        leadTimeVariability: 1,
        supplierReliability: 0.95,
        associatedVehicles: ['V001', 'V002', 'V003'],
        criticalityScore: 8,
        unitCost: 25.99,
        carryingCostRate: 0.25,
        stockoutCostEstimate: 500
      },
      {
        partId: 'P002',
        partNumber: 'BP-5567',
        name: 'Brake Pads Set',
        category: 'Brakes',
        averageMonthlyUsage: 12,
        usageVariability: 3,
        seasonalityFactor: 1.0,
        trendDirection: 'increasing',
        currentStock: 8,
        safetyStock: 5,
        reorderPoint: 15,
        economicOrderQuantity: 30,
        averageLeadTime: 5,
        leadTimeVariability: 2,
        supplierReliability: 0.92,
        associatedVehicles: ['V001', 'V004', 'V005'],
        criticalityScore: 9,
        unitCost: 45.99,
        carryingCostRate: 0.25,
        stockoutCostEstimate: 1200
      },
      {
        partId: 'P003',
        partNumber: 'TR-225-65R17',
        name: '225/65R17 All-Season Tire',
        category: 'Tires',
        averageMonthlyUsage: 8,
        usageVariability: 4,
        seasonalityFactor: 1.3,
        trendDirection: 'stable',
        currentStock: 12,
        safetyStock: 4,
        reorderPoint: 10,
        economicOrderQuantity: 20,
        averageLeadTime: 7,
        leadTimeVariability: 3,
        supplierReliability: 0.88,
        associatedVehicles: ['V002', 'V003'],
        criticalityScore: 7,
        unitCost: 125.99,
        carryingCostRate: 0.20,
        stockoutCostEstimate: 800
      }
    ];

    // Load sample maintenance schedule
    const sampleSchedule: MaintenanceScheduleInput[] = [
      {
        vehicleId: 'V001',
        scheduledMaintenanceDate: new Date('2024-02-15'),
        maintenanceType: 'Regular Service',
        requiredParts: [
          { partNumber: 'OF-2234', quantity: 1, criticality: 'critical' },
          { partNumber: 'AF-8901', quantity: 1, criticality: 'routine' }
        ]
      },
      {
        vehicleId: 'V002',
        scheduledMaintenanceDate: new Date('2024-02-20'),
        maintenanceType: 'Brake Service',
        requiredParts: [
          { partNumber: 'BP-5567', quantity: 1, criticality: 'critical' }
        ]
      }
    ];

    predictiveReorderingService.updateUsagePatterns(samplePatterns);
    predictiveReorderingService.loadMaintenanceSchedule(sampleSchedule);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await predictiveReorderingService.generateReorderRecommendations();
      setRecommendations(recs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (recommendation: ReorderRecommendation) => {
    setSelectedRecommendation(recommendation);
    setDetailsDialogOpen(true);
  };

  const handleApproveOrder = async (recommendation: ReorderRecommendation) => {
    // Integrate with purchase order system
    // console.log('Approving order for:', recommendation.partNumber);
    // Remove from recommendations after approval
    setRecommendations(prev => prev.filter(r => r.partId !== recommendation.partId));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reorder_now': return <Warning color="error" />;
      case 'reorder_soon': return <Schedule color="warning" />;
      case 'monitor': return <CheckCircle color="success" />;
      case 'reduce_stock': return <TrendingDown color="info" />;
      default: return <Info />;
    }
  };

  const calculateMetrics = () => {
    const totalRecommendations = recommendations.length;
    const criticalItems = recommendations.filter(r => r.urgencyLevel === 'critical').length;
    const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / (totalRecommendations || 1);
    const highRiskItems = recommendations.filter(r => r.stockoutRisk > 0.2).length;

    return {
      totalRecommendations,
      criticalItems,
      totalEstimatedCost,
      avgConfidence: Math.round(avgConfidence * 100),
      highRiskItems
    };
  };

  const metrics = calculateMetrics();

  const getDemandForecastData = () => {
    return [
      { month: 'Jan', historical: 150, predicted: 165, scheduled: 25 },
      { month: 'Feb', historical: 140, predicted: 155, scheduled: 30 },
      { month: 'Mar', historical: 160, predicted: 175, scheduled: 20 },
      { month: 'Apr', historical: 170, predicted: 185, scheduled: 35 },
      { month: 'May', historical: 180, predicted: 195, scheduled: 40 },
      { month: 'Jun', historical: 175, predicted: 190, scheduled: 30 }
    ];
  };

  const getInventoryAnalyticsData = () => {
    return [
      { category: 'Filters', stockLevel: 85, optimalLevel: 100, value: 2500 },
      { category: 'Brakes', stockLevel: 65, optimalLevel: 80, value: 4200 },
      { category: 'Tires', stockLevel: 45, optimalLevel: 60, value: 6800 },
      { category: 'Engine', stockLevel: 90, optimalLevel: 75, value: 3100 },
      { category: 'Electrical', stockLevel: 70, optimalLevel: 85, value: 1900 }
    ];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Psychology />} label="AI Recommendations" />
          <Tab icon={<Analytics />} label="Demand Forecast" />
          <Tab icon={<Timeline />} label="Inventory Analytics" />
          <Tab icon={<Tune />} label="AI Configuration" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress />}

      <TabPanel value={tabValue} index={0}>
        {/* AI Recommendations Dashboard */}
        <Grid container spacing={3}>
          {/* Metrics Cards */}
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Total Recommendations</Typography>
                    <Typography variant="h4">{metrics.totalRecommendations}</Typography>
                  </Box>
                  <AutoAwesome color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Critical Items</Typography>
                    <Typography variant="h4" color="error">{metrics.criticalItems}</Typography>
                  </Box>
                  <Warning color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Est. Order Value</Typography>
                    <Typography variant="h4">${metrics.totalEstimatedCost.toLocaleString()}</Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>AI Confidence</Typography>
                    <Typography variant="h4">{metrics.avgConfidence}%</Typography>
                  </Box>
                  <Science color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>High Risk Items</Typography>
                    <Typography variant="h4" color="warning.main">{metrics.highRiskItems}</Typography>
                  </Box>
                  <Speed color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Auto-Reorder Toggle */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">Automated Reordering</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Enable AI to automatically place orders for approved suppliers
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2" color="textSecondary">
                      Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
                    </Typography>
                    <Button variant="outlined" onClick={loadRecommendations} disabled={loading}>
                      Refresh AI Analysis
                    </Button>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoReorderEnabled}
                          onChange={(e) => setAutoReorderEnabled(e.target.checked)}
                        />
                      }
                      label="Auto-Reorder"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PrecisionManufacturing sx={{ mr: 1, verticalAlign: 'middle' }} />
                  AI-Generated Reorder Recommendations
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Part</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Urgency</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Est. Cost</TableCell>
                        <TableCell align="right">Stockout Risk</TableCell>
                        <TableCell align="right">AI Confidence</TableCell>
                        <TableCell>Suggested Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recommendations.map((rec) => (
                        <TableRow key={rec.partId}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {rec.partNumber}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {rec.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getActionIcon(rec.recommendedAction)}
                              <Typography variant="body2">
                                {rec.recommendedAction.replace('_', ' ')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rec.urgencyLevel}
                              color={getUrgencyColor(rec.urgencyLevel)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{rec.recommendedQuantity}</TableCell>
                          <TableCell align="right">${rec.estimatedCost.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={rec.stockoutRisk * 100}
                                color={rec.stockoutRisk > 0.5 ? 'error' : rec.stockoutRisk > 0.2 ? 'warning' : 'success'}
                                sx={{ width: 50, height: 6 }}
                              />
                              <Typography variant="caption">
                                {Math.round(rec.stockoutRisk * 100)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Badge
                              badgeContent={Math.round(rec.confidence * 100) + '%'}
                              color={rec.confidence > 0.8 ? 'success' : rec.confidence > 0.6 ? 'warning' : 'error'}
                            >
                              <Science fontSize="small" />
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {rec.suggestedOrderDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleViewDetails(rec)}
                              >
                                Details
                              </Button>
                              {rec.recommendedAction === 'reorder_now' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleApproveOrder(rec)}
                                >
                                  Order
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Demand Forecast */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Demand Forecast vs Historical Usage
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={getDemandForecastData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="historical"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Historical Usage"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="AI Prediction"
                    />
                    <Line
                      type="monotone"
                      dataKey="scheduled"
                      stroke="#ff7300"
                      name="Scheduled Maintenance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Forecast Accuracy</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Short-term (30 days)</Typography>
                  <LinearProgress variant="determinate" value={92} color="success" sx={{ height: 8, mb: 2 }} />
                  <Typography variant="body2">92% accuracy</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Medium-term (90 days)</Typography>
                  <LinearProgress variant="determinate" value={84} color="primary" sx={{ height: 8, mb: 2 }} />
                  <Typography variant="body2">84% accuracy</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Long-term (365 days)</Typography>
                  <LinearProgress variant="determinate" value={71} color="warning" sx={{ height: 8, mb: 2 }} />
                  <Typography variant="body2">71% accuracy</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Inventory Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inventory Levels vs Optimal Levels
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getInventoryAnalyticsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="stockLevel" fill="#8884d8" name="Current Stock" />
                    <Bar dataKey="optimalLevel" fill="#82ca9d" name="Optimal Level" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory Value Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getInventoryAnalyticsData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.category}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getInventoryAnalyticsData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* AI Configuration */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>AI Model Configuration</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Configure the AI prediction model parameters and risk tolerances
                </Typography>
                <Alert severity="info">
                  AI configuration interface coming soon. Current model uses optimized defaults for government fleet operations.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Recommendation Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          AI Recommendation Details - {selectedRecommendation?.partNumber}
        </DialogTitle>
        <DialogContent>
          {selectedRecommendation && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Prediction Analysis</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Build /></ListItemIcon>
                    <ListItemText
                      primary="Upcoming Maintenance Demand"
                      secondary={`${selectedRecommendation.predictionFactors.upcomingMaintenance} units needed in next 30 days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp /></ListItemIcon>
                    <ListItemText
                      primary="Historical Trend"
                      secondary={`${(selectedRecommendation.predictionFactors.historicalTrend * 100).toFixed(1)}% trend adjustment`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText
                      primary="Seasonal Adjustment"
                      secondary={`${(selectedRecommendation.predictionFactors.seasonalAdjustment * 100).toFixed(1)}% seasonal factor`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocalShipping /></ListItemIcon>
                    <ListItemText
                      primary="Lead Time Buffer"
                      secondary={`${selectedRecommendation.predictionFactors.supplierLeadTime} days average lead time`}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Recommended Suppliers</Typography>
                <List>
                  {selectedRecommendation.recommendedSuppliers.map((supplier, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={supplier.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Price: ${supplier.price} | Lead Time: {supplier.leadTime} days
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={supplier.totalScore * 100}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedRecommendation?.recommendedAction === 'reorder_now' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                if (selectedRecommendation) {
                  handleApproveOrder(selectedRecommendation);
                  setDetailsDialogOpen(false);
                }
              }}
            >
              Approve Order
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictiveReorderingDashboard;