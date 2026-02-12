/**
 * Barcode/RFID Tracking Dashboard
 * Advanced physical inventory management interface for CTAFleet
 */

import {
  QrCode2,
  QrCodeScanner,
  Nfc,
  Inventory,
  PersonAdd,
  PersonRemove,
  CheckCircle,
  Assignment,
  Timeline,
  Camera,
  Download,
  Visibility,
  Settings,
  RadioButtonChecked
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  barcodeRFIDTrackingService,
  InventoryItem,
  ScanEvent,
  InventoryAudit
} from '../../services/inventory/BarcodeRFIDTrackingService';
import { useAuth } from '@/contexts';
import { secureFetch } from '@/hooks/use-api';

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

const BarcodeRFIDTrackingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [currentAudit, setCurrentAudit] = useState<InventoryAudit | null>(null);
  const [scanScannerId, setScanScannerId] = useState('');
  const [scanLocation, setScanLocation] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({
    checkedOutTo: '',
    workOrderNumber: '',
    purpose: '',
    expectedReturnDate: '',
    notes: '',
    quantity: 1,
    condition: ''
  });
  const [checkinForm, setCheckinForm] = useState({
    condition: '',
    notes: '',
    quantity: 1
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();

  // Refs for video scanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadInventoryData();
    loadRecentScans();
  }, []);

  useEffect(() => {
    if (user?.id && !scanScannerId) {
      setScanScannerId(user.id);
    }
  }, [user, scanScannerId]);

  const mapInventoryItem = (item: any): InventoryItem => {
    const quantityOnHand = Number(item?.quantity_on_hand ?? item?.quantityOnHand ?? 0);
    const unitCost = Number(item?.unit_cost ?? item?.unitCost ?? 0);
    const currentValue = Number(item?.current_value ?? item?.total_value ?? unitCost * quantityOnHand);
    const location = {
      facility: item?.warehouse_location || item?.warehouseLocation || '',
      building: item?.building || '',
      room: item?.room || '',
      shelf: item?.shelf || '',
      bin: item?.bin_location || item?.binLocation || '',
    };

    return {
      id: item?.id,
      partNumber: item?.part_number || item?.partNumber || '',
      name: item?.name || '',
      category: item?.category || '',
      barcode: item?.sku || item?.part_number || item?.manufacturer_part_number || '',
      qrCode: item?.qr_code || item?.qrCode || '',
      rfidTag: item?.rfid_tag || item?.rfidTag,
      location,
      status: item?.status || (quantityOnHand > 0 ? 'in_stock' : 'reserved'),
      condition: item?.condition,
      unitCost,
      currentValue,
      lastScanned: item?.last_used ? new Date(item.last_used) : undefined,
      lastMoved: item?.updated_at ? new Date(item.updated_at) : undefined,
      scannedBy: item?.scannedBy,
      checkoutHistory: item?.checkout_history || item?.checkoutHistory,
      maintenanceHistory: item?.maintenance_history || item?.maintenanceHistory,
    };
  };

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const response = await secureFetch('/api/inventory/items');
      if (response.ok) {
        const data = await response.json();
        const rows = data.data || [];
        const mapped = Array.isArray(rows) ? rows.map(mapInventoryItem) : [];
        setInventoryItems(mapped);
      } else {
        setInventoryItems([]);
      }
    } catch (error) {
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentScans = async () => {
    try {
      const response = await secureFetch('/api/inventory/transactions?limit=20');
      if (response.ok) {
        const data = await response.json();
        const transactions = data.data || [];
        const mapped: ScanEvent[] = transactions.map((t: any) => ({
          id: t.id,
          timestamp: t.created_at ? new Date(t.created_at) : new Date(),
          scanType: 'barcode',
          scannerId: t.user_id || '',
          scannerLocation: t.warehouse_location || '',
          itemId: t.item_id,
          scannedBy: t.user_name || t.user_id || '',
          action:
            t.transaction_type === 'usage'
              ? 'checkout'
              : t.transaction_type === 'return'
                ? 'checkin'
                : 'inventory',
          notes: t.notes || t.reason,
        }));
        setRecentScans(mapped);
      } else {
        setRecentScans([]);
      }
    } catch (error) {
      setRecentScans([]);
    }
  };

  const handleGenerateBarcode = async (item: InventoryItem) => {
    setLoading(true);
    try {
      const result = await barcodeRFIDTrackingService.generateBarcode({
        itemId: item.id,
        partNumber: item.partNumber,
        format: 'QR',
        size: 'medium',
        includeText: true
      });

      // Update item with new QR code
      const updatedItems = inventoryItems.map(i =>
        i.id === item.id ? { ...i, qrCode: result.code } : i
      );
      setInventoryItems(updatedItems);

      // In real implementation, would open print dialog or download
      alert(`QR Code generated: ${result.code}`);
    } catch (error) {
      console.error('Error generating barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanCode = async () => {
    if (!scannedCode || !scanScannerId || !scanLocation) return;

    setLoading(true);
    try {
      const result = await barcodeRFIDTrackingService.scanBarcode(
        scannedCode,
        scanScannerId,
        scanLocation,
        'inventory',
        user?.id || scanScannerId
      );

      if (result.success && result.item) {
        setSelectedItem(result.item);
        loadRecentScans(); // Refresh scan events
        alert(`Successfully scanned: ${result.item.name}`);
      } else {
        alert(result.message);
      }

      setScannedCode('');
      setScanLocation('');
      setScanDialogOpen(false);
    } catch (error) {
      console.error('Error scanning code:', error);
      alert('Error scanning code');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (item: InventoryItem, checkoutData: any) => {
    setLoading(true);
    try {
      await barcodeRFIDTrackingService.checkOutItem(
        item.id,
        checkoutData.checkedOutTo,
        checkoutData.purpose,
        checkoutData.expectedReturnDate ? new Date(checkoutData.expectedReturnDate) : undefined,
        checkoutData.workOrderNumber,
        checkoutData.notes,
        Number(checkoutData.quantity) || 1,
        checkoutData.condition
      );

      // Update local state
      const updatedItems = inventoryItems.map(i =>
        i.id === item.id ? { ...i, status: 'checked_out' as const } : i
      );
      setInventoryItems(updatedItems);

      setCheckoutDialogOpen(false);
      setCheckoutForm({
        checkedOutTo: '',
        workOrderNumber: '',
        purpose: '',
        expectedReturnDate: '',
        notes: '',
        quantity: 1,
        condition: ''
      });
      loadInventoryData();
      loadRecentScans();
      alert('Item checked out successfully');
    } catch (error) {
      console.error('Error checking out item:', error);
      alert('Error checking out item');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (item: InventoryItem, checkInData: any) => {
    setLoading(true);
    try {
      await barcodeRFIDTrackingService.checkInItem(
        item.id,
        checkInData.condition,
        checkInData.notes,
        Number(checkInData.quantity) || 1
      );

      // Update local state
      const updatedItems = inventoryItems.map(i =>
        i.id === item.id ? { ...i, status: 'in_stock' as const } : i
      );
      setInventoryItems(updatedItems);

      alert('Item checked in successfully');
      setCheckinDialogOpen(false);
      setCheckinForm({
        condition: '',
        notes: '',
        quantity: 1
      });
      loadInventoryData();
      loadRecentScans();
    } catch (error) {
      console.error('Error checking in item:', error);
      alert('Error checking in item');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAudit = async () => {
    if (!scanLocation) {
      setErrorMessage('Set a scan location before starting an audit.');
      return;
    }
    setLoading(true);
    try {
      const audit = await barcodeRFIDTrackingService.startInventoryAudit(
        'cycle',
        scanLocation,
        [],
        (user as any)?.name || user?.email || 'Supervisor'
      );

      setCurrentAudit(audit);
      setAuditDialogOpen(true);
    } catch (error) {
      console.error('Error starting audit:', error);
      setErrorMessage('Inventory audit creation is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleRFIDSweep = async () => {
    if (!scanLocation) {
      setErrorMessage('Set a scan location before performing an RFID sweep.');
      return;
    }
    setLoading(true);
    try {
      const result = await barcodeRFIDTrackingService.performRFIDSweep(
        scanScannerId || user?.id || '',
        scanLocation,
        user?.id || ''
      );

      alert(`RFID Sweep Complete:
        Found: ${result.foundItems.length} items
        Missing: ${result.missingItems.length} items
        Duration: ${result.sweepDuration}ms`);
    } catch (error) {
      console.error('Error performing RFID sweep:', error);
      setErrorMessage('RFID sweep is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'checked_out': return 'warning';
      case 'maintenance': return 'error';
      case 'reserved': return 'info';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      case 'defective': return 'error';
      default: return 'default';
    }
  };

  const calculateMetrics = () => {
    const total = inventoryItems.length;
    const available = inventoryItems.filter(i => i.status === 'in_stock').length;
    const checkedOut = inventoryItems.filter(i => i.status === 'checked_out').length;
    const maintenance = inventoryItems.filter(i => i.status === 'maintenance').length;
    const totalValue = inventoryItems.reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);
    const scansToday = recentScans.filter(s =>
      s.timestamp.toDateString() === new Date().toDateString()
    ).length;

    return {
      total,
      available,
      checkedOut,
      maintenance,
      totalValue,
      scansToday,
      utilizationRate: total > 0 ? ((checkedOut + maintenance) / total * 100).toFixed(1) : '0.0'
    };
  };

  const getScanActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toDateString();
      const count = recentScans.filter(s =>
        new Date(s.timestamp).toDateString() === dateStr
      ).length;
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        scans: count
      };
    });
    return last7Days;
  };

  const getLocationDistribution = () => {
    const locations = inventoryItems.reduce((acc, item) => {
      const location = item.location.facility;
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locations).map(([name, value]) => ({ name, value }));
  };

  const metrics = calculateMetrics();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const scanAccuracy = recentScans.length > 0
    ? Math.round((recentScans.filter(s => Boolean(s.itemId)).length / recentScans.length) * 100)
    : 0;
  const locationAccuracy = inventoryItems.length > 0
    ? Math.round((inventoryItems.filter(i => i.location?.facility).length / inventoryItems.length) * 100)
    : 0;
  const turnoverRate = metrics.total > 0
    ? (recentScans.length / metrics.total).toFixed(1)
    : '0.0';

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<QrCodeScanner />} label="Scanner" />
          <Tab icon={<Inventory />} label="Inventory Tracking" />
          <Tab icon={<Nfc />} label="RFID Management" />
          <Tab icon={<Assignment />} label="Audit & Reports" />
          <Tab icon={<Timeline />} label="Analytics" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress />}
      {errorMessage && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {/* Scanner Interface */}
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Barcode & QR Code Scanner
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Camera />}
                      onClick={scannerActive ? stopCamera : startCamera}
                      color={scannerActive ? 'error' : 'primary'}
                    >
                      {scannerActive ? 'Stop Camera' : 'Start Camera'}
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<QrCode2 />}
                      onClick={() => setScanDialogOpen(true)}
                    >
                      Manual Entry
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Nfc />}
                      onClick={handleRFIDSweep}
                    >
                      RFID Sweep
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Assignment />}
                      onClick={handleStartAudit}
                    >
                      Start Audit
                    </Button>
                  </Grid>
                </Grid>

                {/* Camera Preview */}
                {scannerActive && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', maxWidth: 400 }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: '100%',
                          height: 'auto',
                          border: '2px solid #1976d2',
                          borderRadius: 8
                        }}
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60%',
                          height: '40%',
                          border: '2px solid red',
                          borderRadius: 1,
                          pointerEvents: 'none'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Scans */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Scan Activity</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>User</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentScans.slice(0, 10).map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell>{scan.timestamp.toLocaleTimeString()}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={scan.scanType}
                              icon={scan.scanType === 'rfid' ? <Nfc /> : <QrCode2 />}
                            />
                          </TableCell>
                          <TableCell>{scan.itemId}</TableCell>
                          <TableCell>
                            <Chip size="small" label={scan.action} />
                          </TableCell>
                          <TableCell>{scan.scannerLocation}</TableCell>
                          <TableCell>{scan.scannedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Today's Activity</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Scans Performed</Typography>
                      <Typography variant="h5">{metrics.scansToday}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Items Tracked</Typography>
                      <Typography variant="h5">{metrics.total}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Utilization Rate</Typography>
                      <Typography variant="h5">{metrics.utilizationRate}%</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Inventory Tracking */}
        <Grid container spacing={3}>
          {/* Status Overview */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Available Items</Typography>
                <Typography variant="h3" color="success.main">{metrics.available}</Typography>
                <Typography variant="body2" color="text.secondary">Ready for use</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Checked Out</Typography>
                <Typography variant="h3" color="warning.main">{metrics.checkedOut}</Typography>
                <Typography variant="body2" color="text.secondary">In field use</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Maintenance</Typography>
                <Typography variant="h3" color="error.main">{metrics.maintenance}</Typography>
                <Typography variant="body2" color="text.secondary">Being serviced</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Value</Typography>
                <Typography variant="h3" color="info.main">${metrics.totalValue.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">Current inventory</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory Table */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory Items</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Part Number</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Condition</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Last Scanned</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.partNumber}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Chip size="small" label={item.category} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={item.status.replace('_', ' ')}
                              color={getStatusColor(item.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={item.condition || 'Unknown'}
                              color={getConditionColor(item.condition || 'unknown')}
                            />
                          </TableCell>
                          <TableCell>
                            {item.location?.facility || item.location?.shelf
                              ? `${item.location?.facility || ''} ${item.location?.shelf ? `- ${item.location.shelf}` : ''}`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {item.lastScanned ? new Date(item.lastScanned).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Generate QR Code">
                                <IconButton
                                  size="small"
                                  onClick={() => handleGenerateBarcode(item)}
                                >
                                  <QrCode2 />
                                </IconButton>
                              </Tooltip>

                              {item.status === 'in_stock' ? (
                                <Tooltip title="Check Out">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setCheckoutDialogOpen(true);
                                    }}
                                  >
                                    <PersonRemove />
                                  </IconButton>
                                </Tooltip>
                              ) : item.status === 'checked_out' ? (
                                <Tooltip title="Check In">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setCheckinDialogOpen(true);
                                    }}
                                  >
                                    <PersonAdd />
                                  </IconButton>
                                </Tooltip>
                              ) : null}

                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* RFID Management */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Nfc sx={{ mr: 1, verticalAlign: 'middle' }} />
                  RFID Tag Management
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  RFID functionality requires compatible hardware. Configure RFID readers in system settings.
                </Alert>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Nfc />}
                      onClick={handleRFIDSweep}
                    >
                      Perform RFID Sweep
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Settings />}
                    >
                      Configure Readers
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Download />}
                    >
                      Export RFID Data
                    </Button>
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>RFID-Enabled Items</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>RFID Tag ID</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Last Read</TableCell>
                        <TableCell>Read Count</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.filter(item => item.rfidTag).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.rfidTag}</TableCell>
                          <TableCell>860-960MHz</TableCell>
                          <TableCell>{item.lastScanned?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge badgeContent={0} color="primary">
                              <RadioButtonChecked />
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label="Active"
                              color="success"
                              icon={<CheckCircle />}
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

      <TabPanel value={tabValue} index={3}>
        {/* Audit & Reports */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory Audit</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Perform systematic inventory audits using barcode and RFID technology
                </Typography>

                <TextField
                  fullWidth
                  label="Audit Location"
                  value={scanLocation}
                  onChange={(e) => setScanLocation(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={handleStartAudit}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Start New Audit
                </Button>

                <Typography variant="subtitle2" gutterBottom>Recent Audits</Typography>
                {currentAudit ? (
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${currentAudit.type.toUpperCase()} Audit - ${currentAudit.location}`}
                        secondary={`Status: ${currentAudit.status} | Expected: ${currentAudit.expectedCount}`}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="caption">
                          {new Date(currentAudit.startDate).toLocaleDateString()}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No audits available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Location Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getLocationDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getLocationDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Analytics */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Scan Activity Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getScanActivityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="scans" stroke="#8884d8" name="Daily Scans" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Scan Accuracy</Typography>
                  <LinearProgress variant="determinate" value={scanAccuracy} sx={{ height: 8, mb: 1 }} />
                  <Typography variant="body2">{scanAccuracy}%</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Inventory Turnover</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Number(turnoverRate) * 10)}
                    color="success"
                    sx={{ height: 8, mb: 1 }}
                  />
                  <Typography variant="body2">{turnoverRate}x period</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Location Accuracy</Typography>
                  <LinearProgress variant="determinate" value={locationAccuracy} color="info" sx={{ height: 8, mb: 1 }} />
                  <Typography variant="body2">{locationAccuracy}%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Scan Dialog */}
      <Dialog open={scanDialogOpen} onClose={() => setScanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Barcode Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Scanner ID"
            value={scanScannerId}
            onChange={(e) => setScanScannerId(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Scan Location"
            value={scanLocation}
            onChange={(e) => setScanLocation(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Scan or Enter Code"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleScanCode}
            disabled={!scannedCode || !scanScannerId || !scanLocation}
          >
            Process Scan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Check Out Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6">{selectedItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedItem.partNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Checked Out To"
                  value={checkoutForm.checkedOutTo}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, checkedOutTo: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Work Order Number"
                  value={checkoutForm.workOrderNumber}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, workOrderNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Condition"
                  value={checkoutForm.condition}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, condition: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={checkoutForm.quantity}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, quantity: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Expected Return Date"
                  type="date"
                  value={checkoutForm.expectedReturnDate}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, expectedReturnDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Purpose"
                  multiline
                  rows={2}
                  value={checkoutForm.purpose}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, purpose: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedItem && handleCheckOut(selectedItem, checkoutForm)}
            disabled={!checkoutForm.checkedOutTo || !checkoutForm.purpose}
          >
            Check Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkinDialogOpen} onClose={() => setCheckinDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Check In Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6">{selectedItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedItem.partNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Condition"
                  value={checkinForm.condition}
                  onChange={(e) => setCheckinForm({ ...checkinForm, condition: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={checkinForm.quantity}
                  onChange={(e) => setCheckinForm({ ...checkinForm, quantity: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={checkinForm.notes}
                  onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckinDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedItem && handleCheckIn(selectedItem, checkinForm)}
            disabled={!checkinForm.condition}
          >
            Check In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BarcodeRFIDTrackingDashboard;
