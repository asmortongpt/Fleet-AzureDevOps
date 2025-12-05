#!/bin/bash

################################################################################
# Agent 5: Compliance Checker
# Validates WCAG accessibility, GDPR/privacy compliance, and API standards
################################################################################

set -e

AGENT_NAME="Compliance Checker"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPORT_FILE="$OUTPUT_DIR/05-compliance-report.json"
REPO_DIR="${REPO_DIR:-/home/azurereviewer/fleet-review}"

mkdir -p "$OUTPUT_DIR"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2; }
log_success() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"; }

log_info "Starting $AGENT_NAME..."
cd "$REPO_DIR"

################################################################################
# Initialize Report
################################################################################

cat > "$REPORT_FILE" <<'INIT'
{
  "agent": "Compliance Checker",
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
  "compliance": {
    "wcag": {},
    "gdpr": {},
    "apiStandards": {},
    "fedramp": {}
  },
  "remediationTime": "0 hours"
}
INIT

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$TIMESTAMP" --arg repo "$REPO_DIR" \
  '.timestamp = $ts | .repository = $repo' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 1. WCAG Accessibility Audit (Pa11y)
################################################################################

if [ -n "$APP_URL" ]; then
  log_info "Running pa11y accessibility audit on $APP_URL..."
  PA11Y_FILE="$OUTPUT_DIR/pa11y-report.json"

  pa11y "$APP_URL" \
    --runner axe \
    --standard WCAG2AA \
    --reporter json \
    > "$PA11Y_FILE" 2>/dev/null || log_error "Pa11y failed"

  if [ -f "$PA11Y_FILE" ]; then
    A11Y_ERRORS=$(jq '[.issues[] | select(.type == "error")] | length' "$PA11Y_FILE" 2>/dev/null || echo "0")
    A11Y_WARNINGS=$(jq '[.issues[] | select(.type == "warning")] | length' "$PA11Y_FILE" 2>/dev/null || echo "0")
    A11Y_NOTICES=$(jq '[.issues[] | select(.type == "notice")] | length' "$PA11Y_FILE" 2>/dev/null || echo "0")

    log_info "Accessibility: $A11Y_ERRORS errors, $A11Y_WARNINGS warnings, $A11Y_NOTICES notices"

    if [ "$A11Y_ERRORS" -gt 0 ]; then
      FINDING="{\"category\":\"accessibility\",\"severity\":\"high\",\"title\":\"WCAG 2.0 AA violations\",\"description\":\"Found $A11Y_ERRORS WCAG accessibility errors\",\"remediation\":\"Fix accessibility violations: missing alt text, insufficient color contrast, missing ARIA labels, keyboard navigation issues.\",\"effort\":\"12-20 hours\",\"file\":\"src/components\",\"codeExample\":\"<!-- Add alt text to images -->\\n<img src='vehicle.jpg' alt='Ford F-150 pickup truck' />\\n\\n<!-- Add ARIA labels to interactive elements -->\\n<button aria-label='Delete vehicle' onClick={handleDelete}>\\n  <TrashIcon />\\n</button>\\n\\n<!-- Ensure sufficient color contrast (4.5:1 for normal text) -->\\n<span className='text-gray-900 bg-white'>...</span>\"}"
      jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
    fi

    WCAG_SUMMARY="{\"errors\":$A11Y_ERRORS,\"warnings\":$A11Y_WARNINGS,\"notices\":$A11Y_NOTICES}"
    jq --argjson wcag "$WCAG_SUMMARY" \
      '.compliance.wcag = $wcag' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
else
  log_info "Skipping pa11y audit (no APP_URL provided)"
fi

################################################################################
# 2. Static Accessibility Checks
################################################################################

log_info "Performing static accessibility checks..."

A11Y_ISSUES=0

# Check for missing alt attributes
MISSING_ALT=$(grep -rc "<img" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | \
  awk -F: '{sum+=$2} END {print sum}')
HAS_ALT=$(grep -rc "alt=" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | \
  awk -F: '{sum+=$2} END {print sum}')

if [ "$MISSING_ALT" -gt "$HAS_ALT" ]; then
  A11Y_ISSUES=$((A11Y_ISSUES + 1))

  FINDING="{\"category\":\"accessibility\",\"severity\":\"high\",\"title\":\"Images missing alt text\",\"description\":\"Many <img> tags lack alt attributes\",\"remediation\":\"Add descriptive alt text to all images. Use empty alt=\\\"\\\" for decorative images.\",\"effort\":\"4-6 hours\",\"file\":\"src/components\",\"codeExample\":\"<!-- Meaningful images -->\\n<img src='vehicle.jpg' alt='Red 2023 Toyota Camry' />\\n\\n<!-- Decorative images -->\\n<img src='decoration.svg' alt='' role='presentation' />\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for missing ARIA labels on buttons
BUTTONS_WITHOUT_TEXT=$(grep -r "<button" --include="*.tsx" src/ | grep -v "aria-label\|children\|>" | wc -l)

if [ "$BUTTONS_WITHOUT_TEXT" -gt 5 ]; then
  A11Y_ISSUES=$((A11Y_ISSUES + 1))

  FINDING="{\"category\":\"accessibility\",\"severity\":\"medium\",\"title\":\"Icon buttons missing labels\",\"description\":\"Found icon-only buttons without aria-label\",\"remediation\":\"Add aria-label to all icon-only buttons\",\"effort\":\"2-4 hours\",\"file\":\"src/components\",\"codeExample\":\"<button aria-label='Close dialog' onClick={onClose}>\\n  <XIcon />\\n</button>\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for form labels
INPUTS_WITHOUT_LABELS=$(grep -r "<input" --include="*.tsx" src/ | grep -v "aria-label\|<label" | wc -l)

if [ "$INPUTS_WITHOUT_LABELS" -gt 5 ]; then
  A11Y_ISSUES=$((A11Y_ISSUES + 1))

  FINDING="{\"category\":\"accessibility\",\"severity\":\"high\",\"title\":\"Form inputs missing labels\",\"description\":\"Form inputs lack associated labels\",\"remediation\":\"Associate labels with inputs using htmlFor/id or wrap inputs in labels\",\"effort\":\"4-6 hours\",\"file\":\"src/components/forms\",\"codeExample\":\"<!-- Method 1: htmlFor -->\\n<label htmlFor='vehicle-vin'>VIN</label>\\n<input id='vehicle-vin' name='vin' />\\n\\n<!-- Method 2: Wrapped -->\\n<label>\\n  VIN\\n  <input name='vin' />\\n</label>\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for keyboard navigation support
if ! grep -rq "onKeyDown\|onKeyPress\|tabIndex" --include="*.tsx" src/ 2>/dev/null; then
  A11Y_ISSUES=$((A11Y_ISSUES + 1))

  FINDING="{\"category\":\"accessibility\",\"severity\":\"medium\",\"title\":\"Limited keyboard navigation\",\"description\":\"Few keyboard event handlers detected. Application may not be keyboard-accessible.\",\"remediation\":\"Ensure all interactive elements are keyboard accessible. Add keyboard event handlers for custom controls.\",\"effort\":\"8-12 hours\",\"file\":\"src/components\",\"codeExample\":\"<div\\n  role='button'\\n  tabIndex={0}\\n  onClick={handleClick}\\n  onKeyDown={(e) => {\\n    if (e.key === 'Enter' || e.key === ' ') {\\n      handleClick()\\n    }\\n  }}\\n>\\n  Click me\\n</div>\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "Static accessibility issues: $A11Y_ISSUES"

################################################################################
# 3. GDPR / Privacy Compliance
################################################################################

log_info "Checking GDPR/Privacy compliance..."

PRIVACY_ISSUES=0

# Check for privacy policy
if ! [ -f "public/privacy-policy.html" ] && ! grep -rq "privacy.*policy\|Privacy Policy" --include="*.tsx" src/ 2>/dev/null; then
  PRIVACY_ISSUES=$((PRIVACY_ISSUES + 1))

  FINDING="{\"category\":\"gdpr\",\"severity\":\"high\",\"title\":\"Missing privacy policy\",\"description\":\"No privacy policy found\",\"remediation\":\"Create and link to privacy policy explaining data collection, usage, and user rights\",\"effort\":\"8-12 hours (legal review required)\",\"file\":\"public/privacy-policy.html\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for cookie consent
if ! grep -rq "cookie.*consent\|CookieConsent\|acceptCookies" --include="*.tsx" --include="*.ts" src/ 2>/dev/null; then
  PRIVACY_ISSUES=$((PRIVACY_ISSUES + 1))

  FINDING="{\"category\":\"gdpr\",\"severity\":\"high\",\"title\":\"Missing cookie consent\",\"description\":\"No cookie consent mechanism detected (required by GDPR)\",\"remediation\":\"Implement cookie consent banner before setting non-essential cookies\",\"effort\":\"4-6 hours\",\"file\":\"src/components/CookieConsent.tsx\",\"codeExample\":\"import { useState, useEffect } from 'react'\\n\\nexport function CookieConsent() {\\n  const [show, setShow] = useState(false)\\n  \\n  useEffect(() => {\\n    const consent = localStorage.getItem('cookieConsent')\\n    if (!consent) setShow(true)\\n  }, [])\\n  \\n  const accept = () => {\\n    localStorage.setItem('cookieConsent', 'true')\\n    setShow(false)\\n    // Initialize analytics\\n  }\\n  \\n  if (!show) return null\\n  \\n  return (\\n    <div className='cookie-banner'>\\n      <p>We use cookies to improve your experience...</p>\\n      <button onClick={accept}>Accept</button>\\n      <button onClick={() => setShow(false)}>Decline</button>\\n    </div>\\n  )\\n}\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for data export capability (GDPR Article 20)
if ! grep -rq "export.*data\|download.*data\|data.*portability" --include="*.ts" --include="*.tsx" api/ src/ 2>/dev/null; then
  PRIVACY_ISSUES=$((PRIVACY_ISSUES + 1))

  FINDING="{\"category\":\"gdpr\",\"severity\":\"medium\",\"title\":\"Missing data export capability\",\"description\":\"No user data export/download feature found (GDPR right to data portability)\",\"remediation\":\"Implement feature allowing users to export their data in machine-readable format (JSON, CSV)\",\"effort\":\"8-12 hours\",\"file\":\"api/routes/user-data.ts\",\"codeExample\":\"// API endpoint for data export\\napp.get('/api/user/export', authenticate, async (req, res) => {\\n  const userId = req.user.id\\n  const userData = await gatherAllUserData(userId)\\n  \\n  res.setHeader('Content-Type', 'application/json')\\n  res.setHeader('Content-Disposition', 'attachment; filename=user-data.json')\\n  res.json(userData)\\n})\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for account deletion (GDPR Article 17)
if ! grep -rq "delete.*account\|remove.*account\|right.*to.*be.*forgotten" --include="*.ts" api/ 2>/dev/null; then
  PRIVACY_ISSUES=$((PRIVACY_ISSUES + 1))

  FINDING="{\"category\":\"gdpr\",\"severity\":\"medium\",\"title\":\"Missing account deletion feature\",\"description\":\"No account deletion feature found (GDPR right to erasure)\",\"remediation\":\"Implement account deletion with data anonymization or purging\",\"effort\":\"12-16 hours\",\"file\":\"api/routes/user.ts\",\"codeExample\":\"// Delete account endpoint\\napp.delete('/api/user/account', authenticate, async (req, res) => {\\n  const userId = req.user.id\\n  \\n  // Anonymize user data\\n  await db.query(`\\n    UPDATE users SET \\n      email = 'deleted_' || id || '@example.com',\\n      name = 'Deleted User',\\n      deleted_at = NOW()\\n    WHERE id = $1\\n  `, [userId])\\n  \\n  // Optionally: Hard delete after retention period\\n  res.json({ message: 'Account deleted successfully' })\\n})\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "Privacy compliance issues: $PRIVACY_ISSUES"

GDPR_SUMMARY="{\"issuesFound\":$PRIVACY_ISSUES}"
jq --argjson gdpr "$GDPR_SUMMARY" \
  '.compliance.gdpr = $gdpr' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 4. API Standards Compliance
################################################################################

log_info "Checking API standards compliance..."

API_COMPLIANCE_ISSUES=0

# Check for OpenAPI/Swagger documentation
if ! [ -f "api/openapi.yaml" ] && ! [ -f "api/swagger.json" ]; then
  API_COMPLIANCE_ISSUES=$((API_COMPLIANCE_ISSUES + 1))

  FINDING="{\"category\":\"api-standards\",\"severity\":\"medium\",\"title\":\"Missing API documentation\",\"description\":\"No OpenAPI/Swagger specification found\",\"remediation\":\"Generate OpenAPI 3.0 specification for API documentation\",\"effort\":\"8-12 hours\",\"file\":\"api/openapi.yaml\",\"codeExample\":\"# Use swagger-jsdoc or similar\\nimport swaggerJsdoc from 'swagger-jsdoc'\\n\\nconst options = {\\n  definition: {\\n    openapi: '3.0.0',\\n    info: {\\n      title: 'Fleet Management API',\\n      version: '1.0.0'\\n    }\\n  },\\n  apis: ['./routes/*.ts']\\n}\\n\\nconst specs = swaggerJsdoc(options)\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for proper REST status codes
if [ -d "api" ]; then
  # Check if using proper status codes
  if ! grep -rq "\.status(201)\|\.status(204)\|\.status(400)\|\.status(404)" --include="*.ts" api/ 2>/dev/null; then
    API_COMPLIANCE_ISSUES=$((API_COMPLIANCE_ISSUES + 1))

    FINDING="{\"category\":\"api-standards\",\"severity\":\"low\",\"title\":\"Inconsistent HTTP status codes\",\"description\":\"API may not be using appropriate HTTP status codes\",\"remediation\":\"Use proper status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)\",\"effort\":\"2-4 hours\",\"file\":\"api/routes\",\"codeExample\":\"// Proper status codes\\napp.post('/api/vehicles', async (req, res) => {\\n  const vehicle = await createVehicle(req.body)\\n  res.status(201).json(vehicle)  // 201 for created\\n})\\n\\napp.delete('/api/vehicles/:id', async (req, res) => {\\n  await deleteVehicle(req.params.id)\\n  res.status(204).send()  // 204 for successful deletion\\n})\"}"
    jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  # Check for rate limiting
  if ! grep -rq "rate.*limit\|rateLimit\|express-rate-limit" --include="*.ts" --include="*.json" api/ 2>/dev/null; then
    API_COMPLIANCE_ISSUES=$((API_COMPLIANCE_ISSUES + 1))

    FINDING="{\"category\":\"api-standards\",\"severity\":\"medium\",\"title\":\"Missing rate limiting\",\"description\":\"No rate limiting detected on API endpoints\",\"remediation\":\"Implement rate limiting to prevent abuse and ensure fair usage\",\"effort\":\"4-6 hours\",\"file\":\"api/middleware/rate-limit.ts\",\"codeExample\":\"import rateLimit from 'express-rate-limit'\\n\\nconst limiter = rateLimit({\\n  windowMs: 15 * 60 * 1000,  // 15 minutes\\n  max: 100,  // 100 requests per window\\n  message: 'Too many requests, please try again later'\\n})\\n\\napp.use('/api/', limiter)\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

log_info "API compliance issues: $API_COMPLIANCE_ISSUES"

API_SUMMARY="{\"issuesFound\":$API_COMPLIANCE_ISSUES}"
jq --argjson api "$API_SUMMARY" \
  '.compliance.apiStandards = $api' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 5. FedRAMP Compliance Check (from CLAUDE.md)
################################################################################

log_info "Checking FedRAMP compliance requirements..."

FEDRAMP_ISSUES=0

# Check for audit logging
if ! grep -rq "audit.*log\|security.*log\|logger.*audit" --include="*.ts" api/ 2>/dev/null; then
  FEDRAMP_ISSUES=$((FEDRAMP_ISSUES + 1))

  FINDING="{\"category\":\"fedramp\",\"severity\":\"high\",\"title\":\"Missing audit logging\",\"description\":\"No audit logging implementation detected (FedRAMP requirement)\",\"remediation\":\"Implement comprehensive audit logging for all security-relevant events (authentication, authorization, data access, configuration changes)\",\"effort\":\"12-16 hours\",\"file\":\"api/middleware/audit-log.ts\",\"codeExample\":\"// Audit logging middleware\\nexport function auditLog(action: string) {\\n  return (req: Request, res: Response, next: NextFunction) => {\\n    const log = {\\n      timestamp: new Date().toISOString(),\\n      userId: req.user?.id,\\n      action,\\n      resource: req.path,\\n      ip: req.ip,\\n      userAgent: req.headers['user-agent']\\n    }\\n    \\n    auditLogger.info(log)\\n    next()\\n  }\\n}\\n\\napp.post('/api/vehicles', auditLog('CREATE_VEHICLE'), createVehicle)\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for TLS/HTTPS enforcement
if ! grep -rq "https\|tls\|ssl" --include="*.ts" --include="*.json" api/ 2>/dev/null; then
  FEDRAMP_ISSUES=$((FEDRAMP_ISSUES + 1))

  FINDING="{\"category\":\"fedramp\",\"severity\":\"critical\",\"title\":\"HTTPS/TLS not enforced\",\"description\":\"No evidence of HTTPS enforcement (FedRAMP requires TLS 1.2+)\",\"remediation\":\"Enforce HTTPS in production. Redirect HTTP to HTTPS. Use TLS 1.2 or higher.\",\"effort\":\"2-4 hours\",\"file\":\"api/server.ts\",\"codeExample\":\"// Redirect HTTP to HTTPS\\napp.use((req, res, next) => {\\n  if (process.env.NODE_ENV === 'production' && !req.secure) {\\n    return res.redirect(301, 'https://' + req.headers.host + req.url)\\n  }\\n  next()\\n})\\n\\n// Or use Helmet\\nimport helmet from 'helmet'\\napp.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }))\"}"
  jq --argjson f "$FINDING" '.findings.critical += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "FedRAMP issues: $FEDRAMP_ISSUES"

FEDRAMP_SUMMARY="{\"issuesFound\":$FEDRAMP_ISSUES}"
jq --argjson fed "$FEDRAMP_SUMMARY" \
  '.compliance.fedramp = $fed' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 6. Calculate Summary
################################################################################

jq '
  .summary.criticalCount = (.findings.critical | length) |
  .summary.highCount = (.findings.high | length) |
  .summary.mediumCount = (.findings.medium | length) |
  .summary.lowCount = (.findings.low | length) |
  .summary.infoCount = (.findings.info | length) |
  .summary.totalIssues = (.summary.criticalCount + .summary.highCount + .summary.mediumCount + .summary.lowCount + .summary.infoCount)
' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

TOTAL_EFFORT=0
for severity in critical high medium low; do
  EFFORT=$(jq -r ".findings.$severity[].effort // \"0 hours\"" "$REPORT_FILE" | \
    sed 's/[^0-9]*//g' | awk '{sum+=$1} END {print sum}')
  TOTAL_EFFORT=$((TOTAL_EFFORT + EFFORT))
done

jq --arg time "$TOTAL_EFFORT hours" \
  '.remediationTime = $time' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# Summary
################################################################################

CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
HIGH=$(jq '.summary.highCount' "$REPORT_FILE")
MEDIUM=$(jq '.summary.mediumCount' "$REPORT_FILE")
LOW=$(jq '.summary.lowCount' "$REPORT_FILE")
TOTAL=$(jq '.summary.totalIssues' "$REPORT_FILE")

log_success "Compliance check complete!"
echo "----------------------------------------"
echo "Compliance Summary:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low: $LOW"
echo "  Total Issues: $TOTAL"
echo "  Estimated Remediation: $TOTAL_EFFORT hours"
echo "----------------------------------------"
echo "Report saved to: $REPORT_FILE"

exit 0
