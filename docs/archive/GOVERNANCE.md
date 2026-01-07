# Fleet Repository Governance Policy

**Effective Date**: December 31, 2025
**Version**: 1.0
**Status**: 🔒 ENFORCED

---

## Mission Statement

The Fleet repository (`asmortongpt/fleet`) is the **single source of truth** for all Fleet application code, features, and documentation. This governance policy ensures code quality, prevents repository sprawl, and maintains a sustainable development workflow.

---

## Core Principles

### 1. Single Source of Truth
- **ONE repository** for all Fleet development
- **NO new Fleet repositories** without explicit written approval
- All features developed as Git branches, NOT separate repositories

### 2. Quality First
- All code must pass quality gates before merge
- Automated testing required
- Code review mandatory

### 3. Transparency & Documentation
- All changes documented
- Clear commit messages
- Comprehensive README and docs

### 4. Collaborative Development
- Open communication
- Peer review culture
- Knowledge sharing

---

## Repository Structure

```
fleet/
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   └── PULL_REQUEST_TEMPLATE.md
├── src/                    # Source code
│   ├── components/        # React components
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   └── types/             # TypeScript types
├── tests/                 # Test files
├── docs/                  # Documentation
├── scripts/               # Build & deployment scripts
├── .env.example           # Environment template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── README.md              # Project overview
├── GOVERNANCE.md          # This file
└── CONTRIBUTING.md        # Contribution guide
```

---

## Branch Strategy

### Main Branches

**`main`** - Production-ready code
- Protected branch
- Requires PR review
- Auto-deployed to production
- Never commit directly

**`develop`** - Integration branch
- Latest development code
- Pre-production testing
- Staging deployments

### Feature Branches

**Naming Convention**: `feature/descriptive-name`
- Created from `develop`
- Merged back to `develop` via PR
- Deleted after merge

**Examples**:
- `feature/3d-vehicle-viewer`
- `feature/user-authentication`
- `feature/performance-optimization`

### Other Branch Types

**`hotfix/`** - Critical production fixes
- Created from `main`
- Merged to both `main` and `develop`
- Example: `hotfix/security-patch-cve-2025`

**`bugfix/`** - Non-critical bug fixes
- Created from `develop`
- Merged to `develop`
- Example: `bugfix/login-redirect-issue`

**`refactor/`** - Code refactoring
- Created from `develop`
- Merged to `develop`
- Example: `refactor/api-client-structure`

---

## Quality Gates

### All Code Must Pass Before Merge

#### 1. Build Success ✅
```bash
npm run build
# Must complete without errors
```

#### 2. Type Checking ✅
```bash
npm run type-check
# Zero TypeScript errors
```

#### 3. Linting ✅
```bash
npm run lint
# All linting rules pass
```

#### 4. Unit Tests ✅
```bash
npm test
# 100% of tests passing
# Minimum 70% code coverage
```

#### 5. Integration Tests ✅
```bash
npm run test:integration
# All integration tests pass
```

#### 6. Code Review ✅
- Minimum 1 approval required
- No unresolved comments
- Follow review checklist

#### 7. Documentation ✅
- README updated if needed
- JSDoc comments for new functions
- CHANGELOG.md updated

---

## Pull Request Process

### Creating a PR

1. **Create feature branch** from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop and commit**
   - Make atomic commits
   - Write clear commit messages
   - Follow conventional commits format

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Use PR template
   - Link related issues
   - Add detailed description

4. **Address review feedback**
   - Respond to all comments
   - Make requested changes
   - Re-request review

5. **Merge after approval**
   - Squash and merge (preferred)
   - Delete feature branch after merge

### PR Template Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or documented)
- [ ] Screenshots (if UI changes)
- [ ] Performance impact assessed

---

## Commit Message Format

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(3d-viewer): add photorealistic material system

Implemented cinema-quality PBR materials with:
- Custom automotive paint shader
- Metallic flake simulation
- Orange peel effect
- Environment reflections

Closes #123
```

```
fix(auth): resolve session timeout issue

Fixed bug where user sessions expired prematurely
due to incorrect token refresh logic.

Fixes #456
```

---

## Code Review Guidelines

### For Reviewers

**Check for**:
- ✅ Code clarity and readability
- ✅ Proper error handling
- ✅ Security vulnerabilities
- ✅ Performance implications
- ✅ Test coverage
- ✅ Documentation completeness

**Provide**:
- Constructive feedback
- Specific suggestions
- Code examples when helpful
- Timely reviews (within 24 hours)

### For Authors

**Prepare**:
- Clean, focused commits
- Comprehensive description
- Self-review before submitting
- Address CI failures

**Respond**:
- Professionally to feedback
- Promptly to review comments
- With explanations for decisions

---

## Repository Creation Policy

### Prohibited Without Approval

❌ **DO NOT** create new Fleet repositories for:
- Features (use branches)
- Experiments (use branches)
- Validations (use branches)
- Bug fixes (use branches)
- Personal variants (use forks)

### Approval Required For

✅ **MAY** create new repository if:
- Completely separate application
- Different technology stack
- Independent deployment
- Different team ownership

### Approval Process

1. **Write justification** document
   - Why separate repo needed
   - Why branch won't work
   - Impact on maintenance
   - Long-term vision

2. **Submit for review** to tech lead

3. **Await decision** (within 48 hours)

4. **If approved**, follow naming convention:
   - `fleet-[purpose]` (e.g., `fleet-mobile-app`)

---

## Security Policy

### Secret Management

❌ **NEVER commit**:
- API keys
- Passwords
- Private keys
- Access tokens
- Database credentials

✅ **Always use**:
- Environment variables
- Azure Key Vault
- `.env.example` for templates

### Security Scanning

- Automated security scans on PRs
- Dependency vulnerability checks
- SAST (Static Application Security Testing)
- Regular security audits

### Reporting Vulnerabilities

- Email: security@capitaltechalliance.com
- Create private security advisory on GitHub
- Response within 24 hours

---

## Deployment Process

### Environments

1. **Development** - `develop` branch
   - Auto-deploy on merge
   - For testing new features

2. **Staging** - Pre-release
   - Manual deploy from `develop`
   - Client/stakeholder review

3. **Production** - `main` branch
   - Manual deploy with approval
   - Monitored closely
   - Rollback plan required

### Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Staging tested successfully
- [ ] Documentation updated
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring configured

---

## Monthly Audit Schedule

### Repository Audit (1st of each month)

**Check for**:
- Unauthorized repositories
- Abandoned branches (>3 months old)
- Duplicate code
- Outdated dependencies
- Security vulnerabilities

**Actions**:
- Delete stale branches
- Update dependencies
- Archive old code
- Report findings

### Code Quality Audit (15th of each month)

**Review**:
- Test coverage trends
- Code complexity metrics
- Technical debt accumulation
- Performance benchmarks

**Actions**:
- Address critical issues
- Plan refactoring
- Update standards

---

## Enforcement

### Violations

**Minor violations** (warning):
- Direct commit to `develop`
- Skipped tests
- Poor commit messages

**Major violations** (PR rejection):
- Direct commit to `main`
- Failing quality gates
- Security vulnerabilities
- No code review

**Critical violations** (escalation):
- Creating unauthorized repositories
- Committing secrets
- Bypassing protections

### Consequences

1. **First violation**: Warning + education
2. **Second violation**: Formal review
3. **Repeated violations**: Access restriction

---

## Continuous Improvement

### Policy Updates

- Reviewed quarterly
- Updated as needed
- Changes communicated to team
- Version controlled in this file

### Feedback Welcome

- Suggest improvements via PR
- Discuss in team meetings
- Document lessons learned

---

## Contact & Support

### Questions About This Policy

- Create GitHub issue with `governance` label
- Discuss in team standup
- Email tech lead

### Policy Violations

- Report to tech lead
- Document in issue tracker
- Address in team retrospective

---

## Appendix A: Tool Configuration

### Required Tools

- **Git**: Version control
- **Node.js**: Runtime (v18+)
- **npm**: Package manager
- **TypeScript**: Language
- **ESLint**: Linting
- **Prettier**: Formatting
- **Jest**: Testing

### Recommended IDE Setup

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - GitLens
  - TypeScript Error Lens

---

## Appendix B: Quick Reference

### Common Commands

```bash
# Start development
npm install
npm run dev

# Run tests
npm test
npm run test:watch

# Build for production
npm run build

# Lint code
npm run lint
npm run lint:fix

# Type check
npm run type-check
```

### Branch Operations

```bash
# Create feature branch
git checkout -b feature/my-feature

# Update from develop
git checkout develop
git pull
git checkout feature/my-feature
git rebase develop

# Push changes
git push origin feature/my-feature

# Delete merged branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

**Document Version**: 1.0
**Last Updated**: December 31, 2025
**Next Review**: March 31, 2026

---

*This governance policy is effective immediately and applies to all contributors to the Fleet repository.*
