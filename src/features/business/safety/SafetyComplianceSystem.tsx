import {
  Security,
  Warning as AlertTriangle,
  CheckCircle,
  ReportProblem,
  Assignment,
  School,
  Assessment,
  Gavel,
  Add,
  Edit,
  Delete,
  Visibility,
  Download,
  Upload,
  VerifiedUser
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  FormControlLabel,
  Checkbox,
  Stack
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import logger from '@/utils/logger';

// Type definitions
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

interface TrainingCompletion {
  driverId: string;
  completedDate: string;
  expiryDate: string;
  score: number;
}

interface Training {
  id: string;
  name: string;
  type: string;
  duration: string;
  provider: string;
  validFor: string;
  completions: TrainingCompletion[];
}

// Mock database hook since the actual hook doesn't exist
const useDatabase = () => ({
  getDrivers: (): Driver[] => [
    { id: 'DRV-001', firstName: 'John', lastName: 'Martinez' },
    { id: 'DRV-002', firstName: 'Sarah', lastName: 'Johnson' },
    { id: 'DRV-003', firstName: 'Mike', lastName: 'Davis' },
    { id: 'DRV-004', firstName: 'Lisa', lastName: 'Anderson' },
    { id: 'DRV-005', firstName: 'Tom', lastName: 'Wilson' }
  ],
  getVehicles: () => []
});

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

const SafetyComplianceSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [incidents, setIncidents] = useState<Array<Record<string, unknown>>>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [inspections, setInspections] = useState<Array<Record<string, unknown>>>([]);
  const [violations, setViolations] = useState<Array<Record<string, unknown>>>([]);
  const [policies, setPolicies] = useState<Array<Record<string, unknown>>>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Record<string, unknown> | null>(null);
  const [viewingType, setViewingType] = useState<string>('');
  const [dialogType, setDialogType] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');

  const { getDrivers, getVehicles } = useDatabase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const driversData = getDrivers();
      setDrivers(driversData);

      // Generate safety incidents data
      const incidentsData = [
        {
          id: 'INC-2024-001',
          date: '2024-01-15',
          time: '14:30',
          type: 'Vehicle Collision',
          severity: 'Minor',
          vehicleId: 'VEH-003',
          driverId: 'DRV-003',
          location: 'Parking Lot B',
          description: 'Minor fender bender while backing up',
          injuries: false,
          propertyDamage: true,
          estimatedCost: 500,
          status: 'Under Review',
          investigator: 'John Safety',
          rootCause: 'Driver Error',
          correctiveActions: ['Additional training required', 'Review backing procedures'],
          witnesses: ['Jane Doe', 'Bob Smith'],
          policeReport: false,
          insuranceClaim: 'CLM-2024-001'
        },
        {
          id: 'INC-2024-002',
          date: '2024-01-10',
          time: '09:15',
          type: 'Near Miss',
          severity: 'Low',
          vehicleId: 'VEH-001',
          driverId: 'DRV-001',
          location: 'Highway 275',
          description: 'Close call with merging vehicle',
          injuries: false,
          propertyDamage: false,
          status: 'Closed',
          rootCause: 'Other Driver Error'
        },
        {
          id: 'INC-2024-003',
          date: '2024-01-08',
          time: '16:45',
          type: 'Equipment Failure',
          severity: 'Medium',
          vehicleId: 'VEH-002',
          driverId: 'DRV-002',
          location: 'Route 12',
          description: 'Tire blowout on highway',
          injuries: false,
          propertyDamage: false,
          status: 'Closed',
          rootCause: 'Equipment Wear',
          correctiveActions: ['Increase tire inspection frequency']
        }
      ];
      setIncidents(incidentsData);

      // Generate training records
      const trainingsData = [
        {
          id: 'TRN-001',
          name: 'Defensive Driving',
          type: 'Required',
          duration: '8 hours',
          provider: 'National Safety Council',
          validFor: '2 years',
          completions: [
            { driverId: 'DRV-001', completedDate: '2023-06-15', expiryDate: '2025-06-15', score: 95 },
            { driverId: 'DRV-002', completedDate: '2023-07-20', expiryDate: '2025-07-20', score: 88 },
            { driverId: 'DRV-003', completedDate: '2023-05-10', expiryDate: '2025-05-10', score: 92 }
          ]
        },
        {
          id: 'TRN-002',
          name: 'First Aid/CPR',
          type: 'Required',
          duration: '4 hours',
          provider: 'Red Cross',
          validFor: '1 year',
          completions: [
            { driverId: 'DRV-001', completedDate: '2023-09-01', expiryDate: '2024-09-01', score: 100 },
            { driverId: 'DRV-004', completedDate: '2023-10-15', expiryDate: '2024-10-15', score: 95 }
          ]
        },
        {
          id: 'TRN-003',
          name: 'Hazmat Handling',
          type: 'Specialized',
          duration: '16 hours',
          provider: 'DOT Certified',
          validFor: '3 years',
          completions: [
            { driverId: 'DRV-003', completedDate: '2022-11-01', expiryDate: '2025-11-01', score: 90 }
          ]
        },
        {
          id: 'TRN-004',
          name: 'School Bus Safety',
          type: 'Required',
          duration: '6 hours',
          provider: 'State DOE',
          validFor: '1 year',
          completions: [
            { driverId: 'DRV-001', completedDate: '2023-08-01', expiryDate: '2024-08-01', score: 98 }
          ]
        }
      ];
      setTrainings(trainingsData);

      // Generate inspection records
      const inspectionsData = [
        {
          id: 'INSP-2024-001',
          date: '2024-01-17',
          type: 'DOT Annual',
          vehicleId: 'VEH-003',
          inspector: 'DOT Inspector #4521',
          result: 'Pass',
          violations: [],
          certificateNumber: 'DOT-2024-0117-003',
          nextDue: '2025-01-17',
          status: 'Completed'
        },
        {
          id: 'INSP-2024-002',
          date: '2024-01-15',
          type: 'Pre-Trip',
          vehicleId: 'VEH-001',
          inspector: 'DRV-001',
          result: 'Pass with Issues',
          violations: ['Left turn signal dim'],
          status: 'Action Required',
          notes: 'Minor maintenance needed'
        },
        {
          id: 'INSP-2024-003',
          date: '2024-01-14',
          type: 'Random Safety',
          vehicleId: 'VEH-002',
          inspector: 'Safety Team',
          result: 'Pass',
          violations: [],
          status: 'Completed'
        }
      ];
      setInspections(inspectionsData);

      // Generate violations data
      const violationsData = [
        {
          id: 'VIO-2024-001',
          date: '2024-01-05',
          driverId: 'DRV-003',
          type: 'Moving Violation',
          description: 'Speeding - 10mph over limit',
          location: 'Interstate 75',
          fineAmount: 150,
          points: 3,
          status: 'Paid',
          courtDate: null
        },
        {
          id: 'VIO-2023-012',
          date: '2023-11-20',
          driverId: 'DRV-005',
          type: 'Equipment',
          description: 'Broken taillight',
          location: 'State Road 60',
          fineAmount: 75,
          points: 0,
          status: 'Resolved',
          courtDate: null
        }
      ];
      setViolations(violationsData);

      // Generate safety policies
      const policiesData = [
        {
          id: 'POL-001',
          name: 'Vehicle Operation Safety Policy',
          version: '2.1',
          effectiveDate: '2023-01-01',
          category: 'Operations',
          mandatory: true,
          description: 'Comprehensive vehicle operation safety guidelines',
          lastReviewed: '2023-12-01',
          nextReview: '2024-12-01',
          acknowledgements: 45,
          totalRequired: 50
        },
        {
          id: 'POL-002',
          name: 'Personal Protective Equipment',
          version: '1.5',
          effectiveDate: '2023-06-01',
          category: 'Safety Equipment',
          mandatory: true,
          description: 'PPE requirements for all maintenance staff',
          lastReviewed: '2023-11-15',
          nextReview: '2024-05-15',
          acknowledgements: 12,
          totalRequired: 12
        },
        {
          id: 'POL-003',
          name: 'Incident Reporting Procedures',
          version: '3.0',
          effectiveDate: '2023-03-01',
          category: 'Compliance',
          mandatory: true,
          description: 'Guidelines for reporting and documenting incidents',
          lastReviewed: '2023-09-01',
          nextReview: '2024-03-01',
          acknowledgements: 50,
          totalRequired: 50
        }
      ];
      setPolicies(policiesData);
    } catch (error) {
      logger.error('Error loading safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSafetyMetrics = () => {
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => (i as { status?: string }).status !== 'Closed').length;
    const injuryIncidents = incidents.filter(i => (i as { injuries?: boolean }).injuries).length;
    const daysSinceLastIncident = incidents.length > 0
      ? Math.floor((new Date().getTime() - new Date((incidents[0] as { date?: string }).date || '').getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const totalTrainings = trainings.reduce((sum, t) => sum + t.completions.length, 0);
    const expiredTrainings = trainings.reduce((sum, t) =>
      sum + t.completions.filter((c: TrainingCompletion) => new Date(c.expiryDate) < new Date()).length, 0
    );

    const complianceRate = policies.reduce((sum, p) =>
      sum + ((p as { acknowledgements?: number; totalRequired?: number }).acknowledgements || 0) / ((p as { acknowledgements?: number; totalRequired?: number }).totalRequired || 1), 0
    ) / policies.length * 100;

    return {
      totalIncidents,
      openIncidents,
      injuryIncidents,
      daysSinceLastIncident,
      totalTrainings,
      expiredTrainings,
      complianceRate: complianceRate.toFixed(1),
      safetyScore: (100 - (totalIncidents * 5)).toFixed(0)
    };
  };

  const getIncidentTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      incidents: Math.floor(Math.random() * 5),
      nearMiss: Math.floor(Math.random() * 8),
      target: 2
    }));
  };

  const getSafetyRadarData = () => {
    return [
      { category: 'Training', score: 85, fullMark: 100 },
      { category: 'Compliance', score: 92, fullMark: 100 },
      { category: 'Incidents', score: 75, fullMark: 100 },
      { category: 'Inspections', score: 88, fullMark: 100 },
      { category: 'Equipment', score: 90, fullMark: 100 },
      { category: 'Documentation', score: 95, fullMark: 100 }
    ];
  };

  const getTrainingCompletionData = () => {
    return trainings.map(t => ({
      training: t.name,
      completed: t.completions.length,
      required: drivers.length,
      percentage: (t.completions.length / drivers.length * 100).toFixed(0)
    }));
  };

  const metrics = calculateSafetyMetrics();
  const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

  const handleNewIncident = () => {
    setSelectedItem({
      id: `INC-2024-${String(incidents.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      type: '',
      severity: '',
      vehicleId: '',
      driverId: '',
      location: '',
      description: '',
      injuries: false,
      propertyDamage: false,
      status: 'Open'
    });
    setDialogType('incident');
    setDialogOpen(true);
  };

  const handleNewTraining = () => {
    setSelectedItem({
      driverId: '',
      trainingId: '',
      scheduledDate: '',
      status: 'Scheduled'
    });
    setDialogType('training');
    setDialogOpen(true);
  };

  const handleViewItem = (item: any, type: string) => {
    setViewingItem(item);
    setViewingType(type);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewingItem(null);
    setViewingType('');
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Assessment />} label="Dashboard" />
          <Tab icon={<AlertTriangle />} label="Incidents" />
          <Tab icon={<School />} label="Training" />
          <Tab icon={<Assignment />} label="Inspections" />
          <Tab icon={<Gavel />} label="Compliance" />
          <Tab icon={<Security />} label="Audit Trail" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress />}

      <TabPanel value={tabValue} index={0}>
        {/* Dashboard */}
        <Grid container spacing={3}>
          {/* Metrics Cards */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ bgcolor: 'success: main', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3">{metrics.daysSinceLastIncident}</Typography>
                    <Typography>Days Since Last Incident</Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 50, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Safety Score</Typography>
                    <Typography variant="h4">{metrics.safetyScore}/100</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseInt(metrics.safetyScore)}
                      sx={{ mt: 1 }}
                      color={parseInt(metrics.safetyScore) > 80 ? 'success' : 'warning'}
                    />
                  </Box>
                  <VerifiedUser color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Open Incidents</Typography>
                    <Typography variant="h4">{metrics.openIncidents}</Typography>
                    <Typography variant="body2" color="warning: main">
                      {metrics.injuryIncidents} with injuries
                    </Typography>
                  </Box>
                  <AlertTriangle color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Compliance Rate</Typography>
                    <Typography variant="h4">{metrics.complianceRate}%</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {metrics.expiredTrainings} expired trainings
                    </Typography>
                  </Box>
                  <Assignment color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Safety Performance Radar */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Safety Performance Overview</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getSafetyRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Incident Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Incident Trend Analysis</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getIncidentTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#f44336" name="Incidents" />
                    <Line type="monotone" dataKey="nearMiss" stroke="#ff9800" name="Near Miss" />
                    <Line type="monotone" dataKey="target" stroke="#4caf50" name="Target" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Training Completion */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Training Completion Status</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getTrainingCompletionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="training" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                    <Bar dataKey="required" fill="#82ca9d" name="Required" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Incidents */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Incidents</Typography>
                <List>
                  {incidents.slice(0, 3).map(incident => {
                    const inc = incident as { id?: string; severity?: string; type?: string; date?: string; location?: string };
                    return (
                      <React.Fragment key={inc.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Chip
                              size="small"
                              label={inc.severity}
                              color={
                                inc.severity === 'High' ? 'error' :
                                  inc.severity === 'Medium' ? 'warning' : 'default'
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={inc.type}
                            secondary={`${inc.date} - ${inc.location}`}
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    );
                  })}
                </List>
                <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                  View All Incidents
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance Alerts */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Compliance Alerts</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Alert severity="error">
                      <Typography variant="subtitle2">Expired Training</Typography>
                      <Typography variant="body2">3 drivers have expired CPR certification</Typography>
                    </Alert>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2">Inspection Due</Typography>
                      <Typography variant="body2">5 vehicles due for DOT inspection this month</Typography>
                    </Alert>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Alert severity="info">
                      <Typography variant="subtitle2">Policy Review</Typography>
                      <Typography variant="body2">Safety policy POL-003 due for annual review</Typography>
                    </Alert>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Alert severity="success">
                      <Typography variant="subtitle2">Achievement</Typography>
                      <Typography variant="body2">30 days without preventable accidents</Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Incidents Management */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">Incident Management</Typography>
                  <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Status Filter</InputLabel>
                      <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        label="Status Filter"
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="under_review">Under Review</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Download />}>Export Report</Button>
                    <Button variant="contained" startIcon={<Add />} onClick={handleNewIncident}>
                      Report Incident
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Incident ID</TableCell>
                        <TableCell>Date/Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Vehicle/Driver</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Injuries</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {incidents
                        .filter(i => {
                          const status = (i as { status?: string }).status;
                          return filterStatus === 'all' || (status && status.toLowerCase().includes(filterStatus));
                        })
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(incident => {
                          const inc = incident as {
                            id?: string;
                            date?: string;
                            time?: string;
                            type?: string;
                            severity?: string;
                            vehicleId?: string;
                            driverId?: string;
                            location?: string;
                            injuries?: boolean;
                            status?: string;
                          };
                          return (
                            <TableRow key={inc.id}>
                              <TableCell>{inc.id}</TableCell>
                              <TableCell>{`${inc.date} ${inc.time}`}</TableCell>
                              <TableCell>{inc.type}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={inc.severity}
                                  color={
                                    inc.severity === 'High' ? 'error' :
                                      inc.severity === 'Medium' ? 'warning' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>{`${inc.vehicleId} / ${inc.driverId}`}</TableCell>
                              <TableCell>{inc.location}</TableCell>
                              <TableCell>
                                {inc.injuries ? (
                                  <Chip size="small" label="Yes" color="error" />
                                ) : (
                                  <Chip size="small" label="No" color="success" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={inc.status}
                                  color={inc.status === 'Closed' ? 'success' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewItem(incident, 'incident')}
                                  sx={{ '&:hover': { color: 'primary: main' } }}
                                >
                                  <Visibility />
                                </IconButton>
                                <IconButton size="small">
                                  <Edit />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={incidents.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Training Management */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">Training Records</Typography>
                  <Box display="flex" gap={2}>
                    <Button variant="outlined" startIcon={<Upload />}>Import Records</Button>
                    <Button variant="contained" startIcon={<Add />} onClick={handleNewTraining}>
                      Schedule Training
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {trainings.map(training => (
                    <Grid size={{ xs: 12, md: 6 }} key={training.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Box>
                              <Typography variant="h6">{training.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Provider: {training.provider}
                              </Typography>
                            </Box>
                            <Chip
                              label={training.type}
                              size="small"
                              color={training.type === 'Required' ? 'error' : 'default'}
                            />
                          </Box>

                          <Grid container spacing={2} mb={2}>
                            <Grid size={6}>
                              <Typography variant="body2" color="textSecondary">Duration</Typography>
                              <Typography>{training.duration}</Typography>
                            </Grid>
                            <Grid size={6}>
                              <Typography variant="body2" color="textSecondary">Valid For</Typography>
                              <Typography>{training.validFor}</Typography>
                            </Grid>
                          </Grid>

                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Completion Status
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <LinearProgress
                              variant="determinate"
                              value={(training.completions.length / drivers.length) * 100}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">
                              {training.completions.length}/{drivers.length}
                            </Typography>
                          </Box>

                          <List dense>
                            {training.completions.slice(0, 3).map((completion: TrainingCompletion) => {
                              const driver = drivers.find(d => d.id === completion.driverId);
                              const expired = new Date(completion.expiryDate) < new Date();
                              return (
                                <ListItem key={completion.driverId}>
                                  <ListItemIcon>
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                      {driver?.firstName?.[0]}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`${driver?.firstName} ${driver?.lastName}`}
                                    secondary={`Expires: ${completion.expiryDate}`}
                                  />
                                  {expired && (
                                    <Chip size="small" label="Expired" color="error" />
                                  )}
                                </ListItem>
                              );
                            })}
                          </List>

                          <Button fullWidth variant="outlined" size="small">
                            View All Records
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Training Calendar */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Upcoming Training Schedule</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Training</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Participants</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>2024-02-01</TableCell>
                        <TableCell>Defensive Driving Refresher</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>12</TableCell>
                        <TableCell>Training Room A</TableCell>
                        <TableCell>
                          <Chip size="small" label="Scheduled" color="info" />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small"><Edit /></IconButton>
                          <IconButton size="small" color="error"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2024-02-15</TableCell>
                        <TableCell>First Aid/CPR</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>8</TableCell>
                        <TableCell>Main Office</TableCell>
                        <TableCell>
                          <Chip size="small" label="Confirmed" color="success" />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small"><Edit /></IconButton>
                          <IconButton size="small" color="error"><Delete /></IconButton>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Inspections */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Inspection Records</Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Inspection ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Inspector</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Violations</TableCell>
                        <TableCell>Next Due</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspections.map(inspection => {
                        const insp = inspection as {
                          id?: string;
                          date?: string;
                          type?: string;
                          vehicleId?: string;
                          inspector?: string;
                          result?: string;
                          violations?: unknown[];
                          nextDue?: string;
                          status?: string;
                        };
                        return (
                          <TableRow key={insp.id}>
                            <TableCell>{insp.id}</TableCell>
                            <TableCell>{insp.date}</TableCell>
                            <TableCell>{insp.type}</TableCell>
                            <TableCell>{insp.vehicleId}</TableCell>
                            <TableCell>{insp.inspector}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={insp.result}
                                color={insp.result === 'Pass' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>{(insp.violations as unknown[])?.length || 'None'}</TableCell>
                            <TableCell>{insp.nextDue || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={insp.status}
                                color={insp.status === 'Completed' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleViewItem(inspection, 'inspection')}
                                sx={{ '&:hover': { color: 'primary: main' } }}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton size="small"><Download /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Inspection Checklist */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pre-Trip Inspection Checklist</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Exterior</Typography>
                    <FormControlLabel control={<Checkbox />} label="Lights & Reflectors" />
                    <FormControlLabel control={<Checkbox />} label="Tires & Wheels" />
                    <FormControlLabel control={<Checkbox />} label="Windshield & Mirrors" />
                    <FormControlLabel control={<Checkbox />} label="Body Condition" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Engine Compartment</Typography>
                    <FormControlLabel control={<Checkbox />} label="Oil Level" />
                    <FormControlLabel control={<Checkbox />} label="Coolant Level" />
                    <FormControlLabel control={<Checkbox />} label="Belts & Hoses" />
                    <FormControlLabel control={<Checkbox />} label="Battery" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Interior</Typography>
                    <FormControlLabel control={<Checkbox />} label="Brakes" />
                    <FormControlLabel control={<Checkbox />} label="Steering" />
                    <FormControlLabel control={<Checkbox />} label="Emergency Equipment" />
                    <FormControlLabel control={<Checkbox />} label="Gauges & Controls" />
                  </Grid>
                </Grid>
                <Box mt={2}>
                  <Button variant="contained" startIcon={<CheckCircle />}>
                    Complete Inspection
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Compliance */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Compliance Management</Typography>

                {/* Policy Compliance */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Safety Policies</Typography>
                <Grid container spacing={2}>
                  {policies.map(policy => {
                    const pol = policy as {
                      id?: string;
                      name?: string;
                      version?: string;
                      effectiveDate?: string;
                      mandatory?: boolean;
                      description?: string;
                      acknowledgements?: number;
                      totalRequired?: number;
                      nextReview?: string;
                    };
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={pol.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="start">
                              <Box>
                                <Typography variant="h6">{pol.name}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Version {pol.version} - Effective: {pol.effectiveDate}
                                </Typography>
                              </Box>
                              {pol.mandatory && (
                                <Chip label="Mandatory" size="small" color="error" />
                              )}
                            </Box>

                            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                              {pol.description}
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="body2" color="textSecondary">
                                Acknowledgements:
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={((pol.acknowledgements || 0) / (pol.totalRequired || 1)) * 100}
                                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2">
                                {pol.acknowledgements}/{pol.totalRequired}
                              </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                              <Typography variant="caption" color="textSecondary">
                                Next Review: {pol.nextReview}
                              </Typography>
                              <Button size="small" variant="outlined">
                                View Details
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Violations */}
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Traffic Violations</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Fine</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {violations.map(violation => {
                        const viol = violation as {
                          id?: string;
                          date?: string;
                          driverId?: string;
                          type?: string;
                          description?: string;
                          location?: string;
                          fineAmount?: number;
                          points?: number;
                          status?: string;
                        };
                        return (
                          <TableRow key={viol.id}>
                            <TableCell>{viol.date}</TableCell>
                            <TableCell>{viol.driverId}</TableCell>
                            <TableCell>{viol.type}</TableCell>
                            <TableCell>{viol.description}</TableCell>
                            <TableCell>{viol.location}</TableCell>
                            <TableCell>${viol.fineAmount}</TableCell>
                            <TableCell>{viol.points}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={viol.status}
                                color={viol.status === 'Resolved' ? 'success' : 'warning'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {/* Audit Trail */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Safety Audit Trail</Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary: main' }}>
                        <Assignment />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Incident Report INC-2024-001 created"
                      secondary="2024-01-17 14:30 - John Martinez"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success: main' }}>
                        <CheckCircle />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Training completed: Defensive Driving"
                      secondary="2024-01-16 09:00 - Sarah Johnson"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'warning: main' }}>
                        <AlertTriangle />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Inspection failed: VEH-002 - Left turn signal"
                      secondary="2024-01-15 10:15 - DOT Inspector"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'info: main' }}>
                        <Security />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Policy updated: Vehicle Operation Safety Policy v2.1"
                      secondary="2024-01-14 15:00 - Admin"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Incident Dialog */}
      <Dialog open={dialogOpen && dialogType === 'incident'} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report New Incident</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={selectedItem?.date || ''}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Time"
                value={selectedItem?.time || ''}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Incident Type</InputLabel>
                <Select value={selectedItem?.type || ''} label="Incident Type">
                  <MenuItem value="Vehicle Collision">Vehicle Collision</MenuItem>
                  <MenuItem value="Near Miss">Near Miss</MenuItem>
                  <MenuItem value="Equipment Failure">Equipment Failure</MenuItem>
                  <MenuItem value="Personal Injury">Personal Injury</MenuItem>
                  <MenuItem value="Property Damage">Property Damage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select value={selectedItem?.severity || ''} label="Severity">
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Minor">Minor</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Location"
                value={selectedItem?.location || ''}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={selectedItem?.description || ''}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Checkbox checked={Boolean((selectedItem as { injuries?: boolean })?.injuries)} />}
                label="Injuries Reported"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Checkbox checked={Boolean((selectedItem as { propertyDamage?: boolean })?.propertyDamage)} />}
                label="Property Damage"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Submit Report</Button>
        </DialogActions>
      </Dialog>

      {/* Detailed View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            {viewingType === 'incident' && <ReportProblem color="error" />}
            {viewingType === 'inspection' && <VerifiedUser color="primary" />}
            <Box>
              <Typography variant="h6">
                {viewingType === 'incident' && `Safety Incident - ${viewingItem?.id}`}
                {viewingType === 'inspection' && `Safety Inspection - ${viewingItem?.id}`}
              </Typography>
              <Typography variant="body2" color="text: secondary">
                {viewingType === 'incident' && `${viewingItem?.date} ${viewingItem?.time} | ${viewingItem?.location}`}
                {viewingType === 'inspection' && `${viewingItem?.date} | ${viewingItem?.vehicleId}`}
              </Typography>
            </Box>
            <Chip
              label={String((viewingItem as { status?: string })?.status || '')}
              color={(viewingItem as { status?: string })?.status === 'Closed' || (viewingItem as { status?: string })?.status === 'Completed' ? 'success' : 'warning'}
              size="small"
            />
          </Stack>
        </DialogTitle>
        <DialogContent>
          {viewingItem && viewingType === 'incident' && (() => {
            const item = viewingItem as {
              severity?: string;
              type?: string;
              vehicleId?: string;
              description?: string;
              driverId?: string;
              location?: string;
              injuries?: boolean;
              propertyDamage?: boolean;
              status?: string;
            };
            return (
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Alert severity={item.severity === 'High' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Type:</strong> {item.type} |
                      <strong> Severity:</strong> {item.severity} |
                      <strong> Vehicle:</strong> {item.vehicleId}
                    </Typography>
                  </Alert>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Incident Details
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Description</Typography>
                          <Typography variant="body1">{item.description}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Driver Involved</Typography>
                          <Typography variant="body1">{item.driverId}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Location</Typography>
                          <Typography variant="body1">{item.location}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Impact Assessment
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Injuries Reported</Typography>
                          <Chip
                            label={item.injuries ? 'Yes' : 'No'}
                            color={item.injuries ? 'error' : 'success'}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Property Damage</Typography>
                          <Chip
                            label={item.propertyDamage ? 'Yes' : 'No'}
                            color={item.propertyDamage ? 'warning' : 'success'}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current Status</Typography>
                          <Chip
                            label={item.status}
                            color={item.status === 'Closed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            );
          })()}

          {viewingItem && viewingType === 'inspection' && (() => {
            const item = viewingItem as {
              inspector?: string;
              type?: string;
              score?: number;
              vehicleId?: string;
              date?: string;
              nextDue?: string;
              status?: string;
            };
            const score = item.score || 0;
            return (
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Inspector:</strong> {item.inspector} |
                      <strong> Type:</strong> {item.type} |
                      <strong> Score:</strong> {score}/100
                    </Typography>
                  </Alert>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Inspection Details
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Vehicle ID</Typography>
                          <Typography variant="body1">{item.vehicleId}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Inspection Date</Typography>
                          <Typography variant="body1">{item.date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Next Due Date</Typography>
                          <Typography variant="body1">{item.nextDue}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Inspection Results
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Overall Score</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={score}
                            color={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error'}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">{score}/100</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={item.status}
                            color={item.status === 'Completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button variant="contained" color="primary">
            Generate Report
          </Button>
          {viewingType === 'incident' && (
            <Button variant="contained" color="warning">
              Follow Up Required
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SafetyComplianceSystem;