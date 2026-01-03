# Comprehensive Audit Logging System

A production-grade audit logging system for CTAFleet with encrypted storage, 7-year retention compliance, and advanced reporting capabilities.

## Features

### Core Audit Logging
- **Structured Logging**: JSON-based audit events with full context
- **Correlation IDs**: Request tracing across distributed systems
- **Tamper Detection**: SHA-256 checksums for integrity verification
- **Sensitive Data Masking**: Automatic masking of passwords, tokens, and API keys
- **Performance Metrics**: Duration and resource tracking per operation

### Encryption
- **AES-256-GCM**: Industry-standard symmetric encryption at rest
- **Authenticated Encryption**: AEAD (Authenticated Encryption with Additional Data)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Key Rotation**: Support for seamless encryption key rotation

### Retention Management
- **Tiered Storage**: HOT (0-90 days), WARM (90 days - 1 year), COLD (1-7 years)
- **Automatic Archival**: Background jobs for log archiving
- **Compliance Purging**: 7-year retention with automatic cleanup
- **Retention Policies**: Configurable per resource type

### Reporting & Analysis
- **Executive Summaries**: High-level activity overview with trends
- **User Activity Reports**: Per-user audit trails
- **Resource Access Reports**: Who accessed what and when
- **Anomaly Detection**: ML-based detection of suspicious patterns
- **Security Alerts**: Auto-generated alerts for critical events
- **Compliance Reports**: SOC 2, HIPAA-ready reporting

## Architecture

```
audit-logger.ts          - Core audit logging with structured events
log-encryption.ts        - AES-256-GCM encryption service
log-retention.ts         - Retention policies and tiered storage
audit-reports.ts         - Reporting and analysis engine
index.ts                 - Main exports
__tests__/audit.test.ts  - Comprehensive test suite
```

## Installation

### 1. Initialize Encryption Key

Set the encryption master key in your environment:

```bash
# Generate a strong encryption key
openssl rand -base64 32

# Add to .env
AUDIT_ENCRYPTION_KEY=your-generated-key-here
ENCRYPTION_MASTER_KEY=your-master-key-here
```

### 2. Run Database Migration

```bash
# Apply audit logging schema
psql -d your-database -f src/migrations/create_audit_tables.sql
```

### 3. Initialize Services

```typescript
import { AuditLogger, LogEncryption, LogRetention, AuditReports } from '@/services/audit'
import { pool } from '@/db'

// Initialize core services
const auditLogger = new AuditLogger(pool, process.env.AUDIT_ENCRYPTION_KEY)
const encryption = new LogEncryption(process.env.ENCRYPTION_MASTER_KEY)
const retention = new LogRetention(pool)
const reports = new AuditReports(pool, auditLogger)

// Export for use
export { auditLogger, encryption, retention, reports }
```

## Usage

### Log Authentication Event

```typescript
import { auditLogger, AuditAction, AuditSeverity } from '@/services/audit'

await auditLogger.logEvent({
  userId: 'user-123',
  action: AuditAction.USER_LOGIN,
  resource: { type: 'USER', id: 'user-123' },
  result: { status: 'success', code: 200, message: 'Login successful' },
  severity: AuditSeverity.INFO,
  requestContext: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    method: 'POST',
    endpoint: '/auth/login',
    sessionId: req.sessionID
  }
})
```

### Log Data Access

```typescript
import { AuditAction, AuditSeverity } from '@/services/audit'

await auditLogger.logEvent({
  userId: 'user-456',
  action: AuditAction.DATA_READ,
  resource: { type: 'VEHICLE', id: 'vehicle-001', name: 'Fleet Vehicle #1' },
  result: { status: 'success', code: 200, message: 'Data retrieved' },
  severity: AuditSeverity.INFO,
  requestContext: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    method: 'GET',
    endpoint: '/api/vehicles/vehicle-001'
  },
  performanceMetrics: {
    duration: 145, // milliseconds
    dbQueries: 2,
    externalCalls: 0
  }
})
```

### Query Audit Logs

```typescript
import { AuditAction } from '@/services/audit'

// Get user's audit trail
const logs = await auditLogger.getAuditLogs({
  userId: 'user-123',
  limit: 100,
  offset: 0
})

// Get specific action logs
const loginLogs = await auditLogger.getAuditLogs({
  action: AuditAction.USER_LOGIN,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31')
})

// Get correlation trace for request
const trace = await auditLogger.getCorrelationTrace('correlation-id-here')
```

### Generate Reports

```typescript
import { ReportType } from '@/services/audit'

// Executive summary
const summary = await reports.generateExecutiveSummary(
  new Date('2025-01-01'),
  new Date('2025-01-31')
)

// User activity report
const userReport = await reports.generateUserActivityReport(
  'user-123',
  new Date('2025-01-01'),
  new Date('2025-01-31')
)

// Resource access report
const resourceReport = await reports.generateResourceAccessReport(
  'VEHICLE',
  'vehicle-001',
  new Date('2025-01-01'),
  new Date('2025-01-31')
)

// Detect anomalies
const anomalies = await reports.detectAnomalies(
  new Date('2025-01-01'),
  new Date('2025-01-31')
)

// Generate security alerts
const alerts = await reports.generateSecurityAlerts(
  new Date('2025-01-01'),
  new Date('2025-01-31')
)
```

### Manage Retention

```typescript
// Archive logs to cold storage
const archiveEvent = await retention.archiveLogs(
  'default-security',
  new Date('2020-01-01') // Archive logs before this date
)

// Purge expired logs
const purgeEvent = await retention.purgeLogs('default-access')

// Get retention statistics
const stats = await retention.getRetentionStats()
console.log(`Total records: ${stats.totalRecords}`)
console.log(`Hot tier: ${stats.recordsByTier.HOT}`)
console.log(`Warm tier: ${stats.recordsByTier.WARM}`)
console.log(`Cold tier: ${stats.recordsByTier.COLD}`)

// Generate compliance report
const complianceReport = await retention.generateComplianceReport(
  new Date('2025-01-01'),
  new Date('2025-01-31')
)
```

### Encryption Operations

```typescript
import { LogEncryption, BatchEncryption } from '@/services/audit'

const encryption = new LogEncryption('master-key')

// Encrypt single entry
const encrypted = encryption.encrypt({ userId: 'user-123', action: 'LOGIN' })
const decrypted = encryption.decryptJson(encrypted)

// Batch encryption
const batch = new BatchEncryption('master-key')
const entries = [{ id: 1 }, { id: 2 }, { id: 3 }]
const encrypted = batch.encryptBatch(entries)
const decrypted = batch.decryptBatch(encrypted)

// Key rotation
const rotator = encryption.rotateKey('new-master-key')
const reencrypted = rotator(encrypted)

// Verify integrity
const isValid = encryption.verify(encrypted)

// HMAC operations
const hmac = encryption.createHMAC({ data: 'test' })
const verified = encryption.verifyHMAC({ data: 'test' }, hmac)
```

## Audit Events

### Authentication Events
- `USER_LOGIN` - Successful user login
- `USER_LOGOUT` - User logout
- `AUTH_FAILURE` - Failed authentication attempt
- `SESSION_CREATED` - Session established
- `SESSION_REVOKED` - Session terminated

### Data Operations
- `DATA_CREATE` - Record created
- `DATA_READ` - Record accessed
- `DATA_UPDATE` - Record modified
- `DATA_DELETE` - Record deleted
- `DATA_EXPORT` - Data exported/downloaded

### Security Events
- `PERMISSION_DENIED` - Access control rejection
- `PASSWORD_CHANGED` - Password modified
- `MFA_ENABLED` - Multi-factor authentication enabled
- `MFA_DISABLED` - Multi-factor authentication disabled
- `ENCRYPTION_KEY_ROTATED` - Encryption key rotation

### Administrative Events
- `SYSTEM_CONFIG_CHANGED` - System configuration modified
- `ROLE_ASSIGNED` - Role assigned to user
- `PERMISSION_MODIFIED` - Permission changed
- `SECURITY_POLICY_UPDATED` - Security policy updated
- `AUDIT_LOG_ACCESSED` - Audit logs accessed

## Retention Policies

### Default Policies

**Default Security Events**
- Retention: 7 years (2,555 days)
- Tier: WARM
- Compression: Enabled
- Encryption: Enabled
- Auto-purge: Enabled

**Default Audit Logs**
- Retention: 7 years (2,555 days)
- Tier: WARM
- Compression: Enabled
- Encryption: Enabled
- Auto-purge: Enabled

**Default Access Logs**
- Retention: 90 days
- Tier: HOT
- Compression: Disabled
- Encryption: Enabled
- Auto-purge: Enabled

### Custom Policies

```typescript
await retention.createPolicy({
  name: 'Custom Policy',
  description: 'Custom retention policy',
  resourceType: 'CUSTOM_RESOURCE',
  retentionDays: 365,
  tier: RetentionTier.WARM,
  compression: true,
  encryption: true,
  automaticPurge: true,
  deleteAfterDays: 365,
  enabled: true
})
```

## Severity Levels

- `INFO` - Informational events
- `WARNING` - Warning-level events
- `ERROR` - Error-level events
- `CRITICAL` - Critical security events

## Database Schema

### Tables

- `audit_logs` - Main audit log storage with encrypted data
- `retention_policies` - Retention policy definitions
- `retention_events` - Archival and purge events
- `audit_reports` - Generated reports
- `audit_log_verification` - Integrity verification records
- `security_alerts` - Generated security alerts

### Views

- `recent_audit_activity` - Last 24 hours of activity
- `failed_operations` - Failed operations from last 7 days
- `user_activity_summary` - User activity aggregates
- `resource_access_summary` - Resource access aggregates

## Security Considerations

1. **Encryption**: AES-256-GCM provides authenticated encryption
2. **Key Management**: Use Azure Key Vault for production keys
3. **Access Control**: Implement row-level security for audit logs
4. **Monitoring**: Set up alerts for access to audit logs
5. **Immutability**: Logs include checksums for integrity verification
6. **Data Masking**: Sensitive fields automatically masked

## Performance

- Indexed queries for fast retrieval
- Tiered storage for cost optimization
- Batch encryption for bulk operations
- Async archival and purging
- ~2KB per audit log entry

## Compliance

- **SOC 2 Type II**: Comprehensive audit trails
- **HIPAA**: Protected health information audit logging
- **GDPR**: Data retention and deletion capabilities
- **PCI-DSS**: Transaction logging and monitoring
- **ISO 27001**: Access control and monitoring

## Testing

Run the comprehensive test suite:

```bash
npm test -- src/services/audit/__tests__/audit.test.ts
```

Test Coverage:
- Audit logging (correlation IDs, event types, sensitive data masking)
- Encryption (encryption/decryption, key rotation, integrity)
- Batch operations (bulk encryption, verification)
- Retention policies (archival, purging, statistics)
- Report generation (summaries, anomaly detection, alerts)
- Integration tests (end-to-end workflows)

## Troubleshooting

### Encryption Key Not Found
```
Error: Audit encryption key is required
```
Solution: Set `AUDIT_ENCRYPTION_KEY` environment variable

### Decryption Failure
```
Error: Log decryption failed
```
Solution: Ensure correct encryption key is being used. Check key rotation history.

### Database Errors
```
Error: Audit logging failed
```
Solution: Verify database connection and table schema migration applied

### Performance Issues
- Consider archiving old logs more frequently
- Enable compression for WARM tier logs
- Review index usage in production database

## Contributing

When adding new audit events:

1. Add event type to `AuditAction` enum
2. Add display name in `getActionDisplayName()`
3. Add test coverage in test suite
4. Document in "Audit Events" section

## References

- [NIST Audit Logging](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf)
- [OWASP Security Logging](https://owasp.org/www-community/attacks/abuse_of_functionality)
- [CIS Controls](https://www.cisecurity.org/cis-controls/)
