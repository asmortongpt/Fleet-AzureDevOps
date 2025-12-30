import {
  Error,
  ExpandMore,
  ExpandLess,
  Close,
  Search,
  Notifications,
  LocationOn,
  AttachMoney,
  Build,
  Assignment,
  DirectionsCar,
  FilterList,
  NotificationsActive,
  NotificationsOff
} from '@mui/icons-material';
import {
  Box,
  Alert as MuiAlert,
  AlertTitle,
  Chip,
  Typography,
  IconButton,
  Collapse,
  Grid,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import React, { useState, useMemo } from 'react';

import logger from '@/utils/logger';

interface Alert {
  id: string;
  type: 'geofencing' | 'budget' | 'maintenance' | 'license' | 'fuel' | 'vehicle' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  vehicleId?: string;
  driverId?: string;
  threshold?: number;
  actual?: number;
  actionRequired?: boolean;
  metadata?: Record<string, any>;
}

interface Props {
  alerts: Alert[];
  loading: boolean;
}

const AlertsPanel: React.FC<Props> = ({ alerts = [], loading }) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string[]>(['all']);
  const [typeFilter, setTypeFilter] = useState<string[]>(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const alertIcons = {
    geofencing: <LocationOn />,
    budget: <AttachMoney />,
    maintenance: <Build />,
    license: <Assignment />,
    fuel: <DirectionsCar />,
    vehicle: <DirectionsCar />,
    system: <Error />
  };

  const severityColors = {
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'error'
  } as const;

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    // Status filter
    if (!showResolved) {
      filtered = filtered.filter(a => a.status !== 'resolved');
    }

    // Severity filter
    if (!severityFilter.includes('all')) {
      filtered = filtered.filter(a => severityFilter.includes(a.severity));
    }

    // Type filter
    if (!typeFilter.includes('all')) {
      filtered = filtered.filter(a => typeFilter.includes(a.type));
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.message.toLowerCase().includes(term) ||
        (a.source?.toLowerCase().includes(term) ?? false)
      );
    }

    // Sort by timestamp (newest first) and severity
    filtered.sort((a, b) => {
      // Critical alerts first
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;

      // Then by timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return filtered;
  }, [alerts, severityFilter, typeFilter, searchTerm, showResolved]);

  // Group alerts by severity for summary
  const alertsBySeverity = useMemo(() => {
    const grouped: Record<string, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0
    };

    alerts
      .filter(a => a.status === 'active')
      .forEach(alert => {
        grouped[alert.severity] = (grouped[alert.severity] || 0) + 1;
      });

    return grouped;
  }, [alerts]);

  const handleAcknowledge = (alertId: string) => {
    // This would call an API to acknowledge the alert
    logger.debug('Acknowledge alert:', alertId);
  };

  const handleResolve = (alertId: string) => {
    // This would call an API to resolve the alert
    logger.debug('Resolve alert:', alertId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && alerts.length === 0) {
    return <Box sx={{ p: 2 }}>Loading alerts...</Box>;
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'error.contrastText' }}>
            <Typography variant="h4">{alertsBySeverity.critical ?? 0}</Typography>
            <Typography variant="caption">Critical</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
            <Typography variant="h4">{alertsBySeverity.error ?? 0}</Typography>
            <Typography variant="caption">Errors</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
            <Typography variant="h4">{alertsBySeverity.warning ?? 0}</Typography>
            <Typography variant="caption">Warnings</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
            <Typography variant="h4">{alertsBySeverity.info ?? 0}</Typography>
            <Typography variant="caption">Info</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ToggleButtonGroup
              value={severityFilter}
              onChange={(_event, value) => value && setSeverityFilter(value as string[])}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="critical">Critical</ToggleButton>
              <ToggleButton value="error">Error</ToggleButton>
              <ToggleButton value="warning">Warning</ToggleButton>
              <ToggleButton value="info">Info</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Chip
                icon={showResolved ? <NotificationsActive /> : <NotificationsOff />}
                label={showResolved ? 'Showing Resolved' : 'Hiding Resolved'}
                onClick={() => setShowResolved(!showResolved)}
                color={showResolved ? 'primary' : 'default'}
              />
              <Badge badgeContent={filteredAlerts.length} color="primary">
                <FilterList />
              </Badge>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alert Types Filter */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={typeFilter}
          onChange={(_event, value) => value && setTypeFilter(value as string[])}
          size="small"
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">All Types</ToggleButton>
          <ToggleButton value="geofencing">
            <LocationOn sx={{ mr: 0.5 }} /> Geofencing
          </ToggleButton>
          <ToggleButton value="budget">
            <AttachMoney sx={{ mr: 0.5 }} /> Budget
          </ToggleButton>
          <ToggleButton value="maintenance">
            <Build sx={{ mr: 0.5 }} /> Maintenance
          </ToggleButton>
          <ToggleButton value="license">
            <Assignment sx={{ mr: 0.5 }} /> License
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            {searchTerm || !severityFilter.includes('all') || !typeFilter.includes('all')
              ? 'No alerts match your filters'
              : 'No active alerts'}
          </Typography>
        </Paper>
      ) : (
        <List>
          {filteredAlerts.map((alert, index) => (
            <React.Fragment key={alert.id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ alignItems: 'flex-start', py: 2 }}>
                <ListItemIcon sx={{ mt: 1 }}>
                  <Badge
                    badgeContent={alert.actionRequired ? '!' : undefined}
                    color="error"
                  >
                    {alertIcons[alert.type] || <Error />}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" component="span">
                        {alert.title}
                      </Typography>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={severityColors[alert.severity]}
                      />
                      {alert.status === 'acknowledged' && (
                        <Chip label="Acknowledged" size="small" variant="outlined" />
                      )}
                      {alert.status === 'resolved' && (
                        <Chip label="Resolved" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {alert.message}
                      </Typography>

                      <Box display="flex" gap={2} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(alert.timestamp)}
                        </Typography>
                        {alert.source && (
                          <Typography variant="caption" color="text.secondary">
                            Source: {alert.source}
                          </Typography>
                        )}
                        {alert.vehicleId && (
                          <Chip label={`Vehicle: ${alert.vehicleId}`} size="small" />
                        )}
                      </Box>

                      {/* Threshold Information */}
                      {alert.threshold !== undefined && alert.actual !== undefined && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption">
                            Threshold: {alert.threshold} | Actual: {alert.actual}
                          </Typography>
                        </Box>
                      )}

                      {/* Expanded Details */}
                      <Collapse in={expandedAlert === alert.id}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          {alert.metadata && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Additional Details:
                              </Typography>
                              {Object.entries(alert.metadata).map(([key, value]) => (
                                <Typography key={key} variant="body2">
                                  {key}: {JSON.stringify(value)}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {alert.status === 'active' && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              <Chip
                                label="Acknowledge"
                                onClick={() => handleAcknowledge(alert.id)}
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label="Resolve"
                                onClick={() => handleResolve(alert.id)}
                                color="success"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  }
                />
                <ListItemSecondaryAction sx={{ top: '50%', transform: 'translateY(-50%)' }}>
                  <IconButton
                    edge="end"
                    onClick={() => setExpandedAlert(
                      expandedAlert === alert.id ? null : alert.id
                    )}
                  >
                    {expandedAlert === alert.id ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Critical Alert Banner */}
      {(alertsBySeverity.critical ?? 0) > 0 && (
        <MuiAlert
          severity="error"
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
          action={
            <IconButton color="inherit" size="small">
              <Close />
            </IconButton>
          }
        >
          <AlertTitle>Critical Alerts Active</AlertTitle>
          {alertsBySeverity.critical ?? 0} critical alert(s) require immediate attention
        </MuiAlert>
      )}
    </Box>
  );
};

export default AlertsPanel;