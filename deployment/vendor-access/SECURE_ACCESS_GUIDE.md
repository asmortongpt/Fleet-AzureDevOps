# Secure Vendor Access Guide

## Overview

This guide documents the secure process for granting temporary access to external vendors and contractors. **NEVER commit credentials or kubeconfig files to version control.**

## Security Principles

1. **Temporary Access**: All vendor access should be time-limited
2. **Least Privilege**: Grant only the minimum necessary permissions
3. **Audit Trail**: Log all access grants and revocations
4. **Secure Transfer**: Use encrypted channels for credential distribution
5. **Regular Rotation**: Regenerate credentials regularly

## Generating Temporary Kubernetes Access

### Quick Start

```bash
cd deployment/vendor-access

# Generate a 24-hour access token (default)
./generate-temporary-kubeconfig.sh

# Generate access for specific duration
EXPIRY_HOURS=48 ./generate-temporary-kubeconfig.sh

# Generate for specific namespace
NAMESPACE=fleet-staging ./generate-temporary-kubeconfig.sh
```

### Configuration Options

Environment variables you can set:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLUSTER_NAME` | Kubernetes cluster name | `fleet-aks-cluster` |
| `NAMESPACE` | Target namespace | `fleet-dev` |
| `SERVICE_ACCOUNT_NAME` | Service account name | `vendor-developer` |
| `EXPIRY_HOURS` | Token expiration time | `24` |
| `OUTPUT_FILE` | Output kubeconfig filename | `vendor-kubeconfig-TIMESTAMP.yaml` |

### Permissions Granted

The generated access includes:

**Read-only access to:**
- Pods and pod logs
- Services
- ConfigMaps
- Deployments
- ReplicaSets
- StatefulSets

**No access to:**
- Secrets
- PersistentVolumes
- RBAC resources
- Cluster-level resources

## Secure Distribution Process

### Step 1: Generate Access

```bash
# Generate temporary kubeconfig
./generate-temporary-kubeconfig.sh

# Output: vendor-kubeconfig-20251119-143022.yaml
```

### Step 2: Encrypt the File

**Option A: GPG Encryption (Recommended)**

```bash
# Encrypt for specific recipient
gpg --encrypt --recipient vendor@example.com vendor-kubeconfig-*.yaml

# This creates vendor-kubeconfig-*.yaml.gpg
```

**Option B: Password-Protected Archive**

```bash
# Create encrypted zip (requires password)
zip -e vendor-access.zip vendor-kubeconfig-*.yaml

# Or using 7zip
7z a -p vendor-access.7z vendor-kubeconfig-*.yaml
```

### Step 3: Secure Transfer

**Recommended Methods:**

1. **Azure Key Vault Secret**
   ```bash
   az keyvault secret set \
     --vault-name fleet-keyvault \
     --name "vendor-kubeconfig-$(date +%Y%m%d)" \
     --file vendor-kubeconfig-*.yaml \
     --expires "$(date -d '+24 hours' -Iseconds)"
   ```

2. **Encrypted Email**
   - Use GPG-encrypted attachment
   - Send password via separate channel (SMS/phone)

3. **Secure File Sharing**
   - OneDrive/SharePoint with expiring links
   - Azure Storage with SAS token
   - Never use unencrypted email

### Step 4: Vendor Usage

Provide these instructions to the vendor:

```bash
# Download and decrypt the kubeconfig file
gpg --decrypt vendor-kubeconfig-20251119.yaml.gpg > kubeconfig.yaml

# Set environment variable
export KUBECONFIG=$(pwd)/kubeconfig.yaml

# Verify access
kubectl get pods -n fleet-dev

# When done, securely delete the file
shred -u kubeconfig.yaml  # Linux
# OR
srm kubeconfig.yaml       # macOS with srm installed
```

## Revoking Access

### Immediate Revocation

If access needs to be revoked before expiration:

```bash
# Delete the service account token
kubectl delete serviceaccount vendor-developer -n fleet-dev

# Recreate for future use
kubectl create serviceaccount vendor-developer -n fleet-dev
```

### Audit Access

```bash
# Check active tokens
kubectl get serviceaccount vendor-developer -n fleet-dev -o yaml

# View recent API calls (if audit logging enabled)
kubectl logs -n kube-system -l component=kube-apiserver | grep vendor-developer
```

## Alternative Access Methods

### Azure DevOps Access

For build pipeline integration, use Azure DevOps service connections instead of direct kubeconfig:

1. In Azure DevOps, go to Project Settings > Service Connections
2. Create new Kubernetes service connection
3. Use Azure subscription authentication
4. Grant specific pipeline permissions only

### Temporary VM Access

For troubleshooting:

```bash
# Create temporary VM with kubectl access
az vm create \
  --resource-group fleet-rg \
  --name vendor-jumpbox \
  --image UbuntuLTS \
  --assign-identity \
  --role Reader \
  --scope /subscriptions/{subscription-id}

# Grant temporary VM access to vendor
# Revoke when done
```

## Security Checklist

Before granting vendor access:

- [ ] Verify vendor identity and authorization
- [ ] Set appropriate expiration time (prefer 24-48 hours)
- [ ] Use encrypted transfer method
- [ ] Document access grant in security log
- [ ] Schedule access revocation reminder
- [ ] Verify least-privilege permissions
- [ ] Enable audit logging for vendor actions

After vendor work is complete:

- [ ] Revoke service account token
- [ ] Delete shared kubeconfig files
- [ ] Review audit logs for vendor actions
- [ ] Document work completed and access revoked
- [ ] Remove vendor from any Azure AD groups if applicable

## File Security

### What NOT to Commit

**NEVER commit these files to git:**

```
❌ vendor-kubeconfig.yaml
❌ vendor-kubeconfig.yaml.gpg
❌ azure-devops-pat.txt
❌ *.pem, *.key files
❌ .env files with real credentials
```

### .gitignore Protection

The following patterns are already in `.gitignore`:

```gitignore
# Kubernetes credentials
*-secrets.yaml
*secret*.yaml
vendor-kubeconfig.yaml
vendor-kubeconfig.yaml.gpg
deployment/vendor-access/vendor-kubeconfig.yaml
deployment/vendor-access/vendor-distribution-package/
deployment/vendor-access/.vendor-credentials/

# Azure DevOps tokens
azure-devops-pat.txt
azure-devops-pat.txt.gpg
```

## Monitoring and Alerts

Set up alerts for:

1. **Failed authentication attempts**
   ```bash
   kubectl logs -n kube-system -l component=kube-apiserver | grep "authentication failed"
   ```

2. **Unusual API activity**
   - High frequency of API calls
   - Access to unexpected namespaces
   - Permission denied errors

3. **Service account token creation**
   ```bash
   kubectl get events --all-namespaces --field-selector reason=TokenCreated
   ```

## Compliance Notes

This process helps meet compliance requirements:

- **SOC 2**: Temporary access controls, audit trails
- **ISO 27001**: Access management procedures
- **NIST 800-53**: AC-2 (Account Management), AC-6 (Least Privilege)
- **FedRAMP**: IA-2, AC-2, AU-2 (Access and Audit controls)

## Support and Questions

For questions about vendor access:

- Security team: security@fleet.example.com
- DevOps team: devops@fleet.example.com
- Emergency access revocation: Call security hotline

## Appendix: Example Access Grant Log

Keep a log of all vendor access grants:

```
Date: 2025-11-19
Vendor: Himanshu Contractor
Purpose: Kubernetes troubleshooting
Duration: 24 hours
Namespace: fleet-dev
Granted by: Admin Name
Revoked: 2025-11-20
Notes: Access expired automatically, no manual revocation needed
```
