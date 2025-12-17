# P3 LOW-SEC-001: Excessive Logging Audit Report

**Date**: 2025-12-16
**Status**: ⏳ DOCUMENTED - Awaiting Implementation
**Priority**: P3 LOW
**Risk**: LOW - Production logs may expose PII/credentials

---

## Executive Summary

Found **163 console.log statements** across **744 source files**, with **50 logs containing potentially sensitive data** (passwords, tokens, API keys, secrets). This audit documents the security risk and provides implementation recommendations.

---

## Current State Analysis

### Logging Statistics
- **Total console.log statements**: 163
- **Files with logging**: ~50-60 files
- **Sensitive data logs**: 50 (30.7%)
- **Total source files**: 744

### Search Commands Used
```bash
# Count all console.log statements
grep -r "console\.log" src --include="*.ts" --include="*.tsx" | wc -l
# Result: 163

# Count logs with sensitive data patterns
grep -ri "password\|token\|api[_-]key\|secret" src --include="*.ts" --include="*.tsx" | grep -i "console\.log\|logger" | wc -l
# Result: 50
```

---

## Security Risks Identified

### 1. Credential Exposure
- **Risk**: Passwords, API keys, tokens logged to console
- **Impact**: If production logs are captured, credentials could be exposed
- **Likelihood**: MEDIUM (depends on log aggregation setup)

### 2. PII Logging
- **Risk**: User emails, phone numbers, session IDs in logs
- **Impact**: GDPR/CCPA compliance violations
- **Likelihood**: LOW (most user data is in API responses, not frontend logs)

### 3. Debug Mode in Production
- **Risk**: Verbose logging enabled by default
- **Impact**: Performance degradation, log file bloat
- **Likelihood**: HIGH (no environment checks on most logs)

---

## Recommended Remediations

### Phase 1: Remove Credential Logs (P0 - Critical)

**Files likely affected**:
- `src/lib/api-client.ts` (API request/response logging)
- `src/hooks/use-api.ts` (data fetching logs)
- `src/services/auth/` (authentication logs)

**Actions**:
1. Search for and remove:
   ```typescript
   console.log(user) // Full user object with tokens
   console.log(password) // NEVER log passwords
   console.log(token) // Auth tokens
   console.log(apiKey) // API keys
   ```

2. Replace with redacted logging:
   ```typescript
   // SECURITY FIX P3 LOW-SEC-001
   console.log('[Auth] User authenticated:', {
     id: user.id,
     email: user.email?.substring(0, 3) + '***', // Redacted
     // NO TOKEN/PASSWORD
   })
   ```

### Phase 2: Implement Log Level Controls (P1 - High)

**Create logger utility** (`src/utils/logger.ts`):

```typescript
// SECURITY FIX P3 LOW-SEC-001: Centralized logging with redaction
const isDevelopment = import.meta.env.MODE === 'development'
const DEBUG_ENABLED = typeof window !== 'undefined' &&
                     localStorage.getItem('debug_fleet_data') === 'true'

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment || DEBUG_ENABLED) {
      console.log('[DEBUG]', ...args)
    }
  },

  info: (...args: any[]) => {
    console.log('[INFO]', ...args)
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  // Redact sensitive fields
  redact: (obj: any) => {
    const redacted = { ...obj }
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn']

    sensitiveFields.forEach(field => {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]'
      }
    })

    return redacted
  }
}
```

**Replace all console.log** with logger:
```typescript
// Before (INSECURE):
console.log('[useFleetData] API Data:', vehiclesData)

// After (SECURE):
logger.debug('[useFleetData] API Data:', logger.redact(vehiclesData))
```

### Phase 3: Remove PII from Logs (P2 - Medium)

**Search patterns**:
```bash
# Find logs with potential PII
grep -ri "email\|phone\|ssn\|address" src | grep -i "console\.log"

# Find logs with user objects
grep -r "console\.log.*user" src --include="*.ts" --include="*.tsx"
```

**Remediation example**:
```typescript
// Before (exposes PII):
console.log('User profile:', user)

// After (redacted):
logger.info('User profile loaded:', {
  id: user.id,
  role: user.role,
  // NO email, phone, address
})
```

### Phase 4: Production Log Controls (P3 - Low)

**Environment-based logging**:
```typescript
// Only log in development
if (import.meta.env.DEV) {
  console.log('[Dev Only] Detailed debug info...')
}

// Production: Only errors and critical info
if (import.meta.env.PROD) {
  // Minimal logging
  console.error('[Prod] Critical error:', error.message) // No stack trace
}
```

---

## Implementation Checklist

- [ ] **Phase 1**: Remove all password/token/secret logs (10 files estimated)
- [ ] **Phase 2**: Create centralized logger utility with redaction
- [ ] **Phase 3**: Replace console.log with logger (163 replacements)
- [ ] **Phase 4**: Add environment checks for debug logs
- [ ] **Phase 5**: Remove PII from all log statements (50 locations)
- [ ] **Testing**: Verify no sensitive data in production logs
- [ ] **Documentation**: Update CLAUDE.md with logging guidelines

---

## Estimated Effort

- **High-priority fixes** (Phases 1-2): **4-6 hours**
- **Complete remediation** (all phases): **8-12 hours**
- **Testing & verification**: **2-3 hours**

---

## Next Steps

1. **Immediate**: Create `src/utils/logger.ts` with redaction function
2. **Short-term**: Replace all password/token/secret logs (Phase 1)
3. **Medium-term**: Migrate all console.log to logger utility (Phase 2-3)
4. **Long-term**: Implement log aggregation with proper redaction in production

---

## Testing Strategy

```bash
# Build and check for sensitive data in logs
npm run build

# Start dev server and monitor console
npm run dev

# Test scenarios:
# 1. Login with test credentials → NO password in logs
# 2. API calls with auth tokens → NO tokens in logs
# 3. User profile viewing → NO PII (email/phone) in logs
# 4. Error scenarios → Stack traces redacted in production
```

---

## Compliance Notes

- **GDPR Article 5**: Minimize data processing (don't log PII)
- **PCI-DSS 3.4**: Never log full credit card numbers
- **HIPAA**: No PHI in logs
- **Best Practice**: Assume all logs may be accessed by unauthorized parties

---

## References

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- NIST SP 800-92: Guide to Computer Security Log Management
- CIS Controls: Log Management (Control 8.2)
