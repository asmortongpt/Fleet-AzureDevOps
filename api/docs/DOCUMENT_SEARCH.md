# Document Search Service

## Overview

The Document Search Service provides enterprise-grade full-text search capabilities using PostgreSQL's built-in text search features. It enables users to quickly find documents based on content, metadata, and OCR-extracted text.

## Features

- **Full-Text Search**: Search across document titles, descriptions, and OCR-extracted content
- **Weighted Relevance Ranking**: Results are ranked by relevance using PostgreSQL's `ts_rank`
- **Advanced Filtering**: Filter by vehicle, driver, work order, date range, category, and more
- **Search Vectors**: Automatic indexing via database triggers for real-time updates
- **Multi-Tenant Support**: Complete isolation between tenants
- **High Performance**: GIN indexes provide sub-second search even with millions of documents
- **Headline Generation**: Automatic excerpt generation showing matched text in context

## Architecture

### Database Components

1. **search_vector Column**: A `tsvector` column that stores pre-processed, weighted search content
2. **GIN Index**: Fast full-text search index on the `search_vector` column
3. **Trigger Function**: Automatically updates search vectors when documents change
4. **Weighted Content**:
   - Weight A (Highest): File name, document name
   - Weight B (High): Description, vendor name, tags
   - Weight C (Medium): OCR text, extracted content
   - Weight D (Low): Metadata

### Search Vector Update Trigger

```sql
CREATE TRIGGER documents_search_vector_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_vector_update();
```

This trigger automatically rebuilds the search vector whenever a document is created or updated.

## API Usage

### Basic Search

```typescript
import documentSearchService from './services/document-search.service'

// Simple search
const results = await documentSearchService.searchDocuments(
  'invoice repair',
  { tenantId: 'tenant-123' }
)

console.log(`Found ${results.total} documents in ${results.execution_time_ms}ms`)
results.documents.forEach(doc => {
  console.log(`${doc.file_name} - Rank: ${doc.rank}`)
  console.log(`Preview: ${doc.headline}`)
})
```

### Advanced Search with Filters

```typescript
const results = await documentSearchService.searchDocuments(
  'brake maintenance',
  {
    tenantId: 'tenant-123',
    vehicleId: 'vehicle-456',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    documentType: 'Invoice',
    categoryId: 'maintenance-category',
    status: 'active',
    limit: 20,
    offset: 0
  }
)
```

### Search by Vehicle

```typescript
// Get all documents for a vehicle
const vehicleDocs = await documentSearchService.searchByVehicle(
  'vehicle-456',
  undefined, // no search query
  'tenant-123'
)

// Search within vehicle documents
const vehicleSearchResults = await documentSearchService.searchByVehicle(
  'vehicle-456',
  'oil change',
  'tenant-123'
)
```

### Manual Indexing

```typescript
// Index a single document (usually automatic via trigger)
await documentSearchService.indexDocument('doc-123')

// Batch index multiple documents
await documentSearchService.batchIndexDocuments([
  'doc-123',
  'doc-456',
  'doc-789'
])
```

### Search Statistics

```typescript
const stats = await documentSearchService.getSearchStatistics('tenant-123')

console.log(`Total documents: ${stats.total_documents}`)
console.log(`OCR completed: ${stats.ocr_completed}`)
console.log(`Searchable documents: ${stats.searchable_documents}`)
console.log(`Total text: ${stats.total_text_size_mb} MB`)
```

### Autocomplete Suggestions

```typescript
const suggestions = await documentSearchService.getSuggestions(
  'inv',
  'tenant-123',
  5
)
// Returns: ['invoice-001.pdf', 'invoice-002.pdf', 'inventory-report.xlsx', ...]
```

## SearchFilters Interface

```typescript
interface SearchFilters {
  vehicleId?: string         // Filter by vehicle
  driverId?: string          // Filter by driver
  workOrderId?: string       // Filter by work order/maintenance record
  documentType?: string      // Filter by document type (Invoice, Receipt, etc.)
  categoryId?: string        // Filter by category
  startDate?: Date           // Filter by document date >= startDate
  endDate?: Date             // Filter by document date <= endDate
  tenantId: number | string  // Required: tenant ID
  status?: 'active' | 'archived' | 'deleted'  // Document status
  limit?: number             // Max results (default: 50)
  offset?: number            // Pagination offset (default: 0)
}
```

## DocumentRecord Interface

```typescript
interface DocumentRecord {
  id: string
  tenant_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  file_hash?: string
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
  metadata?: any
  extracted_text?: string
  ocr_status: string
  ocr_completed_at?: Date
  embedding_status: string
  embedding_completed_at?: Date
  created_at: Date
  updated_at: Date
  // Search-specific fields
  rank?: number              // Relevance score (higher = better match)
  headline?: string          // Excerpt showing matched text in context
}
```

## Query Syntax

The search service uses PostgreSQL's `tsquery` syntax:

### Basic Queries
- `"invoice"` - Single word
- `"oil change"` - Multiple words (AND operation)
- `"brake | tire"` - OR operation
- `"repair & !warranty"` - AND with negation

### Prefix Matching
The service automatically adds prefix matching (`*`) to each term:
- User query: `"inv"` → `"inv:*"`
- Matches: "invoice", "inventory", "investigation"

### Boolean Operators (Advanced)
- `&` - AND (both terms must appear)
- `|` - OR (either term can appear)
- `!` - NOT (exclude term)
- `<->` - Phrase match (terms must be adjacent)

## Performance Considerations

### Index Performance
- GIN indexes provide O(log n) search performance
- Search typically completes in < 100ms even with millions of documents
- Index size is ~30-40% of the total text content size

### Optimization Tips
1. **Use Filters**: Always include `tenantId` and `status` filters
2. **Pagination**: Use `limit` and `offset` for large result sets
3. **Specific Queries**: More specific queries (3+ words) return faster
4. **Avoid Wildcards**: Don't use manual wildcards in queries (automatic prefix matching is optimized)

### Monitoring
```typescript
const stats = await documentSearchService.getSearchStatistics(tenantId)
```

Monitor these metrics:
- `searchable_documents / total_documents` - Should be close to 100%
- `ocr_pending` - Should be low; high values indicate OCR backlog
- `total_text_size_mb` - Indicates index size

## Migration

To enable full-text search, run the migration:

```bash
npm run migrate
# Or manually:
psql -d fleetdb -f src/migrations/024_document_fulltext_search.sql
```

The migration:
1. Adds `search_vector` column to `documents` table
2. Creates GIN index for fast searching
3. Creates trigger to auto-update search vectors
4. Populates search vectors for existing documents
5. Creates helper functions and views

## Troubleshooting

### No Results Found
1. **Check OCR status**: `ocr_status = 'completed'`
2. **Verify search vector**: `search_vector IS NOT NULL`
3. **Check filters**: Ensure filters aren't too restrictive
4. **Try simpler query**: Start with single words

### Slow Search Performance
1. **Verify GIN index exists**:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'documents'
   AND indexname = 'idx_documents_search_vector';
   ```
2. **Check index usage**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM documents
   WHERE search_vector @@ to_tsquery('english', 'invoice:*');
   ```
3. **Rebuild index if needed**:
   ```sql
   REINDEX INDEX idx_documents_search_vector;
   ```

### Search Vector Not Updating
1. **Verify trigger exists**:
   ```sql
   SELECT tgname FROM pg_trigger
   WHERE tgname = 'documents_search_vector_trigger';
   ```
2. **Manually re-index**:
   ```typescript
   await documentSearchService.indexDocument(documentId)
   ```

## Examples

### Example 1: Find All Invoices for a Vehicle
```typescript
const invoices = await documentSearchService.searchDocuments(
  'invoice',
  {
    tenantId: 'tenant-123',
    vehicleId: 'vehicle-456',
    documentType: 'Invoice',
    status: 'active'
  }
)
```

### Example 2: Search Maintenance Records by Date Range
```typescript
const maintenanceRecords = await documentSearchService.searchDocuments(
  'oil filter brake',
  {
    tenantId: 'tenant-123',
    categoryId: 'maintenance-category',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31')
  }
)
```

### Example 3: Full-Text Search Across All Documents
```typescript
const results = await documentSearchService.searchDocuments(
  'accident report Highway 101',
  {
    tenantId: 'tenant-123',
    limit: 10
  }
)

// Display results with highlighted excerpts
results.documents.forEach(doc => {
  console.log(`📄 ${doc.file_name}`)
  console.log(`   Relevance: ${(doc.rank * 100).toFixed(1)}%`)
  console.log(`   ${doc.headline}`)
  console.log()
})
```

### Example 4: Pagination
```typescript
// Page 1
const page1 = await documentSearchService.searchDocuments(
  'maintenance',
  { tenantId: 'tenant-123', limit: 20, offset: 0 }
)

// Page 2
const page2 = await documentSearchService.searchDocuments(
  'maintenance',
  { tenantId: 'tenant-123', limit: 20, offset: 20 }
)
```

## SQL Helper Function

The migration also creates a helper function for direct SQL usage:

```sql
-- Search documents with ranking
SELECT * FROM search_documents_ranked(
  'tenant-uuid',      -- tenant_id
  'invoice:* & repair:*',  -- search query
  50,                 -- limit
  0                   -- offset
);
```

## Future Enhancements

Potential improvements:
1. **Search Analytics**: Track popular searches, click-through rates
2. **Query Suggestions**: AI-powered query improvements
3. **Synonym Support**: Expand queries with synonyms (e.g., "car" → "vehicle")
4. **Language Detection**: Auto-detect document language for better stemming
5. **Faceted Search**: Pre-compute filter counts for UI
6. **Saved Searches**: Allow users to save and reuse common searches
7. **Search Alerts**: Notify users when new documents match saved searches

## Related Services

- **DocumentManagementService**: Upload, update, delete documents
- **DocumentRAGService**: Semantic search using vector embeddings
- **AI OCR Service**: Extract text from images and PDFs

## Resources

- [PostgreSQL Full-Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [GIN Index Performance](https://www.postgresql.org/docs/current/textsearch-indexes.html)
- [tsquery Syntax](https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY)
