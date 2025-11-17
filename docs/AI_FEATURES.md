# AI-Driven Intelligent Data Intake and Validation System

## Overview

The Fleet Management System includes comprehensive AI-powered features for intelligent data entry, validation, document processing, and fraud detection. These features leverage OpenAI GPT-4, Claude AI, and statistical machine learning to streamline operations and improve data quality.

## Table of Contents

1. [Features Overview](#features-overview)
2. [Natural Language Conversational Intake](#natural-language-conversational-intake)
3. [AI-Powered Validation](#ai-powered-validation)
4. [Enhanced OCR & Document Analysis](#enhanced-ocr--document-analysis)
5. [Intelligent Controls & Fraud Detection](#intelligent-controls--fraud-detection)
6. [Frontend Components](#frontend-components)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Configuration](#configuration)
10. [Examples & Use Cases](#examples--use-cases)

---

## Features Overview

### 1. Natural Language Conversational Intake
- **Multi-turn conversations** for data entry
- **Entity extraction** from natural language
- **Contextual prompting** for missing fields
- **Smart suggestions** based on context
- **Support for multiple intents**: fuel entry, work orders, incidents, inspections

### 2. AI-Powered Validation
- **Statistical anomaly detection** using historical baselines
- **ML-based pattern recognition** for fraud detection
- **Smart defaults** based on context and history
- **Predictive validation** for maintenance schedules
- **Real-time confidence scoring**

### 3. Enhanced OCR & Document Analysis
- **Multi-format support**: receipts, invoices, inspections, licenses, registrations
- **Auto-detection** of document types
- **Confidence scoring** for extracted fields
- **Entity matching** to existing database records
- **Batch processing** for multiple documents
- **Review queue** for low-confidence extractions

### 4. Intelligent Controls & Fraud Detection
- **Fraud pattern detection** (duplicates, impossible scenarios, suspicious patterns)
- **Compliance checking** (licenses, inspections, certifications)
- **Cost controls** with budget alerts and approval routing
- **Risk scoring** for transactions
- **Automated actions** based on risk level

---

## Natural Language Conversational Intake

### How It Works

Users can enter data using natural language instead of filling out forms. The AI:
1. Detects the user's intent (fuel entry, work order, etc.)
2. Extracts structured entities from natural language
3. Prompts for missing required fields
4. Validates data in real-time
5. Confirms before submission

### Example Conversation

```
User: "I filled up truck 101 with 25 gallons at Shell for $87.50"

AI: "Great! I've extracted:
• Vehicle: Truck 101
• Gallons: 25
• Vendor: Shell
• Total Cost: $87.50
• Price per gallon: $3.50

What date was this? (Or press Enter for today)"

User: "yesterday"

AI: "Perfect! I have all the information:
• Vehicle: Ford F-150 (Fleet #101)
• Date: 2025-11-07
• Gallons: 25
• Vendor: Shell Station #4523
• Total Cost: $87.50
• Price per gallon: $3.50

Would you like me to submit this?"

User: "yes"

AI: "Submitted! Transaction recorded successfully."
```

### Supported Intents

#### Fuel Entry
**Required fields**: vehicle, gallons, total_cost, date
**Optional fields**: vendor, odometer, price_per_gallon, location, notes

Example:
```
"Filled up vehicle ABC-123 with 30 gallons at Chevron for $105"
"Gas purchase: $92.40, 28 gallons, truck 505, yesterday"
```

#### Work Order
**Required fields**: vehicle, description, priority
**Optional fields**: assigned_to, due_date, estimated_cost, parts_needed

Example:
```
"Need brake service on vehicle 202, high priority"
"Schedule oil change for van 303 next Tuesday"
```

#### Incident Report
**Required fields**: vehicle, incident_type, date, description
**Optional fields**: driver, location, severity, witnesses

Example:
```
"Had a minor accident with vehicle 101 this morning at 5th and Main"
"Driver John Smith reported a fender bender yesterday"
```

#### Inspection
**Required fields**: vehicle, inspection_type, date
**Optional fields**: inspector, passed, issues_found, next_due_date

Example:
```
"Completed safety inspection on truck 404, passed all checks"
"DOT inspection for vehicle 202, found brake issues"
```

### API Usage

```typescript
// Initialize conversation
const context = {
  conversationId: uuidv4(),
  tenantId: 'your-tenant-id',
  userId: 'user-id',
  messages: [],
  extractedData: {},
  intent: null,
  completeness: 0,
  missingFields: [],
  validationWarnings: []
}

// Send message
const response = await apiClient.post('/api/ai/intake/conversation', {
  message: "I filled up truck 101 with gas",
  context
})

// Response contains:
// - response: AI's reply
// - updatedContext: Updated conversation state
// - readyToSubmit: Boolean indicating if all data is collected
// - validatedData: Final data if ready to submit
// - suggestions: Smart suggestions for fields
```

---

## AI-Powered Validation

### Anomaly Detection

The system automatically detects anomalies using statistical baselines calculated from historical data.

#### Fuel Price Anomaly
```javascript
{
  type: 'fuel_price_outlier',
  description: 'Fuel price $12.50/gal is unusually high',
  expectedRange: [3.20, 4.80],
  actualValue: 12.50,
  zScore: 4.2
}
```

#### Fuel Consumption Anomaly
```javascript
{
  type: 'fuel_consumption_outlier',
  description: 'Fuel amount 85 gallons is unusual for this vehicle',
  expectedRange: [20, 35],
  actualValue: 85,
  zScore: 3.8
}
```

#### Duplicate Detection
```javascript
{
  type: 'possible_duplicate',
  description: 'Similar transaction found within the last hour for this vehicle',
  actualValue: 87.50
}
```

### Smart Suggestions

The system provides intelligent suggestions based on context and historical patterns:

```javascript
{
  field: 'vendor_id',
  value: 'vendor-uuid-123',
  reason: 'Commonly used vendor: Shell Station #4523',
  confidence: 0.85
}
```

```javascript
{
  field: 'price_per_gallon',
  value: 3.50,
  reason: 'Calculated from total cost and gallons',
  confidence: 1.0
}
```

```javascript
{
  field: 'fuel_type',
  value: 'diesel',
  reason: 'Based on vehicle specifications',
  confidence: 0.95
}
```

### Validation Warnings

```javascript
{
  field: 'total_cost',
  message: 'Amount is 40% higher than typical for this vehicle',
  severity: 'warning',
  suggestedValue: null
}
```

### API Usage

```typescript
// Validate data
const validation = await apiClient.post('/api/ai/validate', {
  entityType: 'fuel_transaction',
  data: {
    vehicle_id: 'vehicle-uuid',
    gallons: 25,
    total_cost: 87.50,
    price_per_gallon: 3.50,
    date: '2025-11-07'
  }
})

// Response structure:
{
  isValid: true,
  confidence: 0.92,
  warnings: [
    {
      field: 'price_per_gallon',
      message: 'Price is 15% higher than recent average',
      severity: 'info'
    }
  ],
  anomalies: [],
  suggestions: [
    {
      field: 'fuel_type',
      value: 'diesel',
      reason: 'Based on vehicle type',
      confidence: 0.95
    }
  ],
  autoCorrections: []
}
```

---

## Enhanced OCR & Document Analysis

### Supported Document Types

1. **Fuel Receipts** - Extract date, vendor, cost, gallons, vehicle identifier
2. **Parts Invoices** - Extract invoice number, line items, costs, vehicle
3. **Service Invoices** - Extract services performed, labor, parts, total
4. **Inspection Reports** - Extract inspection date, type, results, issues
5. **Driver Licenses** - Extract license info, expiration, endorsements
6. **Vehicle Registrations** - Extract VIN, plate, owner, expiration

### How It Works

1. **Upload document** (image or PDF)
2. **Auto-detect document type** using GPT-4 Vision
3. **Extract all fields** with confidence scores
4. **Match entities** to database (vehicles, vendors, drivers)
5. **Validate extracted data** for sanity
6. **Flag for review** if confidence < 80%

### Example Analysis Result

```javascript
{
  documentType: 'fuel_receipt',
  confidence: 0.94,
  extractedData: {
    date: {
      value: '2025-11-07',
      confidence: 0.98,
      needsReview: false
    },
    vendor_name: {
      value: 'Shell Station',
      confidence: 0.95,
      needsReview: false
    },
    total_cost: {
      value: 87.50,
      confidence: 0.99,
      needsReview: false
    },
    gallons: {
      value: 25,
      confidence: 0.97,
      needsReview: false
    },
    vehicle_identifier: {
      value: 'FL-101',
      confidence: 0.78,
      needsReview: true
    }
  },
  suggestedMatches: {
    vehicle: {
      id: 'vehicle-uuid-101',
      name: 'Ford F-150 (Fleet #101)',
      confidence: 0.92
    },
    vendor: {
      id: 'vendor-uuid-shell',
      name: 'Shell Station #4523',
      confidence: 0.88
    }
  },
  validationIssues: [
    'Low confidence (78%) for vehicle_identifier'
  ]
}
```

### API Usage

```typescript
// Single document
const formData = new FormData()
formData.append('file', fileBlob)
formData.append('documentType', 'fuel_receipt') // optional

const analysis = await apiClient.post('/api/ai/analyze-document', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// Batch processing
const formData = new FormData()
files.forEach(file => formData.append('files', file))

const analyses = await apiClient.post('/api/ai/analyze-documents/batch', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// Get review queue
const needsReview = await apiClient.get('/api/ai/documents/review-queue?limit=20')

// Mark as reviewed
await apiClient.post(`/api/ai/documents/${documentId}/review`, {
  corrections: {
    vehicle_identifier: 'FL-101' // corrected value
  }
})
```

---

## Intelligent Controls & Fraud Detection

### Fraud Detection Patterns

#### 1. Duplicate Transactions
Detects same vehicle, similar amount, same day
```javascript
probability += 0.6
reasons.push('Potential duplicate transaction detected')
```

#### 2. Round Number Pattern
Fraudsters often use round numbers ($100, $50, etc.)
```javascript
if (total_cost % 10 === 0 && total_cost > 50) {
  probability += 0.15
  reasons.push('Transaction amount is a round number (suspicious pattern)')
}
```

#### 3. After-Hours Pattern
Unusual transaction times
```javascript
if (hour < 5 || hour > 22) {
  probability += 0.2
  reasons.push('Unusual after-hours transaction pattern')
}
```

#### 4. Card Sharing Pattern
Multiple vehicles, same vendor, identical amounts
```javascript
if (vehicle_count > 3 && same_amount) {
  probability += 0.4
  reasons.push('Multiple vehicles with identical transaction amounts')
}
```

#### 5. High Frequency
Too many transactions in short time
```javascript
if (count_24h > 3) {
  probability += 0.5
  reasons.push('Unusually high transaction frequency')
}
```

### Compliance Checks

#### Vehicle Compliance
- Out of service status → **BLOCK**
- Inspection overdue → **REQUIRE APPROVAL**
- Inspection due soon → **WARN**

#### Driver Compliance
- License expired → **BLOCK**
- License expiring < 30 days → **WARN**
- Driver suspended → **BLOCK**

### Cost Controls

#### Budget Thresholds
- \> $500 → Require Fleet Manager approval
- \> $2000 → Require Finance Manager approval
- Monthly budget exceeded → Require approval + warn

#### Vehicle Maintenance Limits
- Annual maintenance > 50% of vehicle value → Flag for replacement consideration

### Risk Scoring

Risk score calculated from:
- Fraud probability (0-50 points)
- Violation severity:
  - Critical: +20 points
  - High: +10 points
  - Medium: +5 points
  - Low: +2 points

**Total risk score: 0-100**
- 0-30: Low risk (green)
- 31-60: Medium risk (yellow)
- 61-80: High risk (orange)
- 81-100: Critical risk (red)

### API Usage

```typescript
// Check controls
const check = await apiClient.post('/api/ai/controls/check', {
  transactionType: 'fuel_transaction',
  transaction: {
    vehicle_id: 'vehicle-uuid',
    total_cost: 87.50,
    date: '2025-11-07',
    vendor_id: 'vendor-uuid'
  }
})

// Response:
{
  passed: true,
  violations: [
    {
      rule: 'approaching_budget_limit',
      severity: 'medium',
      message: 'Approaching monthly fuel budget (89.2% used)',
      action: 'warn'
    }
  ],
  requiredApprovals: [],
  automatedActions: [],
  riskScore: 25,
  fraudProbability: 0.12
}

// Get control history
const history = await apiClient.get('/api/ai/controls/history?limit=50&severity=high')
```

---

## Frontend Components

### ConversationalIntake

Chat-like interface for natural language data entry.

```tsx
import { ConversationalIntake } from '@/components/ai/ConversationalIntake'

<ConversationalIntake
  onSubmit={(data) => {
    console.log('Submitted:', data)
    // Create fuel transaction, work order, etc.
  }}
  onCancel={() => setShowIntake(false)}
  initialIntent="fuel_entry" // optional
/>
```

**Props:**
- `onSubmit?: (data: any) => void` - Callback when data is ready
- `onCancel?: () => void` - Callback for cancel action
- `initialIntent?: string` - Pre-set the intent

### SmartForm

Enhanced form with AI validation and suggestions.

```tsx
import { SmartForm } from '@/components/ai/SmartForm'

<SmartForm
  entityType="fuel_transaction"
  fields={[
    { name: 'vehicle_id', label: 'Vehicle', type: 'select', required: true },
    { name: 'gallons', label: 'Gallons', type: 'number', required: true },
    { name: 'total_cost', label: 'Total Cost', type: 'number', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true }
  ]}
  onSubmit={async (data) => {
    await createFuelTransaction(data)
  }}
  onCancel={() => setShowForm(false)}
/>
```

**Props:**
- `entityType: string` - Type of entity being created
- `fields: FieldConfig[]` - Field definitions
- `initialData?: Record<string, any>` - Pre-filled data
- `onSubmit: (data: any) => Promise<void>` - Submit callback
- `onCancel?: () => void` - Cancel callback

### DocumentScanner

Intelligent document upload with OCR.

```tsx
import { DocumentScanner } from '@/components/ai/DocumentScanner'

<DocumentScanner
  documentType="fuel_receipt"
  allowBatch={true}
  onComplete={(analysis) => {
    console.log('Analysis:', analysis)
    // Pre-fill form with extracted data
  }}
/>
```

**Props:**
- `documentType?: string` - Expected document type (optional, will auto-detect)
- `onComplete?: (analysis: DocumentAnalysis) => void` - Callback with analysis
- `allowBatch?: boolean` - Enable batch processing

---

## API Reference

### Conversational Intake

#### POST /api/ai/intake/conversation
Process natural language message

**Request:**
```json
{
  "message": "I filled up truck 101 with gas",
  "context": { ... }
}
```

**Response:**
```json
{
  "response": "Great! What was the total cost?",
  "updatedContext": { ... },
  "readyToSubmit": false,
  "suggestions": [ ... ]
}
```

#### POST /api/ai/intake/submit
Submit extracted data

**Request:**
```json
{
  "entityType": "fuel_entry",
  "data": { ... },
  "conversationId": "uuid"
}
```

### Validation

#### POST /api/ai/validate
Validate data with AI

**Request:**
```json
{
  "entityType": "fuel_transaction",
  "data": { ... }
}
```

**Response:**
```json
{
  "isValid": true,
  "confidence": 0.92,
  "warnings": [ ... ],
  "anomalies": [ ... ],
  "suggestions": [ ... ]
}
```

#### GET /api/ai/validate/history
Get validation history

**Query params:** `entityType`, `entityId`, `limit`

### Document Analysis

#### POST /api/ai/analyze-document
Analyze single document

**Request:** `multipart/form-data` with `file` and optional `documentType`

**Response:** DocumentAnalysis object

#### POST /api/ai/analyze-documents/batch
Batch analyze documents

**Request:** `multipart/form-data` with `files[]`

**Response:** Array of DocumentAnalysis objects

#### GET /api/ai/documents/review-queue
Get documents needing review

**Query params:** `limit` (default: 20)

#### POST /api/ai/documents/:documentId/review
Mark document as reviewed

**Request:**
```json
{
  "corrections": {
    "field": "corrected_value"
  }
}
```

### Controls

#### POST /api/ai/controls/check
Check intelligent controls

**Request:**
```json
{
  "transactionType": "fuel_transaction",
  "transaction": { ... }
}
```

**Response:** ControlCheck object

#### GET /api/ai/controls/history
Get control check history

**Query params:** `transactionType`, `passed`, `severity`, `limit`

---

## Database Schema

### ai_conversations
Stores conversation history for natural language intake.

**Key fields:**
- `conversation_id` - Unique conversation identifier
- `intent` - Detected intent (fuel_entry, work_order, etc.)
- `extracted_data` - JSON of extracted fields
- `completeness` - Percentage complete (0-100)
- `missing_fields` - Array of missing required fields

### ai_validations
Stores validation results and anomaly detection.

**Key fields:**
- `entity_type` - Type of entity validated
- `validation_result` - Full validation result JSON
- `confidence` - Confidence score (0-1)
- `anomalies` - Detected anomalies JSON
- `suggestions` - Smart suggestions JSON

### document_analyses
Stores OCR and document analysis results.

**Key fields:**
- `document_type` - Detected document type
- `extracted_data` - Extracted fields with confidence
- `suggested_matches` - Matched database entities
- `needs_review` - Flag for manual review
- `reviewed` - Review completion status

### ai_control_checks
Stores fraud detection and control check results.

**Key fields:**
- `transaction_type` - Type of transaction
- `passed` - Whether controls passed
- `violations` - Array of violations
- `required_approvals` - Approvals needed
- `severity` - Highest violation severity
- `action_taken` - Action taken (warn/block/allow)

### ai_anomaly_baselines
Caches statistical baselines for performance.

**Key fields:**
- `metric_name` - Metric being tracked
- `statistical_data` - Mean, median, std dev, percentiles
- `sample_size` - Number of data points
- `last_calculated` - Timestamp of calculation

---

## Configuration

### Environment Variables

```bash
# AI Services
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...  # optional

# Model Selection (optional)
AI_INTAKE_MODEL=gpt-4  # default: gpt-4
AI_VALIDATION_MODEL=gpt-4  # default: gpt-4
AI_OCR_MODEL=gpt-4-vision-preview  # default: gpt-4-vision-preview

# Feature Flags
ENABLE_AI_INTAKE=true
ENABLE_AI_VALIDATION=true
ENABLE_AI_OCR=true
ENABLE_AI_CONTROLS=true

# Thresholds
FRAUD_THRESHOLD=0.7  # 0-1, default: 0.7
ANOMALY_Z_SCORE_THRESHOLD=3.0  # default: 3.0
VALIDATION_CONFIDENCE_THRESHOLD=0.8  # default: 0.8
```

### Customization

#### Add New Intent

Edit `/api/src/services/ai-intake.ts`:

```typescript
const INTENT_SCHEMAS = {
  // ... existing intents
  my_custom_intent: {
    required: ['field1', 'field2'],
    optional: ['field3'],
    entityTypes: {
      field1: 'vehicle',
      field2: 'number'
    }
  }
}
```

#### Add New Document Type

Edit `/api/src/services/ai-ocr.ts`:

```typescript
const EXTRACTION_SCHEMAS = {
  // ... existing types
  my_document_type: {
    fields: ['field1', 'field2', 'field3'],
    required: ['field1', 'field2']
  }
}
```

#### Customize Control Rules

Edit `/api/src/services/ai-controls.ts` to add custom validation logic in:
- `checkForFraud()` - Fraud detection rules
- `checkCompliance()` - Compliance rules
- `checkCostControls()` - Budget and cost rules

---

## Examples & Use Cases

### Use Case 1: Quick Fuel Entry

**Without AI:**
1. Click "Add Fuel Transaction"
2. Select vehicle from dropdown
3. Enter date
4. Enter vendor
5. Enter gallons
6. Enter total cost
7. Calculate price per gallon manually
8. Submit

**With AI:**
1. Type: "Filled truck 101 with 25 gallons at Shell for $87.50 yesterday"
2. Confirm
3. Done

**Time saved:** 80%

### Use Case 2: Receipt Processing

**Without AI:**
1. Take photo of receipt
2. Manually enter all fields from receipt
3. Calculate totals
4. Match vehicle by looking up fleet number
5. Submit

**With AI:**
1. Upload/capture receipt photo
2. Review auto-extracted data (all fields filled, vehicle matched)
3. Confirm
4. Done

**Time saved:** 75%

### Use Case 3: Fraud Detection

**Scenario:** Employee submits duplicate fuel transaction

**Without AI:**
- Goes undetected until manual audit
- Money lost

**With AI:**
1. Transaction submitted
2. AI detects duplicate (same vehicle, amount, date)
3. Automatically flagged with 85% fraud probability
4. Transaction blocked
5. Security team notified

**Fraud prevented:** 100% of this incident

### Use Case 4: Compliance Monitoring

**Scenario:** Driver with expired license attempts to use vehicle

**Without AI:**
- Driver operates illegally
- Company liable
- Discovered during incident or audit

**With AI:**
1. Work order created for vehicle with driver assignment
2. AI checks driver compliance
3. Detects expired license
4. **Blocks** the assignment
5. Alert sent to fleet manager

**Compliance violation prevented:** Yes

---

## Best Practices

### 1. Natural Language Intake
- Use complete sentences for better extraction
- Include key identifiers (fleet numbers, dates, amounts)
- Confirm extracted data before submission
- Use voice-to-text on mobile for faster entry

### 2. Validation
- Review warnings even if severity is "info"
- Investigate all anomalies
- Trust high-confidence suggestions (>90%)
- Build historical data for better baselines

### 3. Document Scanning
- Use good lighting for photos
- Capture full document (all corners visible)
- Review low-confidence extractions manually
- Correct errors to improve AI learning

### 4. Controls
- Set appropriate thresholds for your organization
- Regularly review control check history
- Investigate patterns in flagged transactions
- Adjust approval levels based on risk appetite

---

## Troubleshooting

### Issue: Low extraction confidence

**Causes:**
- Poor image quality
- Unusual receipt format
- Missing information on document

**Solutions:**
- Retake photo with better lighting
- Manual entry for non-standard formats
- Provide feedback for AI learning

### Issue: False fraud detection

**Causes:**
- Legitimate unusual transaction
- Insufficient historical data
- Over-sensitive thresholds

**Solutions:**
- Provide override reason
- Adjust fraud threshold
- Build more historical baselines

### Issue: Slow validation

**Causes:**
- Large historical dataset
- Multiple concurrent validations
- API rate limits

**Solutions:**
- Use cached baselines
- Implement request queuing
- Optimize database queries

---

## Future Enhancements

1. **Voice Input** - Hands-free data entry via voice commands
2. **Predictive Maintenance** - ML models to predict failures
3. **Route Optimization** - AI-powered route planning
4. **Driver Coaching** - Behavior analysis and recommendations
5. **Multi-language Support** - Natural language intake in multiple languages
6. **Custom AI Models** - Fine-tuned models for specific use cases
7. **Automated Auditing** - AI-powered audit trail analysis

---

## Support

For questions or issues:
- Email: support@fleetmanagement.com
- Documentation: https://docs.fleetmanagement.com
- API Status: https://status.fleetmanagement.com
