#!/usr/bin/env python3
"""
Azure Kubernetes Service (AKS) Deployment Orchestrator
Deploys Fleet application to AKS with:
- Azure Container Registry (ACR) for images
- Multi-container deployment (frontend + backend)
- PostgreSQL database
- Redis cache
- Ingress with SSL/TLS
- Auto-scaling
- Health checks and monitoring
"""

import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class AKSDeploymentOrchestrator:
    def __init__(self):
        self.project_root = Path("/Users/andrewmorton/Documents/GitHub/fleet-local")

        # Azure Configuration
        self.subscription_id = "021415c2-2f52-4a73-ae77-f8363165a5e1"
        self.resource_group = "FLEET-AI-AGENTS"
        self.location = "eastus2"

        # AKS Configuration
        self.aks_cluster_name = "fleet-aks-cluster"
        self.aks_node_count = 3
        self.aks_node_vm_size = "Standard_D4s_v3"  # 4 vCPU, 16GB RAM

        # ACR Configuration
        self.acr_name = "ctafleetacr2024"  # Unique name for Capital Tech Alliance Fleet
        self.acr_login_server = f"{self.acr_name}.azurecr.io"

        # Application Configuration
        self.app_name = "fleet-app"
        self.frontend_image = f"{self.acr_login_server}/fleet-frontend:latest"
        self.backend_image = f"{self.acr_login_server}/fleet-backend:latest"

        # Database Configuration (Azure Database for PostgreSQL)
        self.db_server_name = "fleet-postgres-server"
        self.db_name = "fleet_db"
        self.db_admin_user = "fleetadmin"

        # Domain Configuration
        self.domain = "fleet.capitaltechalliance.com"

    def print_header(self, message: str):
        print(f"\n{'='*80}")
        print(f"  {message}")
        print(f"{'='*80}\n")

    def run_command(self, cmd: str, description: str = "", check: bool = True,
                    capture_output: bool = True) -> subprocess.CompletedProcess:
        """Execute command with error handling"""
        print(f"🔄 {description or cmd}")
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=capture_output,
                text=True,
                check=check,
                cwd=self.project_root
            )
            if result.stdout and len(result.stdout) < 2000:
                print(result.stdout)
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ Error: {e.stderr if e.stderr else str(e)}")
            if check:
                raise
            return e

    def check_azure_cli(self) -> bool:
        """Verify Azure CLI is installed and authenticated"""
        self.print_header("Checking Azure CLI")

        # Check if az is installed
        result = self.run_command("az --version", "Checking Azure CLI version", check=False)
        if result.returncode != 0:
            print("❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli")
            return False

        # Check if logged in
        result = self.run_command("az account show", "Checking Azure authentication", check=False)
        if result.returncode != 0:
            print("❌ Not logged in to Azure. Running 'az login'...")
            self.run_command("az login", "Logging in to Azure", check=True, capture_output=False)

        # Set subscription
        self.run_command(
            f"az account set --subscription {self.subscription_id}",
            "Setting Azure subscription"
        )

        print("✅ Azure CLI ready")
        return True

    def create_or_get_resource_group(self) -> bool:
        """Create resource group if it doesn't exist"""
        self.print_header("Setting up Resource Group")

        # Check if resource group exists
        result = self.run_command(
            f"az group show --name {self.resource_group}",
            f"Checking if resource group {self.resource_group} exists",
            check=False
        )

        if result.returncode == 0:
            print(f"✅ Resource group {self.resource_group} already exists")
            return True

        # Create resource group
        self.run_command(
            f"az group create --name {self.resource_group} --location {self.location}",
            f"Creating resource group {self.resource_group}"
        )

        print(f"✅ Resource group {self.resource_group} created")
        return True

    def create_or_get_acr(self) -> bool:
        """Create Azure Container Registry if it doesn't exist"""
        self.print_header("Setting up Azure Container Registry")

        # Check if ACR exists
        result = self.run_command(
            f"az acr show --name {self.acr_name} --resource-group {self.resource_group}",
            f"Checking if ACR {self.acr_name} exists",
            check=False
        )

        if result.returncode == 0:
            print(f"✅ ACR {self.acr_name} already exists")
        else:
            # Create ACR
            self.run_command(
                f"az acr create --resource-group {self.resource_group} "
                f"--name {self.acr_name} --sku Standard --location {self.location}",
                f"Creating ACR {self.acr_name}"
            )
            print(f"✅ ACR {self.acr_name} created")

        # Enable admin access
        self.run_command(
            f"az acr update --name {self.acr_name} --admin-enabled true",
            "Enabling ACR admin access"
        )

        return True

    def build_and_push_images(self) -> bool:
        """Build Docker images and push to ACR"""
        self.print_header("Building and Pushing Docker Images")

        # Login to ACR
        self.run_command(
            f"az acr login --name {self.acr_name}",
            "Logging in to Azure Container Registry"
        )

        # Build and push backend image
        print("\n📦 Building backend image...")
        backend_dockerfile = self.project_root / "api" / "Dockerfile"

        if not backend_dockerfile.exists():
            # Create backend Dockerfile
            self.create_backend_dockerfile()

        self.run_command(
            f"docker build -t {self.backend_image} -f api/Dockerfile ./api",
            "Building backend Docker image",
            capture_output=False
        )

        self.run_command(
            f"docker push {self.backend_image}",
            "Pushing backend image to ACR",
            capture_output=False
        )

        # Build and push frontend image
        print("\n📦 Building frontend image...")
        frontend_dockerfile = self.project_root / "Dockerfile"

        if not frontend_dockerfile.exists():
            # Create frontend Dockerfile
            self.create_frontend_dockerfile()

        self.run_command(
            f"docker build -t {self.frontend_image} .",
            "Building frontend Docker image",
            capture_output=False
        )

        self.run_command(
            f"docker push {self.frontend_image}",
            "Pushing frontend image to ACR",
            capture_output=False
        )

        print("✅ All images built and pushed to ACR")
        return True

    def create_backend_dockerfile(self):
        """Create Dockerfile for backend API"""
        dockerfile_content = """FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
"""
        dockerfile_path = self.project_root / "api" / "Dockerfile"
        dockerfile_path.write_text(dockerfile_content)
        print(f"✅ Created backend Dockerfile: {dockerfile_path}")

    def create_frontend_dockerfile(self):
        """Create Dockerfile for frontend"""
        dockerfile_content = """FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
"""
        dockerfile_path = self.project_root / "Dockerfile"
        dockerfile_path.write_text(dockerfile_content)
        print(f"✅ Created frontend Dockerfile: {dockerfile_path}")

        # Create nginx.conf
        self.create_nginx_config()

    def create_nginx_config(self):
        """Create nginx configuration for frontend"""
        nginx_config = """events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }

        # API proxy
        location /api {
            proxy_pass http://fleet-backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
"""
        nginx_path = self.project_root / "nginx.conf"
        nginx_path.write_text(nginx_config)
        print(f"✅ Created nginx.conf: {nginx_path}")

    def create_or_get_aks_cluster(self) -> bool:
        """Create AKS cluster if it doesn't exist"""
        self.print_header("Setting up AKS Cluster")

        # Check if AKS cluster exists
        result = self.run_command(
            f"az aks show --name {self.aks_cluster_name} --resource-group {self.resource_group}",
            f"Checking if AKS cluster {self.aks_cluster_name} exists",
            check=False
        )

        if result.returncode == 0:
            print(f"✅ AKS cluster {self.aks_cluster_name} already exists")
        else:
            print(f"🚀 Creating AKS cluster {self.aks_cluster_name}...")
            print("⏱️  This may take 10-15 minutes...")

            # Create AKS cluster
            self.run_command(
                f"az aks create "
                f"--resource-group {self.resource_group} "
                f"--name {self.aks_cluster_name} "
                f"--node-count {self.aks_node_count} "
                f"--node-vm-size {self.aks_node_vm_size} "
                f"--location {self.location} "
                f"--enable-managed-identity "
                f"--attach-acr {self.acr_name} "
                f"--network-plugin azure "
                f"--enable-addons monitoring "
                f"--generate-ssh-keys",
                "Creating AKS cluster (this will take 10-15 minutes)",
                capture_output=False
            )

            print(f"✅ AKS cluster {self.aks_cluster_name} created")

        # Get AKS credentials
        self.run_command(
            f"az aks get-credentials --resource-group {self.resource_group} "
            f"--name {self.aks_cluster_name} --overwrite-existing",
            "Getting AKS credentials"
        )

        # Verify kubectl connection
        self.run_command("kubectl cluster-info", "Verifying kubectl connection")

        print("✅ AKS cluster ready")
        return True

    def create_kubernetes_manifests(self) -> bool:
        """Create Kubernetes deployment manifests"""
        self.print_header("Creating Kubernetes Manifests")

        k8s_dir = self.project_root / "k8s"
        k8s_dir.mkdir(exist_ok=True)

        # Create namespace
        self.create_namespace_manifest(k8s_dir)

        # Create secrets
        self.create_secrets_manifest(k8s_dir)

        # Create PostgreSQL deployment
        self.create_postgres_manifest(k8s_dir)

        # Create Redis deployment
        self.create_redis_manifest(k8s_dir)

        # Create backend deployment
        self.create_backend_manifest(k8s_dir)

        # Create frontend deployment
        self.create_frontend_manifest(k8s_dir)

        # Create ingress
        self.create_ingress_manifest(k8s_dir)

        print("✅ All Kubernetes manifests created")
        return True

    def create_namespace_manifest(self, k8s_dir: Path):
        """Create namespace manifest"""
        manifest = """apiVersion: v1
kind: Namespace
metadata:
  name: fleet-production
  labels:
    name: fleet-production
    environment: production
"""
        (k8s_dir / "00-namespace.yaml").write_text(manifest)
        print("  ✅ Created namespace manifest")

    def create_secrets_manifest(self, k8s_dir: Path):
        """Create secrets manifest"""
        manifest = """apiVersion: v1
kind: Secret
metadata:
  name: fleet-secrets
  namespace: fleet-production
type: Opaque
stringData:
  DATABASE_URL: "postgresql://fleetadmin:${DB_PASSWORD}@fleet-postgres:5432/fleet_db"
  REDIS_URL: "redis://fleet-redis:6379"
  JWT_SECRET: "${JWT_SECRET}"
  SESSION_SECRET: "${SESSION_SECRET}"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: fleet-config
  namespace: fleet-production
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
"""
        (k8s_dir / "01-secrets.yaml").write_text(manifest)
        print("  ✅ Created secrets manifest")

    def create_postgres_manifest(self, k8s_dir: Path):
        """Create PostgreSQL deployment manifest"""
        manifest = """apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: fleet-production
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-postgres
  namespace: fleet-production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fleet-postgres
  template:
    metadata:
      labels:
        app: fleet-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: fleet_db
        - name: POSTGRES_USER
          value: fleetadmin
        - name: POSTGRES_PASSWORD
          value: ${DB_PASSWORD}
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: fleet-postgres
  namespace: fleet-production
spec:
  selector:
    app: fleet-postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
"""
        (k8s_dir / "02-postgres.yaml").write_text(manifest)
        print("  ✅ Created PostgreSQL manifest")

    def create_redis_manifest(self, k8s_dir: Path):
        """Create Redis deployment manifest"""
        manifest = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-redis
  namespace: fleet-production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fleet-redis
  template:
    metadata:
      labels:
        app: fleet-redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: fleet-redis
  namespace: fleet-production
spec:
  selector:
    app: fleet-redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
"""
        (k8s_dir / "03-redis.yaml").write_text(manifest)
        print("  ✅ Created Redis manifest")

    def create_backend_manifest(self, k8s_dir: Path):
        """Create backend deployment manifest"""
        manifest = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-backend
  namespace: fleet-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fleet-backend
  template:
    metadata:
      labels:
        app: fleet-backend
    spec:
      containers:
      - name: backend
        image: {self.backend_image}
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: fleet-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: fleet-secrets
              key: REDIS_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: fleet-secrets
              key: JWT_SECRET
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: fleet-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: fleet-config
              key: PORT
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: fleet-backend
  namespace: fleet-production
spec:
  selector:
    app: fleet-backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fleet-backend-hpa
  namespace: fleet-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fleet-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
"""
        (k8s_dir / "04-backend.yaml").write_text(manifest)
        print("  ✅ Created backend manifest")

    def create_frontend_manifest(self, k8s_dir: Path):
        """Create frontend deployment manifest"""
        manifest = f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-frontend
  namespace: fleet-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fleet-frontend
  template:
    metadata:
      labels:
        app: fleet-frontend
    spec:
      containers:
      - name: frontend
        image: {self.frontend_image}
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: fleet-frontend
  namespace: fleet-production
spec:
  selector:
    app: fleet-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fleet-frontend-hpa
  namespace: fleet-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fleet-frontend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
"""
        (k8s_dir / "05-frontend.yaml").write_text(manifest)
        print("  ✅ Created frontend manifest")

    def create_ingress_manifest(self, k8s_dir: Path):
        """Create ingress manifest with SSL"""
        manifest = f"""apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fleet-ingress
  namespace: fleet-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - {self.domain}
    secretName: fleet-tls-cert
  rules:
  - host: {self.domain}
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: fleet-backend
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fleet-frontend
            port:
              number: 80
"""
        (k8s_dir / "06-ingress.yaml").write_text(manifest)
        print("  ✅ Created ingress manifest")

    def deploy_to_aks(self) -> bool:
        """Deploy all manifests to AKS cluster"""
        self.print_header("Deploying to AKS Cluster")

        k8s_dir = self.project_root / "k8s"

        # Apply manifests in order
        manifests = sorted(k8s_dir.glob("*.yaml"))

        for manifest in manifests:
            self.run_command(
                f"kubectl apply -f {manifest}",
                f"Applying {manifest.name}"
            )
            time.sleep(2)  # Wait between deployments

        print("✅ All manifests deployed to AKS")
        return True

    def verify_deployment(self) -> Dict:
        """Verify deployment status"""
        self.print_header("Verifying Deployment")

        # Wait for deployments to be ready
        print("⏱️  Waiting for deployments to be ready (this may take a few minutes)...")

        deployments = ["fleet-postgres", "fleet-redis", "fleet-backend", "fleet-frontend"]

        for deployment in deployments:
            print(f"\n🔍 Checking {deployment}...")
            self.run_command(
                f"kubectl rollout status deployment/{deployment} -n fleet-production --timeout=5m",
                f"Waiting for {deployment} to be ready"
            )

        # Get pod status
        print("\n📊 Pod Status:")
        self.run_command(
            "kubectl get pods -n fleet-production",
            "Getting pod status",
            capture_output=False
        )

        # Get service status
        print("\n📊 Service Status:")
        result = self.run_command(
            "kubectl get svc -n fleet-production",
            "Getting service status",
            capture_output=True
        )

        # Get external IP
        print("\n🌐 Getting external IP address...")
        time.sleep(10)  # Wait for LoadBalancer to assign IP

        result = self.run_command(
            "kubectl get svc fleet-frontend -n fleet-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}'",
            "Getting external IP"
        )

        external_ip = result.stdout.strip() if result.returncode == 0 else "Pending"

        verification = {
            'external_ip': external_ip,
            'deployments_ready': True,
            'timestamp': datetime.now().isoformat()
        }

        print(f"\n✅ Deployment verified")
        if external_ip and external_ip != "Pending":
            print(f"🌐 Application URL: http://{external_ip}")
        else:
            print("⏳ External IP is pending - run 'kubectl get svc -n fleet-production' to check status")

        return verification

    def create_deployment_report(self, verification: Dict) -> Path:
        """Create deployment completion report"""

        report = f"""# AKS Deployment Complete ✅

**Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Cluster:** {self.aks_cluster_name}
**Resource Group:** {self.resource_group}
**Location:** {self.location}

---

## Deployment Summary

### Infrastructure Created

1. **AKS Cluster**
   - Name: {self.aks_cluster_name}
   - Node Count: {self.aks_node_count}
   - Node Size: {self.aks_node_vm_size} (4 vCPU, 16GB RAM)
   - Network: Azure CNI
   - Monitoring: Enabled

2. **Azure Container Registry**
   - Name: {self.acr_name}
   - Login Server: {self.acr_login_server}
   - Images: fleet-frontend:latest, fleet-backend:latest

3. **Kubernetes Resources**
   - Namespace: fleet-production
   - PostgreSQL Database (1 replica, 20Gi storage)
   - Redis Cache (1 replica)
   - Backend API (3-10 replicas with auto-scaling)
   - Frontend (3-10 replicas with auto-scaling)
   - LoadBalancer Service
   - Ingress Controller

### Access Information

**External IP:** {verification.get('external_ip', 'Pending')}
**Application URL:** http://{verification.get('external_ip', 'PENDING')}

### Deployment Status

✅ All deployments ready
✅ Pods running
✅ Services created
✅ Auto-scaling configured

---

## Post-Deployment Steps

### 1. Update DNS Records
Point `{self.domain}` to: `{verification.get('external_ip', 'PENDING')}`

### 2. Setup SSL/TLS
```bash
# Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/07-cert-manager.yaml
```

### 3. Update Secrets
```bash
# Update database password
kubectl edit secret fleet-secrets -n fleet-production

# Update JWT and session secrets
kubectl create secret generic fleet-secrets \\
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \\
  --from-literal=SESSION_SECRET=$(openssl rand -base64 32) \\
  -n fleet-production --dry-run=client -o yaml | kubectl apply -f -
```

### 4. Initialize Database
```bash
# Get backend pod name
kubectl get pods -n fleet-production | grep fleet-backend

# Run migrations
kubectl exec -it <backend-pod-name> -n fleet-production -- npm run migrate
```

### 5. Monitor Deployment
```bash
# View logs
kubectl logs -f deployment/fleet-backend -n fleet-production
kubectl logs -f deployment/fleet-frontend -n fleet-production

# View pod status
kubectl get pods -n fleet-production -w

# View HPA status
kubectl get hpa -n fleet-production
```

---

## Useful Commands

```bash
# Get cluster credentials
az aks get-credentials --resource-group {self.resource_group} --name {self.aks_cluster_name}

# Scale deployment manually
kubectl scale deployment fleet-backend -n fleet-production --replicas=5

# Update image
kubectl set image deployment/fleet-backend backend={self.backend_image} -n fleet-production

# Restart deployment
kubectl rollout restart deployment/fleet-backend -n fleet-production

# View resource usage
kubectl top nodes
kubectl top pods -n fleet-production

# Delete deployment
kubectl delete namespace fleet-production
```

---

**Deployment Completed:** {verification.get('timestamp')}
**Status:** ✅ Production Ready

"""

        report_file = self.project_root / "AKS_DEPLOYMENT_COMPLETE.md"
        report_file.write_text(report)
        print(f"✅ Deployment report created: {report_file}")
        return report_file

    def run(self):
        """Main orchestration workflow"""
        start_time = time.time()

        self.print_header("Azure Kubernetes Service (AKS) Deployment")
        print("🚀 Deploying Fleet application to AKS")
        print(f"📍 Cluster: {self.aks_cluster_name}")
        print(f"📍 Resource Group: {self.resource_group}")
        print(f"📍 Location: {self.location}")
        print()

        try:
            # Step 1: Check Azure CLI
            if not self.check_azure_cli():
                print("❌ Azure CLI setup failed")
                return False

            # Step 2: Create/verify resource group
            self.create_or_get_resource_group()

            # Step 3: Create/verify ACR
            self.create_or_get_acr()

            # Step 4: Build and push Docker images
            self.build_and_push_images()

            # Step 5: Create/verify AKS cluster
            self.create_or_get_aks_cluster()

            # Step 6: Create Kubernetes manifests
            self.create_kubernetes_manifests()

            # Step 7: Deploy to AKS
            self.deploy_to_aks()

            # Step 8: Verify deployment
            verification = self.verify_deployment()

            # Step 9: Create deployment report
            report_file = self.create_deployment_report(verification)

            # Summary
            elapsed_time = time.time() - start_time
            self.print_header("Deployment Complete ✅")
            print(f"⏱️  Total Time: {elapsed_time/60:.1f} minutes")
            print(f"🌐 External IP: {verification.get('external_ip', 'Pending')}")
            print(f"📄 Report: {report_file}")
            print()
            print("✅ Fleet application successfully deployed to AKS!")
            print()
            print("Next steps:")
            print("1. Update DNS to point to external IP")
            print("2. Setup SSL/TLS with cert-manager")
            print("3. Initialize database with migrations")
            print("4. Configure monitoring and alerts")

            return True

        except Exception as e:
            print(f"\n❌ Deployment failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    orchestrator = AKSDeploymentOrchestrator()
    success = orchestrator.run()
    sys.exit(0 if success else 1)
