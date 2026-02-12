---
name: repo-hygiene
description: Keep repositories clean by preventing junk files, temporary artifacts, AI-generated markdown, and sensitive data from being committed. Use this skill when setting up .gitignore, cleaning repos, preventing accidental commits of Claude outputs, or auditing repositories for unwanted files. Trigger when users ask to "clean up my repo", "prevent markdown files from being committed", "set up proper .gitignore", or "remove junk files from git". Includes comprehensive .gitignore templates, pre-commit hooks, and cleanup scripts for various project types.
---

# Repository Hygiene Skill

Maintain clean, professional repositories by preventing temporary files, AI outputs, and sensitive data from being committed.

## When to Use This Skill

- Setting up new projects to prevent junk commits from day one
- Cleaning existing repositories with unwanted files
- Preventing Claude/AI-generated markdown files from being committed
- Removing sensitive data (API keys, credentials)
- Creating comprehensive .gitignore files
- Setting up pre-commit hooks for automatic validation
- Auditing repositories for problematic files

**Works with**: `repo-management` (version control), `production-deployment-skill` (CI/CD)

## Common Repository Pollution

### Files to NEVER Commit

**AI-Generated Content**:
- ❌ Claude conversation exports (.md files from /mnt/outputs/)
- ❌ ChatGPT exports
- ❌ Temporary analysis files
- ❌ Debug markdown outputs

**Sensitive Data**:
- ❌ `.env` files with secrets
- ❌ API keys, tokens, credentials
- ❌ SSH private keys
- ❌ Database dumps with real data
- ❌ Certificate files (.pem, .key)

**Build Artifacts**:
- ❌ `node_modules/`, `dist/`, `build/`
- ❌ `*.pyc`, `__pycache__/`
- ❌ `.next/`, `.nuxt/`, `.cache/`
- ❌ Compiled binaries

**IDE/Editor Files**:
- ❌ `.vscode/settings.json` (unless team-shared)
- ❌ `.idea/` (JetBrains IDEs)
- ❌ `*.swp`, `*.swo` (Vim)
- ❌ `.DS_Store` (macOS)

**Logs and Temporary Files**:
- ❌ `*.log`, `npm-debug.log`
- ❌ `tmp/`, `temp/`, `.tmp/`
- ❌ `coverage/` (test coverage reports)

## Comprehensive .gitignore Templates

### Node.js / JavaScript / TypeScript

```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
.nuxt/
.cache/
.parcel-cache/
.vite/
out/

# Testing
coverage/
.nyc_output/
*.lcov

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json.example
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Claude / AI outputs
*.claude.md
*_analysis.md
*_summary.md
claude-output*.md
ai-generated*.md
/mnt/outputs/*.md
/mnt/.claude/
.claude/

# Temporary files
tmp/
temp/
.tmp/
*.tmp
*.temp

# Lock files (choose one)
# package-lock.json
# yarn.lock
# pnpm-lock.yaml

# TypeScript
*.tsbuildinfo
.tsbuildinfo
```

### Python

```gitignore
# Byte-compiled / optimized
__pycache__/
*.py[cod]
*$py.class
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/
.venv/

# PyCharm
.idea/

# Jupyter Notebook
.ipynb_checkpoints/
*.ipynb

# pytest
.pytest_cache/
.coverage
htmlcov/
.tox/

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Environment
.env
.env.local

# Claude / AI outputs
*.claude.md
*_analysis.md
ai-generated*.md

# OS
.DS_Store
```

### Full-Stack Application (Comprehensive)

```gitignore
# === Dependencies ===
node_modules/
vendor/
.pnp/
.pnp.js

# === Build Outputs ===
dist/
build/
out/
.next/
.nuxt/
.cache/
*.min.js
*.min.css

# === Environment & Secrets ===
.env
.env.local
.env.*.local
.env.production
.env.development
.env.test
config/secrets.yml
secrets.json

# Never commit these!
*_rsa
*_rsa.pub
*.pem
*.key
*.cert
*.crt
*.pfx

# === Database ===
*.sqlite
*.sqlite3
*.db
*.sql.gz
db_dumps/

# === Logs ===
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# === Testing ===
coverage/
.nyc_output/
.coverage
.pytest_cache/
test-results/
playwright-report/

# === IDE / Editors ===
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json.example
.idea/
*.swp
*.swo
*~
*.sublime-project
*.sublime-workspace

# === OS Files ===
.DS_Store
.DS_Store?
._*
Thumbs.db
desktop.ini

# === Claude & AI Outputs ===
# Prevent Claude-generated analysis files
*.claude.md
*_analysis.md
*_summary.md
*_output.md
claude-*.md
ai-generated*.md

# Prevent Claude outputs directory
/mnt/outputs/*.md
/mnt/.claude/
.claude/
claude-artifacts/

# === Temporary Files ===
tmp/
temp/
.tmp/
*.tmp
*.temp
*.bak
*.backup

# === Package Manager Lock Files ===
# Uncomment the ones you DON'T use
# package-lock.json
# yarn.lock
# pnpm-lock.yaml

# === Cache ===
.cache/
.parcel-cache/
.eslintcache
.stylelintcache
*.tsbuildinfo
```

## Pre-Commit Hook for Prevention

### Setup Git Hook

**.git/hooks/pre-commit**:
```bash
#!/bin/bash
# Pre-commit hook to prevent junk files from being committed

echo "🔍 Running pre-commit checks..."

# Define patterns for files that should NEVER be committed
FORBIDDEN_PATTERNS=(
  "\.env$"
  "\.env\..*"
  "_rsa$"
  "\.pem$"
  "\.key$"
  "secrets\.json$"
  "\.claude\.md$"
  "_analysis\.md$"
  "ai-generated.*\.md$"
  "claude-output.*\.md$"
)

# Check staged files
STAGED_FILES=$(git diff --cached --name-only)

ERRORS=0

for file in $STAGED_FILES; do
  for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      echo "❌ ERROR: Attempting to commit forbidden file: $file"
      echo "   Pattern matched: $pattern"
      ERRORS=$((ERRORS + 1))
    fi
  done
  
  # Check for common secrets in file content
  if git diff --cached "$file" | grep -qE "(password|secret|api_key|private_key)\s*=\s*['\"][^'\"]{8,}"; then
    echo "❌ WARNING: Possible secret detected in: $file"
    echo "   Please review and ensure no sensitive data is committed"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Pre-commit hook failed with $ERRORS error(s)"
  echo "   Add files to .gitignore or remove them from staging"
  echo ""
  echo "   To bypass this check (NOT RECOMMENDED):"
  echo "   git commit --no-verify"
  exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
```

**Make it executable**:
```bash
chmod +x .git/hooks/pre-commit
```

### Husky + lint-staged (Recommended)

**Install**:
```bash
npm install --save-dev husky lint-staged
npx husky install
npm set-script prepare "husky install"
npx husky add .git/hooks/pre-commit "npx lint-staged"
```

**package.json**:
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*": [
      "bash ./scripts/check-forbidden-files.sh"
    ]
  }
}
```

**scripts/check-forbidden-files.sh**:
```bash
#!/bin/bash

FORBIDDEN_FILES=(
  "*.env"
  "*.pem"
  "*.key"
  "*_rsa"
  "secrets.json"
  "*.claude.md"
  "*_analysis.md"
  "ai-generated*.md"
)

for file in "$@"; do
  for pattern in "${FORBIDDEN_FILES[@]}"; do
    if [[ "$file" == $pattern ]]; then
      echo "❌ Forbidden file: $file"
      exit 1
    fi
  done
done

exit 0
```

## Cleanup Scripts

### Remove Files Already Committed

**WARNING**: This rewrites git history. Only use on branches not shared with others.

```bash
#!/bin/bash
# remove-file-from-history.sh

FILE_TO_REMOVE=$1

if [ -z "$FILE_TO_REMOVE" ]; then
  echo "Usage: ./remove-file-from-history.sh <file-path>"
  exit 1
fi

echo "⚠️  WARNING: This will rewrite git history!"
echo "Only proceed if this branch is not shared with others."
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 0
fi

# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch $FILE_TO_REMOVE" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ File removed from history"
echo "⚠️  Force push required: git push origin --force --all"
```

### Find Large Files

```bash
#!/bin/bash
# find-large-files.sh

echo "🔍 Finding large files in repository..."

# Find files larger than 1MB
git rev-list --objects --all |
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
  sed -n 's/^blob //p' |
  sort --numeric-sort --key=2 --reverse |
  head -n 20 |
  awk '{
    size=$2
    if (size > 1048576) {
      size_mb = size / 1048576
      printf "%.2f MB - %s\n", size_mb, $3
    }
  }'
```

### Scan for Secrets

```bash
#!/bin/bash
# scan-secrets.sh

echo "🔍 Scanning for potential secrets..."

# Patterns to search for
PATTERNS=(
  "password\s*=\s*['\"][^'\"]{8,}"
  "api_key\s*=\s*['\"][^'\"]{20,}"
  "secret\s*=\s*['\"][^'\"]{8,}"
  "token\s*=\s*['\"][^'\"]{20,}"
  "private_key"
  "BEGIN RSA PRIVATE KEY"
  "BEGIN PRIVATE KEY"
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  results=$(git grep -i -E "$pattern" -- '*.js' '*.ts' '*.py' '*.env*' 2>/dev/null)
  if [ ! -z "$results" ]; then
    echo "⚠️  Found potential secret (pattern: $pattern):"
    echo "$results"
    echo ""
    FOUND=$((FOUND + 1))
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "✅ No obvious secrets found"
else
  echo "❌ Found $FOUND potential secret(s)"
  echo "   Review and move to environment variables or secret management"
fi
```

## Preventing Claude Outputs

### Specific .gitignore Rules

Add these to your `.gitignore` to prevent Claude outputs:

```gitignore
# === Claude & AI Outputs ===

# Claude conversation exports
*.claude.md
claude-conversation*.md
claude-output*.md

# Common AI-generated analysis files
*_analysis.md
*_summary.md
*_report.md
*_documentation.md
ai-generated*.md
ai-output*.md

# Claude working directories
/mnt/outputs/
/mnt/.claude/
.claude/
claude-artifacts/
claude-workspace/

# Temporary AI files
*_temp.md
*_draft.md
*.tmp.md

# Specific patterns if you use consistent naming
analysis-*.md
summary-*.md
notes-*.md
scratch-*.md
```

### Script to Check Before Commit

```bash
#!/bin/bash
# check-claude-files.sh

echo "🤖 Checking for Claude-generated files..."

# Find potential Claude files
CLAUDE_FILES=$(find . -type f \( \
  -name "*.claude.md" -o \
  -name "*_analysis.md" -o \
  -name "*_summary.md" -o \
  -name "claude-output*.md" -o \
  -name "ai-generated*.md" \
\) -not -path "./node_modules/*" -not -path "./.git/*")

if [ ! -z "$CLAUDE_FILES" ]; then
  echo "⚠️  Found Claude-generated files:"
  echo "$CLAUDE_FILES"
  echo ""
  echo "Add these to .gitignore or delete them:"
  echo "  git rm --cached <file>"
  echo "  echo \"<pattern>\" >> .gitignore"
  exit 1
fi

echo "✅ No Claude files detected"
```

## Repository Audit

### Complete Audit Script

```bash
#!/bin/bash
# audit-repo.sh

echo "🔍 Running complete repository audit..."
echo ""

# Check for .gitignore
if [ ! -f .gitignore ]; then
  echo "❌ No .gitignore file found"
  echo "   Create one: touch .gitignore"
else
  echo "✅ .gitignore exists"
fi

# Check for .env files
if git ls-files | grep -q "\.env"; then
  echo "❌ .env file is tracked in git"
  echo "   Remove it: git rm --cached .env"
  echo "   Add to .gitignore: echo \".env\" >> .gitignore"
else
  echo "✅ No .env files tracked"
fi

# Check for node_modules
if git ls-files | grep -q "node_modules/"; then
  echo "❌ node_modules is tracked in git"
  echo "   Remove it: git rm -r --cached node_modules"
  echo "   Add to .gitignore: echo \"node_modules/\" >> .gitignore"
else
  echo "✅ node_modules not tracked"
fi

# Check for large files
echo ""
echo "📦 Checking for large files (>1MB)..."
./scripts/find-large-files.sh

# Check for secrets
echo ""
echo "🔐 Scanning for secrets..."
./scripts/scan-secrets.sh

# Check for Claude files
echo ""
echo "🤖 Checking for Claude files..."
./scripts/check-claude-files.sh

echo ""
echo "✅ Audit complete"
```

## GitHub Actions for Hygiene

**.github/workflows/repo-hygiene.yml**:
```yaml
name: Repository Hygiene

on:
  pull_request:
    branches: [main, develop]

jobs:
  check-hygiene:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for better checks
      
      - name: Check for secrets
        run: |
          # Install gitleaks
          wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
          tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
          chmod +x gitleaks
          
          # Scan for secrets
          ./gitleaks detect --source . --verbose
      
      - name: Check for large files
        run: |
          # Find files >1MB
          find . -type f -size +1M -not -path "./.git/*" | while read file; do
            echo "⚠️ Large file: $file ($(du -h "$file" | cut -f1))"
          done
      
      - name: Check for Claude files
        run: |
          # Find Claude-generated files
          claude_files=$(find . -type f \( \
            -name "*.claude.md" -o \
            -name "*_analysis.md" -o \
            -name "*_summary.md" \
          \) -not -path "./.git/*" -not -path "./node_modules/*")
          
          if [ ! -z "$claude_files" ]; then
            echo "❌ Found Claude files:"
            echo "$claude_files"
            exit 1
          fi
          
          echo "✅ No Claude files found"
      
      - name: Verify .gitignore
        run: |
          if [ ! -f .gitignore ]; then
            echo "❌ No .gitignore file"
            exit 1
          fi
          
          # Check for essential patterns
          essential_patterns=("node_modules/" ".env" "dist/" "*.log")
          missing=()
          
          for pattern in "${essential_patterns[@]}"; do
            if ! grep -q "$pattern" .gitignore; then
              missing+=("$pattern")
            fi
          done
          
          if [ ${#missing[@]} -gt 0 ]; then
            echo "⚠️ Missing .gitignore patterns:"
            printf '%s\n' "${missing[@]}"
          fi
```

## Best Practices

### Setup Checklist

- [ ] Create comprehensive .gitignore before first commit
- [ ] Set up pre-commit hooks (Husky + lint-staged)
- [ ] Configure repository hygiene in CI/CD
- [ ] Add .env.example (never .env)
- [ ] Document sensitive files in README
- [ ] Use environment variables for all secrets
- [ ] Regular audits with automated scripts

### Prevention Strategies

✅ **Proactive .gitignore**: Add patterns before files exist
✅ **Pre-commit hooks**: Block forbidden files automatically
✅ **CI checks**: Catch issues in pull requests
✅ **Team education**: Document what not to commit
✅ **Template repos**: Start new projects with proper setup

### Cleanup Workflow

1. **Identify**: Run audit scripts to find problematic files
2. **Remove**: Use `git rm --cached` for tracked files
3. **Prevent**: Add patterns to .gitignore
4. **History**: Use git-filter-branch if already committed
5. **Verify**: Run checks again to confirm

## Resources

### Bundled Scripts
- `scripts/audit-repo.sh` - Complete repository audit
- `scripts/check-claude-files.sh` - Find AI-generated files
- `scripts/scan-secrets.sh` - Detect potential secrets
- `scripts/remove-file-from-history.sh` - Clean git history
- `references/gitignore-templates.md` - Templates for all languages

### Related Skills
- `repo-management` - Version control and workflows
- `production-deployment-skill` - CI/CD security
- `frontend-development` - Frontend project hygiene

### External Tools
- **gitleaks**: Secret scanning (https://github.com/gitleaks/gitleaks)
- **git-secrets**: Prevent committing secrets (https://github.com/awslabs/git-secrets)
- **BFG Repo-Cleaner**: Fast history cleaning (https://rtyley.github.io/bfg-repo-cleaner/)

## Conclusion

Repository hygiene is about prevention, not just cleanup. Set up proper .gitignore and pre-commit hooks from day one to avoid issues. When problems occur, use the provided scripts to audit and clean your repository systematically.

Remember: A clean repository makes code review easier, reduces security risks, and keeps your project professional.
