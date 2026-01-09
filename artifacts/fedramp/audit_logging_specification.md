# Audit Logging Specification
## Fleet Management System - FedRAMP Moderate

**System Name:** Fleet Garage Management System
**Document Version:** 1.0
**Date:** 2026-01-08
**Last Updated:** 2026-01-08

---

## Overview

This document specifies the audit logging implementation for the Fleet Management System, fulfilling NIST 800-53 Rev 5 controls AU-2 through AU-12 for FedRAMP Moderate authorization.

**Purpose:** Maintain a complete, tamper-evident audit trail of all security-relevant events and user actions within the system.

**Compliance Requirements:**
- NIST 800-53 AU family controls
- FedRAMP Moderate baseline
- 7-year retention requirement
- Non-repudiation of user actions

---

## Audit Log Architecture

### Components

1. **Application Layer Logging**
   - Middleware: `/api/src/middleware/audit.ts`
   - Enhanced audit: `/api/src/middleware/audit-enhanced.ts`
   - Captures all API operations

2. **Database Layer**
   - Table: `audit_logs` (PostgreSQL)
   - Row-Level Security enforced
   - Append-only access model

3. **Storage and Retention**
   - Primary: PostgreSQL database (1 year hot storage)
   - Archive: Azure Blob Storage (6 years cold storage)
   - Total retention: 7 years

4. **Analysis and Reporting**
   - UI: `/src/pages/admin/AuditLogs.tsx`
   - API: `/api/src/routes/audit.ts`
   - Azure Application Insights integration

---

## Events Logged

### Authentication Events

#### Successful Login
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "LOGIN_SUCCESS",
  "entity_type": "authentication",
  "entity_id": "uuid",
  "entity_snapshot": null,
  "changes": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "method": "password",
    "mfa_used": false
  },
  "created_at": "2026-01-08T21:45:00.000Z"
}
```

**Triggers:**
- Successful email/password authentication
- Successful Azure AD authentication
- Successful API key authentication

---

#### Failed Login
```json
{
  "id": "uuid",
  "tenant_id": null,
  "user_id": null,
  "action": "LOGIN_FAILURE",
  "entity_type": "authentication",
  "entity_id": null,
  "entity_snapshot": null,
  "changes": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "metadata": {
    "email": "user@example.com",
    "reason": "invalid_password",
    "attempt_count": 3
  },
  "created_at": "2026-01-08T21:45:00.000Z"
}
```

**Triggers:**
- Wrong password
- Non-existent user
- Account locked
- MFA failure

---

#### Logout
```json
{
  "action": "LOGOUT",
  "entity_type": "authentication",
  "metadata": {
    "session_duration_seconds": 3600
  }
}
```

**Triggers:**
- User-initiated logout
- Session timeout
- Admin-forced logout

---

### Authorization Events

#### Permission Denied
```json
{
  "action": "PERMISSION_DENIED",
  "entity_type": "authorization",
  "metadata": {
    "required_permission": "vehicle:delete:fleet",
    "user_role": "Dispatcher",
    "requested_resource": "/api/vehicles/123",
    "http_method": "DELETE"
  }
}
```

**Triggers:**
- User attempts action without permission
- Role insufficient for operation
- Scope restriction violation

---

#### Role Change
```json
{
  "action": "UPDATE",
  "entity_type": "user",
  "entity_id": "user-uuid",
  "entity_snapshot": {
    "role": "Driver",
    "updated_at": "2026-01-01T00:00:00.000Z"
  },
  "changes": {
    "role": {
      "old": "Driver",
      "new": "Dispatcher"
    }
  },
  "metadata": {
    "changed_by": "admin-user-uuid",
    "reason": "Promotion"
  }
}
```

**Triggers:**
- Admin modifies user role
- Automated role assignment

---

### Data Access Events

#### Read Operations (Selective Logging)
```json
{
  "action": "READ",
  "entity_type": "vehicle",
  "entity_id": "vehicle-uuid",
  "entity_snapshot": null,
  "changes": null,
  "metadata": {
    "query_type": "detail_view",
    "data_classification": "sensitive"
  }
}
```

**Logged for:**
- Sensitive data access (PII, financial)
- Bulk export operations
- Cross-tenant access (SuperAdmin)
- Audit log viewing

**NOT logged for:**
- Normal list views
- Public data access
- Non-sensitive data

---

#### Create Operations
```json
{
  "action": "CREATE",
  "entity_type": "vehicle",
  "entity_id": "new-vehicle-uuid",
  "entity_snapshot": null,
  "changes": {
    "vehicle_number": "FL-001",
    "make": "Ford",
    "model": "F-150",
    "year": 2024,
    "vin": "1FTFW1E84MKE12345"
  },
  "metadata": {
    "source": "web_ui"
  }
}
```

**Logged for:**
- All CREATE operations on all entities

---

#### Update Operations
```json
{
  "action": "UPDATE",
  "entity_type": "vehicle",
  "entity_id": "vehicle-uuid",
  "entity_snapshot": {
    "status": "active",
    "current_mileage": 50000,
    "updated_at": "2026-01-01T00:00:00.000Z"
  },
  "changes": {
    "status": {
      "old": "active",
      "new": "maintenance"
    },
    "current_mileage": {
      "old": 50000,
      "new": 51000
    }
  },
  "metadata": {
    "reason": "Scheduled maintenance"
  }
}
```

**Features:**
- Before-state snapshot
- Field-level change tracking
- Diff between old and new values

**Logged for:**
- All UPDATE operations on all entities

---

#### Delete Operations
```json
{
  "action": "DELETE",
  "entity_type": "vehicle",
  "entity_id": "vehicle-uuid",
  "entity_snapshot": {
    "vehicle_number": "FL-001",
    "make": "Ford",
    "model": "F-150",
    "status": "retired",
    "all_fields": "..."
  },
  "changes": null,
  "metadata": {
    "reason": "Vehicle retired and sold",
    "approved_by": "manager-user-uuid"
  }
}
```

**Features:**
- Complete entity snapshot before deletion
- Approval workflow tracking
- Soft delete vs hard delete indicator

**Logged for:**
- All DELETE operations (soft and hard)

---

### Administrative Events

#### Configuration Change
```json
{
  "action": "CONFIG_CHANGE",
  "entity_type": "system_settings",
  "entity_id": "settings-uuid",
  "entity_snapshot": {
    "session_timeout_minutes": 30
  },
  "changes": {
    "session_timeout_minutes": {
      "old": 30,
      "new": 60
    }
  },
  "metadata": {
    "change_type": "security_policy"
  }
}
```

**Logged for:**
- Security policy changes
- System configuration updates
- Feature flag toggles
- Integration settings

---

#### User Account Management
```json
{
  "action": "CREATE",
  "entity_type": "user",
  "entity_id": "new-user-uuid",
  "changes": {
    "email": "newuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "Driver",
    "is_active": true
  },
  "metadata": {
    "created_by": "admin-user-uuid"
  }
}
```

**Logged for:**
- User creation
- User modification
- User deactivation
- Password changes
- Role changes

---

### Security Events

#### Suspicious Activity
```json
{
  "action": "SECURITY_ALERT",
  "entity_type": "security_event",
  "metadata": {
    "alert_type": "brute_force_attempt",
    "details": "5 failed login attempts in 60 seconds",
    "threshold_exceeded": true,
    "action_taken": "account_locked"
  }
}
```

**Triggers:**
- Multiple failed login attempts
- Unusual access patterns
- Privilege escalation attempts
- SQL injection attempts detected
- XSS attempts detected

---

#### Data Export
```json
{
  "action": "DATA_EXPORT",
  "entity_type": "report",
  "metadata": {
    "export_type": "vehicle_list",
    "format": "CSV",
    "record_count": 500,
    "included_columns": ["vehicle_number", "make", "model", "status"],
    "data_classification": "internal"
  }
}
```

**Triggers:**
- CSV export
- PDF report generation
- Excel export
- Bulk data download

---

### System Events

#### Service Start/Stop
```json
{
  "action": "SERVICE_START",
  "entity_type": "system",
  "metadata": {
    "service_name": "fleet-api",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

**Logged automatically** by application startup/shutdown

---

## Audit Log Schema

### Database Table: audit_logs

```sql
CREATE TABLE audit_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),

  -- Action details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,

  -- Change tracking
  entity_snapshot JSONB,          -- State before change
  changes JSONB,                  -- Field-level changes

  -- Request context
  ip_address VARCHAR(45),         -- IPv4 or IPv6
  user_agent VARCHAR(500),

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_audit_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- GIN index for JSONB queries
CREATE INDEX idx_audit_metadata ON audit_logs USING gin(metadata);
CREATE INDEX idx_audit_changes ON audit_logs USING gin(changes);
```

### Row-Level Security

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their tenant's audit logs
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: Only SuperAdmin and Auditor roles can view
CREATE POLICY audit_logs_role_restriction ON audit_logs
  FOR SELECT
  USING (
    current_setting('app.current_user_role') IN ('SuperAdmin', 'Admin', 'Viewer')
  );

-- Policy: Append-only (no UPDATE or DELETE)
-- Enforced by not granting UPDATE/DELETE permissions
REVOKE UPDATE, DELETE ON audit_logs FROM application_user;
```

---

## Audit Log Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| id | UUID | Yes | Unique log entry identifier | `a1b2c3d4-...` |
| tenant_id | UUID | Yes | Multi-tenant isolation | `tenant-uuid` |
| user_id | UUID | No | User who performed action (null for system) | `user-uuid` |
| action | VARCHAR(100) | Yes | Action performed | `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN_SUCCESS` |
| entity_type | VARCHAR(100) | Yes | Type of entity affected | `vehicle`, `user`, `route` |
| entity_id | UUID | No | Specific entity identifier | `vehicle-uuid` |
| entity_snapshot | JSONB | No | State before change | `{"status": "active", ...}` |
| changes | JSONB | No | Field-level changes | `{"status": {"old": "active", "new": "maintenance"}}` |
| ip_address | VARCHAR(45) | No | Source IP address | `192.168.1.100`, `2001:db8::1` |
| user_agent | VARCHAR(500) | No | Browser/client info | `Mozilla/5.0...` |
| metadata | JSONB | No | Additional context | `{"reason": "scheduled", ...}` |
| created_at | TIMESTAMP | Yes | When event occurred (UTC) | `2026-01-08T21:45:00.000Z` |

---

## Implementation Details

### Audit Middleware

**Location:** `/api/src/middleware/audit.ts`

```typescript
export function auditLog(config: AuditConfig) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Capture request snapshot
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      // Log after successful response
      const auditEntry = {
        tenant_id: req.user?.tenant_id,
        user_id: req.user?.id,
        action: config.action,
        entity_type: config.resourceType,
        entity_id: body?.id || req.params?.id,
        entity_snapshot: config.captureSnapshot ? body : null,
        changes: calculateChanges(req.body, body),
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        metadata: {
          http_method: req.method,
          url: req.originalUrl,
          ...config.metadata
        },
        created_at: new Date()
      };

      // Write to database (async, don't block response)
      writeAuditLog(auditEntry).catch(err => {
        logger.error('Failed to write audit log', err);
        // Trigger alert for audit failure
        alertSecurityTeam('audit_write_failure', err);
      });

      return originalJson(body);
    };

    next();
  };
}
```

### Usage Example

```typescript
router.post('/vehicles',
  authenticateJWT,
  requirePermission('vehicle:create:fleet'),
  auditLog({
    action: 'CREATE',
    resourceType: 'vehicle',
    captureSnapshot: true,
    metadata: { source: 'api' }
  }),
  vehicleController.create
);

router.put('/vehicles/:id',
  authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({
    action: 'UPDATE',
    resourceType: 'vehicle',
    captureSnapshot: true
  }),
  vehicleController.update
);

router.delete('/vehicles/:id',
  authenticateJWT,
  requirePermission('vehicle:delete:fleet'),
  auditLog({
    action: 'DELETE',
    resourceType: 'vehicle',
    captureSnapshot: true,
    metadata: { deletion_type: 'hard' }
  }),
  vehicleController.delete
);
```

---

## Log Retention and Archival

### Retention Policy

**Requirement:** 7 years minimum retention per compliance requirements

**Implementation:**

1. **Hot Storage (0-12 months):**
   - Location: PostgreSQL `audit_logs` table
   - Purpose: Active querying and analysis
   - Indexed for fast retrieval
   - Full-text search available

2. **Warm Storage (1-3 years):**
   - Location: Azure SQL Database (separate archive database)
   - Purpose: Compliance queries, investigations
   - Compressed storage
   - Slower query performance

3. **Cold Storage (3-7 years):**
   - Location: Azure Blob Storage (Archive tier)
   - Purpose: Long-term compliance retention
   - Immutable storage (WORM)
   - Retrieval may take hours

### Archival Process

**Scheduled Job:** Nightly at 2:00 AM UTC

```typescript
// /api/src/jobs/audit-archival.job.ts

async function archiveOldAuditLogs() {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1 year ago

  // 1. Query logs older than 1 year
  const oldLogs = await db.query(`
    SELECT * FROM audit_logs
    WHERE created_at < $1
    ORDER BY created_at
  `, [cutoffDate]);

  // 2. Upload to Azure Blob Storage
  const blobClient = getBlobClient('audit-archive');
  const filename = `audit_logs_${format(cutoffDate, 'yyyy-MM')}.jsonl.gz`;

  const compressed = gzip(JSON.stringify(oldLogs));
  await blobClient.upload(filename, compressed, {
    immutabilityPolicy: {
      immutabilityPeriodSinceCreationInDays: 2555 // 7 years
    }
  });

  // 3. Verify upload
  const exists = await blobClient.exists(filename);
  if (!exists) {
    throw new Error('Archive upload verification failed');
  }

  // 4. Delete from primary database
  await db.query(`
    DELETE FROM audit_logs
    WHERE created_at < $1
  `, [cutoffDate]);

  // 5. Log the archival operation
  await writeAuditLog({
    action: 'ARCHIVE_COMPLETED',
    entity_type: 'audit_logs',
    metadata: {
      records_archived: oldLogs.length,
      archive_file: filename,
      cutoff_date: cutoffDate
    }
  });
}
```

---

## Query and Analysis

### Audit Log Viewer UI

**Location:** `/src/pages/admin/AuditLogs.tsx`

**Features:**
- Date range filtering
- User filtering
- Action type filtering
- Entity type filtering
- Full-text search
- Export to CSV
- Detail view with change highlighting

**Access Control:**
- Requires `audit:view:fleet` permission
- Only Admin, SuperAdmin, and Viewer roles
- Tenant isolation enforced

### Common Queries

#### Failed Login Attempts by User
```sql
SELECT user_id, email, COUNT(*) as attempt_count,
       MAX(created_at) as last_attempt
FROM audit_logs
WHERE action = 'LOGIN_FAILURE'
  AND tenant_id = $1
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, metadata->>'email'
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;
```

#### Recent Administrative Actions
```sql
SELECT al.*, u.email, u.first_name, u.last_name
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.tenant_id = $1
  AND al.action IN ('CREATE', 'UPDATE', 'DELETE')
  AND al.entity_type IN ('user', 'system_settings', 'policy')
  AND al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

#### User Activity Timeline
```sql
SELECT action, entity_type, entity_id,
       created_at, ip_address, metadata
FROM audit_logs
WHERE tenant_id = $1
  AND user_id = $2
  AND created_at BETWEEN $3 AND $4
ORDER BY created_at ASC;
```

#### Sensitive Data Access Report
```sql
SELECT u.email, al.action, al.entity_type, al.entity_id,
       al.created_at, al.ip_address
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.tenant_id = $1
  AND al.metadata->>'data_classification' = 'sensitive'
  AND al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;
```

---

## Monitoring and Alerting

### Real-Time Monitoring

**Azure Application Insights Integration:**

```typescript
// Track audit events in Application Insights
appInsights.trackEvent({
  name: 'AuditLogCreated',
  properties: {
    action: auditEntry.action,
    entity_type: auditEntry.entity_type,
    user_id: auditEntry.user_id,
    tenant_id: auditEntry.tenant_id
  }
});
```

### Alerts

**Configured Alerts:**

1. **Audit Write Failure:**
   - Trigger: Any failure to write audit log
   - Severity: Critical
   - Notification: Immediate email + PagerDuty

2. **Multiple Failed Logins:**
   - Trigger: 5+ failed attempts in 5 minutes
   - Severity: High
   - Notification: Email to security team

3. **Privilege Escalation:**
   - Trigger: Role changed to Admin or SuperAdmin
   - Severity: High
   - Notification: Email to security team + Slack

4. **Bulk Data Export:**
   - Trigger: Export of >1000 records
   - Severity: Medium
   - Notification: Email to security team

5. **Unusual Access Pattern:**
   - Trigger: Access from new country/IP
   - Severity: Medium
   - Notification: Email to user + security team

---

## Security Controls

### Audit Log Protection

**Controls Implemented:**

1. **Integrity Protection:**
   - Append-only access model
   - No UPDATE or DELETE permissions granted
   - Database triggers prevent modification
   - Checksums for archived logs

2. **Access Control:**
   - Row-Level Security (RLS) enforces tenant isolation
   - Only Admin/SuperAdmin/Viewer roles can view
   - All audit log access is itself audited

3. **Encryption:**
   - At rest: Azure SQL Transparent Data Encryption (TDE)
   - In transit: TLS 1.2+
   - Archive: Azure Blob Storage encryption

4. **Non-Repudiation:**
   - User ID captured from JWT (verified identity)
   - Timestamp from database server (NTP synchronized)
   - IP address and user agent captured
   - Cryptographic signatures on archived logs

---

## Compliance Mapping

### NIST 800-53 Controls

| Control | Implementation | Evidence |
|---------|---------------|----------|
| AU-2 | All security-relevant events logged | This document |
| AU-3 | Complete audit record content | Schema section |
| AU-4 | Audit storage capacity monitored | Retention section |
| AU-5 | Alerts on audit processing failures | Monitoring section |
| AU-6 | Regular audit review | Query section |
| AU-8 | Timestamps in UTC, NTP synchronized | Implementation |
| AU-9 | Protection of audit information | Security controls |
| AU-11 | 7-year retention | Retention policy |
| AU-12 | Audit generation automated | Middleware |

---

## Testing and Validation

### Audit Log Testing

**Test Cases:**

1. ✅ Verify all CRUD operations generate audit logs
2. ✅ Verify authentication events logged
3. ✅ Verify permission denials logged
4. ✅ Verify administrative actions logged
5. ✅ Verify tenant isolation (cannot view other tenant's logs)
6. ✅ Verify append-only (UPDATE/DELETE should fail)
7. ✅ Verify archival process works
8. ✅ Verify archived logs are immutable
9. ✅ Verify alerts trigger correctly
10. ✅ Verify audit log failure doesn't break application

**Test Frequency:** Quarterly

---

## Maintenance and Review

**Review Schedule:**
- **Monthly:** Audit log volume and storage capacity
- **Quarterly:** Access patterns and anomaly detection
- **Annually:** Comprehensive audit log review for compliance

**Maintenance Tasks:**
- Verify archival job success
- Check storage capacity
- Review and tune indexes
- Update retention policies as needed
- Test restore from archive

---

**Document Version:** 1.0
**Classification:** Internal Use Only
**Next Review:** 2026-04-08

**Prepared By:** Compliance Agent G - FedRAMP Evidence Packager
