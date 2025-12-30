import {
  Car,
  Warning,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  TrendUp,
  CurrencyDollar,
  FileText,
  Download,
  ArrowsClockwise,
  Plus
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient, MutationFunction, MutateOptions } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { TripUsageDialog } from '@/components/dialogs/TripUsageDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import logger from '@/utils/logger'

interface TripUsageClassification {
  id?: string
  trip_date?: string
  vehicle_id?: string
  miles_total?: number
  usage_type?: string
  approval_status?: 'pending' | 'approved' | 'rejected' | 'auto_approved'
  business_purpose?: string
  rejection_reason?: string
}

interface ApprovalStatus {
  pending: 'pending'
  approved: 'approved'
  rejected: 'rejected'
  auto_approved: 'auto_approved'
}

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
  const _token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${_token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const apiMutation = async (url: string, method: string, data?: any) => {
  const _token = localStorage.getItem('token')
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${_token}`,
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
  currentTheme: _currentTheme
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
    const _token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserId(user.id || '')
    setUserRole(user.role || 'driver')
  }, [])

  // Driver data queries
  const { data: limitsData, isLoading: limitsLoading } = useQuery({
    queryKey: ['personal-use-limits', userId],
    queryFn: () => apiClient(`/api/personal-use-policies/limits/${userId}`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trip-usage', userId],
    queryFn: () => apiClient(`/api/trip-usage?driver_id=${userId}&limit=50`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ['personal-use-charges-dashboard', userId],
    queryFn: () => apiClient(`/api/personal-use-charges?driver_id=${userId}`),
    enabled: userRole === 'driver' && !!userId,
    staleTime: 30000,
    gcTime: 60000
  })

  // Manager data queries
  const { data: approvalsData, isLoading: approvalsLoading, error: approvalsError } = useQuery({
    queryKey: ['trip-usage-pending-approval'],
    queryFn: () => apiClient('/api/trip-usage/pending-approval'),
    enabled: userRole !== 'driver',
    staleTime: 30000,
    gcTime: 60000,
    onError: (err: unknown) => {
      logger.error('Failed to fetch dashboard data:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to load dashboard data')
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

  const { mutate: approveTrip, isPending: _isApprovingTrip } = useMutation({
    mutationFn: async (tripId: string) => {
      return apiMutation(`/api/trip-usage/${tripId}/approve`, 'POST', {})
    },
    onSuccess: () => {
      toast.success('Trip approved successfully')
      queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to approve trip')
    }
  })

  const { mutate: rejectTrip, isPending: _isRejectingTrip } = useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: string; reason: string }) => {
      return apiMutation(`/api/trip-usage/${tripId}/reject`, 'POST', { rejection_reason: reason })
    } as MutationFunction<any, { tripId: string; reason: string }>,
    onSuccess: () => {
      toast.success('Trip rejected')
      queryClient.invalidateQueries({ queryKey: ['trip-usage-pending-approval'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to reject trip')
    }
  })

  const handleApproveTrip = (tripId: string) => {
    approveTrip(tripId)
  }

  const handleRejectTrip = (tripId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    rejectTrip({ tripId, reason } as { tripId: string; reason: string })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      auto_approved: { variant: 'outline', icon: CheckCircle }
    }

    const variantInfo = variants[status] || { variant: 'secondary', icon: Clock }
    const { variant, icon: Icon } = variantInfo

    return (
      <Badge variant={variant} className="flex items-center gap-1">
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
      ...(data || []).map((trip: TripUsageClassification) => [
        new Date(trip.trip_date || '').toLocaleDateString(),
        trip.vehicle_id || '',
        trip.miles_total || 0,
        trip.usage_type || '',
        trip.approval_status || '',
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
                      {usageLimits?.current_month?.period || new Date().toISOString().slice(0, 7)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {(usageLimits?.current_month?.personal_miles ?? 0).toFixed(1)} miles
                        </span>
                        <span className="text-muted-foreground">
                          {usageLimits?.current_month?.limit
                            ? `of ${usageLimits.current_month.limit} miles`
                            : 'No limit set'}
                        </span>
                      </div>
                      <Progress
                        value={usageLimits?.current_month?.percentage_used || 0}
                        className={
                          (usageLimits?.current_month?.percentage_used || 0) >= 95
                            ? 'bg-red-500'
                            : (usageLimits?.current_month?.percentage_used || 0) >= 80
                            ? 'bg-yellow-500'
                            : ''
                        }
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {(usageLimits?.current_month?.percentage_used ?? 0).toFixed(1)}% used
                      </div>
                    </div>

                    {usageLimits?.current_month?.exceeds_limit && (
                      <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Monthly limit exceeded! Additional usage may require approval.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!usageLimits?.current_month?.exceeds_limit &&
                     (usageLimits?.current_month?.percentage_used || 0) >= 80 && (
                      <Alert>
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Approaching monthly limit ({(usageLimits?.current_month?.percentage_used ?? 0).toFixed(0)}% used)
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
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      {usageLimits?.current_year?.period || new Date().getFullYear().toString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {(usageLimits?.current_year?.personal_miles ?? 0).toFixed(1)} miles
                        </span>
                        <span className="text-muted-foreground">
                          {usageLimits?.current_year?.limit
                            ? `of ${usageLimits.current_year.limit} miles`
                            : 'No limit set'}
                        </span>
                      </div>
                      <Progress
                        value={usageLimits?.current_year?.percentage_used || 0}
                        className={
                          (usageLimits?.current_year?.percentage_used || 0) >= 95
                            ? 'bg-red-500'
                            : (usageLimits?.current_year?.percentage_used || 0) >= 80
                            ? 'bg-yellow-500'
                            : ''
                        }
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {(usageLimits?.current_year?.percentage_used ?? 0).toFixed(1)}% used
                      </div>
                    </div>

                    {usageLimits?.current_year?.exceeds_limit && (
                      <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Annual limit exceeded! Additional usage may require approval.
                        </AlertDescription>
                      </Alert>
                    )}

                    {!usageLimits?.current_year?.exceeds_limit &&
                     (usageLimits?.current_year?.percentage_used || 0) >= 80 && (
                      <Alert>
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          Approaching annual limit ({(usageLimits?.current_year?.percentage_used ?? 0).toFixed(0)}% used)
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Warnings/Alerts */}
              {usageLimits?.warnings?.length > 0 && (
                <Alert variant="destructive" className="mb-6">
                  <Warning className="h-4 w-4" />
                  <AlertTitle>Usage Alerts</AlertTitle>
                  <AlertDescription className="space-y-2">
                    {usageLimits.warnings.map((warning: string, idx: number) => (
                      <div key={idx}>- {warning}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Recent Trips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Trips</span>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      View All
                    </Button>
                  </CardTitle>
                  <CardDescription>Your most recent trip classifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTrips.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrips.slice(0, 5).map((t: TripUsageClassification) => (
                          <TableRow key={t.id}>
                            <TableCell>{new Date(t.trip_date || '').toLocaleDateString()}</TableCell>
                            <TableCell>{t.vehicle_id || 'N/A'}</TableCell>
                            <TableCell>{t.miles_total?.toFixed(1) || 0}</TableCell>
                            <TableCell>{t.usage_type ? getUsageTypeBadge(t.usage_type) : 'N/A'}</TableCell>
                            <TableCell>{t.approval_status ? getStatusBadge(t.approval_status) : 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No recent trips recorded" />
                  )}
                </CardContent>
              </Card>

              {/* Charges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Charges</span>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      View All
                    </Button>
                  </CardTitle>
                  <CardDescription>Personal use charges and fees</CardDescription>
                </CardHeader>
                <CardContent>
                  {charges.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.slice(0, 5).map((charge: any) => (
                          <TableRow key={charge.id}>
                            <TableCell>{new Date(charge.date || '').toLocaleDateString()}</TableCell>
                            <TableCell>${(charge.amount || 0).toFixed(2)}</TableCell>
                            <TableCell>{charge.type || 'N/A'}</TableCell>
                            <TableCell>{charge.status || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No charges recorded" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trips Tab */}
            <TabsContent value="trips" className="space-y-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="w-48">
                  <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as '30days' | '90days' | 'year')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={usageTypeFilter} onValueChange={setUsageTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Usage Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trip History</CardTitle>
                  <CardDescription>All recorded trips and classifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTrips.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purpose</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrips.map((trip: TripUsageClassification) => (
                          <TableRow key={trip.id}>
                            <TableCell>{new Date(trip.trip_date || '').toLocaleDateString()}</TableCell>
                            <TableCell>{trip.vehicle_id || 'N/A'}</TableCell>
                            <TableCell>{trip.miles_total?.toFixed(1) || 0}</TableCell>
                            <TableCell>{trip.usage_type ? getUsageTypeBadge(trip.usage_type) : 'N/A'}</TableCell>
                            <TableCell>{trip.approval_status ? getStatusBadge(trip.approval_status) : 'N/A'}</TableCell>
                            <TableCell>{trip.business_purpose || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No trips recorded for the selected filters" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charges Tab */}
            <TabsContent value="charges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Use Charges</CardTitle>
                  <CardDescription>Charges and fees for personal vehicle usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {charges.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.map((charge: any) => (
                          <TableRow key={charge.id}>
                            <TableCell>{new Date(charge.date || '').toLocaleDateString()}</TableCell>
                            <TableCell>${(charge.amount || 0).toFixed(2)}</TableCell>
                            <TableCell>{charge.type || 'N/A'}</TableCell>
                            <TableCell>{charge.status || 'N/A'}</TableCell>
                            <TableCell>{charge.description || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No charges recorded" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* MANAGER/ADMIN VIEW */}
        {userRole !== 'driver' && (
          <>
            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Trip classifications awaiting review</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingApprovals.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Miles</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.map((trip: PendingApproval) => (
                          <TableRow key={trip.id}>
                            <TableCell>{new Date(trip.trip_date || '').toLocaleDateString()}</TableCell>
                            <TableCell>{trip.driver_name || 'N/A'}</TableCell>
                            <TableCell>{trip.vehicle_name || trip.vehicle_id || 'N/A'}</TableCell>
                            <TableCell>{trip.miles_total?.toFixed(1) || 0}</TableCell>
                            <TableCell>{trip.usage_type ? getUsageTypeBadge(trip.usage_type) : 'N/A'}</TableCell>
                            <TableCell>{trip.approval_status ? getStatusBadge(trip.approval_status) : 'N/A'}</TableCell>
                            <TableCell>
                              {trip.approval_status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveTrip(trip.id || '')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectTrip(trip.id || '')}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No trips pending approval" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Overview Tab */}
            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamSummary?.total_members || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamSummary?.pending_approvals || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Drivers Near Limit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamSummary?.drivers_near_limit || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Charges This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(teamSummary?.total_charges_this_month || 0).toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Team Trip History</CardTitle>
                  <CardDescription>Recent trips across all team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState message="Team trip history will be displayed here" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Violations Tab */}
            <TabsContent value="violations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Violations</CardTitle>
                  <CardDescription>Drivers exceeding personal use limits or with unapproved trips</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState message="Policy violations will be displayed here" />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}