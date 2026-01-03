# AI-Powered Task Prioritization System

## Overview

The AI-Powered Task Prioritization System uses Azure OpenAI GPT-4 to intelligently analyze, prioritize, and assign fleet management tasks based on multiple factors including urgency, resource availability, skill matching, and location proximity.

## Features

### 1. **Multi-Factor Priority Scoring**
- Urgency analysis based on due dates and task type
- Business impact assessment
- Resource availability checking
- Dependency complexity evaluation
- Skill matching for optimal assignment
- AI-powered reasoning with confidence scores

### 2. **Smart Task Assignment**
- Skill-based matching to qualified personnel
- Location-aware recommendations
- Workload balancing across team members
- Performance history consideration
- Real-time availability checks

### 3. **Dependency Resolution**
- Automatic dependency graph generation
- Critical path identification
- Topological sort for execution order
- Parallel execution opportunities
- Blocked task detection

### 4. **Resource Optimization**
- Multi-task resource allocation
- Schedule optimization
- Conflict detection and resolution
- Alternative assignment suggestions
- Execution timeline estimation

## API Endpoints

### Base URL
```
/api/ai-tasks
```

### Authentication
All endpoints require JWT authentication and appropriate permissions.

### Endpoints

#### 1. Calculate Priority Score
```http
POST /api/ai-tasks/prioritize
```

**Request Body:**
```json
{
  "task_title": "Engine Repair Required",
  "description": "Check engine light on, needs diagnostic",
  "task_type": "repair",
  "priority": "high",
  "due_date": "2025-12-01T00:00:00Z",
  "estimated_hours": 4,
  "vehicle_id": "uuid-here"
}
```

**Response:**
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
      "skillMatch": 80,
      "estimatedDuration": 4
    },
    "reasoning": "High priority due to immediate operational impact and approaching deadline",
    "confidence": 88
  },
  "message": "Priority score calculated successfully"
}
```

#### 2. Get Assignment Recommendations
```http
POST /api/ai-tasks/assign
```

**Request Body:**
```json
{
  "task_title": "Vehicle Diagnostics",
  "task_type": "diagnostics",
  "priority": "high",
  "estimated_hours": 3,
  "vehicle_id": "uuid-here",
  "consider_location": true
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "taskId": "uuid",
      "recommendedUserId": "uuid",
      "userName": "John Smith",
      "score": 92,
      "reasoning": "Senior technician with ASE certification, currently 2.3 miles from vehicle location, has completed 15 similar tasks with 95% success rate",
      "estimatedStartTime": "2025-11-28T09:00:00Z",
      "estimatedCompletionTime": "2025-11-28T12:00:00Z",
      "distance": 2.3,
      "skillMatch": 95
    }
  ],
  "count": 1,
  "message": "Assignment recommendations generated successfully"
}
```

#### 3. Analyze Dependencies
```http
POST /api/ai-tasks/dependencies
```

**Request Body:**
```json
{
  "task_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "dependencyGraph": {
    "taskId": "uuid",
    "dependencies": ["parent-task-uuid"],
    "dependents": ["child-task-uuid-1", "child-task-uuid-2"],
    "criticalPath": true,
    "canStart": false,
    "blockedBy": ["parent-task-uuid"]
  },
  "message": "Dependency analysis completed successfully"
}
```

#### 4. Get Execution Order
```http
POST /api/ai-tasks/execution-order
```

**Request Body:**
```json
{
  "task_ids": ["uuid-1", "uuid-2", "uuid-3", "uuid-4"]
}
```

**Response:**
```json
{
  "success": true,
  "executionOrder": [
    ["uuid-1", "uuid-2"],  // Level 0: Can run in parallel
    ["uuid-3"],             // Level 1: Depends on level 0
    ["uuid-4"]              // Level 2: Depends on level 1
  ],
  "levels": 3,
  "message": "Execution order calculated successfully"
}
```

#### 5. Optimize Resources
```http
POST /api/ai-tasks/optimize
```

**Request Body:**
```json
{
  "task_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response:**
```json
{
  "success": true,
  "optimizations": [
    {
      "taskId": "uuid-1",
      "recommendedSchedule": "2025-11-28T08:00:00Z",
      "resourceConflicts": [],
      "alternativeAssignments": [
        {
          "recommendedUserId": "user-uuid",
          "userName": "Jane Doe",
          "score": 88,
          "reasoning": "Best match for task requirements"
        }
      ],
      "optimizationScore": 88
    }
  ],
  "count": 3,
  "message": "Resource optimization completed successfully"
}
```

#### 6. Batch Prioritize
```http
POST /api/ai-tasks/batch-prioritize
```

**Request Body:**
```json
{
  "tasks": [
    {
      "task_title": "Task 1",
      "task_type": "maintenance",
      "priority": "medium"
    },
    {
      "task_title": "Task 2",
      "task_type": "repair",
      "priority": "high"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "task": "Task 1",
      "priorityScore": {
        "score": 60,
        "factors": { /* ... */ },
        "reasoning": "...",
        "confidence": 75
      }
    },
    {
      "task": "Task 2",
      "priorityScore": {
        "score": 85,
        "factors": { /* ... */ },
        "reasoning": "...",
        "confidence": 82
      }
    }
  ],
  "count": 2,
  "message": "Batch prioritization completed successfully"
}
```

#### 7. Health Check
```http
GET /api/ai-tasks/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "azureEndpointConfigured": true,
  "apiKeyConfigured": true,
  "message": "AI Task Prioritization service is operational"
}
```

## Configuration

### Environment Variables

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4

# Database
DATABASE_URL=postgresql://localhost:5432/fleet_dev

# Authentication
JWT_SECRET=your-secret-here
```

### Required Database Tables

The system uses the following tables:
- `tasks` - Main task storage
- `users` - User/driver information with skills metadata
- `vehicles` - Vehicle data with location
- `tenants` - Multi-tenancy support
- `audit_logs` - Activity tracking

### User Metadata Schema

Users should have the following metadata structure for optimal AI recommendations:

```json
{
  "skills": ["vehicle_repair", "diagnostics", "electrical"],
  "certifications": ["ASE", "CDL"],
  "experience_level": "senior",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

## Integration Examples

### Frontend Integration

```typescript
// Calculate priority for a new task
async function calculateTaskPriority(taskData: any) {
  const response = await fetch('/api/ai-tasks/prioritize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(taskData)
  })

  const result = await response.json()
  return result.priorityScore
}

// Get assignment recommendations
async function getTaskRecommendations(taskData: any) {
  const response = await fetch('/api/ai-tasks/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...taskData,
      consider_location: true
    })
  })

  const result = await response.json()
  return result.recommendations
}
```

### Backend Integration with Task Management

```typescript
import {
  calculatePriorityScore,
  recommendTaskAssignment
} from './services/ai-task-prioritization'

// When creating a new task
async function createTask(taskData: any, tenantId: string) {
  // Calculate AI priority
  const priorityScore = await calculatePriorityScore({
    ...taskData,
    tenant_id: tenantId
  })

  // Get assignment recommendations
  const recommendations = await recommendTaskAssignment({
    ...taskData,
    tenant_id: tenantId
  }, true)

  // Create task with AI insights
  const task = await pool.query(
    `INSERT INTO tasks (
      tenant_id, task_title, task_type, priority,
      assigned_to, estimated_hours, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      tenantId,
      taskData.task_title,
      taskData.task_type,
      getPriorityLevel(priorityScore.score),
      recommendations[0]?.recommendedUserId,
      taskData.estimated_hours,
      JSON.stringify({
        ai_priority_score: priorityScore.score,
        ai_reasoning: priorityScore.reasoning,
        ai_confidence: priorityScore.confidence
      })
    ]
  )

  return task.rows[0]
}

function getPriorityLevel(score: number): string {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
```

## Security

### Authentication & Authorization
- All endpoints require valid JWT token
- Permissions checked via `requirePermission` middleware
- Tenant isolation enforced in all database queries

### Input Validation
- Zod schemas validate all inputs
- UUID format validation
- SQL injection prevention via parameterized queries
- XSS prevention through input sanitization

### Rate Limiting
- 50 requests per 15 minutes per user
- Prevents API abuse and controls costs

### Audit Logging
- All AI operations logged to `audit_logs` table
- Includes user ID, tenant ID, and operation details
- Enables compliance and monitoring

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run AI prioritization tests specifically
npm test -- ai-task-prioritization

# Run with coverage
npm run test:coverage
```

### Test Coverage
- Unit tests for all core functions
- Integration tests with database
- Security validation tests
- Error handling tests
- Fallback mechanism tests

## Performance

### Optimization Strategies
- Parallel database queries where possible
- Caching of user and vehicle data
- Batch operations for multiple tasks
- Fallback to basic scoring if AI unavailable

### Expected Response Times
- Priority calculation: 1-3 seconds
- Assignment recommendations: 2-4 seconds
- Dependency analysis: < 1 second
- Resource optimization: 3-6 seconds (multiple AI calls)

## Monitoring

### Health Checks
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/ai-tasks/health
```

### Audit Logs
Query audit logs for AI operations:
```sql
SELECT * FROM audit_logs
WHERE action LIKE 'ai_%'
ORDER BY created_at DESC
LIMIT 100;
```

### Error Tracking
- Sentry integration for error monitoring
- Application Insights telemetry
- Winston logging for debugging

## Troubleshooting

### Common Issues

**Issue: AI service returns errors**
- Check `AZURE_OPENAI_ENDPOINT` is configured
- Verify `OPENAI_API_KEY` is valid
- Check Azure OpenAI quota and limits
- System will fall back to basic scoring

**Issue: No assignment recommendations returned**
- Ensure users have `skills` in metadata
- Check users have `is_active = true`
- Verify tenant has active users with driver/technician role

**Issue: Dependency analysis incorrect**
- Check `parent_task_id` relationships in database
- Ensure tasks belong to same tenant
- Verify task statuses are correct

## Cost Optimization

### Azure OpenAI Usage
- Use batch operations where possible
- Implement caching for similar requests
- Monitor token usage via Azure portal
- Set up budget alerts

### Best Practices
1. Use batch-prioritize for multiple tasks
2. Cache AI recommendations for similar tasks
3. Implement request deduplication
4. Monitor rate limits and adjust as needed

## Future Enhancements

- [ ] Machine learning model for priority prediction
- [ ] Historical performance analysis
- [ ] Advanced skill taxonomy
- [ ] Multi-objective optimization
- [ ] Predictive maintenance integration
- [ ] Real-time task reprioritization
- [ ] Natural language task creation
- [ ] Mobile app integration

## Support

For issues or questions:
- Check logs: `tail -f logs/app.log`
- Review audit logs in database
- Contact support with error details
- Include request/response payloads (sanitized)
