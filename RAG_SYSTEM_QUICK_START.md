# RAG System Quick Start Guide

Get your advanced RAG (Retrieval-Augmented Generation) system up and running in minutes!

## 📋 Prerequisites

- PostgreSQL 14+ with pgvector extension
- Node.js 18+
- OpenAI API key (required)
- Cohere API key (optional)
- Pinecone account (optional)
- Qdrant instance (optional)

---

## 🚀 Installation Steps

### Step 1: Install Optional Dependencies

The core dependencies (OpenAI) are already in package.json. Install optional providers:

```bash
cd api

# Optional: Cohere embeddings
npm install cohere-ai

# Optional: Pinecone vector database
npm install @pinecone-database/pinecone

# Optional: Qdrant vector database
npm install @qdrant/js-client-rest

# Install all at once
npm install cohere-ai @pinecone-database/pinecone @qdrant/js-client-rest
```

### Step 2: Install pgvector Extension

Connect to your PostgreSQL database and run:

```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-14-pgvector
```

**macOS (Homebrew):**
```bash
brew install pgvector
```

**Docker:**
```bash
docker run -d \
  --name fleet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  ankane/pgvector
```

### Step 3: Configure Environment Variables

Create or update `/home/user/Fleet/api/.env`:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/fleet

# OpenAI (required for full functionality)
OPENAI_API_KEY=sk-proj-...

# Cohere (optional alternative/fallback)
COHERE_API_KEY=...

# Local embeddings (optional, for offline mode)
ENABLE_LOCAL_EMBEDDINGS=false

# Pinecone (optional cloud vector database)
PINECONE_API_KEY=...
PINECONE_INDEX=fleet-documents
PINECONE_ENVIRONMENT=us-east-1

# Qdrant (optional self-hosted vector database)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
```

### Step 4: Run Database Migrations

```bash
cd /home/user/Fleet/api

# Run all migrations including new RAG tables
npm run migrate

# Or run specific migrations
psql -U user -d fleet -f src/migrations/024_vector_embeddings_rag.sql
psql -U user -d fleet -f src/migrations/025_ai_chat_system.sql
```

### Step 5: Verify Installation

Check that tables were created:

```sql
-- Check vector embeddings table
SELECT COUNT(*) FROM document_embeddings;

-- Check pgvector indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'document_embeddings'
AND indexname LIKE '%vector%';

-- Check chat tables
SELECT COUNT(*) FROM chat_sessions;
SELECT COUNT(*) FROM chat_messages;

-- Verify views
SELECT * FROM v_embedding_statistics;
SELECT * FROM v_query_performance;
```

### Step 6: Import Services in Main Server

Update `/home/user/Fleet/api/src/server.ts` to include new routes:

```typescript
// Import AI routes
import aiSearchRoutes from './routes/ai-search'
import aiChatRoutes from './routes/ai-chat'

// Register routes
app.use('/api/ai-search', aiSearchRoutes)
app.use('/api/ai-chat', aiChatRoutes)
```

### Step 7: Start the Server

```bash
cd /home/user/Fleet/api

# Development mode
npm run dev

# Production mode
npm run build
npm start
```

---

## 🧪 Test the System

### Test 1: Generate Embeddings

```bash
curl -X POST http://localhost:3000/api/ai-search/index \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "documentId": "test-doc-1",
    "content": "Fleet vehicle #VH-001 requires oil change. Last service: 2024-01-15. Mileage: 45,000 miles. Next service due in 3,000 miles.",
    "chunkStrategy": "semantic",
    "chunkSize": 512,
    "metadata": {
      "vehicleId": "VH-001",
      "documentType": "maintenance"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "documentId": "test-doc-1",
  "chunksIndexed": 1,
  "processingTimeMs": 450,
  "estimatedCost": "0.0001"
}
```

### Test 2: Semantic Search

```bash
curl -X POST http://localhost:3000/api/ai-search/semantic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "vehicles needing oil change",
    "limit": 5,
    "minScore": 0.7
  }'
```

Expected response:
```json
{
  "results": [
    {
      "id": "test-doc-1_chunk_0",
      "content": "Fleet vehicle #VH-001 requires oil change...",
      "score": 0.89,
      "metadata": {
        "vehicleId": "VH-001",
        "documentType": "maintenance"
      }
    }
  ],
  "count": 1,
  "searchTimeMs": 45
}
```

### Test 3: Document Q&A

```bash
curl -X POST http://localhost:3000/api/ai-search/qa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "When was the last service for vehicle VH-001?",
    "maxSources": 3
  }'
```

Expected response:
```json
{
  "answer": "According to the maintenance records, vehicle VH-001 was last serviced on January 15, 2024.",
  "sources": [
    {
      "documentId": "test-doc-1",
      "content": "Last service: 2024-01-15",
      "score": 0.92
    }
  ],
  "confidence": 0.88,
  "modelUsed": "gpt-4-turbo-preview"
}
```

### Test 4: Create Chat Session

```bash
curl -X POST http://localhost:3000/api/ai-chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Fleet Analysis Chat"
  }'
```

### Test 5: Send Chat Message

```bash
curl -X POST http://localhost:3000/api/ai-chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionId": "SESSION_ID_FROM_STEP_4",
    "message": "What maintenance is coming up?",
    "searchDocuments": true,
    "maxSources": 5
  }'
```

---

## 📊 Verify System Health

### Check Embeddings

```sql
-- Total embeddings
SELECT COUNT(*) FROM document_embeddings;

-- Embeddings by provider
SELECT embedding_provider, embedding_model, COUNT(*)
FROM document_embeddings
GROUP BY embedding_provider, embedding_model;

-- Average processing time
SELECT AVG(processing_time_ms) FROM document_embeddings;

-- Total cost
SELECT SUM(cost_usd) FROM document_embeddings;
```

### Check Search Performance

```sql
-- Total searches
SELECT COUNT(*) FROM rag_queries;

-- Average response time
SELECT AVG(total_time_ms) FROM rag_queries;

-- User satisfaction
SELECT
  AVG(feedback_rating) as avg_rating,
  COUNT(CASE WHEN feedback_helpful = true THEN 1 END) as helpful_count,
  COUNT(CASE WHEN feedback_helpful = false THEN 1 END) as not_helpful_count
FROM rag_queries
WHERE feedback_rating IS NOT NULL;

-- Top queries
SELECT query_text, COUNT(*) as count
FROM rag_queries
GROUP BY query_text
ORDER BY count DESC
LIMIT 10;
```

### Check Chat Usage

```sql
-- Total sessions
SELECT COUNT(*) FROM chat_sessions;

-- Active sessions
SELECT COUNT(*) FROM chat_sessions WHERE is_active = true;

-- Total messages
SELECT COUNT(*) FROM chat_messages;

-- Messages per session
SELECT AVG(message_count) FROM chat_sessions;

-- Token usage
SELECT SUM(total_tokens_used) FROM chat_sessions;
```

---

## 🔧 Configuration Options

### Embedding Configuration

In your code:

```typescript
import embeddingService from './services/EmbeddingService'

// Generate embedding with specific provider
const result = await embeddingService.generateEmbedding(text, {
  provider: 'openai',  // 'openai', 'cohere', or 'local'
  model: 'text-embedding-3-large',
  enableCache: true
})

// Chunk text with different strategies
const chunks = embeddingService.chunkText(text, {
  strategy: 'semantic',  // 'semantic', 'fixed', 'sentence', 'paragraph'
  chunkSize: 512,
  chunkOverlap: 50
})
```

### Vector Search Configuration

```typescript
import vectorSearchService from './services/VectorSearchService'

// Search with options
const results = await vectorSearchService.search(tenantId, query, {
  limit: 10,
  minScore: 0.7,
  filter: { documentType: 'maintenance' },
  includeMetadata: true
})

// Hybrid search
const results = await vectorSearchService.hybridSearch(tenantId, query, {
  keywordWeight: 0.3,
  vectorWeight: 0.7,
  limit: 20
})
```

---

## 📈 Monitoring & Analytics

### View Embedding Statistics

```sql
SELECT * FROM v_embedding_statistics;
```

Returns:
- Total embeddings by provider/model
- Total tokens processed
- Total cost
- Average processing time
- Date range

### View Query Performance

```sql
SELECT * FROM v_query_performance;
```

Returns:
- Total queries by type/strategy
- Average response time
- Average results returned
- Average similarity score
- User ratings
- Helpful/not helpful counts

### View Document Processing Stats

```sql
SELECT * FROM v_document_processing_stats;
```

Returns:
- Documents with embeddings
- Documents classified
- Documents summarized
- Documents with entities extracted

---

## 🐛 Troubleshooting

### Issue: "pgvector extension not found"

**Solution:**
```sql
CREATE EXTENSION vector;
```

If that fails, install pgvector on your system first (see Step 2).

### Issue: "OpenAI API error: Invalid API key"

**Solution:**
- Check `OPENAI_API_KEY` in `.env`
- Verify key starts with `sk-proj-` or `sk-`
- Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

### Issue: Slow vector searches

**Solution:**
```sql
-- Create better indexes
CREATE INDEX CONCURRENTLY idx_embeddings_ivfflat
ON document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Vacuum and analyze
VACUUM ANALYZE document_embeddings;
```

### Issue: High costs

**Solutions:**
1. Enable caching: Already enabled by default
2. Use smaller models: Switch to `text-embedding-3-small`
3. Use local embeddings: Set `ENABLE_LOCAL_EMBEDDINGS=true`
4. Reduce chunk sizes: Use 256-512 tokens instead of 1024+

### Issue: Chat responses are slow

**Solutions:**
1. Use streaming: `/api/ai-chat/chat/stream`
2. Reduce max sources: Set `maxSources: 3` instead of 10
3. Increase similarity threshold: Use `minScore: 0.8`
4. Enable query caching

---

## 📚 Next Steps

1. **Index Existing Documents**
   ```bash
   # Batch index all documents
   POST /api/ai-search/index/batch
   ```

2. **Set Up Auto-Indexing**
   - Hook into document upload events
   - Automatically generate embeddings
   - Update on document changes

3. **Customize System Prompts**
   ```sql
   UPDATE chat_system_prompts
   SET prompt_text = 'Your custom prompt...'
   WHERE prompt_name = 'fleet_assistant';
   ```

4. **Add Frontend Components**
   - Search bar with semantic search
   - Chat widget
   - Document viewer with Q&A
   - Analytics dashboard

5. **Monitor Performance**
   - Set up alerts for slow queries
   - Track embedding costs
   - Monitor user satisfaction ratings

---

## 🎯 Usage Patterns

### Pattern 1: Document Upload → Auto-Index

```typescript
// In document upload handler
async function handleDocumentUpload(file, metadata) {
  // 1. Upload to storage
  const documentId = await saveDocument(file)

  // 2. Extract text (OCR if needed)
  const text = await extractText(file)

  // 3. Auto-index for search
  await vectorSearchService.indexDocument(tenantId, {
    id: documentId,
    content: text,
    metadata
  })

  // 4. Run AI analysis
  await Promise.all([
    documentAiService.classifyDocument(tenantId, documentId, text),
    documentAiService.extractEntities(tenantId, documentId, text),
    documentAiService.generateSummary(tenantId, documentId, text, 'brief')
  ])
}
```

### Pattern 2: Search Results → Chat

```typescript
// Search first
const searchResults = await vectorSearchService.search(tenantId, query)

// Then start chat with context
const session = await createChatSession({
  title: `Chat about: ${query}`,
  documentIds: searchResults.map(r => r.id)
})
```

### Pattern 3: Batch Document Processing

```typescript
// Process many documents overnight
const documents = await getUnprocessedDocuments()

for (const doc of documents) {
  try {
    await indexDocument(doc)
    await analyzeDocument(doc)
  } catch (error) {
    logError(error, doc.id)
  }
}
```

---

## ✅ Verification Checklist

- [ ] pgvector extension installed
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Optional dependencies installed (if using)
- [ ] Server starts without errors
- [ ] Test embedding generation works
- [ ] Test semantic search works
- [ ] Test document Q&A works
- [ ] Test chat interface works
- [ ] Analytics queries return data
- [ ] Indexes are created properly
- [ ] Performance is acceptable
- [ ] Costs are within budget

---

## 🎉 You're Ready!

Your RAG system is now fully operational! Start by:

1. Indexing a few test documents
2. Running some searches
3. Asking questions via Q&A
4. Starting a chat session
5. Reviewing analytics

For detailed API documentation, see `RAG_SYSTEM_IMPLEMENTATION_SUMMARY.md`.

For issues, check the troubleshooting section or review service logs.

Happy searching! 🚀
