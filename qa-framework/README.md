# QA Framework - Production-Ready Mode

**Version 2.0** - Conservative recommendations for production-ready applications

## Philosophy

This QA framework is configured for **production-ready applications** where the focus is on:

- **CRITICAL issues only** - Security vulnerabilities, data loss risks, crashes
- **Functional blockers** - Not cosmetic improvements
- **Conservative recommendations** - No unnecessary refactoring suggestions
- **80% pass threshold** - Recognizing that perfection isn't required

## Quick Start

```bash
# Install dependencies
npm install

# Run all gates in production mode
npm run orchestrate

# Run individual gates
npm run gate:console
npm run gate:accessibility
npm run gate:security
npm run gate:performance
```

## Configuration

### Production Mode (.env)

```bash
# Enable production mode (conservative scoring)
PRODUCTION_MODE=true

# Pass threshold: 80% (vs 95% in strict mode)
PASS_THRESHOLD=80

# Only fail on CRITICAL issues
CRITICAL_ONLY=true

# Application URL
BASE_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net

# Evidence collection
EVIDENCE_DIR=./verification-evidence
VERBOSE_OUTPUT=true
```

### Strict Mode (Development)

```bash
PRODUCTION_MODE=false
PASS_THRESHOLD=95
CRITICAL_ONLY=false
```

## Severity Levels

### CRITICAL (🔴)
**Blocks production deployment**
- Exposed secrets (API keys, passwords)
- Security vulnerabilities (SQL injection, XSS)
- Authentication/authorization failures
- Database connection errors
- App crashes / unhandled rejections
- Load time > 10 seconds

**Action**: MUST FIX before deployment

### HIGH (🟡)
**Important but not blocking**
- Missing HTTPS on production URL
- Serious accessibility violations (WCAG AA)
- Performance issues (FCP > 3s, load time 3-10s)
- TypeError, ReferenceError in production code
- API errors affecting core functionality

**Action**: RECOMMENDED to fix, but not blocking

### MEDIUM (🔵)
**Nice to have**
- Missing security headers (CSP, X-Frame-Options)
- Moderate accessibility issues
- Code quality improvements
- Minor bugs that don't affect core functionality
- Performance optimizations (DOM size, bundle optimization)

**Action**: OPTIONAL - Address if time permits

### LOW (⚪)
**Informational only**
- Style improvements
- Refactoring suggestions
- Minor accessibility enhancements
- Development warnings

**Action**: INFORMATIONAL - Can be ignored

## Mode Comparison

### Production Mode (Current Configuration)

```
┌─────────────────────────────────────────────┐
│ PRODUCTION MODE                             │
├─────────────────────────────────────────────┤
│ Pass Threshold: 80%                         │
│ Fail On: CRITICAL issues only               │
│ Show: CRITICAL + HIGH                       │
│ Hide: MEDIUM + LOW                          │
│                                             │
│ Philosophy:                                 │
│ "App is production-ready - focus on        │
│  blockers, not perfection"                  │
└─────────────────────────────────────────────┘
```

**Example Output**:
```
✅ Console Errors: 10/10 - 0 issues found (CRITICAL: 0)
✅ Accessibility: 8/10 - 2 issues found (1 HIGH, 1 MEDIUM - MEDIUM hidden)
✅ Security: 10/10 - 0 critical issues
✅ Performance: 9/10 - Load: 2500ms, FCP: 1200ms

Score: 37/40 (92%) - PASSED ✅
```

### Strict Mode (Development/Pre-Production)

```
┌─────────────────────────────────────────────┐
│ STRICT MODE                                 │
├─────────────────────────────────────────────┤
│ Pass Threshold: 95%                         │
│ Fail On: Any finding above threshold        │
│ Show: ALL severities                        │
│                                             │
│ Philosophy:                                 │
│ "Catch everything early in development"    │
└─────────────────────────────────────────────┘
```

## Quality Gates

### Gate 1: Console Errors
**Max Score**: 10 points

**Production Mode**:
- Only shows CRITICAL errors (SecurityError, CORS, Auth failures)
- Ignores 404s, favicon warnings, development warnings
- Fails only if CRITICAL errors present

**Strict Mode**:
- Shows all console errors
- Penalizes all error types

### Gate 2: Accessibility
**Max Score**: 10 points

**Production Mode**:
- Shows only CRITICAL and SERIOUS violations
- Fails only on CRITICAL (legal/compliance blockers)
- Hides MODERATE and MINOR issues

**Strict Mode**:
- Shows all WCAG violations
- Fails if violations > 10

### Gate 3: Security
**Max Score**: 10 points

**Production Mode**:
- CRITICAL: Exposed secrets → immediate failure
- HIGH: Missing HTTPS → recommended fix
- MEDIUM: Missing headers → informational only

**Strict Mode**:
- All security findings count toward score

### Gate 4: Performance
**Max Score**: 10 points

**Production Mode Thresholds**:
- Load time: < 10s (CRITICAL if exceeded)
- FCP: < 3s (HIGH if exceeded)
- DOM nodes: < 5000 (MEDIUM if exceeded)

**Strict Mode Thresholds**:
- Load time: < 3s
- FCP: < 1.8s
- DOM nodes: < 2000

## Before/After Comparison

### Before (Strict Mode)
```bash
❌ Failed - Score: 85/100 (85%)
   - 2 console errors (favicon 404, React warning)
   - 8 accessibility violations (5 moderate, 3 minor)
   - Missing 4 security headers
   - Bundle size 450KB (threshold: 500KB)

Recommendations:
- Refactor component hierarchy
- Add missing ARIA labels on decorative icons
- Implement advanced code splitting
- Enable all security headers
```

### After (Production Mode)
```bash
✅ Passed - Score: 48/60 (80%)
   - 0 CRITICAL issues
   - 1 HIGH issue (FCP slightly elevated)

Recommendations:
- CRITICAL: None - ready for production
- RECOMMENDED: Consider FCP optimization
- Hidden: 12 minor/medium findings (use VERBOSE_OUTPUT=true to see)
```

## Reporting

### JSON Reports

Located in `./verification-evidence/reports/`

```json
{
  "mode": "production",
  "score": {
    "total": 48,
    "max": 60,
    "percentage": 80,
    "passed": true
  },
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 8,
    "low": 3
  },
  "gates": [...]
}
```

### Detailed Evidence

- `a11y-reports/` - Accessibility scan results
- `security-scans/` - Security check results
- `perf-reports/` - Performance metrics
- `console-logs/` - Console error logs

## Integration

### CI/CD Pipeline

```yaml
# .github/workflows/qa-check.yml
- name: Run QA Framework
  env:
    PRODUCTION_MODE: true
    PASS_THRESHOLD: 80
    CRITICAL_ONLY: true
  run: |
    cd qa-framework
    npm install
    npm run orchestrate
```

### Pre-Deployment Check

```bash
#!/bin/bash
# scripts/pre-deploy-check.sh

cd qa-framework
PRODUCTION_MODE=true npm run orchestrate

if [ $? -eq 0 ]; then
  echo "✅ QA Gates passed - safe to deploy"
  exit 0
else
  echo "❌ CRITICAL issues found - deployment blocked"
  exit 1
fi
```

## Customization

### Adjusting Thresholds

Edit `.env`:

```bash
# More lenient (e.g., staging environment)
PASS_THRESHOLD=75

# Only fail on absolutely critical issues
CRITICAL_ONLY=true

# Show all findings for debugging
VERBOSE_OUTPUT=true
```

### Adding Custom Gates

Create `src/gates/custom-gate.ts`:

```typescript
import { Finding, Severity, GateConfig } from '../lib/severity.js';

export async function runCustomGate(page: Page): Promise<{
  passed: boolean;
  score: number;
  findings: Finding[];
}> {
  // Your gate logic here
}
```

## Best Practices

### For Production-Ready Apps

1. **Use PRODUCTION_MODE=true** - Focus on critical issues
2. **Set PASS_THRESHOLD=80** - Realistic for production
3. **Enable CRITICAL_ONLY** - Don't fail on minor issues
4. **Review reports weekly** - Address HIGH findings gradually

### For Active Development

1. **Use PRODUCTION_MODE=false** - Catch everything early
2. **Set PASS_THRESHOLD=95** - Maintain high quality
3. **Disable CRITICAL_ONLY** - See all findings
4. **Run on every commit** - Prevent quality regression

### For Pre-Production

1. **Use PRODUCTION_MODE=true** - Production-like checks
2. **Set CRITICAL_ONLY=false** - Include HIGH severity
3. **Review all CRITICAL and HIGH** - Fix before going live
4. **Archive reports** - Evidence for compliance

## FAQ

### Q: Why 80% threshold instead of 95%?

**A**: The app is production-ready. An 80% threshold acknowledges that:
- Not all findings are equal
- Perfect scores aren't required for functionality
- CRITICAL issues (0 tolerance) are what matter

### Q: What if I want to see ALL findings?

**A**: Set `VERBOSE_OUTPUT=true` in `.env`. All findings will be logged, but only CRITICAL/HIGH will affect scoring.

### Q: Can I run in strict mode occasionally?

**A**: Yes! Run with:
```bash
PRODUCTION_MODE=false PASS_THRESHOLD=95 npm run orchestrate
```

### Q: How do I know what's CRITICAL vs HIGH?

**A**: See **Severity Levels** section above. CRITICAL = blocks production, HIGH = recommended fix.

## Support

For questions or issues:
1. Check `./verification-evidence/reports/` for detailed findings
2. Run with `VERBOSE_OUTPUT=true` for full details
3. Review severity classifications in `src/lib/severity.ts`

## Version History

- **2.0** - Production-ready mode with conservative recommendations
- **1.0** - Initial strict mode implementation
