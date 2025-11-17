# AI Features Quick Start Guide

Get the AI-powered data intake and validation features up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- OpenAI API key

## Setup

### 1. Install Dependencies

```bash
cd /path/to/Fleet
cd api
npm install
```

### 2. Configure Environment Variables

Add to `/api/.env`:

```bash
# AI Services (REQUIRED)
OPENAI_API_KEY=sk-...

# AI Services (OPTIONAL)
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### 3. Run Database Migration

```bash
# Connect to your database
psql -U fleetadmin -d fleetdb

# Or use connection string
psql postgresql://user:pass@host:port/database

# Run migration
\i api/src/migrations/002-add-ai-features.sql

# Verify tables created
\dt ai_*
```

Expected output:
```
ai_conversations
ai_validations
document_analyses
ai_control_checks
ai_suggestions
ai_anomaly_baselines
ai_evidence
```

### 4. Start Backend

```bash
cd api
npm run dev
```

Backend will start on http://localhost:3000

### 5. Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Test conversational intake (requires auth token)
curl -X POST http://localhost:3000/api/ai/intake/conversation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I filled up truck 101 with 25 gallons for $87.50"
  }'
```

### 6. Start Frontend

```bash
cd ..
npm install
npm run dev
```

Frontend will start on http://localhost:5173

## Quick Examples

### Example 1: Use Conversational Intake Component

```tsx
import { ConversationalIntake } from '@/components/ai'

function MyPage() {
  return (
    <ConversationalIntake
      onSubmit={async (data) => {
        console.log('Extracted data:', data)
        // Create your entity here
      }}
    />
  )
}
```

### Example 2: Use Smart Form with Validation

```tsx
import { SmartForm } from '@/components/ai'

function CreateFuelEntry() {
  return (
    <SmartForm
      entityType="fuel_transaction"
      fields={[
        { name: 'vehicle_id', label: 'Vehicle', type: 'select', required: true },
        { name: 'gallons', label: 'Gallons', type: 'number', required: true },
        { name: 'total_cost', label: 'Total Cost', type: 'number', required: true }
      ]}
      onSubmit={async (data) => {
        await fetch('/api/fuel-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      }}
    />
  )
}
```

### Example 3: Use Document Scanner

```tsx
import { DocumentScanner } from '@/components/ai'

function ReceiptUpload() {
  return (
    <DocumentScanner
      documentType="fuel_receipt"
      onComplete={(analysis) => {
        console.log('Extracted:', analysis.extractedData)
        // Pre-fill form or create transaction
      }}
    />
  )
}
```

### Example 4: Validate Data Programmatically

```typescript
import { apiClient } from '@/lib/api'

async function validateTransaction(data) {
  const response = await apiClient.post('/api/ai/validate', {
    entityType: 'fuel_transaction',
    data: {
      vehicle_id: 'uuid-here',
      gallons: 25,
      total_cost: 87.50,
      date: '2025-11-07'
    }
  })

  console.log('Validation result:', response.data)
  // { isValid: true, confidence: 0.92, warnings: [], anomalies: [], suggestions: [] }
}
```

### Example 5: Check Fraud Controls

```typescript
async function checkControls(transaction) {
  const response = await apiClient.post('/api/ai/controls/check', {
    transactionType: 'fuel_transaction',
    transaction: {
      vehicle_id: 'uuid',
      total_cost: 500,
      date: '2025-11-07'
    }
  })

  const { passed, violations, riskScore, fraudProbability } = response.data

  if (!passed) {
    console.log('Transaction BLOCKED:', violations)
  }

  if (riskScore > 50) {
    console.log('High risk transaction:', riskScore)
  }
}
```

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/intake/conversation` | POST | Natural language processing |
| `/api/ai/intake/submit` | POST | Submit extracted data |
| `/api/ai/validate` | POST | Validate with AI |
| `/api/ai/validate/history` | GET | Get validation history |
| `/api/ai/analyze-document` | POST | Analyze single document |
| `/api/ai/analyze-documents/batch` | POST | Batch analyze documents |
| `/api/ai/documents/review-queue` | GET | Get review queue |
| `/api/ai/documents/:id/review` | POST | Mark as reviewed |
| `/api/ai/controls/check` | POST | Check controls |
| `/api/ai/controls/history` | GET | Get control history |
| `/api/ai/suggestions` | GET | Get smart suggestions |

## Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution:** Add `OPENAI_API_KEY` to your `.env` file

```bash
echo "OPENAI_API_KEY=sk-your-key-here" >> api/.env
```

### Issue: "Table ai_conversations does not exist"

**Solution:** Run the database migration

```bash
psql -U fleetadmin -d fleetdb -f api/src/migrations/002-add-ai-features.sql
```

### Issue: "401 Unauthorized" on API calls

**Solution:** Include JWT token in Authorization header

```typescript
const response = await fetch('/api/ai/validate', {
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`,
    'Content-Type': 'application/json'
  },
  method: 'POST',
  body: JSON.stringify({ ... })
})
```

### Issue: "Module not found: @/components/ai"

**Solution:** Make sure you're importing from the correct path

```tsx
// Correct
import { ConversationalIntake } from '@/components/ai'

// Also works
import { ConversationalIntake } from '@/components/ai/ConversationalIntake'
```

### Issue: Document upload fails

**Solution:** Check file size (<10MB) and format (JPG, PNG, PDF only)

```tsx
// Check before upload
if (file.size > 10 * 1024 * 1024) {
  alert('File too large (max 10MB)')
  return
}

const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
if (!validTypes.includes(file.type)) {
  alert('Invalid file type')
  return
}
```

## Configuration Options

### Adjust Fraud Detection Thresholds

Edit `/api/src/services/ai-controls.ts`:

```typescript
// Line ~45
if (fraudCheck.probability > 0.7) {  // Default: 0.7 (70%)
  // Change to 0.6 for more sensitive, 0.8 for less sensitive
}
```

### Adjust Validation Confidence Threshold

Edit `/api/src/services/ai-validation.ts`:

```typescript
// Line ~280
if (confidenceScores[field] < 0.8) {  // Default: 0.8 (80%)
  needsReview = true
}
```

### Change Statistical Anomaly Z-Score

Edit `/api/src/services/ai-validation.ts`:

```typescript
// Line ~115
if (zScore > 3) {  // Default: 3 standard deviations
  // Change to 2.5 for more sensitive, 4 for less sensitive
}
```

## Next Steps

1. **Read Full Documentation:** See `/docs/AI_FEATURES.md`
2. **Customize for Your Needs:** Edit service files to add custom rules
3. **Write Tests:** Add tests for your specific use cases
4. **Monitor Performance:** Watch API response times and error rates
5. **Gather Feedback:** Test with real users and iterate

## Support

- **Documentation:** `/docs/AI_FEATURES.md`
- **Implementation Summary:** `/AI_IMPLEMENTATION_SUMMARY.md`
- **API Docs:** http://localhost:3000/api/docs (Swagger UI)
- **Issues:** Open GitHub issue with `ai-features` label

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Multer File Upload](https://github.com/expressjs/multer)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

---

**Ready to build?** Start with the conversational intake component - it's the easiest way to see the AI in action!

```bash
# Start both servers
cd api && npm run dev &
cd .. && npm run dev
```

Then visit http://localhost:5173 and look for the AI components in your UI!
