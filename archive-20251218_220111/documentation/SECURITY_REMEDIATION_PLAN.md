# Fleet Application - Security Remediation Plan

**Date:** 2025-12-04
**Status:** 🚨 CRITICAL - Production Deployment Blocked
**Review Source:** Enterprise-Grade Architecture & Cybersecurity Review

---

## Executive Summary

**VERDICT: NO-GO FOR PRODUCTION**

The security review has identified **critical vulnerabilities** that make this application unsuitable for Fortune-50 deployment. The system requires immediate remediation of P0 issues before any production use.

### Critical Risk Areas
1. **Authentication Bypass** - Development backdoor credentials may exist
2. **Secrets Management** - Hardcoded defaults and environment fallbacks
3. **SQL Injection** - Raw queries without proper parameterization
4. **Missing CSRF Protection** - State-changing operations unprotected
5. **Incomplete RBAC** - Authorization not enforced on routes
6. **Dangerous Scripts** - Auto-commit scripts that bypass review

---

## P0 (Critical) - Must Fix Before ANY Deployment

### 1. Remove Development Backdoor Login

**Risk:** Trivial admin access if NODE_ENV misconfigured
**Location:** `api/src/routes/auth.ts` (lines 110-139 per review)
**Impact:** Full system compromise

**Actions:**
```bash
# Audit all authentication files
grep -r "NODE_ENV.*development" api/src --include="*.ts" -B 3 -A 10

# Search for hardcoded credentials
grep -r "demo\|test\|admin@" api/src --include="*.ts" | grep -i "password\|login"

# Remove ALL development bypasses
# Enforce NODE_ENV validation at startup
# Add integration tests to verify no backdoors exist
```

**Code Fix Required:**
```typescript
// REMOVE THIS PATTERN EVERYWHERE:
if (process.env.NODE_ENV === 'development' && email === 'admin@fleet.local') {
  // Backdoor logic
}

// ENFORCE THIS INSTEAD:
if (process.env.NODE_ENV !== 'production') {
  throw new Error('Server must run in production mode');
}
```

### 2. Eliminate Hardcoded Secrets

**Risk:** Credential compromise, Key Vault bypass
**Locations:**
- `.env.local.example`
- `api/src/routes/auth.ts` (fallback Azure AD config)
- Any default JWT_SECRET values

**Actions:**
```bash
# Audit for hardcoded secrets
grep -r "clientId\|tenantId\|JWT_SECRET" api/src --include="*.ts" | grep -i "default\|fallback\|''"

# Search for API keys with defaults
grep -r "OPENAI_KEY\|AZURE.*KEY" api/src --include="*.ts"

# Check .env files
find . -name ".env*" -type f | xargs cat | grep -v "^#"
```

**Required Changes:**
- Remove ALL default secret values
- Fail fast if Key Vault secrets missing
- Use Azure Managed Identity for AKS
- Never log secrets (audit console.log statements)

### 3. Delete Dangerous Auto-Commit Scripts

**Risk:** Code injection, secret leaks, bypass peer review
**Files Found:**
```
./AZURE_VM_COMPLETE_PRODUCTION.sh
./final-quote-fix.sh
./fix-template-literals.sh
./fix-all-quotes.sh
./bulk-fix-remaining.sh
./fix-all-sql-syntax.sh
./complete-tier5-migration.sh
```

**Actions:**
```bash
# IMMEDIATE: Delete these files
rm -f ./AZURE_VM_COMPLETE_PRODUCTION.sh
rm -f ./*fix*.sh
rm -f ./complete-*.sh
rm -f ./bulk-*.sh

# Add to .gitignore
echo "*fix*.sh" >> .gitignore
echo "complete-*.sh" >> .gitignore

# Commit deletion
git add -A
git commit -m "security: Remove dangerous auto-commit scripts

- Deleted scripts that write code and auto-commit
- These bypass code review and can inject malicious code
- All changes must go through PR process

SECURITY REMEDIATION"
```

### 4. Implement Global CSRF Protection

**Risk:** Cross-site request forgery on state-changing operations
**Current State:** `csurf` imported but NOT used in server.ts

**Actions:**
```typescript
// In api/src/server.ts - ADD AFTER OTHER MIDDLEWARE:
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to ALL state-changing routes
app.use('/api/*', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Provide token endpoint (ALREADY ADDED - commit ee88580f1)
app.get('/api/csrf-token', csrfProtection, getCsrfToken);
```

### 5. Enforce RBAC on All Routes

**Risk:** Privilege escalation, unauthorized access
**Current State:** RBAC guide exists but not implemented

**Actions:**
```typescript
// Create centralized auth middleware
// File: api/src/middleware/rbac.ts

export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: req.user.role
      });
    }

    next();
  };
}

export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.tenant_id) {
    return res.status(403).json({ error: 'Tenant isolation required' });
  }
  next();
}

// APPLY TO EVERY ROUTE:
router.get('/api/vehicles',
  authenticateJWT,           // ✅ Already exists
  requireRole('admin', 'manager', 'viewer'),  // ⚠️ ADD THIS
  requireTenant,             // ⚠️ ADD THIS
  async (req, res) => {
    // Enforce tenant_id in queries
    const vehicles = await db.query(
      'SELECT * FROM vehicles WHERE tenant_id = $1',
      [req.user.tenant_id]
    );
    res.json(vehicles);
  }
);
```

### 6. Audit and Fix SQL Injection Risks

**Risk:** Database compromise, data exfiltration
**Pattern:** Raw SQL with string concatenation

**Actions:**
```bash
# Find all SQL queries
grep -r "pool.query\|db.query" api/src --include="*.ts" -B 2 -A 5

# Look for string concatenation in SQL
grep -r "SELECT.*\${" api/src --include="*.ts"
grep -r "WHERE.*+" api/src --include="*.ts"
```

**Required Pattern:**
```typescript
// ❌ NEVER DO THIS:
const query = `SELECT * FROM users WHERE email = '${email}'`;
await pool.query(query);

// ✅ ALWAYS DO THIS:
const query = 'SELECT * FROM users WHERE email = $1';
await pool.query(query, [email]);

// ✅ OR USE ORM:
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

### 7. Complete Production Dockerfiles

**Risk:** Insecure containers, dev dependencies in production
**Issue:** API Dockerfile may be incomplete

**Required Dockerfile Structure:**
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
```

### 8. Replace Placeholder Routes

**Risk:** Unknown behaviors, hidden vulnerabilities
**Pattern:** Routes returning static JSON

**Actions:**
```bash
# Find stub routes
grep -r "res.json(\[{" api/src/routes --include="*.ts" -l

# Find TODO comments
grep -r "TODO" api/src/routes --include="*.ts"
```

**Required:**
- Implement real controllers for each route
- Connect to database with proper queries
- Apply validation middleware
- Add error handling
- Write integration tests

---

## P1 (High Priority) - Before Production

### 9. Store JWT in HTTP-Only Cookies

**Current:** JWT in JSON response → stored in localStorage (XSS risk)
**Fix:** Use secure, HTTP-only cookies with SameSite=Strict

### 10. Implement API Versioning

**Current:** No versioning (/api/vehicles)
**Fix:** Use /api/v1/vehicles for all endpoints

### 11. Migrate to ORM

**Tool:** Use Drizzle (already imported)
**Benefit:** Eliminates SQL injection, improves maintainability

### 12. Add Input Validation

**Tool:** Use zod schemas for all request bodies
**Apply:** To every POST/PUT/PATCH endpoint

### 13. Configure Proper Logging

**Remove:** All console.log statements
**Use:** Winston with structured JSON logging
**Redact:** Secrets, tokens, PII from logs

---

## P2 (Medium Priority) - Enterprise Readiness

### 14. Decompose Monolith

Break api/src/server.ts (70+ routes) into microservices:
- Authentication service
- Fleet management service
- Finance service
- AI/Analytics service
- Document service

### 15. Implement CI/CD Security Gates

```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Dependency Audit
        run: npm audit --audit-level=high

      - name: Secret Scanning
        uses: trufflesecurity/trufflehog@main

      - name: SAST
        uses: github/codeql-action/analyze@v3

      - name: Container Scanning
        uses: aquasecurity/trivy-action@master

      - name: IaC Scanning
        run: |
          terraform fmt -check
          tfsec terraform/
```

### 16. Multi-Region Deployment

Deploy AKS clusters in 2+ regions with Traffic Manager for HA

### 17. Compliance Documentation

- Data flow diagrams
- Privacy impact assessment
- Security controls matrix (NIST, CIS)
- Vendor risk assessments

---

## Immediate Actions (Today)

```bash
# 1. Stop all production deployments
kubectl scale deployment fleet-api --replicas=0 -n fleet-management

# 2. Create security branch
git checkout -b security/critical-fixes

# 3. Delete dangerous scripts
rm -f *fix*.sh *complete*.sh

# 4. Audit for backdoors
grep -r "development" api/src/routes/auth* --include="*.ts"

# 5. Check for hardcoded secrets
grep -r "clientId\|JWT_SECRET\|password.*=" api/src --include="*.ts" | grep -v "bcrypt"

# 6. Create security issue tracking
# Document each P0 item as GitHub issue with security label
```

---

## Verification Checklist

Before considering production deployment:

- [ ] All P0 items resolved and verified
- [ ] Penetration test completed by third party
- [ ] Code review by security team
- [ ] Dependency scan shows no critical vulns
- [ ] Container images scanned and signed
- [ ] Secrets stored only in Key Vault
- [ ] RBAC enforced on 100% of routes
- [ ] SQL injection testing passed
- [ ] CSRF protection verified
- [ ] Authentication tested with threat scenarios
- [ ] Logging audit completed (no secrets logged)
- [ ] Compliance documentation complete
- [ ] Disaster recovery tested
- [ ] On-call runbooks created
- [ ] Security training for all developers

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated:** 2025-12-04
**Status:** Security remediation in progress
**Next Review:** After P0 items completed

**PRODUCTION DEPLOYMENT BLOCKED UNTIL ALL P0 ITEMS RESOLVED**
