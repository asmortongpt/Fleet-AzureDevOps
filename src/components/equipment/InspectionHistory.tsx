/**
 * InspectionHistory - Complete inspection documentation and history system
 * Features:
 * - Inspection checklist history
 * - Photo documentation
 * - Inspector notes and signatures
 * - Pass/Fail tracking
 * - Compliance reporting
 */

import { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Camera,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api-client'
import { isSuccessResponse } from '@/lib/schemas/responses'
import type { ApiResponse } from '@/lib/schemas/responses'
import logger from '@/utils/logger'
import { toast } from 'sonner'

interface InspectionChecklist {
  id: string
  equipment_id: string
  completed_date: string
  completed_by_name: string
  engine_hours_at_completion: number
  overall_status: 'pass' | 'fail' | 'conditional'
  inspector_name: string
  notes: string
  template_name: string
  responses: ChecklistResponse[]
}

interface ChecklistResponse {
  id: string
  item_description: string
  response: 'pass' | 'fail' | 'na'
  notes: string
  photo_url: string
}

interface InspectionHistoryProps {
  equipmentId: string
}

export function InspectionHistory({ equipmentId }: InspectionHistoryProps) {
  const [inspections, setInspections] = useState<InspectionChecklist[]>([])
  const [selectedInspection, setSelectedInspection] = useState<InspectionChecklist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInspectionHistory()
  }, [equipmentId])

  const fetchInspectionHistory = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<ApiResponse<{ checklists: InspectionChecklist[] }>>(
        `/api/heavy-equipment/${equipmentId}/inspection?limit=50`
      )

      if (isSuccessResponse(response) && response.data?.checklists) {
        setInspections(response.data.checklists)
      }
    } catch (error) {
      logger.error('Error fetching inspection history:', error)
      toast.error('Failed to load inspection history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'conditional':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      conditional: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getResponseBadge = (response: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      na: 'secondary'
    } as const

    return (
      <Badge variant={variants[response as keyof typeof variants] || 'secondary'} className="text-xs">
        {response.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const passedInspections = inspections.filter(i => i.overall_status === 'pass').length
  const failedInspections = inspections.filter(i => i.overall_status === 'fail').length
  const conditionalInspections = inspections.filter(i => i.overall_status === 'conditional').length
  const passRate = inspections.length > 0 ? (passedInspections / inspections.length) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Total Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedInspections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {passRate.toFixed(1)}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedInspections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Conditional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{conditionalInspections}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Inspection History</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Records</CardTitle>
              <CardDescription>Complete inspection history with details</CardDescription>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No inspection records found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Engine Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection) => (
                      <TableRow key={inspection.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(inspection.completed_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {inspection.inspector_name || inspection.completed_by_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {inspection.template_name || 'Standard Inspection'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {inspection.engine_hours_at_completion?.toFixed(1) || '-'} hrs
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(inspection.overall_status)}
                            {getStatusBadge(inspection.overall_status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedInspection(inspection)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Inspection Details</DialogTitle>
                                <DialogDescription>
                                  {new Date(inspection.completed_date).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedInspection && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Inspector</p>
                                      <p className="font-medium">
                                        {selectedInspection.inspector_name || selectedInspection.completed_by_name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedInspection.overall_status)}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Engine Hours</p>
                                      <p className="font-medium">
                                        {selectedInspection.engine_hours_at_completion?.toFixed(1) || '-'} hrs
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Template</p>
                                      <p className="font-medium">
                                        {selectedInspection.template_name || 'Standard'}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedInspection.notes && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                      <p className="text-sm bg-muted p-3 rounded">
                                        {selectedInspection.notes}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-semibold mb-3">Checklist Items</h4>
                                    <div className="space-y-2">
                                      {selectedInspection.responses?.map((response, idx) => (
                                        <Card key={idx}>
                                          <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <p className="font-medium">{response.item_description}</p>
                                                {response.notes && (
                                                  <p className="text-sm text-muted-foreground mt-1">
                                                    {response.notes}
                                                  </p>
                                                )}
                                                {response.photo_url && (
                                                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                                    <Camera className="w-4 h-4" />
                                                    Photo attached
                                                  </div>
                                                )}
                                              </div>
                                              <div className="ml-4">
                                                {getResponseBadge(response.response)}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )) || (
                                        <p className="text-sm text-muted-foreground">No detailed responses available</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Metrics</CardTitle>
              <CardDescription>Inspection compliance and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Pass Rate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Pass Rate</span>
                      <span className="font-bold text-green-600">{passRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${passRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recent Trend</h4>
                  <div className="text-center text-muted-foreground py-4">
                    Last 5 inspections:
                    <div className="flex justify-center gap-2 mt-2">
                      {inspections.slice(0, 5).map((insp, idx) => (
                        <div key={idx} title={new Date(insp.completed_date).toLocaleDateString()}>
                          {getStatusIcon(insp.overall_status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
