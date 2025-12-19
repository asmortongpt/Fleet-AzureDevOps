# Grant Access to Himanshu Badola

## Email: Himanshu.badola.proff@gmail.com

---

## Step 1: Add Himanshu to Azure DevOps (5 minutes)

### Option A: Via Web Interface (Easiest)

1. Go to: https://dev.azure.com/CapitalTechAlliance/_settings/users

2. Click "Add users" button

3. Enter details:
   - Email addresses: Himanshu.badola.proff@gmail.com
   - Access level: Basic (gives full code access)
   - Add to projects: FleetManagement
   - Azure DevOps Groups: Contributors
   
4. Click "Add"

5. Himanshu will receive an email invitation at Himanshu.badola.proff@gmail.com

### Option B: Via Azure CLI

```bash
# Add Himanshu as a user
az devops user add \
  --email-id Himanshu.badola.proff@gmail.com \
  --license-type express \
  --organization https://dev.azure.com/CapitalTechAlliance

# Add him to the FleetManagement project
az devops security group membership add \
  --group-id "[FleetManagement]\Contributors" \
  --member-id Himanshu.badola.proff@gmail.com \
  --organization https://dev.azure.com/CapitalTechAlliance
```

---

## Step 2: Prepare Kubernetes Access Package (3 minutes)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access

# Create package directory
mkdir -p himanshu-access-package

# Copy kubeconfig (already generated)
cp vendor-kubeconfig.yaml himanshu-access-package/

# Copy documentation
cp VENDOR_ONBOARDING.md himanshu-access-package/
cp AZURE_DEVOPS_ACCESS.md himanshu-access-package/
cp SECURITY_GUIDELINES.md himanshu-access-package/

# If you have the PAT token, add it
# echo "YOUR_CUSTOM_PAT_TOKEN" > himanshu-access-package/azure-devops-pat.txt

# Create README for Himanshu
cat > himanshu-access-package/START_HERE.md <<'INNER_EOF'
# Welcome to Fleet Management System, Himanshu!

## Quick Start

### 1. Azure DevOps Access

You should have received an invitation email from Microsoft Azure DevOps.

1. Check your inbox at Himanshu.badola.proff@gmail.com
2. Click "Accept invitation" 
3. Sign in with your Gmail account
4. You'll have access to: https://dev.azure.com/CapitalTechAlliance/FleetManagement

### 2. Kubernetes Cluster Access

**Kubeconfig File:** vendor-kubeconfig.yaml

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

1. Read `VENDOR_ONBOARDING.md` - Complete onboarding guide
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

### 5. Need Help?

Reply to the email or reach out!

---
**Important:** Keep the kubeconfig file secure. Do not commit it to git or share it.
INNER_EOF

# Create archive
tar -czf himanshu-access-package.tar.gz himanshu-access-package/

echo "✅ Package created: himanshu-access-package.tar.gz"
echo ""
echo "Next: Email this package to Himanshu"
```

---

## Step 3: Email Himanshu (2 minutes)

### Email Template

**To:** Himanshu.badola.proff@gmail.com

**Subject:** Fleet Management System - Developer Access

**Body:**

```
Hi Himanshu,

Welcome to the Fleet Management System project!

I've set up your access to both Azure DevOps and our Kubernetes development environments.

## Azure DevOps Access

You should receive a separate invitation email from Microsoft Azure DevOps shortly (if you haven't already). 

Please:
1. Check your inbox for "Azure DevOps invitation"
2. Click "Accept invitation"
3. Sign in with your Gmail account (Himanshu.badola.proff@gmail.com)

Repository: https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet

## Kubernetes Cluster Access

Attached is your access package (himanshu-access-package.tar.gz).

To set up:
```bash
tar -xzf himanshu-access-package.tar.gz
cd himanshu-access-package
cat START_HERE.md  # Follow instructions
```

The package includes:
- Kubernetes config file (vendor-kubeconfig.yaml)
- Complete onboarding documentation
- Security guidelines
- Azure DevOps workflow guide

## Your Access

✅ Development Environment: Full deployment access
✅ Staging Environment: Read-only access
✅ Azure DevOps: Code repository (read/write)
❌ Production: No access (per security policy)

## Need Help?

All documentation is in the package. If you have any questions:
- Reply to this email
- Or call me: [YOUR PHONE]

Looking forward to working with you!

Best,
[Your Name]
```

---

## Step 4: Verify Access (Optional)

After Himanshu accepts and sets up:

```bash
# Check Azure DevOps membership
az devops security group membership list \
  --id "[FleetManagement]\Contributors" \
  --organization https://dev.azure.com/CapitalTechAlliance

# Check if he can access Kubernetes
# (Have him run this and send you the output)
kubectl auth can-i get pods -n fleet-dev --as=system:serviceaccount:fleet-dev:vendor-developer
# Should return: yes
```

---

## Security Checklist

Before sending:
- [ ] Kubeconfig has proper RBAC (dev full, staging read, production denied)
- [ ] Azure DevOps invitation sent to correct email
- [ ] Documentation includes security guidelines
- [ ] Package is sent via secure method (encrypted email/secure file share)
- [ ] Himanshu's email confirmed: Himanshu.badola.proff@gmail.com

After Himanshu sets up:
- [ ] Himanshu confirms Azure DevOps access
- [ ] Himanshu confirms Kubernetes access to dev
- [ ] Himanshu confirms NO access to production
- [ ] Himanshu has read security guidelines

---

## Revoke Access (When Needed)

### Azure DevOps
```bash
az devops user remove \
  --user Himanshu.badola.proff@gmail.com \
  --organization https://dev.azure.com/CapitalTechAlliance
```

### Kubernetes
```bash
kubectl delete serviceaccount vendor-developer -n fleet-dev
kubectl delete serviceaccount vendor-developer -n fleet-staging
kubectl delete clusterrolebinding vendor-readonly-cluster-binding
```

---

Done! Himanshu will have everything he needs to start development work.
