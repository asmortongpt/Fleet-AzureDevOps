# Pull Request

## Description

Please include a summary of the changes and the related work item. Include relevant motivation and context.

## Related Work Items

- Fixes #[Issue ID]
- Relates to #[Issue ID]

**Azure DevOps Links:**
- Issue: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_workitems/edit/[ISSUE_ID]
- Epic: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_workitems/edit/[EPIC_ID]

## Type of Change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes, no api changes)
- [ ] Performance improvement
- [ ] Security fix

## How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration.

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Smoke tests in staging

**Test Configuration:**
- Node version:
- Database: PostgreSQL (version)
- OS: macOS/Linux/Windows

## Checklist

### Code Quality
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have checked my code for potential security vulnerabilities

### Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Integration tests pass
- [ ] Test coverage is maintained or improved

### Documentation
- [ ] I have made corresponding changes to the documentation
- [ ] I have updated the README if needed
- [ ] API documentation is updated (if applicable)
- [ ] Work item comments document the implementation

### Database & Infrastructure
- [ ] Database migrations are included (if applicable)
- [ ] Migration rollback script is provided (if applicable)
- [ ] Environment variables are documented (if added)
- [ ] Infrastructure changes are documented (if applicable)

### Accessibility & Performance
- [ ] Changes meet WCAG 2.1 AA standards (if UI changes)
- [ ] Keyboard navigation works (if UI changes)
- [ ] Performance impact has been considered
- [ ] No performance regressions introduced

### Deployment
- [ ] Feature flags are implemented (if gradual rollout needed)
- [ ] Rollback procedure is documented (if high-risk changes)
- [ ] Monitoring/alerting is configured (if new critical path)

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Performance Impact

Describe any performance implications:
- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance impact, but acceptable (explain)

**Benchmarks:**
- API response time: [before] → [after]
- Database query time: [before] → [after]
- Memory usage: [before] → [after]

## Security Considerations

- [ ] No security impact
- [ ] Security scan passed
- [ ] Security review required (tag @security-team)

**Security Checklist:**
- [ ] Input validation added
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output escaping)
- [ ] Authentication/authorization checked
- [ ] No secrets in code

## Breaking Changes

If this PR introduces breaking changes, please describe:

### What breaks?

### Migration path?

### Deprecation timeline?

## Additional Notes

Add any other context about the pull request here.

---

## Reviewer Guidelines

**What to look for:**
1. Code quality and maintainability
2. Test coverage and quality
3. Security vulnerabilities
4. Performance implications
5. Documentation completeness
6. Accessibility compliance (WCAG 2.1 AA)

**Before approving:**
- [ ] Code review complete
- [ ] All CI checks passing
- [ ] No unresolved conversations
- [ ] Work item state updated
- [ ] Documentation reviewed

---

**Deployment Plan:**
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor for 24 hours
- [ ] Deploy to production

---

*This PR is part of the FleetManagement project - Enterprise Fleet Management with AI/ML capabilities*

**Project:** https://dev.azure.com/CapitalTechAlliance/FleetManagement
**Build:** [![CI/CD](https://github.com/CapitalTechAlliance/Fleet-AzureDevOps/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/CapitalTechAlliance/Fleet-AzureDevOps/actions/workflows/ci-cd.yml)
