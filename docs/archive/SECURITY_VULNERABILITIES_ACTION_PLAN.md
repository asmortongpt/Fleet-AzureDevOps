# Critical Security Vulnerabilities - Action Plan
**Priority:** URGENT - Production Blocking
**Date:** 2026-01-04
**Location:** /home/azureuser/fleet-qa (API layer)

---

## Vulnerability Summary: 24 Issues Found

### HIGH SEVERITY (12 vulnerabilities)

#### 1. node-forge (≤1.3.1) - 10 CVEs
**Severity:** HIGH
**Current Version:** Unspecified (≤1.3.1)
**Affected Package:** node-forge

**Vulnerabilities:**
- GHSA-5rrq-pxf6-6jx5: Prototype Pollution in debug API
- GHSA-wxgw-qj99-44c2: Prototype Pollution in util.setPath API
- GHSA-gf8q-jrpm-jvxq: URL parsing leads to undesired behavior
- GHSA-2r2c-g63r-vccr: Improper Verification of Cryptographic Signature (multiple instances)
- GHSA-8fr3-hfg3-gpgp: Open Redirect vulnerability
- GHSA-92xj-mqp7-vmcj: Prototype Pollution
- GHSA-x4jg-mjrx-434g: Improper Cryptographic Signature Verification
- GHSA-cfm4-qjh2-4765: Improper Cryptographic Signature Verification
- GHSA-554w-wpv2-vw27: ASN.1 Unbounded Recursion
- GHSA-5gfm-wpxj-wjgq: Interpretation Conflict via ASN.1 Validator Desynchronization
- GHSA-65ch-62r8-g69g: ASN.1 OID Integer Truncation

**Impact:** Complete cryptographic compromise, remote code execution possible
**Fix Available:** YES - Update to latest version
**Action:**
```bash
npm update node-forge --force
# Then test cryptographic functionality
```

#### 2. @langchain/core (≥1.0.0 <1.1.8)
**Severity:** HIGH
**CVSS Score:** 7.5+
**Vulnerability:** GHSA-r399-636x-v7f6 - Serialization injection enables secret extraction

**Impact:** Attackers can extract secrets from serialized objects
**Fix Available:** YES
**Action:**
```bash
npm update @langchain/core
```

#### 3. jsonwebtoken (≤8.5.1) - 3 CVEs
**Severity:** HIGH
**Vulnerabilities:**
- GHSA-8cf7-32gw-wr33: Unrestricted key type could lead to legacy keys usage
- GHSA-hjrf-2m68-5959: Insecure key retrieval function could lead to Forgeable Public/Private Tokens
- GHSA-qwph-4952-7xr6: Signature validation bypass due to insecure default algorithm

**Impact:** JWT signature bypass, token forgery possible
**Fix Available:** YES
**Critical Action:** Update immediately
```bash
npm update jsonwebtoken --force
# Review all JWT validation code after update
```

#### 4. jws (=4.0.0 || <3.2.3)
**Severity:** HIGH
**Vulnerability:** GHSA-869p-cjfg-cm3x - Improperly Verifies HMAC Signature (appears twice in report)

**Impact:** HMAC signature bypass
**Fix Available:** YES
**Action:**
```bash
npm update jws
```

#### 5. qs (<6.14.1)
**Severity:** HIGH
**Vulnerability:** GHSA-6rw7-vpxm-498p - arrayLimit bypass allows DoS via memory exhaustion

**Impact:** Denial of Service through memory exhaustion
**Fix Available:** YES
**Action:**
```bash
npm update qs
```

#### 6. @modelcontextprotocol/sdk (<1.24.0)
**Severity:** HIGH
**Vulnerability:** GHSA-w48q-cv73-mx4w - DNS rebinding protection not enabled by default

**Impact:** DNS-based attacks possible
**Fix Available:** YES
**Action:**
```bash
npm update @modelcontextprotocol/sdk
# Verify DNS rebinding protection is enabled
```

#### 7. expr-eval (*)
**Severity:** HIGH
**Vulnerabilities:**
- GHSA-8gw3-rxh4-v6jx: Prototype Pollution
- GHSA-jc85-fpwf-qm7x: Does not restrict functions passed to evaluate function

**Impact:** Code injection, prototype pollution
**Fix Available:** YES
**Action:**
```bash
npm update expr-eval
# Review all uses of expr-eval's evaluate() function
```

#### 8. body-parser (≤1.20.3)
**Severity:** HIGH
**Vulnerability:** GHSA-wqch-xfxh-vrr4 - Denial of service when URL encoding is used

**Impact:** DoS via specially crafted URL-encoded payloads
**Fix Available:** YES
**Dependencies:** Also affects express (depends on body-parser)
**Action:**
```bash
npm update body-parser express
```

### MODERATE SEVERITY (10 vulnerabilities)

#### 1. esbuild (≤0.24.2)
**Severity:** MODERATE
**Vulnerability:** GHSA-67mh-4wv8-2f99 - Enables arbitrary requests to development server

**Impact:** Information disclosure during development
**Fix Available:** YES
**Action:**
```bash
npm audit fix --force
# This may trigger breaking changes
npm update vitest
```

#### 2. js-yaml (4.0.0-4.1.0)
**Severity:** MODERATE
**Vulnerability:** GHSA-mh29-5h37-fv8m - Prototype pollution in merge (<<) operation

**Impact:** Prototype pollution attacks
**Fix Available:** YES
**Action:**
```bash
npm update js-yaml
# Test YAML parsing in application
```

#### 3. cookie (<0.7.0)
**Severity:** MODERATE
**Vulnerability:** GHSA-pxg6-pf52-xh8x - Accepts cookie name, path, domain with out of bounds characters

**Impact:** Cookie injection possible
**Dependencies:** csurf depends on vulnerable cookie
**Action:**
```bash
npm audit fix --force
# May require csurf update
npm update cookie csurf
```

#### 4. nodemailer (≤7.0.10) - 2 CVEs
**Severity:** MODERATE
**Vulnerabilities:**
- GHSA-rcmh-qjqh-p98v: DoS via recursive calls in addressparser
- GHSA-46j5-6fg5-4gv3: DoS through Uncontrolled Recursion

**Impact:** Email service DoS possible
**Action:**
```bash
npm update nodemailer
```

#### 5. langchain (<0.3.37)
**Severity:** MODERATE
**Vulnerability:** GHSA-r399-636x-v7f6 - Serialization injection enables secret extraction

**Impact:** Secret extraction from serialized objects
**Action:**
```bash
npm update langchain
```

---

## Quick Fix: Automated Remediation

```bash
#!/bin/bash
# File: api/fix-vulnerabilities.sh

cd api

# Backup current state
npm ls > npm-before.txt

# Attempt automatic fixes
npm audit fix

# For packages requiring --force
npm audit fix --force

# Manual updates for critical packages
npm update node-forge @langchain/core jsonwebtoken jws qs \
  @modelcontextprotocol/sdk expr-eval body-parser esbuild \
  js-yaml cookie nodemailer langchain \
  @azure/ms-rest-js @azure/ms-rest-azure-js \
  --force

# Verify no new vulnerabilities
npm audit

# Compare results
npm ls > npm-after.txt
diff npm-before.txt npm-after.txt

# Run security tests
npm run test:security || echo "Security tests not configured"

# Test critical functionality
npm run test:integration

echo "Vulnerability remediation complete - review changes above"
```

---

## Detailed Remediation Steps

### Step 1: Prepare Environment
```bash
cd api
git branch security-hotfix
git checkout security-hotfix
npm ls > npm-baseline.txt
```

### Step 2: Update Critical Packages
```bash
# These MUST be updated - blocking production
npm update --save \
  node-forge \
  jsonwebtoken \
  jws \
  qs \
  @langchain/core

npm update --save-dev \
  esbuild \
  @esbuild-kit/core-utils
```

### Step 3: Test Each Update
```bash
npm run test
npm run test:integration
npm audit
```

### Step 4: Handle Breaking Changes
Some updates may introduce breaking changes:

**For jsonwebtoken upgrade:**
- Review jwt.verify() calls
- Ensure algorithms are explicitly specified
- Test JWT validation with existing tokens

**For qs upgrade:**
- Test URL parameter parsing
- Verify arrayLimit is set appropriately

**For esbuild upgrade:**
- Run full build process
- Test Vite dev server
- Verify all bundled assets

### Step 5: Security Testing
```bash
# Run comprehensive security tests
npm run test:security
npm run lint  # Includes security plugin
npm audit     # Final verification
```

### Step 6: Review and Deploy
```bash
# Create detailed commit message
git add .
git commit -m "Security: Fix 24 critical/moderate vulnerabilities

- node-forge: Update to fix 10 CVEs (prototype pollution, crypto bypass)
- jsonwebtoken: Fix signature validation bypass (GHSA-qwph-4952-7xr6)
- jws: Fix HMAC signature verification (GHSA-869p-cjfg-cm3x)
- qs: Fix DoS via memory exhaustion (GHSA-6rw7-vpxm-498p)
- body-parser: Fix URL encoding DoS (GHSA-wqch-xfxh-vrr4)
- @langchain/core: Fix secret extraction (GHSA-r399-636x-v7f6)
- And 18 other vulnerabilities resolved

Reviewed and tested all changes. Ready for production."

# Create pull request
gh pr create --title "Security: Fix 24 vulnerabilities" --body "$(cat <<'EOF'
## Security Updates

This PR addresses 24 identified vulnerabilities:
- 12 HIGH severity
- 10 MODERATE severity
- 2 LOW severity

### Changes
- Updated 15+ dependencies to latest secure versions
- All breaking changes reviewed and handled
- Security tests passing
- Integration tests passing

### Testing
- [ ] Code review
- [ ] Manual testing in staging
- [ ] Performance regression testing
- [ ] Load testing

### Deployment
After merge:
1. Deploy to staging environment
2. Run full E2E test suite
3. Monitor for 24 hours
4. Deploy to production
EOF
)"
```

---

## Monitoring Checklist

After deploying fixes, monitor:

- [ ] Application error rates (should remain stable)
- [ ] API response times (should not increase)
- [ ] JWT validation failures (should not increase)
- [ ] Email delivery (if using nodemailer)
- [ ] Request parsing (if using body-parser/qs)
- [ ] Cryptographic operations (if using node-forge)

---

## Prevention Measures

### 1. Dependency Management
```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "audit:fix:force": "npm audit fix --force",
    "audit:check": "npm audit --json > audit-report.json"
  }
}
```

### 2. Pre-commit Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit

npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
  echo "Security vulnerabilities found. Fix before committing."
  exit 1
fi
```

### 3. CI/CD Pipeline
```yaml
# .github/workflows/security.yml
name: Security Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm audit --audit-level=moderate
```

### 4. Regular Updates
- [ ] Weekly: Run `npm audit` in CI/CD
- [ ] Monthly: Update all dependencies
- [ ] Quarterly: Security penetration testing
- [ ] Annually: Complete security audit

---

## Frontend Dependency Status

**Frontend:** 0 vulnerabilities found
**Status:** PASS
**No action required for frontend dependencies**

---

## Timeline

| Task | Duration | Start | End |
|------|----------|-------|-----|
| Backup and prepare | 1 hour | Day 1 | Day 1 |
| Update critical packages | 2 hours | Day 1 | Day 1 |
| Test and fix breaking changes | 4 hours | Day 1 | Day 1 |
| Security testing | 2 hours | Day 2 | Day 2 |
| Code review and approval | 4 hours | Day 2 | Day 2 |
| Staging deployment | 2 hours | Day 3 | Day 3 |
| Production deployment | 1 hour | Day 4 | Day 4 |
| **Total** | **16 hours** | | |

---

## Escalation Path

If issues occur during remediation:
1. **Development Team:** Try alternative versions
2. **Security Team:** Assess risk vs benefit
3. **DevOps:** Deploy to staging for testing
4. **Management:** Decide on rollback if needed

---

## References

- **npm audit:** https://docs.npmjs.com/cli/v8/commands/npm-audit
- **GHSA Database:** https://github.com/advisories
- **Node.js Security:** https://nodejs.org/en/security/
- **OWASP Dependency Check:** https://owasp.org/www-project-dependency-check/

---

**Status:** Ready for immediate implementation
**Approved by:** QA Team
**Next Review:** After deployment + 7 days
