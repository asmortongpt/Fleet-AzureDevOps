/**
 * DocumentsHub - Modern Document Management Dashboard
 * Real-time document tracking, library management, categories, and search with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense, useState } from 'react'
import {
  FileText as DocumentsIcon,
  FolderOpen,
  Upload,
  Search as SearchIcon,
  TrendingUp,
  Download,
  Eye,
  Trash2,
  Grid3x3,
  List,
  File,
  Image,
  Calendar,
  User,
  Database,
  CheckCircle,
  Clock,
  Archive,
  Tag,
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveDocumentsData } from '@/hooks/use-reactive-documents-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useToast } from '@/hooks/useToast'

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
  { value: 'general', label: 'General' },
]

const ACCESS_LEVELS = [
  { value: 'public', label: 'Public', color: 'bg-green-500' },
  { value: 'internal', label: 'Internal', color: 'bg-blue-500' },
  { value: 'confidential', label: 'Confidential', color: 'bg-yellow-500' },
  { value: 'restricted', label: 'Restricted', color: 'bg-orange-500' },
  { value: 'private', label: 'Private', color: 'bg-red-500' },
]

/**
 * Overview Tab - Document metrics and analytics
 */
function OverviewContent() {
  const {
    metrics,
    statusDistribution,
    fileTypeDistribution,
    uploadTrendData,
    topDownloadedDocuments,
    isLoading,
    lastUpdate,
  } = useReactiveDocumentsData()

  // Prepare chart data for status distribution
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'published'
        ? 'hsl(var(--success))'
        : name === 'pending-review'
          ? 'hsl(var(--warning))'
          : name === 'archived'
            ? 'hsl(var(--muted))'
            : 'hsl(var(--primary))',
  }))

  // Prepare chart data for file type distribution
  const fileTypeChartData = Object.entries(fileTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents Overview</h2>
          <p className="text-muted-foreground">
            Monitor document library status and usage analytics
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={metrics?.totalDocuments?.toString() || '0'}
          icon={FolderOpen}
          trend="neutral"
          description="All documents"
          loading={isLoading}
        />
        <StatCard
          title="Storage Used"
          value={formatFileSize(metrics?.totalStorage || 0)}
          icon={Database}
          trend="up"
          change={2.3}
          description="Total storage"
          loading={isLoading}
        />
        <StatCard
          title="Recent Uploads"
          value={metrics?.recentUploads?.toString() || '0'}
          icon={Upload}
          trend="up"
          change={+15}
          description="Last 7 days"
          loading={isLoading}
        />
        <StatCard
          title="Avg Downloads"
          value={metrics?.avgDownloads?.toString() || '0'}
          icon={Download}
          trend="neutral"
          description="Per document"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Status Distribution */}
        <ResponsivePieChart
          title="Document Status Distribution"
          description="Current status of all documents in the library"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* File Type Distribution */}
        <ResponsiveBarChart
          title="File Type Distribution"
          description="Documents grouped by file type"
          data={fileTypeChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Upload Trend Chart */}
      <ResponsiveLineChart
        title="Upload Trend"
        description="Monthly document uploads and storage growth"
        data={uploadTrendData}
        height={350}
        showArea
        loading={isLoading}
      />

      {/* Top Downloaded Documents */}
      {topDownloadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle>Top Downloaded Documents</CardTitle>
            </div>
            <CardDescription>Most accessed documents this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topDownloadedDocuments.map((doc, idx) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      {doc.mimeType.startsWith('image/') ? (
                        <Image className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.category.replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      {doc.downloadCount}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Library Tab - Document browsing and management
 */
function LibraryContent() {
  const { documents, isLoading, lastUpdate } = useReactiveDocumentsData()
  const { addToast } = useToast()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchQuery
      ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      draft: { label: 'Draft', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      published: { label: 'Published', variant: 'default' },
      archived: { label: 'Archived', variant: 'outline' },
      'pending-review': { label: 'Pending Review', variant: 'secondary' },
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Library</h2>
          <p className="text-muted-foreground">Browse and manage all fleet documents</p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap flex-1 sm:max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="pending-review">Pending Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No documents found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocuments.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    {getFileIcon(doc.mimeType)}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete">
                        <Trash2 className="h-4 w-4" />
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
                      {doc.category.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {doc.ownerName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                    <div>{formatFileSize(doc.fileSize)}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocuments.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
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
                          <Badge variant="outline">{doc.category.replace(/-/g, ' ')}</Badge>
                          {doc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{formatFileSize(doc.fileSize)}</div>
                        <div>{new Date(doc.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Button variant="ghost" size="icon" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Categories Tab - Category management and analytics
 */
function CategoriesContent() {
  const {
    categoryDetails,
    storageByCategoryData,
    categoryDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveDocumentsData()

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const totalCategories = Object.keys(categoryDistribution).length
  const mostUsedCategory = Object.entries(categoryDistribution).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Categories</h2>
          <p className="text-muted-foreground">Organize and manage document categories</p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={totalCategories.toString()}
          icon={FolderOpen}
          trend="neutral"
          description="Active categories"
          loading={isLoading}
        />
        <StatCard
          title="Most Used"
          value={mostUsedCategory?.[0].replace(/-/g, ' ') || 'N/A'}
          icon={TrendingUp}
          trend="up"
          description={`${mostUsedCategory?.[1] || 0} documents`}
          loading={isLoading}
        />
        <StatCard
          title="Avg Docs/Category"
          value={
            totalCategories > 0
              ? Math.round(
                  Object.values(categoryDistribution).reduce((a, b) => a + b, 0) / totalCategories
                ).toString()
              : '0'
          }
          icon={File}
          trend="neutral"
          description="Distribution"
          loading={isLoading}
        />
        <StatCard
          title="Empty Categories"
          value={(CATEGORIES.length - totalCategories).toString()}
          icon={Archive}
          trend="neutral"
          description="Unused categories"
          loading={isLoading}
        />
      </div>

      {/* Storage by Category Chart */}
      <ResponsiveBarChart
        title="Storage by Category"
        description="Storage usage across document categories (MB)"
        data={storageByCategoryData}
        height={350}
        loading={isLoading}
      />

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Document count and storage by category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {categoryDetails.map((category, idx) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {category.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{category.count} documents</span>
                      <span>{formatFileSize(category.totalSize)}</span>
                      <Badge variant="outline">
                        {new Date(category.lastUpdated).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${(category.count / categoryDetails.reduce((sum, c) => sum + c.count, 0)) * 100}%`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Search Tab - Advanced document search
 */
function SearchContent() {
  const { documents, isLoading, lastUpdate } = useReactiveDocumentsData()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')

  // Advanced filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchQuery
      ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.aiGeneratedSummary?.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    const matchesAccessLevel = accessLevelFilter === 'all' || doc.accessLevel === accessLevelFilter

    let matchesDateRange = true
    if (dateRangeFilter !== 'all') {
      const docDate = new Date(doc.createdAt)
      const now = new Date()
      switch (dateRangeFilter) {
        case 'today':
          matchesDateRange = docDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = docDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDateRange = docDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesCategory && matchesAccessLevel && matchesDateRange
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Search</h2>
          <p className="text-muted-foreground">Find documents with powerful search and filters</p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* Search Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Results"
          value={filteredDocuments.length.toString()}
          icon={SearchIcon}
          trend="neutral"
          description="Matching documents"
          loading={isLoading}
        />
        <StatCard
          title="Published"
          value={filteredDocuments.filter((d) => d.status === 'published').length.toString()}
          icon={CheckCircle}
          trend="neutral"
          description="Ready to use"
          loading={isLoading}
        />
        <StatCard
          title="Pending Review"
          value={filteredDocuments.filter((d) => d.status === 'pending-review').length.toString()}
          icon={Clock}
          trend="neutral"
          description="Awaiting approval"
          loading={isLoading}
        />
        <StatCard
          title="Archived"
          value={filteredDocuments.filter((d) => d.status === 'archived').length.toString()}
          icon={Archive}
          trend="neutral"
          description="Historical docs"
          loading={isLoading}
        />
      </div>

      {/* Advanced Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Use filters to narrow down your search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title, description, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Access Level</Label>
              <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Access Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results ({filteredDocuments.length})</CardTitle>
          <CardDescription>Documents matching your search criteria</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-2" />
              <p>No documents found matching your search criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{doc.title}</h3>
                      {doc.aiGeneratedSummary && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {doc.aiGeneratedSummary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{doc.category.replace(/-/g, ' ')}</Badge>
                        <Badge variant="secondary">{doc.accessLevel}</Badge>
                        {doc.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        <span>{doc.ownerName}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>
                          <Download className="inline h-3 w-3 mr-1" />
                          {doc.downloadCount} downloads
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main DocumentsHub Component
 */
export default function DocumentsHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DocumentsIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <OverviewContent />
        </ErrorBoundary>
      ),
    },
    {
      id: 'library',
      label: 'Library',
      icon: <FolderOpen className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading document library...</div>}>
            <LibraryContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <FolderOpen className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading categories...</div>}>
            <CategoriesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'search',
      label: 'Search',
      icon: <SearchIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading search...</div>}>
            <SearchContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Documents Hub"
      description="Document management, library, and search"
      icon={<DocumentsIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
