# Testing the AI Task Prioritization System

## Quick Start Guide

### 1. Prerequisites

Ensure you have the following configured in your `.env` file:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://andre-m9qftqda-eastus2.cognitiveservices.azure.com/
OPENAI_API_KEY=<your-api-key-from-global-env>
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4.5-preview

# Database
DATABASE_URL=postgresql://localhost:5432/fleet_dev

# Auth
JWT_SECRET=<your-jwt-secret>
```

### 2. Start the Server

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
npm run dev
```

You should see:
```
Server listening on port 3001
AI Task Prioritization routes registered at /api/ai-tasks
```

### 3. Run Health Check

```bash
# First, get a JWT token (login via API or use existing token)
export TOKEN="your-jwt-token-here"

# Check AI service health
curl -H "Authorization: Bearer $TOKEN" \\
  http://localhost:3001/api/ai-tasks/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "azureEndpointConfigured": true,
  "apiKeyConfigured": true,
  "message": "AI Task Prioritization service is operational"
}
```

### 4. Test Priority Calculation

Create a test script `test-prioritize.sh`:

```bash
#!/bin/bash

TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3001/api/ai-tasks/prioritize \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_title": "Critical Engine Repair - Fleet Vehicle 101",
    "description": "Engine making unusual noise, check engine light on. Customer reported issue this morning.",
    "task_type": "repair",
    "priority": "high",
    "due_date": "2025-11-28T17:00:00Z",
    "estimated_hours": 4
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "priorityScore": {
    "score": 85,
    "factors": {
      "urgency": 90,
      "businessImpact": 85,
      "resourceAvailability": 70,
      "dependencyComplexity": 50,
      "skillMatch": 75,
      "estimatedDuration": 4
    },
    "reasoning": "High priority due to critical engine issue, approaching deadline, and significant operational impact. Moderate resource availability.",
    "confidence": 88
  },
  "message": "Priority score calculated successfully"
}
```

### 5. Test Assignment Recommendations

```bash
curl -X POST http://localhost:3001/api/ai-tasks/assign \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_title": "Vehicle Diagnostics - OBD2 Scan",
    "task_type": "diagnostics",
    "description": "Run full diagnostic scan on fleet vehicle",
    "priority": "medium",
    "estimated_hours": 2,
    "consider_location": true
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "taskId": "",
      "recommendedUserId": "uuid-of-user",
      "userName": "John Smith",
      "score": 92,
      "reasoning": "Senior technician with ASE certification, 2.3 miles from location, completed 15 similar diagnostics with 95% success rate",
      "estimatedStartTime": "2025-11-28T09:00:00Z",
      "estimatedCompletionTime": "2025-11-28T11:00:00Z",
      "distance": 2.3,
      "skillMatch": 95
    },
    {
      "recommendedUserId": "uuid-of-user-2",
      "userName": "Jane Doe",
      "score": 87,
      "reasoning": "Experienced technician, currently has lighter workload, 5.1 miles away",
      "estimatedStartTime": "2025-11-28T09:00:00Z",
      "estimatedCompletionTime": "2025-11-28T11:00:00Z",
      "distance": 5.1,
      "skillMatch": 85
    }
  ],
  "count": 2,
  "message": "Assignment recommendations generated successfully"
}
```

### 6. Run Automated Tests

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api

# Run all AI task prioritization tests
npm test ai-task-prioritization

# Run with verbose output
npm test ai-task-prioritization -- --reporter=verbose

# Run with coverage
npm run test:coverage -- ai-task-prioritization
```

**Expected Test Output:**
```
 ✓ ai-task-prioritization.test.ts (15 tests) 45s
   ✓ calculatePriorityScore (4 tests)
     ✓ should calculate priority score for a task
     ✓ should handle tasks without due dates
     ✓ should use fallback scoring when AI fails
     ✓ should reject invalid task data
   ✓ recommendTaskAssignment (3 tests)
     ✓ should recommend users for task assignment
     ✓ should consider location when requested
     ✓ should return empty array when no users available
   ✓ analyzeDependencies (3 tests)
     ✓ should analyze task dependencies
     ✓ should identify tasks on critical path
     ✓ should handle non-existent task gracefully
   ✓ getOptimalExecutionOrder (2 tests)
     ✓ should calculate optimal execution order for independent tasks
     ✓ should respect task dependencies in execution order
   ✓ optimizeResourceAllocation (2 tests)
     ✓ should optimize resource allocation for multiple tasks
     ✓ should handle empty task list
   ✓ Security Validation (3 tests)
   ✓ Error Handling (2 tests)

Tests  15 passed (15)
Duration  45s
```

### 7. Integration Testing Example

Create a file `test-integration.ts`:

```typescript
import {
  calculatePriorityScore,
  recommendTaskAssignment,
  analyzeDependencies,
  optimizeResourceAllocation
} from './src/services/ai-task-prioritization'

async function testFullWorkflow() {
  const tenantId = 'your-tenant-id-here'

  console.log('=== AI Task Prioritization Integration Test ===\\n')

  // Step 1: Create task data
  const taskData = {
    task_title: 'Brake System Inspection',
    description: 'Annual safety inspection for fleet vehicle',
    task_type: 'inspection',
    priority: 'medium' as const,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_hours: 3,
    tenant_id: tenantId
  }

  // Step 2: Calculate priority score
  console.log('1. Calculating priority score...')
  const priorityScore = await calculatePriorityScore(taskData)
  console.log(`   Score: ${priorityScore.score}/100`)
  console.log(`   Confidence: ${priorityScore.confidence}%`)
  console.log(`   Reasoning: ${priorityScore.reasoning}\\n`)

  // Step 3: Get assignment recommendations
  console.log('2. Getting assignment recommendations...')
  const recommendations = await recommendTaskAssignment(taskData, true)
  console.log(`   Found ${recommendations.length} recommendations`)
  if (recommendations.length > 0) {
    const top = recommendations[0]
    console.log(`   Top recommendation: ${top.userName}`)
    console.log(`   Score: ${top.score}/100`)
    console.log(`   Skill match: ${top.skillMatch}%`)
    console.log(`   Distance: ${top.distance?.toFixed(1)} miles\\n`)
  }

  // Step 4: Test with multiple tasks
  console.log('3. Testing resource optimization...')
  // Assume we have task IDs
  const taskIds = ['task-id-1', 'task-id-2', 'task-id-3']
  const optimizations = await optimizeResourceAllocation(taskIds, tenantId)
  console.log(`   Optimized ${optimizations.length} tasks`)
  optimizations.forEach((opt, idx) => {
    console.log(`   Task ${idx + 1}: Score ${opt.optimizationScore}/100`)
  })

  console.log('\\n=== Test Complete ===')
}

// Run the test
testFullWorkflow().catch(console.error)
```

Run it:
```bash
npx tsx test-integration.ts
```

### 8. Performance Testing

Create `test-performance.sh`:

```bash
#!/bin/bash

TOKEN="your-jwt-token-here"
URL="http://localhost:3001/api/ai-tasks/prioritize"

echo "Performance Testing AI Task Prioritization"
echo "=========================================="
echo ""

for i in {1..10}; do
  echo "Request $i:"
  time curl -s -X POST $URL \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{
      "task_title": "Test Task '$i'",
      "task_type": "maintenance",
      "priority": "medium"
    }' > /dev/null
  echo ""
done
```

**Expected Output:**
```
Request 1:
real    0m2.341s

Request 2:
real    0m2.198s

Request 3:
real    0m2.456s

Average: ~2.3 seconds per request
```

### 9. Error Handling Test

Test how the system handles errors:

```bash
# Test with invalid data (missing required fields)
curl -X POST http://localhost:3001/api/ai-tasks/prioritize \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_title": "",
    "task_type": "invalid"
  }' | jq .
```

**Expected Response:**
```json
{
  "error": "Invalid input data",
  "details": [
    {
      "path": ["task_title"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 10. Batch Testing

Test batch prioritization:

```bash
curl -X POST http://localhost:3001/api/ai-tasks/batch-prioritize \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tasks": [
      {
        "task_title": "Oil Change - Vehicle 101",
        "task_type": "maintenance",
        "priority": "low"
      },
      {
        "task_title": "Brake Repair - Vehicle 102",
        "task_type": "repair",
        "priority": "high"
      },
      {
        "task_title": "Safety Inspection - Vehicle 103",
        "task_type": "inspection",
        "priority": "medium"
      }
    ]
  }' | jq .
```

### 11. Monitor Audit Logs

Check that all operations are being logged:

```sql
-- Connect to database
psql $DATABASE_URL

-- View recent AI operations
SELECT
  created_at,
  action,
  user_id,
  details->>'task_title' as task,
  details->>'score' as ai_score
FROM audit_logs
WHERE action LIKE 'ai_%'
ORDER BY created_at DESC
LIMIT 10;
```

### 12. Verify Database Integration

Check that tasks are being created with AI metadata:

```sql
-- View tasks with AI priority scores
SELECT
  task_title,
  priority,
  metadata->>'ai_priority_score' as ai_score,
  metadata->>'ai_confidence' as confidence,
  metadata->>'ai_reasoning' as reasoning
FROM tasks
WHERE metadata ? 'ai_priority_score'
ORDER BY created_at DESC
LIMIT 5;
```

## Troubleshooting

### Issue: "AI service unavailable"

**Solution:**
1. Check Azure OpenAI endpoint is correct
2. Verify API key is valid
3. Check Azure OpenAI quota/limits
4. System will fall back to basic scoring

### Issue: "No assignment recommendations returned"

**Solution:**
1. Ensure users have skills in metadata:
```sql
UPDATE users
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{skills}',
  '["vehicle_repair", "diagnostics"]'::jsonb
)
WHERE role IN ('driver', 'technician');
```

2. Check users are active:
```sql
SELECT id, first_name, last_name, role, is_active
FROM users
WHERE role IN ('driver', 'technician');
```

### Issue: "Rate limit exceeded"

**Solution:**
Wait 15 minutes or adjust rate limit in routes file:
```typescript
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increase from 50
  // ...
})
```

### Issue: Tests timing out

**Solution:**
Increase timeout in test file:
```typescript
it('should calculate priority score', async () => {
  // ...
}, 60000) // 60 second timeout instead of default 30
```

## Success Criteria

✅ Health check returns "healthy"
✅ Priority calculation returns score 0-100
✅ Assignment recommendations return at least 1 user
✅ Tests pass with >90% coverage
✅ API responds in <5 seconds
✅ Audit logs capture all operations
✅ Fallback works when AI unavailable
✅ Security validation prevents SQL injection
✅ Rate limiting prevents abuse

## Next Steps After Testing

1. **Deploy to staging environment**
2. **Conduct load testing**
3. **Train team on new features**
4. **Monitor cost/usage in Azure**
5. **Gather feedback from users**
6. **Iterate based on real-world usage**

---

**For Support:**
- Check logs: `tail -f logs/app.log`
- Review test output
- Check Azure OpenAI service status
- Verify database connectivity
- Examine audit logs for patterns
