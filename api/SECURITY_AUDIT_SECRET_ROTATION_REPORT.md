# CRITICAL SECURITY AUDIT - Secret Rotation Report

**Date**: 2025-11-21
**Status**: CRITICAL - IMMEDIATE ACTION REQUIRED
**Severity**: HIGH (9+ exposed secrets found)

---

## Executive Summary

This audit identified **CRITICAL security vulnerabilities** due to hardcoded secrets, API keys, and credentials committed to the repository. All exposed secrets must be rotated immediately and removed from version control.

### Risk Assessment
- **Exposure Level**: HIGH - Secrets in plaintext files tracked by Git
- **Attack Surface**: Azure AD credentials, JWT secrets, CSRF tokens, database credentials
- **Compromise Risk**: Full system access, data breach, privilege escalation
- **Compliance Impact**: SOC2, GDPR, HIPAA violations

---

## 1. EXPOSED SECRETS INVENTORY

### 1.1 Azure AD / Microsoft Authentication (CRITICAL)

#### File: `.env` (Line 22-24)
```
AZURE_AD_CLIENT_ID=XXX...REDACTED (EXPOSED)
AZURE_AD_TENANT_ID=XXX...REDACTED (EXPOSED)
AZURE_AD_CLIENT_SECRET=XXX...REDACTED (EXPOSED - HIGH RISK)
```

**Redacted for Security**:
- Client ID: See .env file (not in Git)
- Tenant ID: See .env file (not in Git)
- Client Secret: See .env file (not in Git)

**Risk**: Complete Azure AD application compromise, unauthorized access to Microsoft Graph API
**Action Required**: Rotate Azure AD app secret immediately in Azure Portal

---

#### File: `.env.test` (Line 3-6, 9-11)
```
AZURE_AD_CLIENT_ID=baa...bd4a (DUPLICATE EXPOSURE)
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret_here (PLACEHOLDER - OK)
AZURE_AD_TENANT_ID=0ec...5347 (EXPOSED)

MICROSOFT_GRAPH_CLIENT_ID=c49...9151 (EXPOSED)
MICROSOFT_GRAPH_CLIENT_SECRET=c49...9151 (EXPOSED - SAME AS CLIENT_ID - INVALID?)
MICROSOFT_GRAPH_TENANT_ID=e51...3861 (EXPOSED)
```

**Redacted for Security**:
- MS Graph Client ID: See .env.test file (not in Git)
- MS Graph Secret: See .env.test file (appears to match client ID - verify validity)
- MS Graph Tenant: See .env.test file (not in Git)

**Risk**: Microsoft Graph API access, email/calendar/OneDrive data exposure
**Action Required**: Verify MS Graph secret validity, rotate if real

---

### 1.2 Cryptographic Secrets (CRITICAL)

#### File: `.env` (Line 17-19)
```
CSRF_SECRET=XXX...REDACTED (64-char random string - EXPOSED)
JWT_SECRET=XXX...REDACTED (64-char random string - EXPOSED)
SESSION_SECRET=XXX...REDACTED (64-char random string - EXPOSED)
```

**Redacted for Security**:
- CSRF Secret: 64-char base64 string (generate new)
- JWT Secret: 64-char base64 string (generate new)
- Session Secret: 64-char base64 string (generate new)

**Risk**:
- JWT compromise = session hijacking, privilege escalation
- CSRF bypass = cross-site request forgery attacks
- Session hijacking = account takeover

**Action Required**:
1. Generate new secrets using `openssl rand -base64 48`
2. Invalidate all existing JWT tokens
3. Force all users to re-authenticate

---

### 1.3 Database Credentials (HIGH)

#### File: `.env` (Line 4-9)
```
DATABASE_URL=postgresql://XXX:XXX@localhost:5432/fleet_db
DB_USER=XXX...REDACTED (EXPOSED)
DB_PASSWORD=XXX...REDACTED (EXPOSED - WEAK PASSWORD)
```

**Redacted for Security**:
- Username: See .env file (not in Git)
- Password: WEAK - must be changed immediately

**Risk**: Direct database access, data exfiltration, data corruption
**Action Required**: Change database password, update connection strings

---

#### File: `.env.test` (Line 14-19)
```
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/fleet_test
DB_USER=test_user
DB_PASSWORD=test_password (WEAK)
```

**Risk**: Test database compromise (acceptable if contains no real data)
**Action Required**: Verify test DB has no production data, consider rotation

---

#### File: `database/STAGING_SEED_README.md` (Line 61, 68)
```
Example command showing: postgresql://username:password@host:5432/database
```

**Risk**: LOW (placeholder example, but should use better placeholders)
**Action Required**: Update documentation with safer examples

---

#### File: `database/seed_staging.sh` (Line 9, 109-110)
```
Example showing password in connection string
Hardcoded credentials: admin@capitaltechalliance.com / YOUR_ADMIN_PASSWORD_HERE
```

**Risk**: MEDIUM - Default admin password documented
**Action Required**: Remove from documentation, force password change on first login

---

### 1.4 JWT Test Secrets

#### File: `.env.test` (Line 22)
```
JWT_SECRET=test_jwt_secret_for_security_tests_only
```

**Risk**: LOW (test environment only, clearly marked)
**Action Required**: Acceptable for test env, but ensure isolated from production

---

## 2. FILES REQUIRING IMMEDIATE REMEDIATION

### Priority 1 - CRITICAL (Remove from Git immediately)
1. `.env` - Contains production secrets
2. `.env.test` - Contains real Azure credentials

### Priority 2 - HIGH (Update documentation)
1. `database/STAGING_SEED_README.md` - Default credentials
2. `database/seed_staging.sh` - Hardcoded admin password

### Priority 3 - MEDIUM (Review patterns)
1. `dist/config/swagger.js` - Demo password in documentation
2. All TypeScript/JavaScript files with password handling logic

---

## 3. SECRET ROTATION PLAN

### 3.1 Azure AD Application Secrets

**Azure Portal Steps**:
1. Navigate to Azure AD → App Registrations
2. Select app ID from exposed credentials (see .env file - DO NOT commit)
3. Go to "Certificates & secrets"
4. Delete ALL existing secrets (they were exposed in Git)
5. Create new secret with 6-month expiration
6. Copy new secret to Azure Key Vault (DO NOT commit to Git)
7. Update application configuration to read from Key Vault
8. Test application with new secret before deleting old one

**Microsoft Graph App**:
1. Verify `MICROSOFT_GRAPH_CLIENT_SECRET` is valid (appears to be duplicate of client ID)
2. If invalid, generate proper secret in Azure Portal
3. Store in Azure Key Vault

---

### 3.2 Cryptographic Secrets Rotation

**Generate New Secrets**:
```bash
# Generate new CSRF secret
openssl rand -base64 48

# Generate new JWT secret
openssl rand -base64 48

# Generate new SESSION secret
openssl rand -base64 48
```

**Deployment Process**:
1. Store all three secrets in Azure Key Vault:
   - `fleet-api-csrf-secret`
   - `fleet-api-jwt-secret`
   - `fleet-api-session-secret`

2. Update application to read from Key Vault on startup

3. Deploy new version with Key Vault integration

4. Invalidate all existing JWT tokens (clear Redis/session store)

5. Force user re-authentication

---

### 3.3 Database Password Rotation

**PostgreSQL Steps**:
```sql
-- Connect as postgres superuser
ALTER USER fleet_user WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';

-- Update connection string in Azure Key Vault
-- Key: fleet-api-database-url
-- Value: postgresql://fleet_user:NEW_SECURE_PASSWORD_HERE@host:5432/fleet_db
```

**Requirements for new password**:
- Minimum 20 characters
- Mix of uppercase, lowercase, numbers, special characters
- Generate using: `openssl rand -base64 32`

---

## 4. AZURE KEY VAULT MIGRATION PLAN

### 4.1 Key Vault Setup

**Create Key Vault** (if not exists):
```bash
az keyvault create \
  --name fleet-api-secrets \
  --resource-group fleet-production \
  --location eastus \
  --enable-rbac-authorization true
```

**Grant Access**:
```bash
# Grant application managed identity access
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <APP_MANAGED_IDENTITY_ID> \
  --scope /subscriptions/<SUB_ID>/resourceGroups/fleet-production/providers/Microsoft.KeyVault/vaults/fleet-api-secrets
```

---

### 4.2 Secret Migration Mapping

| Current .env Variable | Azure Key Vault Secret Name | Priority |
|----------------------|----------------------------|----------|
| `AZURE_AD_CLIENT_SECRET` | `fleet-azure-ad-client-secret` | CRITICAL |
| `MICROSOFT_GRAPH_CLIENT_SECRET` | `fleet-msgraph-client-secret` | CRITICAL |
| `JWT_SECRET` | `fleet-jwt-secret` | CRITICAL |
| `CSRF_SECRET` | `fleet-csrf-secret` | CRITICAL |
| `SESSION_SECRET` | `fleet-session-secret` | CRITICAL |
| `DATABASE_URL` | `fleet-database-connection-string` | HIGH |
| `DB_PASSWORD` | `fleet-db-password` | HIGH |

---

### 4.3 Application Code Updates

**Before** (`.env` file):
```typescript
const jwtSecret = process.env.JWT_SECRET;
```

**After** (Azure Key Vault):
```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new DefaultAzureCredential();
const keyVaultUrl = 'https://fleet-api-secrets.vault.azure.net';
const client = new SecretClient(keyVaultUrl, credential);

// Cache secrets on startup
const jwtSecret = await client.getSecret('fleet-jwt-secret');
const csrfSecret = await client.getSecret('fleet-csrf-secret');
const dbConnectionString = await client.getSecret('fleet-database-connection-string');
```

**NPM Dependencies**:
```bash
npm install @azure/identity @azure/keyvault-secrets
```

---

## 5. .GITIGNORE PROTECTION

### Add to `.gitignore`:
```
# Environment files with secrets
.env
.env.local
.env.production
.env.staging
.env.development
.env.*.local

# Backup files
*.env.backup
*.env.bak

# Secret files
secrets/
credentials/
*secret*.json
*credential*.json
*token*.txt

# Azure Key Vault cache
.azure/
*.pem
*.key
*.pfx
*.p12
```

---

## 6. PRE-COMMIT SECRET SCANNING

### Install git-secrets or gitleaks

**Option 1: gitleaks** (Recommended)
```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks/releases

# Create .gitleaks.toml configuration
cat > .gitleaks.toml << 'EOF'
title = "Fleet API Secret Scanning"

[[rules]]
id = "azure-ad-secret"
description = "Azure AD Client Secret"
regex = '''[a-zA-Z0-9~_.-]{32,44}'''
tags = ["azure", "secret"]

[[rules]]
id = "jwt-secret"
description = "JWT Secret"
regex = '''JWT_SECRET\s*=\s*['"]?([a-zA-Z0-9+/=]{40,})['"]?'''
tags = ["jwt", "secret"]

[[rules]]
id = "database-password"
description = "Database Password"
regex = '''postgresql://[^:]+:([^@]+)@'''
tags = ["database", "password"]

[[rules]]
id = "api-key"
description = "API Key"
regex = '''(?i)(api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9]{32,})['"]?'''
tags = ["api", "key"]

[allowlist]
paths = [
  ".env.example",
  "docs/",
  "README.md"
]
EOF

# Add pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
gitleaks protect --staged --verbose
EOF

chmod +x .git/hooks/pre-commit
```

**Option 2: git-secrets**
```bash
# Install git-secrets
brew install git-secrets  # macOS

# Initialize git-secrets
git secrets --install
git secrets --register-aws  # Optional

# Add custom patterns
git secrets --add 'JWT_SECRET\s*=\s*[a-zA-Z0-9+/=]{40,}'
git secrets --add 'AZURE_AD_CLIENT_SECRET\s*=\s*[a-zA-Z0-9~_.-]{32,44}'
git secrets --add 'postgresql://[^:]+:[^@]+@'
```

---

## 7. IMMEDIATE ACTION CHECKLIST

### Phase 1: Stop the Bleeding (Within 1 hour)
- [ ] Add `.env` and `.env.test` to `.gitignore`
- [ ] Remove `.env` from Git history using BFG or git-filter-repo
- [ ] Rotate Azure AD client secret immediately
- [ ] Generate new JWT, CSRF, and SESSION secrets
- [ ] Change database passwords

### Phase 2: Implement Key Vault (Within 24 hours)
- [ ] Create Azure Key Vault resource
- [ ] Migrate all secrets to Key Vault
- [ ] Update application code to use Key Vault SDK
- [ ] Test secret retrieval in development environment
- [ ] Deploy to staging with Key Vault integration

### Phase 3: Harden Security (Within 1 week)
- [ ] Install and configure gitleaks pre-commit hook
- [ ] Create `.env.example` template with placeholders
- [ ] Update documentation to remove all hardcoded credentials
- [ ] Force password reset for all admin accounts
- [ ] Implement secret rotation policy (90-day rotation)
- [ ] Enable Azure Key Vault audit logging
- [ ] Set up alerts for Key Vault access

### Phase 4: Audit & Compliance (Within 2 weeks)
- [ ] Review all Git history for leaked secrets
- [ ] Run full security scan with tools like trufflehog
- [ ] Document secret management procedures
- [ ] Update SOC2 compliance documentation
- [ ] Conduct security awareness training
- [ ] Implement secret expiration monitoring

---

## 8. CLEANUP COMMANDS

### Remove .env from Git History

**Option 1: BFG Repo-Cleaner** (Fastest)
```bash
# Install BFG
brew install bfg  # macOS

# Clone a fresh copy
git clone --mirror https://github.com/yourorg/fleet-api.git fleet-api-cleanup
cd fleet-api-cleanup

# Remove .env files from history
bfg --delete-files .env
bfg --delete-files .env.test

# Cleanup and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Coordinate with team!)
git push --force
```

**Option 2: git-filter-repo**
```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS

# Backup repository first!
cp -r . ../fleet-api-backup

# Remove .env files from history
git filter-repo --invert-paths --path .env --path .env.test --force

# Force push (WARNING: Coordinate with team!)
git push --force
```

---

## 9. LONG-TERM RECOMMENDATIONS

### 9.1 Secret Management Policy
1. **Never** commit secrets to Git
2. Use Azure Key Vault for all production secrets
3. Rotate secrets every 90 days
4. Use managed identities instead of service principals where possible
5. Implement least-privilege access (RBAC)

### 9.2 Development Best Practices
1. Use `.env.example` with placeholder values
2. Each developer has local `.env` (never committed)
3. CI/CD pulls secrets from Key Vault
4. Separate Key Vaults for dev/staging/production

### 9.3 Monitoring & Alerts
1. Azure Monitor alerts for Key Vault access
2. Failed authentication attempt monitoring
3. Unusual API access pattern detection
4. Regular secret rotation reminders

### 9.4 Compliance
1. Document secret rotation procedures
2. Maintain audit logs for secret access
3. Annual security audit of secret management
4. Incident response plan for compromised secrets

---

## 10. CONCLUSION

**Estimated Time to Remediate**:
- Critical secrets rotation: 1-2 hours
- Key Vault migration: 4-8 hours
- Documentation cleanup: 2-4 hours
- Git history cleanup: 1-2 hours
- Total: 8-16 hours

**Risk if Not Addressed**:
- Unauthorized access to Azure resources
- Database compromise and data breach
- Session hijacking and account takeover
- SOC2/compliance audit failure
- Potential financial and reputational damage

**Next Steps**:
1. Review this report with security team
2. Prioritize Azure AD secret rotation (immediate)
3. Begin Key Vault migration (today)
4. Schedule Git history cleanup (coordinate with team)
5. Implement pre-commit hooks (this week)

---

**Report Generated**: 2025-11-21
**Generated By**: Security Audit - Automated Scan
**Classification**: CONFIDENTIAL - INTERNAL USE ONLY
