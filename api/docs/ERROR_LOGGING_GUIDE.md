# Winston Error Logging - Comprehensive Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Log Levels](#log-levels)
7. [Specialized Loggers](#specialized-loggers)
8. [Request ID Tracking](#request-id-tracking)
9. [Performance Logging](#performance-logging)
10. [Security Audit Logging](#security-audit-logging)
11. [Business Event Logging](#business-event-logging)
12. [Log Format & Structure](#log-format--structure)
13. [Log Rotation](#log-rotation)
14. [Integration with Monitoring](#integration-with-monitoring)
15. [Best Practices](#best-practices)
16. [Troubleshooting](#troubleshooting)
17. [Compliance & Evidence](#compliance--evidence)
18. [Migration from console.log](#migration-from-consolelog)
19. [Testing](#testing)
20. [FAQ](#faq)

---

## Overview

The Fleet Management System uses Winston as its enterprise logging framework, providing structured, centralized logging with support for:

- **Multiple log levels** (error, warn, info, http, debug, security)
- **Structured JSON logging** for machine parsing
- **Multiple transports** (console, file, external services)
- **Log rotation** (automatic file rotation and retention)
- **Request correlation** (unique request IDs for distributed tracing)
- **Performance monitoring** (API, database, cache, external API timing)
- **Security audit trails** (authentication, authorization, data access)
- **Compliance evidence** (FedRAMP, SOC 2, GDPR)

### Why Winston?

- ✅ **Production-ready**: Battle-tested in enterprise environments
- ✅ **Flexible**: Support for multiple transports and formats
- ✅ **Performant**: Async logging with buffering
- ✅ **Extensible**: Custom transports, formats, and metadata
- ✅ **Standards-compliant**: Supports syslog levels and RFC 5424

### Key Features

```typescript
// Basic logging
logger.info('User logged in successfully')

// Structured logging with metadata
logger.error('Payment processing failed', {
  userId: '123',
  amount: 99.99,
  error: err.message
})

// Request-correlated logging
const requestLogger = getRequestLogger(req)
requestLogger.info('Processing vehicle update')

// Performance tracking
perfLogger.endpoint({
  method: 'POST',
  path: '/api/vehicles',
  statusCode: 201,
  duration: 145
})

// Security audit trail
securityLogger.auth('login', {
  userId: '123',
  email: 'user@example.com',
  ip: '192.168.1.1'
})
```

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Routes  │  Services  │  Middleware  │  Controllers  │  Models   │
└────┬─────────────┬─────────────┬─────────────┬─────────────┬────┘
     │             │             │             │             │
     └─────────────┴─────────────┴─────────────┴─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Logger Facade    │
                    │  (utils/logger.ts) │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────┴────┐         ┌─────┴─────┐       ┌────┴────┐
    │  Base   │         │ Security  │       │  Perf   │
    │ Logger  │         │  Logger   │       │ Logger  │
    └────┬────┘         └─────┬─────┘       └────┬────┘
         │                    │                   │
         └────────────────────┼───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Winston Core       │
                    │ (Formatters/Levels)│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
  ┌─────┴──────┐       ┌──────┴──────┐      ┌──────┴──────┐
  │  Console   │       │    File     │      │   External  │
  │ Transport  │       │  Transport  │      │  Transport  │
  └────────────┘       └─────┬───────┘      └─────────────┘
                             │
                    ┌────────┴────────┐
                    │  Log Rotation   │
                    │ (combined.log,  │
                    │  error.log,     │
                    │  security.log)  │
                    └─────────────────┘
```

### File Structure

```
api/
├── src/
│   ├── utils/
│   │   └── logger.ts              # Main logger configuration
│   ├── middleware/
│   │   └── request-id.ts          # Request ID tracking
│   ├── monitoring/
│   │   ├── datadog.ts             # Datadog integration
│   │   └── sentry.ts              # Sentry integration
│   └── config/
│       └── environment.ts         # LOG_LEVEL configuration
├── logs/
│   ├── combined.log               # All logs
│   ├── error.log                  # Error-level logs only
│   ├── security.log               # Security audit logs
│   └── access.log                 # HTTP access logs
└── docs/
    └── ERROR_LOGGING_GUIDE.md     # This file
```

---

## Installation & Setup

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- Winston ^3.11.0 (already installed)

### Package Installation

Winston is already installed in the project. If you need to add it to a new project:

```bash
npm install winston
npm install --save-dev @types/node
```

### Environment Variables

Configure logging behavior via environment variables:

```bash
# .env file

# Log level (error, warn, info, http, debug, security)
LOG_LEVEL=info                    # Production: info, Development: debug

# Node environment (affects log format)
NODE_ENV=production               # production | development | test

# Log file paths (optional - defaults to ./logs/)
LOG_DIR=./logs

# External logging services
DATADOG_API_KEY=your_datadog_key
SENTRY_DSN=your_sentry_dsn
```

### Initial Setup

1. **Import logger in your files**:

```typescript
import logger from '@/utils/logger'
```

2. **Add request ID middleware to Express app** (server.ts):

```typescript
import { requestIdMiddleware } from '@/middleware/request-id'

app.use(requestIdMiddleware())
```

3. **Ensure logs directory exists**:

The logger automatically creates the `logs/` directory on startup.

---

## Configuration

### Log Levels

Winston uses npm log levels by default, extended with a custom `security` level:

```typescript
const customLevels = {
  levels: {
    error: 0,    // System errors, exceptions
    warn: 1,     // Warnings, potential issues
    info: 2,     // General information, business events
    http: 3,     // HTTP access logs
    debug: 4,     // Detailed debugging information
    security: 5  // Security audit events
  }
}
```

**Priority Order**: error (highest) → warn → info → http → debug → security (lowest)

When `LOG_LEVEL=info`, only error, warn, and info logs are recorded.

### Log Formats

#### Development Format (Human-Readable)

```
2025-12-02 10:30:45 [info]: User logged in successfully
{
  "userId": "123",
  "email": "user@example.com",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Features:
- Timestamp with readable format
- Colorized log levels
- Pretty-printed JSON metadata
- Error stack traces included

#### Production Format (JSON)

```json
{
  "timestamp": "2025-12-02T10:30:45.123Z",
  "level": "info",
  "message": "User logged in successfully",
  "userId": "123",
  "email": "user@example.com",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Features:
- Machine-parseable JSON
- ISO 8601 timestamps
- Flat structure for log aggregation
- Stack traces in `stack` field

### Transports

#### Console Transport

Always enabled. Uses:
- **Development**: Pretty-printed, colorized format
- **Production**: JSON format for container log aggregation

```typescript
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
})
```

#### File Transports

Enabled in production. Four separate log files:

1. **combined.log**: All logs (level: all)
2. **error.log**: Errors only (level: error)
3. **security.log**: Security events (level: security)
4. **access.log**: HTTP requests (level: http)

Configuration:
```typescript
new winston.transports.File({
  filename: path.join(logsDir, 'combined.log'),
  maxsize: 10485760,  // 10MB per file
  maxFiles: 5,        // Keep 5 rotated files
  format: prodFormat
})
```

---

## Usage Examples

### Basic Logging

```typescript
import logger from '@/utils/logger'

// Info log
logger.info('Vehicle created successfully')

// Warning log
logger.warn('Fuel level below threshold')

// Error log
logger.error('Failed to connect to database')

// Debug log (only in development)
logger.debug('Processing payment', { amount: 99.99 })
```

### Structured Logging with Metadata

```typescript
// Good: Structured metadata
logger.info('Payment processed', {
  userId: '123',
  amount: 99.99,
  currency: 'USD',
  paymentMethod: 'credit_card',
  transactionId: 'txn_abc123'
})

// Bad: String concatenation
logger.info(`Payment of $99.99 processed for user 123`)
```

### Error Logging with Stack Traces

```typescript
try {
  await processPayment(paymentData)
} catch (error) {
  logger.error('Payment processing failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    userId: user.id,
    amount: paymentData.amount,
    paymentMethod: paymentData.method
  })

  // Re-throw if necessary
  throw error
}
```

### HTTP Request Logging

```typescript
import { getRequestLogger } from '@/middleware/request-id'

export async function getVehicles(req: Request, res: Response) {
  const reqLogger = getRequestLogger(req)

  reqLogger.info('Fetching vehicles', {
    tenantId: req.user.tenant_id,
    filters: req.query
  })

  try {
    const vehicles = await vehicleService.getAll(req.user.tenant_id)

    reqLogger.info('Vehicles fetched successfully', {
      count: vehicles.length
    })

    res.json(vehicles)
  } catch (error) {
    reqLogger.error('Failed to fetch vehicles', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    res.status(500).json({ error: 'Internal server error' })
  }
}
```

---

## Log Levels

### Error Level

**When to use**: System errors, exceptions, failures that require immediate attention

```typescript
logger.error('Database connection failed', {
  error: err.message,
  host: process.env.DB_HOST,
  retries: 3
})
```

**Examples**:
- Database connection failures
- Unhandled exceptions
- Payment processing failures
- External API failures
- Data corruption detected

### Warn Level

**When to use**: Potential issues, degraded performance, recoverable errors

```typescript
logger.warn('Slow database query detected', {
  query: 'SELECT * FROM vehicles',
  duration: 5023,
  threshold: 1000
})
```

**Examples**:
- Slow queries (>1s)
- API rate limit warnings
- Deprecated API usage
- Configuration issues
- Resource constraints

### Info Level

**When to use**: General information, business events, successful operations

```typescript
logger.info('Vehicle maintenance scheduled', {
  vehicleId: '123',
  serviceType: 'oil_change',
  scheduledDate: '2025-12-15'
})
```

**Examples**:
- User actions (login, logout, create, update, delete)
- Business events (order placed, payment received)
- Scheduled job execution
- Configuration changes
- System startup/shutdown

### HTTP Level

**When to use**: HTTP request/response logging (automatically handled by middleware)

```typescript
logger.http('Request completed', {
  method: 'POST',
  path: '/api/vehicles',
  statusCode: 201,
  duration: 145,
  requestId: 'abc-123'
})
```

**Examples**:
- Incoming requests
- Request completion
- API endpoint performance
- Rate limit hits

### Debug Level

**When to use**: Detailed debugging information (development only)

```typescript
logger.debug('Processing vehicle update', {
  vehicleId: '123',
  changes: {
    mileage: { old: 50000, new: 50100 },
    status: { old: 'active', new: 'maintenance' }
  }
})
```

**Examples**:
- Function entry/exit
- Variable values
- Conditional branch execution
- Loop iterations
- Temporary diagnostic logs

---

## Specialized Loggers

### Security Logger

Track authentication, authorization, data access, and security incidents.

#### Authentication Events

```typescript
import { securityLogger } from '@/utils/logger'

// Successful login
securityLogger.auth('login', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  tenantId: user.tenant_id
})

// Failed login
securityLogger.auth('failed_login', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  reason: 'Invalid password'
})

// Logout
securityLogger.auth('logout', {
  userId: user.id,
  email: user.email,
  ip: req.ip
})

// Token refresh
securityLogger.auth('token_refresh', {
  userId: user.id,
  email: user.email,
  ip: req.ip
})
```

#### Authorization Events

```typescript
// Permission granted
securityLogger.authz(true, {
  userId: user.id,
  tenantId: user.tenant_id,
  permission: 'vehicles:delete',
  resource: 'vehicle',
  resourceId: vehicleId,
  ip: req.ip
})

// Permission denied
securityLogger.authz(false, {
  userId: user.id,
  tenantId: user.tenant_id,
  permission: 'vehicles:delete',
  resource: 'vehicle',
  resourceId: vehicleId,
  reason: 'User role (driver) does not have delete permission',
  ip: req.ip
})
```

#### Data Access Events

```typescript
// Read sensitive data
securityLogger.dataAccess('read', {
  userId: user.id,
  tenantId: user.tenant_id,
  resourceType: 'driver',
  resourceId: driverId,
  fields: ['license_number', 'ssn', 'address'],
  ip: req.ip,
  userAgent: req.get('user-agent')
})

// Modify data
securityLogger.dataAccess('write', {
  userId: user.id,
  tenantId: user.tenant_id,
  resourceType: 'vehicle',
  resourceId: vehicleId,
  fields: ['status', 'assigned_driver_id'],
  ip: req.ip
})

// Delete data
securityLogger.dataAccess('delete', {
  userId: user.id,
  tenantId: user.tenant_id,
  resourceType: 'maintenance_record',
  resourceId: recordId,
  ip: req.ip
})
```

#### Security Incidents

```typescript
// Rate limit exceeded
securityLogger.incident('rate_limit', {
  ip: req.ip,
  userAgent: req.get('user-agent'),
  details: {
    endpoint: '/api/auth/login',
    attempts: 10,
    window: '15 minutes'
  },
  severity: 'medium'
})

// SQL injection attempt detected
securityLogger.incident('sql_injection', {
  userId: user?.id,
  ip: req.ip,
  details: {
    parameter: 'search',
    value: req.query.search,
    pattern: 'OR 1=1'
  },
  severity: 'high'
})

// Break-glass access
securityLogger.breakGlass({
  userId: adminUser.id,
  tenantId: targetTenantId,
  reason: 'Emergency access for data recovery',
  approver: 'supervisor@company.com',
  action: 'read',
  resourceType: 'all_vehicles',
  ip: req.ip
})
```

---

## Performance Logging

Track system performance metrics for optimization and alerting.

### Database Query Performance

```typescript
import { perfLogger } from '@/utils/logger'

const startTime = Date.now()
const result = await db.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenantId])
const duration = Date.now() - startTime

perfLogger.query({
  query: 'SELECT * FROM vehicles WHERE tenant_id = $1',
  duration,
  rows: result.rows.length,
  params: [tenantId],
  slow: duration > 1000
})
```

### API Endpoint Performance

```typescript
// Automatically logged by request ID middleware
// Manual logging:
perfLogger.endpoint({
  method: 'POST',
  path: '/api/vehicles',
  statusCode: 201,
  duration: 145,
  userId: req.user.id,
  tenantId: req.user.tenant_id
})
```

### Cache Operations

```typescript
// Cache hit
perfLogger.cache('hit', {
  key: `vehicles:${tenantId}`,
  duration: 2
})

// Cache miss
perfLogger.cache('miss', {
  key: `vehicles:${tenantId}`,
  duration: 5
})

// Cache set
perfLogger.cache('set', {
  key: `vehicles:${tenantId}`,
  size: 1024,
  duration: 10
})
```

### External API Calls

```typescript
const startTime = Date.now()

try {
  const response = await axios.get('https://api.example.com/data')
  const duration = Date.now() - startTime

  perfLogger.externalApi({
    service: 'ExampleAPI',
    endpoint: '/data',
    method: 'GET',
    duration,
    statusCode: response.status
  })
} catch (error) {
  const duration = Date.now() - startTime

  perfLogger.externalApi({
    service: 'ExampleAPI',
    endpoint: '/data',
    method: 'GET',
    duration,
    error: error instanceof Error ? error.message : 'Unknown error'
  })
}
```

---

## Request ID Tracking

Request IDs enable distributed tracing across microservices and log correlation.

### Setup

```typescript
import { requestIdMiddleware } from '@/middleware/request-id'

// In server.ts
app.use(requestIdMiddleware())
```

### Using Request Logger

```typescript
import { getRequestLogger } from '@/middleware/request-id'

export async function createVehicle(req: Request, res: Response) {
  const reqLogger = getRequestLogger(req)

  reqLogger.info('Creating vehicle', {
    make: req.body.make,
    model: req.body.model
  })

  try {
    const vehicle = await vehicleService.create(req.body)

    reqLogger.info('Vehicle created successfully', {
      vehicleId: vehicle.id
    })

    res.status(201).json(vehicle)
  } catch (error) {
    reqLogger.error('Failed to create vehicle', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Propagating Request IDs

```typescript
// Downstream service calls
const response = await axios.get('https://downstream-service.com/api/data', {
  headers: {
    'X-Request-ID': req.requestId
  }
})
```

### Log Correlation

All logs with the same `requestId` can be grouped for troubleshooting:

```bash
# Search logs by request ID
grep "a1b2c3d4-e5f6-7890-abcd-ef1234567890" logs/combined.log
```

---

## Best Practices

### 1. Use Structured Logging

✅ **Good**:
```typescript
logger.info('Payment processed', {
  userId: '123',
  amount: 99.99,
  currency: 'USD'
})
```

❌ **Bad**:
```typescript
logger.info(`Payment of $99.99 processed for user 123`)
```

### 2. Include Context

✅ **Good**:
```typescript
logger.error('Database query failed', {
  query: 'SELECT * FROM vehicles',
  error: err.message,
  duration: 5023,
  params: [tenantId]
})
```

❌ **Bad**:
```typescript
logger.error('Query failed')
```

### 3. Don't Log Sensitive Data

❌ **Never log**:
- Passwords
- API keys
- Credit card numbers
- Social security numbers
- Private keys

✅ **Safe to log**:
- User IDs (not emails in production)
- Transaction IDs
- Error messages
- Performance metrics

### 4. Use Appropriate Log Levels

✅ **Good**:
```typescript
logger.error('Payment failed', { ... })        // Error
logger.warn('Low fuel', { ... })               // Warning
logger.info('Vehicle created', { ... })        // Info
logger.debug('Processing step 3', { ... })     // Debug
```

❌ **Bad**:
```typescript
logger.info('CRITICAL: System crashed')        // Should be error
logger.error('User logged in')                 // Should be info
```

### 5. Log at Service Boundaries

Log when entering/exiting:
- HTTP endpoints
- Database operations
- External API calls
- Queue processing
- Scheduled jobs

### 6. Include Request Context

Always use `getRequestLogger(req)` in route handlers for automatic request ID correlation.

### 7. Performance Considerations

```typescript
// Don't log in tight loops
for (let i = 0; i < 1000000; i++) {
  // ❌ Bad
  logger.debug(`Processing item ${i}`)
}

// ✅ Good - log summary
logger.info('Batch processing complete', {
  itemsProcessed: 1000000,
  duration: 5000
})
```

---

## Troubleshooting

### Logs Not Appearing

1. **Check LOG_LEVEL**:
   ```bash
   # In .env
   LOG_LEVEL=debug  # Ensure level includes your log type
   ```

2. **Check File Permissions**:
   ```bash
   chmod 755 logs/
   ls -la logs/
   ```

3. **Check Disk Space**:
   ```bash
   df -h
   ```

### Log Files Growing Too Large

1. **Verify Rotation Configuration**:
   ```typescript
   maxsize: 10485760,  // 10MB
   maxFiles: 5         // 5 rotated files
   ```

2. **Reduce Log Level in Production**:
   ```bash
   LOG_LEVEL=info  # Don't use debug in production
   ```

3. **Implement Log Shipping**:
   - Send logs to external aggregation service
   - Archive old logs to S3/Azure Blob
   - Set up log retention policies

### Performance Impact

If logging impacts performance:

1. **Use Async Logging** (Winston default)
2. **Reduce Log Volume**:
   - Don't log in tight loops
   - Use sampling for high-frequency events
3. **Disable Console in Production**:
   ```typescript
   const transports = process.env.NODE_ENV === 'production'
     ? [file Transports]  // No console
     : [consoleTransport, ...fileTransports]
   ```

---

## Compliance & Evidence

### FedRAMP Controls

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| AU-2 | Audit Events | All security events logged |
| AU-3 | Content of Audit Records | Timestamp, user, action, resource |
| AU-6 | Audit Review | Logs searchable, filterable |
| AU-9 | Protection of Audit Information | File permissions, immutability |
| AU-11 | Audit Record Retention | 90-day retention (configurable) |

### SOC 2 Controls

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| CC7.2 | System monitoring | Performance, error, security logging |
| CC6.1 | Access controls | Authentication/authorization audit trail |
| CC6.6 | Logical access | All data access logged |

### Evidence Collection

#### Authentication Audit Trail

```bash
# Export login events for compliance audit
grep "AUTH_LOGIN" logs/security.log | jq '.'
```

#### Authorization Failures

```bash
# Export permission denials
grep "AUTHZ_DENIED" logs/security.log | jq '.'
```

#### Data Access Audit

```bash
# Export PII access events
grep "DATA_READ" logs/security.log | \
  jq 'select(.resourceType == "driver" and .fields | contains(["ssn"]))'
```

---

## Migration from console.log

### Automated Migration

Use the migration script:

```bash
cd api
tsx src/scripts/migrate-to-winston.ts
```

### Manual Migration

Replace console.* with logger.*:

```typescript
// Before
console.log('Vehicle created')
console.error('Failed to save')
console.warn('Low memory')
console.debug('Processing...')

// After
import logger from '@/utils/logger'

logger.info('Vehicle created')
logger.error('Failed to save')
logger.warn('Low memory')
logger.debug('Processing...')
```

### Testing After Migration

```bash
# Run tests
npm test

# Check for remaining console.* usage
grep -r "console\.\(log\|error\|warn\|debug\)" src/
```

---

## Testing

### Unit Tests

```typescript
import logger from '@/utils/logger'
import { describe, it, expect, vi } from 'vitest'

describe('Logger', () => {
  it('should log info messages', () => {
    const spy = vi.spyOn(logger, 'info')

    logger.info('Test message', { userId: '123' })

    expect(spy).toHaveBeenCalledWith('Test message', { userId: '123' })
  })

  it('should log errors with stack traces', () => {
    const spy = vi.spyOn(logger, 'error')
    const error = new Error('Test error')

    logger.error('Operation failed', {
      error: error.message,
      stack: error.stack
    })

    expect(spy).toHaveBeenCalledWith(
      'Operation failed',
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String)
      })
    )
  })
})
```

### Integration Tests

```typescript
import request from 'supertest'
import app from '@/server'
import logger from '@/utils/logger'

describe('Request Logging', () => {
  it('should log HTTP requests with request ID', async () => {
    const spy = vi.spyOn(logger, 'http')

    await request(app)
      .get('/api/vehicles')
      .set('X-Request-ID', 'test-123')

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Incoming request'),
      expect.objectContaining({
        requestId: 'test-123',
        method: 'GET',
        path: '/api/vehicles'
      })
    )
  })
})
```

---

## FAQ

### Q: Should I log in production?

**A**: Yes! Logging in production is essential for:
- Debugging issues
- Security audit trails
- Compliance requirements
- Performance monitoring

However:
- Use `info` level (not `debug`)
- Don't log sensitive data
- Use structured logging for parsing
- Ship logs to external aggregation service

### Q: How do I search logs?

**A**: Use command-line tools or log aggregation services:

```bash
# Search by keyword
grep "payment" logs/combined.log

# Search by request ID
grep "a1b2c3d4" logs/combined.log

# Parse JSON logs
cat logs/combined.log | jq 'select(.userId == "123")'

# Search by date range
awk '/2025-12-01/,/2025-12-02/' logs/combined.log
```

### Q: How long should I retain logs?

**A**: Depends on compliance requirements:
- **FedRAMP**: Minimum 90 days
- **SOC 2**: Typically 1 year
- **GDPR**: Varies by data type
- **Best practice**: 1 year active, 7 years archived

### Q: What if logs contain sensitive data accidentally?

**A**:
1. Immediately rotate the log file
2. Securely delete the file containing sensitive data
3. Review code to prevent recurrence
4. Document the incident
5. Notify security team if PII was exposed

### Q: How do I integrate with Datadog/Splunk/ELK?

**A**: Add custom Winston transports:

```typescript
// Datadog
import { DatadogTransport } from 'winston-datadog-logs'

logger.add(new DatadogTransport({
  apiKey: process.env.DATADOG_API_KEY,
  service: 'fleet-api',
  tags: ['env:production']
}))

// HTTP transport for Splunk/ELK
import { HttpTransport } from 'winston-transport-http'

logger.add(new HttpTransport({
  host: 'splunk.company.com',
  port: 8088,
  path: '/services/collector'
}))
```

---

## Summary

The Winston logging system provides enterprise-grade logging with:

✅ **Complete audit trails** for compliance
✅ **Request correlation** via request IDs
✅ **Performance monitoring** for optimization
✅ **Security event tracking** for threat detection
✅ **Structured logging** for machine parsing
✅ **Automatic log rotation** for disk management
✅ **Multiple transports** for flexibility

**Next Steps**:
1. ✅ Review this guide
2. ✅ Migrate from console.log to logger
3. ✅ Add request ID middleware
4. ✅ Configure log shipping to external service
5. ✅ Set up monitoring dashboards
6. ✅ Train team on logging best practices

**Support**:
- Documentation: `/docs/ERROR_LOGGING_GUIDE.md`
- Source code: `/src/utils/logger.ts`
- Issues: GitHub Issues
- Contact: devops@capitaltechalliance.com

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Author**: Fleet DevOps Team
**Compliance**: FedRAMP Moderate, SOC 2 Type II
