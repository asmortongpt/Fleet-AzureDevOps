# Codacy Code Quality Remediation Report
**Repository:** asmortongpt/Fleet
**Generated:** 2026-01-07
**Analysis Tool:** Codacy v3 API

---

## Executive Summary

### Overall Quality Metrics
- **Quality Grade:** B (89/100)
- **Total Issues:** 19,213
- **Lines of Code:** 1,012,873
- **Issues Percentage:** 9%
- **Complex Files:** 1,038 (25%)
- **Code Duplication:** 9%
- **Code Coverage:** 0 files with coverage (3,994 uncovered files)

### Issue Breakdown by Severity
- **High Severity (Critical):** 35 issues
- **Warning Severity:** 65+ issues
- **Info/Low Severity:** ~19,113 issues

### Issue Breakdown by Category
- **Security Issues:** 35 (Priority 1 - Immediate Action Required)
- **Complexity Issues:** 65+ (Priority 2 - Code Quality)
- **Code Style/Other:** Remaining issues

---

## Priority 1: Critical Security Vulnerabilities (IMMEDIATE ACTION REQUIRED)

### 1.1 Azure Key Vault Secret Management (26 High-Severity Issues)

#### Issue: Secrets Without Expiration Dates (14 occurrences)
**Severity:** HIGH
**Category:** InsecureStorage
**Impact:** Secrets without expiration dates pose a security risk if compromised

**Affected Files:**
- `infra/terraform/keyvault.tf` (multiple secrets)

**Specific Instances:**
- Line 124: `postgres_admin_password`
- Line 109: `postgres_connection_string`
- Line 139: `redis_connection_string`
- Line 154: `redis_primary_key`
- Line 169: `servicebus_connection_string`
- Line 184: `eventhub_connection_string`
- Line 214: `appinsights_connection_string`
- Line 229: `appinsights_instrumentation_key`
- Line 263: `jwt_secret`

**Remediation Steps:**
```terraform
# Add expiration_date to each secret resource
resource "azurerm_key_vault_secret" "example" {
  name         = "secret-name"
  value        = var.secret_value
  key_vault_id = azurerm_key_vault.main.id

  # ADD THIS:
  expiration_date = timeadd(timestamp(), "8760h") # 1 year

  lifecycle {
    ignore_changes = [expiration_date]
  }
}
```

**Priority:** P0 - Fix within 48 hours

---

#### Issue: Key Vault Secrets Without Content Type (9 occurrences)
**Severity:** HIGH
**Category:** InsecureStorage
**Impact:** Content type helps identify secret format and improves secret management

**Affected Secrets in `infra/terraform/keyvault.tf`:**
- Line 124: `postgres_admin_password`
- Line 139: `redis_connection_string`
- Line 154: `redis_primary_key`
- Line 169: `servicebus_connection_string`
- Line 199: `storage_connection_string`
- Line 214: `appinsights_connection_string`
- Line 229: `appinsights_instrumentation_key`
- Line 244: `oidc_client_secret`
- Line 263: `jwt_secret`

**Remediation:**
```terraform
resource "azurerm_key_vault_secret" "example" {
  name         = "secret-name"
  value        = var.secret_value
  key_vault_id = azurerm_key_vault.main.id

  # ADD THIS:
  content_type = "password"  # or "connection-string", "api-key", etc.
}
```

**Priority:** P0 - Fix within 48 hours

---

### 1.2 Azure Key Vault Configuration (5 High-Severity Issues)

#### Issue: Key Vault Missing Purge Protection
**Severity:** HIGH
**File:** `infra/terraform/keyvault.tf:10`
**Pattern:** Multiple detection patterns

**Current Code:**
```terraform
resource "azurerm_key_vault" "main" {
  # Missing purge_protection_enabled
}
```

**Remediation:**
```terraform
resource "azurerm_key_vault" "main" {
  name                       = var.key_vault_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = var.tenant_id
  sku_name                   = "premium"

  # ADD THESE:
  purge_protection_enabled   = true
  soft_delete_retention_days = 90
}
```

**Priority:** P0 - Critical security feature

---

#### Issue: Key Vault Missing Network ACLs
**Severity:** HIGH
**File:** `infra/terraform/keyvault.tf:10`
**Impact:** Key vault is accessible from any network

**Remediation:**
```terraform
resource "azurerm_key_vault" "main" {
  # ... existing config ...

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = [
      var.allowed_ip_range_1,
      var.allowed_ip_range_2,
    ]
    virtual_network_subnet_ids = [
      azurerm_subnet.aks.id,
      azurerm_subnet.app.id,
    ]
  }
}
```

**Priority:** P0 - Network security hardening

---

#### Issue: Key Vault Missing Firewall Rules
**Severity:** HIGH
**File:** `infra/terraform/keyvault.tf:10`

**Remediation:** Implement network ACLs as shown above with specific firewall rules

**Priority:** P0

---

#### Issue: Key Vault Key Without Expiration Date
**Severity:** HIGH
**File:** `infra/terraform/security.tf:56`
**Key:** `encryption`

**Remediation:**
```terraform
resource "azurerm_key_vault_key" "encryption" {
  name         = "encryption-key"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA"
  key_size     = 2048

  # ADD THIS:
  expiration_date = timeadd(timestamp(), "17520h") # 2 years

  key_opts = [
    "decrypt",
    "encrypt",
    "sign",
    "unwrapKey",
    "verify",
    "wrapKey",
  ]
}
```

**Priority:** P0

---

#### Issue: Key Vault Key Not Backed by HSM
**Severity:** HIGH
**File:** `infra/terraform/security.tf:56`

**Remediation:**
```terraform
resource "azurerm_key_vault_key" "encryption" {
  name         = "encryption-key"
  key_vault_id = azurerm_key_vault.main.id

  # CHANGE THIS:
  key_type     = "RSA-HSM"  # Instead of "RSA"
  key_size     = 2048

  key_opts = ["decrypt", "encrypt", "sign", "unwrapKey", "verify", "wrapKey"]
}
```

**Priority:** P1 - Requires premium Key Vault SKU

---

### 1.3 Azure Kubernetes Service (AKS) Security (3 High-Severity Issues)

#### Issue: AKS API Server Not Restricted by IP Ranges
**Severity:** HIGH
**File:** `infra/terraform/main.tf:73`

**Remediation:**
```terraform
resource "azurerm_kubernetes_cluster" "main" {
  # ... existing config ...

  api_server_access_profile {
    authorized_ip_ranges = [
      "YOUR_OFFICE_IP/32",
      "YOUR_VPN_CIDR",
      "YOUR_CI_CD_IP/32",
    ]
  }
}
```

**Priority:** P0 - Restricts Kubernetes API access

---

#### Issue: AKS Not Configured as Private Cluster
**Severity:** HIGH
**File:** `infra/terraform/main.tf:73`

**Remediation:**
```terraform
resource "azurerm_kubernetes_cluster" "main" {
  # ... existing config ...

  private_cluster_enabled = true

  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
    docker_bridge_cidr = "172.17.0.1/16"
  }
}
```

**Priority:** P1 - Significant network architecture change

---

#### Issue: AKS Disk Encryption Set Not Configured
**Severity:** HIGH
**File:** `infra/terraform/main.tf:73`

**Remediation:**
```terraform
resource "azurerm_disk_encryption_set" "aks" {
  name                = "${var.prefix}-aks-des"
  resource_group_name = var.resource_group_name
  location            = var.location
  key_vault_key_id    = azurerm_key_vault_key.encryption.id

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  # ... existing config ...

  disk_encryption_set_id = azurerm_disk_encryption_set.aks.id
}
```

**Priority:** P1

---

### 1.4 Storage and Network Security (3 High-Severity Issues)

#### Issue: Storage Account CORS Allows All Origins
**Severity:** HIGH
**File:** `infra/terraform/storage.tf:49`

**Current Code:**
```terraform
allowed_origins = ["*"]
```

**Remediation:**
```terraform
cors_rule {
  allowed_origins    = [
    "https://proud-bay-0fdc8040f.3.azurestaticapps.net",
    "https://yourdomain.com",
  ]
  allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
  allowed_headers    = ["*"]
  exposed_headers    = ["*"]
  max_age_in_seconds = 3600
}
```

**Priority:** P0 - XSS/CSRF risk

---

#### Issue: Storage Account Network Bypass Configuration
**Severity:** HIGH
**File:** `infra/terraform/storage.tf:5`

**Remediation:**
```terraform
resource "azurerm_storage_account" "main" {
  # ... existing config ...

  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    ip_rules                   = [var.allowed_ip_ranges]
    virtual_network_subnet_ids = [azurerm_subnet.aks.id]
  }
}
```

**Priority:** P1

---

#### Issue: Azure Redis Cache Public Network Access Enabled
**Severity:** HIGH
**File:** `infra/terraform/redis.tf:5`

**Remediation:**
```terraform
resource "azurerm_redis_cache" "main" {
  # ... existing config ...

  public_network_access_enabled = false

  redis_configuration {
    enable_authentication = true
  }
}
```

**Priority:** P0 - Disable public internet access

---

## Priority 2: Code Complexity Issues (65+ Warning-Level Issues)

### 2.1 High Cyclomatic Complexity

**Top Offenders:**
1. **`src/components/drilldown/TaskDetailPanel.tsx:1`** - Complexity: 33
2. **`src/components/drilldown/IncidentDetailPanel.tsx:1`** - Complexity: 32
3. **`api/src/emulators/mobile/InspectionGenerator.ts:124`** - Complexity: 27
4. **`src/components/garage/Asset3DViewer.tsx:332`** - Complexity: 24
5. **`src/components/drilldown/VehicleAssignmentDrilldown.tsx:1`** - Complexity: 19
6. **`src/components/garage/Asset3DViewer.tsx:91`** - Complexity: 18
7. **`src/components/admin/AlertsPanel.tsx:1`** - Complexity: 17

**Remediation Strategy:**
- Break down complex functions into smaller, single-purpose functions
- Extract business logic into separate service classes
- Use early returns to reduce nesting
- Apply the Single Responsibility Principle

**Example Refactoring:**
```typescript
// BEFORE: Complexity 33
function complexFunction() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        // deeply nested logic
      }
    }
  }
}

// AFTER: Complexity < 10
function complexFunction() {
  if (!condition1) return handleCondition1Failure();
  if (!condition2) return handleCondition2Failure();
  if (!condition3) return handleCondition3Failure();

  return handleSuccess();
}

function handleCondition1Failure() { /* ... */ }
function handleCondition2Failure() { /* ... */ }
function handleCondition3Failure() { /* ... */ }
function handleSuccess() { /* ... */ }
```

**Priority:** P2 - Address in next sprint

---

### 2.2 Excessive Function/File Length

**Files with Excessive Lines of Code:**
1. **`api/src/__tests__/services/SearchIndexService.test.ts`** - 3,136 lines
2. **`api/src/__tests__/services/vehicles.service.test.ts`** - 1,216 lines
3. **`api/src/services/audit/AuditService.ts`** - 1,219 lines
4. **`src/features/business/procurement/PurchaseOrderWorkflowDashboard.tsx`** - 972 lines
5. **`src/features/fleet-3d/advanced-showroom/VehicleShowroom.tsx`** - 957 lines
6. **`api/tests/integration/rls-verification.test.ts`** - 772 lines
7. **`src/pages/AnalyticsWorkbenchPage.tsx`** - 747 lines

**Remediation Strategy:**
- Split large files into multiple modules
- Extract reusable components
- Separate test suites into focused test files
- Use composition over inheritance

**Priority:** P2 - Improves maintainability

---

### 2.3 Excessive Function Parameters

**Functions with Too Many Parameters:**
1. **`src/components/garage/Asset3DViewer.tsx:464`** - 20 parameters
2. **`src/components/leaflet/hooks/useMarkerLayers.tsx:61`** - 13 parameters
3. **`src/components/LazyMap.tsx:253`** - 10 parameters

**Remediation Strategy:**
```typescript
// BEFORE: 20 parameters
function Asset3DViewer(
  param1, param2, param3, param4, param5,
  param6, param7, param8, param9, param10,
  // ... 10 more
) { }

// AFTER: Use configuration object
interface Asset3DViewerConfig {
  model: ModelConfig;
  camera: CameraConfig;
  controls: ControlsConfig;
  rendering: RenderingConfig;
  interactions: InteractionConfig;
}

function Asset3DViewer(config: Asset3DViewerConfig) {
  const { model, camera, controls, rendering, interactions } = config;
  // ...
}
```

**Priority:** P3 - Refactor as part of component updates

---

## Priority 3: Code Quality Improvements

### 3.1 Recommended Actions by File Type

#### Terraform Infrastructure (`infra/terraform/`)
**Total Security Issues:** 35
**Primary Focus:**
- ✅ Enable Key Vault purge protection
- ✅ Add secret expiration dates
- ✅ Configure network ACLs
- ✅ Restrict AKS API server access
- ✅ Disable Redis public access
- ✅ Fix CORS configuration

#### TypeScript Frontend (`src/`)
**Total Complexity Issues:** ~40
**Primary Focus:**
- Reduce cyclomatic complexity in drilldown components
- Break down large page components
- Refactor functions with excessive parameters
- Extract business logic from UI components

#### TypeScript Backend (`api/src/`)
**Total Issues:** ~25
**Primary Focus:**
- Simplify test files
- Reduce AuditService complexity
- Refactor middleware with high cyclomatic complexity

---

## Remediation Timeline

### Week 1 (Immediate - P0 Issues)
- [ ] Add expiration dates to all Key Vault secrets (14 fixes)
- [ ] Add content types to all Key Vault secrets (9 fixes)
- [ ] Enable Key Vault purge protection
- [ ] Configure Key Vault network ACLs
- [ ] Fix Storage CORS to allow specific origins only
- [ ] Disable Redis public network access

**Estimated Effort:** 8-12 hours

---

### Week 2 (High Priority - P1 Issues)
- [ ] Configure AKS API server authorized IP ranges
- [ ] Add Key Vault firewall rules
- [ ] Configure disk encryption set for AKS
- [ ] Enable HSM-backed keys for encryption
- [ ] Configure storage account network rules

**Estimated Effort:** 12-16 hours

---

### Weeks 3-4 (Code Quality - P2 Issues)
- [ ] Refactor top 10 functions with highest cyclomatic complexity
- [ ] Split large test files into focused suites
- [ ] Extract components from large page files
- [ ] Reduce function parameter counts using config objects

**Estimated Effort:** 20-30 hours

---

### Ongoing (P3 Issues)
- [ ] Address remaining code style issues
- [ ] Improve test coverage (currently 0%)
- [ ] Reduce code duplication (currently 9%)
- [ ] Address remaining 19,000+ low-priority issues incrementally

---

## Testing Strategy

### For Security Fixes
1. **Terraform Changes:**
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

2. **Validation:**
   - Verify secrets are accessible with expiration dates
   - Test network ACL restrictions
   - Validate AKS API server access restrictions
   - Confirm Redis is not publicly accessible

### For Complexity Refactoring
1. **Unit Tests:** Ensure existing tests pass after refactoring
2. **Integration Tests:** Verify component interactions
3. **E2E Tests:** Validate user workflows

---

## Monitoring and Prevention

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks:
      - id: terraform_tfsec
      - id: terraform_checkov
```

### CI/CD Integration
```yaml
# .github/workflows/codacy.yml
name: Codacy Analysis
on: [push, pull_request]
jobs:
  codacy:
    runs-on: ubuntu-latest
    steps:
      - uses: codacy/codacy-analysis-cli-action@master
        with:
          project-token: ${{ secrets.CODACY_PROJECT_TOKEN }}
          max-allowed-issues: 100
```

### Code Quality Gates
- **New Code:** Must not introduce security issues
- **PR Requirement:** Codacy grade must not decrease
- **Coverage Target:** Increase from 0% to 60% over 6 months

---

## Summary and Next Steps

### Critical Metrics
- **19,213 total issues** require systematic remediation
- **35 High-severity security issues** in infrastructure code
- **0% code coverage** needs immediate improvement
- **Grade B (89/100)** - target Grade A (95+)

### Immediate Actions (This Week)
1. Fix all 35 High-severity security issues
2. Add test coverage for critical paths
3. Enable Codacy PR checks

### Short-term Goals (Next Month)
1. Reduce total issues to < 15,000
2. Achieve 20% code coverage
3. Refactor top 20 complex functions

### Long-term Goals (Next Quarter)
1. Achieve Grade A (95+)
2. Reach 60% code coverage
3. Reduce complex files to < 10%
4. Eliminate all High-severity issues

---

## Appendix: Tools and Resources

### Codacy Dashboard
- **URL:** https://app.codacy.com/gh/asmortongpt/Fleet/dashboard
- **API:** https://app.codacy.com/api/v3
- **Badge:** ![Codacy Badge](https://app.codacy.com/project/badge/Grade/422b5c48d1094ed6bc871279f9e9a698)

### Security References
- Azure Key Vault Best Practices: https://docs.microsoft.com/azure/key-vault/general/best-practices
- AKS Security Hardening: https://docs.microsoft.com/azure/aks/security-hardening
- Terraform Security Scanning: https://github.com/aquasecurity/tfsec

### Complexity Reduction Resources
- Cyclomatic Complexity: https://en.wikipedia.org/wiki/Cyclomatic_complexity
- Refactoring Guru: https://refactoring.guru/
- Clean Code Principles: https://github.com/ryanmcdermott/clean-code-javascript

---

**Report End**
