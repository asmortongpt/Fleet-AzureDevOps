# Fleet Repository Merge Checklist
## Generated: 2026-01-02 | Analysis: 906 files from 7 repos

---

## ✅ Priority 1: CRITICAL - Merge Immediately

### Database & Schema
- [ ] `api/init-core-schema.sql` (234 lines)
  - Source: `/tmp/fleet-analysis-results-1767396568/Fleet-api_init-core-schema.sql.diff`
  - Target: `api/init-core-schema.sql`
  - Impact: 9 core tables (vehicles, drivers, routes, fuel, GPS, work_orders, facilities, inspections, incidents)
  - Verification: Run SQL in PostgreSQL, verify 11 indexes created

- [ ] `api/seed-sample-data.sql` (67 lines)
  - Source: `/tmp/fleet-analysis-results-1767396568/Fleet-api_seed-sample-data.sql.diff`
  - Target: `api/seed-sample-data.sql`
  - Impact: 7 vehicles, 5 drivers, 3 facilities, work orders, fuel transactions, routes (Tallahassee GPS data)
  - Verification: Query `SELECT COUNT(*) FROM vehicles;` should return 7

- [ ] `scripts/init-orchestration-db.sql` (72 lines)
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-scripts_init-orchestration-db.sql.diff`
  - Target: `scripts/init-orchestration-db.sql`
  - Impact: Agent orchestration (projects, tasks, agents, assignments, evidence tables)
  - Verification: Check 5 indexes created

### Security & Authentication
- [ ] `apps/api/src/middleware/security.ts` (NEW FILE - 500+ lines)
  - Source: Identified in agent analysis
  - Features: JWT auth, rate limiting, RBAC/PBAC, input sanitization, security headers
  - Verification: Test rate limiting (100/15min), validate JWT structure

- [ ] `apps/api/src/auth/authService.ts` (NEW FILE - enterprise auth)
  - Source: Identified in agent analysis
  - Features: bcrypt (cost 12), token management, session tracking, password validation
  - Verification: Test login endpoint, verify bcrypt cost factor

### API Routes
- [ ] `apps/api/src/routes/auth.ts` (register, login, me endpoints)
- [ ] `apps/api/src/routes/vehicles.ts` (CRUD with pagination)
- [ ] `apps/api/src/routes/health.ts` (health check)
- [ ] `apps/api/src/routes/orchestration.ts` (multi-agent execution)

### CORS Configuration
- [ ] `api/src/middleware/corsConfig.ts`
  - Added ports: 5174, 5175, 5176 for development
  - Verification: Test CORS from localhost:5174

---

## ✅ Priority 2: HIGH - Merge After Priority 1

### Foundational UI Components
- [ ] `src/components/shared/StandardButton.tsx` (NEW)
  - Standards: Nielsen's heuristics, Fitts's Law (44px minimum)
  - Variants: primary, secondary, danger, ghost
  - Verification: Visual regression test all variants

- [ ] `src/components/shared/SkeletonLoader.tsx` (NEW)
  - Variants: text, rectangular, circular, table
  - Dark mode support
  - Verification: Test all variants in light/dark mode

- [ ] `src/components/shared/EmptyState.tsx` (NEW)
  - Custom icon support, action button
  - Accessibility attributes
  - Verification: Screen reader testing

### Enhanced Components
- [ ] `src/components/dashboard/LiveFleetDashboard.tsx` (MODIFIED)
  - Fixed API response parsing (handles array or wrapped object)
  - Dark mode support (semantic Tailwind tokens)
  - Verification: Test with mock API returning both formats

- [ ] `src/components/common/NotificationBell.tsx` (ENHANCED)
  - Offline resilience, max 3 retries
  - Smart error logging
  - Verification: Test offline behavior

- [ ] `src/components/panels/DriverControlPanel.tsx` (ENHANCED)
  - Optional chaining for null safety
  - Verification: Test with null driver data

### Theme System
- [ ] `src/components/providers/ThemeProvider.tsx` (if not exists)
- [ ] `src/components/ThemeToggle.tsx` (ENHANCED)
  - System/light/dark theme switching
  - Verification: Toggle between all 3 modes

- [ ] `src/components/layout/CommandCenterLayout.tsx` (ENHANCED)
  - Semantic colors: `bg-background`, `text-foreground`, `bg-card`
  - Verification: Test light/dark theme switching

- [ ] `src/components/layout/MapFirstLayout.tsx` (ENHANCED)
  - Semantic colors, improved hover states
  - Verification: Test all interactive states

### Feature Flags & Hooks
- [ ] `src/hooks/usePostHogFeatureFlag.tsx` (NEW - 6 hooks)
  - usePostHogFeatureFlag, usePostHogFeatureFlagVariant, usePostHogFeatureFlags
  - useExperiment, useFeatureGate, useActiveFeatureFlags
  - Verification: Test with PostHog dashboard

### Routing
- [ ] `src/App.tsx` (ENHANCED)
  - Added `google-maps-test` route
  - Lazy-loaded GoogleMapsTestPage
  - Verification: Navigate to `/google-maps-test`

- [ ] `src/main.tsx` (ENHANCED)
  - ThemeProvider wrapper integration
  - Verification: Verify provider hierarchy

---

## ✅ Priority 3: MEDIUM - Merge When Ready

### Production Infrastructure

#### Docker
- [ ] `Dockerfile.frontend` (NEW - untracked file)
  - Multi-stage build (5 stages)
  - Non-root user (uid 1001)
  - Alpine Linux base
  - Verification: `docker build -t fleet-frontend .`

- [ ] `fleet-showroom/Dockerfile` (NEW)
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-Dockerfile.diff`
  - Verification: Build and run locally

- [ ] `docker-compose.production.yml` (NEW)
  - 8 services: PostgreSQL, Redis, API×2, Web×2, Prometheus, Grafana, Loki, HAProxy
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-docker-compose.production.yml.diff`
  - Verification: `docker-compose -f docker-compose.production.yml up -d`

#### CI/CD Pipelines
- [ ] `.github/workflows/azure-static-web-apps-production.yml` (NEW)
  - Azure Static Web Apps deployment
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-local-.github_workflows_azure-static-web-apps-production.yml.diff`
  - Verification: Trigger workflow dispatch

- [ ] `.github/workflows/ci-cd.yml` (NEW - 526 lines)
  - 9-job pipeline: security, quality, test, build, performance, deploy staging/prod, cleanup
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-.github_workflows_ci-cd.yml.diff`
  - Verification: Push to trigger pipeline

- [ ] `.github/workflows/ci-cd-production.yml` (NEW - 401 lines)
  - Blue-Green deployment with smoke tests
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-.github_workflows_ci-cd-production.yml.diff`
  - Verification: Check Slack notifications

#### Kubernetes
- [ ] `k8s/staging/deployment.yaml` (NEW - 193 lines)
  - 2 replicas, RollingUpdate, health checks
  - Source: `/tmp/fleet-analysis-results-1767396568/fleet-showroom-k8s_staging_deployment.yaml.diff`
  - Verification: `kubectl apply -f k8s/staging/`

- [ ] `k8s/staging/service.yaml` (NEW - 56 lines)
  - LoadBalancer + ClusterIP services
  - Verification: `kubectl get svc`

### Utility Code
- [ ] `src/lib/websocket-client.ts` (ENHANCED)
  - Proper close codes (1000 for normal close)
  - Verification: Test WebSocket connection lifecycle

- [ ] `src/lib/monitoring/performance-monitoring.ts` (ENHANCED)
  - FID → INP migration
  - Verification: Check Web Vitals reporting

- [ ] `src/lib/monitoring/rum.ts` (ENHANCED)
  - Development mode detection
  - Verification: Test in dev vs production

- [ ] `src/components/UniversalMap/utils/provider.ts` (ENHANCED)
  - Google Maps script deduplication
  - Verification: Load map multiple times

- [ ] `src/lib/navigation.tsx` (ENHANCED)
  - Added Google Maps test route
  - Verification: Check admin navigation menu

- [ ] `fleet-showroom/apps/web/src/utils/WebGLCompatibility.tsx` (NEW)
  - WebGL capability detection
  - Verification: Test on low-end devices

- [ ] `fleet-showroom/apps/web/src/utils/AlternativePerformanceMonitor.tsx` (NEW)
  - Performance tracking without Memory API
  - Verification: Monitor FPS and resource usage

- [ ] `api/src/config/worker-pool.ts` (ENHANCED)
  - Worker timeout management
  - Verification: Test CPU-intensive tasks

- [ ] `api/src/services/websocket_server.ts` (ENHANCED)
  - Proper close codes, JWT validation
  - Verification: Test WebSocket auth flow

### API Hooks
- [ ] `src/hooks/use-api.ts` (ENHANCED)
  - Flexible response handling (`json.data || json`)
  - Verification: Test with all API endpoints

### State Management
- [ ] `src/contexts/GlobalStateContext.tsx` (ENHANCED)
  - SkeletonLoader integration
  - Verification: Test loading states

### Package Dependencies
- [ ] `package.json` (MODIFIED)
  - Added: bcrypt@^6.0.0, pg@^8.16.3, ws@^8.18.3, vitest@^4.0.16
  - Verification: `npm install` and verify no conflicts

- [ ] `fleet-showroom/apps/web/package.json` (MODIFIED)
  - Added: @react-spring/web, @react-three/postprocessing, tailwindcss@^4.1.13
  - Verification: `pnpm install` in monorepo

### TypeScript Config
- [ ] `tsconfig.json` (MODIFIED)
  - Excluded: `**/*.bak/**`, `**/**.bak`
  - Verification: Build succeeds

- [ ] `fleet-showroom/apps/web/tsconfig.app.json` (MODIFIED)
  - Disabled strict linting (noUnusedLocals, noUnusedParameters)
  - Verification: Type check passes

### Testing
- [ ] `src/tests/components/VehicleCard.test.tsx` (NEW)
  - Vitest + React Testing Library
  - Verification: `npm test`

- [ ] `src/__tests__/integration/showroom-integration.test.ts` (NEW)
  - Material system, camera presets, WebGL compatibility
  - Verification: Run integration tests

- [ ] `api/tests/integration/websocket.test.ts` (NEW)
  - WebSocket connection lifecycle
  - Verification: Run WebSocket tests

- [ ] `tests/e2e/e2e-map-test.spec.ts` (NEW - Playwright)
  - 9 endpoint tests (health, vehicles, drivers, facilities, work orders, fuel, etc.)
  - Verification: `npx playwright test e2e-map-test`

- [ ] `tests/e2e/google-maps-validation.spec.ts` (NEW - 183 lines)
  - Map rendering, vehicle markers, error tracking
  - Verification: `npx playwright test google-maps-validation`

- [ ] `src/tests/fixtures/index.ts` (NEW - 201 lines)
  - Centralized mock data factories
  - Verification: Import in test files

- [ ] `src/tests/mocks/websocket-server.ts` (NEW)
  - Mock WebSocket server for testing
  - Verification: Check port 8080 availability

- [ ] `src/tests/setup.ts` (NEW)
  - Global test setup (WebSocket server, matchMedia mock)
  - Verification: Tests run successfully

- [ ] `tests/e2e/setup/global-setup.ts` (NEW - 152 lines)
  - Database initialization, test users, test vehicles
  - Verification: Check PostgreSQL test database

- [ ] `tests/e2e/setup/global-teardown.ts` (NEW)
  - Database cleanup, auth state removal
  - Verification: Verify clean teardown

- [ ] `comprehensive-functionality-test.cjs` (NEW - 132 lines)
  - Multi-route testing, API validation
  - Verification: `node comprehensive-functionality-test.cjs`

### Documentation (275+ files)
- [ ] `AUTONOMOUS_DEPLOYMENT_READY.md` (402 lines)
- [ ] `DEPLOYMENT_SUCCESS_SUMMARY.md` (433 lines)
- [ ] `scripts/AGENT_SYSTEM_README.md` (603 lines)
- [ ] 93 module enhancement docs (31 modules × 3 files)
- [ ] 8 vehicle model README files
- [ ] All status and verification reports

---

## 🚨 Pre-Merge Verification

### Database
- [ ] No table naming conflicts with existing schema
- [ ] Foreign key constraints valid
- [ ] Index naming conventions consistent (idx_* prefix)
- [ ] Timezone handling correct (TIMESTAMP WITH TIME ZONE)
- [ ] UUID generation compatible with PostgreSQL version
- [ ] Multi-tenant isolation verified (tenant_id column)

### Security
- [ ] All queries parameterized ($1, $2, $3) - no string concatenation
- [ ] bcrypt cost factor = 12 (minimum)
- [ ] JWT validation includes structure checking (id, email, role)
- [ ] Rate limiting configured correctly
- [ ] Security headers present (CSP, HSTS, X-Frame-Options)
- [ ] No hardcoded secrets (all env vars)

### Frontend
- [ ] Dark mode works in all components
- [ ] Accessibility standards met (WCAG AA minimum)
- [ ] Touch targets minimum 44px (Fitts's Law)
- [ ] Loading states use SkeletonLoader
- [ ] Error boundaries configured
- [ ] Theme provider wraps app correctly

### Testing
- [ ] All tests pass: `npm test`
- [ ] E2E tests pass: `npx playwright test`
- [ ] Integration tests pass
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`

### Deployment
- [ ] Docker images build successfully
- [ ] docker-compose stack starts cleanly
- [ ] Kubernetes manifests apply without errors
- [ ] Health checks return 200 OK
- [ ] Environment variables documented

---

## 📝 Post-Merge Tasks

1. **Tag Release**
   ```bash
   git tag -a v2.0.0 -m "Major release: Fleet management system with multi-agent orchestration"
   git push origin v2.0.0
   ```

2. **Update Documentation**
   - Update README.md with new features
   - Document new API endpoints
   - Update deployment guide

3. **Deploy to Staging**
   - Trigger CI/CD pipeline
   - Run smoke tests
   - Verify all endpoints

4. **Performance Testing**
   - Run Lighthouse CI
   - Load testing with Artillery
   - Monitor Core Web Vitals

5. **Monitor Production**
   - Check error rates in Sentry/DataDog
   - Verify PostHog analytics
   - Review RUM metrics

---

## 🎯 Estimated Timeline

- **Priority 1 (CRITICAL):** 2-4 hours
- **Priority 2 (HIGH):** 4-6 hours
- **Priority 3 (MEDIUM):** 8-12 hours
- **Total:** 14-22 hours of merge work

---

## 📞 Contact & Support

If you encounter issues during merge:
1. Check agent analysis reports in `/tmp/fleet-analysis-results-1767396568/`
2. Review individual diff files for context
3. Test each component in isolation before integration testing

---

**Generated by:** 8-Agent Multi-Repository Analysis System
**Analysis Date:** January 2, 2026
**Total Files Analyzed:** 906 diff files from 7 Fleet repositories
**Repositories:** Fleet, fleet-connect, fleet-local, fleet-showroom, fleet-production, CTAFleet, Fleet-Management
