# PHASE 5: Implementation Swarm Execution Plan

## 1. Foundation Hardening (Branch: `fix/security-and-testing`)
**Goal**: Stabilize the platform before feature work.
*   **Security**: Resolve `npm audit` Critical/High findings.
    *   Upgrade `react` & `react-dom` to v19 (matching `@microsoft/applicationinsights-react-js` requirement).
    *   Verify `preact` vulnerability resolution (likely transient dep).
*   **Testing**: Fix E2E test timeouts.
    *   Increase Playwright timeouts to 60s.
    *   Optimize Vite build (investigate `npm run build` slowness).
*   **Config**: Standardize API Port on 3000.

## 2. Feature Workstreams (Parallel Execution)
Once Foundation is passed, we split into branches:

### A. Operations Domain (`feature/operations-baseline`)
*   **Scope**: Vehicles, Drivers, Dispatch.
*   **Tasks**:
    *   Implement "Golden Path": Dispatch -> Driver Accept -> Start Trip -> Complete.
    *   Enforce RBAC: Dispatcher can't see Finance.
    *   Enforce Workflow: Trip state transitions.

### B. Maintenance Domain (`feature/maintenance-baseline`)
*   **Scope**: Work Orders, Parts.
*   **Tasks**:
    *   Implement "Golden Path": Incident -> Work Order -> Repair -> Close.

## 3. Exit Criteria
*   Zero Vulnerabilities (`npm audit` passes).
*   E2E Tests Pass (Green CI).
*   Feature "Golden Paths" verified by E2E.
