
# Final Acceptance Testing (FAT) Runbook
**Status**: Ready for Execution
**Phase**: 7 - Production Certification

## 1. Automated Regression Suite (CI/CD)
Run the following commands to verify system stability:

### 1.1 Unit & Integration Tests
```bash
npm run test:api      # Backend Logic
npm run test:unit     # Frontend Components
```

### 1.2 End-to-End Critical Paths
```bash
npx playwright test e2e/auth-comprehensive.spec.ts    # Authentication Flow
npx playwright test e2e/telemetry-analytics.spec.ts   # New Telemetry/Analytics Features
npx playwright test e2e/rbac-permutation.spec.ts      # Security/Permissions
```

## 2. Manual Verification Checklist

### 2.1 Telemetry Dashboard
- [ ] **Data Flow**: Verify vehicle speed/RPM updates every 5s in "Live Fleet" view.
- [ ] **Predictive Widget**: Confirm "Risk Score" cards appear and sort correctly.
- [ ] **Map Integration**: Toggle "Traffic Cameras" layer and verify icons appear.

### 2.2 Cost Analysis Center
- [ ] **Navigation**: Click "Analytics" tab in Fleet Hub.
- [ ] **Data Loading**: "Total Costs" and "Budget Status" cards load without skeletons.
- [ ] **Interaction**: Switch between "Category Breakdown" and "Cost Forecast" tabs.
- [ ] **Export**: Click "Export Report" and verify CSV download starts.

### 2.3 Role-Based Access (RBAC)
- [ ] **Admin**: Full access to all modules.
- [ ] **Driver**: Access to "My Vehicle" only; "Analytics" tab hidden.
- [ ] **Viewer**: Read-only access; "Edit" buttons hidden.

## 3. Performance Benchmarks
- [ ] **Time to Interactive (TTI)**: < 1.5s on Dashboard.
- [ ] **API Latency**: < 200ms for `/api/v1/telemetry`.
- [ ] **Bundle Size**: Initial JS bundle < 500kb (gzip).

## 4. Security Audit
- [ ] **CSP Headers**: Verify `Content-Security-Policy` header is present in response.
- [ ] **Cookies**: Verify `auth_token` is `HttpOnly; Secure; SameSite=Strict`.
- [ ] **Secrets**: Ensure no plain-text secrets in `docker inspect`.
