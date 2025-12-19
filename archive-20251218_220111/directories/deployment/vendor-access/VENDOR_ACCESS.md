# Vendor Access Documentation

## Security Update: Secrets Access Removed

As part of our ongoing security hardening efforts, vendor developers no longer have access to Kubernetes secrets in any environment.

## What Changed

### Previous Permissions
- **Dev**: Read access to secrets (`get`, `list`)
- **Staging**: Read access to secrets (`get`, `list`)

### Current Permissions
- **Dev**: No access to secrets
- **Staging**: No access to secrets

## Why This Change?

Kubernetes secrets contain sensitive credentials including:
- Database passwords
- API keys
- Encryption keys
- Third-party service credentials
- JWT signing secrets

Exposing these credentials violates the principle of least privilege and creates security risks.

## Impact on Vendor Developers

### What You CAN Still Do

#### Development Environment (`fleet-dev`)
- Full access to pods (create, delete, exec, view logs)
- Full access to deployments and statefulsets
- Full access to services
- Full access to ConfigMaps
- Full access to ingress resources
- Full access to jobs and cronjobs
- Read access to PersistentVolumeClaims
- Read access to events

#### Staging Environment (`fleet-staging`)
- Read access to pods and logs
- Update deployments (for image changes)
- Read access to services, ConfigMaps, ingress
- Create jobs for testing
- Read access to events

### What You CANNOT Do Anymore

- View or list Kubernetes secrets
- Access sensitive credentials stored in secrets
- Debug applications that require secret values

## Alternatives for Configuration

### For Non-Sensitive Configuration

Use **ConfigMaps** instead of secrets for non-sensitive data:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vendor-test-config
  namespace: fleet-dev
data:
  API_ENDPOINT: "https://api.example.com"
  FEATURE_FLAG_DEBUG: "true"
  LOG_LEVEL: "debug"
```

### For Test Credentials (Dev Only)

Store non-production test credentials in ConfigMaps:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-credentials
  namespace: fleet-dev
data:
  TEST_DB_USER: "testuser"
  TEST_DB_PASSWORD: "testpass123"  # Not a real production password
  TEST_API_KEY: "test-key-12345"
```

**Important**: Never store real production credentials in ConfigMaps!

### For Sealed Secrets (Recommended)

We recommend using **Sealed Secrets** for vendor-facing encrypted configuration:

1. Install the `kubeseal` CLI tool
2. Create a sealed secret:
```bash
echo -n "mypassword" | kubectl create secret generic mysecret \
  --dry-run=client --from-file=password=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml
```
3. Apply the sealed secret:
```bash
kubectl apply -f sealed-secret.yaml -n fleet-dev
```

Sealed secrets can be safely stored in git and only the cluster can decrypt them.

## Working Without Secrets Access

### Debugging Applications

If you need to verify environment variables in a running pod:

```bash
# This will show ConfigMap-based env vars but will hide secret values
kubectl exec -it <pod-name> -n fleet-dev -- env | grep -v SECRET
```

### Requesting Secret Values

If you absolutely need a secret value for debugging:

1. Contact the Fleet Management DevOps team
2. Provide justification for access
3. We will create a time-limited, scoped credential in a ConfigMap
4. Use the temporary credential for debugging
5. The credential will be rotated after use

### Local Development

For local development and testing:

1. Use the provided `.env.example` file as a template
2. Request non-production credentials from the DevOps team
3. Never commit real credentials to git
4. Use test/mock services when possible

## RBAC Permissions Summary

### Development Environment

```yaml
# Full access to:
- pods, pods/log, pods/exec
- deployments, replicasets, statefulsets
- services
- configmaps
- ingresses
- jobs, cronjobs

# Read-only access to:
- persistentvolumeclaims
- events

# No access to:
- secrets
- cluster-level resources
```

### Staging Environment

```yaml
# Read-only access to:
- pods, pods/log
- deployments, replicasets, statefulsets
- services
- configmaps
- ingresses
- events

# Limited write access to:
- deployments (patch only, for image updates)

# Create access to:
- jobs (for testing)

# No access to:
- secrets
- persistentvolumeclaims (no modifications)
- cluster-level resources
```

## Best Practices for Vendor Developers

### 1. Use ConfigMaps for Non-Sensitive Data
```yaml
# Good
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: LOG_LEVEL

# Bad - Don't use secrets for non-sensitive data
```

### 2. Avoid Hardcoding Credentials
```javascript
// Bad
const apiKey = "sk-1234567890abcdef";

// Good - Use environment variables
const apiKey = process.env.API_KEY;
```

### 3. Use Separate Credentials for Each Environment
- Dev credentials should never work in staging/production
- Request environment-specific credentials from DevOps
- Test credentials should be clearly marked as such

### 4. Report Exposed Credentials Immediately
If you accidentally commit credentials to git:
1. Notify the DevOps team immediately
2. Rotate the credentials
3. Remove from git history
4. Update all services using the credential

## Frequently Asked Questions

### Q: How do I test features that require API keys?

**A**: Request test API keys from the DevOps team. These will be stored in a ConfigMap in the dev namespace.

### Q: I need to debug a production issue. Can I get temporary access to secrets?

**A**: No. Production secrets are never shared. We can provide anonymized data or create a staging replica for debugging.

### Q: What about database migrations that need credentials?

**A**: Use the existing database migration jobs that have proper secret access. You can trigger migrations without direct secret access.

### Q: Can I view secrets using `kubectl describe`?

**A**: No. Even `describe` commands on secrets are blocked by RBAC.

### Q: How do I know if my pod has the right environment variables?

**A**: Check the pod's ConfigMap references in the deployment spec. For secret-based env vars, verify they're mounted but you won't see the values.

## Getting Help

### Issues with Access
If you're unable to perform required tasks:
- Contact: devops@fleetmanagement.com
- Slack: #fleet-devops
- Priority issues: Call the DevOps on-call

### Requesting Additional Permissions
To request additional RBAC permissions:
1. Submit a request via the DevOps portal
2. Include business justification
3. Specify the minimum required permissions
4. Requests will be reviewed within 2 business days

### Reporting Security Issues
If you discover a security vulnerability:
- Email: security@fleetmanagement.com
- Do NOT discuss in public channels
- Do NOT attempt to exploit the vulnerability
- We have a responsible disclosure policy

## Migration Guide

### For Existing Vendor Scripts

If your scripts previously accessed secrets:

**Before**:
```bash
# This will now fail
DB_PASSWORD=$(kubectl get secret fleet-secrets -n fleet-dev -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
```

**After**:
```bash
# Use ConfigMap for test credentials
DB_PASSWORD=$(kubectl get configmap test-credentials -n fleet-dev -o jsonpath='{.data.TEST_DB_PASSWORD}')
```

### For CI/CD Pipelines

Update your pipelines to:
1. Use service accounts with appropriate permissions
2. Store credentials in your CI/CD tool's secret management
3. Never hardcode credentials in pipeline definitions

## Compliance and Audit

This change brings us into compliance with:
- SOC 2 Type II requirements
- GDPR data protection principles
- ISO 27001 access control standards
- Company security policy

All RBAC permission changes are:
- Logged and audited
- Reviewed quarterly
- Subject to compliance audits

## Timeline

- **Effective Date**: Immediately upon deployment
- **Grace Period**: None (security requirement)
- **Review Date**: Quarterly review of vendor access permissions

## Acknowledgments

Thank you for your understanding and cooperation in maintaining the security of our Kubernetes infrastructure.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Next Review**: 2026-02-19
