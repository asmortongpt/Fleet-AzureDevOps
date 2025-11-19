#!/bin/bash

# ===================================================================
# Generate Temporary Kubernetes Access for Vendors
# ===================================================================
# This script generates a temporary kubeconfig file with time-limited
# access for external vendors. Never commit kubeconfig files to git!
# ===================================================================

set -e

# Configuration
CLUSTER_NAME="${CLUSTER_NAME:-fleet-aks-cluster}"
NAMESPACE="${NAMESPACE:-fleet-dev}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-vendor-developer}"
EXPIRY_HOURS="${EXPIRY_HOURS:-24}"
OUTPUT_FILE="${OUTPUT_FILE:-vendor-kubeconfig-$(date +%Y%m%d-%H%M%S).yaml}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}Generating Temporary Kubernetes Access${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo ""

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    exit 1
fi

# Verify cluster access
echo -e "${YELLOW}Checking cluster access...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to cluster. Please check your kubeconfig${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to cluster${NC}"

# Create service account if it doesn't exist
echo -e "${YELLOW}Creating service account...${NC}"
kubectl create serviceaccount "$SERVICE_ACCOUNT_NAME" -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Service account created/verified${NC}"

# Create role binding with limited permissions
echo -e "${YELLOW}Creating role binding...${NC}"
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: vendor-developer-role
  namespace: $NAMESPACE
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: vendor-developer-binding
  namespace: $NAMESPACE
subjects:
- kind: ServiceAccount
  name: $SERVICE_ACCOUNT_NAME
  namespace: $NAMESPACE
roleRef:
  kind: Role
  name: vendor-developer-role
  apiGroup: rbac.authorization.k8s.io
EOF
echo -e "${GREEN}✓ Role binding created${NC}"

# Create service account token (Kubernetes 1.24+)
echo -e "${YELLOW}Creating temporary token...${NC}"
kubectl create token "$SERVICE_ACCOUNT_NAME" -n "$NAMESPACE" --duration="${EXPIRY_HOURS}h" > /tmp/vendor-token.txt 2>/dev/null || {
    # Fallback for older Kubernetes versions
    SECRET_NAME=$(kubectl get serviceaccount "$SERVICE_ACCOUNT_NAME" -n "$NAMESPACE" -o jsonpath='{.secrets[0].name}')
    kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.token}' | base64 -d > /tmp/vendor-token.txt
}
echo -e "${GREEN}✓ Token created (expires in ${EXPIRY_HOURS} hours)${NC}"

# Get cluster information
CLUSTER_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CLUSTER_CA=$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')

# Generate kubeconfig file
echo -e "${YELLOW}Generating kubeconfig file...${NC}"
cat > "$OUTPUT_FILE" <<EOF
apiVersion: v1
kind: Config
clusters:
- name: $CLUSTER_NAME
  cluster:
    certificate-authority-data: $CLUSTER_CA
    server: $CLUSTER_SERVER
contexts:
- name: vendor-$NAMESPACE
  context:
    cluster: $CLUSTER_NAME
    namespace: $NAMESPACE
    user: $SERVICE_ACCOUNT_NAME
current-context: vendor-$NAMESPACE
users:
- name: $SERVICE_ACCOUNT_NAME
  user:
    token: $(cat /tmp/vendor-token.txt)
EOF

# Clean up temporary token file
rm -f /tmp/vendor-token.txt

echo -e "${GREEN}✓ Kubeconfig file generated: $OUTPUT_FILE${NC}"
echo ""
echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}Access Details${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "Namespace: ${YELLOW}$NAMESPACE${NC}"
echo -e "Service Account: ${YELLOW}$SERVICE_ACCOUNT_NAME${NC}"
echo -e "Expires in: ${YELLOW}$EXPIRY_HOURS hours${NC}"
echo -e "Output file: ${YELLOW}$OUTPUT_FILE${NC}"
echo ""
echo -e "${YELLOW}Usage Instructions:${NC}"
echo -e "1. Securely transfer this file to the vendor (encrypted email/secure file share)"
echo -e "2. Vendor should use: ${YELLOW}export KUBECONFIG=$OUTPUT_FILE${NC}"
echo -e "3. Access expires in $EXPIRY_HOURS hours - regenerate as needed"
echo ""
echo -e "${RED}SECURITY WARNING:${NC}"
echo -e "${RED}• Never commit this file to git${NC}"
echo -e "${RED}• Revoke access when no longer needed${NC}"
echo -e "${RED}• Use encrypted channels for file transfer${NC}"
echo -e "${GREEN}====================================================================${NC}"
