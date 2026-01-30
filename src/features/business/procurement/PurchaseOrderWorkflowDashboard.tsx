import {
  Approval as ApprovalIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  Comment as CommentIcon,
  Delegate as DelegateIcon,
  AccessTime as AccessTimeIcon,
  TrendUp as TrendUpIcon
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  LinearProgress,
  Fab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { format, parseISO, differenceInHours } from 'date-fns';
import React, { useState, useEffect } from 'react';

import logger from '@/utils/logger';
import PurchaseOrderWorkflowService, {
  PurchaseOrder,
  POStatus,
  ApprovalStep,
  WorkflowAnalytics
} from '../../services/procurement/PurchaseOrderWorkflowService';

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
      id={`po-tabpanel-${index}`}
      aria-labelledby={`po-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PurchaseOrderWorkflowDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PurchaseOrder[]>([]);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [delegationDialogOpen, setDelegationDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'delegate'>('approve');
  const [actionComments, setActionComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [delegateToUser, setDelegateToUser] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState('user004'); // Mock current user

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      await PurchaseOrderWorkflowService.initializeData();

      const [allPOs, pendingPOs, analyticsData] = await Promise.all([
        PurchaseOrderWorkflowService.getPurchaseOrdersByStatus('PENDING_APPROVAL'),
        PurchaseOrderWorkflowService.getPendingApprovals(currentUserId),
        PurchaseOrderWorkflowService.getWorkflowAnalytics()
      ]);

      setPurchaseOrders(allPOs);
      setPendingApprovals(pendingPOs);
      setAnalytics(analyticsData);
    } catch (error) {
      logger.error('Error initializing purchase order data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'info';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'ON_HOLD': return 'secondary';
      case 'CANCELLED': return 'error';
      case 'ISSUED': return 'primary';
      case 'RECEIVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'DELEGATED': return 'info';
      case 'SKIPPED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  const handleApproval = async () => {
    if (!selectedPO) return;

    try {
      await PurchaseOrderWorkflowService.approvePurchaseOrder(
        selectedPO.id,
        currentUserId,
        actionComments
      );
      setApprovalDialogOpen(false);
      setActionComments('');
      await initializeData();
    } catch (error) {
      logger.error('Error approving purchase order:', error);
    }
  };

  const handleRejection = async () => {
    if (!selectedPO) return;

    try {
      await PurchaseOrderWorkflowService.rejectPurchaseOrder(
        selectedPO.id,
        currentUserId,
        rejectionReason
      );
      setRejectionDialogOpen(false);
      setRejectionReason('');
      await initializeData();
    } catch (error) {
      logger.error('Error rejecting purchase order:', error);
    }
  };

  const handleDelegation = async () => {
    if (!selectedPO || !delegateToUser) return;

    try {
      await PurchaseOrderWorkflowService.delegateApproval(
        selectedPO.id,
        currentUserId,
        delegateToUser,
        'Delegated User'
      );
      setDelegationDialogOpen(false);
      setDelegateToUser('');
      await initializeData();
    } catch (error) {
      logger.error('Error delegating approval:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPO || !newComment.trim()) return;

    try {
      await PurchaseOrderWorkflowService.addComment(
        selectedPO.id,
        currentUserId,
        'Current User',
        newComment.trim()
      );
      setCommentDialogOpen(false);
      setNewComment('');
      await initializeData();
      const updatedPO = await PurchaseOrderWorkflowService.getPurchaseOrder(selectedPO.id);
      if (updatedPO) setSelectedPO(updatedPO);
    } catch (error) {
      logger.error('Error adding comment:', error);
    }
  };

  const openApprovalDialog = (po: PurchaseOrder, action: 'approve' | 'reject' | 'delegate') => {
    setSelectedPO(po);
    setApprovalAction(action);

    switch (action) {
      case 'approve':
        setApprovalDialogOpen(true);
        break;
      case 'reject':
        setRejectionDialogOpen(true);
        break;
      case 'delegate':
        setDelegationDialogOpen(true);
        break;
    }
  };

  const getCurrentApprovalStep = (po: PurchaseOrder): ApprovalStep | null => {
    return po.approvalChain.find(step =>
      step.stepNumber === po.workflow.currentStep && step.status === 'PENDING'
    ) || null;
  };

  const isCurrentUserApprover = (po: PurchaseOrder): boolean => {
    const currentStep = getCurrentApprovalStep(po);
    return currentStep?.approverId === currentUserId;
  };

  const calculateSLAProgress = (po: PurchaseOrder): number => {
    if (!po.workflow.slaDeadline) return 0;

    const now = new Date();
    const deadline = parseISO(po.workflow.slaDeadline);
    const created = parseISO(po.createdDate);

    const totalTime = differenceInHours(deadline, created);
    const elapsed = differenceInHours(now, created);

    return Math.min((elapsed / totalTime) * 100, 100);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Purchase Order Workflow</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Purchase Order Workflow
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Badge badgeContent={pendingApprovals.length} color="error">
            <Fab color="primary" size="medium">
              <ApprovalIcon />
            </Fab>
          </Badge>
          <Fab color="secondary" size="medium">
            <AssessmentIcon />
          </Fab>
        </Box>
      </Box>

      {analytics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total POs</Typography>
                </Box>
                <Typography variant="h4">{analytics.totalPOs}</Typography>
                <Typography variant="body2" color="text: secondary">
                  {pendingApprovals.length} pending approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg Approval Time</Typography>
                </Box>
                <Typography variant="h4">{analytics.averageApprovalTime.toFixed(1)} days</Typography>
                <Typography variant="body2" color="text: secondary">
                  {analytics.complianceMetrics.slaCompliance.toFixed(1)}% SLA compliance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Budget Compliance</Typography>
                </Box>
                <Typography variant="h4">{analytics.complianceMetrics.budgetCompliance.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text: secondary">
                  Procurement compliance: {analytics.complianceMetrics.procurementCompliance.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendUpIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Bottlenecks</Typography>
                </Box>
                <Typography variant="h4">{analytics.bottlenecks.length}</Typography>
                <Typography variant="body2" color="text: secondary">
                  {analytics.bottlenecks.reduce((sum, b) => sum + b.backlogCount, 0)} items in backlog
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="purchase order tabs">
          <Tab label="My Approvals" />
          <Tab label="All Purchase Orders" />
          <Tab label="Workflow Analytics" />
          <Tab label="Approval Matrix" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Pending Approvals</Typography>
            <Typography variant="body2" color="text: secondary">
              Purchase orders awaiting your approval
            </Typography>
          </Box>

          {pendingApprovals.length === 0 ? (
            <Alert severity="info">No purchase orders pending your approval.</Alert>
          ) : (
            <Grid container spacing={3}>
              {pendingApprovals.map((po) => {
                const currentStep = getCurrentApprovalStep(po);
                const slaProgress = calculateSLAProgress(po);

                return (
                  <Grid item xs={12} key={po.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6">{po.title}</Typography>
                            <Typography variant="body2" color="text: secondary">
                              {po.poNumber} • Requested by {po.requesterName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                label={po.priority}
                                size="small"
                                color={getPriorityColor(po.priority)}
                              />
                              <Chip
                                label={`$${po.totalAmount.toLocaleString()}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={po.department}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" color="primary">
                              ${po.totalAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text: secondary">
                              Due: {format(parseISO(po.requestedDeliveryDate), 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text: secondary" gutterBottom>
                            SLA Progress
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={slaProgress}
                            color={slaProgress > 80 ? 'error' : slaProgress > 60 ? 'warning' : 'primary'}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text: secondary">
                            {slaProgress.toFixed(1)}% of SLA time elapsed
                          </Typography>
                        </Box>

                        {currentStep && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Your Action Required:</strong> {currentStep.approverRole} approval for step {currentStep.stepNumber}
                          </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            onClick={() => setSelectedPO(po)}
                            size="small"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => openApprovalDialog(po, 'approve')}
                            size="small"
                            startIcon={<CheckCircleIcon />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => openApprovalDialog(po, 'reject')}
                            size="small"
                            startIcon={<CancelIcon />}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => openApprovalDialog(po, 'delegate')}
                            size="small"
                            startIcon={<DelegateIcon />}
                          >
                            Delegate
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>All Purchase Orders</Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PO Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Requester</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Step</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>{po.poNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {po.title}
                      </Typography>
                      <Typography variant="caption" color="text: secondary">
                        {po.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{po.requesterName}</Typography>
                        <Typography variant="caption" color="text: secondary">
                          {po.department}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ${po.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={po.priority}
                        size="small"
                        color={getPriorityColor(po.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={po.status}
                        size="small"
                        color={getStatusColor(po.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {po.workflow.currentStep} / {po.workflow.totalSteps}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(po.workflow.currentStep / po.workflow.totalSteps) * 100}
                        sx={{ width: 60, height: 4 }}
                      />
                    </TableCell>
                    <TableCell>
                      {format(parseISO(po.createdDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => setSelectedPO(po)}
                      >
                        View
                      </Button>
                      {isCurrentUserApprover(po) && (
                        <Button
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                          onClick={() => openApprovalDialog(po, 'approve')}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Workflow Analytics</Typography>

          {analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Approval Rate by Step</Typography>
                    {analytics.approvalRateByStep.map((step, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{step.step}</Typography>
                          <Typography variant="body2">{step.rate.toFixed(1)}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={step.rate}
                          sx={{ height: 6, borderRadius: 3 }}
                          color={step.rate >= 90 ? 'success' : step.rate >= 80 ? 'warning' : 'error'}
                        />
                        <Typography variant="caption" color="text: secondary">
                          {step.approved} approved, {step.rejected} rejected
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Workflow Bottlenecks</Typography>
                    {analytics.bottlenecks.map((bottleneck, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{bottleneck.step}</Typography>
                          <Chip
                            label={`${bottleneck.backlogCount} items`}
                            size="small"
                            color="warning"
                          />
                        </Box>
                        <Typography variant="caption" color="text: secondary">
                          Average wait time: {bottleneck.averageWaitTime.toFixed(1)} days
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Budget Utilization by Department</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Department</TableCell>
                            <TableCell>Budget Allocated</TableCell>
                            <TableCell>Budget Used</TableCell>
                            <TableCell>Utilization Rate</TableCell>
                            <TableCell>Remaining</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.budgetUtilization.map((dept, index) => (
                            <TableRow key={index}>
                              <TableCell>{dept.department}</TableCell>
                              <TableCell>${dept.budgetAllocated.toLocaleString()}</TableCell>
                              <TableCell>${dept.budgetUsed.toLocaleString()}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={dept.utilizationRate}
                                    sx={{ width: 100, mr: 1 }}
                                    color={dept.utilizationRate > 90 ? 'error' : dept.utilizationRate > 75 ? 'warning' : 'primary'}
                                  />
                                  <Typography variant="body2">
                                    {dept.utilizationRate.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                ${(dept.budgetAllocated - dept.budgetUsed).toLocaleString()}
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

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Approval Matrix Configuration</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Approval workflows are automatically determined based on purchase order amount, department, and priority.
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Standard Procurement Matrix</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount Range</TableCell>
                      <TableCell>Required Approvers</TableCell>
                      <TableCell>SLA (Hours)</TableCell>
                      <TableCell>Auto-Approval Threshold</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>$0 - $1,000</TableCell>
                      <TableCell>Department Supervisor</TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>$500</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>$1,001 - $10,000</TableCell>
                      <TableCell>Department Supervisor → Budget Manager</TableCell>
                      <TableCell>72</TableCell>
                      <TableCell>None</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>$10,001 - $50,000</TableCell>
                      <TableCell>Department Supervisor → Budget Manager → Procurement Manager</TableCell>
                      <TableCell>120</TableCell>
                      <TableCell>None</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>$50,001+</TableCell>
                      <TableCell>Full Approval Chain + CFO</TableCell>
                      <TableCell>168</TableCell>
                      <TableCell>None</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Purchase Order Details Dialog */}
      <Dialog open={!!selectedPO} onClose={() => setSelectedPO(null)} maxWidth="lg" fullWidth>
        {selectedPO && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedPO.title}</Typography>
                <Chip
                  label={selectedPO.status}
                  color={getStatusColor(selectedPO.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>Purchase Order Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text: secondary">PO Number</Typography>
                      <Typography variant="body1">{selectedPO.poNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text: secondary">Total Amount</Typography>
                      <Typography variant="h6" color="primary">
                        ${selectedPO.totalAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text: secondary">Requester</Typography>
                      <Typography variant="body1">
                        {selectedPO.requesterName} ({selectedPO.department})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text: secondary">Delivery Date</Typography>
                      <Typography variant="body1">
                        {format(parseISO(selectedPO.requestedDeliveryDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Line Items</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPO.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.partNumber}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>${item.totalPrice.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Comments</Typography>
                  {selectedPO.comments.length === 0 ? (
                    <Typography variant="body2" color="text: secondary">No comments yet</Typography>
                  ) : (
                    <List>
                      {selectedPO.comments.map((comment) => (
                        <ListItem key={comment.id} alignItems="flex-start">
                          <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {comment.userName.charAt(0)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={comment.userName}
                            secondary={
                              <>
                                <Typography variant="body2">{comment.comment}</Typography>
                                <Typography variant="caption" color="text: secondary">
                                  {format(parseISO(comment.timestamp), 'MMM dd, yyyy HH:mm')}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
                  <Stepper
                    activeStep={selectedPO.workflow.currentStep - 1}
                    orientation="vertical"
                  >
                    {selectedPO.approvalChain.map((step) => (
                      <Step key={step.id}>
                        <StepLabel
                          StepIconComponent={() => (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: getApprovalStatusColor(step.status) + '.main',
                                color: 'white'
                              }}
                            >
                              {step.status === 'APPROVED' && <CheckCircleIcon fontSize="small" />}
                              {step.status === 'REJECTED' && <CancelIcon fontSize="small" />}
                              {step.status === 'PENDING' && <PendingIcon fontSize="small" />}
                              {step.status === 'DELEGATED' && <DelegateIcon fontSize="small" />}
                            </Box>
                          )}
                        >
                          <Typography variant="body2">{step.approverRole}</Typography>
                          <Typography variant="caption" color="text: secondary">
                            {step.approverName}
                          </Typography>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text: secondary">
                            Status: {step.status}
                          </Typography>
                          {step.approvalDate && (
                            <Typography variant="caption">
                              {format(parseISO(step.approvalDate), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          )}
                          {step.comments && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {step.comments}
                            </Typography>
                          )}
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CommentIcon />}
                      onClick={() => setCommentDialogOpen(true)}
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPO(null)}>Close</Button>
              {isCurrentUserApprover(selectedPO) && (
                <>
                  <Button
                    color="success"
                    variant="contained"
                    onClick={() => openApprovalDialog(selectedPO, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    onClick={() => openApprovalDialog(selectedPO, 'reject')}
                  >
                    Reject
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>Approve Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (Optional)"
            value={actionComments}
            onChange={(e) => setActionComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApproval} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)}>
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejection} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delegation Dialog */}
      <Dialog open={delegationDialogOpen} onClose={() => setDelegationDialogOpen(false)}>
        <DialogTitle>Delegate Approval</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Delegate To</InputLabel>
            <Select
              value={delegateToUser}
              onChange={(e) => setDelegateToUser(e.target.value)}
            >
              <MenuItem value="user005">Jennifer Smith (Finance Director)</MenuItem>
              <MenuItem value="user006">Robert Taylor (CFO)</MenuItem>
              <MenuItem value="user007">Mary Johnson (Dept Manager)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelegation} variant="contained">
            Delegate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderWorkflowDashboard;