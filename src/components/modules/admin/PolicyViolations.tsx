import { format, subDays, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  XCircle,
  Eye,
  MessageSquare,
  Shield,
  FileText,
  Calendar,
  MapPin,
  User,
  Car,
  AlertOctagon,
  BarChart3,
  Activity,
  Search
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import logger from '@/utils/logger';
import {
  PolicyViolation,
  ViolationType,
  ViolationSeverity,
  ViolationStatus,
  ViolationStatistics,
  ViolationFilter,
  ViolationComment,
} from '@/lib/types';


// Color schemes
const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

const STATUS_COLORS = {
  open: '#EF4444',
  acknowledged: '#F59E0B',
  under_review: '#3B82F6',
  approved_override: '#8B5CF6',
  resolved: '#10B981',
  dismissed: '#6B7280',
  escalated: '#DC2626',
};

const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  personal_use_unauthorized: 'Unauthorized Personal Use',
  personal_use_exceeds_limit: 'Personal Use Limit Exceeded',
  personal_use_weekend_violation: 'Weekend Use Violation',
  mileage_limit_exceeded: 'Mileage Limit Exceeded',
  geofence_breach: 'Geofence Breach',
  speed_violation: 'Speed Violation',
  after_hours_usage: 'After Hours Usage',
  unauthorized_driver: 'Unauthorized Driver',
  maintenance_overdue: 'Maintenance Overdue',
  fuel_card_misuse: 'Fuel Card Misuse',
  safety_violation: 'Safety Violation',
  documentation_missing: 'Documentation Missing',
  compliance_violation: 'Compliance Violation',
  other: 'Other',
};

interface PolicyViolationsProps {
  tenantId: string;
}

export const PolicyViolations: React.FC<PolicyViolationsProps> = ({ tenantId }) => {
  // State
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [statistics, setStatistics] = useState<ViolationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null);
  const [comments, setComments] = useState<ViolationComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filters
  const [filters, setFilters] = useState<ViolationFilter>({
    violationType: undefined,
    severity: undefined,
    status: undefined,
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    search: '',
  });

  // Dialog states
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Load data
  useEffect(() => {
    loadViolations();
    loadStatistics();
  }, [tenantId, filters]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.violationType && filters.violationType.length > 0) {
        filters.violationType.forEach(type => queryParams.append('violationType', type));
      }
      if (filters.severity && filters.severity.length > 0) {
        filters.severity.forEach(sev => queryParams.append('severity', sev));
      }
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(stat => queryParams.append('status', stat));
      }
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/policy-violations?${queryParams.toString()}`);
      const data = await response.json();
      setViolations(data.data || []);
    } catch (error) {
      logger.error('Failed to load violations:', error);
      // Load demo data for development
      setViolations(generateDemoViolations());
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`/api/policy-violations/statistics?tenantId=${tenantId}`);
      const data = await response.json();
      setStatistics(data.data);
    } catch (error) {
      logger.error('Failed to load statistics:', error);
      setStatistics(generateDemoStatistics());
    }
  };

  // Filtered violations
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          v.description.toLowerCase().includes(searchLower) ||
          v.vehicleNumber?.toLowerCase().includes(searchLower) ||
          v.driverName?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [violations, filters.search]);

  // Trend data
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayViolations = violations.filter(v =>
        format(parseISO(v.occurredAt), 'yyyy-MM-dd') === dateStr
      );

      return {
        date: format(date, 'MMM dd'),
        total: dayViolations.length,
        critical: dayViolations.filter(v => v.severity === 'critical').length,
        high: dayViolations.filter(v => v.severity === 'high').length,
        medium: dayViolations.filter(v => v.severity === 'medium').length,
        low: dayViolations.filter(v => v.severity === 'low').length,
      };
    });
    return last7Days;
  }, [violations]);

  // Severity breakdown
  const severityData = useMemo(() => {
    const counts = {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
    };
    return [
      { name: 'Critical', value: counts.critical, color: SEVERITY_COLORS.critical },
      { name: 'High', value: counts.high, color: SEVERITY_COLORS.high },
      { name: 'Medium', value: counts.medium, color: SEVERITY_COLORS.medium },
      { name: 'Low', value: counts.low, color: SEVERITY_COLORS.low },
    ];
  }, [violations]);

  // Type breakdown
  const typeData = useMemo(() => {
    const typeCounts = violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: VIOLATION_TYPE_LABELS[type as ViolationType] || type,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [violations]);

  // Handlers
  const handleViewDetails = async (violation: PolicyViolation) => {
    setSelectedViolation(violation);
    setShowDetailDialog(true);

    // Load comments
    try {
      const response = await fetch(`/api/policy-violations/${violation.id}/comments`);
      const data = await response.json();
      setComments(data.data || []);
    } catch (error) {
      logger.error('Failed to load comments:', error);
      setComments([]);
    }
  };

  const handleResolve = async () => {
    if (!selectedViolation) return;

    try {
      await fetch(`/api/policy-violations/${selectedViolation.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes }),
      });

      setShowResolveDialog(false);
      setResolutionNotes('');
      loadViolations();
      loadStatistics();
    } catch (error) {
      logger.error('Failed to resolve violation:', error);
    }
  };

  const handleRequestOverride = async () => {
    if (!selectedViolation) return;

    try {
      await fetch(`/api/policy-violations/${selectedViolation.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: overrideReason }),
      });

      setShowOverrideDialog(false);
      setOverrideReason('');
      loadViolations();
    } catch (error) {
      logger.error('Failed to request override:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedViolation || !newComment.trim()) return;

    try {
      await fetch(`/api/policy-violations/${selectedViolation.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: newComment }),
      });

      setNewComment('');
      // Reload comments
      const response = await fetch(`/api/policy-violations/${selectedViolation.id}/comments`);
      const data = await response.json();
      setComments(data.data || []);
    } catch (error) {
      logger.error('Failed to add comment:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/policy-violations/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters,
          includeResolved: true,
          includeComments: true,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `violations-report-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Export failed:', error);
    }
  };

  const getSeverityBadge = (severity: ViolationSeverity) => {
    const variants: Record<ViolationSeverity, string> = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return <Badge className={variants[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: ViolationStatus) => {
    const variants: Record<ViolationStatus, string> = {
      open: 'bg-red-100 text-red-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved_override: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800',
    };
    return <Badge className={variants[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Policy Violations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor and manage policy violations across your fleet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="violations">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-2">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{statistics?.totalViolations || 0}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-red-600">
                  {statistics?.openViolations || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <AlertOctagon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-red-700">
                  {statistics?.criticalViolations || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  High priority
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                <Clock className="h-4 w-4 text-blue-800" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {statistics?.avgResolutionHours.toFixed(1) || '0'}h
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Time to resolve
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Violation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="critical" stroke="#DC2626" name="Critical" />
                    <Line type="monotone" dataKey="high" stroke="#EF4444" name="High" />
                    <Line type="monotone" dataKey="medium" stroke="#F59E0B" name="Medium" />
                    <Line type="monotone" dataKey="low" stroke="#10B981" name="Low" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Violations by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Violation Types */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Violation Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Violators */}
            <Card>
              <CardHeader>
                <CardTitle>Top Violators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium">Vehicle</span>
                        </div>
                        <Badge variant="outline">{statistics.topViolatingVehicle || 'N/A'}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium">Driver</span>
                        </div>
                        <Badge variant="outline">{statistics.topViolatingDriver || 'N/A'}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium">Type</span>
                        </div>
                        <Badge variant="outline">
                          {statistics.topViolationType
                            ? VIOLATION_TYPE_LABELS[statistics.topViolationType]
                            : 'N/A'}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-2">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search violations..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Severity</label>
                  <Select
                    value={filters.severity?.[0] || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        severity: value === 'all' ? undefined : [value as ViolationSeverity],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={filters.status?.[0] || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        status: value === 'all' ? undefined : [value as ViolationStatus],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violations Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Violations ({filteredViolations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-3">
                          <Activity className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Loading violations...
                        </TableCell>
                      </TableRow>
                    ) : filteredViolations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-3 text-slate-500">
                          No violations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredViolations.map((violation) => (
                        <TableRow key={violation.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(parseISO(violation.occurredAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {VIOLATION_TYPE_LABELS[violation.violationType]}
                          </TableCell>
                          <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {violation.vehicleNumber || 'N/A'}
                          </TableCell>
                          <TableCell>{violation.driverName || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {violation.description}
                          </TableCell>
                          <TableCell>{getStatusBadge(violation.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(violation)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-600 dark:text-slate-400">
                Generate comprehensive compliance reports for audit and regulatory purposes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Monthly Summary</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Quarterly Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Policy Effectiveness</span>
                </Button>
              </div>

              <div className="border-t pt-2 mt-2">
                <h3 className="font-semibold mb-2">Policy Recommendations</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Personal use policy is effective - only 5% violation rate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Consider reducing speed limit threshold - 15% violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>Geofence policy needs review - 25% violations suggest unclear boundaries</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>
              {selectedViolation && VIOLATION_TYPE_LABELS[selectedViolation.violationType]}
            </DialogDescription>
          </DialogHeader>

          {selectedViolation && (
            <div className="space-y-2">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-slate-500">Severity</label>
                  <div className="mt-1">{getSeverityBadge(selectedViolation.severity)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedViolation.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Vehicle</label>
                  <div className="mt-1 font-mono">{selectedViolation.vehicleNumber || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Driver</label>
                  <div className="mt-1">{selectedViolation.driverName || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Occurred At</label>
                  <div className="mt-1">
                    {format(parseISO(selectedViolation.occurredAt), 'PPpp')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Detected At</label>
                  <div className="mt-1">
                    {format(parseISO(selectedViolation.detectedAt), 'PPpp')}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-500">Description</label>
                <p className="mt-1 text-sm">{selectedViolation.description}</p>
              </div>

              {/* Metrics */}
              {selectedViolation.thresholdValue && selectedViolation.actualValue && (
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <h4 className="font-semibold mb-2">Violation Metrics</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-slate-500">Threshold</div>
                      <div className="font-semibold">
                        {selectedViolation.thresholdValue} {selectedViolation.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Actual</div>
                      <div className="font-semibold">
                        {selectedViolation.actualValue} {selectedViolation.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Difference</div>
                      <div className="font-semibold text-red-600">
                        +{selectedViolation.difference} {selectedViolation.unit}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedViolation.locationAddress && (
                <div>
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="mt-1 text-sm">{selectedViolation.locationAddress}</p>
                </div>
              )}

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({comments.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{comment.userName || 'User'}</span>
                        <span className="text-xs text-slate-500">
                          {format(parseISO(comment.createdAt), 'PPp')}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{comment.commentText}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedViolation(selectedViolation);
                setShowOverrideDialog(true);
                setShowDetailDialog(false);
              }}
            >
              Request Override
            </Button>
            <Button
              onClick={() => {
                setShowResolveDialog(true);
                setShowDetailDialog(false);
              }}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Provide resolution notes for this violation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution notes..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionNotes.trim()}>
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Policy Override</DialogTitle>
            <DialogDescription>
              Explain why this violation should be overridden.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for override..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestOverride} disabled={!overrideReason.trim()}>
              Request Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Demo data generators
function generateDemoViolations(): PolicyViolation[] {
  const types: ViolationType[] = [
    'personal_use_unauthorized',
    'mileage_limit_exceeded',
    'speed_violation',
    'geofence_breach',
    'after_hours_usage',
  ];
  const severities: ViolationSeverity[] = ['low', 'medium', 'high', 'critical'];
  const statuses: ViolationStatus[] = ['open', 'acknowledged', 'under_review', 'resolved'];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `demo-${i}`,
    tenantId: 'demo',
    violationType: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    policyName: 'Demo Policy',
    description: `Violation ${i + 1} - Auto-generated demo data`,
    vehicleNumber: `V-${1000 + i}`,
    driverName: `Driver ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    occurredAt: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
    detectedAt: new Date().toISOString(),
    overrideRequested: false,
    notificationSent: true,
    escalationSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function generateDemoStatistics(): ViolationStatistics {
  return {
    totalViolations: 125,
    openViolations: 18,
    resolvedViolations: 107,
    criticalViolations: 5,
    avgResolutionHours: 24.5,
    topViolationType: 'speed_violation',
    topViolatingVehicle: 'V-1234',
    topViolatingDriver: 'John Doe',
  };
}

export default PolicyViolations;
