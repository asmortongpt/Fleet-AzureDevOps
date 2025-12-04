## Task Information

**Task ID:** `<task-id>`
**Phase:** `<phase-number>` - `<phase-name>`
**Assigned Agent:** `<agent-name>` (`<llm-model>`)
**Estimated Hours:** `<hours>`
**Branch:** `<branch-name>`

---

## Summary

<!-- Brief description of changes -->

---

## Implementation Details

### Changes Made

<!-- List all significant changes -->
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Files Modified

<!-- Auto-generated list of modified files -->

### Architecture Impact

<!-- How does this affect the overall architecture? -->

---

## Testing

### Unit Tests
- [ ] All new/modified code has unit tests
- [ ] Unit test coverage at 80%+
- [ ] `npm test` passes locally

### Integration Tests
- [ ] Integration tests added/updated
- [ ] Integration tests pass locally

### E2E Tests
- [ ] E2E tests pass locally
- [ ] No regressions in existing E2E tests

### Manual Testing
- [ ] Manual QA complete for affected modules
- [ ] No visual regressions
- [ ] No functionality regressions

---

## Quality Gates

### Static Analysis
- [ ] `tsc --noEmit` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors/warnings
- [ ] No new security vulnerabilities (`npm audit`)

### Code Quality
- [ ] SRP compliance verified (components <300 lines)
- [ ] No code duplication introduced
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] Meaningful variable/function names

### Performance
- [ ] Bundle size impact verified (no significant increase)
- [ ] No performance regressions
- [ ] Lazy loading still works (if applicable)

---

## Database Evidence

**Evidence ID:** `<evidence-id>`
**Type:** `pr`
**Created:** `<timestamp>`

---

## Review Checklist

### For Code Reviewer Agent
- [ ] Code follows TypeScript best practices
- [ ] No hardcoded secrets or sensitive data
- [ ] Proper input validation (whitelist approach)
- [ ] Parameterized queries used (no string concatenation in SQL)
- [ ] Error boundaries in place
- [ ] Accessibility considerations (ARIA labels, keyboard navigation)
- [ ] Security headers in place (if backend changes)

### For Human Reviewer (if required)
- [ ] Business logic is correct
- [ ] UX/UI changes are acceptable
- [ ] Documentation is adequate
- [ ] Breaking changes are documented

---

## Deployment Notes

<!-- Any special considerations for deployment -->

### Pre-Deployment
- [ ] Database migrations (if any)
- [ ] Environment variables updated (if any)
- [ ] Feature flags configured (if any)

### Post-Deployment
- [ ] Smoke tests to run
- [ ] Monitoring to watch
- [ ] Rollback plan ready

---

## Related

**Dependencies:**
<!-- List task IDs of dependencies -->

**Blocks:**
<!-- List task IDs this PR blocks -->

**Related PRs:**
<!-- List related PR numbers -->

---

## Screenshots (if UI changes)

<!-- Add before/after screenshots -->

---

## Notes

<!-- Any additional notes for reviewers -->

---

🤖 **Generated with Claude Code Orchestrator**

**Co-Authored-By:** Claude <noreply@anthropic.com>
