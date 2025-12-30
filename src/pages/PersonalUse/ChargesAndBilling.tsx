import {
  CurrencyDollar,
  Receipt,
  Calendar,
  Download,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  Warning,
  TrendUp
} from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import logger from '@/utils/logger'

interface ChargeRecord {
  id: string
  driver_id: string
  driver_name?: string
  charge_period: string
  charge_period_start: string
  charge_period_end: string
  miles_charged: number
  rate_per_mile: number
  total_charge: number
  charge_status: string
  payment_method?: string
  paid_at?: string
  invoice_number?: string
  invoice_date?: string
  due_date?: string
}

interface BillingSummary {
  total_pending: number
  total_billed: number
  total_paid: number
  total_overdue: number
  period_count: number
}

interface InvoiceData {
  charge_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
}

interface ApiResponse<T> {
  data: T
}

const apiClient = async <T>(url: string): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json() as Promise<ApiResponse<T>>
}

const apiMutation = async (url: string, method: string, data?: unknown) => {
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

export function ChargesAndBilling() {
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [driverFilter, setDriverFilter] = useState<string>('')
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    charge_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const getChargesParams = () => {
    const params = new URLSearchParams()
    if (selectedPeriod !== 'all') params.append('charge_period', selectedPeriod)
    if (statusFilter !== 'all') params.append('charge_status', statusFilter)
    return params.toString()
  }

  const { data: chargesData, isLoading: loading } = useQuery({
    queryKey: ['personal-use-charges', selectedPeriod, statusFilter],
    queryFn: () => apiClient<ChargeRecord[]>(`/api/personal-use-charges?${getChargesParams()}`),
    staleTime: 30000,
    gcTime: 60000,
    onError: (error: unknown) => {
      logger.error('Failed to fetch charges:', error)
      toast.error('Failed to load billing data')
    }
  })

  const { data: summaryData } = useQuery({
    queryKey: ['personal-use-charges-summary'],
    queryFn: () => apiClient<BillingSummary>('/api/personal-use-charges/summary'),
    staleTime: 30000,
    gcTime: 60000
  })

  const charges = chargesData?.data || []
  const summary = summaryData?.data || null

  const handleGenerateInvoice = (charge: ChargeRecord) => {
    const nextInvoiceNumber = `INV-${Date.now()}`
    setInvoiceData({
      charge_id: charge.id,
      invoice_number: nextInvoiceNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setInvoiceDialogOpen(true)
  }

  const { mutate: generateInvoice, isPending: isGeneratingInvoice } = useMutation({
    mutationFn: async () => {
      return apiMutation(
        `/api/personal-use-charges/${invoiceData.charge_id}`,
        'PATCH',
        {
          charge_status: 'invoiced',
          invoice_number: invoiceData.invoice_number,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date
        }
      )
    },
    onSuccess: () => {
      toast.success(`Invoice ${invoiceData.invoice_number} generated`)
      setInvoiceDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['personal-use-charges'] })
    },
    onError: (error: unknown) => {
      logger.error('Failed to generate invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice')
    }
  })

  const { mutate: markPaid, isPending: isMarkingPaid } = useMutation({
    mutationFn: async (chargeId: string) => {
      return apiMutation(
        `/api/personal-use-charges/${chargeId}`,
        'PATCH',
        {
          charge_status: 'paid',
          paid_at: new Date().toISOString()
        }
      )
    },
    onSuccess: () => {
      toast.success('Charge marked as paid')
      queryClient.invalidateQueries({ queryKey: ['personal-use-charges'] })
    },
    onError: (error: unknown) => {
      logger.error('Failed to mark as paid:', error)
      toast.error('Failed to update charge status')
    }
  })

  const handleDownloadInvoice = async (charge: ChargeRecord) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/personal-use-charges/${charge.id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) throw new Error('Failed to download invoice')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${charge.invoice_number || 'invoice'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error: unknown) {
      logger.error('Failed to download invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const submitInvoice = () => {
    generateInvoice()
  }

  const filteredCharges = charges.filter((charge) => {
    if (driverFilter && charge.driver_name && !charge.driver_name.toLowerCase().includes(driverFilter.toLowerCase())) {
      return false
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
      invoiced: { variant: 'secondary', icon: FileText, label: 'Invoiced' },
      billed: { variant: 'default', icon: Receipt, label: 'Billed' },
      paid: { variant: 'default', icon: CheckCircle, label: 'Paid' },
      waived: { variant: 'secondary', icon: CheckCircle, label: 'Waived' }
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

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CurrencyDollar className="w-8 h-8" />
          Charges & Billing
        </h1>
        <p className="text-muted-foreground">
          Manage personal use charges, invoicing, and payment tracking
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Charges</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total_pending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total_billed.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Invoiced, awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total_paid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Warning className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${summary.total_overdue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Billing Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value={format(new Date(), 'yyyy-MM')}>Current Month</SelectItem>
                  <SelectItem value={format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM')}>
                    Last Month
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="billed">Billed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
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
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['personal-use-charges'] })} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges Table */}
      <Tabs defaultValue="charges">
        <TabsList>
          <TabsTrigger value="charges">
            <Receipt className="w-4 h-4 mr-2" />
            Charge Records
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <CardTitle>Charge Records</CardTitle>
              <CardDescription>{filteredCharges.length} charges</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No charges found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Miles</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.map((charge) => (
                      <TableRow key={charge.id} className={isOverdue(charge.due_date) ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div className="font-medium">{charge.driver_name || 'Unknown Driver'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {charge.charge_period}
                          </div>
                        </TableCell>
                        <TableCell>{charge.miles_charged}</TableCell>
                        <TableCell>${charge.rate_per_mile.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${charge.total_charge.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(charge.charge_status)}</TableCell>
                        <TableCell>{charge.invoice_number || '-'}</TableCell>
                        <TableCell>{charge.due_date || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {charge.charge_status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateInvoice(charge)}
                              >
                                Generate Invoice
                              </Button>
                            )}
                            {charge.charge_status === 'invoiced' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markPaid(charge.id)}
                                disabled={isMarkingPaid}
                              >
                                Mark as Paid
                              </Button>
                            )}
                            {charge.invoice_number && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadInvoice(charge)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
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

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Billing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics and reporting features coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for this personal use charge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceData.invoice_number}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoiceData.due_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitInvoice} disabled={isGeneratingInvoice}>
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}