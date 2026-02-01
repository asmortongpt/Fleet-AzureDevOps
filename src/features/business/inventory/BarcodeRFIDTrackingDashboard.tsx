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
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [currentAudit, setCurrentAudit] = useState<InventoryAudit | null>(null);

  // Refs for video scanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadInventoryData();
    loadRecentScans();
  }, []);

  const loadInventoryData = () => {
    // In a real implementation, this would fetch from API
    const sampleItems: InventoryItem[] = [
      {
        id: 'ITEM-001',
        partNumber: 'OF-2234',
        name: 'Oil Filter',
        category: 'Filters',
        barcode: '*OF-2234*',
        qrCode: JSON.stringify({ id: 'ITEM-001', type: 'CTAFleet_Inventory' }),
        rfidTag: 'RFID-001',
        location: {
          facility: 'Main Warehouse',
          building: 'A',
          room: '101',
          shelf: 'A-1-B',
          bin: '05'
        },
        status: 'in_stock',
        condition: 'new',
        unitCost: 25.99,
        currentValue: 25.99,
        lastScanned: new Date(),
        lastMoved: new Date(),
        scannedBy: 'system',
        checkoutHistory: [],
        maintenanceHistory: []
      },
      {
        id: 'ITEM-002',
        partNumber: 'BP-5567',
        name: 'Brake Pads Set',
        category: 'Brakes',
        barcode: '*BP-5567*',
        qrCode: JSON.stringify({ id: 'ITEM-002', type: 'CTAFleet_Inventory' }),
        rfidTag: 'RFID-002',
        location: {
          facility: 'Main Warehouse',
          building: 'A',
          room: '102',
          shelf: 'B-2-A',
          bin: '12'
        },
        status: 'checked_out',
        condition: 'good',
        unitCost: 45.99,
        currentValue: 43.99,
        lastScanned: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastMoved: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        scannedBy: 'john.smith',
        checkoutHistory: [{
          id: 'CHK-001',
          itemId: 'ITEM-002',
          checkedOutBy: 'john.smith',
          checkedOutTo: 'Vehicle FL-123',
          checkedOutDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          purpose: 'Brake maintenance',
          workOrderNumber: 'WO-2024-001',
          condition: {
            checkoutCondition: 'good'
          }
        }],
        maintenanceHistory: []
      },
      {
        id: 'ITEM-003',
        partNumber: 'TR-225-65R17',
        name: '225/65R17 All-Season Tire',
        category: 'Tires',
        barcode: '*TR-225-65R17*',
        qrCode: JSON.stringify({ id: 'ITEM-003', type: 'CTAFleet_Inventory' }),
        location: {
          facility: 'Service Bay',
          building: 'B',
          room: 'Bay 3',
          shelf: 'Floor',
          bin: 'N/A'
        },
        status: 'maintenance',
        condition: 'fair',
        unitCost: 125.99,
        currentValue: 100.79,
        lastScanned: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        lastMoved: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        scannedBy: 'maria.garcia',
        checkoutHistory: [],
        maintenanceHistory: [{
          id: 'MAINT-001',
          itemId: 'ITEM-003',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: 'inspection',
          description: 'Tire pressure and tread inspection',
          performedBy: 'maria.garcia',
          notes: 'Tread depth below minimum - requires replacement'
        }]
      }
    ];

    setInventoryItems(sampleItems);
  };

  const loadRecentScans = () => {
    const sampleScans: ScanEvent[] = [
      {
        id: 'SCAN-001',
        timestamp: new Date(),
        scanType: 'barcode',
        scannerId: 'SCANNER-001',
        scannerLocation: 'Main Warehouse',
        itemId: 'ITEM-001',
        scannedBy: 'john.smith',
        action: 'inventory',
        notes: 'Weekly inventory check'
      },
      {
        id: 'SCAN-002',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        scanType: 'rfid',
        scannerId: 'RFID-READER-001',
        scannerLocation: 'Service Bay',
        itemId: 'ITEM-002',
        scannedBy: 'maria.garcia',
        action: 'checkout',
        notes: 'Brake service job'
      }
    ];

    setRecentScans(sampleScans);
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
    if (!scannedCode) return;

    setLoading(true);
    try {
      const result = await barcodeRFIDTrackingService.scanBarcode(
        scannedCode,
        'SCANNER-001',
        'Main Warehouse',
        'inventory',
        'current_user'
      );

      if (result.success && result.item) {
        setSelectedItem(result.item);
        loadRecentScans(); // Refresh scan events
        alert(`Successfully scanned: ${result.item.name}`);
      } else {
        alert(result.message);
      }

      setScannedCode('');
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
        checkoutData.expectedReturnDate,
        checkoutData.workOrderNumber,
        checkoutData.notes
      );

      // Update local state
      const updatedItems = inventoryItems.map(i =>
        i.id === item.id ? { ...i, status: 'checked_out' as const } : i
      );
      setInventoryItems(updatedItems);

      setCheckoutDialogOpen(false);
      alert('Item checked out successfully');
    } catch (error) {
      console.error('Error checking out item:', error);
      alert('Error checking out item');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (item: InventoryItem) => {
    setLoading(true);
    try {
      await barcodeRFIDTrackingService.checkInItem(
        item.id,
        'good', // In real app, would get from user input
        'Returned in good condition'
      );

      // Update local state
      const updatedItems = inventoryItems.map(i =>
        i.id === item.id ? { ...i, status: 'in_stock' as const } : i
      );
      setInventoryItems(updatedItems);

      alert('Item checked in successfully');
    } catch (error) {
      console.error('Error checking in item:', error);
      alert('Error checking in item');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAudit = async () => {
    setLoading(true);
    try {
      const audit = await barcodeRFIDTrackingService.startInventoryAudit(
        'cycle',
        'Main Warehouse',
        ['john.smith', 'maria.garcia'],
        'supervisor'
      );

      setCurrentAudit(audit);
      setAuditDialogOpen(true);
    } catch (error) {
      console.error('Error starting audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRFIDSweep = async () => {
    setLoading(true);
    try {
      const result = await barcodeRFIDTrackingService.performRFIDSweep(
        'RFID-READER-001',
        'Main Warehouse',
        'current_user'
      );

      alert(`RFID Sweep Complete:
        Found: ${result.foundItems.length} items
        Missing: ${result.missingItems.length} items
        Duration: ${result.sweepDuration}ms`);
    } catch (error) {
      console.error('Error performing RFID sweep:', error);
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
    const totalValue = inventoryItems.reduce((sum, i) => sum + i.currentValue, 0);
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
      utilizationRate: ((checkedOut + maintenance) / total * 100).toFixed(1)
    };
  };

  const getScanActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        scans: Math.floor(Math.random() * 50 + 10)
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
                              label={item.condition}
                              color={getConditionColor(item.condition)}
                            />
                          </TableCell>
                          <TableCell>
                            {item.location.facility} - {item.location.shelf}
                          </TableCell>
                          <TableCell>
                            {item.lastScanned.toLocaleDateString()}
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
                                    onClick={() => handleCheckIn(item)}
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
                          <TableCell>{item.lastScanned.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge badgeContent={Math.floor(Math.random() * 100)} color="primary">
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
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Cycle Count - Main Warehouse"
                      secondary="Completed: 98.5% accuracy"
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption">
                        {new Date().toLocaleDateString()}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
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
                  <LinearProgress variant="determinate" value={98.5} sx={{ height: 8, mb: 1 }} />
                  <Typography variant="body2">98.5%</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Inventory Turnover</Typography>
                  <LinearProgress variant="determinate" value={75} color="success" sx={{ height: 8, mb: 1 }} />
                  <Typography variant="body2">6.2x annually</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Location Accuracy</Typography>
                  <LinearProgress variant="determinate" value={96} color="info" sx={{ height: 8, mb: 1 }} />
                  <Typography variant="body2">96.0%</Typography>
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
            label="Scan or Enter Code"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScanCode} disabled={!scannedCode}>
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
                <TextField fullWidth label="Checked Out To" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Work Order Number" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Purpose" multiline rows={2} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Check Out</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BarcodeRFIDTrackingDashboard;