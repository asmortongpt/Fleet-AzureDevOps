/**
 * Document Management System - Type Definitions
 * Comprehensive type system for document storage, OCR, and AI features
 */

export type DocumentType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'code'
  | 'archive'
  | '3d-model'
  | 'other';

export type FileCategory =
  | 'incident-reports'
  | 'evidence'
  | 'vehicle-docs'
  | 'maintenance'
  | 'contracts'
  | 'insurance'
  | 'legal'
  | 'personal'
  | 'uncategorized';

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'archived';

export type ViewMode = 'grid' | 'list' | 'timeline';

export type SortField = 'name' | 'date' | 'size' | 'type' | 'modified' | 'relevance';

export type SortOrder = 'asc' | 'desc';

export interface DocumentMetadata {
  id: string;
  name: string;
  type: DocumentType;
  category: FileCategory;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
  modifiedAt: Date;
  uploadedBy: string;
  status: DocumentStatus;

  // Folder/hierarchy
  folderId?: string;
  folderPath?: string;

  // Tags and classification
  tags: string[];
  aiTags?: string[];

  // OCR and AI processing
  ocrText?: string;
  ocrConfidence?: number;
  aiSummary?: string;
  aiInsights?: string[];
  embedding?: number[];

  // File-specific metadata
  dimensions?: { width: number; height: number };
  duration?: number;
  pageCount?: number;

  // EXIF/Media metadata
  exif?: Record<string, any>;
  location?: { lat: number; lng: number };
  capturedAt?: Date;

  // Sharing and permissions
  isShared: boolean;
  sharedWith?: string[];
  permissions?: DocumentPermissions;

  // Activity
  viewCount: number;
  downloadCount: number;
  lastViewedAt?: Date;

  // Version control
  version: number;
  previousVersionId?: string;
}

export interface DocumentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canComment: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  color?: string;
  icon?: string;
  documentCount: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  category?: string;
  isAiGenerated?: boolean;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  mentions?: string[];
  resolved?: boolean;

  // For PDF/Image annotations
  annotation?: {
    page?: number;
    position?: { x: number; y: number };
    highlight?: { start: number; end: number };
  };
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: 'created' | 'updated' | 'viewed' | 'downloaded' | 'shared' | 'commented' | 'tagged' | 'moved';
  timestamp: Date;
  details?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  uploadedBytes?: number;
  totalBytes?: number;
}

export interface SearchFilters {
  query?: string;
  types?: DocumentType[];
  categories?: FileCategory[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  uploadedBy?: string[];
  hasOcr?: boolean;
  hasAiInsights?: boolean;
  isShared?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  lastUsed?: Date;
}

export interface DocumentInsight {
  id: string;
  type: 'summary' | 'key-points' | 'entities' | 'sentiment' | 'classification' | 'related-docs';
  title: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  documentIds?: string[];
  citations?: Array<{
    documentId: string;
    page?: number;
    text: string;
  }>;
}

export interface Collaborator {
  userId: string;
  userName: string;
  userAvatar?: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline?: boolean;
  lastSeen?: Date;
  cursor?: { x: number; y: number };
}

export interface BulkOperation {
  operation: 'move' | 'delete' | 'tag' | 'share' | 'download' | 'archive';
  documentIds: string[];
  metadata?: {
    folderId?: string;
    tags?: string[];
    shareWith?: string[];
  };
}

export interface DocumentViewerState {
  zoom: number;
  rotation: number;
  currentPage?: number;
  scrollPosition?: number;
  annotations?: any[];
}
