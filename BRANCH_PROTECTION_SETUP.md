# Branch Protection Configuration

## CRITICAL: GitHub Main Branch Protection Setup

**Status**: NOT CONFIGURED - Requires immediate manual action
**Severity**: CRITICAL
**Compliance Impact**: Fails FedRAMP CM-3, SOC 2 CC8.1

### Why This Matters
Without branch protection, anyone with write access can:
- Push directly to `main` without review
- Force push and rewrite history
- Delete the main branch
- Bypass CI/CD checks
- Deploy unreviewed or untested code

This creates significant security, compliance, and operational risks.

---

## Manual Configuration Steps

### Step 1: Navigate to Branch Protection Settings
1. Go to: https://github.com/asmortongpt/Fleet/settings/branches
2. Click **"Add rule"** or **"Add branch protection rule"**
3. Enter branch name pattern: `main`

### Step 2: Configure Required Settings

#### Pull Request Requirements
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: Set to `1` minimum
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners** (if CODEOWNERS file exists)

#### Status Check Requirements
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - Add these required status checks (if configured in CI/CD):
    - `build` - Ensures code compiles
    - `test` - Ensures all tests pass
    - `lint` - Ensures code quality standards
    - `security-scan` - Ensures no vulnerabilities

#### Conversation Requirements
- ✅ **Require conversation resolution before merging**
  - Ensures all PR comments are addressed

#### Commit Signing
- ✅ **Require signed commits**
  - Ensures commits are cryptographically verified
  - See: https://docs.github.com/en/authentication/managing-commit-signature-verification

#### Administrative Enforcement
- ✅ **Do not allow bypassing the above settings**
  - Previously called "Include administrators"
  - Ensures rules apply to everyone, including admins

#### Push Restrictions
- ✅ **Restrict who can push to matching branches**
  - Limit to CI/CD service accounts and select administrators
  - Consider creating a "release-managers" team

#### Dangerous Operations
- ❌ **Allow force pushes**: DISABLED
  - Prevents rewriting history
- ❌ **Allow deletions**: DISABLED
  - Prevents accidental branch deletion

### Step 3: Additional Recommended Settings

#### Require Linear History
- ✅ **Require linear history**
  - Prevents merge commits, enforces rebase or squash

#### Require Deployments to Succeed
- ✅ **Require deployments to succeed before merging** (optional)
  - If you have staging environment deployments

#### Lock Branch
- ⚠️ **Lock branch** (use cautiously)
  - Makes branch read-only except through PRs

---

## Verification

### Method 1: GitHub UI
1. Navigate to: https://github.com/asmortongpt/Fleet/settings/branches
2. Verify the `main` branch shows a protection rule
3. Click "Edit" to review all settings

### Method 2: GitHub CLI
```bash
# Install GitHub CLI if not already installed
# brew install gh  # macOS
# or download from https://cli.github.com/

# Authenticate
gh auth login

# View branch protection
gh api repos/asmortongpt/Fleet/branches/main/protection
```

Expected output should include:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build", "test", "lint", "security-scan"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "enforce_admins": {
    "enabled": true
  },
  "required_signatures": {
    "enabled": true
  },
  "allow_force_pushes": {
    "enabled": false
  },
  "allow_deletions": {
    "enabled": false
  }
}
```

### Method 3: Test Protection
Try to push directly to main (should fail):
```bash
# This should be blocked
git checkout main
git commit --allow-empty -m "Test: Should be blocked"
git push origin main
```

Expected error:
```
remote: error: GH006: Protected branch update failed
```

---

## Developer Workflow After Protection

### Normal Development Flow
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: implement new feature"

# 3. Push to remote
git push origin feature/my-feature

# 4. Create Pull Request via GitHub UI or CLI
gh pr create --title "Add new feature" --body "Description of changes"

# 5. Wait for:
#    - CI/CD checks to pass
#    - Code review approval
#    - All conversations resolved

# 6. Merge via GitHub UI (not command line)
```

### Emergency Hotfix Flow
```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add .
git commit -m "fix: critical security vulnerability"

# 3. Push and create PR with urgency label
git push origin hotfix/critical-bug
gh pr create --title "HOTFIX: Critical Security Fix" --label "urgent"

# 4. Request expedited review
# 5. Merge after approval and passing checks
```

---

## Status Check Configuration

Ensure your CI/CD pipeline defines these jobs:

### In azure-pipelines.yml
```yaml
stages:
  - stage: SecurityGate
    jobs:
      - job: build
        # ... build steps

      - job: test
        # ... test steps

      - job: lint
        # ... lint steps

      - job: security-scan
        # ... security scan steps
```

Each job name becomes a status check that can be required.

---

## Troubleshooting

### Issue: Can't enable required status checks
**Solution**: Ensure the CI/CD pipeline has run at least once on the main branch to register the status checks.

### Issue: Admins need to bypass protection temporarily
**Solution**:
1. This should be extremely rare
2. Document the reason
3. Re-enable protection immediately after
4. Consider if the protection rules need adjustment instead

### Issue: Status checks not appearing
**Solution**:
1. Push a commit to a branch
2. Create a PR to main
3. Wait for Azure Pipelines to run
4. Status checks will then appear in the branch protection settings

### Issue: Signed commits not working
**Solution**: See GitHub's documentation on GPG key setup:
https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key

---

## Compliance Mapping

This configuration addresses:

| Requirement | Control | Implementation |
|------------|---------|----------------|
| **FedRAMP CM-3** | Configuration Change Control | Mandatory PR reviews prevent unauthorized changes |
| **SOC 2 CC8.1** | Change Management | All changes tracked, reviewed, and approved |
| **SOC 2 CC7.2** | Logical Access Controls | Status checks ensure security scans pass |
| **FedRAMP RA-5** | Vulnerability Scanning | Required security-scan status check |

---

## Next Steps After Configuration

1. ✅ Configure branch protection (this document)
2. ⏭️ Update CI/CD to define all required status checks
3. ⏭️ Train team on new PR workflow
4. ⏭️ Create CODEOWNERS file for critical paths
5. ⏭️ Document exceptions process (if any)
6. ⏭️ Schedule quarterly review of protection settings

---

## Configuration Completed Checklist

Once configured, check off these items:

- [ ] Branch protection rule created for `main`
- [ ] Require pull request reviews (1 approval minimum)
- [ ] Dismiss stale reviews enabled
- [ ] Require status checks to pass
- [ ] Branch must be up to date
- [ ] Required status checks configured: build, test, lint, security-scan
- [ ] Require conversation resolution
- [ ] Require signed commits
- [ ] Do not allow bypassing settings enabled
- [ ] Restrict who can push (optional but recommended)
- [ ] Force pushes disabled
- [ ] Deletions disabled
- [ ] Verified via GitHub CLI or API
- [ ] Tested that direct push to main is blocked
- [ ] Team trained on new workflow
- [ ] Documentation updated

---

## Maintenance

Review and update branch protection settings:
- **Quarterly**: Review and adjust as team grows
- **When CI/CD changes**: Update required status checks
- **After security incidents**: Strengthen rules if needed
- **Annual compliance audit**: Verify compliance mapping

---

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [FedRAMP CM-3 Control](https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/800-53-5/home?element=CM-3)
- [SOC 2 Trust Services Criteria](https://www.aicpa.org/content/dam/aicpa/interestareas/frc/assuranceadvisoryservices/downloadabledocuments/trust-services-criteria.pdf)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**Owner**: DevSecOps Team
**Review Cycle**: Quarterly
