# RAG System Dependencies Guide

## Current Dependencies (Already Installed)

The following required dependencies are already in `/home/user/Fleet/api/package.json`:

✅ **openai** (v4.28.0) - OpenAI SDK for embeddings and GPT-4
✅ **pg** (v8.16.3) - PostgreSQL client
✅ **zod** (v3.22.4) - Schema validation
✅ **express** (v4.18.2) - Web framework
✅ **axios** (v1.13.2) - HTTP client

---

## Optional Dependencies

Install these for additional functionality:

### Embedding Providers

```bash
# Cohere (alternative embedding provider)
npm install cohere-ai

# Latest version
npm install cohere-ai@latest
```

**Package:** `cohere-ai`
**Version:** Latest (7.x+)
**Use case:** Alternative/fallback embedding provider
**Cost:** $0.10 per 1M tokens

### Vector Databases

```bash
# Pinecone (cloud vector database)
npm install @pinecone-database/pinecone

# Qdrant (self-hosted vector database)
npm install @qdrant/js-client-rest

# Install both
npm install @pinecone-database/pinecone @qdrant/js-client-rest
```

**Pinecone:**
- Package: `@pinecone-database/pinecone`
- Version: Latest (2.x+)
- Use case: Highly scalable cloud vector DB
- Cost: Free tier available, then pay-as-you-go

**Qdrant:**
- Package: `@qdrant/js-client-rest`
- Version: Latest (1.x+)
- Use case: Self-hosted, feature-rich vector DB
- Cost: Free (self-hosted) or cloud pricing

### Local Embeddings (Experimental)

```bash
# Transformers.js for local embeddings
npm install @xenova/transformers

# Note: Large download (~200MB models)
```

**Package:** `@xenova/transformers`
**Version:** Latest (2.x+)
**Use case:** Offline/privacy-first embeddings
**Cost:** Free (runs locally)

---

## Complete Installation Command

Install all optional dependencies at once:

```bash
cd /home/user/Fleet/api

npm install \
  cohere-ai \
  @pinecone-database/pinecone \
  @qdrant/js-client-rest \
  @xenova/transformers
```

---

## Updated package.json

If you want to add these to your package.json, here's the update:

```json
{
  "dependencies": {
    // ... existing dependencies ...
    "openai": "^4.28.0",

    // Optional RAG dependencies
    "cohere-ai": "^7.10.0",
    "@pinecone-database/pinecone": "^2.0.0",
    "@qdrant/js-client-rest": "^1.9.0",
    "@xenova/transformers": "^2.17.0"
  }
}
```

---

## System Dependencies

### PostgreSQL pgvector

**Ubuntu/Debian:**
```bash
# PostgreSQL 14
sudo apt install postgresql-14-pgvector

# PostgreSQL 15
sudo apt install postgresql-15-pgvector

# PostgreSQL 16
sudo apt install postgresql-16-pgvector
```

**macOS (Homebrew):**
```bash
brew install pgvector

# Or build from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install  # may need sudo
```

**Docker:**
```bash
# Use pre-built image with pgvector
docker run -d \
  --name fleet-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fleet \
  -p 5432:5432 \
  ankane/pgvector:latest

# Or add to existing PostgreSQL
docker exec -it your-postgres-container bash
apt update && apt install -y postgresql-server-dev-all
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && make install
```

**Verify Installation:**
```sql
-- In psql
CREATE EXTENSION IF NOT EXISTS vector;

-- Check version
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

---

## Environment Setup

Create `/home/user/Fleet/api/.env` with these variables:

```bash
# ============================================================================
# RAG System Configuration
# ============================================================================

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/fleet

# OpenAI (Required - Primary AI provider)
OPENAI_API_KEY=sk-proj-...

# Cohere (Optional - Alternative embedding provider)
COHERE_API_KEY=...

# Local Embeddings (Optional - Offline mode)
ENABLE_LOCAL_EMBEDDINGS=false

# Pinecone (Optional - Cloud vector database)
PINECONE_API_KEY=...
PINECONE_INDEX=fleet-documents
PINECONE_ENVIRONMENT=us-east-1
# PINECONE_NAMESPACE=production  # Optional

# Qdrant (Optional - Self-hosted vector database)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...  # Optional, for authentication

# ============================================================================
# Advanced Configuration (Optional)
# ============================================================================

# Embedding defaults
DEFAULT_EMBEDDING_PROVIDER=openai  # openai, cohere, local
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
DEFAULT_CHUNK_SIZE=512
DEFAULT_CHUNK_OVERLAP=50

# Vector search defaults
DEFAULT_VECTOR_BACKEND=pgvector  # pgvector, pinecone, qdrant
DEFAULT_SEARCH_LIMIT=10
DEFAULT_MIN_SIMILARITY=0.7

# Chat defaults
DEFAULT_CHAT_MODEL=gpt-4-turbo-preview
DEFAULT_CHAT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1000

# Performance
EMBEDDING_CACHE_ENABLED=true
EMBEDDING_CACHE_TTL=86400  # 24 hours in seconds
VECTOR_INDEX_TYPE=ivfflat  # ivfflat or hnsw
VECTOR_INDEX_LISTS=100  # For IVFFlat

# Costs & Limits
MAX_EMBEDDING_COST_PER_DAY=10.00  # USD
MAX_CHAT_TOKENS_PER_SESSION=10000
ENABLE_COST_ALERTS=true
```

---

## Dependency Details

### OpenAI SDK

**Already installed** ✅

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Embeddings
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'text to embed'
})

// Chat
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [{ role: 'user', content: 'Hello!' }]
})
```

### Cohere SDK

**Optional** - Install with `npm install cohere-ai`

```typescript
import { CohereClient } from 'cohere-ai'

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
})

// Embeddings
const response = await cohere.embed({
  texts: ['text to embed'],
  model: 'embed-english-v3.0',
  inputType: 'search_document'
})
```

### Pinecone SDK

**Optional** - Install with `npm install @pinecone-database/pinecone`

```typescript
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

const index = pinecone.index('fleet-documents')

// Upsert
await index.namespace('default').upsert([
  {
    id: 'doc-1',
    values: [0.1, 0.2, ...],  // embedding vector
    metadata: { documentId: 'doc-1' }
  }
])

// Query
const results = await index.namespace('default').query({
  vector: [0.1, 0.2, ...],
  topK: 10
})
```

### Qdrant SDK

**Optional** - Install with `npm install @qdrant/js-client-rest`

```typescript
import { QdrantClient } from '@qdrant/js-client-rest'

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
})

// Upsert
await qdrant.upsert('collection-name', {
  points: [
    {
      id: 'doc-1',
      vector: [0.1, 0.2, ...],
      payload: { documentId: 'doc-1' }
    }
  ]
})

// Search
const results = await qdrant.search('collection-name', {
  vector: [0.1, 0.2, ...],
  limit: 10
})
```

### Transformers.js

**Optional** - Install with `npm install @xenova/transformers`

```typescript
import { pipeline } from '@xenova/transformers'

// Load embedding model
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
)

// Generate embedding
const output = await embedder('text to embed', {
  pooling: 'mean',
  normalize: true
})

const embedding = Array.from(output.data)
```

---

## Verification Commands

After installing dependencies, verify everything works:

```bash
# Check Node modules
ls node_modules/ | grep -E "openai|cohere|pinecone|qdrant|transformers"

# Test imports
node -e "require('openai'); console.log('✓ OpenAI')"
node -e "require('cohere-ai'); console.log('✓ Cohere')"
node -e "require('@pinecone-database/pinecone'); console.log('✓ Pinecone')"
node -e "require('@qdrant/js-client-rest'); console.log('✓ Qdrant')"

# Check pgvector in PostgreSQL
psql -U user -d fleet -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

---

## Version Compatibility

| Package | Minimum Version | Recommended | Notes |
|---------|----------------|-------------|-------|
| Node.js | 18.0.0 | 20.x LTS | Required for fetch API |
| PostgreSQL | 12.0 | 14.x+ | pgvector requires 12+ |
| pgvector | 0.5.0 | 0.7.0+ | Latest features |
| openai | 4.0.0 | 4.28.0+ | V4 SDK required |
| cohere-ai | 7.0.0 | 7.10.0+ | V7 SDK with embeddings |
| @pinecone-database/pinecone | 1.0.0 | 2.0.0+ | V2 has better types |
| @qdrant/js-client-rest | 1.8.0 | 1.9.0+ | REST API client |
| @xenova/transformers | 2.0.0 | 2.17.0+ | ONNX runtime |

---

## Installation Issues

### Issue: npm install fails

**Solution:**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: pgvector build fails

**Solution:**
```bash
# Install build dependencies
sudo apt install build-essential postgresql-server-dev-all

# Try again
cd pgvector && make clean && make && sudo make install
```

### Issue: Transformers.js downloads fail

**Solution:**
```bash
# Pre-download models
mkdir -p ~/.cache/transformers
export TRANSFORMERS_CACHE=~/.cache/transformers

# Or disable for now
# Don't install @xenova/transformers
```

---

## Production Recommendations

### Minimal Setup (PostgreSQL only)
```bash
# Just use pgvector with OpenAI
# Already have: openai, pg
# Need: pgvector extension only
```

### Standard Setup (pgvector + Cohere fallback)
```bash
npm install cohere-ai
# Configure COHERE_API_KEY for fallback
```

### Enterprise Setup (All providers)
```bash
npm install \
  cohere-ai \
  @pinecone-database/pinecone \
  @qdrant/js-client-rest

# Use Pinecone for global distribution
# Use Cohere for cost optimization
# Use Qdrant for sensitive data (self-hosted)
```

### Privacy-First Setup (Local only)
```bash
npm install @xenova/transformers

# Set ENABLE_LOCAL_EMBEDDINGS=true
# No external API calls
# Slower but completely offline
```

---

## Cost Comparison

| Provider | Type | Cost per 1M tokens | Speed | Quality |
|----------|------|-------------------|-------|---------|
| OpenAI 3-large | Embedding | $0.13 | Fast | Excellent |
| OpenAI 3-small | Embedding | $0.02 | Fast | Very Good |
| Cohere v3 | Embedding | $0.10 | Fast | Very Good |
| Local (Transformers.js) | Embedding | $0.00 | Slow | Good |
| GPT-4 Turbo | Chat | $10.00 / 1M tokens | Medium | Excellent |
| Pinecone | Vector DB | $0.096/hr pod | Fast | N/A |
| Qdrant Cloud | Vector DB | $25/mo + usage | Fast | N/A |
| PostgreSQL pgvector | Vector DB | $0.00 (self-hosted) | Medium | N/A |

---

## ✅ Checklist

- [ ] Verify Node.js 18+ installed
- [ ] Install PostgreSQL 14+
- [ ] Install pgvector extension
- [ ] Configure DATABASE_URL
- [ ] Configure OPENAI_API_KEY
- [ ] (Optional) Install cohere-ai package
- [ ] (Optional) Install Pinecone package
- [ ] (Optional) Install Qdrant package
- [ ] (Optional) Install Transformers.js
- [ ] Run `npm install` in api folder
- [ ] Verify all imports work
- [ ] Run database migrations
- [ ] Test embedding generation
- [ ] Test vector search

---

## Support

For issues:
1. Check error logs in console
2. Verify environment variables
3. Test API keys manually
4. Check PostgreSQL connection
5. Review pgvector installation

Documentation:
- OpenAI: https://platform.openai.com/docs
- Cohere: https://docs.cohere.com
- Pinecone: https://docs.pinecone.io
- Qdrant: https://qdrant.tech/documentation
- pgvector: https://github.com/pgvector/pgvector

---

All set! 🚀 Your dependencies are ready for the RAG system.
