import {
  Security,
  Warning,
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

import { useAuth } from '@/contexts';

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
  const [incidents, setIncidents] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingType, setViewingType] = useState<string>('');
  const [dialogType, setDialogType] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');

  const { getCurrentTenant } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchApi = async (path: string) => {
        const response = await fetch(API_BASE + path, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch ' + path);
        }
        const payload = await response.json();
        return payload?.data ?? payload;
      };

      const tenantId = getCurrentTenant();

      const [
        driversPayload,
        incidentsPayload,
        trainingsPayload,
        trainingProgressPayload,
        inspectionsPayload,
        policiesPayload,
        violationsPayload
      ] = await Promise.all([
        fetchApi('/drivers?limit=200'),
        fetchApi('/incidents?limit=200'),
        fetchApi('/training/courses?limit=200'),
        fetchApi('/training/progress'),
        fetchApi('/osha-compliance/safety-inspections?limit=200'),
        fetchApi('/policies?limit=200'),
        tenantId ? fetchApi('/hos/violations?tenant_id=' + tenantId) : Promise.resolve([])
      ]);

      const driversData = Array.isArray(driversPayload) ? driversPayload : [];
      setDrivers(driversData.map((driver: any) => ({
        id: driver.id,
        firstName: driver.first_name || driver.firstName || '',
        lastName: driver.last_name || driver.lastName || ''
      })));

      const incidentsData = Array.isArray(incidentsPayload) ? incidentsPayload : [];
      setIncidents(incidentsData.map((incident: any) => {
        const incidentDate = incident.incident_date || incident.date || incident.created_at;
        const dateObj = incidentDate ? new Date(incidentDate) : null;
        return {
          id: incident.number || incident.id,
          date: dateObj ? dateObj.toISOString().split('T')[0] : '',
          time: dateObj ? dateObj.toTimeString().slice(0, 5) : '',
          type: incident.type || incident.incident_type || 'Incident',
          severity: incident.severity || 'Unknown',
          vehicleId: incident.vehicle_id,
          driverId: incident.driver_id,
          location: incident.location || incident.address || '',
          description: incident.description || incident.incident_description || '',
          injuries: Boolean(incident.injuries_count) || Boolean(incident.injuries),
          propertyDamage: Boolean(incident.property_damage),
          estimatedCost: incident.estimated_cost || 0,
          status: incident.status || 'Open',
          investigator: incident.investigator || incident.reported_by_name || '',
          rootCause: incident.root_cause || '',
          correctiveActions: incident.corrective_actions || [],
          witnesses: incident.witnesses || [],
          policeReport: Boolean(incident.police_report),
          insuranceClaim: incident.insurance_claim_id || ''
        };
      }));

      const trainings = Array.isArray(trainingsPayload) ? trainingsPayload : [];
      const progress = Array.isArray(trainingProgressPayload) ? trainingProgressPayload : [];
      const progressByCourse = new Map();
      progress.forEach((row: any) => {
        const list = progressByCourse.get(row.course_id) || [];
        list.push({
          driverId: row.driver_id,
          completedDate: row.last_accessed || row.completed_date || row.updated_at,
          expiryDate: row.expiry_date,
          score: row.score
        });
        progressByCourse.set(row.course_id, list);
      });

      setTrainings(trainings.map((course: any) => ({
        id: course.id,
        name: course.title,
        type: course.category || 'Required',
        duration: course.duration_minutes ? String(course.duration_minutes) + ' minutes' : '',
        provider: course.instructor || course.certification || 'Internal',
        validFor: course.certification || '',
        completions: progressByCourse.get(course.id) || []
      })));

      const inspections = Array.isArray(inspectionsPayload) ? inspectionsPayload : [];
      setInspections(inspections.map((inspection: any) => ({
        id: inspection.id,
        type: inspection.type || inspection.inspection_type || 'Inspection',
        date: inspection.started_at || inspection.scheduled_at || inspection.created_at,
        inspector: inspection.inspector_name || inspection.inspector || 'Inspector',
        vehicleId: inspection.vehicle_id,
        status: inspection.status || 'pending',
        findings: inspection.findings || inspection.notes || '',
        nextDue: inspection.next_due_date
      })));

      const violations = Array.isArray(violationsPayload) ? violationsPayload : [];
      setViolations(violations.map((violation: any) => ({
        id: violation.id,
        type: violation.violation_type || violation.type || 'Violation',
        date: violation.date_issued || violation.created_at,
        vehicleId: violation.vehicle_id,
        driverId: violation.driver_id,
        severity: violation.severity || 'unknown',
        status: violation.status || 'open',
        description: violation.description || violation.notes || '',
        fine: violation.fine_amount || 0
      })));

      const policies = Array.isArray(policiesPayload) ? policiesPayload : [];
      setPolicies(policies.map((policy: any) => ({
        id: policy.id,
        name: policy.name,
        version: policy.version,
        effectiveDate: policy.effective_date,
        category: policy.category,
        mandatory: Boolean(policy.is_active),
        description: policy.description || '',
        lastReviewed: policy.updated_at || policy.created_at,
        nextReview: policy.next_review_date || '',
        acknowledgements: policy.acknowledgements_count || 0,
        totalRequired: driversData.length
      })));
    } catch (error) {
      console.error('Error loading safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSafetyMetrics = () => {
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => i.status !== 'Closed').length;
    const injuryIncidents = incidents.filter(i => i.injuries).length;
    const lastIncidentDate = incidents.length > 0 && incidents[0].date ? new Date(incidents[0].date) : null;
    const daysSinceLastIncident = lastIncidentDate && !isNaN(lastIncidentDate.getTime())
      ? Math.floor((new Date().getTime() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const totalTrainings = trainings.reduce((sum, t) => sum + t.completions.length, 0);
    const expiredTrainings = trainings.reduce((sum, t) =>
      sum + t.completions.filter((c: { expiryDate: string }) => new Date(c.expiryDate) < new Date()).length, 0
    );

    const complianceRate = policies.length > 0
      ? policies.reduce((sum, p) =>
        sum + (p.acknowledgements / Math.max(p.totalRequired || drivers.length || 1, 1)), 0
      ) / policies.length * 100
      : 0;

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
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-US', { month: 'short' })
      };
    });

    return months.map(month => {
      const monthIncidents = incidents.filter((incident) => incident.date?.startsWith(month.key));
      const nearMiss = monthIncidents.filter((incident) =>
        String(incident.type || '').toLowerCase().includes('near')
      ).length;
      return {
        month: month.label,
        incidents: monthIncidents.length,
        nearMiss,
        target: 2
      };
    });
  };

  const getSafetyRadarData = () => {
    const trainingCompletion = drivers.length > 0
      ? Math.round((trainings.reduce((sum, t) => sum + (t.completions?.length || 0), 0) / drivers.length) * 100)
      : 0;

    const complianceRate = policies.length > 0
      ? Math.round((policies.reduce((sum, p) => sum + (p.acknowledgements || 0) / Math.max(p.totalRequired || drivers.length || 1, 1), 0) / policies.length) * 100)
      : 0;

    const incidentScore = incidents.length === 0 ? 100 : Math.max(0, 100 - incidents.length * 5);
    const inspectionScore = inspections.length === 0
      ? 100
      : Math.round((inspections.filter((i) => String(i.status || '').toLowerCase() === 'completed' || String(i.status || '').toLowerCase() === 'passed').length / inspections.length) * 100);

    const equipmentScore = incidents.filter((i) => String(i.type || '').toLowerCase().includes('equipment')).length === 0 ? 100 : 70;
    const documentationScore = policies.length > 0 ? complianceRate : 0;

    return [
      { category: 'Training', score: trainingCompletion, fullMark: 100 },
      { category: 'Compliance', score: complianceRate, fullMark: 100 },
      { category: 'Incidents', score: incidentScore, fullMark: 100 },
      { category: 'Inspections', score: inspectionScore, fullMark: 100 },
      { category: 'Equipment', score: equipmentScore, fullMark: 100 },
      { category: 'Documentation', score: documentationScore, fullMark: 100 }
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
          <Tab icon={<Warning />} label="Incidents" />
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
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
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
                    <Typography variant="body2" color="warning.main">
                      {metrics.injuryIncidents} with injuries
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
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
                  {incidents.slice(0, 3).map(incident => (
                    <React.Fragment key={incident.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Chip
                            size="small"
                            label={incident.severity}
                            color={
                              incident.severity === 'High' ? 'error' :
                                incident.severity === 'Medium' ? 'warning' : 'default'
                            }
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={incident.type}
                          secondary={`${incident.date} - ${incident.location}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
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
                        .filter(i => filterStatus === 'all' || i.status.toLowerCase().includes(filterStatus))
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(incident => (
                          <TableRow key={incident.id}>
                            <TableCell>{incident.id}</TableCell>
                            <TableCell>{`${incident.date} ${incident.time}`}</TableCell>
                            <TableCell>{incident.type}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={incident.severity}
                                color={
                                  incident.severity === 'High' ? 'error' :
                                    incident.severity === 'Medium' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{`${incident.vehicleId} / ${incident.driverId}`}</TableCell>
                            <TableCell>{incident.location}</TableCell>
                            <TableCell>
                              {incident.injuries ? (
                                <Chip size="small" label="Yes" color="error" />
                              ) : (
                                <Chip size="small" label="No" color="success" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={incident.status}
                                color={incident.status === 'Closed' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleViewItem(incident, 'incident')}
                                sx={{ '&:hover': { color: 'primary.main' } }}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
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
                            {training.completions.slice(0, 3).map((completion: { driverId: string; expiryDate: string }) => {
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
                      {inspections.map(inspection => (
                        <TableRow key={inspection.id}>
                          <TableCell>{inspection.id}</TableCell>
                          <TableCell>{inspection.date}</TableCell>
                          <TableCell>{inspection.type}</TableCell>
                          <TableCell>{inspection.vehicleId}</TableCell>
                          <TableCell>{inspection.inspector}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={inspection.result}
                              color={inspection.result === 'Pass' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{inspection.violations.length || 'None'}</TableCell>
                          <TableCell>{inspection.nextDue || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={inspection.status}
                              color={inspection.status === 'Completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleViewItem(inspection, 'inspection')}
                              sx={{ '&:hover': { color: 'primary.main' } }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton size="small"><Download /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
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
                  {policies.map(policy => (
                    <Grid size={{ xs: 12, md: 6 }} key={policy.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start">
                            <Box>
                              <Typography variant="h6">{policy.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Version {policy.version} - Effective: {policy.effectiveDate}
                              </Typography>
                            </Box>
                            {policy.mandatory && (
                              <Chip label="Mandatory" size="small" color="error" />
                            )}
                          </Box>

                          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                            {policy.description}
                          </Typography>

                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="body2" color="textSecondary">
                              Acknowledgements:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(policy.acknowledgements / policy.totalRequired) * 100}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2">
                              {policy.acknowledgements}/{policy.totalRequired}
                            </Typography>
                          </Box>

                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <Typography variant="caption" color="textSecondary">
                              Next Review: {policy.nextReview}
                            </Typography>
                            <Button size="small" variant="outlined">
                              View Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
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
                      {violations.map(violation => (
                        <TableRow key={violation.id}>
                          <TableCell>{violation.date}</TableCell>
                          <TableCell>{violation.driverId}</TableCell>
                          <TableCell>{violation.type}</TableCell>
                          <TableCell>{violation.description}</TableCell>
                          <TableCell>{violation.location}</TableCell>
                          <TableCell>${violation.fineAmount}</TableCell>
                          <TableCell>{violation.points}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={violation.status}
                              color={violation.status === 'Resolved' ? 'success' : 'warning'}
                            />
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
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                      <Avatar sx={{ bgcolor: 'success.main' }}>
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
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Warning />
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
                      <Avatar sx={{ bgcolor: 'info.main' }}>
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
                control={<Checkbox checked={selectedItem?.injuries || false} />}
                label="Injuries Reported"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Checkbox checked={selectedItem?.propertyDamage || false} />}
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
              <Typography variant="body2" color="text.secondary">
                {viewingType === 'incident' && `${viewingItem?.date} ${viewingItem?.time} | ${viewingItem?.location}`}
                {viewingType === 'inspection' && `${viewingItem?.date} | ${viewingItem?.vehicleId}`}
              </Typography>
            </Box>
            <Chip
              label={viewingItem?.status}
              color={viewingItem?.status === 'Closed' || viewingItem?.status === 'Completed' ? 'success' : 'warning'}
              size="small"
            />
          </Stack>
        </DialogTitle>
        <DialogContent>
          {viewingItem && viewingType === 'incident' && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Alert severity={viewingItem.severity === 'High' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Type:</strong> {viewingItem.type} |
                    <strong> Severity:</strong> {viewingItem.severity} |
                    <strong> Vehicle:</strong> {viewingItem.vehicleId}
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
                        <Typography variant="body1">{viewingItem.description}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Driver Involved</Typography>
                        <Typography variant="body1">{viewingItem.driverId}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Location</Typography>
                        <Typography variant="body1">{viewingItem.location}</Typography>
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
                          label={viewingItem.injuries ? 'Yes' : 'No'}
                          color={viewingItem.injuries ? 'error' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Property Damage</Typography>
                        <Chip
                          label={viewingItem.propertyDamage ? 'Yes' : 'No'}
                          color={viewingItem.propertyDamage ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Current Status</Typography>
                        <Chip
                          label={viewingItem.status}
                          color={viewingItem.status === 'Closed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {viewingItem && viewingType === 'inspection' && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Inspector:</strong> {viewingItem.inspector} |
                    <strong> Type:</strong> {viewingItem.type} |
                    <strong> Score:</strong> {viewingItem.score}/100
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
                        <Typography variant="body1">{viewingItem.vehicleId}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Inspection Date</Typography>
                        <Typography variant="body1">{viewingItem.date}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Next Due Date</Typography>
                        <Typography variant="body1">{viewingItem.nextDue}</Typography>
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
                          value={viewingItem.score}
                          color={viewingItem.score >= 90 ? 'success' : viewingItem.score >= 70 ? 'warning' : 'error'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption">{viewingItem.score}/100</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={viewingItem.status}
                          color={viewingItem.status === 'Completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
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
