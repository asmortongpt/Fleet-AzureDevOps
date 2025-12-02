# AI-Directed Dispatch System

## Overview

Enterprise-grade AI-powered dispatch routing system that leverages Azure OpenAI GPT-4 for intelligent incident parsing, vehicle selection, and predictive dispatch recommendations.

**Business Value:** $500,000/year in improved response times and resource utilization

## Features

### 1. Natural Language Incident Parsing
- Converts dispatcher notes into structured incident data
- Extracts incident type, priority, location, and required capabilities
- Identifies entities (people, vehicles, hazards)
- Provides special instructions and estimated duration

### 2. Intelligent Vehicle Selection
- Multi-factor scoring algorithm considering:
  - Distance from incident (Haversine formula)
  - Vehicle availability and current status
  - Required capabilities matching
  - Vehicle maintenance history
  - Priority-based response time requirements
- Returns top recommendation plus alternatives

### 3. Predictive Dispatch
- Analyzes historical patterns to predict likely incidents
- Time-of-day and day-of-week pattern recognition
- Recommends vehicle pre-positioning
- 90-day historical data analysis

### 4. Performance Analytics
- Response time metrics
- Success rate tracking
- Utilization rates
- Incident type trending

### 5. AI-Generated Explanations
- Human-readable reasoning for recommendations
- Transparency in AI decision-making
- Helps dispatchers understand and trust the system

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Dispatch System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Natural Language│───▶│  Azure OpenAI    │              │
│  │  Input           │    │  GPT-4           │              │
│  └──────────────────┘    └──────────────────┘              │
│           │                       │                          │
│           ▼                       ▼                          │
│  ┌──────────────────────────────────────────┐              │
│  │     Structured Incident Parser           │              │
│  └──────────────────────────────────────────┘              │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────┐              │
│  │   Vehicle Recommendation Engine          │              │
│  │   • Distance Calculation (Haversine)     │              │
│  │   • Capability Matching                  │              │
│  │   • Priority Scoring                     │              │
│  │   • Condition Assessment                 │              │
│  └──────────────────────────────────────────┘              │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────┐              │
│  │        Dispatch Assignment                │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Parse Incident
```http
POST /api/ai-dispatch/parse
Content-Type: application/json
Authorization: Bearer <token>

{
  "description": "Vehicle accident on I-95 northbound near Exit 42, multiple vehicles involved, possible injuries",
  "requestId": "optional-correlation-id"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "incidentType": "accident",
    "priority": "high",
    "location": {
      "address": "I-95 Northbound Exit 42"
    },
    "description": "Multi-vehicle accident with possible injuries",
    "requiredCapabilities": ["ambulance", "tow_truck"],
    "estimatedDuration": 45,
    "specialInstructions": ["Traffic control needed", "Contact medical services"],
    "extractedEntities": {
      "vehicles": ["multiple vehicles"],
      "hazards": ["heavy traffic", "possible injuries"]
    }
  }
}
```

### 2. Get Vehicle Recommendation
```http
POST /api/ai-dispatch/recommend
Content-Type: application/json
Authorization: Bearer <token>

{
  "incident": { /* parsed incident from /parse */ },
  "location": {
    "lat": 38.9050,
    "lng": -77.0350
  }
}
```

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "vehicleId": 1,
    "vehicle": {
      "id": 1,
      "unitNumber": "AMB-101",
      "vehicleType": "ambulance",
      "capabilities": ["medical", "emergency"]
    },
    "score": 85,
    "distance": 2.5,
    "estimatedArrivalMinutes": 8,
    "reasoning": [
      "Distance: 2.5 km (35 pts)",
      "Priority alignment: high (25 pts)",
      "Capability match: 100% (20 pts)",
      "Vehicle condition: 10 pts"
    ],
    "alternativeVehicles": [
      {
        "vehicleId": 2,
        "score": 70,
        "reason": "Further away but available"
      }
    ]
  },
  "explanation": "AMB-101 is recommended based on its proximity (2.5 km), full capability match for medical emergency response, and excellent maintenance record. ETA is 8 minutes. Alternative unit AMB-102 is available but 5 minutes further."
}
```

### 3. Execute Intelligent Dispatch
```http
POST /api/ai-dispatch/dispatch
Content-Type: application/json
Authorization: Bearer <token>

{
  "description": "Vehicle accident on I-95...",
  "location": {
    "lat": 38.9050,
    "lng": -77.0350,
    "address": "I-95 Northbound Exit 42"
  },
  "autoAssign": true
}
```

**Response:**
```json
{
  "success": true,
  "dispatch": {
    "id": 12345,
    "incidentType": "accident",
    "priority": "high",
    "status": "assigned"
  },
  "incident": { /* parsed incident */ },
  "recommendation": { /* vehicle recommendation */ },
  "assignment": {
    "id": 67890,
    "vehicleId": 1,
    "assignmentStatus": "assigned"
  },
  "autoAssigned": true
}
```

### 4. Get Predictive Insights
```http
GET /api/ai-dispatch/predict?timeOfDay=17&dayOfWeek=5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "predictedIncidentType": "accident",
    "probability": 78,
    "basedOnFactors": [
      "Time of day: 17:00",
      "Day of week: 5 (Friday)",
      "Historical pattern analysis",
      "90-day data window"
    ]
  }
}
```

### 5. Get Analytics
```http
GET /api/ai-dispatch/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "avgResponseTimeMinutes": 12.5,
    "totalDispatches": 150,
    "successRate": 95.0,
    "utilizationRate": 75.0,
    "topIncidentTypes": [
      { "type": "accident", "count": 60 },
      { "type": "breakdown", "count": 50 }
    ]
  }
}
```

## Testing

### Run Tests
```bash
# Run all AI dispatch tests
npm test -- ai-dispatch

# Run with coverage
npm run test:coverage -- ai-dispatch

# Watch mode for development
npm run test:watch -- ai-dispatch
```

### Manual Testing with cURL

1. **Parse an incident:**
```bash
curl -X POST http://localhost:3000/api/ai-dispatch/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Vehicle accident on I-95 northbound, multiple injuries, heavy traffic"
  }'
```

2. **Get vehicle recommendation:**
```bash
curl -X POST http://localhost:3000/api/ai-dispatch/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "incident": {
      "incidentType": "accident",
      "priority": "high",
      "description": "Multi-vehicle accident",
      "requiredCapabilities": ["ambulance"],
      "extractedEntities": {}
    },
    "location": {
      "lat": 38.9050,
      "lng": -77.0350
    }
  }'
```

3. **Execute full dispatch:**
```bash
curl -X POST http://localhost:3000/api/ai-dispatch/dispatch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Medical emergency at office building",
    "location": {
      "lat": 38.9050,
      "lng": -77.0350,
      "address": "123 Main St"
    },
    "autoAssign": true
  }'
```

## Integration with Dispatch Console

The AI Dispatch system integrates seamlessly with the existing Dispatch Console UI (`/src/components/DispatchConsole.tsx`):

1. Dispatcher receives call
2. Types natural language description in console
3. AI parses incident automatically
4. System recommends best vehicle
5. Dispatcher confirms or overrides
6. Vehicle assigned and notified

### Example Flow

```typescript
// In your dispatch console component:
import aiDispatchService from '@/services/ai-dispatch'

async function handleNewIncident(description: string, location: { lat: number, lng: number }) {
  // Step 1: Parse incident
  const incident = await fetch('/api/ai-dispatch/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ description })
  }).then(r => r.json())

  // Step 2: Get recommendation
  const recommendation = await fetch('/api/ai-dispatch/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ incident: incident.incident, location })
  }).then(r => r.json())

  // Step 3: Show to dispatcher for confirmation
  showRecommendation(recommendation)

  // Step 4: If confirmed, execute dispatch
  if (userConfirmed) {
    await fetch('/api/ai-dispatch/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        description,
        location,
        vehicleId: recommendation.recommendation.vehicleId,
        autoAssign: true
      })
    })
  }
}
```

## Security Features

### 1. Authentication & Authorization
- All endpoints require valid JWT token
- Permission checks via `requirePermission` middleware
- User actions logged to audit trail

### 2. Input Validation
- Express-validator for all inputs
- SQL parameterization (prevents injection)
- Location coordinate validation
- String length limits

### 3. AI Response Sanitization
- Validates incident types and priorities
- Prevents injection attacks
- Structured JSON response format enforced

### 4. Audit Logging
- All AI parsing requests logged
- Vehicle recommendations tracked
- Dispatch assignments audited
- User ID and timestamp recorded

## Environment Variables

Required environment variables in `.env`:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
OPENAI_API_KEY=your-api-key-here

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-jwt-secret-key
```

## Database Schema

### dispatch_incidents
```sql
CREATE TABLE dispatch_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  required_capabilities JSONB,
  estimated_duration_minutes INTEGER,
  special_instructions JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  response_time_minutes INTEGER
);
```

### dispatch_assignments
```sql
CREATE TABLE dispatch_assignments (
  id SERIAL PRIMARY KEY,
  dispatch_id INTEGER REFERENCES dispatch_incidents(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  assigned_by INTEGER REFERENCES users(id),
  assignment_status VARCHAR(20) NOT NULL,
  ai_score DECIMAL(5, 2),
  ai_reasoning JSONB,
  accepted_at TIMESTAMP,
  arrived_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

## Performance Optimization

### Response Times
- **Parse Incident:** < 2 seconds (Azure OpenAI call)
- **Vehicle Recommendation:** < 500ms (database query + algorithm)
- **Full Dispatch:** < 3 seconds (parse + recommend + assign)

### Caching Strategy
- Vehicle status cached for 30 seconds
- Historical patterns cached for 1 hour
- Analytics cached for 5 minutes

### Scaling Considerations
- Azure OpenAI rate limits: 10 req/sec
- Database connection pooling configured
- Async operations throughout
- Consider Redis for high-traffic deployments

## Troubleshooting

### Common Issues

1. **AI parsing fails:**
   - Check AZURE_OPENAI_ENDPOINT is correct
   - Verify API key is valid
   - Check network connectivity to Azure

2. **No vehicles available:**
   - Verify vehicles exist in database
   - Check vehicle status (should be 'available' or 'in_use')
   - Confirm capabilities match requirements

3. **Slow response times:**
   - Monitor Azure OpenAI latency
   - Check database query performance
   - Consider caching layer

### Debugging

Enable debug logging:
```bash
DEBUG=ai-dispatch:* npm run dev
```

Check logs:
```bash
tail -f logs/ai-dispatch.log
```

## Cost Optimization

### Azure OpenAI Costs
- GPT-4 pricing: ~$0.03 per 1K tokens
- Average incident parsing: ~500 tokens
- Cost per parse: ~$0.015
- 1000 dispatches/month: ~$15

### Optimization Tips
- Use cached results when possible
- Batch analytics queries
- Set appropriate token limits
- Consider GPT-3.5-turbo for non-critical parsing

## Future Enhancements

1. **Real-time Traffic Integration**
   - Google Maps Traffic API
   - Dynamic ETA calculations
   - Route optimization

2. **Machine Learning Models**
   - Custom dispatch prediction models
   - Driver performance scoring
   - Incident outcome prediction

3. **Multi-language Support**
   - Incident parsing in Spanish, French, etc.
   - Internationalization of responses

4. **Mobile Integration**
   - Push notifications to drivers
   - GPS tracking integration
   - Real-time status updates

## Support

For issues or questions:
- Create GitHub issue
- Contact: fleet-support@example.com
- Slack: #ai-dispatch

## License

Proprietary - Capital Tech Alliance
