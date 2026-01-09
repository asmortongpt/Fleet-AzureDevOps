# Plan of Action & Milestones (POA&M)
## Fleet Management System - FedRAMP Moderate

**System Name:** Fleet Garage Management System
**Date Initiated:** 2026-01-08
**POA&M Version:** 1.0
**Next Review Date:** 2026-01-15 (Weekly until all Critical items closed)

---

## Executive Summary

This Plan of Action & Milestones (POA&M) documents security vulnerabilities and weaknesses identified in the Fleet Management System, along with planned remediation activities and milestones.

**Current Status:**
- **Total Open Items:** 11
- **Critical:** 4
- **High:** 4
- **Medium:** 3
- **Low:** 0

**Overall Risk Posture:** Medium-High
- 4 critical code injection vulnerabilities require immediate attention
- Expected completion of all Critical items: 2026-02-15
- Expected completion of all High items: 2026-03-15

---

## Critical Findings (Immediate Action Required)

### POAM-001: Code Injection via eval() - Workflow Engine
**Severity:** Critical
**NIST Control:** SI-10 (Information Input Validation)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
The workflow engine uses `eval()` to execute conditional logic, allowing potential arbitrary JavaScript code execution through user-controlled document metadata fields.

**Location:**
- File: `/api/src/services/documents/workflow-engine.ts:672`
- Code:
  ```typescript
  return eval(condition.replace(/amount/g, amount.toString())
              .replace(/severity/g, `"${severity}"`))
  ```

**Vulnerability:**
- Direct use of eval() with user-controlled input
- String replacement does not prevent code injection
- Attackers could inject malicious code via severity field
- Example exploit: `"; maliciousCode(); //`

**Business Impact:**
- **Confidentiality:** HIGH - Arbitrary code execution could access sensitive data
- **Integrity:** HIGH - Data could be modified or deleted
- **Availability:** MEDIUM - System could be crashed or disrupted

**Affected NIST Controls:** SI-10, SI-3

**Remediation Plan:**
1. Replace eval() with safe expression evaluator (vm2 library)
2. Implement sandboxed execution environment
3. Add input validation whitelist for allowed expressions
4. Conduct security testing after fix

**Recommended Solution:**
```typescript
import { VM } from 'vm2';

private evaluateCondition(condition: string, document: Document): boolean {
  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {
        amount: document.metadata?.extracted?.['total-amount'] || 0,
        severity: document.metadata?.analysis?.severity || 'low'
      }
    });
    return vm.run(`Boolean(${condition})`);
  } catch (error) {
    logger.error('Workflow condition evaluation failed', error);
    return false;
  }
}
```

**Milestones:**
| Milestone | Target Date | Status | Owner |
|-----------|-------------|--------|-------|
| Security review and solution design | 2026-01-15 | Not Started | Security Team |
| Implement vm2 sandbox solution | 2026-01-22 | Not Started | Engineering Team |
| Unit testing of new implementation | 2026-01-29 | Not Started | QA Team |
| Security testing and validation | 2026-02-05 | Not Started | Security Team |
| Code review and merge | 2026-02-12 | Not Started | Engineering Lead |
| Deploy to production | 2026-02-15 | Not Started | DevOps Team |

**Status:** Open
**Priority:** P0 (Critical)
**Estimated Effort:** 40 hours
**Resources Required:** 2 engineers, 1 security analyst
**Scheduled Completion Date:** 2026-02-15

---

### POAM-002: Code Injection via eval() - Report Renderer
**Severity:** Critical
**NIST Control:** SI-10 (Information Input Validation)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
The dynamic report renderer uses `eval()` to calculate custom report metrics, allowing potential code injection through user-defined report expressions.

**Location:**
- File: `/src/components/reports/DynamicReportRenderer.tsx:171`
- Code:
  ```typescript
  const result = eval(measure.expression.replace(/(\w+)/g, (match) => {
    return context[match] !== undefined ? context[match] : 0;
  }));
  ```

**Vulnerability:**
- Uses eval() to evaluate report expressions
- User-defined expressions in reports could execute arbitrary code
- No input validation or sanitization
- Frontend code injection affects user browser security

**Business Impact:**
- **Confidentiality:** HIGH - Could steal user session tokens, credentials
- **Integrity:** HIGH - Could modify report data, inject malicious content
- **Availability:** MEDIUM - Could crash user browser

**Affected NIST Controls:** SI-10, SI-3, SC-23

**Remediation Plan:**
1. Replace eval() with safe math expression library (mathjs)
2. Implement expression whitelist and validation
3. Add sandboxing for report calculations
4. Update report builder UI to prevent complex expressions

**Recommended Solution:**
```typescript
import { evaluate } from 'mathjs';

try {
  const result = evaluate(measure.expression, {
    // Only allow whitelisted context variables
    ...sanitizeContext(context)
  });
  return result;
} catch (error) {
  logger.warn(`Invalid expression: ${measure.expression}`, error);
  toast.error('Invalid report expression');
  return 0;
}
```

**Milestones:**
| Milestone | Target Date | Status | Owner |
|-----------|-------------|--------|-------|
| Research mathjs library integration | 2026-01-15 | Not Started | Engineering Team |
| Implement safe expression evaluator | 2026-01-22 | Not Started | Frontend Team |
| Update report builder UI | 2026-01-29 | Not Started | Frontend Team |
| Browser-based security testing | 2026-02-05 | Not Started | QA Team |
| User acceptance testing | 2026-02-12 | Not Started | Product Team |
| Production deployment | 2026-02-15 | Not Started | DevOps Team |

**Status:** Open
**Priority:** P0 (Critical)
**Estimated Effort:** 32 hours
**Resources Required:** 2 frontend engineers, 1 security analyst
**Scheduled Completion Date:** 2026-02-15

---

### POAM-003: Code Injection via Function() Constructor - Policy Engine
**Severity:** Critical
**NIST Control:** SI-10 (Information Input Validation)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
The policy enforcement engine uses the Function() constructor (equivalent to eval()) to execute custom policy logic, creating a code injection vulnerability.

**Location:**
- File: `/src/lib/policy-engine/policy-enforcement-engine.ts:476`
- Code:
  ```typescript
  // Use Function constructor for safe evaluation (better than eval)
  const fn = new Function('data', `with(data) { return ${logic} }`)
  return fn(evalContext)
  ```

**Vulnerability:**
- Function() constructor is essentially eval()
- Code comment incorrectly claims this is "safe"
- `with()` statement adds additional security risks
- User-defined policy logic could execute arbitrary code

**Business Impact:**
- **Confidentiality:** CRITICAL - Could bypass all access controls
- **Integrity:** CRITICAL - Could modify policy enforcement logic
- **Availability:** HIGH - Could disable security policies

**Affected NIST Controls:** SI-10, AC-3, SI-3

**Remediation Plan:**
1. Replace Function() with JSONLogic or similar safe rule engine
2. Convert existing policies to declarative JSON format
3. Implement policy schema validation
4. Migrate all custom policies to safe format

**Recommended Solution:**
```typescript
import jsonLogic from 'json-logic-js';

private evaluateCustomLogic(logic: any, context: PolicyContext): boolean {
  try {
    // Convert logic to JSONLogic format
    const result = jsonLogic.apply(logic, {
      field: context.field,
      value: actualValue,
      context: context.data,
      user: context.user,
    });
    return Boolean(result);
  } catch (error) {
    logger.error('Error evaluating policy logic:', error);
    // Fail secure: deny access on policy evaluation error
    return false;
  }
}
```

**Milestones:**
| Milestone | Target Date | Status | Owner |
|-----------|-------------|--------|-------|
| Evaluate JSONLogic and alternatives | 2026-01-15 | Not Started | Architecture Team |
| Design policy migration strategy | 2026-01-22 | Not Started | Engineering Lead |
| Implement JSONLogic integration | 2026-01-29 | Not Started | Engineering Team |
| Migrate existing policies to JSON | 2026-02-05 | Not Started | Configuration Team |
| Security testing and validation | 2026-02-12 | Not Started | Security Team |
| Production deployment | 2026-02-15 | Not Started | DevOps Team |

**Status:** Open
**Priority:** P0 (Critical)
**Estimated Effort:** 56 hours
**Resources Required:** 2 engineers, 1 architect, 1 security analyst
**Scheduled Completion Date:** 2026-02-15

---

### POAM-004: Hardcoded Authentication Bypass
**Severity:** Critical
**NIST Control:** IA-2 (Identification and Authentication)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Development authentication bypass is hardcoded to `true`, completely disabling all authentication and access control mechanisms.

**Location:**
- File: `/src/contexts/AuthContext.tsx:73`
- Code:
  ```typescript
  // DEVELOPMENT AUTH BYPASS: Skip authentication for testing
  // IMPORTANT: Only use in development, remove after testing!
  const SKIP_AUTH = true; // import.meta.env.VITE_SKIP_AUTH === 'true';
  ```

**Vulnerability:**
- Hardcoded SKIP_AUTH = true bypasses all authentication
- Comment indicates it should be environment-controlled but is hardcoded
- Could be deployed to production accidentally
- Creates backdoor with full SuperAdmin access

**Business Impact:**
- **Confidentiality:** CRITICAL - Unauthorized access to all data
- **Integrity:** CRITICAL - Unauthorized modification of all data
- **Availability:** HIGH - System compromise could lead to downtime
- **Compliance:** CRITICAL - Complete violation of access control requirements

**Affected NIST Controls:** IA-2, AC-2, AC-3, AU-2

**Remediation Plan:**
1. Immediately fix hardcoded value (emergency fix)
2. Add pre-commit hook to prevent SKIP_AUTH in production
3. Implement CI/CD check to fail build if SKIP_AUTH enabled
4. Add runtime check to throw error in production

**Recommended Solution:**
```typescript
// Only allow auth bypass in development and with explicit env variable
const SKIP_AUTH = import.meta.env.DEV &&
                  import.meta.env.VITE_SKIP_AUTH === 'true';

// Fail fast if misconfigured in production
if (!import.meta.env.DEV && SKIP_AUTH) {
  throw new Error('SECURITY: SKIP_AUTH cannot be enabled in production');
}

// Log warning even in development
if (SKIP_AUTH) {
  console.warn('⚠️ WARNING: Authentication bypass is enabled for development');
}
```

**Milestones:**
| Milestone | Target Date | Status | Owner |
|-----------|-------------|--------|-------|
| Emergency fix deployment | 2026-01-09 | Not Started | Engineering Lead |
| Add pre-commit hook validation | 2026-01-10 | Not Started | DevOps Team |
| Implement CI/CD security check | 2026-01-10 | Not Started | DevOps Team |
| Security audit of production | 2026-01-10 | Not Started | Security Team |
| Verify no unauthorized access | 2026-01-11 | Not Started | Security Operations |

**Status:** Open
**Priority:** P0 (Critical) - Emergency
**Estimated Effort:** 8 hours
**Resources Required:** 1 senior engineer, 1 security analyst, 1 DevOps engineer
**Scheduled Completion Date:** 2026-01-10

**NOTE:** This is an emergency finding requiring immediate action.

---

## High Priority Findings

### POAM-005: XSS Vulnerability - Email HTML Rendering
**Severity:** High
**NIST Control:** SI-3 (Malicious Code Protection), SI-10
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Email body HTML is rendered without sanitization, creating an XSS attack vector through crafted email content.

**Location:**
- File: `/src/components/drilldown/EmailDetailPanel.tsx:191`
- Code:
  ```typescript
  <div
    className="prose prose-sm dark:prose-invert max-w-none"
    dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
  />
  ```

**Vulnerability:**
- Renders raw HTML from email body without sanitization
- Email content could contain malicious JavaScript
- XSS attack vector through crafted emails

**Business Impact:**
- **Confidentiality:** HIGH - Could steal session tokens
- **Integrity:** MEDIUM - Could modify displayed content
- **Availability:** LOW - Minimal impact

**Remediation Plan:**
Implement DOMPurify sanitization with strict whitelist.

**Scheduled Completion Date:** 2026-02-28

---

### POAM-006: Insecure Random - Security IDs
**Severity:** High
**NIST Control:** SC-13 (Cryptographic Protection)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Math.random() used for generating session IDs, request IDs, and incident IDs. These are not cryptographically secure and could be predicted by attackers.

**Locations:**
- `/src/services/errorReporting.tsx:487` - Request ID generation
- `/src/services/analytics.ts:502` - Session ID generation
- `/services/incidents/incident-responder.ts:195` - Incident ID generation

**Vulnerability:**
- Math.random() is not cryptographically secure
- Predictable IDs could be guessed by attackers
- Session/incident IDs should be unguessable

**Remediation Plan:**
Replace Math.random() with crypto.randomUUID() for all security-sensitive IDs.

**Scheduled Completion Date:** 2026-02-28

---

### POAM-007: Regex exec() Infinite Loop Risk
**Severity:** High
**NIST Control:** SI-7 (Software Integrity)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Multiple files use regex exec() in loops without ensuring the global flag is set, risking infinite loops and DoS.

**Locations:**
- `/api/src/services/documents/indexing-service.ts:148-184`
- `/api/src/services/teams.service.ts:438`
- `/api/src/services/SearchIndexService.ts:199-217`

**Vulnerability:**
- If regex doesn't have global flag, causes infinite loop
- Can lead to DoS (Denial of Service)
- Application hangs on malicious input

**Remediation Plan:**
Use matchAll() instead of exec() loops, or ensure global flag.

**Scheduled Completion Date:** 2026-02-28

---

### POAM-008: Hardcoded Test Credentials
**Severity:** High
**NIST Control:** IA-5 (Authenticator Management)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Test files contain hardcoded weak credentials that could be accidentally used in production.

**Locations:**
- `/tests/e2e/fleet-management.spec.ts:14` - `ADMIN_PASSWORD = 'admin123'`
- `/tests/integration/security/auth.test.ts:55` - `weakPassword = 'password'`

**Vulnerability:**
- Test credentials should not be hardcoded
- Could be accidentally used in production
- Weak passwords used for testing

**Remediation Plan:**
Use environment variables or randomly generated test credentials.

**Scheduled Completion Date:** 2026-02-28

---

## Medium Priority Findings

### POAM-009: Excessive Console Logging
**Severity:** Medium
**NIST Control:** SI-11 (Error Handling)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
164 production source files contain console.log statements that leak sensitive information to browser console.

**Business Impact:**
- Information disclosure via browser console
- Performance impact in production
- Debugging clutter

**Remediation Plan:**
1. Replace console.log with proper logger
2. Configure build to strip console statements in production
3. Implement proper logging service

**Scheduled Completion Date:** 2026-03-31

---

### POAM-010: Excessive TypeScript 'any' Usage
**Severity:** Medium
**NIST Control:** None (Code Quality)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
305 source files use TypeScript 'any' type, defeating type safety and hiding potential bugs.

**Business Impact:**
- Reduced type safety
- Hidden bugs
- Difficult refactoring

**Remediation Plan:**
1. Enable stricter TypeScript rules
2. Gradual migration from 'any' to proper types
3. Use 'unknown' type where necessary

**Scheduled Completion Date:** 2026-06-30 (Long-term technical debt)

---

### POAM-011: Missing Error Handling
**Severity:** Medium
**NIST Control:** SI-11 (Error Handling)
**Discovered:** 2026-01-08
**Source:** Codacy Security Analysis

**Description:**
Many async functions lack try-catch blocks for proper error handling.

**Business Impact:**
- Unhandled promise rejections could crash application
- Poor error messages for users
- Difficult debugging

**Remediation Plan:**
Add comprehensive error handling to all async functions.

**Scheduled Completion Date:** 2026-03-31

---

## POA&M Metrics

### By Severity
| Severity | Open | In Progress | Completed | Total |
|----------|------|-------------|-----------|-------|
| Critical | 4 | 0 | 0 | 4 |
| High | 4 | 0 | 0 | 4 |
| Medium | 3 | 0 | 0 | 3 |
| Low | 0 | 0 | 0 | 0 |
| **Total** | **11** | **0** | **0** | **11** |

### By NIST Control
| Control | Number of Findings |
|---------|-------------------|
| SI-10 (Input Validation) | 3 |
| SI-3 (Malicious Code) | 2 |
| IA-2 (Authentication) | 1 |
| SC-13 (Cryptography) | 1 |
| SI-7 (Software Integrity) | 1 |
| IA-5 (Authenticator Mgmt) | 1 |
| SI-11 (Error Handling) | 2 |

### Timeline
```
2026-01-10: POAM-004 (Auth Bypass) - EMERGENCY FIX
2026-02-15: POAM-001, 002, 003 (Code Injection) - CRITICAL
2026-02-28: POAM-005, 006, 007, 008 (High Priority)
2026-03-31: POAM-009, 011 (Medium Priority)
2026-06-30: POAM-010 (Technical Debt)
```

---

## Risk Acceptance

None of the critical or high findings are approved for risk acceptance. All must be remediated according to scheduled completion dates.

---

## Dependencies and Constraints

**Dependencies:**
- POAM-001, 002, 003 share similar remediation approach
- Can be parallelized with different team members
- POAM-004 is independent emergency fix

**Constraints:**
- Limited engineering resources (2 engineers available)
- Must maintain service availability during fixes
- Require security validation before production deployment

**Blockers:**
- None currently identified

---

## Change Management

All POA&M items will follow standard change management process:
1. Security review and approval
2. Development and testing in non-production environment
3. Change Advisory Board (CAB) approval for production deployment
4. Rollback plan documented before deployment
5. Post-deployment validation

---

## Reporting

**POA&M Review Frequency:**
- Weekly reviews until all Critical items closed
- Monthly reviews for High and Medium items
- Quarterly comprehensive POA&M review

**Reporting:**
- Weekly status reports to CISO
- Monthly reports to executive leadership
- Quarterly reports to FedRAMP PMO

---

## Completion Criteria

Each POA&M item is considered complete when:
1. ✅ Remediation implemented and tested
2. ✅ Security validation completed
3. ✅ Code review approved
4. ✅ Deployed to production
5. ✅ Post-deployment validation successful
6. ✅ Documentation updated
7. ✅ POA&M item marked as "Closed"

---

**Document Version:** 1.0
**Document Owner:** Security Team
**Last Updated:** 2026-01-08
**Next Review:** 2026-01-15

**Prepared By:** Compliance Agent G - FedRAMP Evidence Packager
