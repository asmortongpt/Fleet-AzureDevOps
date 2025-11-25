import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Car,
  Warning,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  TrendUp,
  CurrencyDollar,
  Users,
  FileText,
  Download,
  ArrowsClockwise,
  Plus
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { TripUsageDialog } from '@/components/dialogs/TripUsageDialog'
import {
  DriverUsageLimits,
  TripUsageClassification,
  PersonalUseCharge,
  ApprovalStatus
} from '../../types/trip-usage'

interface PersonalUseDashboardProps {
  currentTheme?: string
}

interface TeamSummary {
  total_members: number
  pending_approvals: number
  drivers_near_limit: number
  total_charges_this_month: number
}

interface PendingApproval extends TripUsageClassification {
  driver_name?: string
  vehicle_name?: string
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Alert variant="destructive" className="m-4">
    <XCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <ArrowsClockwise className="w-4 h-4 mr-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
    <Car className="w-16 h-16 mb-4 opacity-50" />
    <p>{message}</p>
  </div>
)

const apiClient = async (url: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const apiMutation = async (url: string, method: string, data?: any) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to perform action')
  }
  return response.json()
}

export const PersonalUseDashboard: React.FC<PersonalUseDashboardProps> = ({
  currentTheme
}) => {
  const queryClient = useQueryClient()
  const [userRole, setUserRole] = useState<'driver' | 'manager' | 'admin'>('driver')
  const [userId, setUserId] = useState<string>('')

  // Filters
  const [dateFilter, setDateFilter] = useState<'30days' | '90days' | 'year'>('30days')
  const [usageTypeFilter, setUsageTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  React.useEffect(() => {
    // Get user info from localStorage or token
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserId(user.id || '')
    setUserRole(user.role || 'driver')
  }, [])

  // Driver data queries
  const { data: limitsData, isLoading: limitsLoading } = useQuery({
    queryKey: ['personal-use-limits', userId],
    queryFn: () => apiClient(`/api/personal-use-policies/limits/${userId}`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000
  })

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trip-usage', userId],
    queryFn: () => apiClient(`/api/trip-usage?driver_id=${userId}&limit=50`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000
  })

  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ['personal-use-charges-dashboard', userId],
    queryFn: () => apiClient(`/api/personal-use-charges?driver_id=${userId}`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000
  })

  // Manager data queries
  const { data: approvalsData, isLoading: approvalsLoading, error: approvalsError } = useQuery({
    queryKey: ['trip-usage-pending-approval'],
    queryFn: () => apiClient('/api/trip-usage/pending-approval'),
    enabled: userRole !== 'driver',
    staleTime: 30000,
    onError: (err: any) => {
      console.error('Failed to fetch dashboard data:', err)
      toast.error(err.message || 'Failed to load dashboard data')
    }
  })

  const usageLimits = limitsData?.data || null
  const recentTrips = tripsData?.data || []
  const charges = chargesData?.data || []
  const pendingApprovals = approvalsData?.data || []

  const teamSummary: TeamSummary | null = pendingApprovals.length > 0 ? {
    total_members: pendingApprovals.length || 0,
    pending_approvals: pendingApprovals.filter((t: PendingApproval) =>
      t.approval_status === 'pending'
    ).length || 0,
    drivers_near_limit: 0,
    total_charges_this_month: 0
  } : null

  const loading = userRole === 'driver'
    ? limitsLoading || tripsLoading || chargesLoading
    : approvalsLoading
  const error = approvalsError

  const { mutate: approveTrip, isPending: isApprovingTrip } = useMutation({    mutationFn: async (tripId: string) => {
      return apiMutation(`/api/trip-usage/${tripId}/approve`, 'POST', {})
    },
    onSuccess: () => {
      toast.success('Trip approved successfully')
      queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve trip')
    }
  })

  const { mutate: rejectTrip, isPending: isRejectingTrip } = useMutation({    mutationFn: async (tripId: string, reason: string) => {
      return apiMutation(`/api/trip-usage/${tripId}/reject`, 'POST', { rejection_reason: reason })
    },
    onSuccess: () => {
      toast.success('Trip rejected')
      queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject trip')
    }
  })

  const handleApproveTrip = (tripId: string) => {
    approveTrip(tripId)
  }

  const handleRejectTrip = (tripId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    rejectTrip(tripId, reason)
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants: Record<ApprovalStatus, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      auto_approved: { variant: 'outline', icon: CheckCircle }
    }

    const { variant, icon: Icon } = variants[status]

    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getUsageTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      business: 'bg-green-500/10 text-green-700 dark:text-green-400',
      personal: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      mixed: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
    }

    return (
      <Badge className={colors[type] || 'bg-gray-500/10'}>
        {type}
      </Badge>
    )
  }

  const exportToCSV = () => {
    const data = userRole === 'driver' ? recentTrips : pendingApprovals
    const csv = [
      ['Date', 'Vehicle', 'Miles', 'Type', 'Status', 'Purpose'].join(','),
      ...(data || []).map(trip => [
        new Date(trip.trip_date).toLocaleDateString(),
        trip.vehicle_id,
        trip.miles_total,
        trip.usage_type,
        trip.approval_status,
        trip.business_purpose || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trip-usage-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    toast.success('Report exported successfully')
  }

  if (loading) return <LoadingSpinner />
  if (error && error instanceof Error) return <ErrorDisplay error={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })} />

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="w-8 h-8" />
            Personal Use Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'driver'
              ? 'Track your personal vs business vehicle usage'
              : 'Manage team personal use approvals and compliance'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (userRole === 'driver') {
              queryClient.invalidateQueries({ queryKey: ['personal-use-limits', userId] })
              queryClient.invalidateQueries({ queryKey: ['trip-usage', userId] })
              queryClient.invalidateQueries({ queryKey: ['personal-use-charges-dashboard', userId] })
            } else {
              queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })
            }
          }}>
            <ArrowsClockwise className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {userRole === 'driver' && (
            <TripUsageDialog
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Trip
                </Button>
              }
              driverId={userId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['trip-usage', userId] })
                queryClient.invalidateQueries({ queryKey: ['personal-use-charges-dashboard', userId] })
              }}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue={userRole === 'driver' ? 'overview' : 'approvals'} className="space-y-4">
        <TabsList>
          {userRole === 'driver' ? (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trips">Trip History</TabsTrigger>
              <TabsTrigger value="charges">Charges</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
              <TabsTrigger value="team">Team Overview</TabsTrigger>
              <TabsTrigger value="violations">Policy Violations</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* DRIVER VIEW */}
        {userRole === 'driver' && (
          <>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Usage Meters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Monthly Personal Use</span>
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      {usageLimits?.current_month.period || new Date().toISOString().slice(0, 7)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {usageLimits?.current_month.personal_miles?.toFixed(1) || 0} miles
                        </span>
                        <span className="text-muted-foreground">
                          {usageLimits?.current_month.limit
                            ? `of ${usageLimits.current_month.limit} miles`
                            : 'No limit set'}
                        </span>
                      </div>
                      <Progress
                        value={usageLimits?.current_month.percentage_used || 0}
                        className={
                          (usageLimits?.current_month.percentage_used || 0) >= 95
                            ? 'bg-red-500'
                            : (usageLimits?.current_month.percentage_used || 0) >= 80
                            ? 'bg-yellow-500'
                            : ''
                        }
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {usageLimits?.current_month.percentage_used?.toFixed(1) || 0}% used
                      </div>
                    </div>

                    {usageLimits?.current_month.exceeds_limit && (
                      <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Monthly limit exceeded! Additional usage may require approval.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!usageLimits?.current_month.exceeds_limit &&
                     (usageLimits?.current_month.percentage_used || 0) >= 80 && (
                      <Alert>
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Approaching monthly limit ({usageLimits?.current_month.percentage_used?.toFixed(0)}% used)
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Annual Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Annual Personal Use</span>
                      <TrendUp className="w-5 h-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Year {usageLimits?.current_year.year || new Date().getFullYear()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {usageLimits?.current_year.personal_miles?.toFixed(1) || 0} miles
                        </span>
                        <span className="text-muted-foreground">
                          {usageLimits?.current_year.limit
                            ? `of ${usageLimits.current_year.limit} miles`
                            : 'No limit set'}
                        </span>
                      </div>
                      <Progress
                        value={usageLimits?.current_year.percentage_used || 0}
                        className={
                          (usageLimits?.current_year.percentage_used || 0) >= 95
                            ? 'bg-red-500'
                            : (usageLimits?.current_year.percentage_used || 0) >= 80
                            ? 'bg-yellow-500'
                            : ''
                        }
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {usageLimits?.current_year.percentage_used?.toFixed(1) || 0}% used
                      </div>
                    </div>

                    {usageLimits?.current_year.exceeds_limit && (
                      <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Annual limit exceeded! Further personal use is not permitted.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {usageLimits?.warnings && usageLimits.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Warning className="w-5 h-5 text-yellow-500" />
                      Usage Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {usageLimits.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recent Trips Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trips (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {recentTrips.filter(t => t.usage_type === 'business').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Business</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {recentTrips.filter(t => t.usage_type === 'personal').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Personal</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {recentTrips.filter(t => t.usage_type === 'mixed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Mixed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trips Tab */}
            <TabsContent value="trips" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Select value={usageTypeFilter} onValueChange={setUsageTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Usage Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Time Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Trips Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Trip History</CardTitle>
                  <CardDescription>
                    {recentTrips.length} trips recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTrips.length === 0 ? (
                    <EmptyState message="No trips recorded yet. Start by recording your first trip!" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Purpose/Notes</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrips
                          .filter(trip =>
                            (usageTypeFilter === 'all' || trip.usage_type === usageTypeFilter) &&
                            (statusFilter === 'all' || trip.approval_status === statusFilter)
                          )
                          .map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>
                              {new Date(trip.trip_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getUsageTypeBadge(trip.usage_type)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div>{trip.miles_total} mi</div>
                                {trip.usage_type === 'mixed' && (
                                  <div className="text-xs text-muted-foreground">
                                    B: {trip.miles_business} / P: {trip.miles_personal}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {trip.business_purpose || trip.personal_notes || '-'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(trip.approval_status)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charges Tab */}
            <TabsContent value="charges" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollar className="w-5 h-5" />
                    Personal Use Charges
                  </CardTitle>
                  <CardDescription>
                    Billing statements for personal vehicle use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {charges.length === 0 ? (
                    <EmptyState message="No charges recorded" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.map((charge) => (
                          <TableRow key={charge.id}>
                            <TableCell>{charge.charge_period}</TableCell>
                            <TableCell>{charge.miles_charged}</TableCell>
                            <TableCell>${charge.rate_per_mile.toFixed(2)}/mi</TableCell>
                            <TableCell className="font-semibold">
                              ${charge.total_charge.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge>{charge.charge_status}</Badge>
                            </TableCell>
                            <TableCell>
                              {charge.due_date
                                ? new Date(charge.due_date).toLocaleDateString()
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* MANAGER VIEW */}
        {(userRole === 'manager' || userRole === 'admin') && (
          <>
            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamSummary?.pending_approvals || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamSummary?.total_members || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Near Limit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {teamSummary?.drivers_near_limit || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Charges This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${teamSummary?.total_charges_this_month?.toFixed(2) || '0.00'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Approval Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Queue</CardTitle>
                  <CardDescription>
                    {pendingApprovals.filter(t => t.approval_status === 'pending').length} trips pending approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingApprovals.filter(t => t.approval_status === 'pending').length === 0 ? (
                    <EmptyState message="No pending approvals" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals
                          .filter(t => t.approval_status === 'pending')
                          .map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>{trip.driver_name || trip.driver_id}</TableCell>
                            <TableCell>
                              {new Date(trip.trip_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getUsageTypeBadge(trip.usage_type)}
                            </TableCell>
                            <TableCell>{trip.miles_total} mi</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {trip.business_purpose || trip.personal_notes}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveTrip(trip.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectTrip(trip.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Overview Tab */}
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Team Usage Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="Team overview feature coming soon" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Violations Tab */}
            <TabsContent value="violations">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState message="No policy violations detected" />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

export default PersonalUseDashboard
