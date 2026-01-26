# Local Development Workflow

**Branch**: `feature/fix-azure-swa-deployment-2026-01-26`
**Created**: 2026-01-26
**Purpose**: Fix Azure Static Web Apps deployment issues and verify everything works locally before pushing to remote

---

## Current Status

### Production Issue
- **Problem**: Azure SWA is serving a 23-day-old build (January 3rd) despite GitHub Actions showing successful deployments
- **Root Cause**: Likely expired or invalid Azure Static Web Apps deployment token
- **Evidence**: Production HTML shows `<!-- Build Timestamp - Updated: 2026-01-03 00:52:00 UTC -->`

### Branch Protection Status
✅ **WORKING CORRECTLY** - Main branch is protected:
- Requires pull request approval
- Prevents force pushes
- Prevents direct commits

### Repository State
- **Local main**: At commit `955c9f7f0` ("test main branch lock")
- **Remote main**: At commit `955c9f7f0` ("test main branch lock")
- **Feature branch**: `fix/infinite-loop-sso-authentication-comprehensive` (contains previous work)
- **Backup tag**: `backup-before-revert-20260126` (pushed to remote)

---

## Local Development Workflow

### 1. Work Locally on Feature Branch

```bash
# Make changes to files
# Test locally with:
npm run dev            # Development server on port 5173
npm run build          # Build for production
npm run preview        # Preview production build on port 4173

# Commit iteratively as you make progress
git add <files>
git commit -m "descriptive message"

# Keep committing locally until everything works
```

### 2. Test Thoroughly Before Pushing

```bash
# Run all tests
npm test
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Build and preview
npm run build && npm run preview
```

### 3. Push to Remote Feature Branch

```bash
# When everything is working locally, push to remote
git push cta feature/fix-azure-swa-deployment-2026-01-26

# If branch doesn't exist on remote, use -u flag
git push -u cta feature/fix-azure-swa-deployment-2026-01-26
```

### 4. Create Pull Request

```bash
# Create PR via GitHub CLI
gh pr create --base main --head feature/fix-azure-swa-deployment-2026-01-26 \
  --title "Fix Azure Static Web Apps deployment token and stale cache" \
  --body "$(cat <<'EOF'
## Problem
Azure Static Web Apps is serving a 23-day-old build (2026-01-03) despite GitHub Actions showing successful deployments.

## Root Cause
Azure SWA deployment token may be expired or invalid.

## Solution
- [ ] Regenerate Azure Static Web Apps deployment token
- [ ] Update GitHub secret: AZURE_STATIC_WEB_APPS_API_TOKEN
- [ ] Trigger fresh deployment
- [ ] Verify production serves latest build

## Testing
- [ ] Local build and preview successful
- [ ] All tests passing
- [ ] Type checking clean
- [ ] No linting errors

## Related
- Feature branch: fix/infinite-loop-sso-authentication-comprehensive (contains infinite loop fixes)
- Backup tag: backup-before-revert-20260126

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Or create PR manually:
https://github.com/Capital-Technology-Alliance/Fleet/compare/main...feature/fix-azure-swa-deployment-2026-01-26

---

## Important Notes

1. **DO NOT** push directly to `main` - it's protected and will be rejected
2. **DO** commit as often as you want locally - commits are cheap!
3. **DO** squash commits before pushing if you want a clean history (optional)
4. **DO** test everything locally before pushing to remote
5. **DO** create PR when ready for review and merge

---

## Quick Commands

```bash
# Check current branch
git branch --show-current

# See what you've changed
git status
git diff

# Commit current changes
git add .
git commit -m "your message here"

# View commit history
git log --oneline -10

# Amend last commit (if you forgot something)
git add <forgotten-files>
git commit --amend --no-edit

# Push to remote when ready
git push cta feature/fix-azure-swa-deployment-2026-01-26
```

---

## Next Steps

1. **Fix Azure SWA Deployment Token**:
   - Go to Azure Portal: https://portal.azure.com
   - Navigate to Static Web Apps → your app
   - Click "Manage deployment token"
   - Copy new token
   - Update GitHub secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`

2. **Test Locally**: Make sure everything builds and runs correctly

3. **Commit Changes**: Create iterative commits as you work

4. **Push & Create PR**: When ready, push to remote and create PR for approval

---

**Remember**: Work at your own pace locally. Branch protection ensures nothing bad happens to `main`!
