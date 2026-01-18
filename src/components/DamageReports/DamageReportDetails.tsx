import {
  ArrowLeft,
  Calendar,
  Car,
  User,
  MapPin,
  AlertTriangle,
  Edit,
  FileText,
  Wrench,
  Image as ImageIcon,
  Video,
  Box,
  Download,
  ExternalLink,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { DamageReport3DViewer } from './DamageReport3DViewer'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { damageReportsApi, DamageReport } from '@/services/damageReportsApi'

export function DamageReportDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<DamageReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchReportDetails()
    }
  }, [id])

  const fetchReportDetails = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const data = await damageReportsApi.getById(id)
      setReport(data)
    } catch (err) {
      setError('Failed to load damage report details')
      console.error('Error fetching damage report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/damage-reports/${id}/edit`)
  }

  const handleGenerateModel = async () => {
    if (!id || !report || !report.photos || report.photos.length === 0) {
      alert('Photos are required to generate a 3D model')
      return
    }

    try {
      await damageReportsApi.generateModel(id)
      alert('3D model generation started. This may take several minutes.')
      fetchReportDetails()
    } catch (err) {
      console.error('Error generating 3D model:', err)
      alert('Failed to start 3D model generation')
    }
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

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => navigate('/damage-reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error || 'Damage report not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate('/damage-reports')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h2 className="text-base font-bold tracking-tight">Damage Report</h2>
          <div className="flex items-center gap-2">
            <Badge variant={getSeverityVariant(report.damage_severity)}>
              {report.damage_severity}
            </Badge>
            <Badge variant="outline">{report.status || 'open'}</Badge>
            {report.triposr_status && (
              <Badge variant="secondary">3D: {report.triposr_status}</Badge>
            )}
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Report
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">
            Media ({(report.photos?.length || 0) + (report.videos?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="3d-model">3D Model</TabsTrigger>
          <TabsTrigger value="linked">Linked Records</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Damage Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{report.damage_description}</p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle ID</p>
                  <p className="font-medium">{report.vehicle_id}</p>
                </div>
                {report.damage_location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Damage Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{report.damage_location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Report Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.reported_by && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reported By</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{report.reported_by}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Report Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {new Date(report.created_at || '').toLocaleString()}
                    </p>
                  </div>
                </div>
                {report.updated_at && report.updated_at !== report.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(report.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-2">
          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos ({report.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Main Photo */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={report.photos[selectedPhotoIndex]}
                      alt={`Damage photo ${selectedPhotoIndex + 1}`}
                      className="h-full w-full object-contain"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => window.open(report.photos![selectedPhotoIndex], '_blank')}
                      aria-label="Open photo in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Photo Thumbnails */}
                  {report.photos.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {report.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${
                            index === selectedPhotoIndex
                              ? 'border-primary'
                              : 'border-transparent hover:border-muted-foreground'
                          }`}
                          aria-label={`View photo ${index + 1}`}
                        >
                          <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          {report.videos && report.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Videos ({report.videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.videos.map((video, index) => (
                    <div key={index} className="space-y-2">
                      <video
                        controls
                        className="w-full rounded-lg"
                        aria-label={`Damage video ${index + 1}`}
                      >
                        <source src={video} />
                        Your browser does not support the video tag.
                      </video>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Video
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!report.photos?.length && !report.videos?.length && (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No media files attached</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 3D Model Tab */}
        <TabsContent value="3d-model" className="space-y-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  3D Model
                </CardTitle>
                {!report.triposr_model_url && report.photos && report.photos.length > 0 && (
                  <Button onClick={handleGenerateModel} disabled={report.triposr_status === 'processing'}>
                    {report.triposr_status === 'processing' ? 'Generating...' : 'Generate 3D Model'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {report.triposr_status === 'processing' && (
                <div className="py-12 text-center space-y-2">
                  <div className="animate-spin mx-auto h-9 w-12 border-4 border-primary border-t-transparent rounded-full" />
                  <p className="text-muted-foreground">Generating 3D model...</p>
                  <p className="text-sm text-muted-foreground">This may take several minutes</p>
                </div>
              )}

              {report.triposr_status === 'completed' && report.triposr_model_url && (
                <DamageReport3DViewer modelUrl={report.triposr_model_url} />
              )}

              {report.triposr_status === 'failed' && (
                <div className="py-12 text-center">
                  <AlertTriangle className="h-9 w-12 mx-auto text-destructive mb-2" />
                  <p className="text-destructive">3D model generation failed</p>
                  <Button onClick={handleGenerateModel} variant="outline" className="mt-2">
                    Retry Generation
                  </Button>
                </div>
              )}

              {!report.triposr_status && (
                <div className="py-12 text-center">
                  <Box className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-2">No 3D model available</p>
                  {report.photos && report.photos.length > 0 && (
                    <Button onClick={handleGenerateModel}>Generate 3D Model from Photos</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linked Records Tab */}
        <TabsContent value="linked" className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Linked Work Order */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Linked Work Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.linked_work_order_id ? (
                  <div className="space-y-2">
                    <p className="font-medium">{report.linked_work_order_id}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/work-orders/${report.linked_work_order_id}`)
                      }
                    >
                      View Work Order
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No work order linked</p>
                )}
              </CardContent>
            </Card>

            {/* Linked Inspection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Linked Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.inspection_id ? (
                  <div className="space-y-2">
                    <p className="font-medium">{report.inspection_id}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/inspections/${report.inspection_id}`)}
                    >
                      View Inspection
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No inspection linked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
