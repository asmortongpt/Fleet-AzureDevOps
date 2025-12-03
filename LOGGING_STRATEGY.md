# Logging Strategy

## Log Levels

### ERROR (0)
- Application crashes
- Database connection failures
- Unhandled exceptions
- External service failures

### WARN (1)
- Slow queries (>1s)
- High memory usage (>80%)
- Authentication failures
- Deprecated API usage

### INFO (2)
- Application startup/shutdown
- Request logging (production)
- Business events (order created, user registered)
- Scheduled job execution

### DEBUG (3)
- Detailed request/response data
- Query execution plans
- Cache hit/miss
- Service method calls

## Log Format

```json
{
  "timestamp": "2025-12-03T03:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "context": {
    "requestId": "req-123",
    "userId": 456,
    "tenantId": 1,
    "method": "GET",
    "path": "/api/vehicles",
    "statusCode": 200,
    "duration": 45
  }
}
```

## PII Sanitization

Always sanitize:
- Passwords
- API keys
- Auth tokens
- Email addresses (in production)
- Phone numbers
- Social security numbers

## Retention Policy

- ERROR logs: 90 days
- WARN logs: 30 days
- INFO logs: 7 days
- DEBUG logs: 1 day (development only)

## Implementation

```typescript
import logger from './config/logger';

// Good
logger.info('User created', {
  userId: user.id,
  tenantId: user.tenantId,
  email: sanitize(user.email)
});

// Bad - contains PII
logger.info('User created', { user });
```
