# Authentication Debugging Quick Reference

**Last Updated:** 2026-01-26
**Purpose:** Fast reference for debugging SSO authentication issues

---

## Quick Diagnosis Checklist

### ✅ User Can't Login (Redirects Back to Login)

**Check these logs in order:**

1. **MSAL Init:**
   ```
   [MSAL] Initialization complete: {totalAccounts: N, hasActiveAccount: boolean}
   ```
   - If `totalAccounts: 0` → User not logged in with Microsoft (expected)
   - If `hasActiveAccount: false` but `totalAccounts > 0` → Active account not set

2. **Auth Init:**
   ```
   [Auth] Initializing authentication {hasAccounts: boolean, accountCount: N, inProgress: "none"|"startup"}
   ```
   - If `inProgress: "startup"` → MSAL still processing, wait
   - If `hasAccounts: false` → No MSAL accounts found

3. **MSAL Check:**
   ```
   [Auth] MSAL check: {allConditionsMet: boolean}
   ```
   - If `false` → Check individual conditions
   - If `true` → Should create user object next

4. **User Created:**
   ```
   [Auth] MSAL authentication successful - user object set
   ```
   - If missing → MSAL conditions not met OR fell back to cookie auth

5. **Protected Route:**
   ```
   [ProtectedRoute] Render check: {isAuthenticated: boolean, hasUser: boolean}
   ```
   - If `isAuthenticated: false` → User object not set
   - If redirecting → Authentication failed

---

## Common Issues & Fixes

### Issue: "MSAL initialization logs not showing"

**Cause:** MSAL not initializing
**Fix:** Check `src/main.tsx` for `msalInstance.initialize()` before `ReactDOM.createRoot()`

```typescript
// Should be:
validateStartupConfiguration().then(() => {
  return msalInstance.initialize(); // <-- Must be here!
}).then(() => {
  ReactDOM.createRoot(...).render(...)
});
```

---

### Issue: "User logged in but immediately redirected to login"

**Cause:** User object not persisting
**Symptoms:**
```
[Auth] MSAL authentication successful - user object set
[ProtectedRoute] Render check: {isAuthenticated: false, hasUser: false}
```

**Fix:** Check useEffect dependency array in `AuthContext.tsx`:
```typescript
useEffect(() => {
  initAuth();
}, [firstAccount?.localAccountId, inProgress]);
```

---

### Issue: "Infinite render loop"

**Symptoms:**
```
Error: Maximum update depth exceeded
```

**Cause:** Dependencies changing on every render
**Fix:** Check MSAL value memoization:
```typescript
const accountCount = accounts.length; // primitive, not array
const hasAccounts = accountCount > 0;
const firstAccount = useMemo(() => accounts[0], [accountCount]);
```

---

### Issue: "MSAL accounts exist but not detected"

**Symptoms:**
```
[MSAL] Initialization complete: {totalAccounts: 1}
[Auth] MSAL check: {hasAccounts: false}
```

**Cause:** Timing issue - accounts loaded after AuthContext mount
**Fix:** Verify `inProgress` is "none":
```typescript
// Should be:
if (hasAccounts && firstAccount && inProgress === InteractionStatus.None) {
  // Create user
}
```

---

## Environment Variables

**Required for MSAL:**
```bash
VITE_AZURE_AD_CLIENT_ID=<your-client-id>
VITE_AZURE_AD_TENANT_ID=<your-tenant-id>
```

**Optional (Development Only):**
```bash
VITE_SKIP_AUTH=true  # Bypass authentication (dev/test only)
```

---

## Manual Testing Steps

1. **Clear Storage:**
   ```javascript
   sessionStorage.clear();
   localStorage.clear();
   ```

2. **Open Console:** F12 → Console tab

3. **Navigate:** http://localhost:5173/login

4. **Click:** "Sign in with Microsoft"

5. **Watch Logs:**
   - MSAL init
   - MSAL login event
   - Auth init
   - User created
   - Protected route allows access

6. **Verify:** No redirect back to login

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | MSAL initialization |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/components/ProtectedRoute.tsx` | Route protection |
| `src/lib/msal-config.ts` | MSAL configuration |
| `e2e/verify-infinite-loop-fix.spec.ts` | E2E test |

---

## Useful Commands

```bash
# Run dev server
npm run dev

# Run E2E tests
npx playwright test e2e/verify-infinite-loop-fix.spec.ts

# Check MSAL configuration
cat src/lib/msal-config.ts

# Check environment variables
cat .env | grep VITE_AZURE
```

---

## Emergency Rollback

If authentication breaks production:

1. **Revert commit:**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Disable MSAL (temporary):**
   ```bash
   # In .env
   VITE_SKIP_AUTH=true
   ```
   **⚠️ WARNING:** Only for emergency dev access!

---

## Support

For detailed information, see:
- **Analysis:** `AUTHCONTEXT_MSAL_ANALYSIS.md`
- **Summary:** `AUTHCONTEXT_FIX_SUMMARY.md`
