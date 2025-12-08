# Branch Protection Rules Setup

**Status:** Pending - Requires valid GitHub PAT

## Overview

Branch protection rules are the final piece of the DevOps best practices implementation.

## Quick Setup (Once PAT is Updated)

```bash
# 1. Update GitHub PAT
gh auth login

# 2. Apply protection
gh api repos/asmortongpt/Fleet/branches/main/protection --method PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["size-check", "security-scan"]
  },
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "required_linear_history": true,
  "allow_force_pushes": false
}
EOF
```

See DEVOPS_IMPLEMENTATION_REPORT.md for complete details.
