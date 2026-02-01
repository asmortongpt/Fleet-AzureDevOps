import {
  CheckCircle as ActiveIcon,
  Build as MaintenanceIcon,
  RemoveCircle as OutOfServiceIcon,
  EventAvailable as ReservedIcon,
  DirectionsCar as VehicleIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface VehicleUtilizationChartProps {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  utilizationRate: number;
  vehicles?: Array<{
    status: string;
    department?: string;
  }>;
}

const VehicleUtilizationChart: React.FC<VehicleUtilizationChartProps> = ({
  totalVehicles,
  activeVehicles,
  inMaintenance,
  utilizationRate,
  vehicles = []
}) => {
  // Calculate vehicle status distribution
  const statusCounts = vehicles.reduce((acc, vehicle) => {
    const status = vehicle.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // If no vehicles data, use provided counts
  const defaultStatusData = [
    { status: 'Active', count: activeVehicles, color: '#4caf50' },
    { status: 'In Maintenance', count: inMaintenance, color: '#ff9800' },
    { status: 'Out of Service', count: statusCounts['Out of Service'] || 0, color: '#f44336' },
    { status: 'Reserved', count: statusCounts['Reserved'] || 0, color: '#2196f3' }
  ];

  const statusData = Object.keys(statusCounts).length > 0
    ? Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: status === 'Active' ? '#4caf50' :
               status === 'In Maintenance' ? '#ff9800' :
               status === 'Out of Service' ? '#f44336' :
               status === 'Reserved' ? '#2196f3' : '#9e9e9e'
      }))
    : defaultStatusData;

  // Calculate department distribution
  const departmentCounts = vehicles.reduce((acc, vehicle) => {
    const dept = vehicle.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 departments

  // Pie chart colors
  const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#00bcd4', '#ff5722', '#795548'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1.5, minWidth: 150 }}>
          <Typography variant="body2" fontWeight={600}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Count: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {((payload[0].value / totalVehicles) * 100).toFixed(1)}% of fleet
          </Typography>
        </Card>
      )
    }
    return null;
  };

  // Status icons
  const statusIcons: Record<string, any> = {
    'Active': ActiveIcon,
    'In Maintenance': MaintenanceIcon,
    'Out of Service': OutOfServiceIcon,
    'Reserved': ReservedIcon
  }

  return (
    <Grid container spacing={3}>
      {/* Vehicle Status Distribution - Pie Chart */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Fleet Status Distribution
              </Typography>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }: any) => `${status}: ${count}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Status Legend with Progress Bars */}
              <Box>
                {statusData.map((item, index) => {
                  const IconComponent = statusIcons[item.status] || VehicleIcon;
                  const percentage = totalVehicles > 0 ? (item.count / totalVehicles) * 100 : 0;

                  return (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconComponent sx={{ fontSize: 18, color: item.color }} />
                          <Typography variant="body2" fontWeight={500}>
                            {item.status}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.count} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: item.color
                          }
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Fleet Utilization Overview */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Fleet Utilization Overview
              </Typography>

              {/* Utilization Rate Gauge */}
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    background: `conic-gradient(
                      #4caf50 0% ${utilizationRate}%,
                      #e0e0e0 ${utilizationRate}% 100%
                    )`,
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h3" fontWeight={700} color="primary">
                      {utilizationRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Utilization
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Utilization Metrics */}
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={600} color="success.dark">
                        {activeVehicles}
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        Active Vehicles
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.200', borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight={600}>
                        {totalVehicles - activeVehicles}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Inactive Vehicles
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Utilization Status */}
              <Box>
                <Chip
                  label={
                    utilizationRate >= 70 ? 'Excellent Utilization' :
                    utilizationRate >= 50 ? 'Good Utilization' :
                    utilizationRate >= 30 ? 'Fair Utilization' : 'Low Utilization'
                  }
                  color={
                    utilizationRate >= 70 ? 'success' :
                    utilizationRate >= 50 ? 'info' :
                    utilizationRate >= 30 ? 'warning' : 'error'
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Department-wise Vehicle Distribution */}
      {departmentData.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Vehicles by Department
                </Typography>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="department"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2196f3" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <Divider />

                {/* Top Department Stats */}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top Departments by Fleet Size
                  </Typography>
                  <Grid container spacing={1}>
                    {departmentData.slice(0, 4).map((dept, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {dept.department}
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {dept.count} vehicles
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
};

export default VehicleUtilizationChart;
