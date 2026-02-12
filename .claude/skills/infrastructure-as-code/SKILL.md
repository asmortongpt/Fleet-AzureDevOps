---
name: infrastructure-as-code
description: Production infrastructure automation using Terraform, Kubernetes, and Helm. Use this skill when users need to deploy applications to cloud providers (AWS, GCP, Azure), set up Kubernetes clusters, create Helm charts, or automate infrastructure provisioning. Trigger when users mention "deploy to AWS", "Kubernetes setup", "Helm chart", "Terraform modules", "infrastructure automation", or "cloud deployment".
---

# Infrastructure-as-Code Skill

Automate infrastructure provisioning and application deployment using industry-standard IaC tools.

## When to Use This Skill

- Deploying applications to cloud providers (AWS, GCP, Azure)
- Setting up Kubernetes clusters
- Creating Helm charts for package management
- Automating infrastructure with Terraform
- Managing cloud resources as code
- Setting up CI/CD infrastructure
- Creating reproducible environments

**Works with**: `backend-development` (deploy backends), `production-deployment-skill` (orchestrate deployments)

## Core Technologies

### 1. Terraform
Infrastructure provisioning for AWS, GCP, Azure

**Use Cases**:
- VPC and networking setup
- Database provisioning (RDS, Cloud SQL)
- Load balancers and CDN
- IAM roles and policies
- Kubernetes cluster provisioning (EKS, GKE, AKS)

### 2. Kubernetes
Container orchestration

**Use Cases**:
- Application deployment
- Service discovery and load balancing
- Auto-scaling
- Rolling updates and rollbacks
- Secret and config management

### 3. Helm
Kubernetes package manager

**Use Cases**:
- Templated Kubernetes manifests
- Application versioning
- Environment-specific configurations
- Dependency management

## Quick Start

### Terraform Example
```bash
cd terraform/aws-eks
terraform init
terraform plan
terraform apply
```

### Kubernetes Example
```bash
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl get pods
```

### Helm Example
```bash
helm install my-app ./helm/backend-chart
helm upgrade my-app ./helm/backend-chart
```

## Templates Provided

### Terraform Modules
- `terraform/aws-eks` - AWS EKS cluster with VPC
- `terraform/aws-rds` - PostgreSQL RDS instance
- `terraform/gcp-gke` - Google Kubernetes Engine
- `terraform/azure-aks` - Azure Kubernetes Service

### Kubernetes Manifests
- `kubernetes/backend-deployment.yaml` - Backend app deployment
- `kubernetes/postgres-statefulset.yaml` - PostgreSQL StatefulSet
- `kubernetes/redis-deployment.yaml` - Redis cache
- `kubernetes/ingress-nginx.yaml` - Ingress controller

### Helm Charts
- `helm/backend-chart` - Complete backend application chart
- `helm/monitoring` - Prometheus + Grafana
- `helm/logging` - EFK stack (Elasticsearch, Fluentd, Kibana)

## Best Practices

### Infrastructure as Code
✅ **Version Control** - All infrastructure in Git
✅ **State Management** - Terraform remote state (S3, GCS)
✅ **Modules** - Reusable Terraform modules
✅ **Environments** - Separate dev/staging/prod
✅ **Secrets** - Never commit secrets, use Vault/Secrets Manager

### Kubernetes
✅ **Resource Limits** - Set CPU/memory limits
✅ **Health Checks** - Liveness and readiness probes
✅ **Rolling Updates** - Zero-downtime deployments
✅ **ConfigMaps** - Externalize configuration
✅ **Secrets** - Kubernetes Secrets or external vault

### Helm
✅ **Templating** - Parameterize all environment-specific values
✅ **Values Files** - Separate values.yaml for each environment
✅ **Dependencies** - Declare chart dependencies
✅ **Versioning** - Semantic versioning for releases

## Common Workflows

### 1. New Application Deployment

**Step 1**: Provision infrastructure with Terraform
```bash
cd terraform/aws-eks
terraform init
terraform apply
```

**Step 2**: Deploy application with Helm
```bash
helm install my-app ./helm/backend-chart \
  --set image.tag=v1.0.0 \
  --set ingress.host=api.example.com
```

**Step 3**: Verify deployment
```bash
kubectl get pods
kubectl logs -l app=my-app
curl https://api.example.com/health
```

### 2. Environment Update

**Update Terraform**:
```bash
cd terraform/aws-rds
# Edit main.tf (increase instance size)
terraform plan
terraform apply
```

**Update Kubernetes**:
```bash
kubectl set image deployment/backend backend=myapp:v1.1.0
kubectl rollout status deployment/backend
```

**Update Helm**:
```bash
helm upgrade my-app ./helm/backend-chart \
  --set image.tag=v1.1.0 \
  --reuse-values
```

### 3. Rollback

**Helm Rollback**:
```bash
helm history my-app
helm rollback my-app 3  # Rollback to revision 3
```

**Kubernetes Rollback**:
```bash
kubectl rollout undo deployment/backend
```

## Security Considerations

### Secrets Management
- **AWS**: Use AWS Secrets Manager + External Secrets Operator
- **GCP**: Use Secret Manager + Workload Identity
- **Azure**: Use Key Vault + Pod Identity
- **Generic**: Use HashiCorp Vault

### Network Security
- Private subnets for databases
- Network policies for pod-to-pod communication
- Ingress with TLS termination
- Web Application Firewall (WAF)

### RBAC
- Principle of least privilege
- Service accounts for applications
- Role-based access for humans
- Audit logging enabled

## Monitoring & Observability

### Metrics (Prometheus)
```yaml
# Automatically scraped from /metrics endpoint
# Configure in helm/monitoring/values.yaml
```

### Logging (EFK)
```yaml
# Centralized logging with Elasticsearch
# Configured in helm/logging/values.yaml
```

### Tracing (Jaeger)
```yaml
# Distributed tracing for microservices
# Optional component
```

## Cost Optimization

### AWS
- Use Spot instances for non-critical workloads
- Right-size EC2 instances
- Use Auto Scaling
- Enable S3 lifecycle policies

### GCP
- Use Preemptible VMs
- Committed use discounts
- Sustained use discounts

### Azure
- Use Spot VMs
- Reserved instances
- Auto-scaling

## Disaster Recovery

### Backup Strategy
- Database backups (automated snapshots)
- Application state in S3/GCS/Blob Storage
- Terraform state in remote backend
- Helm release history

### Recovery Procedures
```bash
# 1. Restore infrastructure
cd terraform/aws-eks
terraform apply

# 2. Restore database from snapshot
aws rds restore-db-instance-from-db-snapshot

# 3. Redeploy applications
helm install my-app ./helm/backend-chart --version=1.0.0
```

## Troubleshooting

### Common Issues

**Pods CrashLoopBackOff**:
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Terraform State Lock**:
```bash
terraform force-unlock <lock-id>
```

**Helm Release Failed**:
```bash
helm list
helm rollback <release> <revision>
```

**DNS Not Resolving**:
```bash
kubectl get ingress
kubectl describe ingress <ingress-name>
nslookup <domain>
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
# Automated deployment on merge to main
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with Helm
        run: |
          helm upgrade my-app ./helm/backend-chart \
            --install \
            --set image.tag=${{ github.sha }}
```

### GitLab CI Example
```yaml
deploy:
  stage: deploy
  script:
    - helm upgrade my-app ./helm/backend-chart --install
  only:
    - main
```

## Multi-Environment Strategy

### Directory Structure
```
terraform/
  └── environments/
      ├── dev/
      ├── staging/
      └── prod/
```

### Terraform Workspaces
```bash
terraform workspace new dev
terraform workspace select dev
terraform apply -var-file=dev.tfvars
```

### Helm Values
```bash
helm install my-app ./helm/backend-chart \
  -f values.yaml \
  -f values-prod.yaml
```

## Related Skills

- `backend-development` - Code to deploy
- `production-deployment-skill` - Orchestrate full deployment
- `system-design` - Architecture decisions feed into infrastructure

## Resources

- `terraform/` - Terraform modules and examples
- `kubernetes/` - Kubernetes manifests
- `helm/` - Helm charts
- `docs/` - Detailed setup guides
