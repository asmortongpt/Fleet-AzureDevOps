#!/bin/bash

################################################################################
# Agent 1: Security Auditor
# Performs comprehensive security analysis including OWASP Top 10,
# vulnerability scanning, secrets detection, and security best practices
################################################################################

set -e

AGENT_NAME="Security Auditor"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPORT_FILE="$OUTPUT_DIR/01-security-audit-report.json"
REPO_DIR="${REPO_DIR:-/home/azurereviewer/fleet-review}"

mkdir -p "$OUTPUT_DIR"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2; }
log_success() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"; }

log_info "Starting $AGENT_NAME..."
log_info "Repository: $REPO_DIR"
log_info "Output: $REPORT_FILE"

cd "$REPO_DIR"

################################################################################
# Initialize Report Structure
################################################################################

cat > "$REPORT_FILE" <<'REPORT_INIT'
{
  "agent": "Security Auditor",
  "timestamp": "",
  "repository": "",
  "findings": {
    "critical": [],
    "high": [],
    "medium": [],
    "low": [],
    "info": []
  },
  "summary": {
    "totalIssues": 0,
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0,
    "infoCount": 0
  },
  "scans": {
    "npmAudit": {},
    "snyk": {},
    "eslintSecurity": {},
    "secretsDetection": {},
    "dependencyCheck": {},
    "owaspAnalysis": {}
  },
  "remediationTime": "0 hours"
}
REPORT_INIT

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEMP_REPORT=$(mktemp)
jq --arg ts "$TIMESTAMP" --arg repo "$REPO_DIR" \
  '.timestamp = $ts | .repository = $repo' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 1. NPM Audit (Dependency Vulnerabilities)
################################################################################

log_info "Running npm audit..."
NPM_AUDIT_FILE="$OUTPUT_DIR/npm-audit.json"

# Root package
if [ -f "package.json" ]; then
  npm audit --json > "$NPM_AUDIT_FILE" 2>/dev/null || true

  CRITICAL_VULNS=$(jq '.metadata.vulnerabilities.critical // 0' "$NPM_AUDIT_FILE")
  HIGH_VULNS=$(jq '.metadata.vulnerabilities.high // 0' "$NPM_AUDIT_FILE")
  MODERATE_VULNS=$(jq '.metadata.vulnerabilities.moderate // 0' "$NPM_AUDIT_FILE")
  LOW_VULNS=$(jq '.metadata.vulnerabilities.low // 0' "$NPM_AUDIT_FILE")

  log_info "NPM Audit: Critical=$CRITICAL_VULNS, High=$HIGH_VULNS, Moderate=$MODERATE_VULNS, Low=$LOW_VULNS"

  # Add to report
  jq --argjson audit "$(cat $NPM_AUDIT_FILE)" \
    '.scans.npmAudit = $audit' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"

  # Create findings
  if [ "$CRITICAL_VULNS" -gt 0 ]; then
    FINDING="{\"category\":\"dependency-vulnerability\",\"severity\":\"critical\",\"title\":\"Critical NPM vulnerabilities detected\",\"description\":\"Found $CRITICAL_VULNS critical vulnerabilities in npm dependencies\",\"remediation\":\"Run 'npm audit fix --force' or update dependencies manually\",\"effort\":\"2-4 hours\",\"file\":\"package.json\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi

  if [ "$HIGH_VULNS" -gt 0 ]; then
    FINDING="{\"category\":\"dependency-vulnerability\",\"severity\":\"high\",\"title\":\"High severity NPM vulnerabilities\",\"description\":\"Found $HIGH_VULNS high severity vulnerabilities in npm dependencies\",\"remediation\":\"Review npm audit output and update affected packages\",\"effort\":\"4-8 hours\",\"file\":\"package.json\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi
fi

# API package
if [ -f "api/package.json" ]; then
  cd api
  npm audit --json > "$OUTPUT_DIR/npm-audit-api.json" 2>/dev/null || true
  cd ..
fi

log_success "NPM audit complete"

################################################################################
# 2. Snyk Vulnerability Scan
################################################################################

log_info "Running Snyk vulnerability scan..."
SNYK_REPORT="$OUTPUT_DIR/snyk-report.json"

# Authenticate with Snyk (if token provided)
if [ -n "$SNYK_TOKEN" ]; then
  snyk auth "$SNYK_TOKEN" 2>/dev/null || log_info "Snyk auth skipped (no token)"
fi

# Test root project
snyk test --json > "$SNYK_REPORT" 2>/dev/null || true

# Add to main report
if [ -f "$SNYK_REPORT" ]; then
  TEMP_REPORT=$(mktemp)
  jq --argjson snyk "$(cat $SNYK_REPORT)" \
    '.scans.snyk = $snyk' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

log_success "Snyk scan complete"

################################################################################
# 3. ESLint Security Plugin
################################################################################

log_info "Running ESLint security analysis..."
ESLINT_SECURITY_FILE="$OUTPUT_DIR/eslint-security.json"

# Install ESLint security plugin if not present
if [ -f "package.json" ]; then
  npm list eslint-plugin-security >/dev/null 2>&1 || npm install --no-save eslint-plugin-security 2>/dev/null || true
fi

# Run ESLint with security rules
npx eslint . \
  --ext .js,.jsx,.ts,.tsx \
  --format json \
  --plugin security \
  --rule 'security/detect-object-injection: error' \
  --rule 'security/detect-non-literal-regexp: warn' \
  --rule 'security/detect-unsafe-regex: error' \
  --rule 'security/detect-buffer-noassert: error' \
  --rule 'security/detect-child-process: warn' \
  --rule 'security/detect-disable-mustache-escape: error' \
  --rule 'security/detect-eval-with-expression: error' \
  --rule 'security/detect-no-csrf-before-method-override: error' \
  --rule 'security/detect-non-literal-fs-filename: warn' \
  --rule 'security/detect-non-literal-require: error' \
  --rule 'security/detect-possible-timing-attacks: warn' \
  --rule 'security/detect-pseudoRandomBytes: error' \
  > "$ESLINT_SECURITY_FILE" 2>/dev/null || true

# Parse ESLint results
if [ -f "$ESLINT_SECURITY_FILE" ]; then
  SECURITY_ERRORS=$(jq '[.[] | select(.messages[].severity == 2)] | length' "$ESLINT_SECURITY_FILE" 2>/dev/null || echo "0")
  SECURITY_WARNINGS=$(jq '[.[] | select(.messages[].severity == 1)] | length' "$ESLINT_SECURITY_FILE" 2>/dev/null || echo "0")

  log_info "ESLint Security: Errors=$SECURITY_ERRORS, Warnings=$SECURITY_WARNINGS"

  # Add critical security issues
  if [ "$SECURITY_ERRORS" -gt 0 ]; then
    FINDING="{\"category\":\"code-security\",\"severity\":\"high\",\"title\":\"ESLint security violations detected\",\"description\":\"Found $SECURITY_ERRORS security-related code issues\",\"remediation\":\"Review ESLint security report and fix violations (eval, unsafe regex, etc.)\",\"effort\":\"8-16 hours\",\"file\":\"multiple\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi

  TEMP_REPORT=$(mktemp)
  jq --argjson eslint "$(cat $ESLINT_SECURITY_FILE)" \
    '.scans.eslintSecurity = $eslint' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

log_success "ESLint security analysis complete"

################################################################################
# 4. Secrets Detection (GitLeaks)
################################################################################

log_info "Running secrets detection..."
GITLEAKS_REPORT="$OUTPUT_DIR/gitleaks-report.json"

gitleaks detect \
  --source "$REPO_DIR" \
  --report-path "$GITLEAKS_REPORT" \
  --report-format json \
  --verbose \
  --no-git \
  2>/dev/null || true

if [ -f "$GITLEAKS_REPORT" ]; then
  SECRETS_FOUND=$(jq 'length' "$GITLEAKS_REPORT" 2>/dev/null || echo "0")

  if [ "$SECRETS_FOUND" -gt 0 ]; then
    log_info "Found $SECRETS_FOUND potential secrets"

    FINDING="{\"category\":\"secrets-exposure\",\"severity\":\"critical\",\"title\":\"Potential secrets detected in code\",\"description\":\"GitLeaks found $SECRETS_FOUND potential secrets, API keys, or credentials in the codebase\",\"remediation\":\"Move all secrets to environment variables or Azure Key Vault. Rotate exposed credentials immediately.\",\"effort\":\"4-8 hours\",\"file\":\"multiple\",\"codeExample\":\"# Bad:\\nconst apiKey = 'sk-1234567890abcdef'\\n\\n# Good:\\nconst apiKey = process.env.API_KEY\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  else
    log_success "No secrets detected"
  fi

  TEMP_REPORT=$(mktemp)
  jq --argjson gitleaks "$(cat $GITLEAKS_REPORT)" \
    '.scans.secretsDetection = $gitleaks' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

log_success "Secrets detection complete"

################################################################################
# 5. SQL Injection Detection
################################################################################

log_info "Scanning for SQL injection vulnerabilities..."
SQL_INJECTION_FILE="$OUTPUT_DIR/sql-injection.txt"

# Search for potential SQL injection patterns
grep -rn \
  -E "(query|execute).*\+.*\$|query.*\`|execute.*\`|WHERE.*\+.*req\.|SELECT.*\$\{|INSERT.*\$\{" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
  src/ api/ 2>/dev/null > "$SQL_INJECTION_FILE" || true

if [ -s "$SQL_INJECTION_FILE" ]; then
  SQL_ISSUES=$(wc -l < "$SQL_INJECTION_FILE")
  log_info "Found $SQL_ISSUES potential SQL injection patterns"

  FINDING="{\"category\":\"sql-injection\",\"severity\":\"critical\",\"title\":\"Potential SQL injection vulnerabilities\",\"description\":\"Found $SQL_ISSUES locations with potential SQL injection risks (string concatenation in queries)\",\"remediation\":\"Use parameterized queries exclusively. Replace string concatenation with placeholder syntax.\",\"effort\":\"8-12 hours\",\"file\":\"multiple\",\"codeExample\":\"# Bad:\\ndb.query('SELECT * FROM users WHERE id = ' + userId)\\n\\n# Good:\\ndb.query('SELECT * FROM users WHERE id = \\$1', [userId])\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
else
  log_success "No SQL injection patterns detected"
fi

################################################################################
# 6. XSS Vulnerability Detection
################################################################################

log_info "Scanning for XSS vulnerabilities..."
XSS_FILE="$OUTPUT_DIR/xss-patterns.txt"

# Search for dangerous innerHTML, dangerouslySetInnerHTML without sanitization
grep -rn \
  -E "dangerouslySetInnerHTML|innerHTML|outerHTML|document\.write" \
  --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" \
  src/ 2>/dev/null > "$XSS_FILE" || true

if [ -s "$XSS_FILE" ]; then
  XSS_ISSUES=$(wc -l < "$XSS_FILE")
  log_info "Found $XSS_ISSUES potential XSS risks"

  # Check if DOMPurify is used
  if ! grep -q "dompurify" package.json 2>/dev/null; then
    FINDING="{\"category\":\"xss\",\"severity\":\"high\",\"title\":\"Potential XSS vulnerabilities without sanitization\",\"description\":\"Found $XSS_ISSUES uses of dangerouslySetInnerHTML or innerHTML. DOMPurify not detected in dependencies.\",\"remediation\":\"Install and use DOMPurify for all HTML sanitization. Avoid innerHTML when possible.\",\"effort\":\"4-6 hours\",\"file\":\"multiple\",\"codeExample\":\"import DOMPurify from 'dompurify'\\n\\nconst clean = DOMPurify.sanitize(dirtyHTML)\\n<div dangerouslySetInnerHTML={{__html: clean}} />\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi
else
  log_success "No obvious XSS patterns detected"
fi

################################################################################
# 7. Authentication & Authorization Review
################################################################################

log_info "Reviewing authentication implementation..."
AUTH_ISSUES=0

# Check for JWT secret hardcoding
if grep -rq "jwt.*secret.*=.*['\"]" --include="*.ts" --include="*.js" src/ api/ 2>/dev/null; then
  AUTH_ISSUES=$((AUTH_ISSUES + 1))
  FINDING="{\"category\":\"authentication\",\"severity\":\"critical\",\"title\":\"JWT secret hardcoded\",\"description\":\"JWT secret appears to be hardcoded in source code instead of using environment variables\",\"remediation\":\"Move JWT secret to environment variable or Azure Key Vault\",\"effort\":\"1 hour\",\"file\":\"auth files\",\"codeExample\":\"# Bad:\\nconst secret = 'my-secret-key'\\n\\n# Good:\\nconst secret = process.env.JWT_SECRET\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

# Check for weak password validation
if ! grep -rq "bcrypt\|argon2" --include="*.ts" --include="*.js" src/ api/ 2>/dev/null; then
  AUTH_ISSUES=$((AUTH_ISSUES + 1))
  FINDING="{\"category\":\"authentication\",\"severity\":\"high\",\"title\":\"Weak password hashing\",\"description\":\"bcrypt or argon2 not detected. Password hashing may be weak or absent.\",\"remediation\":\"Implement bcrypt with cost factor >= 12 for password hashing\",\"effort\":\"2-3 hours\",\"file\":\"auth module\",\"codeExample\":\"import bcrypt from 'bcrypt'\\n\\nconst saltRounds = 12\\nconst hashedPassword = await bcrypt.hash(password, saltRounds)\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

log_info "Authentication review: $AUTH_ISSUES issues found"

################################################################################
# 8. CORS Configuration Review
################################################################################

log_info "Reviewing CORS configuration..."

# Check for wildcard CORS
if grep -rq "origin.*\*\|Access-Control-Allow-Origin.*\*" --include="*.ts" --include="*.js" api/ 2>/dev/null; then
  FINDING="{\"category\":\"cors\",\"severity\":\"high\",\"title\":\"Insecure CORS configuration\",\"description\":\"CORS configured with wildcard (*) origin, allowing any domain to make requests\",\"remediation\":\"Configure CORS with specific allowed origins from environment variables\",\"effort\":\"1-2 hours\",\"file\":\"api/server config\",\"codeExample\":\"// Good:\\nconst allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []\\napp.use(cors({ origin: allowedOrigins }))\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

################################################################################
# 9. Security Headers Check
################################################################################

log_info "Checking security headers..."

# Check for Helmet.js usage
if [ -f "api/package.json" ] && ! grep -q "helmet" api/package.json 2>/dev/null; then
  FINDING="{\"category\":\"security-headers\",\"severity\":\"medium\",\"title\":\"Missing security headers middleware\",\"description\":\"Helmet.js not detected. Application may be missing critical security headers (CSP, HSTS, etc.)\",\"remediation\":\"Install and configure Helmet.js for Express/Node.js API\",\"effort\":\"2 hours\",\"file\":\"api/package.json\",\"codeExample\":\"import helmet from 'helmet'\\n\\napp.use(helmet({\\n  contentSecurityPolicy: { directives: { defaultSrc: [\\\"'self'\\\"] } },\\n  hsts: { maxAge: 31536000, includeSubDomains: true }\\n}))\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.medium += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

################################################################################
# 10. OWASP Top 10 Summary
################################################################################

log_info "Generating OWASP Top 10 analysis..."

OWASP_ANALYSIS="{
  \"A01_BrokenAccessControl\": \"Review required - check RBAC implementation\",
  \"A02_CryptographicFailures\": \"Secrets detection performed - issues flagged if found\",
  \"A03_Injection\": \"SQL injection patterns scanned\",
  \"A04_InsecureDesign\": \"Architecture review required\",
  \"A05_SecurityMisconfiguration\": \"Security headers and CORS checked\",
  \"A06_VulnerableComponents\": \"npm audit and Snyk performed\",
  \"A07_AuthenticationFailures\": \"JWT and password hashing checked\",
  \"A08_DataIntegrity\": \"Manual review required\",
  \"A09_SecurityLogging\": \"Manual review required\",
  \"A10_SSRF\": \"Manual review required\"
}"

TEMP_REPORT=$(mktemp)
jq --argjson owasp "$OWASP_ANALYSIS" \
  '.scans.owaspAnalysis = $owasp' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 11. Calculate Summary and Remediation Time
################################################################################

log_info "Calculating summary statistics..."

TEMP_REPORT=$(mktemp)
jq '
  .summary.criticalCount = (.findings.critical | length) |
  .summary.highCount = (.findings.high | length) |
  .summary.mediumCount = (.findings.medium | length) |
  .summary.lowCount = (.findings.low | length) |
  .summary.infoCount = (.findings.info | length) |
  .summary.totalIssues = (.summary.criticalCount + .summary.highCount + .summary.mediumCount + .summary.lowCount + .summary.infoCount)
' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

# Calculate total remediation time
TOTAL_EFFORT=0
for severity in critical high medium low; do
  EFFORT=$(jq -r ".findings.$severity[].effort // \"0 hours\"" "$REPORT_FILE" | \
    sed 's/[^0-9]*//g' | \
    awk '{sum+=$1} END {print sum}')
  TOTAL_EFFORT=$((TOTAL_EFFORT + EFFORT))
done

TEMP_REPORT=$(mktemp)
jq --arg time "$TOTAL_EFFORT hours" \
  '.remediationTime = $time' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 12. Generate Summary
################################################################################

CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
HIGH=$(jq '.summary.highCount' "$REPORT_FILE")
MEDIUM=$(jq '.summary.mediumCount' "$REPORT_FILE")
LOW=$(jq '.summary.lowCount' "$REPORT_FILE")
TOTAL=$(jq '.summary.totalIssues' "$REPORT_FILE")

log_success "Security audit complete!"
echo "----------------------------------------"
echo "Security Audit Summary:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low: $LOW"
echo "  Total Issues: $TOTAL"
echo "  Estimated Remediation: $TOTAL_EFFORT hours"
echo "----------------------------------------"
echo "Report saved to: $REPORT_FILE"

exit 0
