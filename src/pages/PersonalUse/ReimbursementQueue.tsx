import {
  Receipt,
  Check,
  X,
  Eye,
  Download,
  Funnel,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { usePermissions } from '@/hooks/usePermissions'
import logger from '@/utils/logger'

interface ReimbursementRequest {
  id: string
  driver_id: string
  driver_name: string
  driver_email: string
  request_amount: number
  approved_amount?: number
  description?: string
  expense_date: string
  category?: string
  status: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by_name?: string
  reviewer_notes?: string
  receipt_file_path?: string
  charge_period?: string
  miles_charged?: number
}

interface QueueSummary {
  total_pending: number
  total_amount: number
  avg_days_pending: number
}

const apiClient = async (url: string): Promise<any> => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const apiMutation = async (url: string, method: string, data?: unknown): Promise<any> => {
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

export function ReimbursementQueue() {
  const queryClient = useQueryClient()
  const { isAdmin, isFleetManager, canViewFinancial } = usePermissions()
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [reviewingRequest, setReviewingRequest] = useState<ReimbursementRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewNotes, setReviewNotes] = useState('')
  const [approvedAmount, setApprovedAmount] = useState<string>('')
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [driverFilter, setDriverFilter] = useState<string>('')

  // Permission check - only admins, fleet managers, and finance can access this page
  const canAccessQueue = isAdmin || isFleetManager || canViewFinancial

  if (!canAccessQueue) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You do not have permission to view the reimbursement queue.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const getQueueParams = (): string => {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    return params.toString()
  }

  const { data: queueData, isLoading: loading, error: queueError } = useQuery({
    queryKey: ['reimbursement-queue', statusFilter, categoryFilter],
    queryFn: () => apiClient(`/api/reimbursements?${getQueueParams()}`),
    staleTime: 30000,
    gcTime: 60000
  })

  // Handle errors with useEffect
  React.useEffect(() => {
    if (queueError) {
      logger.error('Failed to fetch queue:', queueError)
      toast.error('Failed to load reimbursement queue')
    }
  }, [queueError])

  const { data: summaryData } = useQuery({
    queryKey: ['reimbursement-summary'],
    queryFn: () => apiClient('/api/reimbursements/queue/pending'),
    staleTime: 30000,
    gcTime: 60000,
    enabled: statusFilter === 'pending'
  })

  const requests: ReimbursementRequest[] = queueData?.data || []
  const summary: QueueSummary | null = summaryData?.summary || null

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedRequests(new Set(requests.map((r: ReimbursementRequest) => r.id)))
    } else {
      setSelectedRequests(new Set())
    }
  }

  const handleSelectRequest = (id: string, checked: boolean): void => {
    const newSelected = new Set(selectedRequests)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRequests(newSelected)
  }

  const handleReview = (request: ReimbursementRequest, action: 'approve' | 'reject'): void => {
    setReviewingRequest(request)
    setReviewAction(action)
    setReviewNotes('')
    setApprovedAmount(request.request_amount.toString())
  }

  const { mutate: reviewRequest, isPending: _isReviewingPending } = useMutation({
    mutationFn: async () => {
      if (!reviewingRequest) throw new Error('No request selected')

      const endpoint = reviewAction === 'approve'
        ? `/api/reimbursements/${reviewingRequest.id}/approve`
        : `/api/reimbursements/${reviewingRequest.id}/reject`

      const payload = reviewAction === 'approve'
        ? {
            approved_amount: parseFloat(approvedAmount),
            reviewer_notes: reviewNotes
          }
        : {
            reviewer_notes: reviewNotes
          }

      return apiMutation(endpoint, 'PATCH', payload)
    },
    onSuccess: () => {
      toast.success(
        reviewAction === 'approve'
          ? `Approved $${approvedAmount}`
          : 'Reimbursement rejected'
      )
      setReviewingRequest(null)
      queryClient.invalidateQueries({ queryKey: ['reimbursement-queue'] })
      queryClient.invalidateQueries({ queryKey: ['reimbursement-summary'] })
    },
    onError: (error: unknown) => {
      logger.error('Failed to review request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to review request')
    }
  })

  const { mutate: bulkApprove, isPending: _isBulkApprovePending } = useMutation({
    mutationFn: async () => {
      if (selectedRequests.size === 0) throw new Error('No requests selected')

      const promises = Array.from(selectedRequests).map(id =>
        apiMutation(`/api/reimbursements/${id}/approve`, 'PATCH', {})
      )

      await Promise.all(promises)
    },
    onSuccess: () => {
      toast.success(`Approved ${selectedRequests.size} requests`)
      setSelectedRequests(new Set())
      queryClient.invalidateQueries({ queryKey: ['reimbursement-queue'] })
      queryClient.invalidateQueries({ queryKey: ['reimbursement-summary'] })
    },
    onError: (error: unknown) => {
      logger.error('Bulk approve failed:', error)
      toast.error('Some approvals failed')
    }
  })

  const submitReview = (): void => {
    if (!reviewingRequest) return

    if (reviewAction === 'reject' && !reviewNotes.trim()) {
      toast.error('Rejection reason is required')
      return
    }

    if (reviewAction === 'approve' && parseFloat(approvedAmount) > reviewingRequest.request_amount) {
      toast.error('Approved amount cannot exceed requested amount')
      return
    }

    reviewRequest()
  }

  const handleBulkApprove = (): void => {
    if (selectedRequests.size === 0) {
      toast.error('No requests selected')
      return
    }

    bulkApprove()
  }

  const filteredRequests = requests.filter((r: ReimbursementRequest) => {
    if (driverFilter && !r.driver_name.toLowerCase().includes(driverFilter.toLowerCase())) {
      return false
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
      approved: { variant: 'secondary', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      paid: { variant: 'default', icon: CreditCard, label: 'Paid' }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reimbursement Queue</h1>
        <p className="text-muted-foreground">
          Review and process driver reimbursement requests
        </p>
      </div>

      {/* Summary Cards */}
      {statusFilter === 'pending' && summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total_amount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Days Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg_days_pending?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">Average wait time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Funnel className="w-5 h-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <Input
                placeholder="Search driver..."
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="invisible">Actions</Label>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['reimbursement-queue'] })} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>

          {selectedRequests.size > 0 && (
            <div className="flex gap-2 items-center">
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>{selectedRequests.size} requests selected</span>
                  <div className="flex gap-2">
                    {(isAdmin || isFleetManager) && (
                      <Button onClick={handleBulkApprove} size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Bulk Approve
                      </Button>
                    )}
                    <Button
                      onClick={() => setSelectedRequests(new Set())}
                      variant="outline"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reimbursement Requests</CardTitle>
          <CardDescription>{filteredRequests.length} requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reimbursement requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRequests.size === filteredRequests.length}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Expense Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: ReimbursementRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={(checked) => handleSelectRequest(request.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell>{request.driver_name}</TableCell>
                    <TableCell>${request.request_amount.toFixed(2)}</TableCell>
                    <TableCell>{request.category || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(request.expense_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{format(new Date(request.submitted_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(request, 'approve')}
                          disabled={request.status !== 'pending' || (!isAdmin && !isFleetManager)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(request, 'reject')}
                          disabled={request.status !== 'pending' || (!isAdmin && !isFleetManager)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingReceipt(request.receipt_file_path || null)}
                          disabled={!request.receipt_file_path}
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Review Dialog */}
      {reviewingRequest && (
        <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve Reimbursement' : 'Reject Reimbursement'}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve'
                  ? 'Review and approve the reimbursement amount.'
                  : 'Provide a reason for rejecting this reimbursement.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={reviewingRequest.driver_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Requested Amount</Label>
                <Input value={`$${reviewingRequest.request_amount.toFixed(2)}`} disabled />
              </div>
              {reviewAction === 'approve' && (
                <div className="space-y-2">
                  <Label>Approved Amount</Label>
                  <Input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Reviewer Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  placeholder={reviewAction === 'approve' ? 'Optional notes' : 'Reason for rejection'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setReviewingRequest(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                onClick={submitReview}
              >
                {reviewAction === 'approve' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Viewer Dialog */}
      {viewingReceipt && (
        <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>View Receipt</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <img
                src={viewingReceipt}
                alt="Receipt"
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
            <DialogFooter>
              <Button asChild>
                <a href={viewingReceipt} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button type="button" variant="secondary" onClick={() => setViewingReceipt(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}