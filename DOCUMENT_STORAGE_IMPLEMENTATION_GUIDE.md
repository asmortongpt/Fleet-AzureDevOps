# Document Storage System - Implementation Guide

Based on comprehensive Fleet codebase analysis, here are the key insights for implementing a document storage system.

## Executive Summary

The Fleet application already has:
- ✅ A comprehensive document management system with OCR and AI
- ✅ Database schema optimized for document storage
- ✅ File storage infrastructure (local filesystem + Azure Blob)
- ✅ Document processing pipeline
- ✅ RAG capabilities for semantic search

This guide outlines how to leverage and extend the existing system.

---

## Current Document System Architecture

### Database Foundation (`documents` table)
**140+ columns designed for comprehensive document metadata:**

#### Core File Information
- `document_number`, `document_name`, `original_filename`
- `file_size_bytes`, `mime_type`, `file_extension`
- `storage_path`, `storage_url`, `thumbnail_url`
- `is_encrypted` (ready for encryption support)

#### Upload Tracking
- `upload_method` (Web, Mobile Camera, Email, Scanner, API)
- `uploaded_by`, `uploaded_at`, `upload_device_info`

#### OCR & AI Processing
- `ocr_processed`, `ocr_provider`, `ocr_confidence_score`
- `ocr_raw_text`, `ocr_structured_data`, `ocr_language`
- `ai_detected_type`, `ai_confidence`, `ai_extracted_entities`
- `ai_tags`, `ai_summary`

#### Entity Linking
- `related_vehicle_id`, `related_driver_id`
- `related_maintenance_id`, `related_purchase_order_id`
- `related_incident_id`, `related_osha_case_id`
- `related_communication_id`

#### Financial Data
- `currency`, `total_amount`, `tax_amount`, `subtotal_amount`
- `payment_method`, `vendor_name`, `vendor_location`

#### Access & Security
- `is_confidential`, `access_restricted_to_roles`
- `requires_approval`, `approved_by`, `approved_at`

#### Version Control
- `version`, `parent_document_id`, `is_latest_version`

#### Lifecycle Management
- `status` (Active, Archived, Deleted, Under Review)
- `is_archived`, `archived_at`, `archived_by`
- `retention_until`, `is_legal_hold`, `legal_hold_reason`

#### Search & Indexing
- `full_text_search` (PostgreSQL TSVECTOR for FTS)

#### Audit Trail
- `created_at`, `updated_at`, `deleted_at`, `deleted_by`

### Supporting Tables

#### `document_categories`
- Hierarchical category structure
- Retention policies per category (2-30 years)
- UI metadata (icon, color)

#### `document_pages`
- Multi-page document support
- Per-page OCR and AI analysis
- Page-level bounding boxes

#### `receipt_line_items`
- Extracted items from receipts/invoices
- Product classification
- Approval workflow
- GL account mapping

#### `camera_capture_metadata`
- Mobile camera capture EXIF data
- Device and location information
- Image quality metrics

#### `document_processing_queue`
- Async job management
- Status tracking (Pending, Processing, Completed, Failed)
- Retry mechanism
- Job types: OCR, AI_Classification, Thumbnail, Virus_Scan, Entity_Extraction

#### `document_shares`
- Collaborative sharing with granular permissions
- Share tokens with expiration
- Public/private link sharing
- Access tracking

#### `document_comments`
- Annotations and discussions
- Comment threading
- Resolution tracking

#### `document_audit_log`
- Comprehensive action logging
- User tracking with IP/device
- Change history (old_values, new_values)

#### `ocr_corrections`
- User feedback for OCR training
- Correction history

---

## File Storage Options

### Option 1: Local Filesystem (Current Default)
**Location**: `/uploads/documents/{tenantId}/{filename}`
**Best for**: Development, single-server deployments
**Service**: `DocumentManagementService`

```typescript
// Key methods:
uploadDocument(options)         // Save file and create DB record
extractText(filePath, mimeType) // OCR text extraction
processDocumentAsync()          // Async pipeline
```

### Option 2: Azure Blob Storage (Production-Ready)
**Service**: `AttachmentService`
**Containers**:
- `teams-files` - Teams document uploads
- `email-attachments` - Outlook attachments
- `communication-files` - General documents

**Features**:
- SAS token generation for secure URLs
- Chunked upload (4MB chunks)
- Thumbnail generation via Sharp
- File size limits configurable
- Virus scanning infrastructure

```typescript
// Key dependencies:
import { BlobServiceClient } from '@azure/storage-blob'
import sharp from 'sharp' // for thumbnails
```

### Option 3: Hybrid Approach (Recommended)
- **Small files** (<50MB): Local filesystem or Azure Blob
- **Large files** (>50MB): Azure Blob with streaming
- **Temporary files**: Local temp storage with cleanup
- **Thumbnails**: Always in blob storage for CDN

---

## API Endpoints for Document Management

### Upload & Management
```
POST   /api/documents/upload              - Upload new document
GET    /api/documents                     - List with filters
GET    /api/documents/{id}                - Get document detail
PUT    /api/documents/{id}                - Update metadata
DELETE /api/documents/{id}                - Soft delete
GET    /api/documents/{id}/access-log     - Audit trail
```

### Categories
```
GET    /api/documents/categories          - List categories
POST   /api/documents/categories          - Create category
```

### Analytics
```
GET    /api/documents/statistics          - Usage statistics
```

### RAG & Search
```
POST   /api/documents/search              - Semantic search
POST   /api/documents/ask                 - RAG Q&A
```

### Attachments (Separate Service)
```
POST   /api/attachments/upload            - Multi-file upload
GET    /api/attachments/{id}              - Get attachment
DELETE /api/attachments/{id}              - Delete attachment
```

---

## OCR & AI Processing Pipeline

### Supported Providers
1. **Tesseract** - Open source, no cost
2. **Google Cloud Vision** - High accuracy
3. **AWS Textract** - Document-specific OCR
4. **Azure Computer Vision** - Microsoft ecosystem integration

### Processing Flow
```
Upload → Validation → Storage → Queue Job
                        ↓
                  Process OCR (if needed)
                        ↓
                  Extract Text & Entities
                        ↓
                  Generate AI Summary
                        ↓
                  Create Embeddings for RAG
                        ↓
                  Update Document Status
```

### Database Columns for Status Tracking
- `ocr_status`: 'pending' | 'processing' | 'completed' | 'failed'
- `ocr_confidence_score`: 0-1 confidence level
- `ocr_raw_text`: Complete extracted text
- `ocr_structured_data`: JSON with vendor, date, amount, items

- `embedding_status`: 'pending' | 'processing' | 'completed' | 'failed'

---

## Frontend Components

### Current Components
- **DocumentManagement.tsx** - Main document UI
- **DocumentQA.tsx** - RAG Q&A interface

### Key Features Implemented
- Upload form with drag-and-drop
- Category management
- Search and filtering
- Document preview
- Access log viewer
- Statistics dashboard

### Customization Points
1. **Upload handler**: `apiClient.documents.upload(file, metadata)`
2. **Filter options**: categoryId, tags, dateRange, uploadedBy
3. **Display format**: Table, grid, or timeline view
4. **Preview types**: PDF viewer, image gallery, document viewer

---

## Authentication & Authorization

### JWT Implementation
- Token-based API authentication
- User context injection: `req.user`
- Tenant isolation via `tenant_id`
- Role-based access control

### Database Relationships
- `documents.uploaded_by` → `drivers.id`
- `documents.access_restricted_to_roles` → Array of role strings
- `document_shares.shared_with_user_id` → `drivers.id`

### Permission Levels
- `can_view` - Read-only access
- `can_download` - Download file
- `can_edit` - Modify metadata
- `can_delete` - Soft delete
- `can_reshare` - Share with others

---

## Performance Optimization

### Database Indexes (21 indexes implemented)
```sql
idx_documents_category        -- Filter by category
idx_documents_type            -- Filter by type
idx_documents_date            -- Sort by date
idx_documents_uploaded_by      -- Filter by uploader
idx_documents_status          -- Filter by status
idx_documents_fulltext        -- Full-text search
idx_documents_ocr_text        -- OCR text search
idx_documents_ai_tags         -- Tag filtering
```

### Query Optimization
- Use pagination (LIMIT/OFFSET)
- Filter before counting
- Lazy load thumbnails
- Cache category list
- Debounce search requests

### File Storage Optimization
- Chunked uploads (4MB chunks)
- Thumbnail generation and caching
- Gzip compression for text files
- CDN delivery for static assets

---

## Integration Examples

### Upload with OCR
```typescript
const uploadResult = await documentService.uploadDocument({
  tenantId: 'tenant-1',
  userId: 'user-123',
  file: {
    originalname: 'receipt.pdf',
    mimetype: 'application/pdf',
    size: 1024000,
    buffer: fileBuffer
  },
  categoryId: 'receipts',
  tags: ['fuel', 'vendor-123'],
  description: 'Fuel receipt from Shell',
  metadata: { vehicleId: 'vehicle-1' }
})

// Processing happens asynchronously
// Poll status or use webhooks to get completion notification
```

### Search with RAG
```typescript
const results = await documentService.searchWithRAG(
  tenantId,
  'What was the total fuel spending in October?',
  { categoryId: 'receipts' }
)
// Returns: [
//   { document_id: '...', relevance_score: 0.95, ... }
// ]
```

### Access Control
```typescript
// Share document with specific user
await documentService.shareDocument(documentId, tenantId, {
  shared_with_user_id: 'user-456',
  can_view: true,
  can_download: true,
  can_edit: false
})

// Generate public link
const shareToken = generateSecureToken()
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```

---

## Deployment Considerations

### Environment Variables Required
```bash
# Database
DB_HOST=fleet-postgres-service
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<secure>

# File Storage
DOCUMENT_UPLOAD_DIR=/uploads/documents  # Or Azure config
AZURE_STORAGE_CONNECTION_STRING=<if using Azure>

# OCR Service
OCR_PROVIDER=tesseract|google|aws|azure
OCR_API_KEY=<if required>

# AI Service
OPENAI_API_KEY=<for summaries and entity extraction>
ANTHROPIC_API_KEY=<alternative>
```

### Kubernetes Considerations
- Document processing pods may need more memory
- Persistent storage for uploads (PVC)
- Job pods for async processing
- Resource limits for OCR jobs

### Monitoring
- Document upload success rate
- OCR processing time
- Failed processing jobs
- File storage usage
- Access patterns

---

## Migration Path for Existing Documents

### If importing from legacy system:
1. Create migration script to populate documents table
2. Import files to storage location
3. Update file hashes for integrity
4. Queue OCR processing for imported documents
5. Verify audit trail entries

### Backup & Recovery
- Daily backups of documents table
- File storage backups (Azure geo-redundancy)
- Point-in-time recovery for database
- Retention policy enforcement

---

## Next Steps for Implementation

### Phase 1: Foundation (Week 1-2)
- [ ] Review existing document schema
- [ ] Set up OCR provider (start with Tesseract)
- [ ] Configure file storage (Azure Blob or local)
- [ ] Deploy document processing queue

### Phase 2: Enhancement (Week 3-4)
- [ ] Implement AI classification
- [ ] Add RAG capabilities
- [ ] Build document search interface
- [ ] Add sharing and access controls

### Phase 3: Optimization (Week 5-6)
- [ ] Performance tuning (indexes, caching)
- [ ] Full-text search optimization
- [ ] Thumbnail generation
- [ ] API rate limiting

### Phase 4: Production (Week 7-8)
- [ ] Security audit
- [ ] Load testing
- [ ] Disaster recovery plan
- [ ] Documentation

---

## Key Files for Document Storage

### Backend Services
- `/api/src/services/document-management.service.ts` - Core service
- `/api/src/services/attachment.service.ts` - Azure integration
- `/api/src/services/document-rag.service.ts` - RAG/search
- `/api/src/services/ai-ocr.ts` - OCR processing

### API Routes
- `/api/src/routes/documents.routes.ts` - Document endpoints
- `/api/src/routes/documents.ts` - Additional document routes
- `/api/src/routes/attachments.routes.ts` - Attachment endpoints

### Database
- `/api/src/migrations/023_document_management_ocr.sql` - Schema

### Frontend
- `/src/components/modules/DocumentManagement.tsx` - Main UI
- `/src/components/modules/DocumentQA.tsx` - Search UI

### Configuration
- Environment variables in `.env.staging`, `.env.production.template`
- Database pool configuration in `/api/src/config/database.ts`

---

## Success Criteria

✅ Documents uploaded and stored securely
✅ OCR processing completes successfully
✅ Full-text search works across documents
✅ RAG-powered Q&A answers document-related queries
✅ Document sharing works with proper access control
✅ Audit trail tracks all document actions
✅ File storage optimized with proper indexing
✅ Performance metrics within acceptable ranges
✅ Backup and recovery procedures verified
✅ Security audit passed

