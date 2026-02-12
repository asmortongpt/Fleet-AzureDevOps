# Fleet-CTA: Production Deployment Checklist
**Created:** February 10, 2026
**Version:** 1.0
**Purpose:** Step-by-step checklist for production deployment readiness

---

## 🔴 CRITICAL - Must Complete Before ANY Deployment

### 1. Security Fixes (Priority: CRITICAL)

- [ ] **Remove Auth Bypass Hardcode**
  - File: `src/components/auth/ProtectedRoute.tsx`
  - Line: 23
  - Change:
    ```typescript
    // ❌ REMOVE THIS
    const SKIP_AUTH = true;

    // ✅ REPLACE WITH THIS
    const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
    ```
  - Verify `.env.production` does NOT set `VITE_SKIP_AUTH`

- [ ] **Update CORS Configuration**
  - File: `api-standalone/server.js` or `api/src/server.ts`
  - Change:
    ```javascript
    // ❌ REMOVE THIS
    res.header('Access-Control-Allow-Origin', '*');

    // ✅ REPLACE WITH THIS
    const allowedOrigins = [
      'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    ```

- [ ] **Remove Database Credential Defaults**
  - File: `api-standalone/server.js`
  - Remove hardcoded fallback values
  - Ensure all values come from environment variables or Azure Key Vault

- [ ] **Verify No Secrets in Code**
  - Run: `grep -r "password\|secret\|key" --include="*.ts" --include="*.tsx" src/ | grep -v "// "`
  - Ensure all secrets are in environment variables only

### 2. TypeScript Errors (Priority: CRITICAL)

- [ ] **Fix Three.js Type Errors**
  - Files: `src/components/3d/VehicleViewer3D.tsx`, `src/components/documents/viewer/3DViewer.tsx`
  - Solution 1: Install types: `npm install --save-dev @types/three @react-three/fiber`
  - Solution 2: Add custom declarations in `src/types/three.d.ts`

- [ ] **Fix Recharts Type Errors**
  - File: `src/components/ChartCard.tsx`
  - Fix import: Use standard recharts imports instead of deep imports

- [ ] **Fix Implicit 'any' Types**
  - Files: `.storybook/decorators.tsx`, various component files
  - Add proper type annotations to all function parameters

- [ ] **Fix Property Access Errors**
  - Update User type definition to include 'name' property
  - Fix never types in VehicleDetailView calculations
  - Complete DocumentViewerState interface

- [ ] **Verify TypeScript Passes**
  - Run: `npm run typecheck`
  - Expected: 0 errors

### 3. Production Build (Priority: CRITICAL)

- [ ] **Create Production Build**
  ```bash
  npm run build
  ```

- [ ] **Verify Build Success**
  - Check `dist/` folder exists
  - Check for build warnings
  - Verify bundle size is reasonable (< 2MB total)

- [ ] **Test Production Build Locally**
  ```bash
  npm run preview
  ```
  - Navigate to http://localhost:4173
  - Test key user flows:
    - [ ] Login/Authentication
    - [ ] Fleet Hub loads with data
    - [ ] Operations Hub loads
    - [ ] Drivers Hub loads
    - [ ] Maintenance Hub loads
    - [ ] Maps display correctly
    - [ ] Charts render correctly
    - [ ] 3D vehicle viewer works

- [ ] **Analyze Bundle Size**
  ```bash
  npm run build -- --mode=production
  ```
  - Check largest chunks
  - Verify code splitting is working
  - Target: Initial bundle < 500KB

---

## 🟡 HIGH PRIORITY - Complete Before Staging Deployment

### 4. API & Backend Verification

- [ ] **Verify All API Endpoints**
  ```bash
  # Test each endpoint
  curl http://localhost:3000/health
  curl http://localhost:3000/api/v1/vehicles
  curl http://localhost:3000/api/v1/drivers
  # ... test all endpoints
  ```

- [ ] **Fix API Routing Issues**
  - Ensure `/api/vehicles` or `/api/v1/vehicles` is accessible
  - Verify frontend is using correct API URLs
  - Check environment variable `VITE_API_URL` is set correctly

- [ ] **Test Database Connection**
  - Verify PostgreSQL connection in production environment
  - Test RLS (Row Level Security) policies
  - Verify multi-tenant isolation

- [ ] **Implement Rate Limiting**
  - Protect API endpoints from abuse
  - Use express-rate-limit or similar

- [ ] **Add Request Validation**
  - Validate all input parameters
  - Sanitize user inputs
  - Implement proper error handling

### 5. Authentication & Authorization

- [ ] **Test Azure AD Integration**
  - Test login flow end-to-end
  - Verify token refresh works
  - Test logout
  - Test session persistence

- [ ] **Verify RBAC Works**
  - Test admin role access
  - Test staff role access
  - Test driver role access
  - Verify permission-based UI rendering

- [ ] **Test Multi-Tenant Isolation**
  - Create test data for multiple tenants
  - Verify Tenant A cannot access Tenant B data
  - Test tenant context switching

### 6. Testing & Quality Assurance

- [ ] **Run E2E Test Suite**
  ```bash
  npx playwright test
  ```
  - Target: >95% pass rate
  - Review and fix any failing tests

- [ ] **Run Accessibility Tests**
  ```bash
  npm run test:a11y
  ```
  - Target: 0 WCAG 2.1 AA violations

- [ ] **Run Security Audit**
  ```bash
  npm audit --production
  ```
  - Fix all HIGH and CRITICAL vulnerabilities

- [ ] **Run Performance Tests**
  ```bash
  npx playwright test tests/performance/
  ```
  - Verify page load times < 3s
  - Check API response times < 500ms

- [ ] **Lighthouse Audit**
  - Open production build in Chrome DevTools
  - Run Lighthouse audit
  - Target scores:
    - Performance: > 90
    - Accessibility: > 90
    - Best Practices: > 90
    - SEO: > 90

### 7. Environment Configuration

- [ ] **Create Production .env File**
  - Copy from `.env.production.template`
  - Fill in all required values
  - Store in Azure Key Vault or secure secret management

- [ ] **Verify Environment Variables**
  - [ ] `VITE_API_URL` - Production API URL
  - [ ] `VITE_AZURE_AD_CLIENT_ID` - Azure AD client ID
  - [ ] `VITE_AZURE_AD_TENANT_ID` - Azure AD tenant ID
  - [ ] `VITE_AZURE_AD_REDIRECT_URI` - Production redirect URI
  - [ ] `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
  - [ ] `VITE_APP_INSIGHTS_KEY` - Application Insights key
  - [ ] Backend: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - [ ] Backend: `NODE_ENV=production`

- [ ] **Configure Azure Key Vault**
  - Store all secrets in Key Vault
  - Configure Managed Identity for access
  - Test secret retrieval

### 8. Monitoring & Observability

- [ ] **Configure Application Insights**
  - Verify instrumentation key is correct
  - Test telemetry is being sent
  - Create custom dashboards

- [ ] **Set Up Alerts**
  - Error rate > 5%
  - Response time > 3s
  - Failed requests > 10/min
  - Database connection failures

- [ ] **Configure Logging**
  - Structured logging in place
  - Log levels configured (INFO for production)
  - Sensitive data not logged

- [ ] **Health Checks**
  - Implement `/health` endpoint (already exists ✅)
  - Implement `/readiness` endpoint
  - Implement `/liveness` endpoint

---

## 🟢 MEDIUM PRIORITY - Complete Before Production Deployment

### 9. Documentation

- [ ] **API Documentation**
  - Generate OpenAPI/Swagger docs
  - Document all endpoints, parameters, responses
  - Include authentication requirements
  - Add example requests/responses

- [ ] **Deployment Runbook**
  - Step-by-step deployment instructions
  - Rollback procedures
  - Common troubleshooting steps
  - Contact information for support

- [ ] **Architecture Diagrams**
  - System architecture diagram
  - Data flow diagram
  - Network diagram
  - Security architecture

- [ ] **User Documentation**
  - User guide for each hub
  - Admin guide
  - FAQ section
  - Video tutorials (optional)

### 10. Infrastructure & DevOps

- [ ] **Set Up CI/CD Pipeline**
  - GitHub Actions workflow for build
  - Automated testing in pipeline
  - Automated deployment to staging
  - Manual approval for production

- [ ] **Configure Azure Static Web Apps**
  - Verify deployment token
  - Configure custom domain
  - Enable HTTPS
  - Configure caching headers

- [ ] **Set Up Backend Hosting**
  - Azure App Service or AKS
  - Auto-scaling rules
  - Load balancer
  - SSL/TLS certificates

- [ ] **Database Setup**
  - Azure Database for PostgreSQL
  - Automated backups enabled
  - Point-in-time recovery configured
  - Firewall rules configured

- [ ] **CDN Configuration**
  - Azure CDN for static assets
  - Cache rules configured
  - Compression enabled
  - Global distribution

### 11. Security Hardening

- [ ] **Implement Security Headers**
  - Use Helmet.js in Express
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security

- [ ] **Enable HTTPS Everywhere**
  - Force HTTPS redirect
  - HSTS enabled
  - Secure cookies (httpOnly, secure, sameSite)

- [ ] **Rate Limiting**
  - API rate limits per user/IP
  - Login attempt limits
  - File upload limits

- [ ] **Input Validation & Sanitization**
  - All user inputs validated
  - SQL injection prevention (parameterized queries ✅)
  - XSS prevention
  - CSRF tokens

- [ ] **Dependency Security**
  - Run `npm audit` regularly
  - Keep dependencies updated
  - Use Dependabot or Renovate
  - Review dependency licenses

### 12. Performance Optimization

- [ ] **Code Splitting**
  - Verify route-based code splitting
  - Lazy load heavy components (3D, maps, charts)
  - Analyze bundle with `npm run build -- --analyze`

- [ ] **Image Optimization**
  - Compress all images
  - Use appropriate formats (WebP, AVIF)
  - Implement lazy loading
  - Use responsive images

- [ ] **Caching Strategy**
  - Browser caching for static assets
  - Service Worker for offline support
  - API response caching where appropriate
  - Redis for session/data caching

- [ ] **Database Optimization**
  - Index frequently queried columns
  - Optimize slow queries
  - Implement connection pooling (already done ✅)
  - Consider read replicas for scaling

---

## 📋 Pre-Deployment Final Checks

### 13. Staging Deployment

- [ ] **Deploy to Staging**
  - Deploy frontend to staging URL
  - Deploy backend to staging API
  - Point to staging database

- [ ] **Smoke Testing in Staging**
  - [ ] Login works
  - [ ] All hubs load
  - [ ] Data displays correctly
  - [ ] CRUD operations work
  - [ ] Maps display correctly
  - [ ] Charts render correctly
  - [ ] File uploads work
  - [ ] Search works
  - [ ] Filters work

- [ ] **Load Testing**
  - Simulate 100+ concurrent users
  - Test API under load
  - Verify auto-scaling works
  - Check database performance

- [ ] **User Acceptance Testing (UAT)**
  - Business stakeholders test key flows
  - Collect feedback
  - Fix critical issues
  - Obtain sign-off

### 14. Production Deployment

- [ ] **Pre-Deployment**
  - [ ] All checklist items above completed
  - [ ] Backup current production (if applicable)
  - [ ] Rollback plan documented and tested
  - [ ] Team notified of deployment
  - [ ] Maintenance window scheduled (if needed)

- [ ] **Deploy Frontend**
  ```bash
  # Build production assets
  npm run build

  # Deploy to Azure Static Web Apps
  # (automated via GitHub Actions)
  ```

- [ ] **Deploy Backend**
  ```bash
  # Deploy API to Azure App Service or AKS
  # (automated via CI/CD pipeline)
  ```

- [ ] **Deploy Database Migrations**
  ```bash
  # Run migrations in production
  npm run migrate:prod
  ```

- [ ] **Post-Deployment Verification**
  - [ ] Health check passes: https://api.fleet-cta.com/health
  - [ ] Frontend loads: https://fleet-cta.com
  - [ ] Login works
  - [ ] Critical flows work
  - [ ] No errors in Application Insights
  - [ ] Performance metrics normal

### 15. Post-Deployment

- [ ] **Monitor for 1 Hour**
  - Watch Application Insights dashboards
  - Check error rates
  - Monitor response times
  - Check database connections

- [ ] **Test Key Flows**
  - [ ] Login/logout
  - [ ] Fleet Hub
  - [ ] Create/update vehicle
  - [ ] Driver management
  - [ ] Maintenance scheduling
  - [ ] Reports generation

- [ ] **User Communication**
  - Notify users deployment is complete
  - Share release notes
  - Provide support contact info

- [ ] **Documentation Update**
  - Update deployment log
  - Document any issues encountered
  - Update runbooks if needed

---

## 🔄 Rollback Plan

### If Issues Occur During/After Deployment:

**Immediate Actions:**
1. Stop deployment if in progress
2. Notify team
3. Assess severity (P0-Critical, P1-High, P2-Medium, P3-Low)

**Rollback Decision:**
- P0 (Critical - System down): Immediate rollback
- P1 (High - Major feature broken): Rollback if no quick fix
- P2 (Medium - Minor issue): Fix forward if possible
- P3 (Low - Cosmetic): Fix in next deployment

**Rollback Steps:**

**Frontend:**
```bash
# Redeploy previous version via Azure Portal
# or
# Revert git commit and redeploy
git revert <commit-hash>
git push origin main
```

**Backend:**
```bash
# Redeploy previous container/image
# or
# Rollback in Azure App Service portal
```

**Database:**
```bash
# If migrations were run, rollback migrations
npm run migrate:rollback
```

**Verification:**
- [ ] System operational
- [ ] No errors in logs
- [ ] Users can access system
- [ ] Critical flows work

---

## ✅ Sign-Off

### Required Approvals Before Production:

- [ ] **Technical Lead** - Architecture & code quality verified
  - Name: ________________
  - Date: ________________

- [ ] **Security Team** - Security audit passed
  - Name: ________________
  - Date: ________________

- [ ] **QA Team** - All tests passed, UAT complete
  - Name: ________________
  - Date: ________________

- [ ] **DevOps Team** - Infrastructure ready, monitoring configured
  - Name: ________________
  - Date: ________________

- [ ] **Product Owner** - Features accepted, release approved
  - Name: ________________
  - Date: ________________

---

## 📊 Deployment Metrics

**Target Metrics:**
- Deployment success rate: > 95%
- Rollback rate: < 5%
- Downtime: < 5 minutes
- Mean time to recovery (MTTR): < 30 minutes
- Post-deployment error rate: < 1%

**Track:**
- Deployment start time: ________________
- Deployment end time: ________________
- Duration: ________________
- Issues encountered: ________________
- Rollbacks needed: ________________

---

**Last Updated:** February 10, 2026
**Maintained By:** DevOps Team
**Review Frequency:** After each deployment
