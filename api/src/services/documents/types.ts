// Document Management System - Type Definitions
// Enterprise-grade document management with OCR, smart indexing, and AI features

export interface Document {
  id: string
  title: string
  description?: string
  filename: string
  originalFilename: string
  mimeType: string
  fileSize: number // bytes
  storageUrl: string
  thumbnailUrl?: string

  // Classification
  category: DocumentCategory
  subcategory?: string
  documentType: DocumentType
  tags: string[]

  // Content Analysis
  extractedText?: string // OCR or parsed text
  language?: string
  pageCount?: number
  wordCount?: number

  // Smart Indexing
  metadata: DocumentMetadata
  aiGeneratedSummary?: string
  aiExtractedEntities?: ExtractedEntity[]
  searchableContent?: string // Preprocessed for FTS

  // Versioning
  version: number
  isLatestVersion: boolean
  parentDocumentId?: string // For versions
  versionHistory?: DocumentVersion[]

  // Security & Access
  ownerId: string
  ownerName: string
  organizationId?: string
  departmentId?: string
  accessLevel: AccessLevel
  sharedWith?: DocumentShare[]
  encryptionKey?: string // For encrypted documents

  // Workflow
  status: DocumentStatus
  workflowState?: WorkflowState
  approvals?: DocumentApproval[]
  retentionPolicy?: RetentionPolicy
  expiresAt?: string

  // Audit
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  lastAccessedAt?: string
  lastAccessedBy?: string
  accessCount: number
  downloadCount: number

  // Compliance
  complianceFlags?: ComplianceFlag[]
  dataClassification?: DataClassification
  gdprCategory?: GDPRCategory
  retentionRequired?: boolean
  retentionUntil?: string
}

export type DocumentCategory =
  | 'vehicle-documents'
  | 'driver-documents'
  | 'maintenance-records'
  | 'compliance-documents'
  | 'financial-documents'
  | 'contracts'
  | 'policies'
  | 'reports'
  | 'invoices'
  | 'insurance'
  | 'permits-licenses'
  | 'inspection-reports'
  | 'incident-reports'
  | 'training-materials'
  | 'general'

export type DocumentType =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'image'
  | 'text'
  | 'presentation'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other'

export type AccessLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'private'

export type DocumentStatus =
  | 'draft'
  | 'pending-review'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived'
  | 'expired'
  | 'deleted'

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'highly-confidential'
  | 'restricted'

export type GDPRCategory =
  | 'personal-data'
  | 'sensitive-personal-data'
  | 'non-personal-data'

export interface DocumentMetadata {
  // Standard metadata
  author?: string
  creator?: string
  subject?: string
  keywords?: string[]
  creationDate?: string
  modificationDate?: string

  // Custom metadata (extensible)
  [key: string]: any
}

export interface ExtractedEntity {
  type: EntityType
  value: string
  confidence: number
  startOffset?: number
  endOffset?: number
  context?: string
}

export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'time'
  | 'money'
  | 'phone'
  | 'email'
  | 'url'
  | 'vin' // Vehicle Identification Number
  | 'license-plate'
  | 'driver-license'
  | 'invoice-number'
  | 'contract-number'
  | 'policy-number'

export interface DocumentVersion {
  versionNumber: number
  documentId: string
  storageUrl: string
  createdAt: string
  createdBy: string
  changeDescription?: string
  fileSize: number
}

export interface DocumentShare {
  userId?: string
  email?: string
  roleId?: string
  departmentId?: string
  permissions: DocumentPermission[]
  sharedAt: string
  sharedBy: string
  expiresAt?: string
}

export type DocumentPermission =
  | 'view'
  | 'download'
  | 'edit'
  | 'delete'
  | 'share'
  | 'approve'
  | 'comment'

export interface WorkflowState {
  workflowId: string
  workflowName: string
  currentStep: number
  totalSteps: number
  stepName: string
  assignedTo: string[]
  dueDate?: string
  notes?: string
}

export interface DocumentApproval {
  id: string
  approverId: string
  approverName: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  decidedAt?: string
  requiredBy?: string
}

export interface RetentionPolicy {
  policyId: string
  policyName: string
  retentionPeriod: number // days
  action: 'archive' | 'delete' | 'review'
  reason: string
}

export interface ComplianceFlag {
  type: 'PII' | 'PCI' | 'PHI' | 'CONFIDENTIAL' | 'EXPORT_CONTROLLED'
  detected: boolean
  confidence: number
  details?: string
}

// OCR Configuration
export interface OCRConfig {
  language: string | string[] // ISO 639-2 codes
  dpi?: number
  outputFormat?: 'text' | 'hocr' | 'pdf'
  preprocessImage?: boolean
  detectOrientation?: boolean
  rectangles?: OCRRectangle[]
}

export interface OCRRectangle {
  left: number
  top: number
  width: number
  height: number
}

export interface OCRResult {
  text: string
  confidence: number
  language?: string
  blocks?: OCRBlock[]
  words?: OCRWord[]
  symbols?: OCRSymbol[]
  orientation?: number
  processingTime: number
}

export interface OCRBlock {
  text: string
  confidence: number
  boundingBox: BoundingBox
  paragraphs: OCRParagraph[]
}

export interface OCRParagraph {
  text: string
  confidence: number
  boundingBox: BoundingBox
  words: OCRWord[]
}

export interface OCRWord {
  text: string
  confidence: number
  boundingBox: BoundingBox
  symbols?: OCRSymbol[]
}

export interface OCRSymbol {
  text: string
  confidence: number
  boundingBox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// Smart Indexing
export interface IndexingJob {
  id: string
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
  steps: IndexingStep[]
}

export interface IndexingStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message?: string
  startedAt?: string
  completedAt?: string
}

export interface DocumentIndex {
  documentId: string
  fullTextIndex: string
  metadataIndex: Record<string, any>
  entityIndex: ExtractedEntity[]
  semanticVector?: number[] // For semantic search
  topics?: string[]
  sentiment?: SentimentAnalysis
  lastIndexedAt: string
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  magnitude: number // 0 to infinity
  label: 'positive' | 'neutral' | 'negative'
  confidence: number
}

// Search
export interface DocumentSearchQuery {
  query?: string
  filters?: DocumentSearchFilters
  sort?: DocumentSearchSort
  pagination?: {
    page: number
    limit: number
  }
  includeContent?: boolean
  highlightMatches?: boolean
}

export interface DocumentSearchFilters {
  category?: DocumentCategory[]
  documentType?: DocumentType[]
  tags?: string[]
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'lastAccessedAt'
    from?: string
    to?: string
  }
  ownerId?: string[]
  status?: DocumentStatus[]
  accessLevel?: AccessLevel[]
  hasApprovals?: boolean
}

export interface DocumentSearchSort {
  field: string
  order: 'asc' | 'desc'
}

export interface DocumentSearchResult {
  documents: Document[]
  total: number
  page: number
  limit: number
  facets?: SearchFacets
  suggestions?: string[]
}

export interface SearchFacets {
  categories: FacetCount[]
  documentTypes: FacetCount[]
  tags: FacetCount[]
  owners: FacetCount[]
  statuses: FacetCount[]
}

export interface FacetCount {
  value: string
  count: number
}

// Document Analytics
export interface DocumentAnalytics {
  totalDocuments: number
  totalStorage: number // bytes
  documentsByCategory: Record<DocumentCategory, number>
  documentsByType: Record<DocumentType, number>
  recentUploads: number // last 7 days
  mostAccessed: Document[]
  mostDownloaded: Document[]
  averageFileSize: number
  storageGrowthRate: number // % per month
  pendingApprovals: number
  expiringDocuments: Document[]
}

// Bulk Operations
export interface BulkOperationRequest {
  operation: BulkOperationType
  documentIds: string[]
  parameters?: Record<string, any>
}

export type BulkOperationType =
  | 'delete'
  | 'archive'
  | 'update-category'
  | 'update-tags'
  | 'update-access-level'
  | 'reindex'
  | 'export'

export interface BulkOperationResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  errors: Array<{
    documentId: string
    error: string
  }>
}

// Document Templates
export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: DocumentCategory
  templateUrl: string
  fields: TemplateField[]
  createdAt: string
  createdBy: string
}

export interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  required: boolean
  defaultValue?: any
  options?: string[] // for select type
}
