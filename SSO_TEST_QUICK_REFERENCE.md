# SSO Test - Quick Reference

## Run the Test

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the test
npx playwright test e2e/sso-final-test.spec.ts --headed --project=chromium
```

## What Happens

1. ✅ Browser opens automatically
2. ✅ Test clears all storage (clean state)
3. ✅ Navigates to login page
4. ✅ Verifies UI elements
5. ✅ Clicks "Sign in with Microsoft"
6. ⏸️ **PAUSES** at Microsoft login page

## When Test Pauses

You'll see instructions:
```
📋 MANUAL LOGIN INSTRUCTIONS:
   1. Enter email: andrew.m@capitaltechalliance.com
   2. Click "Next"
   3. Enter password
   4. Complete MFA if prompted
   5. Accept consent if prompted
   6. Wait for redirect back to application

⏸️  Test paused - Press RESUME in Playwright Inspector
```

## Complete Authentication

1. In the browser window, log in to Microsoft
2. Complete MFA
3. In the Playwright Inspector window, click **Resume** ▶️
4. Test continues automatically

## What Test Checks

After you resume:
- ✅ Redirect back to localhost (not Microsoft)
- ✅ No redirect loop
- ✅ MSAL tokens in sessionStorage
- ✅ Console shows login success message
- ✅ Can access protected routes

## View Results

**After test completes**:
```bash
# Open HTML report
open test-results/sso-final-test/sso-final-test-report.html

# View screenshots
ls test-results/sso-final-test/*.png

# Check JSON report
cat test-results/sso-final-test/sso-final-test-report.json
```

## Success Indicators

✅ **Test PASSES if you see**:
```
✅ Step 1: Login page loaded
✅ Step 2: Login page heading visible
✅ Step 2: Microsoft SSO button visible
✅ Step 3: Redirected to Microsoft login
✅ Step 5: Redirected back to application
✅ Step 6: No redirect loop detected
✅ Step 7: MSAL tokens found
✅ Step 8: MSAL login success message found
✅ Step 9: No console errors
✅ Step 10: Can access protected route
```

## Common Issues

### Issue: "Microsoft SSO button not visible"
**Fix**: Wait a few more seconds for page to fully load, or check if there are JavaScript errors

### Issue: "Redirect loop detected"
**Fix**: This indicates the infinite loop bug - check AuthContext.tsx fixes are applied

### Issue: "No MSAL tokens found"
**Fix**: Authentication may have failed - check console for MSAL errors

## Quick Debug

If test fails, check:
```bash
# View the last screenshot
ls -t test-results/sso-final-test/*.png | head -1 | xargs open

# Check console errors in report
cat test-results/sso-final-test/sso-final-test-report.json | grep -A5 consoleErrors
```

## Re-run Test

```bash
# Clean previous results
rm -rf test-results/sso-final-test

# Run again
npx playwright test e2e/sso-final-test.spec.ts --headed --project=chromium
```

---

**Test File**: `/e2e/sso-final-test.spec.ts`
**Documentation**: `/SSO_TEST_FINAL_SUMMARY.md`
