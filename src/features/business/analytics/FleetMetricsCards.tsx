import {
  DirectionsCar as VehicleIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendUpIcon,
  CheckCircle as ActiveIcon,
  Timeline as UtilizationIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import React from 'react';

interface DashboardData {
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    inMaintenance: number;
    utilizationRate: number;
  }
  trips: {
    totalMiles: number
  }
  fuel: {
    totalCost: number
  }
  maintenance: {
    totalCost: number
  }
  financials: {
    costPerMile: number
  }
}

interface FleetMetricsCardsProps {
  data: DashboardData;
  period?: {
    days: number;
  }
}

const FleetMetricsCards: React.FC<FleetMetricsCardsProps> = ({ data, period }) => {
  const { fleet, trips, fuel, maintenance, financials } = data;

  // Calculate metrics
  const activePercentage = fleet.totalVehicles > 0
    ? ((fleet.activeVehicles / fleet.totalVehicles) * 100).toFixed(1)
    : '0.0';

  const totalMiles = trips.totalMiles || 0;
  const totalFuelCost = fuel.totalCost || 0;
  const totalMaintenanceCost = maintenance.totalCost || 0;
  const costPerMile = financials.costPerMile || 0;
  const utilizationRate = fleet.utilizationRate || 0;

  const periodLabel = period ? `Last ${period.days} days` : 'Current Period';
  const metrics = [
    {
      title: 'Total Vehicles',
      value: fleet.totalVehicles,
      subtitle: `${fleet.activeVehicles} Active • ${fleet.inMaintenance} In Maintenance`,
      icon: VehicleIcon,
      color: 'primary.main',
      bgColor: 'primary.light',
      progress: {
        value: Number(activePercentage),
        label: `${activePercentage}% Active`,
        color: 'primary'
      }
    },
    {
      title: 'Active Vehicles',
      value: `${activePercentage}%`,
      subtitle: `${fleet.activeVehicles} of ${fleet.totalVehicles} vehicles`,
      icon: ActiveIcon,
      color: 'success.main',
      bgColor: 'success.light',
      progress: {
        value: Number(activePercentage),
        label: 'Fleet Availability',
        color: 'success'
      }
    },
    {
      title: 'Total Miles',
      value: totalMiles.toLocaleString(),
      subtitle: periodLabel,
      icon: SpeedIcon,
      color: 'info.main',
      bgColor: 'info.light',
      chip: {
        label: `${(totalMiles / fleet.totalVehicles).toFixed(0)} mi/vehicle`,
        color: 'info'
      }
    },
    {
      title: 'Cost Per Mile',
      value: `$${costPerMile.toFixed(2)}`,
      subtitle: 'Average operating cost',
      icon: MoneyIcon,
      color: 'warning.main',
      bgColor: 'warning.light',
      chip: {
        label: costPerMile < 0.50 ? 'Efficient' : costPerMile < 0.75 ? 'Normal' : 'High',
        color: costPerMile < 0.50 ? 'success' : costPerMile < 0.75 ? 'info' : 'error'
      }
    },
    {
      title: 'Total Fuel Cost',
      value: `$${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: periodLabel,
      icon: FuelIcon,
      color: 'secondary.main',
      bgColor: 'secondary.light',
      chip: {
        label: totalMiles > 0 ? `$${(totalFuelCost / totalMiles).toFixed(2)}/mi` : 'No data',
        color: 'secondary'
      }
    },
    {
      title: 'Total Maintenance Cost',
      value: `$${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: periodLabel,
      icon: MaintenanceIcon,
      color: 'error.main',
      bgColor: 'error.light',
      chip: {
        label: `${fleet.inMaintenance} vehicles`,
        color: 'error'
      }
    },
    {
      title: 'Fleet Utilization Rate',
      value: `${utilizationRate}%`,
      subtitle: 'Active vehicles in use',
      icon: UtilizationIcon,
      color: 'primary.main',
      bgColor: 'primary.light',
      progress: {
        value: utilizationRate,
        label: utilizationRate >= 70 ? 'Excellent' : utilizationRate >= 50 ? 'Good' : 'Low',
        color: utilizationRate >= 70 ? 'success' : utilizationRate >= 50 ? 'info' : 'warning'
      }
    },
    {
      title: 'Total Operating Cost',
      value: `$${(totalFuelCost + totalMaintenanceCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: periodLabel,
      icon: TrendUpIcon,
      color: 'info.main',
      bgColor: 'info.light',
      chip: {
        label: `$${((totalFuelCost + totalMaintenanceCost) / fleet.totalVehicles).toFixed(2)}/vehicle`,
        color: 'info'
      }
    }
  ];

  return (<Grid container spacing={3}>
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  {/* Icon and Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      {metric.title}
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: metric.bgColor,
                        color: metric.color
                      }}
                    >
                      <IconComponent fontSize="small" />
                    </Box>
                  </Box>

                  {/* Value */}
                  <Typography variant="h4" fontWeight={700} color={metric.color}>
                    {metric.value}
                  </Typography>

                  {/* Subtitle */}
                  <Typography variant="body2" color="text.secondary">
                    {metric.subtitle}
                  </Typography>

                  {/* Progress Bar or Chip */}
                  {metric.progress && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {metric.progress.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {metric.progress.value.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metric.progress.value}
                        color={metric.progress.color as any}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  {metric.chip && (
                    <Box>
                      <Chip
                        label={metric.chip.label}
                        size="small"
                        color={metric.chip.color as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>);
};

export default FleetMetricsCards;
