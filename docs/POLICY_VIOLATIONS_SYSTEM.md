# Policy Violations Tracking System

## Overview

The Policy Violations Tracking System provides comprehensive monitoring, logging, alerting, and compliance reporting for fleet policy violations. This system enables fleet managers to track violations in real-time, resolve issues efficiently, and maintain compliance with organizational policies.

## Features

### 1. Real-Time Violation Dashboard
- Live violation monitoring with severity-based filtering
- Interactive charts showing trends and breakdowns
- Quick statistics: total violations, open violations, critical count, avg resolution time
- 7-day trend analysis with severity breakdown
- Top violators by vehicle and driver

### 2. Comprehensive Violation Tracking
- **14 Violation Types**:
  - Personal use unauthorized
  - Personal use exceeds limit
  - Personal use weekend violation
  - Mileage limit exceeded
  - Geofence breach
  - Speed violation
  - After hours usage
  - Unauthorized driver
  - Maintenance overdue
  - Fuel card misuse
  - Safety violation
  - Documentation missing
  - Compliance violation
  - Other

- **Severity Levels**: Low, Medium, High, Critical
- **Status Tracking**: Open, Acknowledged, Under Review, Approved Override, Resolved, Dismissed, Escalated

### 3. Violation Resolution Workflow
- Comment system for collaboration
- Override request capability
- Approval workflow for overrides
- Resolution notes and tracking
- Automatic escalation for critical violations (24-hour threshold)

### 4. Alert & Notification System
- **Email Notifications**:
  - Immediate notification for new violations
  - Escalation alerts for critical violations
  - Daily summary reports
  - Customizable recipient lists

- **Notification Features**:
  - Severity-based color coding
  - HTML email templates
  - Escalation workflows
  - Push notification support (configurable)
  - Microsoft Teams integration (configurable)

### 5. Compliance Reporting
- **Export Formats**: CSV, PDF, Excel
- **Report Types**:
  - Daily/Weekly/Monthly summaries
  - Quarterly compliance reports
  - Annual policy effectiveness analysis

- **Report Contents**:
  - Executive summary
  - Violation trends and statistics
  - Top violation types
  - Policy effectiveness metrics
  - Recommendations for policy updates
  - Detailed violation appendix

### 6. Analytics & Insights
- Violation trends over 90 days
- Resolution time metrics
- Policy effectiveness analysis
- Top violators identification
- Severity distribution analysis
- Type-based breakdown

## Database Schema

### Primary Tables

#### `policy_violations`
Main violations tracking table with comprehensive fields:
- Violation details (type, severity, policy, description)
- Context (vehicle, driver, user)
- Metrics (threshold, actual value, difference)
- Location data (coordinates, address, geofence)
- Timestamps (occurred_at, detected_at)
- Resolution tracking (status, notes, resolved_by)
- Override workflow (requested, approved, reason)
- Notifications (sent status, recipients, escalation)
- Related records (request_id, work_order_id, fuel_transaction_id)

#### `policy_violation_comments`
Comments and collaboration on violations:
- Comment text
- User information
- Internal vs external comments
- Timestamp tracking

#### `policy_violation_trends` (Materialized View)
Pre-aggregated statistics for reporting:
- Daily violation counts by type and severity
- Resolution metrics
- Override counts
- 90-day rolling window

#### `policy_definitions`
Policy configuration and thresholds:
- Policy type and name
- Threshold values
- Default severity
- Auto-escalation rules
- Notification rules

### Database Functions

#### `get_violation_stats(p_tenant_id, p_days)`
Returns comprehensive statistics:
- Total violations
- Open/resolved counts
- Critical violations
- Average resolution time
- Top violation type
- Top violating vehicle/driver

#### `refresh_violation_trends()`
Updates the materialized view with latest data

### Triggers

#### `update_violation_timestamp()`
Automatically updates `updated_at` on changes

#### `auto_escalate_critical_violations()`
Automatically escalates critical violations after 24 hours

#### `log_violation_changes()`
Logs all violation changes to audit_logs table

## API Endpoints

### GET `/api/policy-violations`
Get violations with filtering
- **Query Parameters**:
  - `tenantId`: Required
  - `violationType[]`: Filter by types
  - `severity[]`: Filter by severity
  - `status[]`: Filter by status
  - `vehicleId`: Filter by vehicle
  - `driverId`: Filter by driver
  - `dateFrom`: Start date
  - `dateTo`: End date
  - `search`: Text search
  - `limit`: Results limit (default: 100)
  - `offset`: Pagination offset

### GET `/api/policy-violations/statistics`
Get violation statistics
- **Query Parameters**:
  - `tenantId`: Required
  - `days`: Time period (default: 30)

### GET `/api/policy-violations/trends`
Get violation trends
- **Query Parameters**:
  - `tenantId`: Required

### GET `/api/policy-violations/:id`
Get single violation by ID

### POST `/api/policy-violations`
Create new violation
- **Body**: Full violation object

### POST `/api/policy-violations/:id/resolve`
Resolve a violation
- **Body**:
  ```json
  {
    "resolutionNotes": "string",
    "resolvedBy": "uuid",
    "resolvedByName": "string"
  }
  ```

### POST `/api/policy-violations/:id/override`
Request policy override
- **Body**:
  ```json
  {
    "reason": "string",
    "requestedBy": "uuid"
  }
  ```

### POST `/api/policy-violations/:id/approve-override`
Approve override request (admin only)
- **Body**:
  ```json
  {
    "approvedBy": "uuid",
    "approvedByName": "string"
  }
  ```

### GET `/api/policy-violations/:id/comments`
Get violation comments

### POST `/api/policy-violations/:id/comments`
Add violation comment
- **Body**:
  ```json
  {
    "commentText": "string",
    "userId": "uuid",
    "userName": "string",
    "isInternal": boolean
  }
  ```

### POST `/api/policy-violations/export`
Export violations
- **Body**:
  ```json
  {
    "format": "csv | pdf | excel",
    "tenantId": "uuid",
    "filters": { ... },
    "includeResolved": boolean,
    "includeComments": boolean,
    "groupBy": "type | severity | vehicle | driver | date"
  }
  ```

### POST `/api/policy-violations/compliance-report`
Generate compliance report
- **Body**:
  ```json
  {
    "tenantId": "uuid",
    "reportType": "monthly | quarterly | annual",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }
  ```

## Frontend Components

### `PolicyViolations.tsx`
Main dashboard component with three tabs:

#### Dashboard Tab
- Statistics cards (total, open, critical, avg resolution)
- 7-day trend chart
- Severity breakdown pie chart
- Top violation types bar chart
- Top violators display

#### Violations Tab
- Advanced filtering
- Searchable violations table
- Detail view with comments
- Resolution workflow
- Override request

#### Compliance Tab
- Report generation
- Policy recommendations
- Effectiveness metrics

### TypeScript Types

All types defined in `/src/lib/types.ts`:
- `PolicyViolation`
- `ViolationComment`
- `ViolationStatistics`
- `ViolationTrend`
- `PolicyDefinition`
- `ViolationFilter`
- `ViolationExportOptions`

## Notification System

### Email Configuration
Set environment variables:
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_USE_TLS=true
```

### Notification Service

#### `ViolationNotificationsService`
- `sendViolationNotification()`: Send immediate notification
- `sendEscalationNotification()`: Send escalation alert
- `checkEscalationRequired()`: Scheduled check for escalations
- `sendDailySummary()`: Daily summary report

### Scheduled Tasks
Set up cron jobs for:
1. Escalation checks (every hour):
   ```typescript
   await ViolationNotificationsService.checkEscalationRequired();
   ```

2. Daily summaries (daily at 8 AM):
   ```typescript
   await ViolationNotificationsService.sendDailySummary(tenantId);
   ```

3. Trend view refresh (every 6 hours):
   ```sql
   SELECT refresh_violation_trends();
   ```

## Usage Examples

### Creating a Violation Programmatically

```typescript
import { pool } from '../config/database';

const violation = {
  tenantId: 'tenant-uuid',
  violationType: 'personal_use_unauthorized',
  severity: 'high',
  policyName: 'Personal Use Policy',
  description: 'Unauthorized personal use detected on weekend',
  vehicleId: 'vehicle-uuid',
  vehicleNumber: 'V-1234',
  driverId: 'driver-uuid',
  driverName: 'John Doe',
  thresholdValue: 0,
  actualValue: 15.5,
  difference: 15.5,
  unit: 'miles',
  occurredAt: new Date().toISOString(),
};

await fetch('/api/policy-violations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(violation),
});
```

### Resolving a Violation

```typescript
await fetch(`/api/policy-violations/${violationId}/resolve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resolutionNotes: 'Driver provided valid justification',
    resolvedBy: currentUser.id,
    resolvedByName: currentUser.name,
  }),
});
```

### Exporting to PDF

```typescript
const response = await fetch('/api/policy-violations/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'pdf',
    tenantId: 'tenant-uuid',
    filters: {
      severity: ['critical', 'high'],
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    },
    includeResolved: true,
  }),
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'violations-report.pdf';
a.click();
```

## Security Considerations

1. **Access Control**: Implement role-based permissions for:
   - Viewing violations (all authenticated users)
   - Creating violations (system automated or managers)
   - Resolving violations (managers and admins)
   - Approving overrides (admins only)
   - Exporting data (managers and admins)

2. **Data Privacy**:
   - Log all access to violation data
   - Redact sensitive information in exports if needed
   - Implement data retention policies

3. **Audit Trail**:
   - All violation changes logged to `audit_logs`
   - Track who resolved/approved violations
   - Maintain comment history

## Compliance Features

### FedRAMP Alignment
- **AU-2, AU-3**: Comprehensive audit logging
- **AU-9**: Cryptographic hash verification (optional)
- **AC-2**: User accountability tracking
- **SI-4**: Real-time monitoring and alerts

### GDPR Considerations
- Personal data minimization
- Right to be forgotten (soft delete capability)
- Data export functionality
- Consent tracking (if applicable)

## Performance Optimization

1. **Materialized Views**: Pre-aggregated trends data
2. **Indexes**: Optimized queries on common filters
3. **Pagination**: Limit results to prevent overload
4. **Caching**: Consider Redis for statistics (optional)

## Maintenance

### Database Maintenance
```sql
-- Refresh trends view
SELECT refresh_violation_trends();

-- Archive old resolved violations (>1 year)
UPDATE policy_violations
SET status = 'archived'
WHERE status = 'resolved'
AND resolved_at < NOW() - INTERVAL '1 year';

-- Clean up old comments (optional)
DELETE FROM policy_violation_comments
WHERE created_at < NOW() - INTERVAL '2 years';
```

### Monitoring
Monitor these metrics:
- Average resolution time
- Open violation count
- Escalation rate
- Critical violation response time
- Email delivery success rate

## Future Enhancements

1. **Machine Learning**:
   - Predict likely violations based on patterns
   - Recommend policy changes
   - Identify high-risk drivers/vehicles

2. **Integration**:
   - Direct integration with telematics systems
   - Automatic violation creation from GPS/sensors
   - Integration with HR systems

3. **Mobile App**:
   - Push notifications
   - Mobile violation review
   - Quick resolution workflow

4. **Advanced Analytics**:
   - Cost impact analysis
   - Violation correlation with incidents
   - Fleet-wide risk scoring

## Support

For questions or issues:
- Review API documentation: `/docs/api`
- Check logs: `/var/log/fleet-management/violations.log`
- Contact: fleet-admin@example.com

---

**Last Updated**: 2026-01-02
**Version**: 1.0.0
**Author**: Fleet Management Development Team
