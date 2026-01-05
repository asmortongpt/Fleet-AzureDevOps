import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Fab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { format, parseISO, differenceInDays } from 'date-fns';
import React, { useState, useEffect } from 'react';

import WarrantyRecallService, {
  WarrantyInfo,
  RecallInfo,
  WarrantyAnalytics,
  RecallAnalytics
} from '../../services/inventory/WarrantyRecallService';

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
      id={`warranty-tabpanel-${index}`}
      aria-labelledby={`warranty-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WarrantyRecallDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [warranties, setWarranties] = useState<WarrantyInfo[]>([]);
  const [recalls, setRecalls] = useState<RecallInfo[]>([]);
  const [warrantyAnalytics, setWarrantyAnalytics] = useState<WarrantyAnalytics | null>(null);
  const [recallAnalytics, setRecallAnalytics] = useState<RecallAnalytics | null>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyInfo | null>(null);
  const [selectedRecall, setSelectedRecall] = useState<RecallInfo | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({
    claimNumber: '',
    issueDescription: '',
    claimType: 'DEFECT' as const
  });
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        WarrantyRecallService.initializeWarranties(),
        WarrantyRecallService.initializeRecalls()
      ]);

      const [warrantyData, recallData, warrantyStats, recallStats] = await Promise.all([
        WarrantyRecallService.getWarrantyAnalytics().then(() => Array.from((WarrantyRecallService as any).warranties.values())),
        WarrantyRecallService.getActiveRecalls(),
        WarrantyRecallService.getWarrantyAnalytics(),
        WarrantyRecallService.getRecallAnalytics()
      ]);

      setWarranties(warrantyData);
      setRecalls(recallData);
      setWarrantyAnalytics(warrantyStats);
      setRecallAnalytics(recallStats);

      const totalNotifications = warrantyData.reduce((sum, w) =>
        sum + w.notifications.filter(n => !n.acknowledged).length, 0
      );
      setNotificationCount(totalNotifications);
    } catch (error) {
      console.error('Error initializing warranty/recall data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getWarrantyStatusColor = (warranty: WarrantyInfo) => {
    const endDate = parseISO(warranty.warrantyEndDate);
    const daysRemaining = differenceInDays(endDate, new Date());

    if (warranty.status === 'EXPIRED') return 'error';
    if (daysRemaining <= 30) return 'warning';
    if (daysRemaining <= 90) return 'info';
    return 'success';
  };

  const getRecallSeverityColor = (severity: string) => {
    switch (severity) {
      case 'SAFETY': return 'error';
      case 'PERFORMANCE': return 'warning';
      case 'QUALITY': return 'info';
      case 'REGULATORY': return 'secondary';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE': return 'error';
      case 'URGENT': return 'warning';
      case 'MODERATE': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedWarranty) return;

    try {
      const claimId = await WarrantyRecallService.submitWarrantyClaim({
        claimNumber: newClaim.claimNumber,
        dateSubmitted: new Date().toISOString(),
        issueDescription: newClaim.issueDescription,
        claimType: newClaim.claimType,
        attachments: []
      });

      setClaimDialogOpen(false);
      setNewClaim({ claimNumber: '', issueDescription: '', claimType: 'DEFECT' });
      await initializeData();
    } catch (error) {
      console.error('Error submitting warranty claim:', error);
    }
  };

  const handleRecallAction = async (recallId: string, partId: string, action: string) => {
    try {
      await WarrantyRecallService.processRecallAction(recallId, partId, {
        actionTaken: action,
        actionBy: 'Current User'
      });
      await initializeData();
    } catch (error) {
      console.error('Error processing recall action:', error);
    }
  };

  const generateComplianceReport = async () => {
    try {
      const report = await WarrantyRecallService.generateComplianceReport();
      const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance-report-${report.reportId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating compliance report:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Warranty & Recall Management</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Warranty & Recall Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Badge badgeContent={notificationCount} color="error">
            <Fab color="primary" size="medium">
              <NotificationsIcon />
            </Fab>
          </Badge>
          <Fab
            color="secondary"
            size="medium"
            onClick={generateComplianceReport}
          >
            <DownloadIcon />
          </Fab>
        </Box>
      </Box>

      {warrantyAnalytics && recallAnalytics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Warranties</Typography>
                </Box>
                <Typography variant="h4">{warrantyAnalytics.activeWarranties}</Typography>
                <Typography variant="body2" color="text: secondary">
                  {warrantyAnalytics.expiringWithin30Days} expiring soon
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Recalls</Typography>
                </Box>
                <Typography variant="h4">{recallAnalytics.activeRecalls}</Typography>
                <Typography variant="body2" color="text: secondary">
                  {recallAnalytics.affectedItemsCount} items affected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Compliance Rate</Typography>
                </Box>
                <Typography variant="h4">{recallAnalytics.complianceRate.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text: secondary">
                  {recallAnalytics.overdueActions} overdue actions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SpeedIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Claim Success Rate</Typography>
                </Box>
                <Typography variant="h4">{warrantyAnalytics.claimSuccessRate.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text: secondary">
                  {warrantyAnalytics.totalClaims} total claims
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="warranty recall tabs">
          <Tab label="Warranties" />
          <Tab label="Recalls" />
          <Tab label="Claims" />
          <Tab label="Analytics" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Warranty Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setClaimDialogOpen(true)}
            >
              Submit Claim
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Days Remaining</TableCell>
                  <TableCell>Claims</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warranties.map((warranty) => {
                  const endDate = parseISO(warranty.warrantyEndDate);
                  const daysRemaining = differenceInDays(endDate, new Date());

                  return (
                    <TableRow key={warranty.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {warranty.partName}
                          </Typography>
                          <Typography variant="caption" color="text: secondary">
                            {warranty.partNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{warranty.vendorName}</TableCell>
                      <TableCell>
                        <Chip
                          label={warranty.warrantyType}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={warranty.status}
                          size="small"
                          color={getWarrantyStatusColor(warranty)}
                        />
                      </TableCell>
                      <TableCell>
                        {format(endDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {daysRemaining > 0 ? (
                            <>
                              <ScheduleIcon
                                fontSize="small"
                                color={daysRemaining <= 30 ? 'error' : 'action'}
                                sx={{ mr: 1 }}
                              />
                              <Typography
                                variant="body2"
                                color={daysRemaining <= 30 ? 'error' : 'text: primary'}
                              >
                                {daysRemaining} days
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="error">
                              Expired
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={warranty.claimHistory.length} color="primary">
                          <BuildIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setSelectedWarranty(warranty)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Active Recalls</Typography>

          {recalls.map((recall) => (
            <Accordion key={recall.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{recall.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={recall.severity}
                        size="small"
                        color={getRecallSeverityColor(recall.severity)}
                      />
                      <Chip
                        label={recall.urgency}
                        size="small"
                        color={getUrgencyColor(recall.urgency)}
                      />
                      <Chip
                        label={recall.issuedBy}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text: secondary">
                    {recall.recallNumber}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" paragraph>
                      {recall.description}
                    </Typography>

                    <Typography variant="h6" gutterBottom>Remedy</Typography>
                    <Typography variant="body2" paragraph>
                      {recall.remedyDescription}
                    </Typography>

                    <Typography variant="h6" gutterBottom>Affected Parts</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {recall.affectedParts.map((part, index) => (
                        <Chip key={index} label={part} size="small" />
                      ))}
                    </Box>

                    {recall.affectedInventory.length > 0 && (
                      <>
                        <Typography variant="h6" gutterBottom>Affected Inventory</Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Part Number</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Action Required</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {recall.affectedInventory.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.partNumber}</TableCell>
                                  <TableCell>{item.location}</TableCell>
                                  <TableCell>{item.actionRequired}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={item.complianceStatus}
                                      size="small"
                                      color={item.complianceStatus === 'COMPLETED' ? 'success' : 'warning'}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {item.complianceStatus === 'PENDING' && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleRecallAction(recall.id, item.partId, item.actionRequired)}
                                      >
                                        Complete Action
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Vendor Contact</Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <BusinessIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={recall.vendorContact.name}
                              secondary={recall.vendorContact.department}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <EmailIcon />
                            </ListItemIcon>
                            <ListItemText primary={recall.vendorContact.email} />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <PhoneIcon />
                            </ListItemIcon>
                            <ListItemText primary={recall.vendorContact.phone} />
                          </ListItem>
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="body2" color="text: secondary">
                          <strong>Issued:</strong> {format(parseISO(recall.dateIssued), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text: secondary">
                          <strong>Effective:</strong> {format(parseISO(recall.effectiveDate), 'MMM dd, yyyy')}
                        </Typography>
                        {recall.complianceDeadline && (
                          <Typography variant="body2" color="error">
                            <strong>Deadline:</strong> {format(parseISO(recall.complianceDeadline), 'MMM dd, yyyy')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Warranty Claims</Typography>

          {warranties.map((warranty) =>
            warranty.claimHistory.length > 0 && (
              <Accordion key={warranty.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6">{warranty.partName}</Typography>
                    <Box sx={{ ml: 'auto' }}>
                      <Badge badgeContent={warranty.claimHistory.length} color="primary">
                        <BuildIcon />
                      </Badge>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Claim Number</TableCell>
                          <TableCell>Date Submitted</TableCell>
                          <TableCell>Issue</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Resolution</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {warranty.claimHistory.map((claim) => (
                          <TableRow key={claim.id}>
                            <TableCell>{claim.claimNumber}</TableCell>
                            <TableCell>
                              {format(parseISO(claim.dateSubmitted), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{claim.issueDescription}</TableCell>
                            <TableCell>
                              <Chip label={claim.claimType} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={claim.status}
                                size="small"
                                color={claim.status === 'RESOLVED' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>{claim.resolution || 'Pending'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Analytics & Reports</Typography>

          {warrantyAnalytics && recallAnalytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Warranty Performance</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text: secondary">
                        Claim Success Rate
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={warrantyAnalytics.claimSuccessRate}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {warrantyAnalytics.claimSuccessRate.toFixed(1)}%
                      </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom>Top Claim Reasons</Typography>
                    {warrantyAnalytics.topClaimReasons.map((reason, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{reason.reason}</Typography>
                          <Typography variant="body2">{reason.count}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(reason.count / warrantyAnalytics.totalClaims) * 100}
                          sx={{ height: 4 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recall Compliance</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text: secondary">
                        Overall Compliance Rate
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={recallAnalytics.complianceRate}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={recallAnalytics.complianceRate >= 90 ? 'success' : 'warning'}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {recallAnalytics.complianceRate.toFixed(1)}%
                      </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom>Recalls by Severity</Typography>
                    {Object.entries(recallAnalytics.recallsBySeverity).map(([severity, count]) => (
                      <Box key={severity} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{severity}</Typography>
                          <Typography variant="body2">{count}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(count / recallAnalytics.totalRecalls) * 100}
                          sx={{ height: 4 }}
                          color={getRecallSeverityColor(severity) as any}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Vendor Performance</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Vendor</TableCell>
                            <TableCell>Total Warranties</TableCell>
                            <TableCell>Claim Rate (%)</TableCell>
                            <TableCell>Avg Resolution Time (days)</TableCell>
                            <TableCell>Satisfaction</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {warrantyAnalytics.vendorPerformance.map((vendor) => (
                            <TableRow key={vendor.vendorId}>
                              <TableCell>{vendor.vendorName}</TableCell>
                              <TableCell>{vendor.totalWarranties}</TableCell>
                              <TableCell>{vendor.claimRate.toFixed(1)}%</TableCell>
                              <TableCell>{vendor.averageResolutionTime}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <StarIcon color="primary" sx={{ mr: 1 }} />
                                  {vendor.customerSatisfaction.toFixed(1)}/5.0
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
          )}
        </TabPanel>
      </Paper>

      <Dialog open={claimDialogOpen} onClose={() => setClaimDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit Warranty Claim</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Claim Number"
                value={newClaim.claimNumber}
                onChange={(e) => setNewClaim({ ...newClaim, claimNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Claim Type</InputLabel>
                <Select
                  value={newClaim.claimType}
                  onChange={(e) => setNewClaim({ ...newClaim, claimType: e.target.value as any })}
                >
                  <MenuItem value="DEFECT">Manufacturing Defect</MenuItem>
                  <MenuItem value="FAILURE">Premature Failure</MenuItem>
                  <MenuItem value="DAMAGE">Damage</MenuItem>
                  <MenuItem value="PERFORMANCE">Performance Issue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Issue Description"
                value={newClaim.issueDescription}
                onChange={(e) => setNewClaim({ ...newClaim, issueDescription: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitClaim} variant="contained">Submit Claim</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyRecallDashboard;