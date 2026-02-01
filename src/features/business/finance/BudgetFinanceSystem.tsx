import {
  AccountBalance,
  Assessment,
  Receipt,
  Timeline,
  ShowChart
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
  LinearProgress
} from '@mui/material';
import React, { useState } from 'react';
import { LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const BudgetFinanceSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const monthlyBudget = {
    total: 250000,
    allocated: 215000,
    spent: 178500,
    remaining: 71500
  };

  const expenseCategories = [
    { category: 'Fuel', budget: 45000, spent: 38500, variance: -6500 },
    { category: 'Maintenance', budget: 60000, spent: 52000, variance: -8000 },
    { category: 'Insurance', budget: 25000, spent: 25000, variance: 0 },
    { category: 'Parts', budget: 35000, spent: 31000, variance: -4000 },
    { category: 'Labor', budget: 50000, spent: 48000, variance: -2000 },
    { category: 'Other', budget: 35000, spent: 20000, variance: -15000 }
  ];

  const monthlyTrend = [
    { month: 'Jan', budget: 250000, actual: 245000 },
    { month: 'Feb', budget: 250000, actual: 238000 },
    { month: 'Mar', budget: 250000, actual: 252000 },
    { month: 'Apr', budget: 250000, actual: 241000 },
    { month: 'May', budget: 250000, actual: 235000 },
    { month: 'Jun', budget: 250000, actual: 248000 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Assessment />} label="Dashboard" />
          <Tab icon={<AccountBalance />} label="Budget Tracking" />
          <Tab icon={<Receipt />} label="Expense Management" />
          <Tab icon={<Timeline />} label="Financial Reports" />
          <Tab icon={<ShowChart />} label="Forecasting" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Monthly Budget</Typography>
                <Typography variant="h4">${monthlyBudget.total.toLocaleString()}</Typography>
                <LinearProgress variant="determinate" value={(monthlyBudget.spent/monthlyBudget.total)*100} />
                <Typography variant="body2">{((monthlyBudget.spent/monthlyBudget.total)*100).toFixed(1)}% Used</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Spent</Typography>
                <Typography variant="h4">${monthlyBudget.spent.toLocaleString()}</Typography>
                <Typography variant="body2" color="success.main">Under budget by $36,500</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Cost per Mile</Typography>
                <Typography variant="h4">$2.85</Typography>
                <Typography variant="body2" color="error.main">+$0.15 from last month</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>YTD Savings</Typography>
                <Typography variant="h4">$125,000</Typography>
                <Typography variant="body2" color="success.main">5.2% under budget</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Budget vs Actual Trend</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="budget" stroke="#8884d8" name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expense Breakdown</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => entry.category}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="spent"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BudgetFinanceSystem;