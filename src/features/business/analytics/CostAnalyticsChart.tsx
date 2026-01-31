import {
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  TrendingUp as TrendUpIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Divider,
  Chip
} from '@mui/material';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CostAnalyticsChartProps {
  fuelCost: number;
  maintenanceCost: number;
  totalVehicles: number;
  vehiclesByFuelType?: Array<{ fuelType: string; count: number }>;
}

const CostAnalyticsChart: React.FC<CostAnalyticsChartProps> = ({
  fuelCost,
  maintenanceCost,
  totalVehicles,
  vehiclesByFuelType = []
}) => {
  // Cost comparison data
  const costComparisonData = [
    {
      category: 'Fuel',
      cost: fuelCost,
      perVehicle: totalVehicles > 0 ? fuelCost / totalVehicles : 0
    },
    {
      category: 'Maintenance',
      cost: maintenanceCost,
      perVehicle: totalVehicles > 0 ? maintenanceCost / totalVehicles : 0
    }
  ];

  // Pie chart data for cost breakdown
  const totalCost = fuelCost + maintenanceCost;
  const pieData = [
    { name: 'Fuel', value: fuelCost, percentage: totalCost > 0 ? ((fuelCost / totalCost) * 100).toFixed(1) : 0 },
    { name: 'Maintenance', value: maintenanceCost, percentage: totalCost > 0 ? ((maintenanceCost / totalCost) * 100).toFixed(1) : 0 }
  ];

  // Colors for charts
  const COLORS = {
    fuel: '#2196f3',
    maintenance: '#f44336',
    fuelLight: '#64b5f6',
    maintenanceLight: '#e57373'
  }

  const PIE_COLORS = [COLORS.fuel, COLORS.maintenance];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1.5, minWidth: 150 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: ${entry.value.toFixed(2)}
            </Typography>
          ))}
        </Card>
      )
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  // Fuel type cost estimates (based on vehicle distribution)
  const fuelTypeCostData = vehiclesByFuelType.map(item => ({
    fuelType: item.fuelType,
    count: item.count,
    estimatedCost: (fuelCost / totalVehicles) * item.count
  }));

  return (
    <Grid container spacing={3}>
      {/* Cost Comparison Bar Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={600}>
                  Cost Comparison
                </Typography>
                <TrendUpIcon color="primary" />
              </Box>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="cost" fill={COLORS.fuel} name="Total Cost ($)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="perVehicle" fill={COLORS.maintenance} name="Cost per Vehicle ($)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FuelIcon sx={{ color: COLORS.fuel }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Fuel Cost
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          ${fuelCost.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MaintenanceIcon sx={{ color: COLORS.maintenance }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Maintenance Cost
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          ${maintenanceCost.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Cost Breakdown Pie Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Cost Breakdown
              </Typography>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <Box>
                <Grid container spacing={1}>
                  {pieData.map((item, index) => (
                    <Grid item xs={6} key={index}>
                      <Chip
                        label={`${item.name}: ${item.percentage}%`}
                        size="small"
                        sx={{
                          bgcolor: PIE_COLORS[index],
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Operating Cost
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    ${totalCost.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Cost by Fuel Type */}
      {fuelTypeCostData.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Estimated Cost by Fuel Type
                </Typography>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fuelTypeCostData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fuelType" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="estimatedCost" fill={COLORS.fuelLight} name="Estimated Cost ($)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="count" fill={COLORS.maintenanceLight} name="Vehicle Count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cost estimates based on average fuel consumption per vehicle type
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Cost Summary Cards */}
      <Grid item xs={12}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Cost per Vehicle
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    ${totalVehicles > 0 ? (totalCost / totalVehicles).toFixed(2) : '0.00'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Fuel vs Maintenance Ratio
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {maintenanceCost > 0 ? (fuelCost / maintenanceCost).toFixed(2) : 'N/A'} : 1
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Highest Cost Category
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {fuelCost > maintenanceCost ? 'Fuel' : 'Maintenance'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
};

export default CostAnalyticsChart;
