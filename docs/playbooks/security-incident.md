# Security Incident Playbook

## Alert Definition

**Trigger:** Suspicious activity, unauthorized access, data breach, or security vulnerability exploitation
**Severity:** Critical (P0)
**SLA Response Time:** Immediate (< 5 minutes)

⚠️ **IMPORTANT:** Security incidents may have legal and compliance implications. Follow this playbook carefully and involve appropriate stakeholders.

## Types of Security Incidents

1. **Unauthorized Access:** Failed login attempts, privilege escalation, compromised accounts
2. **Data Breach:** Unauthorized data access, data exfiltration, leaked credentials
3. **DDoS Attack:** Abnormal traffic patterns, service degradation
4. **Malware/Injection:** SQL injection, XSS, command injection attempts
5. **API Abuse:** Excessive API calls, scraping, unauthorized automation
6. **Insider Threat:** Suspicious employee activity, data access anomalies

## Immediate Response (0-5 minutes)

### 1. Assess & Contain

**DO NOT:**
- Immediately shut down systems (may destroy evidence)
- Communicate publicly about the incident
- Make changes without documenting

**DO:**
```bash
# Document everything with timestamps
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Security incident detected" >> /tmp/security-incident.log

# Create incident response channel
# Slack: #security-incident-[date]
```

### 2. Initial Classification

| Severity | Examples | Response Time | Escalation |
|----------|----------|---------------|------------|
| **P0 - Critical** | Active data breach, complete system compromise | Immediate | CEO, Legal, PR |
| **P1 - High** | Unauthorized access attempt, credential leak | < 15 min | CISO, Eng Manager |
| **P2 - Medium** | Suspicious activity, failed attacks | < 1 hour | Security Team |
| **P3 - Low** | False positive, informational | < 4 hours | Security Team |

### 3. Activate Incident Response Team

**Core Team:**
- Security Lead (Incident Commander)
- Engineering Lead
- DevOps Engineer
- Legal Counsel
- Communications Lead

**Extended Team (as needed):**
- CEO
- Customer Support
- HR (for insider threats)
- External Security Consultants

## Investigation (5-30 minutes)

### 1. Gather Evidence

#### Check Authentication Logs
```kusto
// Application Insights - Failed login attempts
customEvents
| where timestamp > ago(24h)
| where name == "LoginFailed"
| summarize attempts = count() by user_AuthenticatedId, client_IP
| where attempts > 10
| order by attempts desc
```

#### Check Access Logs
```kusto
// Unusual access patterns
requests
| where timestamp > ago(1h)
| where resultCode in (401, 403, 429)
| summarize count() by client_IP, url
| where count_ > 100
| order by count_ desc
```

#### Check for SQL Injection Attempts
```kusto
requests
| where timestamp > ago(24h)
| where url contains "'" or url contains "--" or url contains "/*"
| project timestamp, url, client_IP, userAgent
```

#### Check for Privilege Escalation
```sql
-- PostgreSQL audit log
SELECT *
FROM audit_log
WHERE action IN ('GRANT', 'ALTER USER', 'CREATE USER')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### 2. Identify Scope

**Questions to Answer:**
- What systems/data were accessed?
- When did the incident start?
- Is it still ongoing?
- How many users/records affected?
- What is the attacker's current access level?
- Are there indicators of data exfiltration?

### 3. Check for Indicators of Compromise (IOCs)

```bash
# Check for unusual processes
ps aux | grep -E "(nc|netcat|nmap|tcpdump)"

# Check for unusual network connections
netstat -an | grep ESTABLISHED | grep -v ":80\|:443\|:3000\|:5432"

# Check for recently modified files
find /app -type f -mtime -1 -ls

# Check for suspicious cron jobs
crontab -l
cat /etc/crontab

# Check for new user accounts
az ad user list --query "[?createdDateTime > '$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)']"
```

## Containment Steps

### Option 1: Compromised User Account

```bash
# Disable user account immediately
az ad user update \
  --id compromised-user@example.com \
  --account-enabled false

# Revoke all active sessions
# Application-specific implementation
curl -X POST https://api.fleet-management.com/admin/revoke-sessions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId": "compromised-user-id"}'

# Reset password
az ad user update \
  --id compromised-user@example.com \
  --force-change-password-next-sign-in true

# Review and revoke API keys
DELETE FROM api_keys WHERE user_id = 'compromised-user-id';
```

### Option 2: Active Attack in Progress

```bash
# Block attacking IP addresses
az network application-gateway waf-policy managed-rule rule-set add \
  --policy-name fleet-waf-policy \
  --resource-group fleet-management-rg \
  --type Microsoft_BotManagerRuleSet \
  --version 1.0

# Or use Azure Front Door custom rules
az network front-door waf-policy rule create \
  --policy-name fleet-waf \
  --resource-group fleet-management-rg \
  --name block-attacker-ip \
  --priority 1 \
  --rule-type MatchRule \
  --action Block \
  --match-condition RemoteAddr IPMatch 123.45.67.89
```

### Option 3: Compromised API Keys

```bash
# Rotate API keys immediately
# 1. Generate new keys
NEW_API_KEY=$(openssl rand -hex 32)
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 2. Update in Azure Key Vault
az keyvault secret set \
  --vault-name fleet-management-vault \
  --name api-key \
  --value "$NEW_API_KEY"

az keyvault secret set \
  --vault-name fleet-management-vault \
  --name jwt-secret \
  --value "$NEW_JWT_SECRET"

# 3. Invalidate old keys in database
UPDATE api_keys SET revoked = true, revoked_at = NOW();

# 4. Force application restart to pick up new secrets
az webapp restart \
  --name fleet-management-api \
  --resource-group fleet-management-rg
```

### Option 4: Data Breach

```bash
# Enable additional logging
az monitor diagnostic-settings create \
  --resource fleet-management-api \
  --name security-audit \
  --logs '[{"category": "SecurityAuditEvents", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]'

# Create snapshot of current state (evidence preservation)
az snapshot create \
  --resource-group fleet-management-rg \
  --name security-incident-$(date +%Y%m%d-%H%M%S) \
  --source fleet-management-disk

# Isolate affected systems (if necessary)
az network nsg rule create \
  --resource-group fleet-management-rg \
  --nsg-name fleet-management-nsg \
  --name isolate-compromised-vm \
  --priority 100 \
  --direction Inbound \
  --access Deny \
  --protocol '*' \
  --source-address-prefixes '*' \
  --destination-port-ranges '*'
```

### Option 5: DDoS Attack

```bash
# Enable Azure DDoS Protection
az network ddos-protection create \
  --resource-group fleet-management-rg \
  --name fleet-ddos-protection \
  --location eastus2

# Enable rate limiting
# See performance-degradation.md for rate limiting configuration

# Contact Azure Support for DDoS mitigation
# https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
```

## Eradication & Recovery

### 1. Remove Attack Vectors

```bash
# Patch vulnerabilities
npm audit fix
npm update

# Update dependencies
npm install --package-lock-only
npm ci

# Apply security patches
az webapp deployment source sync \
  --name fleet-management-api \
  --resource-group fleet-management-rg
```

### 2. Verify System Integrity

```bash
# Check file integrity
# Compare with known good backup
diff -r /app /backup/app

# Scan for malware
clamscan -r /app

# Review database for injected data
SELECT * FROM users WHERE created_at > 'incident-start-time';
```

### 3. Restore from Clean Backup (if needed)

```bash
# Restore database from point-in-time before incident
az postgres server restore \
  --resource-group fleet-management-rg \
  --name fleet-db-restored \
  --restore-point-in-time "2025-12-31T10:00:00Z" \
  --source-server fleet-db-server
```

### 4. Strengthen Security

```javascript
// Implement additional security controls

// 1. Mandatory MFA
const mfaMiddleware = (req, res, next) => {
  if (!req.user.mfaVerified) {
    return res.status(403).json({ error: 'MFA required' });
  }
  next();
};

// 2. IP whitelisting for admin endpoints
const adminIPWhitelist = ['1.2.3.4', '5.6.7.8'];
const ipWhitelistMiddleware = (req, res, next) => {
  const clientIP = req.ip;
  if (!adminIPWhitelist.includes(clientIP)) {
    return res.status(403).json({ error: 'IP not whitelisted' });
  }
  next();
};

// 3. Enhanced audit logging
const auditLog = (action, details) => {
  db.query(
    'INSERT INTO audit_log (action, details, user_id, ip_address, timestamp) VALUES ($1, $2, $3, $4, NOW())',
    [action, JSON.stringify(details), req.user.id, req.ip]
  );
};
```

## Communication

### Internal Communication

#### Incident Channel (Slack)
```
🔴 SECURITY INCIDENT - P0
Type: [Unauthorized Access/Data Breach/DDoS]
Status: [Investigating/Contained/Resolved]
Affected Systems: [List]
Incident Commander: [Name]
Next Update: [Time]

DO NOT discuss this incident outside #security-incident-YYYYMMDD
```

### External Communication

⚠️ **CRITICAL:** Coordinate all external communication with Legal and PR teams

#### If Data Breach Affecting PII

**Legal Requirements:**
- GDPR: Notify within 72 hours
- State laws: Varies by state
- SOC 2: Notify customers as per agreement

**Customer Notification Template (Legal Review Required):**
```
Subject: Important Security Notice

Dear [Customer],

We are writing to inform you of a security incident that may have affected your data.

WHAT HAPPENED:
On [date], we detected unauthorized access to our systems.

WHAT INFORMATION WAS INVOLVED:
[Specific data types - be precise]

WHAT WE'RE DOING:
- Immediately secured our systems
- Engaged external security experts
- Notifying law enforcement
- Implementing additional security measures

WHAT YOU SHOULD DO:
- Change your password immediately
- Enable two-factor authentication
- Monitor your account for suspicious activity

We sincerely apologize for this incident and are committed to protecting your data.

For questions: security@fleet-management.com

[Company Name]
```

## Post-Incident

### 1. Evidence Preservation

```bash
# Collect all logs
az monitor activity-log list \
  --start-time 2025-12-31T00:00:00Z \
  --end-time 2025-12-31T23:59:59Z \
  > incident-activity-log.json

# Export Application Insights
# (Use Azure Portal export feature)

# Database audit logs
pg_dump -t audit_log > incident-audit-log.sql

# Create incident report package
tar -czf incident-evidence-$(date +%Y%m%d).tar.gz \
  incident-*.log \
  incident-*.json \
  incident-*.sql \
  screenshots/
```

### 2. Root Cause Analysis (Within 48 hours)

```markdown
# Security Incident Post-Mortem

## Executive Summary
[Brief description of incident, impact, and resolution]

## Timeline
[Detailed timeline with timestamps]

## Root Cause
[Technical root cause]

## Attack Vector
[How the attacker gained access]

## Data Accessed
[Specific data compromised]

## User Impact
[Number of users affected, data exposed]

## Response Effectiveness
[What went well, what didn't]

## Lessons Learned
[Key takeaways]

## Action Items
1. [Specific preventive measure] - Owner: [Name] - Due: [Date]
2. [Security control implementation] - Owner: [Name] - Due: [Date]
...
```

### 3. Regulatory Reporting

- [ ] File breach notification with relevant authorities
- [ ] Notify affected individuals (as required by law)
- [ ] Update insurance carrier
- [ ] Update SOC 2 auditor
- [ ] Document in compliance records

### 4. Security Improvements

```bash
# Implement security enhancements identified

# 1. Enable Microsoft Defender for Cloud
az security pricing create \
  --name VirtualMachines \
  --tier Standard

# 2. Enable Advanced Threat Protection
az sql server threat-policy update \
  --resource-group fleet-management-rg \
  --server fleet-db-server \
  --state Enabled \
  --email-addresses security@fleet-management.com

# 3. Implement Web Application Firewall
az network application-gateway waf-config set \
  --gateway-name fleet-gateway \
  --resource-group fleet-management-rg \
  --enabled true \
  --firewall-mode Prevention

# 4. Enable Azure Sentinel (SIEM)
az sentinel workspace create \
  --resource-group fleet-management-rg \
  --workspace-name fleet-sentinel
```

## Prevention Checklist

- [ ] **Authentication**
  - [ ] MFA enabled for all users
  - [ ] Strong password policy enforced
  - [ ] Account lockout after failed attempts
  - [ ] Regular password rotation

- [ ] **Authorization**
  - [ ] Principle of least privilege
  - [ ] Role-based access control (RBAC)
  - [ ] Regular access reviews
  - [ ] API key rotation policy

- [ ] **Network Security**
  - [ ] WAF enabled and configured
  - [ ] DDoS protection enabled
  - [ ] IP whitelisting for admin endpoints
  - [ ] VPN required for sensitive operations

- [ ] **Data Protection**
  - [ ] Encryption at rest (databases, files)
  - [ ] Encryption in transit (TLS 1.3)
  - [ ] Secrets in Key Vault, never in code
  - [ ] Regular backup and recovery testing

- [ ] **Monitoring & Detection**
  - [ ] Security event logging
  - [ ] Anomaly detection alerts
  - [ ] Regular security scans
  - [ ] Penetration testing (annual)

- [ ] **Compliance**
  - [ ] SOC 2 Type II certified
  - [ ] GDPR compliant
  - [ ] Regular compliance audits
  - [ ] Security awareness training

## Emergency Contacts

- **Security Team:** security@fleet-management.com, Slack: #security
- **Legal Counsel:** [Law Firm Name], [Phone]
- **Cyber Insurance:** [Insurance Company], Policy #[Number], [24/7 Hotline]
- **FBI Cyber Division:** https://www.fbi.gov/investigate/cyber (if needed)
- **Azure Security:** Azure Support Portal
- **External Security Firm:** [Firm Name], [Emergency Hotline]

## Related Resources

- [Incident Response Plan](../processes/incident-response.md)
- [Security Policies](../security/policies.md)
- [Compliance Documentation](../compliance/soc2/)
- [Disaster Recovery Plan](../processes/disaster-recovery.md)
- [OWASP Top 10](https://owasp.org/Top10/)

---

**Last Updated:** 2025-12-31
**Version:** 1.0
**Owner:** Security Team
**Classification:** Confidential
**Review Frequency:** Quarterly or after each incident
