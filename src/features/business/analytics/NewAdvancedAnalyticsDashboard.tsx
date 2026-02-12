import {
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Skeleton
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { secureFetch } from '@/hooks/use-api';

import CostAnalyticsChart from './CostAnalyticsChart';
import FleetMetricsCards from './FleetMetricsCards';
import VehicleUtilizationChart from './VehicleUtilizationChart';

interface DashboardData {
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    inMaintenance: number;
    utilizationRate: number;
  }
  drivers: {
    totalDrivers: number;
    activeDrivers: number
  }
  trips: {
    totalTrips: number;
    totalMiles: number;
    avgTripDistance: number
  }
  fuel: {
    totalCost: number;
    totalGallons: number;
    avgPricePerGallon: number;
    transactions: number
  }
  maintenance: {
    totalCost: number;
    totalRecords: number
  }
  financials: {
    costPerMile: number;
    totalOperatingCost: number
  }
  vehiclesByFuelType: Array<{ fuelType: string; count: number }>;
  period: {
    start: string;
    end: string;
    days: number
  }
}

interface Vehicle {
  id: string;
  status: string;
  department?: string;
  fuelType?: string;
}

const NewAdvancedAnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90 days
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardResponse, vehiclesResponse] = await Promise.all([
        secureFetch(`/api/analytics/dashboard?days=${encodeURIComponent(dateRange)}`, { method: 'GET' }),
        secureFetch('/api/vehicles?limit=1000', { method: 'GET' })
      ]);

      if (!dashboardResponse.ok || !vehiclesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const dashboardJson = await dashboardResponse.json();
      const vehiclesJson = await vehiclesResponse.json();

      setDashboardData(dashboardJson);
      setVehicles(vehiclesJson?.data?.data ?? vehiclesJson?.data ?? vehiclesJson);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
  }

  // Handle export to CSV
  const handleExport = () => {
    if (!dashboardData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Vehicles', dashboardData.fleet.totalVehicles],
      ['Active Vehicles', dashboardData.fleet.activeVehicles],
      ['In Maintenance', dashboardData.fleet.inMaintenance],
      ['Utilization Rate', `${dashboardData.fleet.utilizationRate}%`],
      ['Total Miles', dashboardData.trips.totalMiles],
      ['Fuel Cost', `$${dashboardData.fuel.totalCost}`],
      ['Maintenance Cost', `$${dashboardData.maintenance.totalCost}`],
      ['Cost Per Mile', `$${dashboardData.financials.costPerMile}`],
      ['Total Operating Cost', `$${dashboardData.financials.totalOperatingCost}`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fleet-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loading skeleton
  if (loading && !dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    )
  }

  // No data state
  if (!dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          No analytics data available
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Advanced Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Date Range Selector */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={dateRange}
                  label="Period"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="7">7 Days</MenuItem>
                  <MenuItem value="30">30 Days</MenuItem>
                  <MenuItem value="90">90 Days</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              {/* Auto-refresh Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-refresh"
              />

              {/* Refresh Button */}
              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} color="primary" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>

              {/* Export Button */}
              <Tooltip title="Export to CSV">
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  disabled={loading}
                >
                  Export
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>

        {/* Fleet Metrics Cards */}
        <Box>
          <FleetMetricsCards
            data={dashboardData}
            period={dashboardData.period}
          />
        </Box>

        {/* Charts Section */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            Cost Analytics
          </Typography>
          <CostAnalyticsChart
            fuelCost={dashboardData.fuel.totalCost}
            maintenanceCost={dashboardData.maintenance.totalCost}
            totalVehicles={dashboardData.fleet.totalVehicles}
            vehiclesByFuelType={dashboardData.vehiclesByFuelType}
          />
        </Box>

        {/* Utilization Section */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            Fleet Utilization
          </Typography>
          <VehicleUtilizationChart
            totalVehicles={dashboardData.fleet.totalVehicles}
            activeVehicles={dashboardData.fleet.activeVehicles}
            inMaintenance={dashboardData.fleet.inMaintenance}
            utilizationRate={dashboardData.fleet.utilizationRate}
            vehicles={vehicles}
          />
        </Box>

        {/* Summary Footer */}
        <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-around">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {dashboardData.fleet.totalVehicles}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Fleet Size
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {dashboardData.trips.totalMiles.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Miles Traveled
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                ${dashboardData.financials.totalOperatingCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Operating Cost
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>
                {dashboardData.fleet.utilizationRate}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Fleet Utilization
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
};

export default NewAdvancedAnalyticsDashboard;
