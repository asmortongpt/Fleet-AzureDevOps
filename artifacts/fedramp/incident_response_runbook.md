# Incident Response Runbook
## Fleet Management System - FedRAMP Moderate

**System Name:** Fleet Garage Management System
**Document Version:** 1.0
**Date:** 2026-01-08
**Compliance:** NIST 800-53 IR Family

---

## Purpose

This Incident Response Runbook provides standardized procedures for detecting, responding to, and recovering from security incidents affecting the Fleet Management System.

**Scope:** All security incidents affecting confidentiality, integrity, or availability of the Fleet Management System.

**Compliance:** NIST 800-53 Rev 5 IR-1 through IR-9

---

## Incident Classification

### Severity Levels

#### P0 - Critical (Immediate Response)
**Response Time:** 15 minutes
**Examples:**
- Active data breach in progress
- Complete system outage affecting all users
- Ransomware attack
- Root compromise of production servers
- Mass data deletion
- Authentication system compromise

**Notification:**
- CISO (immediate)
- CEO (within 1 hour)
- Legal (within 2 hours)
- FedRAMP PMO (within 4 hours)

---

#### P1 - High (Urgent Response)
**Response Time:** 1 hour
**Examples:**
- Suspected data breach (under investigation)
- Partial system outage (>50% users affected)
- Successful exploitation of critical vulnerability
- Unauthorized access to sensitive data
- DDoS attack causing degradation
- Database corruption

**Notification:**
- CISO (immediate)
- Security Team (immediate)
- Engineering Lead (within 30 minutes)

---

#### P2 - Medium (Prompt Response)
**Response Time:** 4 hours
**Examples:**
- Failed intrusion attempt (blocked)
- Minor data exposure (<100 records)
- System degradation (<50% users affected)
- Malware detected and quarantined
- Suspicious activity pattern
- Configuration error exposing non-sensitive data

**Notification:**
- Security Team (immediate)
- Engineering On-Call (within 1 hour)

---

#### P3 - Low (Standard Response)
**Response Time:** 24 hours
**Examples:**
- Single failed login attempt
- Automated vulnerability scan
- Minor configuration drift
- Non-critical monitoring alert
- Routine security event

**Notification:**
- Security Team (business hours)

---

## Incident Response Team

### Roles and Responsibilities

#### Incident Commander
**Person:** CISO or designated Security Lead
**Responsibilities:**
- Overall incident response coordination
- Decision-making authority
- Stakeholder communication
- Resource allocation
- Incident closure approval

**Contact:**
- Primary: security-lead@company.com
- Phone: +1-XXX-XXX-XXXX
- Backup: backup-ciso@company.com

---

#### Security Analyst
**Person:** Security Operations team member
**Responsibilities:**
- Initial incident triage
- Evidence collection
- Threat analysis
- Forensic investigation
- Audit log review

**Contact:**
- Primary: security-ops@company.com
- On-Call: PagerDuty rotation

---

#### Engineering Lead
**Person:** Senior Engineer or CTO
**Responsibilities:**
- Technical remediation
- System recovery
- Code fixes
- Deployment coordination

**Contact:**
- Primary: engineering-lead@company.com
- Phone: +1-XXX-XXX-XXXX

---

#### Communications Lead
**Person:** PR/Communications Manager
**Responsibilities:**
- External communications
- Customer notifications
- Media relations
- Regulatory reporting

**Contact:**
- Primary: communications@company.com

---

#### Legal Counsel
**Person:** General Counsel or outside counsel
**Responsibilities:**
- Legal guidance
- Regulatory compliance
- Law enforcement coordination
- Liability assessment

**Contact:**
- Primary: legal@company.com
- Phone: +1-XXX-XXX-XXXX

---

## Incident Response Process

### Phase 1: Detection and Identification

#### Automated Detection Sources

1. **Azure Application Insights**
   - Anomaly detection
   - Error rate spikes
   - Performance degradation
   - Custom alerts

2. **Sentry Error Tracking**
   - Unhandled exceptions
   - Security errors
   - Code execution failures

3. **Audit Log Monitoring**
   - Failed login patterns
   - Privilege escalation
   - Unusual data access
   - Bulk exports

4. **Azure Security Center**
   - Threat detection
   - Vulnerability alerts
   - Compliance violations

#### Manual Detection Sources

1. **User Reports**
   - Email: security@company.com
   - Phone: +1-XXX-XXX-XXXX (24/7 hotline)
   - Internal ticket system

2. **Security Team Monitoring**
   - Daily log reviews
   - Weekly trend analysis
   - Monthly security scans

---

### Phase 2: Initial Response (First 15 Minutes)

#### Step 1: Incident Declaration
```
1. Security analyst receives alert or report
2. Perform initial triage (severity assessment)
3. Create incident ticket: INC-YYYYMMDD-####
4. Notify Incident Commander
5. Assemble response team based on severity
```

**Incident Ticket Template:**
```
Incident ID: INC-20260108-0001
Severity: P1 (High)
Detected: 2026-01-08 14:30:00 UTC
Detected By: Azure Security Center / User Report / Audit Log Review
Summary: [One-sentence description]
Systems Affected: [List of systems]
Data at Risk: [Type and volume]
Current Status: Investigation
Incident Commander: [Name]
Response Team: [Names]
```

#### Step 2: Initial Containment
```
P0/P1 Incidents:
1. Isolate affected systems (if safe to do so)
2. Block malicious IPs at firewall/WAF
3. Disable compromised accounts
4. Preserve evidence (DON'T delete logs)
5. Enable enhanced monitoring

P2/P3 Incidents:
1. Monitor for escalation
2. Collect initial evidence
3. Continue normal operations with increased monitoring
```

#### Step 3: Evidence Preservation

**Collect Immediately (Before It Disappears):**
- Memory dumps (volatile data)
- Active network connections
- Running processes
- Current user sessions

**Collect Soon (Stable Data):**
- Audit logs (last 7 days minimum)
- Application logs
- Database query logs
- Network traffic logs (if available)
- System configuration snapshots

**Evidence Checklist:**
```bash
# Capture current system state
date > /incident/INC-YYYYMMDD-####/timestamp.txt
netstat -an > /incident/INC-YYYYMMDD-####/netstat.txt
ps aux > /incident/INC-YYYYMMDD-####/processes.txt
who > /incident/INC-YYYYMMDD-####/logged_in_users.txt

# Export audit logs
psql -h prod-db -c "COPY (
  SELECT * FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '7 days'
) TO STDOUT" > /incident/INC-YYYYMMDD-####/audit_logs.csv

# Export application logs (Application Insights)
az monitor app-insights query \
  --app fleet-management \
  --analytics-query "traces | where timestamp > ago(7d)" \
  --output json > /incident/INC-YYYYMMDD-####/app_insights.json

# Capture Azure NSG logs
az network watcher flow-log show \
  --name fleet-nsg-flow-log \
  --resource-group fleet-production \
  > /incident/INC-YYYYMMDD-####/nsg_flow_logs.json
```

---

### Phase 3: Investigation and Analysis

#### Incident Analysis Workflow

**For Security Breaches:**
```
1. Determine attack vector (how did attacker get in?)
   - Check failed login attempts
   - Review vulnerability scan results
   - Analyze application logs for exploitation attempts

2. Determine scope (what was accessed/compromised?)
   - Review audit logs for attacker's user ID
   - Check data export events
   - Identify affected database tables

3. Determine timeline (when did breach occur?)
   - Find first malicious activity in logs
   - Trace attacker actions chronologically
   - Identify when breach was stopped/detected

4. Determine data exfiltration (what data was stolen?)
   - Review large data exports
   - Check network egress logs
   - Analyze database queries executed

5. Determine persistence (can attacker return?)
   - Check for backdoor accounts
   - Review SSH keys, API tokens
   - Scan for malware/webshells
```

**SQL Query Examples:**

```sql
-- Find all actions by compromised user
SELECT * FROM audit_logs
WHERE user_id = 'compromised-user-uuid'
  AND created_at > '2026-01-08 00:00:00'
ORDER BY created_at;

-- Find bulk data exports
SELECT user_id, action, entity_type, COUNT(*) as count,
       MIN(created_at) as first_export,
       MAX(created_at) as last_export
FROM audit_logs
WHERE action = 'DATA_EXPORT'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, action, entity_type
HAVING COUNT(*) > 100;

-- Find privilege escalation events
SELECT * FROM audit_logs
WHERE entity_type = 'user'
  AND changes->>'role' IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Find unauthorized access attempts
SELECT * FROM audit_logs
WHERE action = 'PERMISSION_DENIED'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, metadata->>'requested_resource'
HAVING COUNT(*) > 10;
```

---

### Phase 4: Containment, Eradication, and Recovery

#### Containment Strategies

**For Compromised User Account:**
```bash
# 1. Disable account immediately
UPDATE users SET is_active = false WHERE id = 'compromised-uuid';

# 2. Invalidate all sessions
DELETE FROM sessions WHERE user_id = 'compromised-uuid';

# 3. Rotate JWT signing key (forces all users to re-login)
npm run rotate-jwt-key

# 4. Reset password (if account will be re-enabled)
# User must reset via email

# 5. Audit log
INSERT INTO audit_logs (action, entity_type, entity_id, metadata)
VALUES (
  'SECURITY_INCIDENT',
  'user',
  'compromised-uuid',
  '{"reason": "account_compromise", "incident_id": "INC-20260108-0001"}'
);
```

**For Active Attack:**
```bash
# 1. Block attacker IP at Azure WAF
az network application-gateway waf-policy custom-rule create \
  --name block-attacker \
  --policy-name fleet-waf-policy \
  --resource-group fleet-production \
  --priority 1 \
  --action Block \
  --rule-type MatchRule \
  --match-variables RemoteAddr \
  --operator IPMatch \
  --match-values 192.0.2.100

# 2. Enable enhanced monitoring
# (Already configured in Azure Security Center)

# 3. Snapshot current state for forensics
az vm snapshot create \
  --resource-group fleet-production \
  --name fleet-api-snapshot-$(date +%Y%m%d-%H%M%S) \
  --source fleet-api-vm
```

**For Data Breach:**
```bash
# 1. Identify affected records
SELECT COUNT(*) FROM vehicles WHERE tenant_id = 'affected-tenant-uuid';

# 2. Notify affected users (via Communications Lead)

# 3. Offer credit monitoring (if PII exposed)

# 4. Report to authorities (if required)
#    - FedRAMP PMO: Within 1 hour of confirmed breach
#    - DHS US-CERT: Within 1 hour
#    - State Attorney General: Per state law (varies)
```

#### Eradication

**Malware/Backdoor:**
```bash
# 1. Identify malicious files
find /var/www -name "*.php" -mtime -7 -exec grep -l "eval(" {} \;

# 2. Remove malicious code
# (Manual review required - don't auto-delete)

# 3. Scan with antivirus
clamscan -r /var/www

# 4. Restore from known-good backup (if necessary)
az postgres server restore \
  --source-server fleet-production-db \
  --restore-point-in-time "2026-01-07T23:00:00Z" \
  --name fleet-production-db-restored
```

**Vulnerability Patching:**
```bash
# 1. Apply security patches
npm audit fix --force

# 2. Update vulnerable dependencies
npm update @package/vulnerable-lib

# 3. Deploy patched version
git commit -m "Security patch: Fix CVE-XXXX-XXXX"
git push
# CI/CD automatically deploys

# 4. Verify patch applied
npm audit

# 5. Rescan for vulnerabilities
npm run security-scan
```

#### Recovery

**System Restore:**
```bash
# 1. Verify backups are clean
# (Scan backup for malware before restoring)

# 2. Restore from backup
az postgres server restore ...

# 3. Apply any fixes/patches
npm audit fix

# 4. Deploy to staging
deploy.sh staging

# 5. Run full test suite
npm test
npm run e2e

# 6. Deploy to production
deploy.sh production

# 7. Monitor closely for 48 hours
# (Enhanced monitoring enabled)
```

---

### Phase 5: Post-Incident Activity

#### Lessons Learned Meeting

**Timing:** Within 7 days of incident closure

**Attendees:**
- Incident Commander
- Response team members
- Engineering leads
- CISO
- Executive stakeholders (for P0/P1)

**Agenda:**
1. Incident timeline review
2. What went well?
3. What could be improved?
4. Root cause analysis
5. Action items for prevention

**Template:**
```markdown
# Incident Post-Mortem: INC-20260108-0001

## Incident Summary
- Severity: P1 (High)
- Duration: 4 hours 30 minutes
- Systems Affected: API server, database
- Data at Risk: 10,000 vehicle records
- Outcome: Contained, no data loss

## Timeline
- 14:30 UTC: Alert triggered (suspicious login activity)
- 14:35 UTC: Incident declared
- 14:40 UTC: Account disabled, investigation started
- 15:00 UTC: Root cause identified (compromised password)
- 16:30 UTC: Full containment
- 18:00 UTC: System restored to normal
- 19:00 UTC: Incident closed

## Root Cause
Weak password on admin account allowed brute force attack.

## What Went Well
✅ Rapid detection (5 minutes from attack to alert)
✅ Quick account lockout prevented further damage
✅ Complete audit log enabled full investigation
✅ No data exfiltration occurred

## What Could Be Improved
❌ Password policy should enforce stronger passwords
❌ MFA should be required for admin accounts
❌ Brute force detection should trigger after 3 attempts (not 5)
❌ Runbook should include faster account disable procedure

## Action Items
1. [ ] Implement MFA for all admin accounts (Due: 2026-01-15, Owner: Security Team)
2. [ ] Strengthen password policy (min 14 chars, complexity) (Due: 2026-01-15, Owner: Engineering)
3. [ ] Reduce failed login threshold to 3 attempts (Due: 2026-01-12, Owner: Engineering)
4. [ ] Add one-click account disable in admin UI (Due: 2026-01-22, Owner: Engineering)
5. [ ] Conduct security awareness training (Due: 2026-02-01, Owner: HR)
```

#### Documentation Updates

**Update Within 30 Days:**
- Incident Response Runbook (add learnings)
- Security policies (based on root cause)
- Training materials
- Monitoring and alerting rules

---

## Specific Incident Scenarios

### Scenario 1: Data Breach

**Detection:**
- Audit log shows large data export by unauthorized user
- External researcher reports data leak
- User reports receiving phishing email with company data

**Response:**
```
1. Confirm breach (verify data exposure)
2. Contain breach (disable account, block IP)
3. Assess scope (how much data, what type)
4. Determine if PII/PHI exposed
5. Legal review (notification requirements)
6. Notify affected individuals (per regulation)
7. Notify FedRAMP PMO within 1 hour
8. Notify DHS US-CERT within 1 hour
9. Document everything
10. Conduct forensics
11. Implement controls to prevent recurrence
```

**Notification Requirements:**
- FedRAMP PMO: 1 hour (confirmed breach)
- US-CERT: 1 hour
- Affected individuals: 72 hours (GDPR) or state law
- State AG: Per state requirements
- Media: If >500 individuals affected (HIPAA), consider voluntary disclosure

---

### Scenario 2: Ransomware Attack

**Detection:**
- Files encrypted with ransom note
- User reports cannot access system
- Database tables dropped with ransom message

**Response:**
```
1. IMMEDIATE: Disconnect from network (isolate)
2. Do NOT pay ransom (FBI recommendation)
3. Assess backup availability
4. Contact law enforcement (FBI)
5. Restore from backup (verified clean)
6. Identify infection vector
7. Patch vulnerability
8. Scan all systems for malware
9. Monitor for persistence
10. Report to FedRAMP PMO
```

**DO NOT:**
- Pay ransom (funds terrorist organizations, no guarantee of decryption)
- Delete ransomware (evidence for law enforcement)
- Use infected system (may spread laterally)

---

### Scenario 3: DDoS Attack

**Detection:**
- Massive traffic spike
- Slow response times or timeouts
- Alerts from Azure WAF or DDoS Protection

**Response:**
```
1. Verify it's DDoS (not legitimate traffic spike)
2. Enable Azure DDoS Protection Standard (if not already)
3. Implement rate limiting
4. Block malicious IPs
5. Contact Azure Support for assistance
6. Scale up resources (temporarily) if needed
7. Investigate if DDoS is distraction for other attack
8. Document attack pattern
9. Tune WAF rules to block similar attacks
```

---

### Scenario 4: Insider Threat

**Detection:**
- Employee exporting large amounts of data
- Unauthorized access to HR/payroll data
- Suspicious after-hours activity

**Response:**
```
1. DO NOT alert the insider (may destroy evidence)
2. Preserve evidence (audit logs, email, etc.)
3. Consult with Legal (employee rights, evidence admissibility)
4. Disable access after hours (when employee not present)
5. Change all shared passwords/keys
6. Review audit logs for full scope
7. Conduct forensic investigation
8. Coordinate with HR for disciplinary action
9. Consider law enforcement involvement (if criminal)
```

---

### Scenario 5: Third-Party Breach

**Detection:**
- Notification from vendor (Smartcar, Microsoft, Google)
- Credentials found on dark web
- Suspicious activity from API integration

**Response:**
```
1. Assess risk (what data does vendor have access to?)
2. Rotate API keys/credentials immediately
3. Review vendor's breach notification
4. Determine if our data was compromised
5. Implement additional monitoring on integration
6. Review vendor access logs
7. Consider suspending integration (if high risk)
8. Determine if we have notification obligations
9. Document vendor breach in incident record
```

---

## Communication Templates

### Internal Notification (P0/P1)

**Subject:** URGENT: Security Incident - INC-YYYYMMDD-####

```
Team,

We have detected a [severity level] security incident affecting [system/data].

WHAT HAPPENED:
[Brief description]

SYSTEMS AFFECTED:
[List]

CURRENT STATUS:
[Contained / Under Investigation / Recovering]

EXPECTED RESOLUTION:
[Timeline]

ACTION REQUIRED:
- [Action 1]
- [Action 2]

We will provide updates every [frequency].

Contact security@company.com with questions.

- Incident Commander
```

---

### Customer Notification (Data Breach)

**Subject:** Important Security Notice Regarding Your Account

```
Dear [Customer Name],

We are writing to inform you of a security incident that may have affected your information.

WHAT HAPPENED:
On [date], we discovered that [brief description]. We immediately took action to secure our systems.

WHAT INFORMATION WAS INVOLVED:
The following information may have been accessed: [list specific fields]

WHAT WE'RE DOING:
- Secured the vulnerability
- Engaged third-party forensics
- Notified law enforcement
- Offering [credit monitoring / identity theft protection]

WHAT YOU CAN DO:
- Monitor your accounts for suspicious activity
- Change your password at [URL]
- Enable multi-factor authentication
- Review our security tips at [URL]

We sincerely apologize for this incident and any inconvenience.

For questions, contact: security@company.com or 1-XXX-XXX-XXXX

Sincerely,
[Name, Title]
```

---

## Tools and Resources

### Forensic Tools
- **Azure Security Center:** Threat detection and investigation
- **Application Insights:** Application-level forensics
- **Kusto Query Language (KQL):** Log analysis in Azure
- **PostgreSQL audit logs:** Database activity review
- **Wireshark:** Network traffic analysis (if packet capture available)

### Evidence Storage
- **Location:** `/incident/INC-YYYYMMDD-####/`
- **Azure Blob Storage:** `incidents-evidence` container
- **Retention:** 7 years (compliance requirement)
- **Access Control:** Incident Commander + Legal only

### External Resources
- **FBI Cyber Division:** +1-855-835-5324
- **US-CERT:** us-cert.gov/report
- **Azure Support:** Premier Support hotline
- **FedRAMP PMO:** info@fedramp.gov

---

## Testing and Exercises

### Tabletop Exercises

**Frequency:** Quarterly

**Scenarios:**
1. Data breach simulation
2. Ransomware attack
3. Insider threat
4. DDoS attack
5. Third-party compromise

**Participants:**
- Incident response team
- Engineering leads
- Executive stakeholders

**Deliverable:** After-action report with improvement recommendations

---

### Technical Drills

**Frequency:** Semi-annually

**Activities:**
- Restore from backup drill
- Log analysis exercise
- Evidence collection practice
- Communication drill

---

## Metrics and Reporting

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mean Time to Detect (MTTD) | < 15 minutes | Time from attack to alert |
| Mean Time to Respond (MTTR) | < 1 hour (P1) | Time from alert to initial containment |
| Mean Time to Recover | < 4 hours (P1) | Time from alert to full recovery |
| Incident Closure Rate | 100% within 30 days | All incidents formally closed |
| False Positive Rate | < 10% | Alerts that are not real incidents |

### Monthly Reporting

**Distribution:** CISO, executives, FedRAMP PMO

**Contents:**
- Number of incidents by severity
- Mean time to detect/respond/recover
- Top attack vectors
- Remediation status
- Trend analysis

---

## Appendices

### A. Contact List

| Role | Primary | Backup | Phone | Email |
|------|---------|--------|-------|-------|
| CISO | [Name] | [Name] | [Phone] | security@ |
| Engineering Lead | [Name] | [Name] | [Phone] | engineering@ |
| Legal Counsel | [Name] | [Name] | [Phone] | legal@ |
| Communications | [Name] | [Name] | [Phone] | pr@ |

### B. Escalation Matrix

| Severity | Notify Within | Escalate To |
|----------|--------------|-------------|
| P0 | Immediate | CISO, CEO, Legal |
| P1 | 15 minutes | CISO, Engineering Lead |
| P2 | 1 hour | Security Team Lead |
| P3 | 4 hours | On-call engineer |

### C. Regulatory Requirements

| Regulation | Notification Deadline | Authority |
|------------|----------------------|-----------|
| FedRAMP | 1 hour (confirmed incident) | FedRAMP PMO |
| FISMA | 1 hour | DHS US-CERT |
| GDPR | 72 hours | Supervisory authority |
| State Breach Laws | Varies by state | State AG |

---

**Document Version:** 1.0
**Last Tested:** 2026-01-08 (Tabletop exercise)
**Next Test:** 2026-04-08 (Quarterly)
**Next Review:** 2026-04-08

**Prepared By:** Compliance Agent G - FedRAMP Evidence Packager
