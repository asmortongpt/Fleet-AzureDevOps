#!/bin/bash
set -e

# Script to generate kubeconfig file for external vendor
# This creates a kubeconfig that can be securely shared with the vendor
# for access to dev and staging environments

echo "🔐 Generating Vendor Kubeconfig"
echo "================================"
echo ""

# Get cluster information
CLUSTER_NAME="fleet-aks-cluster"
CONTEXT_NAME=$(kubectl config current-context)
CLUSTER_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CLUSTER_CA=$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')

echo "📊 Cluster Information:"
echo "  Context: $CONTEXT_NAME"
echo "  Server: $CLUSTER_SERVER"
echo ""

# Create namespace if it doesn't exist
echo "📦 Ensuring namespaces exist..."
kubectl create namespace fleet-dev --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace fleet-staging --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC configurations
echo "🔒 Applying RBAC configurations..."
kubectl apply -f rbac-serviceaccount.yaml
kubectl apply -f rbac-role-dev.yaml
kubectl apply -f rbac-role-staging.yaml
kubectl apply -f rbac-rolebinding.yaml
kubectl apply -f rbac-clusterrole-readonly.yaml

echo "✅ RBAC configurations applied"
echo ""

# Wait for service account to be created
echo "⏳ Waiting for ServiceAccount to be ready..."
sleep 3

# Get service account token for dev environment
echo "🔑 Retrieving ServiceAccount token (dev)..."
SECRET_NAME_DEV=$(kubectl get serviceaccount vendor-developer -n fleet-dev -o jsonpath='{.secrets[0].name}' 2>/dev/null || echo "")

# If secret doesn't exist automatically (Kubernetes 1.24+), create it manually
if [ -z "$SECRET_NAME_DEV" ]; then
  echo "  Creating token secret manually (Kubernetes 1.24+)..."

  # Create token secret for dev
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: vendor-developer-token
  namespace: fleet-dev
  annotations:
    kubernetes.io/service-account.name: vendor-developer
type: kubernetes.io/service-account-token
EOF

  # Create token secret for staging
  cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: vendor-developer-token
  namespace: fleet-staging
  annotations:
    kubernetes.io/service-account.name: vendor-developer
type: kubernetes.io/service-account-token
EOF

  sleep 3
  SECRET_NAME_DEV="vendor-developer-token"
fi

# Get the token
TOKEN_DEV=$(kubectl get secret $SECRET_NAME_DEV -n fleet-dev -o jsonpath='{.data.token}' | base64 --decode)

if [ -z "$TOKEN_DEV" ]; then
  echo "❌ Error: Could not retrieve token"
  exit 1
fi

echo "✅ Token retrieved successfully"
echo ""

# Generate kubeconfig file
KUBECONFIG_FILE="vendor-kubeconfig.yaml"

echo "📝 Generating kubeconfig file: $KUBECONFIG_FILE"

cat > $KUBECONFIG_FILE <<EOF
apiVersion: v1
kind: Config
clusters:
- name: fleet-aks-cluster
  cluster:
    certificate-authority-data: $CLUSTER_CA
    server: $CLUSTER_SERVER
contexts:
- name: vendor-dev
  context:
    cluster: fleet-aks-cluster
    namespace: fleet-dev
    user: vendor-developer
- name: vendor-staging
  context:
    cluster: fleet-aks-cluster
    namespace: fleet-staging
    user: vendor-developer
current-context: vendor-dev
users:
- name: vendor-developer
  user:
    token: $TOKEN_DEV
EOF

echo "✅ Kubeconfig file generated: $KUBECONFIG_FILE"
echo ""

# Test the configuration
echo "🧪 Testing vendor access..."
echo ""

echo "  Testing dev namespace access:"
KUBECONFIG=$KUBECONFIG_FILE kubectl get pods -n fleet-dev 2>&1 | head -5 || echo "  ⚠️  Dev namespace may not have pods yet"

echo ""
echo "  Testing staging namespace access:"
KUBECONFIG=$KUBECONFIG_FILE kubectl get pods -n fleet-staging 2>&1 | head -5 || echo "  ⚠️  Staging namespace may not have pods yet"

echo ""
echo "  Testing production namespace access (should fail):"
KUBECONFIG=$KUBECONFIG_FILE kubectl get pods -n fleet-management 2>&1 | head -2 || echo "  ✅ Production access correctly denied"

echo ""
echo "================================"
echo "✅ Vendor kubeconfig setup complete!"
echo ""
echo "📄 Generated files:"
echo "  - $KUBECONFIG_FILE (share this securely with vendor)"
echo ""
echo "🔒 Security notes:"
echo "  - This kubeconfig provides access to dev and staging only"
echo "  - Production access is denied"
echo "  - Token never expires but can be revoked by deleting the ServiceAccount"
echo ""
echo "📦 To share with vendor:"
echo "  1. Encrypt the file: gpg -c $KUBECONFIG_FILE"
echo "  2. Share encrypted file via secure channel"
echo "  3. Provide decryption password via separate secure channel"
echo ""
echo "🔄 To revoke access:"
echo "  kubectl delete serviceaccount vendor-developer -n fleet-dev"
echo "  kubectl delete serviceaccount vendor-developer -n fleet-staging"
echo ""
