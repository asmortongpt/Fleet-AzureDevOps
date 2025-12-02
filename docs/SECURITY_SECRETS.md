# Security & Secrets Management

## Overview

This document outlines best practices for managing secrets and sensitive configuration in the Fleet Management System.

## 🔐 Secret Types

### 1. **JWT Secrets**
- **Purpose**: Sign and verify authentication tokens
- **Strength**: 512-bit (128 hex characters)
- **Rotation**: Every 90 days minimum
- **Generation**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 2. **Encryption Keys**
- **Purpose**: Encrypt sensitive data at rest
- **Strength**: 256-bit (64 hex characters)
- **Algorithm**: AES-256-GCM
- **Generation**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 3. **Database Passwords**
- **Requirements**:
  - Minimum 32 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - No dictionary words
- **Generation**:
  ```bash
  openssl rand -base64 32
  ```

### 4. **API Keys**
- **Third-party services**: Use provider-generated keys
- **Internal APIs**: Generate with `crypto.randomBytes(32).toString('base64')`

## 📋 Environment Files

### Development (`.env`)
- Contains development/testing credentials
- Can use mock values for optional services
- **NEVER commit to git** (already in .gitignore)

### Production (`.env.production`)
- Contains real production secrets
- Must be stored in secure secret management system
- **NEVER commit to git**

### Template (`.env.example`)
- Public template showing required variables
- Contains NO actual secrets
- Safe to commit to git

## 🏗️ Secret Management Strategy

### For Local Development
1. Copy `.env.example` to `.env`
2. Fill in minimum required secrets (DB password, JWT secret)
3. Optional services can use mock mode

### For Production (Azure)

#### Option 1: Azure Key Vault (Recommended)
```bash
# Store secrets in Key Vault
az keyvault secret set --vault-name fleet-keyvault --name JWT-SECRET --value "your-secret"
az keyvault secret set --vault-name fleet-keyvault --name DB-PASSWORD --value "your-password"

# Grant app access
az keyvault set-policy --name fleet-keyvault \
  --object-id <app-managed-identity-id> \
  --secret-permissions get list
```

**In code**: Use `@azure/keyvault-secrets` SDK
```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.AZURE_KEY_VAULT_URI!, credential);
const secret = await client.getSecret("JWT-SECRET");
```

#### Option 2: Azure App Configuration
- Managed feature flags and configuration
- Supports Key Vault references
- Built-in encryption at rest

#### Option 3: Managed Identity
- No secrets in code or env files
- Azure resources authenticate automatically
- Best for Azure-to-Azure communication

### For Other Cloud Providers

#### AWS
- Use **AWS Secrets Manager** or **Parameter Store**
- IAM roles instead of access keys

#### GCP
- Use **Secret Manager**
- Service accounts with minimal permissions

## 🔄 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Automation |
|-------------|-------------------|------------|
| JWT Secret | 90 days | Manual |
| Encryption Key | 180 days | Manual with migration |
| Database Password | 90 days | Azure automatic rotation |
| API Keys (3rd party) | Per vendor policy | Manual |
| SSL/TLS Certificates | Before expiry | Let's Encrypt auto-renewal |

## 🚨 Secret Rotation Process

### JWT Secret Rotation (Zero Downtime)

1. **Generate new secret**:
   ```bash
   NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   ```

2. **Support both old and new**:
   ```typescript
   const JWT_SECRETS = [
     process.env.JWT_SECRET,
     process.env.JWT_SECRET_OLD
   ];

   // Verify with multiple secrets
   for (const secret of JWT_SECRETS) {
     try {
       return jwt.verify(token, secret);
     } catch {}
   }
   ```

3. **Deploy with both secrets** (2-week overlap)

4. **Remove old secret** after all tokens expire

### Database Password Rotation

1. Create new password
2. Update database user credentials
3. Update Key Vault
4. Restart application pods
5. Verify connectivity
6. Remove old password

## 🛡️ Security Best Practices

### Never
- ❌ Commit secrets to git
- ❌ Log secrets (even in debug mode)
- ❌ Send secrets in URLs
- ❌ Store secrets in client-side code
- ❌ Share secrets via email/Slack
- ❌ Use weak passwords or default values

### Always
- ✅ Use `.env` files (git-ignored)
- ✅ Use Key Vault in production
- ✅ Rotate secrets regularly
- ✅ Use Managed Identity when possible
- ✅ Encrypt secrets at rest
- ✅ Use HTTPS for all API calls
- ✅ Implement least-privilege access
- ✅ Monitor for leaked secrets (git-secrets, truffleHog)
- ✅ Use different secrets per environment

## 🔍 Secret Scanning

### Pre-commit Hooks
Install git-secrets:
```bash
brew install git-secrets  # macOS
apt-get install git-secrets  # Linux

git secrets --install
git secrets --register-aws
```

### GitHub Secret Scanning
- Automatically enabled for public repos
- Can enable for private repos (GitHub Advanced Security)

### CI/CD Pipeline
```yaml
# .github/workflows/security.yml
- name: Scan for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
```

## 📝 Audit & Compliance

### Access Logs
- Track who accessed secrets in Key Vault
- Monitor unusual access patterns
- Alert on unauthorized access attempts

### Compliance Requirements
- **FedRAMP**: Key Vault with FIPS 140-2 Level 2
- **SOC 2**: Regular secret rotation, access audits
- **HIPAA**: Encryption at rest and in transit

## 🆘 Incident Response

### If Secret is Compromised:

1. **Immediate Actions** (within 1 hour):
   - Revoke compromised secret
   - Generate new secret
   - Update Key Vault
   - Restart affected services
   - Monitor for unauthorized access

2. **Investigation** (within 24 hours):
   - Identify how secret was exposed
   - Review access logs
   - Determine scope of impact
   - Document timeline

3. **Remediation** (within 48 hours):
   - Fix vulnerability
   - Implement additional controls
   - Update security procedures
   - Notify affected parties (if required)

4. **Post-Mortem** (within 1 week):
   - Root cause analysis
   - Lessons learned
   - Process improvements

### Emergency Contacts
- Security Team: security@capitaltechalliance.com
- On-call rotation: Check PagerDuty

## 📚 Additional Resources

- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)
- [CIS Controls: Secret Management](https://www.cisecurity.org/controls/)

## 🔧 Troubleshooting

### "Invalid JWT signature"
- Check JWT_SECRET is correct
- Verify token hasn't expired
- Ensure same secret across all instances

### "Cannot connect to database"
- Verify DATABASE_PASSWORD in Key Vault
- Check network connectivity
- Confirm SSL certificate validity

### "OpenAI API authentication failed"
- Verify OPENAI_API_KEY or AZURE_OPENAI_KEY
- Check API quota and billing
- Confirm endpoint URL is correct

## ✅ Pre-Deployment Checklist

- [ ] All `YOUR_*` placeholders replaced
- [ ] Secrets stored in Key Vault
- [ ] `.env` files NOT in git
- [ ] Database uses SSL/TLS
- [ ] JWT secrets are 512-bit random
- [ ] Encryption keys are 256-bit random
- [ ] CORS limited to production domains
- [ ] Rate limiting enabled
- [ ] Security headers enabled (Helmet)
- [ ] HTTPS enforced
- [ ] Managed Identity configured
- [ ] Monitoring and alerting active
- [ ] Secret rotation schedule documented
- [ ] Incident response plan tested
- [ ] Team trained on secret management

---

**Last Updated**: 2025-11-11
**Next Review**: 2026-02-11
