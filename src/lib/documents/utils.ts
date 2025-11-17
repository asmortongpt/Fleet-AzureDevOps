/**
 * Document Management System - Utilities
 * Helper functions for document handling, formatting, and validation
 */

import { DocumentType, DocumentMetadata } from './types';

/**
 * File type detection based on MIME type or extension
 */
export function getDocumentType(mimeType: string, fileName: string): DocumentType {
  const mime = mimeType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // PDF
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';

  // Images
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
    return 'image';
  }

  // Videos
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) {
    return 'video';
  }

  // Audio
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }

  // Documents (Word, text)
  if (mime.includes('word') || mime.includes('document') ||
      ['doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext)) {
    return 'document';
  }

  // Spreadsheets
  if (mime.includes('sheet') || mime.includes('excel') ||
      ['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) {
    return 'spreadsheet';
  }

  // Presentations
  if (mime.includes('presentation') || mime.includes('powerpoint') ||
      ['ppt', 'pptx', 'key', 'odp'].includes(ext)) {
    return 'presentation';
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'go', 'rs', 'rb', 'php',
       'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'md', 'sql'].includes(ext)) {
    return 'code';
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return 'archive';
  }

  // 3D Models
  if (['stl', 'obj', 'fbx', 'gltf', 'glb', '3ds'].includes(ext)) {
    return '3d-model';
  }

  return 'other';
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;

  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
}

/**
 * Get icon name for document type
 */
export function getDocumentIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    'pdf': 'file-pdf',
    'image': 'image',
    'video': 'video',
    'audio': 'music',
    'document': 'file-text',
    'spreadsheet': 'table',
    'presentation': 'presentation',
    'code': 'code',
    'archive': 'archive',
    '3d-model': 'box',
    'other': 'file',
  };

  return icons[type] || 'file';
}

/**
 * Get color for document type
 */
export function getDocumentColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    'pdf': 'text-red-500',
    'image': 'text-blue-500',
    'video': 'text-purple-500',
    'audio': 'text-pink-500',
    'document': 'text-blue-600',
    'spreadsheet': 'text-green-600',
    'presentation': 'text-orange-500',
    'code': 'text-gray-700 dark:text-gray-300',
    'archive': 'text-yellow-600',
    '3d-model': 'text-indigo-500',
    'other': 'text-gray-500',
  };

  return colors[type] || 'text-gray-500';
}

/**
 * Generate thumbnail URL (placeholder)
 */
export function getThumbnailUrl(document: DocumentMetadata): string {
  if (document.thumbnailUrl) return document.thumbnailUrl;

  // Fallback based on type
  const placeholders: Record<DocumentType, string> = {
    'pdf': '/placeholders/pdf.svg',
    'image': document.url, // Use original for images
    'video': '/placeholders/video.svg',
    'audio': '/placeholders/audio.svg',
    'document': '/placeholders/document.svg',
    'spreadsheet': '/placeholders/spreadsheet.svg',
    'presentation': '/placeholders/presentation.svg',
    'code': '/placeholders/code.svg',
    'archive': '/placeholders/archive.svg',
    '3d-model': '/placeholders/3d.svg',
    'other': '/placeholders/file.svg',
  };

  return placeholders[document.type] || '/placeholders/file.svg';
}

/**
 * Validate file for upload
 */
export function validateFile(file: File, options?: {
  maxSize?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 100 * 1024 * 1024; // 100MB default

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(maxSize)}`,
    };
  }

  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const fileType = getDocumentType(file.type, file.name);
    if (!options.allowedTypes.includes(fileType)) {
      return {
        valid: false,
        error: `File type ${fileType} is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Extract file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if document can be previewed
 */
export function canPreview(document: DocumentMetadata): boolean {
  const previewableTypes: DocumentType[] = [
    'pdf',
    'image',
    'video',
    'audio',
    'document',
    'spreadsheet',
    'presentation',
    'code',
    '3d-model',
  ];

  return previewableTypes.includes(document.type);
}

/**
 * Generate unique file ID
 */
export function generateFileId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse folder path to breadcrumb items
 */
export function parseFolderPath(path: string): Array<{ name: string; path: string }> {
  if (!path || path === '/') return [{ name: 'Root', path: '/' }];

  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Root', path: '/' }];

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    breadcrumbs.push({ name: part, path: currentPath });
  }

  return breadcrumbs;
}

/**
 * Filter documents based on search filters
 */
export function filterDocuments(
  documents: DocumentMetadata[],
  filters: {
    query?: string;
    types?: DocumentType[];
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }
): DocumentMetadata[] {
  return documents.filter((doc) => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = `${doc.name} ${doc.ocrText || ''} ${doc.aiSummary || ''} ${doc.tags.join(' ')}`.toLowerCase();
      if (!searchText.includes(query)) return false;
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(doc.type)) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => doc.tags.includes(tag))) return false;
    }

    // Date range
    if (filters.dateFrom && doc.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && doc.createdAt > filters.dateTo) return false;

    return true;
  });
}

/**
 * Sort documents
 */
export function sortDocuments(
  documents: DocumentMetadata[],
  field: 'name' | 'date' | 'size' | 'type',
  order: 'asc' | 'desc' = 'asc'
): DocumentMetadata[] {
  const sorted = [...documents].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length === 1) return fileName;
  return parts.slice(0, -1).join('.');
}

/**
 * Generate color for tag
 */
export function generateTagColor(tagName: string): string {
  const colors = [
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  ];

  // Generate consistent color based on tag name
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
