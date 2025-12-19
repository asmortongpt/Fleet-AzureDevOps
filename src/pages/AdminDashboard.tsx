import { Dashboard, Security, Settings, People, Analytics, ArrowBack } from '@mui/icons-material';
import { Container, Box, Typography, Alert, Button, Tabs, Tab, Paper, IconButton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MonitoringDashboard from '../components/admin/MonitoringDashboard';
import { useAuth } from '../hooks/useAuth';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user has admin access
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check for admin role
    // In a real app, this would come from the auth context or API
    const userRole = user?.role || localStorage.getItem('userRole');
    const isAdmin = userRole === 'Admin' || userRole === 'Administrator' || userRole === 'SuperAdmin';

    setHasAccess(isAdmin);
    setLoading(false);

    if (!isAdmin) {
      // Redirect non-admin users after showing message
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isAuthenticated, user, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!hasAccess) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">
            <Typography variant="h6">Access Denied</Typography>
            <Typography>
              You do not have permission to access the Admin Dashboard.
              Redirecting to home page...
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handleBack} edge="start">
              <ArrowBack />
            </IconButton>
            <Dashboard fontSize="large" color="primary" />
            <Box>
              <Typography variant="h4">Admin Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                System Administration & Monitoring
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Logged in as: {user?.email || 'Admin'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => navigate('/settings')}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Analytics />}
            iconPosition="start"
            label="System Monitoring"
            {...a11yProps(0)}
          />
          <Tab
            icon={<People />}
            iconPosition="start"
            label="User Management"
            {...a11yProps(1)}
            disabled // Will be implemented in future
          />
          <Tab
            icon={<Security />}
            iconPosition="start"
            label="Security & Compliance"
            {...a11yProps(2)}
            disabled // Will be implemented in future
          />
          <Tab
            icon={<Settings />}
            iconPosition="start"
            label="System Configuration"
            {...a11yProps(3)}
            disabled // Will be implemented in future
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        <MonitoringDashboard />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            User Management
          </Typography>
          <Typography color="text.secondary">
            User management features will be available in the next release.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Planned features:
            </Typography>
            <ul>
              <li>View and manage user accounts</li>
              <li>Role-based access control (RBAC)</li>
              <li>User activity logs</li>
              <li>Session management</li>
              <li>Password policies</li>
            </ul>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Security & Compliance
          </Typography>
          <Typography color="text.secondary">
            Security and compliance features will be available in the next release.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Planned features:
            </Typography>
            <ul>
              <li>Security audit logs</li>
              <li>Compliance reporting</li>
              <li>Data encryption settings</li>
              <li>API key management</li>
              <li>IP whitelisting</li>
            </ul>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            System Configuration
          </Typography>
          <Typography color="text.secondary">
            System configuration features will be available in the next release.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Planned features:
            </Typography>
            <ul>
              <li>Environment variables management</li>
              <li>Database configuration</li>
              <li>Email settings</li>
              <li>Integration configurations</li>
              <li>Backup and restore</li>
            </ul>
          </Box>
        </Paper>
      </TabPanel>

      {/* Quick Stats Footer */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Box display="flex" justifyContent="space-around" alignItems="center">
          <Box textAlign="center">
            <Typography variant="h6" color="primary">
              {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current Date
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="success.main">
              Active
            </Typography>
            <Typography variant="caption" color="text.secondary">
              System Status
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">
              v1.0.0
            </Typography>
            <Typography variant="caption" color="text.secondary">
              System Version
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">
              {process.env.NODE_ENV || 'production'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Environment
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;