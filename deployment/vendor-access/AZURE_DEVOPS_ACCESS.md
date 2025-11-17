# Azure DevOps Access Guide for Vendors

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Classification:** Confidential

---

## Overview

This guide explains how to access and use Azure DevOps for the Fleet Management System project.

**Azure DevOps Organization:** CapitalTechAlliance
**Project:** FleetManagement
**Repository:** Fleet

---

## Prerequisites

### Install Azure DevOps CLI

**macOS:**
```bash
# Install Azure CLI if not already installed
brew install azure-cli

# Add Azure DevOps extension
az extension add --name azure-devops
```

**Linux:**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Add Azure DevOps extension
az extension add --name azure-devops
```

**Windows:**
```powershell
# Install Azure CLI (download from https://aka.ms/installazurecliwindows)
# Then add extension
az extension add --name azure-devops
```

---

## Authentication

### Personal Access Token (PAT)

You will receive your PAT token encrypted. Decrypt it:

```bash
# Decrypt PAT token file
gpg -d azure-devops-pat.txt.gpg > azure-devops-pat.txt

# Secure the file
chmod 600 azure-devops-pat.txt

# View token (keep secure!)
cat azure-devops-pat.txt
```

### Configure Azure DevOps CLI

```bash
# Set organization as default
az devops configure --defaults organization=https://dev.azure.com/CapitalTechAlliance project=FleetManagement

# Login with PAT
az devops login

# When prompted, paste your PAT token
# The token will be stored securely
```

### Test Authentication

```bash
# Test access
az devops project show --project FleetManagement

# List repositories
az repos list --project FleetManagement

# Verify you have access to Fleet repository
az repos show --repository Fleet --project FleetManagement
```

---

## Repository Access

### Clone Repository

**Using HTTPS with PAT:**
```bash
git clone https://YOUR_PAT@dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
cd Fleet
```

**Using Azure CLI:**
```bash
# Azure CLI will use your configured PAT
git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
cd Fleet
```

### Configure Git Credentials

**Store credentials (recommended):**
```bash
# Configure git to store credentials
git config --global credential.helper store

# First git operation will prompt for PAT
# Subsequent operations will use stored credentials
```

**Alternative - Git credential manager:**
```bash
# macOS
brew install git-credential-manager

# Linux
wget https://github.com/GitCredentialManager/git-credential-manager/releases/latest/download/gcm-linux_amd64.*.deb
sudo dpkg -i gcm-linux_amd64.*.deb

# Configure
git config --global credential.credentialStore secretservice
```

---

## Branch Strategy

### Branch Naming Convention

```
feature/feature-name        - New features
bugfix/issue-description    - Bug fixes
hotfix/critical-issue       - Critical production fixes
refactor/component-name     - Code refactoring
docs/documentation-update   - Documentation changes
```

### Protected Branches

**main** - Production-ready code
- Requires pull request
- Requires 1 approval
- CI/CD must pass
- No direct commits

**develop** - Integration branch
- Requires pull request
- Automated tests must pass

### Working with Branches

**Create feature branch:**
```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-new-dashboard

# Make changes and commit
git add .
git commit -m "feat: Add new analytics dashboard"

# Push to remote
git push origin feature/add-new-dashboard
```

---

## Pull Requests

### Creating a Pull Request

**Via Azure DevOps CLI:**
```bash
# Create PR from current branch to main
az repos pr create \
  --title "feat: Add new analytics dashboard" \
  --description "Implements user story #123 with new analytics dashboard" \
  --source-branch feature/add-new-dashboard \
  --target-branch main \
  --reviewers "reviewer1@capitaltechalliance.com" \
  --work-items 123

# Response includes PR ID and URL
```

**Via Web Interface:**
1. Go to https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
2. Click "Pull requests" in left menu
3. Click "New pull request"
4. Select source and target branches
5. Fill in title and description
6. Add reviewers
7. Link work items
8. Click "Create"

### Pull Request Template

Use this template for PR descriptions:

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Configuration change

## Related Work Items
- Closes #123
- Related to #456

## Changes Made
- Added new analytics dashboard component
- Implemented real-time data refresh
- Updated API endpoint for dashboard data
- Added unit tests for new components

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed in dev environment
- [ ] Tested in staging environment

## Screenshots (if UI changes)
[Attach screenshots]

## Deployment Notes
- Requires database migration 005
- Updated environment variables needed
- No breaking changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No hardcoded secrets
- [ ] Tests added/updated
```

### PR Review Process

**As PR Author:**
1. Create PR with detailed description
2. Link related work items
3. Add appropriate reviewers
4. Respond to review comments promptly
5. Update code based on feedback
6. Request re-review after changes

**Review Timeline:**
- Initial review: Within 48 hours
- Follow-up reviews: Within 24 hours
- Emergency fixes: Within 4 hours

**Approval Requirements:**
- Minimum 1 approval required
- All comments must be resolved
- CI/CD pipeline must pass
- No merge conflicts

---

## Work Items

### Viewing Your Work Items

**Via CLI:**
```bash
# List work items assigned to you
az boards work-item show --id 123

# List all your assigned work items
az boards query \
  --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.AssignedTo] = @Me"
```

**Via Web:**
1. Go to https://dev.azure.com/CapitalTechAlliance/FleetManagement/_workitems
2. Click "Assigned to me"
3. Filter by iteration or sprint

### Work Item States

**User Stories:**
- New → Active → Resolved → Closed

**Bugs:**
- New → Active → Resolved → Closed

**Tasks:**
- To Do → In Progress → Done

### Updating Work Items

**Via CLI:**
```bash
# Update work item state
az boards work-item update --id 123 --state "Active"

# Add comment
az boards work-item update --id 123 --discussion "Started working on this task"
```

**Linking Commits to Work Items:**
```bash
# Include work item ID in commit message
git commit -m "feat: Add dashboard component #123"

# Multiple work items
git commit -m "fix: Resolve authentication bug #123 #124"
```

---

## CI/CD Pipelines

### Viewing Pipeline Status

**Via Web:**
1. Go to https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build
2. View recent pipeline runs
3. Click on run for details

**Via CLI:**
```bash
# List pipelines
az pipelines list

# List recent runs
az pipelines runs list --top 10

# Show specific run
az pipelines runs show --id <run-id>
```

### Pipeline Stages

**Fleet Management CI/CD Pipeline:**

1. **Build**
   - Lint code
   - Run type checks
   - Build Docker images

2. **Test**
   - Unit tests
   - Integration tests
   - Security scanning

3. **Deploy to Dev** (automatic on main)
   - Deploy to fleet-dev namespace
   - Run smoke tests

4. **Deploy to Staging** (manual approval)
   - Deploy to fleet-staging namespace
   - Run integration tests
   - Performance testing

5. **Deploy to Production** (manual approval)
   - Deploy to fleet-management namespace
   - Health checks
   - Monitoring validation

### Viewing Pipeline Logs

```bash
# Get latest run ID
RUN_ID=$(az pipelines runs list --top 1 --query "[0].id" -o tsv)

# Download logs
az pipelines runs show --id $RUN_ID --open

# View specific task logs
az pipelines runs task show --run-id $RUN_ID --task-id <task-id>
```

---

## Code Review Guidelines

### As Code Author

**Before Creating PR:**
- [ ] Code is self-reviewed
- [ ] All tests pass locally
- [ ] No linting errors
- [ ] No console.log() or debug code
- [ ] Documentation updated
- [ ] Commit messages are clear

**During Review:**
- Respond to all comments
- Ask questions if feedback unclear
- Make requested changes promptly
- Be open to suggestions
- Test changes after updates

### Review Checklist for Reviewers

**Code Quality:**
- [ ] Code follows TypeScript/React best practices
- [ ] Proper error handling
- [ ] No code duplication
- [ ] Functions are focused and small
- [ ] Variable names are descriptive

**Security:**
- [ ] No hardcoded credentials
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization proper

**Testing:**
- [ ] Unit tests included
- [ ] Tests are meaningful
- [ ] Edge cases covered
- [ ] Mock data is realistic

**Documentation:**
- [ ] API changes documented
- [ ] Complex logic explained
- [ ] README updated if needed

**Performance:**
- [ ] No N+1 queries
- [ ] Indexes used properly
- [ ] Efficient algorithms
- [ ] No memory leaks

---

## Best Practices

### Commit Messages

Follow Conventional Commits specification:

```
feat: Add new analytics dashboard
fix: Resolve authentication token expiry issue
docs: Update API documentation for vehicles endpoint
refactor: Simplify maintenance schedule calculation
test: Add unit tests for driver management
chore: Update dependencies to latest versions
```

**Format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting (no code change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Git Workflow

```bash
# 1. Start with updated main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/feature-name

# 3. Make changes and commit frequently
git add .
git commit -m "feat: Add feature component"

# 4. Keep branch updated
git fetch origin main
git rebase origin/main

# 5. Push changes
git push origin feature/feature-name

# 6. Create PR when ready
az repos pr create --title "..." --description "..."

# 7. After PR approval and merge, cleanup
git checkout main
git pull origin main
git branch -d feature/feature-name
```

### Managing Merge Conflicts

```bash
# Update your branch with latest main
git fetch origin main
git rebase origin/main

# If conflicts occur
# 1. Resolve conflicts in files
# 2. Stage resolved files
git add <file>

# 3. Continue rebase
git rebase --continue

# If rebase gets too complex, abort and merge instead
git rebase --abort
git merge origin/main
```

---

## Troubleshooting

### Authentication Issues

**Problem: PAT token not working**
```bash
# Clear stored credentials
git credential reject <<EOF
protocol=https
host=dev.azure.com
EOF

# Re-authenticate
az devops login
```

**Problem: Permission denied**
- Verify PAT token has correct scopes:
  - Code: Read, Write
  - Work Items: Read, Write
  - Build: Read, Execute
- Contact project lead for permission updates

### Repository Issues

**Problem: Cannot push to repository**
```bash
# Verify remote URL
git remote -v

# Update remote URL with PAT
git remote set-url origin https://YOUR_PAT@dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
```

**Problem: Large files rejected**
```bash
# Git LFS should already be configured
# If not, install and configure:
git lfs install
git lfs track "*.png" "*.jpg" "*.pdf"
git add .gitattributes
git commit -m "chore: Configure Git LFS"
```

### Pipeline Issues

**Problem: Pipeline fails on my PR**
1. View pipeline logs in Azure DevOps
2. Identify failing stage
3. Review error messages
4. Fix issues locally
5. Commit and push fixes
6. Pipeline will automatically re-run

**Problem: Cannot trigger pipeline**
- Verify you have Build: Execute permission
- Check if pipeline requires manual approval
- Contact project lead

---

## Security

### PAT Token Security

**DO:**
- ✅ Store PAT in secure location
- ✅ Use environment variables for automation
- ✅ Rotate PAT every 90 days
- ✅ Use minimum required scopes

**DON'T:**
- ❌ Commit PAT to repository
- ❌ Share PAT with others
- ❌ Store PAT in plaintext files
- ❌ Use PAT in client-side code

### Secure Token Storage

**Linux/macOS:**
```bash
# Store in environment variable
echo 'export AZURE_DEVOPS_PAT=your-pat-here' >> ~/.bashrc
source ~/.bashrc

# Use in scripts
az devops login --organization https://dev.azure.com/CapitalTechAlliance
echo $AZURE_DEVOPS_PAT | az devops login
```

**Windows:**
```powershell
# Store in environment variable
[System.Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'your-pat-here', 'User')

# Use in scripts
$env:AZURE_DEVOPS_PAT | az devops login
```

### Revoking Access

If PAT is compromised:
1. Immediately notify project lead
2. Revoke PAT in Azure DevOps:
   - https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens
   - Click PAT → Revoke
3. Generate new PAT
4. Update all automation scripts

---

## Quick Reference

### Essential Commands

```bash
# Authentication
az devops login
az devops configure --defaults organization=https://dev.azure.com/CapitalTechAlliance project=FleetManagement

# Repository
az repos list
az repos pr list
az repos pr create --title "Title" --source-branch feature/branch --target-branch main

# Work Items
az boards work-item show --id 123
az boards work-item update --id 123 --state "Active"

# Pipelines
az pipelines list
az pipelines runs list
az pipelines runs show --id <run-id>

# Git
git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
git checkout -b feature/feature-name
git push origin feature/feature-name
```

### Useful Links

**Azure DevOps:**
- Organization: https://dev.azure.com/CapitalTechAlliance
- Project: https://dev.azure.com/CapitalTechAlliance/FleetManagement
- Repository: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
- Boards: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_workitems
- Pipelines: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_build
- Pull Requests: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet/pullrequests

**Documentation:**
- Azure DevOps CLI: https://learn.microsoft.com/en-us/cli/azure/devops
- Git LFS: https://git-lfs.github.com/
- Conventional Commits: https://www.conventionalcommits.org/

---

## Support

For Azure DevOps access issues:
- Email: devops@capitaltechalliance.com
- Project Lead: [Provided separately]
- Response Time: 24 hours

---

**Document Control:**
- Version: 1.0
- Last Updated: 2025-11-09
- Classification: Confidential
- Distribution: External Vendor Development Team Only
