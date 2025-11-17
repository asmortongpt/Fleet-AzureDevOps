# Attachment Service Documentation

## Overview

The Attachment Service provides comprehensive file attachment handling for Microsoft Teams and Outlook integration with Azure Blob Storage. It supports file uploads, downloads, virus scanning, thumbnail generation, and secure temporary access via SAS tokens.

## Features

- ✅ Azure Blob Storage integration
- ✅ Microsoft Teams file upload/download
- ✅ Outlook email attachments
- ✅ File type validation and security
- ✅ Virus scanning (placeholder for integration)
- ✅ Image thumbnail generation
- ✅ File compression
- ✅ SAS token generation for secure access
- ✅ Automatic cleanup of orphaned files
- ✅ Access logging and audit trail

## Environment Variables

```bash
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;

# Microsoft Graph API (for Teams & Outlook)
MS_GRAPH_CLIENT_ID=your-client-id
MS_GRAPH_CLIENT_SECRET=your-client-secret
MS_GRAPH_TENANT_ID=your-tenant-id
```

## File Size Limits

- **Teams files**: 25MB maximum
- **Outlook attachments**: 150MB maximum (with chunking)
- **General uploads**: 100MB maximum

## Allowed File Types

- Documents: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT
- Images: JPEG, PNG, GIF, WEBP, SVG
- Text: TXT, CSV
- Archives: ZIP

## Blocked File Types (Security)

`.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.vbs`, `.js`, `.jar`, `.app`, `.dmg`, `.scr`, `.com`, `.pif`, `.msi`, `.dll`, `.deb`, `.rpm`

## API Endpoints

### Azure Blob Storage

#### Upload File
```http
POST /api/attachments/upload
Content-Type: multipart/form-data

file: <file>
communicationId: <optional>
metadata: <optional JSON>
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "attachment": {
    "id": "123",
    "blobUrl": "https://...",
    "filename": "abc123.pdf",
    "size": 12345,
    "mimeType": "application/pdf",
    "thumbnailUrl": "https://..." // for images
  }
}
```

#### Upload Multiple Files
```http
POST /api/attachments/upload-multiple
Content-Type: multipart/form-data

files: <file1>, <file2>, ...
communicationId: <optional>
```

#### Download File
```http
GET /api/attachments/{blobId}/download
Authorization: Bearer <token>
```

Returns the file with appropriate Content-Type and Content-Disposition headers.

#### Generate SAS URL
```http
GET /api/attachments/{blobId}/sas-url?expiryMinutes=60
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sasUrl": "https://...?sv=2021-06-08&...",
  "expiresIn": "60 minutes"
}
```

#### Delete File
```http
DELETE /api/attachments/{blobId}
Authorization: Bearer <token>
```

### Microsoft Teams

#### Upload to Teams Channel
```http
POST /api/attachments/teams/{teamId}/channels/{channelId}/files
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
messageId: <optional>
```

#### Download from Teams
```http
GET /api/attachments/teams/{teamId}/channels/{channelId}/files/{fileId}
Authorization: Bearer <token>
```

### Outlook Email

#### Add Attachment to Email Draft
```http
POST /api/attachments/outlook/attachments
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
messageId: <message-id>
```

#### Send Email with Attachments
```http
POST /api/attachments/outlook/send-email
Content-Type: multipart/form-data
Authorization: Bearer <token>

to: recipient@example.com
subject: Email subject
body: <HTML content>
files: <file1>, <file2>, ...
cc: <optional>
bcc: <optional>
```

#### Download Email Attachment
```http
GET /api/attachments/outlook/messages/{messageId}/attachments/{attachmentId}
Authorization: Bearer <token>
```

### Management

#### List All Attachments
```http
GET /api/attachments?page=1&limit=50&scanStatus=clean
Authorization: Bearer <token>
```

#### Get Attachment Metadata
```http
GET /api/attachments/{id}
Authorization: Bearer <token>
```

#### Cleanup Orphaned Files (Admin Only)
```http
POST /api/attachments/cleanup/orphaned
Authorization: Bearer <token>

{
  "daysOld": 30
}
```

#### Get Statistics
```http
GET /api/attachments/stats/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "summary": {
    "total_attachments": 1523,
    "total_size_bytes": 1234567890,
    "clean_files": 1520,
    "pending_scans": 3,
    "infected_files": 0,
    "files_with_thumbnails": 432,
    "unique_file_types": 12
  },
  "by_type": [
    {
      "mime_type": "application/pdf",
      "count": 523,
      "total_size": 234567890
    }
  ]
}
```

## Service Methods

### uploadToAzure(file, metadata)
Uploads a file to Azure Blob Storage with automatic organization by date.

```typescript
const result = await attachmentService.uploadToAzure(req.file, {
  originalFilename: req.file.originalname,
  mimeType: req.file.mimetype,
  size: req.file.size,
  uploadedBy: userId,
  tenantId: tenantId,
  communicationId: 123
})
```

### downloadFromAzure(blobUrl)
Downloads a file from Azure Blob Storage.

```typescript
const buffer = await attachmentService.downloadFromAzure(blobUrl)
```

### deleteFromAzure(blobUrl)
Deletes a file from Azure Blob Storage.

```typescript
await attachmentService.deleteFromAzure(blobUrl)
```

### uploadToTeams(teamId, channelId, file, messageId?)
Uploads a file to a Microsoft Teams channel.

```typescript
const result = await attachmentService.uploadToTeams(
  'team-id',
  'channel-id',
  fileBuffer,
  'message-id' // optional
)
```

### downloadFromTeams(teamId, channelId, fileId)
Downloads a file from Microsoft Teams.

```typescript
const buffer = await attachmentService.downloadFromTeams(
  'team-id',
  'channel-id',
  'file-id'
)
```

### uploadToOutlook(messageId, file)
Adds an attachment to an Outlook email draft.

```typescript
await attachmentService.uploadToOutlook(messageId, file)
```

### sendEmailWithAttachment(email, files)
Sends an email with attachments via Outlook.

```typescript
await attachmentService.sendEmailWithAttachment(
  {
    to: ['user@example.com'],
    subject: 'Subject',
    body: '<p>HTML content</p>',
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com']
  },
  files
)
```

### downloadEmailAttachment(messageId, attachmentId)
Downloads an attachment from an Outlook email.

```typescript
const buffer = await attachmentService.downloadEmailAttachment(
  messageId,
  attachmentId
)
```

### getFileSasUrl(blobUrl, expiryMinutes)
Generates a time-limited SAS URL for secure file access.

```typescript
const sasUrl = await attachmentService.getFileSasUrl(blobUrl, 60) // 60 minutes
```

### scanFileForVirus(file)
Scans a file for viruses (placeholder for integration).

```typescript
const result = await attachmentService.scanFileForVirus(file)
// Returns: 'clean' | 'infected' | 'error'
```

### generateThumbnail(imageFile)
Generates a 200x200 thumbnail for image files.

```typescript
const thumbnailUrl = await attachmentService.generateThumbnail(
  file,
  containerClient,
  datePath
)
```

### validateFileType(file, allowedTypes?)
Validates file type against allowed MIME types and blocked extensions.

```typescript
attachmentService.validateFileType(file) // throws error if invalid
```

### compressFile(file)
Compresses a file using gzip.

```typescript
const compressed = await attachmentService.compressFile(file)
```

### cleanupOrphanedFiles(daysOld)
Deletes files older than specified days that are not linked to any communication.

```typescript
const deletedCount = await attachmentService.cleanupOrphanedFiles(30)
```

## Database Schema

### communication_attachments (enhanced)

```sql
- id: SERIAL PRIMARY KEY
- communication_id: INTEGER (nullable for orphaned files)
- filename: VARCHAR(500) - Generated unique filename
- original_filename: VARCHAR(500) - User's original filename
- file_size_bytes: BIGINT
- mime_type: VARCHAR(255)
- storage_path: VARCHAR(1000) - Path in container (YYYY/MM/DD/filename)
- storage_url: VARCHAR(1000)
- blob_url: VARCHAR(2000) - Azure Blob URL
- sas_url: VARCHAR(2000) - Temporary SAS URL
- teams_file_id: VARCHAR(255) - Teams file reference
- outlook_attachment_id: VARCHAR(255) - Outlook attachment reference
- thumbnail_url: VARCHAR(2000) - Image thumbnail URL
- virus_scan_status: VARCHAR(50) - pending, clean, infected, error
- compression_status: VARCHAR(50) - uncompressed, compressed, failed
- download_count: INTEGER DEFAULT 0
- last_accessed_at: TIMESTAMP
- uploaded_by: UUID
- tenant_id: UUID
- is_scanned: BOOLEAN DEFAULT false
- scan_result: VARCHAR(50)
- created_at: TIMESTAMP DEFAULT NOW()
```

### New Supporting Tables

- **file_storage_containers**: Tracks Azure Blob Storage containers
- **attachment_access_log**: Audit trail for file access
- **file_virus_scan_results**: Detailed virus scan results
- **file_processing_queue**: Queue for async processing (thumbnails, OCR, etc.)

## Azure Blob Storage Organization

Files are automatically organized by date:

```
communication-files/
  2025/
    11/
      16/
        abc123def456.pdf
        thumbnails/
          thumb_xyz789.jpg
```

## Container Types

- `teams-files`: Microsoft Teams uploads
- `email-attachments`: Outlook email attachments
- `communication-files`: General communication files

All containers are set to **private** access by default. Access is granted via SAS tokens.

## Security Features

1. **File Type Validation**: Only allowed MIME types accepted
2. **Extension Blocking**: Dangerous file extensions blocked
3. **Virus Scanning**: Placeholder for integration with security services
4. **SAS Tokens**: Temporary, time-limited access URLs
5. **Access Logging**: All file access logged for audit
6. **Size Limits**: Enforced per platform (Teams, Outlook, etc.)

## Best Practices

1. **Always validate files** before processing
2. **Use SAS URLs** for temporary access instead of direct blob URLs
3. **Set appropriate expiry times** on SAS tokens (default: 60 minutes)
4. **Run cleanup regularly** to remove orphaned files
5. **Monitor virus scan status** and quarantine infected files
6. **Track download counts** for usage analytics

## Scheduled Maintenance

Recommended cron jobs:

```typescript
// Daily: Cleanup expired SAS URLs
cron.schedule('0 2 * * *', async () => {
  await pool.query('SELECT cleanup_expired_sas_urls()')
})

// Weekly: Cleanup orphaned files
cron.schedule('0 3 * * 0', async () => {
  await attachmentService.cleanupOrphanedFiles(30)
})

// Daily: Cleanup failed processing queue
cron.schedule('0 4 * * *', async () => {
  await pool.query('SELECT cleanup_failed_processing_queue()')
})
```

## Error Handling

All methods throw errors that should be caught and handled:

```typescript
try {
  const result = await attachmentService.uploadToAzure(file, metadata)
} catch (error) {
  if (error.message.includes('File type')) {
    // Invalid file type
  } else if (error.message.includes('size exceeds')) {
    // File too large
  } else {
    // Other error
  }
}
```

## Future Enhancements

- [ ] Integration with Azure Security Center for virus scanning
- [ ] OCR text extraction for PDFs and images
- [ ] Advanced thumbnail generation with multiple sizes
- [ ] Support for video thumbnails
- [ ] File preview generation
- [ ] Integration with Azure AI Document Intelligence
- [ ] Automatic file categorization using AI
- [ ] Advanced compression algorithms
- [ ] CDN integration for faster delivery

## Support

For issues or questions, contact the development team or refer to:
- Azure Blob Storage documentation
- Microsoft Graph API documentation
- Fleet Management System documentation
