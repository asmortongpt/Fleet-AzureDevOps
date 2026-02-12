---
name: repo-management
description: Comprehensive repository management for Git, GitHub, and Azure DevOps. Use this skill when setting up repositories, managing branches, creating workflows, handling pull requests, configuring CI/CD, or working with version control best practices. Trigger when users ask to "set up a repo", "create a GitHub workflow", "manage branches", "configure Azure Pipelines", or "set up version control". Includes patterns for monorepos, branching strategies (Git Flow, GitHub Flow, trunk-based), PR templates, protected branches, and integration with CI/CD systems.
---

# Repository Management Skill

Complete guide for managing Git repositories across local, GitHub, and Azure DevOps platforms with industry best practices.

## When to Use This Skill

- Setting up new repositories (local, GitHub, Azure DevOps)
- Configuring branching strategies
- Creating PR/MR templates and workflows
- Setting up protected branches and rules
- Configuring GitHub Actions or Azure Pipelines
- Managing monorepos vs. multi-repo strategies
- Repository cleanup and maintenance
- Migrating between platforms

**Works with**: `production-deployment-skill` (CI/CD), `repo-hygiene` (keeping repos clean)

## Core Repository Setup

### Initialize New Repository

**Local Git setup**:
```bash
# Initialize repository
git init
git branch -M main

# Add remote (GitHub)
git remote add origin https://github.com/username/repo-name.git

# Add remote (Azure DevOps)
git remote add origin https://dev.azure.com/organization/project/_git/repo-name

# First commit
git add .
git commit -m "Initial commit"
git push -u origin main
```

**Quick setup script**:
```bash
#!/bin/bash
# setup-repo.sh

REPO_NAME=$1
PLATFORM=$2  # github or azure

if [ -z "$REPO_NAME" ]; then
  echo "Usage: ./setup-repo.sh <repo-name> [github|azure]"
  exit 1
fi

# Initialize repo
git init
git branch -M main

# Create basic structure
mkdir -p .github/workflows src tests docs
touch README.md .gitignore

# Add .gitignore from template
curl -sL "https://www.toptal.com/developers/gitignore/api/node,python,visualstudiocode" > .gitignore

# Initial commit
git add .
git commit -m "chore: initial repository setup"

echo "✅ Repository '$REPO_NAME' initialized"
echo "Next: Create remote repo on $PLATFORM and run:"
echo "  git remote add origin <remote-url>"
echo "  git push -u origin main"
```

### Essential Files

#### README.md Template
```markdown
# Project Name

Brief description of what this project does and who it's for.

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 14+

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/username/repo-name.git
cd repo-name

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
\`\`\`

## Usage

\`\`\`bash
# Development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
\`\`\`

## Project Structure

\`\`\`
repo-name/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
├── .github/       # GitHub workflows and templates
└── scripts/       # Utility scripts
\`\`\`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.
```

#### CONTRIBUTING.md Template
```markdown
# Contributing Guidelines

Thank you for considering contributing to this project!

## Development Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** with clear, descriptive commits
3. **Add tests** if you've added code that should be tested
4. **Ensure tests pass** by running `npm test`
5. **Lint your code** with `npm run lint`
6. **Submit a pull request** with a clear description

## Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
\`\`\`
feat(auth): add JWT authentication
fix(api): handle null response from database
docs: update installation instructions
\`\`\`

## Pull Request Process

1. Update README.md with details of changes if needed
2. Update documentation if you're changing functionality
3. The PR will be merged once approved by maintainers
4. Squash commits when merging for clean history

## Code Style

- Follow existing code style
- Use ESLint/Prettier configurations provided
- Write clear, self-documenting code
- Add comments for complex logic

## Testing

- Write unit tests for new functions
- Write integration tests for new features
- Aim for >80% code coverage
- Test edge cases and error conditions

## Questions?

Open an issue or reach out to maintainers.
```

## Branching Strategies

### 1. GitHub Flow (Recommended for Continuous Deployment)

**Structure**:
- `main` - Production-ready code
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

**Workflow**:
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "feat(auth): implement JWT authentication"

# Push to remote
git push -u origin feature/user-authentication

# Create PR to main
# After approval and merge, delete feature branch
git branch -d feature/user-authentication
git push origin --delete feature/user-authentication
```

**Best for**: Web apps, SaaS products, continuous deployment

### 2. Git Flow (Recommended for Release-Based Projects)

**Structure**:
- `main` - Production releases
- `develop` - Integration branch
- `feature/*` - Feature branches (from develop)
- `release/*` - Release preparation
- `hotfix/*` - Emergency fixes (from main)

**Workflow**:
```bash
# Feature development
git checkout develop
git checkout -b feature/new-payment-gateway
# ... work and commit ...
git push -u origin feature/new-payment-gateway
# Create PR to develop

# Release preparation
git checkout develop
git checkout -b release/v1.2.0
# Bump version, update changelog
git commit -m "chore: prepare release v1.2.0"
git push -u origin release/v1.2.0
# Create PR to main AND develop

# Hotfix
git checkout main
git checkout -b hotfix/critical-security-patch
# ... fix and commit ...
git push -u origin hotfix/critical-security-patch
# Create PR to main AND develop
```

**Best for**: Desktop apps, mobile apps, versioned releases

### 3. Trunk-Based Development (Recommended for High-Velocity Teams)

**Structure**:
- `main` - Always deployable
- Short-lived feature branches (< 1 day)
- Feature flags for incomplete features

**Workflow**:
```bash
# Create short-lived branch
git checkout main
git pull origin main
git checkout -b small-feature

# Make small, incremental changes
git add .
git commit -m "feat: add validation to email field"
git push -u origin small-feature

# Create PR immediately (same day)
# Merge to main after quick review
# Deploy main continuously
```

**Best for**: Large teams, microservices, continuous deployment

## GitHub Configuration

### Protected Branches

**Settings → Branches → Add rule**:

```yaml
Branch name pattern: main

Require a pull request before merging: ✓
  Require approvals: 1
  Dismiss stale pull request approvals: ✓
  Require review from Code Owners: ✓

Require status checks to pass: ✓
  Require branches to be up to date: ✓
  Status checks that are required:
    - test
    - lint
    - build

Require conversation resolution before merging: ✓

Require signed commits: ✓ (recommended for security)

Require linear history: ✓ (prevents merge commits)

Do not allow bypassing the above settings: ✓
```

### Pull Request Template

**.github/PULL_REQUEST_TEMPLATE.md**:
```markdown
## Description

Brief description of changes and why they're needed.

Fixes #(issue)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran to verify your changes.

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

**Test Configuration**:
- OS: [e.g., macOS, Ubuntu]
- Node version: [e.g., 18.x]

## Checklist

- [ ] My code follows the code style of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Additional Notes

Any additional information that reviewers should know.
```

### Issue Templates

**.github/ISSUE_TEMPLATE/bug_report.md**:
```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Safari]
- Version: [e.g., 22]

**Additional context**
Add any other context about the problem.
```

**.github/ISSUE_TEMPLATE/feature_request.md**:
```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

### GitHub Actions Workflows

**.github/workflows/ci.yml**:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Test
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Build
        run: npm run build

  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**.github/workflows/release.yml**:
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Azure DevOps Configuration

### Azure Pipelines

**azure-pipelines.yml**:
```yaml
trigger:
  branches:
    include:
      - main
      - develop
  tags:
    include:
      - v*

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: Test
        displayName: 'Run Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'
          
          - script: npm ci
            displayName: 'Install dependencies'
          
          - script: npm run lint
            displayName: 'Lint code'
          
          - script: npm run type-check
            displayName: 'Type check'
          
          - script: npm run test:coverage
            displayName: 'Run tests'
          
          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/test-results.xml'
            displayName: 'Publish test results'
          
          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
            displayName: 'Publish coverage'
          
          - script: npm run build
            displayName: 'Build project'
          
          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'dist'
              ArtifactName: 'dist'
            displayName: 'Publish build artifacts'

  - stage: Deploy
    displayName: 'Deploy to Production'
    dependsOn: Build
    condition: and(succeeded(), startsWith(variables['Build.SourceBranch'], 'refs/tags/v'))
    jobs:
      - deployment: Production
        displayName: 'Deploy to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: dist
                
                - script: echo "Deploying to production..."
                  displayName: 'Deploy'
```

### Branch Policies (Azure DevOps)

**Project Settings → Repos → Policies**:

```yaml
Branch: main

Require a minimum number of reviewers: ✓
  Minimum number: 1
  Allow requestors to approve their own changes: ✗
  Prohibit the most recent pusher from approving: ✓
  Allow completion even if some reviewers vote Wait: ✗

Check for linked work items: ✓
  Required

Check for comment resolution: ✓
  Required

Build validation: ✓
  Build pipeline: CI
  Trigger: Automatic
  Policy requirement: Required
  Build expiration: 12 hours

Status checks: ✓
  Required status checks:
    - test
    - lint
    - security-scan

Limit merge types: ✓
  Squash merge only: ✓
```

## Monorepo Management

### Workspace Structure

**package.json (root)**:
```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  }
}
```

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Structure**:
```
my-monorepo/
├── apps/
│   ├── web/              # Next.js app
│   ├── api/              # Express API
│   └── admin/            # Admin dashboard
├── packages/
│   ├── ui/               # Shared UI components
│   ├── config/           # Shared configs
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utilities
├── package.json
├── turbo.json
└── .gitignore
```

## Common Git Operations

### Useful Commands

```bash
# View history with graph
git log --graph --oneline --all --decorate

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit message
git commit --amend -m "New commit message"

# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Stash changes temporarily
git stash
git stash pop

# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Find who changed a line
git blame <file>

# Search commit messages
git log --grep="feature"

# Find commits that changed a file
git log --follow <file>

# Compare branches
git diff main..feature-branch

# List all branches merged to main
git branch --merged main

# Delete all merged branches
git branch --merged main | grep -v "main" | xargs git branch -d
```

### Handling Merge Conflicts

```bash
# When conflict occurs
git status  # See conflicted files

# Open conflicted file, look for markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> feature-branch

# Resolve conflicts, then:
git add <resolved-file>
git commit -m "fix: resolve merge conflicts"

# Or abort merge
git merge --abort
```

## Repository Maintenance

### Cleanup Script

```bash
#!/bin/bash
# cleanup-repo.sh

echo "🧹 Cleaning up repository..."

# Remove local branches that have been deleted on remote
git fetch --prune

# Delete merged branches
git branch --merged main | grep -v "^\*\|main\|develop" | xargs -n 1 git branch -d

# Clean up unnecessary files and optimize
git gc --aggressive --prune=now

# Show repository size
du -sh .git

echo "✅ Repository cleanup complete!"
```

### Migration Scripts

**GitHub to Azure DevOps**:
```bash
#!/bin/bash
# migrate-github-to-azure.sh

GITHUB_REPO="https://github.com/user/repo.git"
AZURE_REPO="https://dev.azure.com/org/project/_git/repo"

# Clone with full history
git clone --mirror $GITHUB_REPO repo-mirror
cd repo-mirror

# Add Azure remote
git remote add azure $AZURE_REPO

# Push everything to Azure
git push azure --mirror

echo "✅ Migration complete!"
```

## Best Practices

### Commit Guidelines
✅ Write clear, descriptive commit messages
✅ Use conventional commits format
✅ Keep commits small and focused
✅ Commit working code only
✅ Don't commit secrets or credentials

### Branch Management
✅ Delete branches after merging
✅ Keep feature branches short-lived
✅ Rebase feature branches before merging
✅ Protect main/production branches
✅ Use branch naming conventions

### Pull Request Best Practices
✅ Write clear PR descriptions
✅ Link related issues
✅ Request specific reviewers
✅ Respond to feedback promptly
✅ Keep PRs small (<400 lines)

### Security
✅ Never commit secrets or credentials
✅ Use .gitignore properly
✅ Scan for vulnerabilities regularly
✅ Require signed commits
✅ Enable branch protection

## Resources

### Bundled References
- `references/git-commands.md` - Complete Git command reference
- `references/github-actions.md` - GitHub Actions examples
- `references/azure-pipelines.md` - Azure Pipelines examples
- `scripts/setup-repo.sh` - Repository setup automation

### Related Skills
- `repo-hygiene` - Keep repos clean, prevent junk files
- `production-deployment-skill` - CI/CD and deployment
- `frontend-development` - Frontend project structure
- `requirements-analysis` - Project documentation

### External Resources
- Git: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com
- Azure DevOps: https://docs.microsoft.com/azure/devops
- Conventional Commits: https://www.conventionalcommits.org

## Conclusion

Effective repository management is crucial for team collaboration and code quality. This skill provides patterns and configurations for managing repos across platforms while maintaining best practices and security.

Remember: A well-organized repository with clear workflows and protections prevents issues before they occur and makes collaboration smooth and efficient.
