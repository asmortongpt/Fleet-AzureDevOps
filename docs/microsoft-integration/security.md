# Microsoft Integration Security Guide

## Security Best Practices

### 1. Token Security

**Access Token Storage**:
- ✓ Store tokens in memory only
- ✓ Never log access tokens
- ✓ Implement automatic token refresh
- ✗ Do not store tokens in database
- ✗ Do not include tokens in URLs

**Client Secret Management**:
```bash
# Store in Kubernetes secrets
kubectl create secret generic microsoft-graph-secret \
  --from-literal=client-secret=YOUR_SECRET \
  -n fleet-management

# Never commit to version control
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 2. Webhook Security

**Signature Validation**:
```typescript
// Always validate webhook signatures
const hmac = crypto.createHmac('sha256', webhookSecret);
hmac.update(payload);
const expectedSignature = hmac.digest('base64');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

**Client State Validation**:
```typescript
// Validate client state on every webhook
if (payload.clientState !== expectedClientState) {
  throw new Error('Invalid client state');
}
```

**HTTPS Enforcement**:
- Webhooks require HTTPS in production
- Use valid SSL certificates
- Enforce TLS 1.2 or higher

### 3. Data Encryption

**In Transit**:
- All API calls use HTTPS
- TLS 1.2+ required
- Strong cipher suites only

**At Rest**:
```sql
-- Enable encryption for sensitive fields
ALTER TABLE microsoft_tokens
  ENABLE ROW LEVEL SECURITY;

-- Encrypt file attachments in Azure Blob
-- Use Azure Storage encryption (enabled by default)
```

### 4. Rate Limiting

**API Rate Limits**:
```typescript
// Implement rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
});

app.use('/api/microsoft/', limiter);
```

**Microsoft Graph Limits**:
- Respect Retry-After headers
- Implement exponential backoff
- Cache responses when possible

### 5. Authentication & Authorization

**OAuth 2.0 Flow**:
```
1. User initiates auth
2. Redirect to Microsoft login
3. User authenticates
4. Microsoft redirects with code
5. Exchange code for token
6. Validate token
7. Create session
```

**Required Scopes**:
```typescript
const requiredScopes = [
  'User.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'ChannelMessage.Read.All',
  'ChannelMessage.Send'
];

// Validate user has required permissions
function validateScopes(token: string) {
  const decoded = jwt.decode(token);
  const userScopes = decoded.scp.split(' ');

  return requiredScopes.every(scope =>
    userScopes.includes(scope)
  );
}
```

### 6. Input Validation

**Email Address Validation**:
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**File Upload Validation**:
```typescript
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

const maxSize = 10 * 1024 * 1024; // 10MB

function validateFile(file: File) {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File too large');
  }
}
```

### 7. SQL Injection Prevention

**Use Parameterized Queries**:
```typescript
// Good
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// Bad
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### 8. XSS Prevention

**Sanitize HTML Content**:
```typescript
import DOMPurify from 'dompurify';

function sanitizeEmailBody(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href']
  });
}
```

### 9. GDPR Compliance

**Data Retention**:
```typescript
// Delete old messages after 90 days
async function cleanupOldMessages() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  await db.query(
    'DELETE FROM messages WHERE created_at < $1',
    [cutoffDate]
  );
}
```

**Right to Erasure**:
```typescript
// Delete all user data on request
async function deleteUserData(userId: string) {
  await db.transaction(async tx => {
    await tx.query('DELETE FROM messages WHERE user_id = $1', [userId]);
    await tx.query('DELETE FROM sync_state WHERE user_id = $1', [userId]);
    await tx.query('DELETE FROM attachments WHERE user_id = $1', [userId]);
  });
}
```

### 10. Audit Logging

**Log Security Events**:
```typescript
// Log all authentication attempts
function logAuthAttempt(event: {
  userId: string;
  success: boolean;
  ip: string;
  userAgent: string;
}) {
  logger.info('Auth attempt', {
    ...event,
    timestamp: new Date(),
    severity: event.success ? 'info' : 'warning'
  });
}

// Log permission changes
function logPermissionChange(event: {
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
}) {
  logger.warn('Permission change', event);
}
```

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in environment variables
- [ ] Client secret not in version control
- [ ] HTTPS enabled for all endpoints
- [ ] Webhook signature validation implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (HTML sanitization)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set (Helmet.js)

### Post-Deployment

- [ ] Rotate client secret every 6 months
- [ ] Review audit logs weekly
- [ ] Monitor for suspicious activity
- [ ] Update dependencies monthly
- [ ] Renew SSL certificates before expiry
- [ ] Review and update permissions quarterly
- [ ] Test disaster recovery procedure

## Incident Response

### Suspected Token Compromise

1. **Immediate Actions**:
   ```bash
   # Revoke compromised tokens
   # Rotate client secret in Azure Portal

   # Update secret in Kubernetes
   kubectl create secret generic microsoft-graph-secret \
     --from-literal=client-secret=NEW_SECRET \
     --dry-run=client -o yaml | kubectl apply -f -

   # Restart API
   kubectl rollout restart deployment/fleet-api
   ```

2. **Investigation**:
   - Review audit logs
   - Identify affected users
   - Check for unauthorized access
   - Document findings

3. **Remediation**:
   - Notify affected users
   - Force password resets if needed
   - Update security measures
   - File incident report

### Data Breach

1. **Containment**:
   ```bash
   # Disable affected integrations
   kubectl scale deployment/fleet-api --replicas=0

   # Backup current state
   kubectl exec postgres-0 -- pg_dump fleetdb > backup.sql
   ```

2. **Assessment**:
   - Determine scope of breach
   - Identify exposed data
   - Document timeline

3. **Notification**:
   - Notify GDPR authorities (within 72 hours if EU data)
   - Notify affected users
   - Update privacy policy

## Compliance

### GDPR Requirements

- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Use data only for stated purpose
- **Storage Limitation**: Delete data after retention period
- **Accuracy**: Keep data up to date
- **Integrity**: Ensure data security
- **Transparency**: Inform users of data usage

### SOC 2 Controls

- **Access Control**: Role-based access
- **Change Management**: Audit trail for all changes
- **Risk Assessment**: Regular security reviews
- **Incident Response**: Documented procedures
- **Vendor Management**: Third-party risk assessment

## Security Tools

### Recommended Tools

```bash
# Dependency scanning
npm audit

# Secret scanning
git-secrets --scan

# Static analysis
eslint src/**/*.ts --ext .ts

# Container scanning
trivy image fleet-api:latest
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Microsoft Security Best Practices](https://docs.microsoft.com/en-us/security/)
- [GDPR Guidelines](https://gdpr.eu/)
