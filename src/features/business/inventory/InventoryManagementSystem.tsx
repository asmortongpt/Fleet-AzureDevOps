import {
  Inventory,
  ShoppingCart,
  LocalShipping,
  Warning,
  CheckCircle,
  Assessment,
  Add,
  Edit,
  Delete,
  Search,
  Download,
  QrCode,
  Store,
  AttachMoney,
  Build,
  ArrowUpward,
  ArrowDownward
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
  ListItemSecondaryAction,
  Divider,
  InputAdornment
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

import { useDatabase } from '../../hooks/useDatabase';

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

const InventoryManagementSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [parts, setParts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { getParts, getLowStockParts, getVendors } = useDatabase();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const partsData = getParts();
      const vendorsData = getVendors();

      // Enhance parts data with additional fields
      const enhancedParts = partsData.map(part => ({
        ...part,
        stockStatus: part.quantity <= part.minQuantity ? 'Low' :
                     part.quantity >= part.maxQuantity * 0.9 ? 'High' : 'Normal',
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageRate: Math.floor(Math.random() * 10 + 1),
        reorderPoint: part.minQuantity + 5,
        totalValue: part.quantity * part.unitCost
      }));
      setParts(enhancedParts);

      // Generate suppliers data
      const suppliersData = [
        {
          id: 'SUP-001',
          name: 'AutoParts Wholesale',
          category: 'General Parts',
          contactName: 'Mike Thompson',
          phone: '(555) 987-6543',
          email: 'mike@autopartswholesale.com',
          address: '1234 Industrial Blvd, Tampa, FL 33605',
          rating: 4.5,
          deliveryTime: '2-3 days',
          paymentTerms: 'Net 30',
          status: 'Active',
          totalOrders: 145,
          totalSpend: 125000,
          lastOrder: '2024-01-05'
        },
        {
          id: 'SUP-002',
          name: 'BrakeMax Inc',
          category: 'Brake Systems',
          contactName: 'Jennifer Lee',
          phone: '(555) 876-5432',
          email: 'jlee@brakemax.com',
          address: '5678 Service Road, St. Petersburg, FL 33701',
          rating: 4.8,
          deliveryTime: '1-2 days',
          paymentTerms: 'Net 15',
          status: 'Active',
          totalOrders: 89,
          totalSpend: 45000,
          lastOrder: '2024-01-10'
        },
        {
          id: 'SUP-003',
          name: 'TirePro Distribution',
          category: 'Tires',
          contactName: 'Robert Johnson',
          phone: '(555) 765-4321',
          email: 'rjohnson@tirepro.com',
          address: '9012 Tire Way, Clearwater, FL 33755',
          rating: 4.2,
          deliveryTime: '3-5 days',
          paymentTerms: 'Net 45',
          status: 'Active',
          totalOrders: 67,
          totalSpend: 85000,
          lastOrder: '2023-12-28'
        }
      ];
      setSuppliers(suppliersData);

      // Generate purchase orders
      const ordersData = [
        {
          id: 'PO-2024-001',
          date: '2024-01-15',
          supplier: 'AutoParts Wholesale',
          items: [
            { partNumber: 'OF-2234', name: 'Oil Filter', quantity: 50, unitPrice: 25, total: 1250 },
            { partNumber: 'AF-8901', name: 'Air Filter', quantity: 30, unitPrice: 35, total: 1050 }
          ],
          totalAmount: 2300,
          status: 'Pending',
          expectedDelivery: '2024-01-18',
          notes: 'Urgent - low stock'
        },
        {
          id: 'PO-2024-002',
          date: '2024-01-10',
          supplier: 'BrakeMax Inc',
          items: [
            { partNumber: 'BP-5567', name: 'Brake Pads Set', quantity: 20, unitPrice: 45, total: 900 }
          ],
          totalAmount: 900,
          status: 'Delivered',
          deliveredDate: '2024-01-12',
          invoiceNumber: 'INV-2024-0112'
        },
        {
          id: 'PO-2024-003',
          date: '2024-01-08',
          supplier: 'TirePro Distribution',
          items: [
            { partNumber: 'TR-225-65R17', name: '225/65R17 All-Season', quantity: 8, unitPrice: 125, total: 1000 }
          ],
          totalAmount: 1000,
          status: 'Shipped',
          trackingNumber: '1Z999AA1234567890',
          expectedDelivery: '2024-01-19'
        }
      ];
      setPurchaseOrders(ordersData);

      // Generate stock movements
      const movements = [
        {
          id: 'MOV-001',
          date: '2024-01-17',
          time: '10:30',
          type: 'Out',
          partNumber: 'OF-2234',
          partName: 'Oil Filter',
          quantity: 2,
          workOrder: 'WO-2024-001',
          technician: 'John Smith',
          location: 'Bay 1'
        },
        {
          id: 'MOV-002',
          date: '2024-01-17',
          time: '09:15',
          type: 'In',
          partNumber: 'BP-5567',
          partName: 'Brake Pads Set',
          quantity: 20,
          purchaseOrder: 'PO-2024-002',
          receivedBy: 'Warehouse Staff',
          location: 'Shelf B-08'
        },
        {
          id: 'MOV-003',
          date: '2024-01-16',
          time: '14:45',
          type: 'Out',
          partNumber: 'AF-8901',
          partName: 'Air Filter',
          quantity: 1,
          workOrder: 'WO-2024-003',
          technician: 'Maria Garcia',
          location: 'Bay 3'
        }
      ];
      setStockMovements(movements);

    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const totalParts = parts.length;
    const lowStockItems = parts.filter(p => p.stockStatus === 'Low').length;
    const totalValue = parts.reduce((sum, p) => sum + p.totalValue, 0);
    const pendingOrders = purchaseOrders.filter(po => po.status === 'Pending').length;
    const monthlyUsage = stockMovements.filter(m => m.type === 'Out').reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalParts,
      lowStockItems,
      totalValue: totalValue.toFixed(2),
      pendingOrders,
      monthlyUsage,
      turnoverRate: ((monthlyUsage * 12) / parts.reduce((sum, p) => sum + p.quantity, 0)).toFixed(1),
      fillRate: ((1 - lowStockItems / totalParts) * 100).toFixed(1)
    };
  };

  const getInventoryByCategory = () => {
    const categories: any = {};
    parts.forEach(part => {
      if (!categories[part.category]) {
        categories[part.category] = { count: 0, value: 0 };
      }
      categories[part.category].count += part.quantity;
      categories[part.category].value += part.totalValue;
    });

    return Object.entries(categories).map(([name, data]: any) => ({
      name,
      count: data.count,
      value: data.value
    }));
  };

  const getStockTrend = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        received: Math.floor(Math.random() * 50 + 10),
        used: Math.floor(Math.random() * 40 + 5)
      };
    });
    return last7Days;
  };

  const getTopUsedParts = () => {
    return parts
      .sort((a, b) => b.usageRate - a.usageRate)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        usage: p.usageRate * 30
      }));
  };

  const metrics = calculateMetrics();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleNewPart = () => {
    setSelectedItem({
      partNumber: '',
      name: '',
      category: '',
      manufacturer: '',
      quantity: 0,
      minQuantity: 5,
      maxQuantity: 50,
      unitCost: 0,
      location: '',
      supplier: '',
      compatibleVehicles: []
    });
    setDialogType('part');
    setDialogOpen(true);
  };

  const handleNewPurchaseOrder = () => {
    setSelectedItem({
      supplier: '',
      items: [],
      expectedDelivery: '',
      notes: ''
    });
    setDialogType('purchaseOrder');
    setDialogOpen(true);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Inventory />} label="Dashboard" />
          <Tab icon={<Build />} label="Parts Inventory" />
          <Tab icon={<ShoppingCart />} label="Purchase Orders" />
          <Tab icon={<Store />} label="Suppliers" />
          <Tab icon={<LocalShipping />} label="Stock Movement" />
          <Tab icon={<Assessment />} label="Analytics" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress />}

      <TabPanel value={tabValue} index={0}>
        {/* Dashboard */}
        <Grid container spacing={3}>
          {/* Metrics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Total Parts</Typography>
                    <Typography variant="h4">{metrics.totalParts}</Typography>
                    <Typography variant="body2" color="textSecondary">Active SKUs</Typography>
                  </Box>
                  <Inventory color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Low Stock Items</Typography>
                    <Typography variant="h4" color="error">{metrics.lowStockItems}</Typography>
                    <Typography variant="body2" color="error">Need reorder</Typography>
                  </Box>
                  <Warning color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Inventory Value</Typography>
                    <Typography variant="h4">${metrics.totalValue}</Typography>
                    <Typography variant="body2" color="success.main">+5.2% this month</Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Fill Rate</Typography>
                    <Typography variant="h4">{metrics.fillRate}%</Typography>
                    <Typography variant="body2" color="info.main">Service level</Typography>
                  </Box>
                  <CheckCircle color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Stock Movement Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Stock Movement Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getStockTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="received" stroke="#82ca9d" name="Received" />
                    <Line type="monotone" dataKey="used" stroke="#8884d8" name="Used" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory by Category */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Inventory by Category</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getInventoryByCategory()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getInventoryByCategory().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alert */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Low Stock Alert</Typography>
                  <Button variant="outlined" size="small">Create Bulk Order</Button>
                </Box>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Part Number</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Min</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parts
                        .filter(p => p.stockStatus === 'Low')
                        .map(part => (
                          <TableRow key={part.id}>
                            <TableCell>{part.partNumber}</TableCell>
                            <TableCell>{part.name}</TableCell>
                            <TableCell align="right">
                              <Typography color="error">{part.quantity}</Typography>
                            </TableCell>
                            <TableCell align="right">{part.minQuantity}</TableCell>
                            <TableCell>
                              <Button size="small" color="primary">Reorder</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Used Parts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Used Parts (30 Days)</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getTopUsedParts()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip />
                    <Bar dataKey="usage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                <List>
                  {stockMovements.slice(0, 5).map(movement => (
                    <React.Fragment key={movement.id}>
                      <ListItem>
                        <ListItemIcon>
                          {movement.type === 'In' ? (
                            <ArrowDownward color="success" />
                          ) : (
                            <ArrowUpward color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${movement.partName} - ${movement.quantity} units ${movement.type === 'In' ? 'received' : 'issued'}`}
                          secondary={`${movement.date} ${movement.time} - ${movement.type === 'In' ? movement.receivedBy : movement.technician}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            size="small"
                            label={movement.type === 'In' ? movement.purchaseOrder : movement.workOrder}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Parts Inventory */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">Parts Inventory Management</Typography>
                  <Box display="flex" gap={2}>
                    <TextField
                      size="small"
                      placeholder="Search parts..."
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
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        label="Category"
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        <MenuItem value="Filters">Filters</MenuItem>
                        <MenuItem value="Brakes">Brakes</MenuItem>
                        <MenuItem value="Engine">Engine</MenuItem>
                        <MenuItem value="Electrical">Electrical</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<QrCode />}>Scan Barcode</Button>
                    <Button variant="outlined" startIcon={<Download />}>Export</Button>
                    <Button variant="contained" startIcon={<Add />} onClick={handleNewPart}>
                      Add Part
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Part Number</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Unit Cost</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Last Used</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parts
                        .filter(p => filterCategory === 'all' || p.category === filterCategory)
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(part => (
                          <TableRow key={part.id}>
                            <TableCell>{part.partNumber}</TableCell>
                            <TableCell>{part.name}</TableCell>
                            <TableCell>
                              <Chip size="small" label={part.category} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography color={part.stockStatus === 'Low' ? 'error' : 'inherit'}>
                                {part.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={part.stockStatus}
                                color={
                                  part.stockStatus === 'Low' ? 'error' :
                                  part.stockStatus === 'High' ? 'warning' : 'success'
                                }
                              />
                            </TableCell>
                            <TableCell align="right">${part.unitCost}</TableCell>
                            <TableCell align="right">${part.totalValue.toFixed(2)}</TableCell>
                            <TableCell>{part.location}</TableCell>
                            <TableCell>{part.lastUsed}</TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                              <IconButton size="small">
                                <ShoppingCart />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={parts.length}
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
        {/* Purchase Orders */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">Purchase Orders</Typography>
                  <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Status</InputLabel>
                      <Select label="Status" defaultValue="all">
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="shipped">Shipped</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Add />} onClick={handleNewPurchaseOrder}>
                      New Order
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {purchaseOrders.map(order => (
                    <Grid item xs={12} md={6} key={order.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Box>
                              <Typography variant="h6">{order.id}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {order.supplier}
                              </Typography>
                            </Box>
                            <Chip
                              label={order.status}
                              size="small"
                              color={
                                order.status === 'Delivered' ? 'success' :
                                order.status === 'Shipped' ? 'info' :
                                order.status === 'Pending' ? 'warning' : 'default'
                              }
                            />
                          </Box>

                          <Box mb={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Order Details
                            </Typography>
                            {order.items.map((item: any, idx: number) => (
                              <Typography key={idx} variant="body2">
                                {item.name} - {item.quantity} units @ ${item.unitPrice}
                              </Typography>
                            ))}
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Order Date</Typography>
                              <Typography>{order.date}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                              <Typography variant="h6">${order.totalAmount}</Typography>
                            </Grid>
                          </Grid>

                          {order.status === 'Shipped' && order.trackingNumber && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              Tracking: {order.trackingNumber}
                            </Alert>
                          )}

                          {order.status === 'Pending' && (
                            <Box display="flex" gap={1} mt={2}>
                              <Button size="small" variant="contained" color="success">
                                Approve
                              </Button>
                              <Button size="small" variant="outlined">
                                Edit
                              </Button>
                              <Button size="small" variant="outlined" color="error">
                                Cancel
                              </Button>
                            </Box>
                          )}

                          {order.status === 'Delivered' && (
                            <Button size="small" variant="outlined" fullWidth sx={{ mt: 2 }}>
                              View Invoice
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Suppliers */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">Supplier Management</Typography>
                  <Button variant="contained" startIcon={<Add />}>
                    Add Supplier
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {suppliers.map(supplier => (
                    <Grid item xs={12} md={4} key={supplier.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Box>
                              <Typography variant="h6">{supplier.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {supplier.category}
                              </Typography>
                            </Box>
                            <Chip
                              label={supplier.status}
                              size="small"
                              color={supplier.status === 'Active' ? 'success' : 'default'}
                            />
                          </Box>

                          <Box mb={2}>
                            <Typography variant="body2" color="textSecondary">Contact</Typography>
                            <Typography variant="body2">{supplier.contactName}</Typography>
                            <Typography variant="body2">{supplier.phone}</Typography>
                            <Typography variant="body2">{supplier.email}</Typography>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Rating</Typography>
                              <Box display="flex" alignItems="center">
                                <Typography>{supplier.rating}</Typography>
                                <Typography variant="body2" color="textSecondary" ml={0.5}>/5</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Delivery</Typography>
                              <Typography variant="body2">{supplier.deliveryTime}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Terms</Typography>
                              <Typography variant="body2">{supplier.paymentTerms}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Total Spend</Typography>
                              <Typography variant="body2">${supplier.totalSpend.toLocaleString()}</Typography>
                            </Grid>
                          </Grid>

                          <Box display="flex" gap={1} mt={2}>
                            <Button size="small" variant="outlined" fullWidth>
                              View Details
                            </Button>
                            <Button size="small" variant="outlined" fullWidth>
                              New Order
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Stock Movement */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Stock Movement History</Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date/Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Part Number</TableCell>
                        <TableCell>Part Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Person</TableCell>
                        <TableCell>Location</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockMovements.map(movement => (
                        <TableRow key={movement.id}>
                          <TableCell>{`${movement.date} ${movement.time}`}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={movement.type}
                              color={movement.type === 'In' ? 'success' : 'primary'}
                              icon={movement.type === 'In' ? <ArrowDownward /> : <ArrowUpward />}
                            />
                          </TableCell>
                          <TableCell>{movement.partNumber}</TableCell>
                          <TableCell>{movement.partName}</TableCell>
                          <TableCell align="right">{movement.quantity}</TableCell>
                          <TableCell>
                            {movement.type === 'In' ? movement.purchaseOrder : movement.workOrder}
                          </TableCell>
                          <TableCell>
                            {movement.type === 'In' ? movement.receivedBy : movement.technician}
                          </TableCell>
                          <TableCell>{movement.location}</TableCell>
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
        {/* Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Inventory Analytics</Typography>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Turnover Rate by Category</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { category: 'Filters', rate: 8.5 },
                        { category: 'Brakes', rate: 6.2 },
                        { category: 'Engine', rate: 4.8 },
                        { category: 'Electrical', rate: 3.5 },
                        { category: 'Tires', rate: 2.1 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip />
                        <Bar dataKey="rate" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Stock Value Trend</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { month: 'Jan', value: 45000 },
                        { month: 'Feb', value: 47000 },
                        { month: 'Mar', value: 46000 },
                        { month: 'Apr', value: 49000 },
                        { month: 'May', value: 51000 },
                        { month: 'Jun', value: 52500 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="body2" color="textSecondary">Stock Accuracy</Typography>
                          <Typography variant="h4">98.5%</Typography>
                          <LinearProgress variant="determinate" value={98.5} color="success" />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="body2" color="textSecondary">Order Fill Rate</Typography>
                          <Typography variant="h4">94.2%</Typography>
                          <LinearProgress variant="determinate" value={94.2} color="primary" />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="body2" color="textSecondary">Carrying Cost</Typography>
                          <Typography variant="h4">12.5%</Typography>
                          <LinearProgress variant="determinate" value={12.5} color="warning" />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="body2" color="textSecondary">Dead Stock %</Typography>
                          <Typography variant="h4">2.8%</Typography>
                          <LinearProgress variant="determinate" value={2.8} color="error" />
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Part Dialog */}
      <Dialog open={dialogOpen && dialogType === 'part'} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItem?.id ? 'Edit Part' : 'Add New Part'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Part Number"
                value={selectedItem?.partNumber || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Part Name"
                value={selectedItem?.name || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={selectedItem?.category || ''} label="Category">
                  <MenuItem value="Filters">Filters</MenuItem>
                  <MenuItem value="Brakes">Brakes</MenuItem>
                  <MenuItem value="Engine">Engine</MenuItem>
                  <MenuItem value="Electrical">Electrical</MenuItem>
                  <MenuItem value="Tires">Tires</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={selectedItem?.manufacturer || ''}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={selectedItem?.quantity || ''}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Min Quantity"
                value={selectedItem?.minQuantity || ''}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Quantity"
                value={selectedItem?.maxQuantity || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Unit Cost"
                value={selectedItem?.unitCost || ''}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={selectedItem?.location || ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagementSystem;