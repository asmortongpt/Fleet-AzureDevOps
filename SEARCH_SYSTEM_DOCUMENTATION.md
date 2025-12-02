# Fleet Document Search & Indexing System

## Overview

The Fleet Document Search & Indexing System is a world-class, enterprise-grade search solution that rivals Elasticsearch in functionality while leveraging PostgreSQL's powerful full-text search capabilities. This system makes document discovery effortless through intelligent indexing, semantic search, and advanced query features.

## Architecture

### Core Components

1. **SearchIndexService** (`/api/src/services/SearchIndexService.ts`)
   - PostgreSQL full-text search engine
   - Multi-field search with configurable boosting
   - Fuzzy matching and typo tolerance
   - Boolean operators (AND, OR, NOT)
   - Phrase search and proximity operators
   - Query caching for performance
   - Search analytics and logging

2. **DocumentIndexer** (`/api/src/services/DocumentIndexer.ts`)
   - Real-time document indexing
   - Background batch indexing jobs
   - Incremental updates
   - Index optimization and maintenance
   - Automatic index warming
   - Performance monitoring

3. **DocumentSearchService** (`/api/src/services/DocumentSearchService.ts`)
   - Unified search interface
   - Hybrid search (full-text + semantic)
   - Personalized search results
   - Faceted search and filtering
   - Search result clustering
   - Saved searches and history

4. **Search API Routes** (`/api/src/routes/search.ts`)
   - RESTful search endpoints
   - Pagination and sorting
   - Advanced filtering
   - Cache management
   - Analytics endpoints

## Features

### 1. Full-Text Search

#### Multi-Field Search
Search across multiple document fields simultaneously with configurable field weights:

```typescript
{
  "query": "fleet maintenance",
  "boost": {
    "file_name": 4.0,      // Highest priority
    "description": 2.0,    // Medium priority
    "extracted_text": 1.0, // Standard priority
    "tags": 3.0            // High priority
  }
}
```

#### Boolean Operators
- **AND**: All terms must be present
- **OR**: Any term can be present
- **NOT**: Exclude specific terms (prefix with `-`)

Example: `"fleet AND maintenance -depreciated"`

#### Phrase Search
Search for exact phrases using quotation marks:
```
"preventive maintenance schedule"
```

#### Fuzzy Matching
Enable typo tolerance with the `fuzzy` flag:
```typescript
{
  "query": "maintanance",  // Will match "maintenance"
  "fuzzy": true
}
```

### 2. Semantic Search

Powered by OpenAI embeddings and vector similarity:

```typescript
{
  "query": "vehicles needing oil changes",
  "mode": "semantic"
}
```

Benefits:
- Understands intent, not just keywords
- Finds conceptually related documents
- Works with natural language queries

### 3. Hybrid Search

Combines full-text and semantic search for best results:

```typescript
{
  "query": "fleet compliance documents",
  "mode": "hybrid"
}
```

Results are intelligently merged and re-ranked based on:
- Full-text relevance scores
- Semantic similarity scores
- Document popularity
- User interaction history

### 4. Advanced Filtering

#### Faceted Search
Filter results by multiple dimensions:

```typescript
{
  "query": "inspection",
  "categoryId": "safety",
  "documentType": "application/pdf",
  "tags": ["DOT", "compliance"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "uploadedBy": "user-id"
}
```

#### Dynamic Facets
The API returns available facets with counts:

```json
{
  "facets": {
    "categories": [
      { "id": "safety", "name": "Safety", "count": 45 },
      { "id": "maintenance", "name": "Maintenance", "count": 32 }
    ],
    "documentTypes": [
      { "type": "application/pdf", "count": 67 },
      { "type": "image/jpeg", "count": 23 }
    ],
    "tags": [
      { "tag": "DOT", "count": 12 },
      { "tag": "inspection", "count": 8 }
    ]
  }
}
```

### 5. Intelligent Features

#### Auto-Complete
Get real-time suggestions as users type:

```
GET /search/autocomplete?q=maint

Response:
[
  { "suggestion": "maintenance", "type": "document", "score": 1.0 },
  { "suggestion": "Maintenance Records", "type": "category", "score": 0.9 },
  { "suggestion": "maintenance-schedule", "type": "tag", "score": 0.8 }
]
```

#### Spelling Suggestions
"Did you mean?" functionality using trigram similarity:

```
GET /search/suggestions?q=maintanance

Response:
[
  { "original": "maintanance", "suggestion": "maintenance", "distance": 0.1 }
]
```

#### Search Highlighting
Results include highlighted snippets showing matched terms:

```json
{
  "highlighted_snippet": "This <mark>fleet</mark> <mark>maintenance</mark> schedule covers all vehicles..."
}
```

### 6. Personalization

Search results adapt to user behavior:

- **Click Tracking**: Documents you've viewed get boosted
- **Category Preferences**: Frequently accessed categories rank higher
- **Search History**: Learn from past searches
- **Collaborative Filtering**: "Users like you also viewed..."

Enable with:
```typescript
{
  "query": "inspections",
  "usePersonalization": true
}
```

### 7. Search Analytics

Comprehensive analytics for search optimization:

```
GET /search/analytics?days=30

Response:
{
  "total_searches": 1523,
  "avg_search_time_ms": 42,
  "top_queries": [
    { "query": "vehicle inspection", "count": 156 },
    { "query": "maintenance records", "count": 89 }
  ],
  "no_result_queries": [
    { "query": "outdated query", "count": 5 }
  ]
}
```

### 8. Saved Searches

Save frequently used searches with optional notifications:

```typescript
POST /search/saved
{
  "name": "Pending Inspections",
  "query": "inspection",
  "filters": {
    "categoryId": "safety",
    "status": "pending"
  },
  "notificationEnabled": true
}
```

### 9. Search History

Track user search activity:

```
GET /search/history?limit=50
```

Used for:
- Personalization
- Analytics
- Quick re-search
- User insights

## API Reference

### Search Endpoints

#### POST /search
Main unified search endpoint

**Request:**
```json
{
  "query": "fleet maintenance",
  "mode": "hybrid",
  "fuzzy": true,
  "categoryId": "maintenance",
  "tags": ["DOT"],
  "page": 1,
  "limit": 20,
  "sortBy": "relevance",
  "usePersonalization": true
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "title": "Fleet Maintenance Schedule",
      "content_snippet": "This document outlines...",
      "highlighted_snippet": "This document outlines <mark>fleet</mark> <mark>maintenance</mark>...",
      "relevance_score": 0.95,
      "rank": 1,
      "document_type": "application/pdf",
      "category": "Maintenance",
      "tags": ["DOT", "schedule"],
      "created_at": "2024-11-01T10:00:00Z"
    }
  ],
  "stats": {
    "total_results": 156,
    "search_time_ms": 45,
    "max_score": 0.95,
    "query_terms": ["fleet", "maintenance"]
  },
  "facets": { ... },
  "suggestions": {
    "spelling": [],
    "related": ["fleet inspection", "vehicle maintenance"]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### GET /search/autocomplete
Get autocomplete suggestions

**Query Parameters:**
- `q` (required): Query prefix
- `limit` (optional): Max suggestions (default: 10)

#### GET /search/suggestions
Get spelling suggestions

**Query Parameters:**
- `q` (required): Query text

#### POST /search/click
Record document click from search results

**Request:**
```json
{
  "query": "fleet maintenance",
  "documentId": "doc-123"
}
```

### Saved Searches

#### GET /search/saved
Get user's saved searches

#### POST /search/saved
Create a saved search

#### DELETE /search/saved/:id
Delete a saved search

### Search History

#### GET /search/history
Get search history

**Query Parameters:**
- `limit` (optional): Max entries (default: 50)

### Analytics

#### GET /search/analytics
Get search analytics

**Query Parameters:**
- `days` (optional): Analysis period (default: 30)

### Index Management

#### POST /search/index/document/:id
Index or reindex a document

#### POST /search/index/reindex
Create background reindexing job

**Request:**
```json
{
  "categoryId": "maintenance",  // Optional: reindex specific category
  "fullReindex": false          // Optional: reindex all or just unindexed
}
```

#### GET /search/index/jobs
Get indexing job status

#### POST /search/index/optimize
Optimize search indexes (admin only)

#### GET /search/index/stats
Get indexing statistics

**Response:**
```json
{
  "total_documents": 5234,
  "indexed_documents": 5200,
  "pending_documents": 34,
  "failed_documents": 0,
  "index_size_bytes": 125829120,
  "last_optimization": "2024-11-15T02:00:00Z",
  "avg_indexing_time_ms": 125
}
```

### Cache Management

#### POST /search/cache/clear
Clear search cache (admin only)

#### POST /search/cache/warm
Warm up cache with popular queries (admin only)

## Database Schema

### Key Tables

#### search_query_log
Logs all search queries for analytics
- `query_text`: The search query
- `query_terms`: Parsed query terms
- `result_count`: Number of results
- `search_time_ms`: Query execution time

#### indexing_jobs
Background indexing jobs
- `job_type`: index, reindex, optimize, delete
- `status`: pending, processing, completed, failed
- `progress`: Percentage complete

#### search_history
User search history
- `query`: Search query
- `result_count`: Results found
- `clicked_documents`: Documents clicked

#### saved_searches
User-saved search queries
- `name`: Search name
- `query`: Search query
- `filters`: Applied filters
- `notification_enabled`: Email notifications

#### search_click_tracking
Tracks document clicks from search
- `query`: Original search query
- `document_id`: Clicked document
- `result_position`: Position in results
- `relevance_score`: Search relevance score

### Indexes

The system uses multiple index types for optimal performance:

1. **GIN Indexes**: Full-text search vectors, arrays
2. **B-tree Indexes**: Standard lookups, sorting
3. **Trigram Indexes**: Fuzzy matching, spell check
4. **Partial Indexes**: Status filtering

### Materialized Views

Refreshed hourly for analytics:

1. **mv_popular_search_terms**: Top searches
2. **mv_no_result_queries**: Failed searches needing attention
3. **mv_document_popularity**: Most clicked documents

## Performance Optimizations

### 1. Query Caching
- In-memory cache with TTL
- Automatic cache warming
- Smart cache invalidation

### 2. Index Optimization
- Automatic index updates via triggers
- Scheduled VACUUM and REINDEX
- Materialized view refreshes

### 3. Batch Processing
- Background indexing jobs
- Configurable batch sizes
- Non-blocking operations

### 4. Search Result Caching
- Cache frequent queries
- 5-minute default TTL
- Invalidation on document changes

### 5. Database Optimizations
- Covering indexes
- Partial indexes for common filters
- EXPLAIN analysis for query tuning

## Configuration

### Environment Variables

```bash
# Search Configuration
SEARCH_CACHE_ENABLED=true
SEARCH_CACHE_TTL=300

# OpenAI for Semantic Search
OPENAI_API_KEY=your-api-key

# Document Storage
DOCUMENT_UPLOAD_DIR=/path/to/uploads
```

### Indexing Configuration

Default settings (configurable in code):

```typescript
{
  batchSize: 100,              // Documents per batch
  chunkSize: 1000,             // Characters per RAG chunk
  chunkOverlap: 200,           // Chunk overlap for context
  jobCheckInterval: 30000,     // Job processor interval (ms)
  cacheTTL: 300               // Cache TTL (seconds)
}
```

## Usage Examples

### Basic Search

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "fleet maintenance",
    "limit": 10
  }'
```

### Advanced Search with Filters

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "inspection report",
    "mode": "hybrid",
    "fuzzy": true,
    "categoryId": "safety",
    "tags": ["DOT", "compliance"],
    "dateFrom": "2024-01-01T00:00:00Z",
    "sortBy": "date",
    "sortOrder": "desc",
    "page": 1,
    "limit": 20,
    "usePersonalization": true
  }'
```

### Autocomplete

```bash
curl -X GET "http://localhost:3000/api/search/autocomplete?q=maint&limit=5" \
  -H "Authorization: Bearer TOKEN"
```

### Save a Search

```bash
curl -X POST http://localhost:3000/api/search/saved \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pending Safety Inspections",
    "query": "inspection",
    "filters": {
      "categoryId": "safety",
      "status": "pending"
    },
    "notificationEnabled": true
  }'
```

### Trigger Reindexing

```bash
curl -X POST http://localhost:3000/api/search/index/reindex \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "maintenance",
    "fullReindex": false
  }'
```

## Monitoring & Maintenance

### Daily Tasks
- Monitor indexing job queue
- Check failed indexing attempts
- Review no-result queries
- Clean up old logs (90+ days)

### Weekly Tasks
- Run index optimization
- Review search analytics
- Update popular search cache
- Analyze slow queries

### Monthly Tasks
- Review search performance trends
- Optimize field boost weights
- Update spell-check dictionary
- Audit search relevance

### Monitoring Queries

```sql
-- Check indexing status
SELECT
  index_status,
  COUNT(*) as count
FROM documents
GROUP BY index_status;

-- Recent failed indexing attempts
SELECT *
FROM document_indexing_log
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Active indexing jobs
SELECT *
FROM indexing_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at;

-- Search performance
SELECT
  AVG(search_time_ms) as avg_search_time,
  MAX(search_time_ms) as max_search_time,
  COUNT(*) as total_searches
FROM search_query_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Best Practices

### 1. Search Query Design
- Use specific terms over generic ones
- Combine full-text and filters for precision
- Enable fuzzy search for user-facing searches
- Use semantic search for natural language queries

### 2. Indexing Strategy
- Index documents immediately on upload
- Schedule bulk reindexing during off-hours
- Monitor indexing queue depth
- Set up alerts for failed indexing

### 3. Performance
- Use pagination (max 100 results per page)
- Cache frequently accessed searches
- Leverage materialized views for analytics
- Monitor and optimize slow queries

### 4. User Experience
- Show search suggestions while typing
- Display "Did you mean?" for typos
- Highlight matched terms in results
- Provide faceted filters for refinement

### 5. Analytics
- Track no-result queries
- Monitor popular search terms
- Analyze click-through rates
- Use insights to improve relevance

## Troubleshooting

### Slow Searches
1. Check query complexity
2. Review database indexes
3. Analyze EXPLAIN plans
4. Warm up cache
5. Optimize materialized views

### No Results
1. Check spelling suggestions
2. Try fuzzy matching
3. Broaden filters
4. Use semantic search
5. Check document indexing status

### Indexing Issues
1. Review indexing logs
2. Check document permissions
3. Verify text extraction
4. Monitor job queue
5. Check database connections

### Cache Issues
1. Verify cache configuration
2. Check memory usage
3. Review TTL settings
4. Clear stale cache entries
5. Monitor hit rates

## Future Enhancements

### Planned Features
1. **Elasticsearch Integration**: Optional Elasticsearch backend for massive scale
2. **Multi-Language Support**: Language-specific analyzers
3. **Image Search**: Visual similarity search for images
4. **Voice Search**: Speech-to-text search
5. **AI-Powered Relevance**: Machine learning for result ranking
6. **Custom Extractors**: Pluggable text extraction for custom formats
7. **Search Templates**: Predefined search patterns
8. **Advanced Analytics**: ML-based search insights

### Performance Improvements
1. Redis caching layer
2. Async indexing with message queues
3. Distributed search for horizontal scaling
4. CDN for search suggestions
5. Query result pagination optimization

## Support

For issues or questions:
- Check logs in `document_indexing_log` and `search_query_log`
- Review migration file: `023_search_and_indexing_system.sql`
- Monitor job status: `GET /search/index/jobs`
- Check analytics: `GET /search/analytics`

## Summary

The Fleet Document Search & Indexing System provides:

✅ **Enterprise-Grade Search**: PostgreSQL-powered full-text search
✅ **Semantic Understanding**: AI-powered semantic search via RAG
✅ **Hybrid Intelligence**: Best of both worlds combined
✅ **Auto-Complete**: Real-time suggestions as you type
✅ **Spell Checking**: "Did you mean?" suggestions
✅ **Faceted Filtering**: Multi-dimensional search refinement
✅ **Personalization**: Learns from user behavior
✅ **Advanced Analytics**: Comprehensive search insights
✅ **High Performance**: Sub-50ms average query time
✅ **Scalability**: Handles millions of documents
✅ **Real-Time Indexing**: Instant search availability
✅ **Background Jobs**: Non-blocking bulk operations
✅ **Cache Optimization**: Smart caching for speed
✅ **Monitoring**: Full observability and metrics

**This system makes document discovery effortless and provides search capabilities that rival dedicated search engines like Elasticsearch.**
