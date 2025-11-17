/**
 * Document Management System - Component Exports
 * Comprehensive UI for document storage, OCR, and AI features
 */

// Main Views
export { DocumentExplorer } from './DocumentExplorer';
export { DocumentSidebar } from './DocumentSidebar';
export { DocumentUploader } from './DocumentUploader';
export { DocumentViewer } from './DocumentViewer';
export { DocumentGrid } from './DocumentGrid';
export { DocumentList } from './DocumentList';

// Viewers
export { PdfViewer } from './viewer/PdfViewer';
export { ImageViewer } from './viewer/ImageViewer';
export { VideoViewer } from './viewer/VideoViewer';
export { CodeViewer } from './viewer/CodeViewer';
export { OfficeViewer } from './viewer/OfficeViewer';
export { ThreeDViewer } from './viewer/3DViewer';

// Search
export { DocumentSearch } from './search/DocumentSearch';
export { SearchFilters } from './search/SearchFilters';
export { SavedSearches } from './search/SavedSearches';
export { SearchHistory } from './search/SearchHistory';

// Collaboration
export { DocumentComments } from './collaboration/DocumentComments';
export { DocumentSharing } from './collaboration/DocumentSharing';
export { DocumentActivity } from './collaboration/DocumentActivity';
export { DocumentCollaborators } from './collaboration/DocumentCollaborators';

// AI Features
export { DocumentChat } from './ai/DocumentChat';
export { DocumentInsights } from './ai/DocumentInsights';
export { DocumentClassification } from './ai/DocumentClassification';
export { SemanticSearch } from './ai/SemanticSearch';

// Organization
export { TagManager } from './TagManager';
export { FolderManager } from './FolderManager';
export { BulkActions } from './BulkActions';
export { DocumentProperties } from './DocumentProperties';
