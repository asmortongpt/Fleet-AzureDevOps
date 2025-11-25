/**
 * Document Storage Type Definitions
 * Comprehensive types for the Fleet document storage system
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum OCRStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NOT_NEEDED = 'not_needed'
}

export enum EmbeddingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum PermissionType {
  VIEW = 'view',
  EDIT = 'edit',
  ADMIN = 'admin'
}

export enum DocumentAction {
  VIEW = 'view',
  DOWNLOAD = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
  UPLOAD = 'upload',
  SHARE = 'share',
  RESTORE = 'restore',
  MOVE = 'move',
  COPY = 'copy',
  VERSION_CREATE = 'version_create',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke'
}

export enum EntityType {
  DOCUMENT = 'document',
  FOLDER = 'folder',
  PERMISSION = 'permission',
  VERSION = 'version',
  CATEGORY = 'category'
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial'
}

export enum StorageLocationType {
  LOCAL = 'local',
  S3 = 's3',
  AZURE_BLOB = 'azure_blob',
  GCP_STORAGE = 'gcp_storage'
}

export enum ShareType {
  PUBLIC = 'public',
  PASSWORD = 'password',
  TEMPORARY = 'temporary',
  EMAIL = 'email'
}

export enum RelationshipType {
  RELATED = 'related',
  SUPERSEDES = 'supersedes',
  REFERENCES = 'references',
  ATTACHMENT = 'attachment',
  VERSION = 'version'
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Document {
  id: string
  tenant_id: string
  parent_folder_id?: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  file_hash: string
  storage_location_id?: string
  category_id?: string
  tags?: string[]
  description?: string
  uploaded_by: string
  is_public: boolean
  version_number: number
  status: DocumentStatus
  metadata?: Record<string, any>
  extracted_text?: string
  ocr_status: OCRStatus
  ocr_completed_at?: Date
  embedding_status: EmbeddingStatus
  embedding_completed_at?: Date
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface DocumentFolder {
  id: string
  tenant_id: string
  parent_folder_id?: string
  folder_name: string
  description?: string
  color: string
  icon: string
  path: string
  depth: number
  is_system: boolean
  metadata?: Record<string, any>
  created_by?: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_url: string
  file_size: number
  file_hash: string
  uploaded_by: string
  change_notes?: string
  metadata?: Record<string, any>
  created_at: Date
}

export interface DocumentPermission {
  id: string
  document_id?: string
  folder_id?: string
  user_id?: string
  role?: string
  permission_type: PermissionType
  granted_by?: string
  granted_at: Date
  expires_at?: Date
}

export interface DocumentCategory {
  id: string
  tenant_id: string
  category_name: string
  description?: string
  color: string
  icon?: string
  created_at: Date
  updated_at: Date
}

export interface DocumentAuditLog {
  id: string
  tenant_id: string
  document_id?: string
  folder_id?: string
  user_id?: string
  action: string
  entity_type: EntityType
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  session_id?: string
  result: AuditResult
  error_message?: string
  metadata?: Record<string, any>
  created_at: Date
}

export interface DocumentStorageLocation {
  id: string
  tenant_id: string
  location_name: string
  location_type: StorageLocationType
  is_default: boolean
  is_active: boolean
  configuration: Record<string, any>
  capacity_bytes?: number
  used_bytes: number
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface DocumentShare {
  id: string
  document_id: string
  share_token: string
  share_type: ShareType
  password_hash?: string
  expires_at?: Date
  max_downloads?: number
  download_count: number
  allowed_emails?: string[]
  created_by?: string
  metadata?: Record<string, any>
  created_at: Date
  last_accessed_at?: Date
}

export interface DocumentAccessLog {
  id: string
  document_id: string
  user_id: string
  action: DocumentAction
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  accessed_at: Date
}

export interface DocumentRelationship {
  id: string
  source_document_id: string
  target_document_id: string
  relationship_type: RelationshipType
  notes?: string
  created_by?: string
  created_at: Date
}

export interface DocumentComment {
  id: string
  document_id: string
  user_id: string
  comment_text: string
  page_number?: number
  position?: Record<string, any>
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: Date
  parent_comment_id?: string
  created_at: Date
  updated_at: Date
}

export interface DocumentEmbedding {
  id: string
  document_id: string
  chunk_text: string
  chunk_index: number
  embedding: number[]
  chunk_type: string
  page_number?: number
  section_title?: string
  token_count?: number
  metadata?: Record<string, any>
  created_at: Date
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface UploadDocumentOptions {
  tenantId: string
  userId: string
  file: {
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
  }
  folderId?: string
  categoryId?: string
  tags?: string[]
  description?: string
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface UpdateDocumentOptions {
  file_name?: string
  description?: string
  category_id?: string
  tags?: string[]
  is_public?: boolean
  metadata?: Record<string, any>
  status?: DocumentStatus
  parent_folder_id?: string
}

export interface GetDocumentsFilters {
  folderId?: string
  categoryId?: string
  tags?: string[]
  search?: string
  status?: DocumentStatus
  uploadedBy?: string
  fileType?: string
  minSize?: number
  maxSize?: number
  createdAfter?: Date
  createdBefore?: Date
  includeDeleted?: boolean
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'file_name' | 'file_size'
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateFolderOptions {
  tenantId: string
  userId: string
  folder_name: string
  parent_folder_id?: string
  description?: string
  color?: string
  icon?: string
  metadata?: Record<string, any>
}

export interface UpdateFolderOptions {
  folder_name?: string
  description?: string
  color?: string
  icon?: string
  parent_folder_id?: string
  metadata?: Record<string, any>
}

export interface GrantPermissionOptions {
  documentId?: string
  folderId?: string
  userId?: string
  role?: string
  permissionType: PermissionType
  grantedBy: string
  expiresAt?: Date
}

export interface CreateVersionOptions {
  documentId: string
  userId: string
  file: {
    buffer: Buffer
    size: number
  }
  changeNotes?: string
  metadata?: Record<string, any>
}

export interface CreateShareOptions {
  documentId: string
  userId: string
  shareType: ShareType
  password?: string
  expiresAt?: Date
  maxDownloads?: number
  allowedEmails?: string[]
  metadata?: Record<string, any>
}

export interface AuditLogOptions {
  tenantId: string
  documentId?: string
  folderId?: string
  userId?: string
  action: string
  entityType: EntityType
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  result?: AuditResult
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface StorageAdapter {
  upload(file: Buffer, path: string, metadata?: Record<string, any>): Promise<string>
  download(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
  exists(path: string): Promise<boolean>
  getMetadata(path: string): Promise<Record<string, any>>
  copy(sourcePath: string, destPath: string): Promise<string>
  move(sourcePath: string, destPath: string): Promise<string>
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface DocumentWithMetadata extends Document {
  category_name?: string
  category_color?: string
  uploaded_by_name?: string
  folder_path?: string
  folder_name?: string
  version_count?: number
  comment_count?: number
  has_permissions?: boolean
}

export interface FolderWithMetadata extends DocumentFolder {
  document_count?: number
  subfolder_count?: number
  total_size?: number
  breadcrumb?: Array<{ id: string; folder_name: string; depth: number }>
}

export interface DocumentSearchResult {
  documents: DocumentWithMetadata[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface FolderContents {
  folder: FolderWithMetadata
  subfolders: FolderWithMetadata[]
  documents: DocumentWithMetadata[]
  breadcrumb: Array<{ id: string; folder_name: string; depth: number }>
}

export interface DocumentStatistics {
  total_documents: number
  total_size_bytes: number
  by_category: Array<{ category: string; color: string; count: number }>
  by_type: Array<{ file_type: string; count: number; total_size: number }>
  by_status: Array<{ status: string; count: number }>
  recent_uploads: number
  storage_usage: {
    used_bytes: number
    capacity_bytes?: number
    usage_percentage?: number
  }
}

export interface VersionHistory {
  current: DocumentVersion
  history: DocumentVersion[]
}

export interface PermissionSummary {
  user_permissions: DocumentPermission[]
  folder_permissions: DocumentPermission[]
  inherited_permissions: DocumentPermission[]
  effective_permission: PermissionType
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DocumentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'DocumentError'
  }
}

export class DocumentNotFoundError extends DocumentError {
  constructor(documentId: string) {
    super('Document not found: ${documentId}', 'DOCUMENT_NOT_FOUND', 404)
  }
}

export class FolderNotFoundError extends DocumentError {
  constructor(folderId: string) {
    super('Folder not found: ${folderId}', 'FOLDER_NOT_FOUND', 404)
  }
}

export class PermissionDeniedError extends DocumentError {
  constructor(action: string) {
    super('Permission denied for action: ${action}', 'PERMISSION_DENIED', 403)
  }
}

export class DuplicateDocumentError extends DocumentError {
  constructor(fileName: string) {
    super('Duplicate document: ${fileName}', 'DUPLICATE_DOCUMENT', 409)
  }
}

export class InvalidFolderHierarchyError extends DocumentError {
  constructor(message: string) {
    super(message, 'INVALID_FOLDER_HIERARCHY', 400)
  }
}

export class StorageQuotaExceededError extends DocumentError {
  constructor() {
    super('Storage quota exceeded', 'STORAGE_QUOTA_EXCEEDED', 413)
  }
}
