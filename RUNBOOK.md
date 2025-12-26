# Fleet Application Runbook

**Date:** 2025-12-25
**Version:** Production Readiness Release

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Dev Server | `npm run dev` |
| Build Production | `npm run build` |
| Run E2E Tests | `npm run test:e2e` |
| Run Smoke Tests | `npm run test:e2e -- --project=smoke` |
| Run RBAC Tests | `npx playwright test tests/e2e/rbac` |
| View Test Report | `npm run test:e2e:report` |
| Check Lint | `npm run lint` |
| Fix Lint | `npm run lint -- --fix` |

---

## Daily Operations

### Health Check
```bash
# Check application health
curl -s http://localhost:5173 | head -20

# Check API health (if running)
curl -s http://localhost:3001/health
```

### Log Review
```bash
# View recent logs
kubectl logs -f deployment/fleet-app --tail=100

# Search for errors
kubectl logs deployment/fleet-app | grep -i error
```

---

## Incident Response

### Application Not Loading
1. Check if build passes: `npm run build`
2. Clear caches: `rm -rf node_modules/.vite dist`
3. Reinstall dependencies: `npm install`
4. Restart dev server: `npm run dev`

### E2E Tests Failing
1. Check if dev server is running
2. Run in headed mode: `npx playwright test --headed`
3. View trace: `npx playwright show-trace test-results/*/trace.zip`
4. Check LIVE_TESTING_GUIDE.md for debugging

### Authentication Issues
1. Verify environment variables are set
2. Check AuthContext.tsx for configuration
3. Clear browser localStorage
4. Verify API backend is running

### Access Denied Errors
1. Check user role in RoleSwitcher (dev mode)
2. Verify RBAC_BASELINE.md for permissions
3. Check navigation.tsx for role requirements

---

## Scheduled Maintenance

### Weekly
- [ ] Review error logs
- [ ] Run full E2E test suite
- [ ] Check bundle sizes
- [ ] Update dependencies (minor)

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Dependency updates (major)
- [ ] RBAC audit

---

## Contacts

| Role | Contact |
|------|---------|
| DevOps | devops@morton-tech.com |
| Backend | api-team@morton-tech.com |
| Frontend | ui-team@morton-tech.com |

---

## Key Files

| File | Purpose |
|------|---------|
| src/App.tsx | Main app routing |
| src/lib/navigation.tsx | Navigation items & RBAC |
| src/pages/*.tsx | Hub pages |
| src/components/ui/hub-page.tsx | Hub layout component |
| tests/e2e/rbac*.spec.ts | RBAC tests |

---

## Emergency Procedures

### Rollback
```bash
kubectl rollout undo deployment/fleet-app
```

### Scale Down
```bash
kubectl scale deployment/fleet-app --replicas=0
```

### Restart All Pods
```bash
kubectl rollout restart deployment/fleet-app
```
