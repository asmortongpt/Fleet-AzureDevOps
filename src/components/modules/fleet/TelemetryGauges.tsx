import {
    Speed,
    LocalGasStation,
    Thermostat,
    BatteryChargingFull,
    Settings,
    Bolt,
    TrendingUp,
    Place
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    LinearProgress,
    Stack,
    CircularProgress,
    useTheme,
    Chip
} from '@mui/material';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import type { Obd2Data } from '@/hooks/useObd2Socket';

interface TelemetryGaugesProps {
    data: Obd2Data | null;
}

export default function TelemetryGauges({ data }: TelemetryGaugesProps) {
    const theme = useTheme();

    if (!data) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Waiting for telemetry stream...
                </Typography>
            </Box>
        );
    }

    // Helper for color coding
    const getRpmColor = (rpm: number) => {
        if (rpm > 5000) return theme.palette.error.main;
        if (rpm > 3500) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const getTempColor = (temp: number) => {
        if (temp > 220) return theme.palette.error.main;
        if (temp > 200) return theme.palette.warning.main;
        return theme.palette.info.main;
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Main Gauges Row */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={3}>
                        {/* Speed Gauge */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: 200,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    bgcolor: 'background.paper',
                                    background: `radial-gradient(circle at center, ${theme.palette.background.paper} 60%, ${theme.palette.action.hover} 100%)`
                                }}
                            >
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={160}
                                        thickness={4}
                                        sx={{ color: theme.palette.action.disabledBackground }}
                                    />
                                    <CircularProgress
                                        variant="determinate"
                                        value={(data.vehicleSpeed / 140) * 100}
                                        size={160}
                                        thickness={4}
                                        sx={{
                                            color: theme.palette.primary.main,
                                            position: 'absolute',
                                            left: 0,
                                            strokeLinecap: 'round'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: 'absolute',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography variant="h2" component="div" fontWeight="bold">
                                            {Math.round(data.vehicleSpeed)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                            MPH
                                        </Typography>
                                    </Box>
                                </Box>
                                <Speed sx={{ position: 'absolute', top: 16, right: 16, color: 'text.disabled' }} />
                            </Card>
                        </Grid>

                        {/* RPM Gauge */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: 200,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}
                            >
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={160}
                                        thickness={4}
                                        sx={{ color: theme.palette.action.disabledBackground }}
                                    />
                                    <CircularProgress
                                        variant="determinate"
                                        value={(data.engineRpm / 8000) * 100}
                                        size={160}
                                        thickness={4}
                                        sx={{
                                            color: getRpmColor(data.engineRpm),
                                            position: 'absolute',
                                            left: 0,
                                            strokeLinecap: 'round',
                                            transition: 'color 0.3s ease'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            position: 'absolute',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography variant="h3" component="div" fontWeight="bold" sx={{ color: getRpmColor(data.engineRpm) }}>
                                            {Math.round(data.engineRpm / 100) / 10}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                            x1000 RPM
                                        </Typography>
                                    </Box>
                                </Box>
                                <Settings sx={{ position: 'absolute', top: 16, right: 16, color: 'text.disabled' }} />
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Info Column */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={2}>
                        {/* Fuel Card */}
                        <Card elevation={3}>
                            <CardContent sx={{ pb: '16px !important' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <LocalGasStation color="primary" fontSize="small" />
                                        <Typography variant="subtitle2">Fuel Level</Typography>
                                    </Box>
                                    <Typography variant="h6" color="primary">{Math.round(data.fuelLevel)}%</Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={data.fuelLevel}
                                    color={data.fuelLevel < 20 ? "error" : "primary"}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Stack direction="row" justifyContent="space-between" mt={1}>
                                    <Typography variant="caption">Range: ~{Math.round(data.fuelLevel * data.estimatedMpg)} mi</Typography>
                                    <Typography variant="caption">{data.estimatedMpg} MPG</Typography>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Temp Card */}
                        <Card elevation={3}>
                            <CardContent sx={{ pb: '16px !important' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Thermostat color="error" fontSize="small" />
                                        <Typography variant="subtitle2">Engine Temp</Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ color: getTempColor(data.engineCoolantTemp) }}>
                                        {data.engineCoolantTemp}°F
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={(data.engineCoolantTemp / 260) * 100}
                                    color={data.engineCoolantTemp > 210 ? "error" : "info"}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </CardContent>
                        </Card>

                        {/* Load Card */}
                        <Card elevation={3}>
                            <CardContent sx={{ pb: '16px !important' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Bolt color="warning" fontSize="small" />
                                        <Typography variant="subtitle2">Engine Load</Typography>
                                    </Box>
                                    <Typography variant="h6">{Math.round(data.engineLoad)}%</Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={data.engineLoad}
                                    color="warning"
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Bottom Stats Row */}
                <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Battery', value: `${data.batteryVoltage} V`, icon: <BatteryChargingFull fontSize="small" /> },
                            { label: 'Throttle', value: `${data.throttlePosition}%`, icon: <TrendingUp fontSize="small" /> },
                            { label: 'Distance', value: `${Math.round(data.distanceTraveled * 10) / 10} mi`, icon: <Place fontSize="small" /> },
                            { label: 'Session ID', value: data.sessionId.split('-')[0], icon: <Settings fontSize="small" /> },
                        ].map((stat, i) => (
                            <Grid size={{ xs: 6, md: 3 }} key={i}>
                                <Card variant="outlined">
                                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: theme.palette.action.hover }}>
                                                {stat.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                                <Typography variant="subtitle1" fontWeight="bold">{stat.value}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
