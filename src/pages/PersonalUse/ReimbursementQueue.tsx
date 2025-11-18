import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { toast } from 'sonner'
import { format } from 'date-fns'

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

export function ReimbursementQueue() {
  const queryClient = useQueryClient()
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

  const getQueueParams = () => {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    return params.toString()
  }

  const { data: queueData, isLoading: loading, error: queueError } = useQuery({
    queryKey: ['reimbursement-queue', statusFilter, categoryFilter],
    queryFn: () => apiClient(`/api/reimbursements?${getQueueParams()}`),
    staleTime: 30000,
    onError: (error: any) => {
      console.error('Failed to fetch queue:', error)
      toast.error('Failed to load reimbursement queue')
    }
  })

  const { data: summaryData } = useQuery({
    queryKey: ['reimbursement-summary'],
    queryFn: () => apiClient('/api/reimbursements/queue/pending'),
    staleTime: 30000,
    enabled: statusFilter === 'pending'
  })

  const requests = queueData?.data || []
  const summary = summaryData?.summary || null

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(requests.map(r => r.id)))
    } else {
      setSelectedRequests(new Set())
    }
  }

  const handleSelectRequest = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRequests(newSelected)
  }

  const handleReview = (request: ReimbursementRequest, action: 'approve' | 'reject') => {
    setReviewingRequest(request)
    setReviewAction(action)
    setReviewNotes('')
    setApprovedAmount(request.request_amount.toString())
  }

  const { mutate: reviewRequest, isPending: isReviewingPending } = useMutation({
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
    onError: (error: any) => {
      console.error('Failed to review request:', error)
      toast.error(error.message || 'Failed to review request')
    }
  })

  const { mutate: bulkApprove, isPending: isBulkApprovePending } = useMutation({
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
    onError: (error: any) => {
      console.error('Bulk approve failed:', error)
      toast.error('Some approvals failed')
    }
  })

  const submitReview = () => {
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

  const handleBulkApprove = () => {
    if (selectedRequests.size === 0) {
      toast.error('No requests selected')
      return
    }

    bulkApprove()
  }

  const filteredRequests = requests.filter(r => {
    if (driverFilter && !r.driver_name.toLowerCase().includes(driverFilter.toLowerCase())) {
      return false
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
      approved: { variant: 'secondary', icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      paid: { variant: 'default', icon: CreditCard, label: 'Paid' }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
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
                    <Button onClick={handleBulkApprove} size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Bulk Approve
                    </Button>
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
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRequest(request.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.driver_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.driver_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.submitted_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.description || '-'}
                    </TableCell>
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
                    <TableCell>
                      {request.receipt_file_path ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingReceipt(request.receipt_file_path!)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleReview(request, 'approve')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(request, 'reject')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Reimbursement
              </DialogTitle>
              <DialogDescription>
                Request from {reviewingRequest.driver_name} for ${reviewingRequest.request_amount.toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviewingRequest.description || 'No description provided'}
                </p>
              </div>

              {reviewAction === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="approved-amount">Approved Amount</Label>
                  <Input
                    id="approved-amount"
                    type="number"
                    step="0.01"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    max={reviewingRequest.request_amount}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: ${reviewingRequest.request_amount.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review-notes">
                  {reviewAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Add any notes about this approval...'
                      : 'Explain why this request is being rejected...'
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewingRequest(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
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
              <DialogTitle>Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={viewingReceipt}
                alt="Receipt"
                className="w-full h-auto max-h-[600px] object-contain"
              />
              <Button asChild variant="outline" className="w-full">
                <a href={viewingReceipt} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
