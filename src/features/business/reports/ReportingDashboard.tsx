import {
  Download,
  Delete,
  Schedule,
  Assessment,
  History,
  PlayArrow,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
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
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';

const API_URL = 'http://localhost:8081';

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
      id={`reporting-tabpanel-${index}`}
      aria-labelledby={`reporting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ReportingDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Report Builder State
  const [reportType, setReportType] = useState('fleet_summary');
  const [reportName, setReportName] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [format, setFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDialog, setPreviewDialog] = useState(false);

  // Scheduled Report State
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduledReportData, setScheduledReportData] = useState({
    reportType: 'fleet_summary',
    reportName: '',
    frequency: 'weekly',
    schedule: { day: 1, hour: 8, minute: 0 },
    emailRecipients: [''],
    format: 'csv',
    isActive: true,
  });

  useEffect(() => {
    fetchReports();
    fetchScheduledReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      logger.error('Failed to fetch reports:', error)
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/scheduled-reports`);
      const data = await response.json();
      setScheduledReports(data);
    } catch (error) {
      logger.error('Failed to fetch scheduled reports:', error)
    }
  };

  const handleGenerateReport = async () => {
    if (!reportName) {
      setError('Please enter a report name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          reportName,
          dateRange,
          filters,
          format,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Report "${reportName}" generated successfully!`);
        setPreviewData(data.data);
        setPreviewDialog(true);
        fetchReports();
        setReportName('');
      } else {
        setError('Failed to generate report');
      }
    } catch (error) {
      setError('Failed to generate report: ' + error)
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: string, reportName: string, format: string) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await fetch(`${API_URL}/api/reports/${reportId}`, { method: 'DELETE' });
      setSuccess('Report deleted successfully');
      fetchReports();
    } catch (error) {
      setError('Failed to delete report');
    }
  };

  const handleCreateScheduledReport = async () => {
    if (!scheduledReportData.reportName) {
      setError('Please enter a report name');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/scheduled-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduledReportData),
      });

      if (response.ok) {
        setSuccess('Scheduled report created successfully');
        setScheduleDialog(false);
        fetchScheduledReports();
        setScheduledReportData({
          reportType: 'fleet_summary',
          reportName: '',
          frequency: 'weekly',
          schedule: { day: 1, hour: 8, minute: 0 },
          emailRecipients: [''],
          format: 'csv',
          isActive: true,
        })
      }
    } catch (error) {
      setError('Failed to create scheduled report');
    }
  };

  const handleToggleScheduledReport = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${API_URL}/api/scheduled-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchScheduledReports();
    } catch (error) {
      setError('Failed to update scheduled report');
    }
  };

  const handleDeleteScheduledReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      await fetch(`${API_URL}/api/scheduled-reports/${id}`, { method: 'DELETE' });
      setSuccess('Scheduled report deleted successfully');
      fetchScheduledReports();
    } catch (error) {
      setError('Failed to delete scheduled report');
    }
  };

  const reportTypes = [
    { value: 'fleet_summary', label: 'Fleet Summary Report' },
    { value: 'fuel_cost_analysis', label: 'Fuel Cost Analysis' },
    { value: 'maintenance_cost', label: 'Maintenance Cost Report' },
    { value: 'trip_summary', label: 'Trip Summary Report' },
    { value: 'cost_per_mile', label: 'Cost Per Mile Report' },
  ];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Reports & Export
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stats Panel */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Reports Generated
              </Typography>
              <Typography variant="h4">{reports.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Scheduled Reports Active
              </Typography>
              <Typography variant="h4">
                {scheduledReports.filter((r) => r.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Storage Used
              </Typography>
              <Typography variant="h4">
                {(reports.reduce((sum, r) => sum + (r.fileSize || 0), 0) / 1024).toFixed(2)} KB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Assessment />} label="Build Report" />
          <Tab icon={<Schedule />} label="Scheduled Reports" />
          <Tab icon={<History />} label="Report History" />
        </Tabs>

        {/* Build Report Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Report Name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Monthly Fleet Report"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={format}
                  label="Export Format"
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="pdf">PDF (Placeholder)</MenuItem>
                  <MenuItem value="excel">Excel (Placeholder)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleGenerateReport}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Scheduled Reports Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => setScheduleDialog(true)}
            >
              Create Scheduled Report
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.reportName}</TableCell>
                    <TableCell>
                      {reportTypes.find((t) => t.value === report.reportType)?.label}
                    </TableCell>
                    <TableCell>
                      <Chip label={report.frequency} size="small" />
                    </TableCell>
                    <TableCell>{report.format.toUpperCase()}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.isActive ? 'Active' : 'Inactive'}
                        color={report.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.nextRun
                        ? new Date(report.nextRun).toLocaleString()
                        : 'Not scheduled'}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={report.isActive}
                            onChange={() =>
                              handleToggleScheduledReport(report.id, report.isActive)
                            }
                          />
                        }
                        label=""
                      />
                      <IconButton
                        onClick={() => handleDeleteScheduledReport(report.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {scheduledReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No scheduled reports
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Report History Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Generated</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.reportName}</TableCell>
                    <TableCell>
                      {reportTypes.find((t) => t.value === report.reportType)?.label}
                    </TableCell>
                    <TableCell>
                      {report.dateRange?.start && report.dateRange?.end
                        ? `${new Date(report.dateRange.start).toLocaleDateString()} - ${new Date(
                            report.dateRange.end
                          ).toLocaleDateString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {new Date(report.generatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{report.format.toUpperCase()}</TableCell>
                    <TableCell>
                      {report.fileSize ? `${(report.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={report.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() =>
                          handleDownloadReport(report.id, report.reportName, report.format)
                        }
                        color="primary"
                      >
                        <Download />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteReport(report.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No reports generated yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(previewData.summary, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog
        open={scheduleDialog}
        onClose={() => setScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Scheduled Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Report Name"
                value={scheduledReportData.reportName}
                onChange={(e) =>
                  setScheduledReportData({ ...scheduledReportData, reportName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={scheduledReportData.reportType}
                  label="Report Type"
                  onChange={(e) =>
                    setScheduledReportData({
                      ...scheduledReportData,
                      reportType: e.target.value,
                    })
                  }
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={scheduledReportData.frequency}
                  label="Frequency"
                  onChange={(e) =>
                    setScheduledReportData({ ...scheduledReportData, frequency: e.target.value })
                  }
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={scheduledReportData.format}
                  label="Format"
                  onChange={(e) =>
                    setScheduledReportData({ ...scheduledReportData, format: e.target.value })
                  }
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Recipients (comma-separated)"
                value={scheduledReportData.emailRecipients.join(',')}
                onChange={(e) =>
                  setScheduledReportData({
                    ...scheduledReportData,
                    emailRecipients: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateScheduledReport} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
