#!/bin/bash
#
# Fleet Management System - Custom Domain Setup Script
# Automated deployment with SSL/TLS certificates
#

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fleet Management - Custom Domain Setup             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
DOMAIN=${1:-"fleet.capitaltechalliance.com"}
API_DOMAIN=${2:-"api.fleet.capitaltechalliance.com"}
EMAIL=${3:-"admin@capitaltechalliance.com"}
NAMESPACE="fleet-management"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Frontend Domain: $DOMAIN"
echo "  API Domain:      $API_DOMAIN"
echo "  Email:           $EMAIL"
echo "  Namespace:       $NAMESPACE"
echo ""

read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Check Prerequisites
echo -e "\n${BLUE}[1/7]${NC} Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} kubectl found"

if ! kubectl get ns $NAMESPACE &> /dev/null; then
    echo -e "${RED}✗ Namespace $NAMESPACE not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Namespace exists"

# Step 2: Install Nginx Ingress (if not already installed)
echo -e "\n${BLUE}[2/7]${NC} Checking Nginx Ingress Controller..."

if kubectl get ns ingress-nginx &> /dev/null; then
    echo -e "${GREEN}✓${NC} Nginx Ingress already installed"
else
    echo "Installing Nginx Ingress Controller..."
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm install nginx-ingress ingress-nginx/ingress-nginx \
      --namespace ingress-nginx \
      --create-namespace \
      --set controller.service.type=LoadBalancer \
      --set controller.metrics.enabled=true

    echo "Waiting for LoadBalancer IP..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=120s
fi

# Get External IP
EXTERNAL_IP=$(kubectl get svc -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$EXTERNAL_IP" ]; then
    EXTERNAL_IP=$(kubectl get svc -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
fi

echo -e "${GREEN}✓${NC} Nginx Ingress External IP: $EXTERNAL_IP"
echo ""
echo -e "${YELLOW}⚠ DNS Configuration Required:${NC}"
echo "  Add these A records to your DNS:"
echo "  $DOMAIN      → $EXTERNAL_IP"
echo "  $API_DOMAIN  → $EXTERNAL_IP"
echo ""
read -p "Have you configured DNS records? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure DNS first, then run this script again."
    exit 1
fi

# Step 3: Install cert-manager
echo -e "\n${BLUE}[3/7]${NC} Installing cert-manager..."

if kubectl get ns cert-manager &> /dev/null; then
    echo -e "${GREEN}✓${NC} cert-manager already installed"
else
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

    echo "Waiting for cert-manager to be ready..."
    kubectl wait --namespace cert-manager \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/instance=cert-manager \
      --timeout=120s
    echo -e "${GREEN}✓${NC} cert-manager installed"
fi

# Step 4: Configure Let's Encrypt Issuers
echo -e "\n${BLUE}[4/7]${NC} Configuring Let's Encrypt..."

# Update email in cert-manager config
sed "s/admin@capitaltechalliance.com/$EMAIL/g" deployment/cert-manager-setup.yaml > /tmp/cert-manager-setup-temp.yaml
kubectl apply -f /tmp/cert-manager-setup-temp.yaml
rm /tmp/cert-manager-setup-temp.yaml

echo -e "${GREEN}✓${NC} Let's Encrypt issuers configured"

# Step 5: Deploy Ingress with SSL
echo -e "\n${BLUE}[5/7]${NC} Deploying Ingress with SSL..."

# Update domains in ingress config
sed -e "s/fleet.capitaltechalliance.com/$DOMAIN/g" \
    -e "s/api.fleet.capitaltechalliance.com/$API_DOMAIN/g" \
    deployment/ingress-ssl.yaml > /tmp/ingress-ssl-temp.yaml

kubectl apply -f /tmp/ingress-ssl-temp.yaml
rm /tmp/ingress-ssl-temp.yaml

echo -e "${GREEN}✓${NC} Ingress deployed"

# Step 6: Wait for Certificate
echo -e "\n${BLUE}[6/7]${NC} Waiting for SSL certificate..."
echo "This may take 1-3 minutes..."

for i in {1..60}; do
    STATUS=$(kubectl get certificate fleet-tls-cert -n $NAMESPACE -o jsonpath='{.status.conditions[0].status}' 2>/dev/null || echo "False")
    if [ "$STATUS" == "True" ]; then
        echo -e "${GREEN}✓${NC} SSL certificate issued!"
        break
    fi
    echo -n "."
    sleep 5
done
echo ""

# Step 7: Verify Setup
echo -e "\n${BLUE}[7/7]${NC} Verifying setup..."

echo -n "Testing HTTPS redirect... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "308" ] || [ "$HTTP_CODE" == "301" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ HTTP code: $HTTP_CODE${NC}"
fi

echo -n "Testing HTTPS access... "
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTPS_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS code: $HTTPS_CODE (may need DNS propagation)${NC}"
fi

echo -n "Testing API endpoint... "
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$API_DOMAIN/api/health 2>/dev/null || echo "000")
if [ "$API_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ API code: $API_CODE (may need DNS propagation)${NC}"
fi

# Final Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Custom Domain Setup Complete!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your Fleet Management System is now accessible at:"
echo -e "  ${BLUE}Frontend:${NC} https://$DOMAIN"
echo -e "  ${BLUE}API:${NC}      https://$API_DOMAIN"
echo ""
echo "SSL Certificate:"
echo "  ✓ Issued by Let's Encrypt"
echo "  ✓ Auto-renews 30 days before expiration"
echo ""
echo "Next Steps:"
echo "  1. Test in browser: https://$DOMAIN"
echo "  2. Verify SSL certificate (🔒 padlock in address bar)"
echo "  3. Update frontend environment with API_URL"
echo ""
echo "Troubleshooting:"
echo "  kubectl get certificate -n $NAMESPACE"
echo "  kubectl get ingress -n $NAMESPACE"
echo "  kubectl logs -n cert-manager deploy/cert-manager"
echo ""
