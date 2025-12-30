# Azure DevOps Push Blocked - Secret Detection

## Issue
Azure DevOps Advanced Security detected hardcoded secrets in commit history and blocked the push.

## Affected Commits
- **Commit**: `e3f59fe06039eb7a4f3bd6f754eb3e33934dd95b`
- **Files**:
  - `/FLEET_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md` (line 561)
  - `/BACKEND_API_DEPLOYMENT_STATUS.md` (line 161)
- **Secret Type**: AadClientAppIdentifiableCredentials (Azure AD Client Secret)

## Resolution Status
✅ **Secrets removed from latest commit** (`4a024b44`)
✅ **Pushed to GitHub** successfully
❌ **Azure DevOps push blocked** due to secret in commit history

## Options

### Option 1: Rewrite History (Clean Approach)
Remove the secret from commit history using interactive rebase:

```bash
# Rebase and edit the problematic commit
git rebase -i e3f59fe0^

# In the editor, change 'pick' to 'edit' for commit e3f59fe0
# Save and close

# Amend the commit to remove secrets
git add FLEET_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md BACKEND_API_DEPLOYMENT_STATUS.md
git commit --amend --no-edit

# Continue rebase
git rebase --continue

# Force push (WARNING: This rewrites history)
git push origin main --force
git push azure main --force
```

**Risks**: Force pushing rewrites history and can cause issues for other developers.

### Option 2: Keep Repos Separate (Recommended)
- Continue using GitHub as primary remote
- Use Azure DevOps for CI/CD pipelines only (no source control)
- Azure Pipelines can pull from GitHub without issues

### Option 3: New Azure DevOps Repo
- Create a fresh Azure DevOps repository
- Push only the clean commits starting from `4a024b44`
- Update CI/CD pipelines to use new repo

## Current State
- **GitHub**: ✅ Up to date with sanitized secrets
- **Azure DevOps**: ❌ Blocked at commit `336bcb70` (before problematic commit)
- **Local**: ✅ Clean history with secrets sanitized

## Recommendation
**Use Option 2** - Keep GitHub as the source of truth and configure Azure Pipelines to pull from GitHub. This is the most common and supported approach.

### Azure Pipelines Configuration
Create or update `.azure-pipelines.yml`:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

resources:
  repositories:
    - repository: fleet-github
      type: github
      endpoint: GitHubConnection
      name: asmortongpt/Fleet

steps:
  - checkout: fleet-github
  - script: echo "Building from GitHub source"
```

## Secret Rotation Recommended
The exposed Azure AD Client Secret should be rotated:

1. Go to Azure Portal → Azure AD → App Registrations
2. Find the app registration
3. Go to "Certificates & secrets"
4. Delete the compromised secret
5. Create a new client secret
6. Update Azure Key Vault with the new secret
7. Restart any services using the old secret

## Prevention
- ✅ Use `.env.example` files with placeholders only
- ✅ Reference Azure Key Vault in documentation instead of actual secrets
- ✅ Enable GitHub secret scanning
- ✅ Use git-secrets or similar pre-commit hooks
- ✅ Never commit actual credentials to any repository
