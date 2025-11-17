# Welcome to Fleet Management System, Himanshu!

## Quick Start

### 1. Azure DevOps Access

You should have received an invitation email from Microsoft Azure DevOps.

1. Check your inbox at **Himanshu.badola.proff@gmail.com**
2. Click "Accept invitation" 
3. Sign in with your Gmail account
4. You'll have access to: https://dev.azure.com/CapitalTechAlliance/FleetManagement

### 2. Kubernetes Cluster Access

**Kubeconfig File:** `vendor-kubeconfig.yaml`

**Setup:**
```bash
# On your machine
export KUBECONFIG=/path/to/vendor-kubeconfig.yaml

# Test access
kubectl get pods -n fleet-dev
kubectl get pods -n fleet-staging
```

**Your Access:**
- ✅ Development environment (fleet-dev): Full access
- ✅ Staging environment (fleet-staging): Read-only  
- ❌ Production environment: No access (security)

### 3. Next Steps

1. Read `VENDOR_ONBOARDING.md` - Complete onboarding guide (12,000 words)
2. Read `AZURE_DEVOPS_ACCESS.md` - Git workflow and PR process
3. Read `SECURITY_GUIDELINES.md` - Security requirements

### 4. Test Your Access

**Clone Repository:**
```bash
git clone https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
cd Fleet
```

**Deploy to Dev:**
```bash
# Make sure KUBECONFIG is set
kubectl config current-context  # Should show: fleet-vendor-context

# Deploy
./deployment/scripts/deploy-dev.sh
```

### 5. Important Contacts

- Project Repository: https://dev.azure.com/CapitalTechAlliance/FleetManagement
- Production URL: http://68.220.148.2 (view only - you cannot deploy here)
- Dev Environment: fleet-dev namespace
- Staging Environment: fleet-staging namespace

### 6. Need Help?

Reply to the email or reach out!

---
**Security Reminder:** Keep the kubeconfig file secure. Do not commit it to git or share it publicly.
