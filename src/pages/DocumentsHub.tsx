// Documents Hub - Enterprise Document Management
// Complete UI for upload, browse, search, preview, and manage documents

import {
  Upload,
  Search,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  Grid3x3,
  List,
  Calendar,
  User,
  FileStack
} from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HubPage } from '@/components/ui/hub-page'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/useToast'
import { logger } from '@/utils/logger'

// Types
interface Document {
  id: string
  title: string
  description?: string
  filename: string
  originalFilename: string
  mimeType: string
  fileSize: number
  category: string
  subcategory?: string
  tags: string[]
  status: string
  accessLevel: string
  ownerName: string
  createdAt: string
  updatedAt: string
  downloadCount: number
  aiGeneratedSummary?: string
}

interface DocumentAnalytics {
  totalDocuments: number
  totalStorage: number
  documentsByCategory: Record<string, number>
  recentUploads: number
  pendingApprovals: number
}

const CATEGORIES = [
  { value: 'vehicle-documents', label: 'Vehicle Documents' },
  { value: 'driver-documents', label: 'Driver Documents' },
  { value: 'maintenance-records', label: 'Maintenance Records' },
  { value: 'compliance-documents', label: 'Compliance Documents' },
  { value: 'financial-documents', label: 'Financial Documents' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'policies', label: 'Policies' },
  { value: 'reports', label: 'Reports' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'permits-licenses', label: 'Permits & Licenses' },
  { value: 'inspection-reports', label: 'Inspection Reports' },
  { value: 'incident-reports', label: 'Incident Reports' },
  { value: 'training-materials', label: 'Training Materials' },
  { value: 'general', label: 'General' }
]

const ACCESS_LEVELS = [
  { value: 'public', label: 'Public', color: 'bg-green-500' },
  { value: 'internal', label: 'Internal', color: 'bg-blue-500' },
  { value: 'confidential', label: 'Confidential', color: 'bg-yellow-500' },
  { value: 'restricted', label: 'Restricted', color: 'bg-orange-500' },
  { value: 'private', label: 'Private', color: 'bg-red-500' }
]

function DocumentsHub() {
  const { addToast } = useToast()

  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadMetadata, setUploadMetadata] = useState({
    title: '',
    description: '',
    category: 'general',
    subcategory: '',
    tags: '',
    accessLevel: 'internal'
  })

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)

      const searchBody = {
        query: searchQuery || undefined,
        filters: {
          category: categoryFilter !== 'all' ? [categoryFilter] : undefined,
          status: statusFilter !== 'all' ? [statusFilter] : undefined
        },
        pagination: {
          page: 1,
          limit: 100
        },
        sort: {
          field: 'updatedAt',
          order: 'desc'
        }
      }

      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchBody)
      })

      if (!response.ok) throw new Error('Failed to fetch documents')

      const data = await response.json()
      setDocuments(data.data?.documents || [])

    } catch (error) {
      console.error('Error fetching documents:', error)
      addToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter, addToast])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/documents/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      setAnalytics(data.data?.analytics || null)

    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [])

  // Upload document
  const handleUpload = async () => {
    if (!uploadFile) {
      addToast('Please select a file to upload', 'error')
      return
    }

    if (!uploadMetadata.title) {
      addToast('Please enter a document title', 'error')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadMetadata.title)
      formData.append('description', uploadMetadata.description)
      formData.append('category', uploadMetadata.category)
      formData.append('subcategory', uploadMetadata.subcategory)
      formData.append('tags', JSON.stringify(uploadMetadata.tags.split(',').map(t => t.trim()).filter(Boolean)))
      formData.append('accessLevel', uploadMetadata.accessLevel)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'current-user@example.com',
          'x-user-name': 'Current User'
        },
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      addToast('Document uploaded and indexed successfully'
      , 'success')

      setUploadDialogOpen(false)
      setUploadFile(null)
      setUploadMetadata({
        title: '',
        description: '',
        category: 'general',
        subcategory: '',
        tags: '',
        accessLevel: 'internal'
      })

      fetchDocuments()
      fetchAnalytics()

    } catch (error) {
      console.error('Upload error:', error)
      addToast(`Upload failed: ${(error as Error).message}`, 'error')
    }
  }

  // Preview document
  const handlePreview = (document: Document) => {
    setPreviewDocument(document)
    setPreviewOpen(true)
  }

  // Download document
  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      addToast(`Downloading ${filename}`, 'success')

    } catch (error) {
      console.error('Download error:', error)
      addToast(`Download failed: ${(error as Error).message}`, 'error')
    }
  }

  // Delete document
  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      addToast('Document has been permanently deleted', 'success')

      fetchDocuments()
      fetchAnalytics()

    } catch (error) {
      console.error('Delete error:', error)
      addToast(`Delete failed: ${(error as Error).message}`, 'error')
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchDocuments()
    fetchAnalytics()
  }, [fetchDocuments, fetchAnalytics])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'draft': { label: 'Draft', variant: 'secondary' },
      'approved': { label: 'Approved', variant: 'default' },
      'published': { label: 'Published', variant: 'default' },
      'archived': { label: 'Archived', variant: 'outline' },
      'pending-review': { label: 'Pending Review', variant: 'secondary' }
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <HubPage title="Documents Hub" icon={<FileStack className="w-6 h-6" />}>
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 flex-wrap">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Upload a new document with AI-powered indexing and OCR
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>File</Label>
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setUploadFile(file)
                            if (!uploadMetadata.title) {
                              setUploadMetadata(prev => ({
                                ...prev,
                                title: file.name.replace(/\.[^/.]+$/, '')
                              }))
                            }
                          }
                        }}
                      />
                      {uploadFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {uploadFile.name} ({formatFileSize(uploadFile.size)})
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={uploadMetadata.title}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Document title"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={uploadMetadata.description}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category *</Label>
                        <Select
                          value={uploadMetadata.category}
                          onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Access Level</Label>
                        <Select
                          value={uploadMetadata.accessLevel}
                          onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, accessLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCESS_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={uploadMetadata.tags}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={!uploadFile || !uploadMetadata.title}>
                        Upload & Index
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>

              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid/List */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading documents...
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No documents found. Upload your first document to get started.
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map(doc => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      {getFileIcon(doc.mimeType)}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc.id, doc.originalFilename)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(doc.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-sm line-clamp-2">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {doc.aiGeneratedSummary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.aiGeneratedSummary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {getStatusBadge(doc.status)}
                      <Badge variant="outline" className="text-xs">
                        {doc.category.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {doc.ownerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      <div>{formatFileSize(doc.fileSize)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getFileIcon(doc.mimeType)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{doc.title}</h3>
                            {doc.aiGeneratedSummary && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {doc.aiGeneratedSummary}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getStatusBadge(doc.status)}
                              <Badge variant="outline">{doc.category.replace('-', ' ')}</Badge>
                              {doc.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{formatFileSize(doc.fileSize)}</div>
                            <div>{new Date(doc.createdAt).toLocaleDateString()}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(doc)}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc.id, doc.originalFilename)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalDocuments}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatFileSize(analytics.totalStorage)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.recentUploads}</div>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.pendingApprovals}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Documents by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.documentsByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{category.replace('-', ' ')}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setPreviewDocument(null)
          }}
          document={{
            id: previewDocument.id,
            title: previewDocument.title,
            file_name: previewDocument.originalFilename,
            file_type: previewDocument.mimeType,
            file_size: previewDocument.fileSize,
            file_path: previewDocument.filename,
            content_text: previewDocument.aiGeneratedSummary
          }}
          downloadUrl={`/api/documents/${previewDocument.id}/download`}
        />
      )}
    </HubPage>
  )
}

const WrappedDocumentsHub = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      logger.error('DocumentsHub error', error, {
        component: 'DocumentsHub',
        errorInfo
      })
    }}
  >
    <DocumentsHub />
  </ErrorBoundary>
)

export default WrappedDocumentsHub
