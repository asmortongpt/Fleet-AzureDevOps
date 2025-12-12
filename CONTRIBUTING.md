# Contributing to Fleet

Thank you for your interest in contributing to Fleet! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Repository Size Management](#repository-size-management)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Security Guidelines](#security-guidelines)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git 2.40+ with Git LFS installed
- Recommended: VS Code with TypeScript and ESLint extensions

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/asmortongpt/Fleet.git
   cd Fleet
   ```

2. **Install Git LFS** (if not already installed)
   ```bash
   # macOS
   brew install git-lfs

   # Ubuntu/Debian
   sudo apt-get install git-lfs

   # Windows
   # Download from: https://git-lfs.github.com/

   # Initialize Git LFS
   git lfs install
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Repository Size Management

This repository uses **Git LFS** for large binary files to prevent repository bloat.

### For Large Files (>5MB)

**Always use Git LFS for:**
- 3D models (`.glb`, `.gltf`, `.obj`, `.fbx`)
- Videos (`.mp4`, `.webm`)
- Large images
- Archives (`.zip`, `.tar.gz`)
- Binary files

**How to add large files:**

```bash
# Check if file type is already tracked
cat .gitattributes

# If not tracked, add the pattern
git lfs track "*.glb"

# Commit .gitattributes
git add .gitattributes
git commit -m "chore: Track GLB files with Git LFS"

# Then add your large file normally
git add public/models/vehicle.glb
git commit -m "feat: Add vehicle 3D model"
```

### Pre-commit Checks

The repository has pre-commit hooks that will **automatically reject**:

- Files larger than 5MB (unless tracked by LFS)
- Hardcoded secrets or API keys
- Binary files in inappropriate directories
- Common bloat patterns (node_modules, dist, logs)

### Best Practices

✅ **DO:**
- Use Git LFS for binary files >5MB
- Keep build artifacts in `.gitignore`
- Use environment variables for secrets
- Run `npm install` locally (don't commit dependencies)
- Clean up unused files and branches

❌ **DON'T:**
- Commit `node_modules/`, `dist/`, `build/`
- Commit `.env` files with real secrets
- Commit large media files without LFS
- Commit log files or debug output
- Force push to main/protected branches

## Development Workflow

### Branching Strategy

```
main                    # Production-ready code
  ├── develop           # Integration branch
  ├── feature/*         # New features
  ├── fix/*             # Bug fixes
  ├── devops/*          # DevOps improvements
  └── docs/*            # Documentation updates
```

### Creating a Branch

```bash
# Always branch from main (or develop)
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Create fix branch
git checkout -b fix/issue-description

# Create devops branch
git checkout -b devops/improvement-name
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add vehicle tracking module
fix: Resolve map rendering issue on mobile
docs: Update API documentation
chore: Update dependencies
refactor: Simplify authentication logic
test: Add tests for driver management
perf: Optimize fleet dashboard rendering
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
```bash
# Simple commit
git commit -m "feat: Add real-time telemetry dashboard"

# Detailed commit
git commit -m "fix: Resolve session timeout issue

The session timeout was occurring due to incorrect JWT expiration
calculation. This fix adjusts the expiration to match server-side
configuration.

Closes #123"
```

## Code Standards

### TypeScript

This project uses **strict TypeScript mode**:

- All strict checks enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Proper null/undefined handling

```typescript
// ✅ Good
function getVehicle(id: string): Vehicle | null {
  return vehicles.find(v => v.id === id) ?? null
}

// ❌ Bad
function getVehicle(id) {
  return vehicles.find(v => v.id === id)
}
```

### Component Patterns

**Lazy Loading (Required for modules):**
```typescript
// App.tsx
const VehicleManagement = lazy(() =>
  import("@/components/modules/vehicle-management").then(m => ({
    default: m.VehicleManagement
  }))
)
```

**Data Fetching:**
```typescript
import { useVehicles } from '@/hooks/use-api'

function Component() {
  const { data, isLoading, error } = useVehicles()

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay error={error} />

  return <VehicleList vehicles={data} />
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `VehicleDashboard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `use-fleet-data.ts`)
- Types: `PascalCase.ts` (e.g., `Vehicle.ts`)
- Tests: `*.spec.ts` or `*.test.ts`

## Testing Requirements

### Running Tests

```bash
# All E2E tests
npm test

# Smoke tests (quick validation)
npm run test:smoke

# Specific test suite
npm run test:main
npm run test:security
npm run test:a11y

# UI mode (interactive)
npm run test:ui

# Headed mode (see browser)
npm run test:headed
```

### Writing Tests

```typescript
// tests/e2e/vehicle-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Vehicle Management', () => {
  test('should display vehicle list', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-vehicle-management').click()

    await expect(page.getByRole('heading', { name: /vehicle/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })
})
```

### Test Coverage

- New features must include tests
- Bug fixes must include regression tests
- Aim for >80% code coverage
- All tests must pass before merge

## Pull Request Process

### Before Creating a PR

1. **Ensure all tests pass**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Update documentation** if needed

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: Add feature description"
   git push origin feature/your-feature
   ```

### Creating a PR

1. Go to [GitHub Pull Requests](https://github.com/asmortongpt/Fleet/pulls)
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] No hardcoded secrets
- [ ] Large files use Git LFS
- [ ] Documentation updated
- [ ] Commit messages follow convention
```

### Review Process

1. **Automated Checks** (must pass):
   - Repository size check
   - Large file detection
   - Security scan
   - Dependency review
   - Code quality analysis

2. **Code Review**:
   - At least 1 approval required
   - Code owners automatically notified
   - Address all review comments

3. **Merge**:
   - Use "Squash and merge" for feature branches
   - Use "Merge commit" for important historical context
   - Never "Force push" to main

### PR Best Practices

✅ **Good PR:**
- Focused on single feature/fix
- <500 lines changed
- Clear description
- Includes tests
- Updates documentation

❌ **Bad PR:**
- Multiple unrelated changes
- Thousands of lines changed
- No description
- No tests
- Breaks existing functionality

## Security Guidelines

### Never Commit Secrets

❌ **Never commit:**
```typescript
// Bad - hardcoded secret
const apiKey = "sk-abc123xyz456..."
const password = "mypassword123"
```

✅ **Always use:**
```typescript
// Good - environment variable
const apiKey = process.env.API_KEY
const password = process.env.DB_PASSWORD
```

### Environment Variables

```bash
# .env.example (commit this)
API_KEY=your_api_key_here
DATABASE_URL=your_database_url

# .env (DO NOT commit - in .gitignore)
API_KEY=sk-real-api-key-here
DATABASE_URL=postgres://real-connection-string
```

### Security Requirements

- Parameterized queries only (no string concatenation in SQL)
- bcrypt/argon2 for passwords (cost ≥12)
- Validate ALL inputs (whitelist approach)
- Use `execFile()` with arrays, never `exec()` with user input
- Security headers (Helmet), HTTPS everywhere
- Least privilege principles
- Audit logging for sensitive operations

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/asmortongpt/Fleet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/asmortongpt/Fleet/discussions)
- **Security**: Email security@capitaltechalliance.com
- **Documentation**: See [CLAUDE.md](./CLAUDE.md) for architecture details

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on code quality, not personal preferences
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Thank you for contributing to Fleet!** Your efforts help make this project better for everyone.
