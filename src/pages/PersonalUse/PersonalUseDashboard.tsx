import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Car,
  Gauge,
  DollarSign,
  Receipt,
  CalendarDots,
  Warning,
  TrendUp,
  Check,
  Clock,
  X
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TripMarker } from '@/components/PersonalUse/TripMarker'

interface DashboardData {
  driver_id: string
  current_month: string
  month_personal_miles: number
  year_personal_miles: number
  monthly_limit?: number
  yearly_limit?: number
  monthly_percentage?: number
  yearly_percentage?: number
  pending_approvals: number
  pending_charges_count: number
  pending_charges_amount: number
  pending_reimbursements_count: number
  pending_reimbursements_amount: number
  next_payment_date?: string
  next_payment_amount?: number
}

interface PersonalTrip {
  id: string
  trip_date: string
  miles_personal: number
  miles_total: number
  usage_type: 'personal' | 'mixed'
  approval_status: string
  estimated_charge: number
  make?: string
  model?: string
  license_plate?: string
}

interface PendingCharge {
  id: string
  charge_period: string
  miles_charged: number
  total_charge: number
  charge_status: string
  due_date?: string
}

interface ReimbursementRequest {
  id: string
  request_amount: number
  description?: string
  expense_date: string
  status: string
  submitted_at: string
  category?: string
}

const apiClient = async (url: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export function PersonalUseDashboard() {
  const [selectedTrip, setSelectedTrip] = useState<PersonalTrip | null>(null)

  const { data: dashboardRes, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['personal-use-dashboard'],
    queryFn: () => apiClient('/api/personal-use-dashboard'),
    staleTime: 30000
  })

  const { data: tripsRes, error: tripsError } = useQuery({
    queryKey: ['personal-trips'],
    queryFn: () => apiClient('/api/trips/my-personal?limit=10'),
    staleTime: 30000
  })

  const { data: chargesRes, error: chargesError } = useQuery({
    queryKey: ['personal-use-charges-dashboard'],
    queryFn: () => apiClient('/api/personal-use-charges?charge_status=pending&charge_status=invoiced&charge_status=billed'),
    staleTime: 30000
  })

  const { data: reimbursementsRes, error: reimbursementsError, refetch: refetchDashboard } = useQuery({
    queryKey: ['reimbursements-dashboard'],
    queryFn: () => apiClient('/api/reimbursements?status=pending&status=approved'),
    staleTime: 30000,
    onError: (error: any) => {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    }
  })

  const dashboardData = dashboardRes?.data || null
  const recentTrips = tripsRes?.data || []
  const pendingCharges = chargesRes?.data || []
  const reimbursements = reimbursementsRes?.data || []
  const loading = dashboardLoading

  const getUsageColor = (percentage?: number) => {
    if (!percentage) return 'bg-primary'
    if (percentage < 70) return 'bg-green-500'
    if (percentage < 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', icon: Clock },
      approved: { variant: 'secondary', icon: Check },
      rejected: { variant: 'destructive', icon: X },
      paid: { variant: 'default', icon: Check },
      auto_approved: { variant: 'secondary', icon: Check }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const monthlyPercentage = dashboardData?.monthly_percentage || 0
  const yearlyPercentage = dashboardData?.yearly_percentage || 0
  const monthlyExceeded = monthlyPercentage > 100
  const yearlyExceeded = yearlyPercentage > 100

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Personal Use Dashboard</h1>
        <p className="text-muted-foreground">
          Track your personal vehicle usage and manage reimbursements
        </p>
      </div>

      {/* Warning Alerts */}
      {(monthlyExceeded || yearlyExceeded) && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertDescription>
            {monthlyExceeded && (
              <p>You have exceeded your monthly personal use limit by {(monthlyPercentage - 100).toFixed(0)}%</p>
            )}
            {yearlyExceeded && (
              <p>You have exceeded your yearly personal use limit by {(yearlyPercentage - 100).toFixed(0)}%</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Meters */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDots className="w-5 h-5" />
              This Month
            </CardTitle>
            <CardDescription>
              {dashboardData?.current_month}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Personal Miles</span>
                <span className="font-semibold">
                  {dashboardData?.month_personal_miles.toFixed(1) || '0.0'} / {dashboardData?.monthly_limit || '∞'} mi
                </span>
              </div>
              <Progress
                value={monthlyPercentage}
                className={`h-2 ${getUsageColor(monthlyPercentage)}`}
              />
              <p className="text-xs text-muted-foreground">
                {monthlyPercentage.toFixed(0)}% used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="w-5 h-5" />
              This Year
            </CardTitle>
            <CardDescription>
              Year-to-date usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Personal Miles</span>
                <span className="font-semibold">
                  {dashboardData?.year_personal_miles.toFixed(1) || '0.0'} / {dashboardData?.yearly_limit || '∞'} mi
                </span>
              </div>
              <Progress
                value={yearlyPercentage}
                className={`h-2 ${getUsageColor(yearlyPercentage)}`}
              />
              <p className="text-xs text-muted-foreground">
                {yearlyPercentage.toFixed(0)}% used
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.pending_approvals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Trips awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.pending_charges_amount.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.pending_charges_count || 0} charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.pending_reimbursements_amount.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.pending_reimbursements_count || 0} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <CalendarDots className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.next_payment_amount?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.next_payment_date
                ? format(new Date(dashboardData.next_payment_date), 'MMM dd, yyyy')
                : 'No upcoming payments'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips">
            <Car className="w-4 h-4 mr-2" />
            Recent Trips
          </TabsTrigger>
          <TabsTrigger value="charges">
            <DollarSign className="w-4 h-4 mr-2" />
            Pending Charges
          </TabsTrigger>
          <TabsTrigger value="reimbursements">
            <Receipt className="w-4 h-4 mr-2" />
            Reimbursements
          </TabsTrigger>
        </TabsList>

        {/* Recent Trips Tab */}
        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle>Recent Personal Trips</CardTitle>
              <CardDescription>
                Last 10 personal or mixed trips
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No personal trips recorded
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Personal Miles</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {format(new Date(trip.trip_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {trip.make} {trip.model}
                          <div className="text-xs text-muted-foreground">
                            {trip.license_plate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trip.usage_type === 'personal' ? 'default' : 'secondary'}>
                            {trip.usage_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{trip.miles_personal.toFixed(1)} mi</TableCell>
                        <TableCell>${trip.estimated_charge.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(trip.approval_status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTrip(trip)}
                          >
                            Details
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

        {/* Pending Charges Tab */}
        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <CardTitle>Pending Charges</CardTitle>
              <CardDescription>
                Charges awaiting payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending charges
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Miles</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCharges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>{charge.charge_period}</TableCell>
                        <TableCell>{charge.miles_charged.toFixed(1)} mi</TableCell>
                        <TableCell className="font-semibold">
                          ${charge.total_charge.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(charge.charge_status)}</TableCell>
                        <TableCell>
                          {charge.due_date
                            ? format(new Date(charge.due_date), 'MMM dd, yyyy')
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

        {/* Reimbursements Tab */}
        <TabsContent value="reimbursements">
          <Card>
            <CardHeader>
              <CardTitle>Reimbursement Requests</CardTitle>
              <CardDescription>
                Your reimbursement requests and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reimbursements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reimbursement requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reimbursements.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(new Date(request.submitted_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{request.description || '-'}</TableCell>
                        <TableCell>
                          {request.category ? (
                            <Badge variant="outline">{request.category}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${request.request_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trip Details Dialog (if needed) */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <TripMarker
              tripId={selectedTrip.id}
              initialUsageType={selectedTrip.usage_type}
              miles={selectedTrip.miles_total}
              onSave={() => {
                setSelectedTrip(null)
                refetchDashboard()
              }}
              onCancel={() => setSelectedTrip(null)}
              showCostPreview={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
