# Search System Quick Start Guide

Quick reference for using Fleet's Advanced Search & Indexing Engine.

## Setup

### 1. Run Database Migration
```bash
psql -d fleet_db -f api/src/migrations/023_search_and_indexing_system.sql
```

### 2. Environment Variables (Optional)
```bash
SEARCH_CACHE_ENABLED=true
SEARCH_CACHE_TTL=300
OPENAI_API_KEY=your-key  # For semantic search
```

### 3. Initial Reindexing
```bash
curl -X POST http://localhost:3000/api/search/index/reindex \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"fullReindex": true}'
```

## Common Use Cases

### 1. Simple Search
```bash
POST /api/search
{
  "query": "maintenance report"
}
```

### 2. Filtered Search
```bash
POST /api/search
{
  "query": "inspection",
  "categoryId": "safety",
  "tags": ["DOT"],
  "dateFrom": "2024-01-01"
}
```

### 3. Fuzzy Search (Typo-Tolerant)
```bash
POST /api/search
{
  "query": "maintanance",  // Misspelled
  "fuzzy": true             // Will find "maintenance"
}
```

### 4. Semantic Search (AI-Powered)
```bash
POST /api/search
{
  "query": "vehicles needing oil changes",
  "mode": "semantic"
}
```

### 5. Hybrid Search (Best Results)
```bash
POST /api/search
{
  "query": "fleet compliance documents",
  "mode": "hybrid",
  "usePersonalization": true
}
```

### 6. Auto-Complete
```bash
GET /api/search/autocomplete?q=maint&limit=5
```

### 7. Save a Search
```bash
POST /api/search/saved
{
  "name": "Pending Inspections",
  "query": "inspection",
  "filters": {"status": "pending"},
  "notificationEnabled": true
}
```

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "title": "Fleet Maintenance Schedule",
      "content_snippet": "This document outlines...",
      "highlighted_snippet": "...outlines <mark>fleet</mark> <mark>maintenance</mark>...",
      "relevance_score": 0.95,
      "rank": 1,
      "document_type": "application/pdf",
      "category": "Maintenance",
      "tags": ["schedule", "DOT"],
      "created_at": "2024-11-01T10:00:00Z"
    }
  ],
  "stats": {
    "total_results": 156,
    "search_time_ms": 45,
    "max_score": 0.95
  },
  "facets": {
    "categories": [...],
    "documentTypes": [...],
    "tags": [...]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

## Query Syntax

### Boolean Operators
```
fleet AND maintenance        // Both terms required
fleet OR vehicle            // Either term
maintenance -depreciated    // Exclude term
```

### Phrase Search
```
"preventive maintenance"    // Exact phrase
```

### Fuzzy Matching
```
{
  "query": "maintanance",   // Misspelled
  "fuzzy": true              // Finds "maintenance"
}
```

### Field Boosting
```json
{
  "query": "inspection",
  "boost": {
    "file_name": 4.0,      // Highest priority
    "description": 2.0,
    "extracted_text": 1.0,
    "tags": 3.0
  }
}
```

## Admin Operations

### View Indexing Status
```bash
GET /api/search/index/stats
```

### Trigger Reindexing
```bash
POST /api/search/index/reindex
{
  "categoryId": "maintenance",  // Optional
  "fullReindex": false           // Optional
}
```

### Check Indexing Jobs
```bash
GET /api/search/index/jobs?status=processing
```

### Optimize Indexes
```bash
POST /api/search/index/optimize
```

### Clear Cache
```bash
POST /api/search/cache/clear
```

### Warm Cache
```bash
POST /api/search/cache/warm
```

## Analytics

### Get Search Analytics
```bash
GET /api/search/analytics?days=30
```

**Response:**
```json
{
  "total_searches": 1523,
  "avg_search_time_ms": 42,
  "top_queries": [
    {"query": "inspection", "count": 156}
  ],
  "no_result_queries": [
    {"query": "outdated term", "count": 5}
  ]
}
```

### Search History
```bash
GET /api/search/history?limit=50
```

## Integration Example

### Auto-Index on Document Upload

The system automatically indexes documents when uploaded:

```typescript
// In your document upload handler
import DocumentIndexer from './services/DocumentIndexer'

async function uploadDocument(file, metadata) {
  // Save document
  const doc = await DocumentManagementService.uploadDocument(...)

  // Indexing happens automatically via database trigger
  // Or manually trigger for priority indexing:
  await DocumentIndexer.indexDocument(doc.id, tenantId, 'high')

  return doc
}
```

### Search in Your Application

```typescript
import DocumentSearchService from './services/DocumentSearchService'

async function searchDocuments(userId, tenantId, query) {
  const results = await DocumentSearchService.search({
    query,
    tenantId,
    userId,
    mode: 'hybrid',
    fuzzy: true,
    usePersonalization: true,
    limit: 20
  })

  return results
}
```

## Monitoring Queries

### Check Indexing Health
```sql
SELECT
  index_status,
  COUNT(*) as count
FROM documents
GROUP BY index_status;
```

### Recent Failed Indexing
```sql
SELECT *
FROM document_indexing_log
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### Search Performance
```sql
SELECT
  AVG(search_time_ms) as avg_time,
  COUNT(*) as total_searches
FROM search_query_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Popular Searches
```sql
SELECT * FROM mv_popular_search_terms
ORDER BY search_count DESC
LIMIT 10;
```

## Troubleshooting

### No Results Found
1. Try fuzzy search: `{"fuzzy": true}`
2. Check spelling: `GET /search/suggestions?q=query`
3. Broaden filters
4. Use semantic search: `{"mode": "semantic"}`

### Slow Searches
1. Check analytics: `GET /search/analytics`
2. Warm cache: `POST /search/cache/warm`
3. Optimize indexes: `POST /search/index/optimize`
4. Review query complexity

### Documents Not Searchable
1. Check index status: `SELECT index_status FROM documents`
2. Trigger reindex: `POST /search/index/document/:id`
3. Review indexing logs: `SELECT * FROM document_indexing_log`

## Best Practices

1. **Use Hybrid Mode** for best results
2. **Enable Fuzzy Search** for user-facing searches
3. **Apply Filters** to narrow results
4. **Monitor Analytics** to improve relevance
5. **Cache Popular Queries** for performance
6. **Paginate Results** (max 100 per page)
7. **Track Clicks** for personalization

## Key Files

- **Services**: `/api/src/services/SearchIndexService.ts`
- **Routes**: `/api/src/routes/search.ts`
- **Migration**: `/api/src/migrations/023_search_and_indexing_system.sql`
- **Documentation**: `/SEARCH_SYSTEM_DOCUMENTATION.md`

## Support

For detailed information, see:
- [Full Documentation](./SEARCH_SYSTEM_DOCUMENTATION.md)
- [Implementation Summary](./SEARCH_IMPLEMENTATION_SUMMARY.md)

## Quick Reference

| Feature | Endpoint | Method |
|---------|----------|--------|
| Search | `/api/search` | POST |
| Autocomplete | `/api/search/autocomplete` | GET |
| Suggestions | `/api/search/suggestions` | GET |
| Save Search | `/api/search/saved` | POST |
| History | `/api/search/history` | GET |
| Analytics | `/api/search/analytics` | GET |
| Reindex | `/api/search/index/reindex` | POST |
| Stats | `/api/search/index/stats` | GET |

---

**Ready to search? Start with:** `POST /api/search {"query": "your search term"}`
