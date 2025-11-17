# How to Grant Vendor Access - Complete Walkthrough

## Step 1: Create Azure DevOps PAT Token (5 minutes)

1. **Open Azure DevOps in browser:**
   ```
   https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens
   ```

2. **Click "New Token"**

3. **Configure the token:**
   - **Name:** `External Vendor - [Vendor Company Name]`
   - **Organization:** CapitalTechAlliance
   - **Expiration:** 180 days (or custom date)
   - **Scopes:** Click "Show all scopes" and select:
     - ✅ Code: Read, Write
     - ✅ Work Items: Read, Write  
     - ✅ Build: Read, Execute
     - ✅ Project and Team: Read

4. **Click "Create"**

5. **IMPORTANT:** Copy the token immediately (it's only shown once!)

6. **Save the token to a file:**
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access
   
   # Paste the token when prompted
   echo "PASTE_TOKEN_HERE" > azure-devops-pat.txt
   
   # Secure the file
   chmod 600 azure-devops-pat.txt
   ```

---

## Step 2: Encrypt the Credentials (2 minutes)

**Install GPG if needed:**
```bash
# Check if gpg is installed
which gpg

# If not installed (macOS):
brew install gnupg
```

**Encrypt both credential files:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access

# Encrypt kubeconfig
gpg -c vendor-kubeconfig.yaml
# Enter a strong passphrase when prompted (you'll share this separately)
# Creates: vendor-kubeconfig.yaml.gpg

# Encrypt Azure DevOps PAT
gpg -c azure-devops-pat.txt
# Use the SAME passphrase
# Creates: azure-devops-pat.txt.gpg

# Verify encrypted files exist
ls -lh *.gpg
```

**Remember the passphrase - you'll send it separately!**

---

## Step 3: Create Distribution Package (3 minutes)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access

# Create distribution folder
mkdir -p vendor-distribution-package

# Copy encrypted credentials
cp vendor-kubeconfig.yaml.gpg vendor-distribution-package/
cp azure-devops-pat.txt.gpg vendor-distribution-package/

# Copy documentation
cp VENDOR_ONBOARDING.md vendor-distribution-package/
cp AZURE_DEVOPS_ACCESS.md vendor-distribution-package/
cp SECURITY_GUIDELINES.md vendor-distribution-package/
cp README.md vendor-distribution-package/

# Create a start here file
cat > vendor-distribution-package/START_HERE.txt <<'INNEREOF'
==========================================================
FLEET MANAGEMENT SYSTEM - VENDOR ACCESS PACKAGE
==========================================================

Welcome! This package contains everything you need to get started.

ENCRYPTED FILES (require password):
-----------------------------------
1. vendor-kubeconfig.yaml.gpg - Kubernetes cluster access
2. azure-devops-pat.txt.gpg - Azure DevOps repository access

The decryption password will be sent via separate secure channel.

DOCUMENTATION (read in order):
------------------------------
1. START HERE FIRST: VENDOR_ONBOARDING.md
2. Azure DevOps: AZURE_DEVOPS_ACCESS.md
3. Security: SECURITY_GUIDELINES.md
4. Package Info: README.md

QUICK START:
------------
1. Read VENDOR_ONBOARDING.md completely
2. Install required tools (kubectl, az cli, docker, git, node)
3. Wait for decryption password (sent separately)
4. Decrypt files:
   gpg -d vendor-kubeconfig.yaml.gpg > vendor-kubeconfig.yaml
   gpg -d azure-devops-pat.txt.gpg > azure-devops-pat.txt
5. Follow setup in VENDOR_ONBOARDING.md
6. Schedule kickoff call

SUPPORT:
--------
Technical: dev@capitaltechalliance.com
Security: security@capitaltechalliance.com
Emergency: [Contact provided separately]

SECURITY REMINDER:
------------------
- Keep credentials encrypted
- Don't share with anyone
- Report security issues immediately
- No production access (by design)

Questions? Email dev@capitaltechalliance.com
==========================================================
INNEREOF

# Create compressed archive
cd vendor-distribution-package
tar -czf ../fleet-vendor-access-$(date +%Y%m%d).tar.gz .
cd ..

echo ""
echo "✅ Distribution package created:"
ls -lh fleet-vendor-access-*.tar.gz
```

---

## Step 4: Send to Vendor (Two-Factor Delivery)

### Method 1: Email + Phone (Recommended)

**A. Send the Package via Email:**

```
To: vendor@theircompany.com
Subject: Fleet Management System - Access Package

Hi [Vendor Contact Name],

Attached is the vendor access package for the Fleet Management System project.

IMPORTANT:
- The files are encrypted with GPG
- You will receive the decryption password via phone call shortly
- Do not share credentials with anyone
- Read START_HERE.txt first

Package contents:
- Kubernetes cluster access (dev and staging environments)
- Azure DevOps repository access
- Complete documentation (30,000+ words)
- Security guidelines

After decrypting:
1. Read VENDOR_ONBOARDING.md completely
2. Install required tools
3. Follow setup instructions
4. Schedule kickoff meeting

Questions? Reply to this email or call me at [YOUR PHONE].

Best regards,
[Your Name]
[Your Title]
Capital Tech Alliance
```

**Attach:** `fleet-vendor-access-YYYYMMDD.tar.gz`

**B. Call the Vendor and Provide Password:**

Call them and say:
```
"Hi, I just sent you the Fleet access package via email.
The GPG decryption password is: [READ THE PASSWORD CLEARLY]
Please write it down. I'll send a confirmation text as well."
```

**C. Send Confirmation Text:**
```
"Fleet access package password: [PASSWORD]
Expires in 180 days. Contact dev@capitaltechalliance.com with questions."
```

---

### Method 2: Secure File Transfer (More Secure)

**Option A: Azure Storage with SAS Token**
```bash
# Upload to Azure Storage
az storage blob upload \
  --account-name yourstorageaccount \
  --container-name vendor-access \
  --name fleet-vendor-access.tar.gz \
  --file fleet-vendor-access-$(date +%Y%m%d).tar.gz

# Generate SAS token (expires in 7 days)
az storage blob generate-sas \
  --account-name yourstorageaccount \
  --container-name vendor-access \
  --name fleet-vendor-access.tar.gz \
  --permissions r \
  --expiry $(date -u -d "7 days" '+%Y-%m-%dT%H:%MZ') \
  --https-only

# Send the SAS URL to vendor
# Send password separately via phone
```

**Option B: Dropbox/Google Drive**
- Upload encrypted archive to your Dropbox/Drive
- Share link with vendor (make it expire in 7 days)
- Send password via phone

---

## Step 5: Verify Vendor Access (After They Complete Setup)

**Have the vendor test their access:**

```bash
# They should run these commands and share results with you:

# Test Kubernetes dev access
KUBECONFIG=vendor-kubeconfig.yaml kubectl get pods -n fleet-dev

# Test Kubernetes staging access (read-only)
KUBECONFIG=vendor-kubeconfig.yaml kubectl get pods -n fleet-staging

# Test production is denied (should fail)
KUBECONFIG=vendor-kubeconfig.yaml kubectl get pods -n fleet-management

# Test Azure DevOps access
az devops login
az repos list --project FleetManagement
```

**Expected results:**
- ✅ Dev: Can list pods (may be empty)
- ✅ Staging: Can list pods (may be empty)
- ❌ Production: Error - Forbidden (correct!)
- ✅ Azure DevOps: Can see Fleet repository

---

## Step 6: Schedule Kickoff Meeting

**Send meeting invite:**

```
Subject: Fleet Management System - Vendor Kickoff

Attendees:
- You
- Vendor technical lead
- Vendor developers
- Your technical lead (optional)

Agenda (1 hour):
1. Introductions (5 min)
2. Project overview (10 min)
3. Architecture walkthrough (10 min)
4. Development workflow (15 min)
5. Communication channels (5 min)
6. Q&A (15 min)

Preparation:
- Vendor: Read VENDOR_ONBOARDING.md
- Vendor: Complete access setup
- Vendor: Test access to all environments

Join via: [Teams/Zoom link]
```

---

## Quick Command Summary

**Complete setup in one go:**

```bash
# Navigate to vendor access folder
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/vendor-access

# Create PAT and save it
echo "YOUR_PAT_TOKEN" > azure-devops-pat.txt
chmod 600 azure-devops-pat.txt

# Encrypt everything (use same passphrase for both)
gpg -c vendor-kubeconfig.yaml
gpg -c azure-devops-pat.txt

# Create distribution package
mkdir -p vendor-distribution-package
cp vendor-kubeconfig.yaml.gpg vendor-distribution-package/
cp azure-devops-pat.txt.gpg vendor-distribution-package/
cp *.md vendor-distribution-package/
cd vendor-distribution-package
tar -czf ../fleet-vendor-access-$(date +%Y%m%d).tar.gz .
cd ..

# Send to vendor
# Email: fleet-vendor-access-YYYYMMDD.tar.gz
# Phone: [decryption password]
```

---

## Security Checklist

Before sending:
- [ ] PAT token created with correct scopes
- [ ] PAT token saved to azure-devops-pat.txt
- [ ] Both files encrypted with same passphrase
- [ ] Passphrase is strong (16+ characters)
- [ ] Distribution package created
- [ ] Original unencrypted files secured (not in package)
- [ ] Two-factor delivery planned (file + separate password)

After vendor setup:
- [ ] Vendor confirmed successful decryption
- [ ] Vendor tested dev access (working)
- [ ] Vendor tested staging access (working)
- [ ] Vendor tested production access (denied - correct)
- [ ] Vendor tested Azure DevOps access (working)
- [ ] Kickoff meeting scheduled
- [ ] Communication channels established

---

## Troubleshooting

**Vendor says: "I can't decrypt the files"**
- Verify they installed GPG: `brew install gnupg` (macOS)
- Verify they're using correct command: `gpg -d file.gpg > file.txt`
- Verify you gave them correct passphrase
- Try decrypting on your end to verify files are valid

**Vendor says: "kubectl says Forbidden"**
- Check they're using the kubeconfig: `export KUBECONFIG=/path/to/vendor-kubeconfig.yaml`
- Check the ServiceAccount still exists: `kubectl get sa vendor-developer -n fleet-dev`
- Check the RoleBindings exist: `kubectl get rolebinding -n fleet-dev | grep vendor`

**Vendor says: "Azure DevOps won't let me in"**
- Verify PAT hasn't expired
- Verify PAT has correct scopes
- Have them try: `az devops login` and paste the PAT when prompted
- Check token at: https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens

---

## Revoking Access (When Project Ends)

```bash
# Delete Kubernetes access
kubectl delete serviceaccount vendor-developer -n fleet-dev
kubectl delete serviceaccount vendor-developer -n fleet-staging
kubectl delete rolebinding vendor-developer-binding -n fleet-dev
kubectl delete rolebinding vendor-developer-binding -n fleet-staging
kubectl delete clusterrolebinding vendor-readonly-cluster-binding

# Revoke Azure DevOps PAT
# Go to: https://dev.azure.com/CapitalTechAlliance/_usersSettings/tokens
# Find the vendor's token and click "Revoke"

# Notify vendor
# Send email confirming access has been revoked
# Thank them for their work
```

---

**Need help?** Contact dev@capitaltechalliance.com

