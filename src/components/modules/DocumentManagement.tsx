import { useState, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MagnifyingGlass,
  FileText,
  Download,
  Trash,
  Upload,
  Eye,
  Folder,
  FilePdf,
  FileDoc,
  FileImage,
  File,
  Tag,
  Clock,
  User as UserIcon,
  ChartBar
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  category_id?: string
  category_name?: string
  category_color?: string
  tags?: string[]
  description?: string
  uploaded_by: string
  uploaded_by_name?: string
  is_public: boolean
  version_number: number
  status: string
  extracted_text?: string
  ocr_status: string
  embedding_status: string
  created_at: string
  updated_at: string
  version_count?: number
  comment_count?: number
}

interface DocumentCategory {
  id: string
  category_name: string
  description?: string
  color: string
  icon?: string
  document_count?: number
}

interface DocumentStats {
  total_documents: number
  total_size_bytes: number
  by_category: Array<{ category: string; color: string; count: number }>
  by_type: Array<{ file_type: string; count: number; total_size: number }>
  recent_uploads: number
}

export function DocumentManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadData, setUploadData] = useState({
    categoryId: "",
    tags: "",
    description: "",
    isPublic: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // TanStack Query hooks
  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await apiClient.get<{ documents: Document[]; total: number }>('/documents')
      return response.documents || []
    }
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["documents", "categories"],
    queryFn: async () => {
      const response = await apiClient.get<{ categories: DocumentCategory[] }>('/documents/categories/all')
      return response.categories || []
    }
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["documents", "stats"],
    queryFn: async () => {
      const response = await apiClient.get<{ documents: DocumentStats }>('/documents/analytics/stats')
      return response.documents
    }
  })

  const loading = documentsLoading || categoriesLoading || statsLoading

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Please select a file')

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('categoryId', uploadData.categoryId)
      formData.append('tags', JSON.stringify(uploadData.tags.split(',').map(t => t.trim()).filter(t => t)))
      formData.append('description', uploadData.description)
      formData.append('isPublic', uploadData.isPublic.toString())

      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      setIsUploadDialogOpen(false)
      setUploadFile(null)
      setUploadData({ categoryId: "", tags: "", description: "", isPublic: false })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["documents", "stats"] })
    },
    onError: (error) => {
      console.error('Error uploading document:', error)
      toast.error('Failed to upload document')
    }
  })

  const handleFileUpload = async () => {
    await uploadMutation.mutateAsync()
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiClient.delete(`/documents/${documentId}`)
    },
    onSuccess: () => {
      toast.success('Document deleted successfully')
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      queryClient.invalidateQueries({ queryKey: ["documents", "stats"] })
    },
    onError: (error) => {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  })

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    deleteMutation.mutate(documentId)
  }

  const handleDownloadDocument = (document: Document) => {
    // In production, this would trigger actual download
    toast.info('Download started')
    window.open(`${import.meta.env.VITE_API_URL}${document.file_url}`, '_blank')
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePdf className="w-8 h-8 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileDoc className="w-8 h-8 text-blue-500" />
    if (fileType.includes('image')) return <FileImage className="w-8 h-8 text-green-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === "all" || doc.category_id === filterCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Management</h2>
          <p className="text-muted-foreground">Manage fleet documents with AI-powered search</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to your fleet library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {uploadFile ? (
                      <div>
                        <p className="font-medium">{uploadFile.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT, CSV, or Images</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={uploadData.categoryId}
                  onValueChange={(value) => setUploadData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="maintenance, policy, 2024"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Document description..."
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_uploads} uploaded this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.total_size_bytes)}</div>
              <p className="text-xs text-muted-foreground">Storage used</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Document types</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documents.filter(d => d.embedding_status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Searchable with AI</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.category_name} ({cat.document_count || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Manage and search your fleet documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No documents found. Upload your first document to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type)}
                        <div>
                          <div className="font-medium">{doc.file_name}</div>
                          {doc.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-md">
                              {doc.description}
                            </div>
                          )}
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {doc.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.category_name && (
                        <Badge style={{ backgroundColor: doc.category_color }}>
                          {doc.category_name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</div>
                        <div className="text-muted-foreground">{doc.uploaded_by_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {doc.embedding_status === 'completed' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            AI Ready
                          </Badge>
                        ) : doc.embedding_status === 'processing' ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Processing
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setIsDetailsDialogOpen(true)
                          }}
                          aria-label={`View details for ${doc.name}`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                          aria-label={`Download ${doc.name}`}
                        >
                          <Download className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          aria-label={`Delete ${doc.name}`}
                        >
                          <Trash className="w-4 h-4 text-red-500" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                {getFileIcon(selectedDocument.file_type)}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedDocument.file_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p>{formatFileSize(selectedDocument.file_size)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Version</Label>
                  <p>v{selectedDocument.version_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded By</Label>
                  <p>{selectedDocument.uploaded_by_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Upload Date</Label>
                  <p>{new Date(selectedDocument.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedDocument.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.extracted_text && (
                <div>
                  <Label className="text-muted-foreground">Extracted Text Preview</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-sm max-h-48 overflow-y-auto">
                    {selectedDocument.extracted_text.substring(0, 500)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
