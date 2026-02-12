import { Filter, Search, AlertTriangle, Calendar, Car, Eye, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { damageReportsApi, DamageReport } from '@/services/damageReportsApi'
import logger from '@/utils/logger';

interface DamageReportListProps {
  vehicleId?: string
}

export function DamageReportList({ vehicleId }: DamageReportListProps) {
  const navigate = useNavigate()
  const [damageReports, setDamageReports] = useState<DamageReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modelStatusFilter, setModelStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchDamageReports()
  }, [currentPage, vehicleId, severityFilter, statusFilter, modelStatusFilter])

  const fetchDamageReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await damageReportsApi.getAll({
        page: currentPage,
        limit: 20,
        vehicle_id: vehicleId,
      })
      setDamageReports(response.data)
      setTotalPages(response.pagination.pages)
      setTotal(response.pagination.total)
    } catch (err) {
      setError('Failed to load damage reports')
      logger.error('Error fetching damage reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (reportId: string) => {
    navigate(`/damage-reports/${reportId}`)
  }

  const handleCreateNew = () => {
    navigate('/damage-reports/create')
  }

  const getSeverityVariant = (
    severity: string
  ): 'default' | 'secondary' | 'destructive' => {
    switch (severity) {
      case 'severe':
        return 'destructive'
      case 'moderate':
        return 'default'
      case 'minor':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getModelStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'processing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const filteredReports = damageReports.filter((report) => {
    const matchesSearch =
      searchQuery === '' ||
      report.damage_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.damage_location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSeverity =
      severityFilter === 'all' || report.damage_severity === severityFilter

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter

    const matchesModelStatus =
      modelStatusFilter === 'all' || report.triposr_status === modelStatusFilter

    return matchesSearch && matchesSeverity && matchesStatus && matchesModelStatus
  })

  if (loading && damageReports.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">Damage Reports</h2>
          <p className="text-muted-foreground">
            {total} {total === 1 ? 'report' : 'reports'} found
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search damage reports"
              />
            </div>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger aria-label="Filter by severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {/* 3D Model Status Filter */}
            <Select value={modelStatusFilter} onValueChange={setModelStatusFilter}>
              <SelectTrigger aria-label="Filter by 3D model status">
                <SelectValue placeholder="3D Model Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Model Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <div className="space-y-2">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No damage reports found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetails(report.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleViewDetails(report.id)
                }
              }}
              aria-label={`View details for damage report ${report.id}`}
            >
              <CardContent className="p-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="flex-1 space-y-3">
                    {/* Header with badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getSeverityVariant(report.damage_severity)}>
                        {report.damage_severity}
                      </Badge>
                      <Badge variant="outline">{report.status || 'open'}</Badge>
                      {report.triposr_status && (
                        <Badge variant={getModelStatusVariant(report.triposr_status)}>
                          3D: {report.triposr_status}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <p className="font-semibold text-sm">
                        {report.damage_description}
                      </p>
                      {report.damage_location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {report.damage_location}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {report.vehicle_id && (
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          <span>Vehicle {String(report.vehicle_id).slice(0, 8)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(report.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                      {report.photos && report.photos.length > 0 && (
                        <span>{report.photos.length} photos</span>
                      )}
                      {report.videos && report.videos.length > 0 && (
                        <span>{report.videos.length} videos</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-end md:justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(report.id)
                      }}
                      aria-label="View damage report details"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
