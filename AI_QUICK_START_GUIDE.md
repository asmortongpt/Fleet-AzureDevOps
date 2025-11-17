# Fleet AI Systems - Quick Start Guide

**Last Updated**: November 12, 2025
**Purpose**: Immediate actions to activate AI features

---

## TL;DR - What You Need to Know

### 🎉 Good News
Your app **ALREADY HAS** both MCP and RAG systems fully implemented.

### ✅ What Works Right Now
- RAG document search and Q&A
- Vector embeddings with pgvector
- MCP server connections
- ML predictions
- AI insights

### 🔧 What You Need to Do
1. Add API keys to environment
2. Enable pgvector in database
3. Index your documents
4. Test the endpoints

**Time to get running**: 30 minutes

---

## Step 1: Environment Configuration (5 minutes)

### Add to your `.env` file:

```bash
# OpenAI API (for RAG embeddings and responses)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# OR use Azure OpenAI (already configured)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2023-12-01-preview

# Optional: Claude API for MCP
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

### Get API Keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Azure OpenAI**: https://portal.azure.com
- **Anthropic**: https://console.anthropic.com

---

## Step 2: Database Setup (5 minutes)

### Enable pgvector extension:

```bash
# Connect to your database
psql -h your-db-host -U your-user -d fleet_db

# Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify it's installed
SELECT * FROM pg_extension WHERE extname='vector';
```

### Run migrations (if not already run):

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api

# Run the AI/ML infrastructure migration
psql -h your-db-host -U your-user -d fleet_db < db/migrations/005_ai_ml_infrastructure.sql
```

---

## Step 3: Test RAG System (10 minutes)

### Test 1: Index a Sample Document

```bash
curl -X POST http://localhost:3000/api/ai-insights/rag/index \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "document_type": "manual",
    "document_title": "Vehicle Maintenance Guide",
    "document_source": "Internal",
    "content": "Regular maintenance includes oil changes every 5000 miles, tire rotation every 7500 miles, and brake inspection every 10000 miles. All vehicles must pass annual safety inspections.",
    "metadata": {
      "category": "maintenance",
      "version": "1.0"
    }
  }'
```

### Test 2: Query the RAG System

```bash
curl -X POST http://localhost:3000/api/ai-insights/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "How often should we rotate tires?",
    "max_chunks": 5,
    "similarity_threshold": 0.7
  }'
```

### Expected Response:
```json
{
  "answer": "Based on the Vehicle Maintenance Guide, tires should be rotated every 7500 miles.",
  "confidence_score": 0.92,
  "sources": [
    {
      "document_title": "Vehicle Maintenance Guide",
      "chunk_text": "Regular maintenance includes... tire rotation every 7500 miles...",
      "similarity": 0.95
    }
  ],
  "processing_time_ms": 1234
}
```

### Test 3: Check RAG Statistics

```bash
curl -X GET http://localhost:3000/api/ai-insights/rag/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 4: Bulk Index Your Documents (10 minutes)

### Create an indexing script:

**File**: `index-fleet-documents.ts`

```typescript
import ragEngineService from './api/src/services/rag-engine.service'

const documents = [
  {
    document_type: 'policy',
    document_title: 'Fleet Safety Policy',
    content: `
      All drivers must:
      1. Complete safety training annually
      2. Perform pre-trip inspections
      3. Report incidents within 24 hours
      4. Maintain valid CDL license
      5. Follow hours of service regulations
    `,
    metadata: { category: 'safety', effective_date: '2025-01-01' }
  },
  {
    document_type: 'procedure',
    document_title: 'Vehicle Inspection Procedure',
    content: `
      Pre-trip inspection checklist:
      - Check tire pressure and tread
      - Test all lights
      - Inspect brakes
      - Check fluid levels
      - Test horn and wipers
      - Verify registration and insurance
    `,
    metadata: { category: 'operations' }
  },
  {
    document_type: 'manual',
    document_title: 'Fuel Card Usage Guide',
    content: `
      Fuel card best practices:
      - Use only at authorized stations
      - Record odometer at each fill-up
      - Keep receipts for 90 days
      - Report lost cards immediately
      - Maximum fill: 50 gallons per transaction
    `,
    metadata: { category: 'finance' }
  }
]

async function bulkIndex() {
  const tenantId = 'YOUR_TENANT_ID' // Get from auth token

  const result = await ragEngineService.bulkIndexDocuments(tenantId, documents)

  console.log(`✅ Indexed ${result.successful}/${result.total} documents`)
  console.log(`❌ Failed: ${result.failed}`)
}

bulkIndex().catch(console.error)
```

### Run the script:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npx tsx index-fleet-documents.ts
```

---

## Step 5: Test MCP Server (Optional - 5 minutes)

### Only if you want external MCP integration:

```bash
# Register an MCP server
curl -X POST http://localhost:3000/api/ai-insights/mcp/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "server_name": "Fleet Operations MCP",
    "server_type": "claude",
    "connection_url": "https://your-mcp-server.com",
    "api_key": "your-mcp-api-key",
    "configuration": {
      "health_check_endpoint": "/health"
    }
  }'

# List available servers
curl -X GET http://localhost:3000/api/ai-insights/mcp/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Available AI Endpoints

### RAG System
```
POST   /api/ai-insights/rag/query              # Query RAG system
POST   /api/ai-insights/rag/index              # Index document
POST   /api/ai-insights/rag/feedback           # Provide feedback
GET    /api/ai-insights/rag/stats              # Get statistics
```

### ML Predictions
```
POST   /api/ai-insights/predictions/maintenance        # Predict maintenance
POST   /api/ai-insights/predictions/driver-behavior    # Score driver
POST   /api/ai-insights/predictions/incident-risk      # Risk assessment
POST   /api/ai-insights/predictions/cost-forecast      # Cost forecasting
```

### Fleet Cognition
```
GET    /api/ai-insights/cognition/insights            # Get insights
POST   /api/ai-insights/cognition/generate            # Generate new insights
GET    /api/ai-insights/cognition/health-score        # Fleet health
GET    /api/ai-insights/cognition/recommendations     # Get recommendations
GET    /api/ai-insights/cognition/patterns            # Detected patterns
GET    /api/ai-insights/cognition/anomalies           # Anomaly detection
```

### ML Models
```
GET    /api/ai-insights/models                        # List models
GET    /api/ai-insights/models/:id/performance        # Model metrics
POST   /api/ai-insights/models/:id/deploy             # Deploy model
GET    /api/ai-insights/training/jobs                 # Training history
```

---

## Frontend Integration

### Enable AI Features:

**File**: `.env` (frontend)

```bash
# Enable AI features
VITE_ENABLE_AI_ASSISTANT=true

# API endpoint (already configured)
VITE_API_URL=https://fleet-api.azurewebsites.net
```

### AI Components Already Built:

1. **AI Assistant Module**: `src/components/modules/AIAssistant.tsx`
   - Chat interface
   - Document Q&A
   - Fleet insights

2. **Document Q&A**: `src/components/modules/DocumentQA.tsx`
   - RAG-powered search
   - Source citations

3. **Conversational Intake**: `src/components/ai/ConversationalIntake.tsx`
   - Natural language data entry
   - Smart validation

---

## Verification Checklist

### ✅ Setup Complete When:

- [ ] API keys added to `.env`
- [ ] pgvector extension enabled
- [ ] Test document indexed successfully
- [ ] RAG query returns relevant results
- [ ] Statistics endpoint shows data
- [ ] Frontend AI features enabled

### 🧪 Test Commands:

```bash
# Test 1: Health check
curl http://localhost:3000/health

# Test 2: RAG stats (should show indexed documents)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/ai-insights/rag/stats

# Test 3: Generate insights
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/ai-insights/cognition/generate

# Test 4: Get fleet health score
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/ai-insights/cognition/health-score
```

---

## Common Issues & Solutions

### Issue 1: "OpenAI API key not found"

**Solution**:
```bash
# Add to .env
OPENAI_API_KEY=sk-proj-YOUR_KEY

# Restart API server
cd api && npm run dev
```

### Issue 2: "pgvector extension not found"

**Solution**:
```bash
# Install pgvector (if not installed)
# For PostgreSQL on Ubuntu/Debian:
sudo apt-get install postgresql-14-pgvector

# For macOS (Homebrew):
brew install pgvector

# Enable in database:
psql -d fleet_db -c "CREATE EXTENSION vector;"
```

### Issue 3: "No documents indexed"

**Solution**:
```bash
# Check embedding_vectors table
psql -d fleet_db -c "SELECT COUNT(*) FROM embedding_vectors;"

# If 0, run the bulk indexing script (Step 4)
```

### Issue 4: "Low similarity scores"

**Solution**:
```json
{
  "query": "your question",
  "max_chunks": 10,              // Increase from 5
  "similarity_threshold": 0.5    // Lower from 0.7
}
```

---

## What to Index First

### Priority 1: Critical Documents
1. Safety policies
2. Maintenance procedures
3. Driver handbooks
4. Compliance regulations

### Priority 2: Operational Documents
1. Vehicle manuals
2. Fuel policies
3. Route guidelines
4. Emergency procedures

### Priority 3: Historical Data
1. Common incident reports
2. Maintenance histories
3. Training materials
4. FAQ documents

---

## Next Steps

### Immediate (Today):
1. ✅ Complete Steps 1-4 above
2. ✅ Verify RAG system works
3. ✅ Index 5-10 key documents

### Short-term (This Week):
1. Index all fleet policies
2. Test document Q&A in frontend
3. Train team on AI features
4. Set up monitoring

### Medium-term (This Month):
1. Implement AI Co-Pilot (see `/AI_COPILOT_IMPLEMENTATION_PLAN.md`)
2. Fine-tune similarity thresholds
3. Collect user feedback
4. Optimize performance

---

## Support & Documentation

### Key Files:
- **Full Assessment**: `/MCP_RAG_ASSESSMENT_REPORT.md`
- **AI Implementation**: `/AI_IMPLEMENTATION_SUMMARY.md`
- **Co-Pilot Plan**: `/AI_COPILOT_IMPLEMENTATION_PLAN.md`
- **Database Schema**: `/api/db/migrations/005_ai_ml_infrastructure.sql`

### Service Documentation:
- **RAG Engine**: `/api/src/services/rag-engine.service.ts`
- **MCP Server**: `/api/src/services/mcp-server.service.ts`
- **Document RAG**: `/api/src/services/document-rag.service.ts`
- **ML Decision Engine**: `/api/src/services/ml-decision-engine.service.ts`

### API Routes:
- **AI Insights**: `/api/src/routes/ai-insights.routes.ts`

---

## Cost Monitoring

### Track Usage:
```bash
# Query count (last 30 days)
psql -d fleet_db -c "
  SELECT COUNT(*),
         AVG(processing_time_ms) as avg_time_ms
  FROM rag_queries
  WHERE created_at > NOW() - INTERVAL '30 days';
"

# Embedding count
psql -d fleet_db -c "
  SELECT COUNT(*) as total_chunks,
         COUNT(DISTINCT document_id) as total_docs
  FROM embedding_vectors;
"
```

### Estimated Costs:
- **Embeddings**: $0.0001 per 1K tokens (~$0.10 per 1000 documents)
- **Queries**: $0.03 per 1K tokens (~$0.50 per 100 queries)
- **Monthly estimate**: $50-150 for typical usage

---

## Success Metrics

### Week 1 Goals:
- [ ] 50+ documents indexed
- [ ] 100+ RAG queries executed
- [ ] 90%+ query satisfaction rate
- [ ] <2 second average response time

### Month 1 Goals:
- [ ] 500+ documents indexed
- [ ] 1000+ queries executed
- [ ] AI features adopted by 80% of users
- [ ] 50%+ reduction in support tickets

---

**Quick Start Complete!**

Your AI systems are production-ready. Follow the steps above to activate them.

For questions, refer to the full assessment report: `/MCP_RAG_ASSESSMENT_REPORT.md`

---

**Document Version**: 1.0
**Created**: November 12, 2025
**Maintainer**: Development Team
