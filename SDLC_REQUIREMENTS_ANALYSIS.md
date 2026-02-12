# SDLC Requirements Analysis - Fleet-CTA
**Date:** 2026-02-10
**Phase:** 1 - Requirements Analysis
**Status:** In Progress

## Executive Summary

This document provides a comprehensive analysis of the Fleet-CTA enterprise fleet management application, identifying gaps between the current state and production-ready requirements. The analysis follows SDLC best practices and prioritizes issues using MoSCoW methodology.

## Current Application State

### Working Components ✅
- **Frontend**: React 18 + TypeScript + Vite (http://localhost:5173)
- **Backend**: Express.js API (http://localhost:3000 via api-standalone/server.js)
- **Database**: PostgreSQL 16 (Docker container: fleet-postgres)
- **Tech Stack**: TailwindCSS v4, shadcn/ui, TanStack Query, AG Grid, Three.js, Framer Motion
- **Data**: 15 vehicles, 6 users, 3 drivers with proper foreign key relationships

### Database Schema Analysis
#### Vehicles Table
- **Columns**: 28 fields including id, vin, make, model, year, status, GPS data (latitude, longitude), telematics, etc.
- **No Issues**: Schema is production-ready with proper constraints, indexes, and audit triggers

#### Drivers Table
- **Columns**: 22 fields including id, user_id (FK to users), license_number, cdl_class, safety_score, etc.
- **Issue**: Driver personal info (first_name, last_name, email, phone) is in users table, not drivers table
- **Relationship**: drivers.user_id → users.id (CASCADE DELETE)

#### Users Table
- **Columns**: 16 fields including id, email, first_name, last_name, phone, role, password_hash, mfa_enabled, etc.
- **No Issues**: Proper authentication and authorization schema

## Critical Issues (Must Fix)

### 1. **Database Schema Mismatch in Drivers Endpoint** 🔴 HIGH PRIORITY
**Location**: `api-standalone/server.js:152-162`
**Error**:
```
error: column "first_name" does not exist
Drivers endpoint error: code '42703'
```

**Root Cause**:
The `/api/v1/drivers` endpoint attempts to SELECT columns that don't exist in the drivers table:
```sql
SELECT
  id, first_name, last_name, email, phone,  -- ❌ These are in users table
  license_number, license_state,
  hire_date, status, name,                  -- ❌ 'name' doesn't exist anywhere
  created_at, updated_at
FROM drivers
```

**Solution Required**:
- Use proper JOIN with users table
- Query format:
```sql
SELECT
  d.id, d.license_number, d.license_state, d.cdl_class, d.cdl_endorsements,
  d.medical_card_expiration, d.hire_date, d.termination_date, d.status,
  d.safety_score, d.total_miles_driven, d.total_hours_driven,
  d.incidents_count, d.violations_count,
  u.first_name, u.last_name, u.email, u.phone, u.role,
  d.created_at, d.updated_at
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC
LIMIT $1 OFFSET $2
```

**Impact**: Drivers endpoint returns 500 error, breaking driver management features

### 2. **Auth Bypass Hardcoded** 🔴 HIGH PRIORITY
**Location**: `src/components/auth/ProtectedRoute.tsx:23`
**Issue**:
```typescript
// TEMPORARY: Hardcoded to true for debugging (TODO: investigate why env var not working)
const SKIP_AUTH = true; // import.meta.env.VITE_SKIP_AUTH === 'true';
```

**Root Cause**: Environment variable not being read properly

**Security Risk**:
- All protected routes are accessible without authentication
- Production deployment would have zero auth protection
- Violates FedRAMP security requirements

**Solution Required**:
- Investigate why `import.meta.env.VITE_SKIP_AUTH` is not working
- Check `.env` files for proper variable naming (must start with `VITE_`)
- Implement proper environment-based configuration
- Add validation to prevent production deployment with SKIP_AUTH=true

### 3. **Incomplete API Endpoint Coverage** 🟡 MEDIUM PRIORITY
**Current Endpoints** (from server.js):
- ✅ GET /api/v1/vehicles
- ✅ GET /api/v1/vehicles/:id
- ❌ GET /api/v1/drivers (broken - schema mismatch)
- ❌ GET /api/v1/drivers/:id (likely broken)
- ✅ GET /api/v1/stats
- ❌ POST /api/v1/vehicles (not implemented)
- ❌ PUT /api/v1/vehicles/:id (not implemented)
- ❌ DELETE /api/v1/vehicles/:id (not implemented)

**Missing Critical Endpoints**:
- Maintenance records CRUD
- Work orders CRUD
- Fuel transactions CRUD
- Inspections CRUD
- Routes CRUD
- Safety incidents reporting
- Charging sessions (EV)
- Documents management
- Authentication endpoints

### 4. **No Comprehensive Test Coverage** 🟡 MEDIUM PRIORITY
**Current State**:
- Multiple test configuration files exist (playwright.config.ts, playwright.kimi-exhaustive.config.ts)
- Test results files suggest tests have been run
- No current test execution status known

**Required**:
- Unit tests: ≥90% coverage (lines/branches)
- Integration tests: ≥85% coverage
- E2E tests: ≥80% critical user journeys
- API contract tests for all endpoints
- Accessibility tests (WCAG 2.2 AA)
- Performance tests (p95 latency targets)

### 5. **Production Configuration Missing** 🟡 MEDIUM PRIORITY
**Missing Components**:
- Docker production configuration
- Kubernetes deployment manifests
- Environment variable templates incomplete
- No CI/CD pipeline configuration
- No monitoring/observability setup (Azure Application Insights integration exists but needs verification)
- No security scanning configuration (SAST/DAST)

## MoSCoW Prioritized Backlog

### Must Have (Launch Blockers)
1. **Fix drivers endpoint database schema mismatch** - Prevents driver management
2. **Implement proper auth configuration** - Security requirement
3. **Add missing CRUD endpoints** - Core functionality
4. **Comprehensive test suite** - Quality assurance
5. **Production Docker configuration** - Deployment requirement
6. **Security hardening** - Parameterized queries, input validation, rate limiting

### Should Have (Critical for Production)
1. **OpenAPI/Swagger documentation** - API contract
2. **Monitoring setup** - Observability (Application Insights, health checks)
3. **CI/CD pipeline** - Automated testing and deployment
4. **Error tracking** - Sentry integration verification
5. **Logging standardization** - Structured logging across services
6. **Database migrations framework** - Schema version control

### Could Have (Quality Improvements)
1. **GraphQL API layer** - Enhanced data fetching
2. **WebSocket real-time updates** - Live fleet tracking
3. **Advanced caching** - Redis integration
4. **Multi-language support** - i18n
5. **Advanced analytics dashboards** - Business intelligence

### Won't Have (Future Roadmap)
1. **Mobile native apps** - PWA sufficient for MVP
2. **Voice commands** - Advanced feature
3. **Blockchain integration** - Not required
4. **VR/AR features** - Future enhancement

## Technical Debt Analysis

### High Priority Debt
1. **Backup .tsx files** - 30+ files with `.bak`, `.async_backup`, `.event_backup` suffixes
2. **Deleted components** - Uncommitted deletions in git status
3. **Generated markdown docs** - 50+ untracked .md files cluttering repo
4. **Log files committed** - Should be in .gitignore
5. **Test configuration duplication** - Multiple playwright configs

### Code Quality Issues
1. **TypeScript strict mode** - Not enforced everywhere
2. **ESLint warnings** - Need resolution before production
3. **Unused imports** - Code cleanup required
4. **Console.log statements** - Replace with proper logging

## Infrastructure Requirements

### Current Infrastructure
- **Local Development**: Docker PostgreSQL, Vite dev server, Express.js
- **Deployment Target**: Azure (Static Web Apps, Azure SQL, App Services)
- **Container Registry**: Azure Container Registry (ACR)

### Required Infrastructure
1. **Azure Kubernetes Service (AKS)** - Container orchestration
2. **Azure Database for PostgreSQL** - Managed database
3. **Azure Key Vault** - Secrets management
4. **Azure Application Insights** - Monitoring
5. **Azure DevOps Pipelines** - CI/CD
6. **Azure CDN** - Static asset delivery

## Security Requirements (FedRAMP-Grade)

### Current Security Posture
- ✅ Parameterized queries used (server.js uses $1, $2 placeholders)
- ❌ Auth bypass enabled (critical vulnerability)
- ✅ Password hashing in schema (password_hash column)
- ❌ No rate limiting implemented
- ❌ No input validation middleware
- ❌ No CORS configuration verified
- ❌ No security headers (Helmet.js)

### Required Security Controls
1. **Authentication**: Proper Azure AD/MSAL integration (no bypass)
2. **Authorization**: RBAC with role/permission checks
3. **Input Validation**: Joi/Zod schemas for all endpoints
4. **Rate Limiting**: Express-rate-limit
5. **Security Headers**: Helmet.js (CSP, HSTS, X-Frame-Options)
6. **HTTPS/TLS**: Enforce in production
7. **Secrets Management**: Azure Key Vault integration
8. **Audit Logging**: All sensitive operations logged
9. **SQL Injection Prevention**: Parameterized queries (✅ already implemented)
10. **XSS Prevention**: Output escaping, CSP

## Acceptance Criteria for Launch

### Functional Requirements
- [ ] All CRUD operations working for core entities (vehicles, drivers, maintenance, work orders)
- [ ] Authentication working without bypass
- [ ] Authorization enforcing role-based access
- [ ] Real-time GPS tracking functional
- [ ] Reporting and analytics operational
- [ ] Document management working

### Non-Functional Requirements
- [ ] API p95 latency < 500ms
- [ ] Frontend p95 load time < 3s
- [ ] 99.9% uptime SLO
- [ ] WCAG 2.2 AA compliance
- [ ] Mobile responsive (320px - 2560px)
- [ ] Cross-browser support (Chrome, Edge, Firefox, Safari)

### Quality Gates
- [ ] Unit test coverage ≥ 90%
- [ ] Integration test coverage ≥ 85%
- [ ] E2E test coverage ≥ 80%
- [ ] Zero HIGH/CRITICAL CVEs
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)

### Operations Requirements
- [ ] Runbooks created (deploy, rollback, incident response, DR)
- [ ] Monitoring dashboards configured
- [ ] Alerts set up and tested
- [ ] Backup and recovery procedures documented
- [ ] Disaster recovery plan validated

## Next Steps

### Phase 2: Backend Development (Immediate)
1. Fix drivers endpoint with proper JOIN query
2. Verify all existing endpoints work
3. Add missing CRUD endpoints
4. Implement input validation
5. Add rate limiting
6. Configure security headers

### Phase 3: Auth Fix (Immediate)
1. Debug environment variable loading
2. Remove hardcoded SKIP_AUTH flag
3. Test authentication flow end-to-end
4. Verify Azure AD integration

### Phase 4: Testing (High Priority)
1. Run existing Playwright tests
2. Generate test coverage reports
3. Fix failing tests
4. Add missing test coverage

### Phase 5: Production Preparation
1. Create production Dockerfile
2. Set up Kubernetes manifests
3. Configure monitoring
4. Security scan and remediation
5. Performance testing and optimization

### Phase 6: Documentation & Launch
1. Generate OpenAPI spec
2. Create architecture diagrams (Mermaid)
3. Write deployment runbooks
4. Final quality gate verification
5. Launch readiness review

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Auth bypass in production | CRITICAL | High if not fixed | Must fix before deployment |
| Database schema breaking changes | HIGH | Low | Use migrations, test thoroughly |
| Missing test coverage | HIGH | High | Comprehensive test suite required |
| Performance issues under load | MEDIUM | Medium | Load testing, optimization |
| Security vulnerabilities | CRITICAL | Medium | Security scanning, penetration testing |
| Deployment failures | MEDIUM | Low | Staging environment, rollback plan |

## Conclusion

The Fleet-CTA application has a solid foundation with React 18, TypeScript, PostgreSQL, and modern UI components. However, **critical issues must be resolved before production deployment**:

1. **Database schema mismatch** breaks driver management
2. **Hardcoded auth bypass** creates massive security vulnerability
3. **Incomplete API coverage** limits functionality
4. **No comprehensive testing** risks quality

**Estimated Timeline**:
- Phase 2 (Backend Fixes): 4-6 hours
- Phase 3 (Auth Fix): 2-3 hours
- Phase 4 (Testing): 6-8 hours
- Phase 5 (Production Prep): 8-10 hours
- Phase 6 (Documentation): 4-6 hours

**Total**: 24-33 hours to production-ready state

---
**Status**: Requirements analysis complete. Proceeding to Phase 2: Backend Development.
