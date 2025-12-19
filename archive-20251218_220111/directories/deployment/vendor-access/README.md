# Vendor Access Package - Fleet Management System

**Version:** 1.0
**Created:** 2025-11-09
**Classification:** Confidential - External Vendor Access

---

## Overview

This package contains everything needed to grant secure access to external vendor developers for the Fleet Management System project.

**Purpose:** Enable vendor developers to:
- Access development and staging environments
- Deploy code changes
- Access source code repositories
- Follow security best practices
- Communicate effectively with the team

---

## Package Contents

### 1. RBAC Configuration Files

**Kubernetes Role-Based Access Control:**
- `rbac-serviceaccount.yaml` - ServiceAccount for vendor in dev and staging namespaces
- `rbac-role-dev.yaml` - Full access role for development environment
- `rbac-role-staging.yaml` - Limited access role for staging environment
- `rbac-rolebinding.yaml` - Binds ServiceAccount to roles
- `rbac-clusterrole-readonly.yaml` - Read-only access to cluster-wide resources

**Access Levels:**
| Environment | Pods | Deployments | Services | ConfigMaps | Secrets | Ingress |
|-------------|------|-------------|----------|------------|---------|---------|
| Development | Full | Full | Full | Full | Read | Full |
| Staging | Read | Update | Read | Read | Read | Read |
| Production | None | None | None | None | None | None |

### 2. Scripts

**generate-kubeconfig.sh** - Automated script to:
- Apply RBAC configurations to Kubernetes
- Create ServiceAccount tokens
- Generate kubeconfig file for vendor
- Test vendor access to all environments
- Provide secure distribution instructions

**Usage:**
```bash
cd deployment/vendor-access
chmod +x generate-kubeconfig.sh
./generate-kubeconfig.sh
```

**Output:**
- `vendor-kubeconfig.yaml` - Kubernetes access configuration (share encrypted)

### 3. Documentation

**VENDOR_ONBOARDING.md** (12,000+ words)
Comprehensive onboarding guide including:
- Welcome and project overview
- System architecture
- Access setup procedures
- Development environment setup
- Deployment procedures
- Security guidelines
- Communication channels
- Acceptance criteria
- Quick reference guide

**AZURE_DEVOPS_ACCESS.md** (7,000+ words)
Complete Azure DevOps guide including:
- Authentication setup
- Repository access
- Branch strategy
- Pull request workflow
- Work item management
- CI/CD pipeline information
- Code review guidelines
- Best practices
- Troubleshooting

**SECURITY_GUIDELINES.md** (10,000+ words)
Detailed security documentation including:
- Access control policies
- Authentication & authorization
- Data protection requirements
- Secure coding practices
- Secrets management
- Dependency management
- Infrastructure security
- Incident response procedures
- Compliance requirements
- Security checklist

**This README.md**
Package overview and setup instructions

---

## Setup Instructions

### For Project Administrator

#### Step 1: Generate Access Credentials

```bash
# Navigate to vendor access directory
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access

# Make script executable
chmod +x generate-kubeconfig.sh

# Run script (requires kubectl access to AKS cluster)
./generate-kubeconfig.sh
```

**Script Output:**
- ✅ RBAC configurations applied
- ✅ ServiceAccounts created
- ✅ Kubeconfig file generated: `vendor-kubeconfig.yaml`
- ✅ Access tested and verified

#### Step 2: Prepare Azure DevOps Access

**Create Personal Access Token (PAT):**
1. Go to https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens
2. Click "New Token"
3. Configuration:
   - Name: "External Vendor - [Company Name]"
   - Organization: CapitalTechAlliance
   - Expiration: 180 days
   - Scopes:
     - Code: Read, Write
     - Work Items: Read, Write
     - Build: Read, Execute
4. Click "Create"
5. Copy token (only shown once!)

**Save Token to File:**
```bash
echo "YOUR_PAT_TOKEN_HERE" > azure-devops-pat.txt
chmod 600 azure-devops-pat.txt
```

#### Step 3: Encrypt Credentials

**Install GPG if needed:**
```bash
# macOS
brew install gnupg

# Linux
sudo apt-get install gnupg
```

**Encrypt Files:**
```bash
# Encrypt kubeconfig
gpg -c vendor-kubeconfig.yaml
# Creates: vendor-kubeconfig.yaml.gpg

# Encrypt Azure DevOps PAT
gpg -c azure-devops-pat.txt
# Creates: azure-devops-pat.txt.gpg

# Use strong passphrase when prompted
```

**Secure Original Files:**
```bash
# Store originals securely (not in git)
mkdir -p ~/.vendor-access-credentials
mv vendor-kubeconfig.yaml ~/.vendor-access-credentials/
mv azure-devops-pat.txt ~/.vendor-access-credentials/
chmod 700 ~/.vendor-access-credentials
```

#### Step 4: Prepare Distribution Package

**Create distribution folder:**
```bash
mkdir -p vendor-distribution-package
```

**Copy encrypted credentials:**
```bash
cp vendor-kubeconfig.yaml.gpg vendor-distribution-package/
cp azure-devops-pat.txt.gpg vendor-distribution-package/
```

**Copy documentation:**
```bash
cp VENDOR_ONBOARDING.md vendor-distribution-package/
cp AZURE_DEVOPS_ACCESS.md vendor-distribution-package/
cp SECURITY_GUIDELINES.md vendor-distribution-package/
cp README.md vendor-distribution-package/
```

**Create summary document:**
```bash
cat > vendor-distribution-package/START_HERE.txt <<EOF
Fleet Management System - Vendor Access Package
================================================

Welcome! This package contains everything you need to get started.

IMPORTANT SECURITY NOTICE:
- These files contain encrypted access credentials
- You will receive the decryption password via separate secure channel
- Do not share credentials with anyone
- Report any security concerns immediately to security@capitaltechalliance.com

FILES INCLUDED:
===============

Encrypted Credentials (require decryption password):
- vendor-kubeconfig.yaml.gpg - Kubernetes cluster access
- azure-devops-pat.txt.gpg - Azure DevOps access token

Documentation (read in this order):
1. VENDOR_ONBOARDING.md - START HERE - Complete onboarding guide
2. AZURE_DEVOPS_ACCESS.md - Source code and repository access
3. SECURITY_GUIDELINES.md - Security requirements and best practices

FIRST STEPS:
============

1. Read VENDOR_ONBOARDING.md completely
2. Install required software (kubectl, az, docker, git, node)
3. Wait for decryption password (sent via separate secure channel)
4. Decrypt credentials using GPG:
   gpg -d vendor-kubeconfig.yaml.gpg > vendor-kubeconfig.yaml
   gpg -d azure-devops-pat.txt.gpg > azure-devops-pat.txt
5. Follow setup instructions in VENDOR_ONBOARDING.md
6. Schedule kickoff meeting with project lead

SUPPORT CONTACTS:
=================

Project Lead: [To be provided separately]
Technical Support: dev@capitaltechalliance.com
Security Issues: security@capitaltechalliance.com
Emergency: [To be provided separately]

IMPORTANT REMINDERS:
====================

✅ DO:
- Follow all security guidelines
- Report security concerns immediately
- Keep credentials encrypted and secure
- Communicate regularly with project team
- Document your work

❌ DON'T:
- Share credentials with anyone
- Commit credentials to version control
- Access production environment
- Expose sensitive data in logs
- Work without proper authorization

Questions? Contact dev@capitaltechalliance.com

EOF
```

#### Step 5: Create Archive

```bash
# Create compressed archive
cd vendor-distribution-package
tar -czf ../fleet-vendor-access-$(date +%Y%m%d).tar.gz .
cd ..
```

#### Step 6: Distribute Securely

**Option A: Secure File Transfer**
```bash
# Use encrypted file transfer service
# Examples: Tresorit, SecureTransfer, Azure Files with SAS token
```

**Option B: Physical Media** (for high-security requirements)
```bash
# Copy to encrypted USB drive
# Deliver via courier
```

**Send Decryption Password Separately:**
- Use different communication channel
- Phone call
- SMS
- Separate encrypted email
- In-person meeting

**Recommended: Use two-factor delivery**
1. Send encrypted files via secure file transfer
2. Send decryption password via phone call
3. Confirm receipt via email

---

## Verification Checklist

### Before Distribution

Administrator checklist:
- [ ] RBAC configurations applied to Kubernetes cluster
- [ ] ServiceAccounts created in dev and staging namespaces
- [ ] Kubeconfig generated and tested
- [ ] Azure DevOps PAT created with correct scopes
- [ ] All credentials encrypted with strong passphrase
- [ ] Documentation reviewed and updated
- [ ] Contact information updated in documents
- [ ] Distribution package created
- [ ] Secure distribution method arranged
- [ ] Decryption password prepared for separate delivery

### After Vendor Receives Package

Vendor checklist (from VENDOR_ONBOARDING.md):
- [ ] Received and verified all files
- [ ] Received decryption password via separate channel
- [ ] Successfully decrypted credentials
- [ ] Installed required software
- [ ] Configured Kubernetes access
- [ ] Tested kubectl access to dev environment
- [ ] Tested kubectl access to staging environment
- [ ] Verified production access is denied
- [ ] Configured Azure DevOps access
- [ ] Cloned repository
- [ ] Read all documentation
- [ ] Scheduled kickoff meeting

---

## Access Management

### Monitoring Vendor Access

**Check ServiceAccount Usage:**
```bash
# View vendor pods in dev
kubectl get pods -n fleet-dev -l user=vendor

# View vendor activity logs
kubectl logs -n fleet-dev -l user=vendor --tail=100

# Check audit logs
kubectl get events -n fleet-dev --field-selector involvedObject.kind=Pod
```

**Review Azure DevOps Activity:**
```bash
# View vendor commits
az repos pr list --creator "vendor@example.com" --project FleetManagement

# View vendor work items
az boards query --wiql "SELECT * FROM WorkItems WHERE [System.AssignedTo] = 'vendor@example.com'"
```

### Revoking Access

**If access needs to be revoked:**

**1. Revoke Kubernetes Access:**
```bash
# Delete ServiceAccounts
kubectl delete serviceaccount vendor-developer -n fleet-dev
kubectl delete serviceaccount vendor-developer -n fleet-staging

# Delete RoleBindings
kubectl delete rolebinding vendor-developer-binding -n fleet-dev
kubectl delete rolebinding vendor-developer-binding -n fleet-staging

# Verify removal
kubectl get sa,rolebinding -n fleet-dev | grep vendor
kubectl get sa,rolebinding -n fleet-staging | grep vendor
```

**2. Revoke Azure DevOps Access:**
```bash
# List PAT tokens
az devops security permission list

# Revoke specific token (via web interface)
# https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens
```

**3. Notify Vendor:**
```
Subject: Access Revocation - Fleet Management System

Dear [Vendor Contact],

Access to the Fleet Management System has been revoked effective [DATE].

Reasons: [Provide reason]

Your credentials are no longer valid:
- Kubernetes access: Revoked
- Azure DevOps access: Revoked
- Repository access: Revoked

Please:
1. Delete all local copies of credentials
2. Return any documentation marked confidential
3. Confirm completion of assigned work items
4. Transfer knowledge to [replacement/internal team]

If you have questions, contact: [Project Lead Email]

Thank you for your contributions to the project.

Regards,
[Your Name]
Project Administrator
```

### Rotating Credentials

**Regular rotation (recommended every 90 days):**

```bash
# 1. Generate new kubeconfig
./generate-kubeconfig.sh

# 2. Create new Azure DevOps PAT
# (via web interface)

# 3. Encrypt and distribute new credentials
gpg -c vendor-kubeconfig.yaml
# Send to vendor via secure channel

# 4. Revoke old credentials after vendor confirms new access
# (allow overlap period for smooth transition)
```

---

## Troubleshooting

### Script Fails to Generate Kubeconfig

**Error: kubectl not found**
```bash
# Install kubectl
brew install kubectl  # macOS
# or
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

**Error: No permissions to create ServiceAccount**
```bash
# Verify your kubectl context
kubectl config current-context

# Verify you have cluster-admin permissions
kubectl auth can-i create serviceaccount --namespace fleet-dev
```

**Error: Namespace not found**
```bash
# Create namespaces
kubectl create namespace fleet-dev
kubectl create namespace fleet-staging
```

### Vendor Cannot Access Cluster

**Check kubeconfig file:**
```bash
# Verify kubeconfig structure
cat vendor-kubeconfig.yaml

# Test connection
KUBECONFIG=vendor-kubeconfig.yaml kubectl get pods -n fleet-dev
```

**Check ServiceAccount token:**
```bash
# Verify token exists
kubectl get secret -n fleet-dev | grep vendor

# Check token expiration (if applicable)
kubectl get secret vendor-developer-token -n fleet-dev -o yaml
```

### Azure DevOps Access Issues

**PAT token not working:**
- Verify token hasn't expired
- Check token scopes are correct
- Ensure vendor is using correct organization URL
- Try creating new PAT token

---

## Best Practices

### Security

1. **Least Privilege:** Only grant necessary permissions
2. **Regular Audits:** Review vendor access monthly
3. **Credential Rotation:** Rotate credentials every 90 days
4. **Monitoring:** Log and monitor vendor activities
5. **Time-Limited:** Set expiration dates on access
6. **Secure Distribution:** Use encrypted channels only
7. **Separate Channels:** Send credentials and passwords separately
8. **Documentation:** Keep audit trail of all access grants

### Communication

1. **Clear Expectations:** Provide comprehensive onboarding
2. **Regular Check-ins:** Daily standups, weekly reviews
3. **Secure Channels:** Use Microsoft Teams or encrypted email
4. **Responsive:** Respond to vendor questions promptly
5. **Documentation:** Keep all communications documented
6. **Escalation Path:** Provide clear escalation procedures

### Quality Assurance

1. **Code Reviews:** Require reviews for all vendor code
2. **Testing:** Mandate testing in dev before staging
3. **Documentation:** Require documentation updates
4. **Security Scanning:** Run security scans on vendor code
5. **Acceptance Criteria:** Clear definition of done
6. **Performance Standards:** Set and enforce quality standards

---

## Files in This Directory

```
vendor-access/
├── README.md                          # This file - package overview
├── VENDOR_ONBOARDING.md               # Complete onboarding guide (12K words)
├── AZURE_DEVOPS_ACCESS.md             # Azure DevOps guide (7K words)
├── SECURITY_GUIDELINES.md             # Security requirements (10K words)
├── generate-kubeconfig.sh             # Automated credential generation
├── rbac-serviceaccount.yaml           # ServiceAccount definitions
├── rbac-role-dev.yaml                 # Development environment role
├── rbac-role-staging.yaml             # Staging environment role
├── rbac-rolebinding.yaml              # Role bindings
├── rbac-clusterrole-readonly.yaml     # Cluster-wide read access
└── [generated files]
    ├── vendor-kubeconfig.yaml         # Kubernetes access (keep secure!)
    ├── vendor-kubeconfig.yaml.gpg     # Encrypted kubeconfig
    └── azure-devops-pat.txt.gpg       # Encrypted PAT token
```

---

## Support

**For assistance with vendor access setup:**
- Project Lead: [Contact info provided separately]
- DevOps Team: devops@capitaltechalliance.com
- Security Team: security@capitaltechalliance.com

**Documentation Issues:**
- Create issue in Azure DevOps
- Email: dev@capitaltechalliance.com

---

## Version History

**v1.0 - 2025-11-09**
- Initial vendor access package creation
- Complete RBAC configuration
- Comprehensive documentation
- Automated credential generation
- Security guidelines

---

**Document Control:**
- Version: 1.0
- Created: 2025-11-09
- Classification: Confidential
- Distribution: Internal Project Team + External Vendor (encrypted)
- Review Schedule: Monthly
- Next Review: 2025-12-09

---

**IMPORTANT:** This package contains sensitive access credentials. Handle according to security guidelines. Report any security concerns immediately to security@capitaltechalliance.com
