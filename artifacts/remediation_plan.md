# Remediation Plan - Login & Auth

## Issue
The E2E tests for the Login page are failing. Key UI elements ("Or continue with email", "Need help?") are not being detected by the test runner.

## Root Cause Analysis
- **Hypothesis 1**: Elements are visually hidden or obscured by other elements (e.g. `Separator`).
- **Hypothesis 2**: CSS classes (Dark mode vs Light mode) causing contrast issues making elements "invisible" to Playwright's `toBeVisible()` check.
- **Hypothesis 3**: Rendering crash in the component due to `useAuth` hook or `import.meta.env` issues.

## Action Items

1.  **Refactor Login.tsx**:
    - Ensure `Separator` z-index is lower than text.
    - Check text contrast.
    - Add `data-testid` attributes to critical elements for creating robust locators.

2.  **Update E2E Tests**:
    - Use `getByTestId` where possible.
    - Verify strict visibility requirements.

3.  **Verify Fix**:
    - Rerun `e2e/auth-comprehensive.spec.ts`.

## Code Changes Required
- `src/pages/Login.tsx`: Add `z-10` to the text wrapper. Add `data-testid="login-separator-text"` and `data-testid="login-help-text"`.
