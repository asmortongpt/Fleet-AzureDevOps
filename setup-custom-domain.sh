#!/bin/bash

echo "🌐 Setting up custom domain: fleet.capitaltechalliance.com"
echo "========================================================"

# Configuration
RESOURCE_GROUP="fleet-production-rg"
CUSTOM_DOMAIN="fleet.capitaltechalliance.com"
FRONT_DOOR_NAME="fleet-frontdoor"
FRONTEND_ENDPOINT="fleet-production.eastus2.azurecontainer.io"

echo ""
echo "📋 Configuration:"
echo "  - Custom Domain: $CUSTOM_DOMAIN"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Front Door: $FRONT_DOOR_NAME"
echo "  - Backend: $FRONTEND_ENDPOINT"
echo ""

# Create Azure Front Door Profile (Standard)
echo "🔧 Creating Azure Front Door profile..."
az afd profile create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_AzureFrontDoor

# Create Front Door Endpoint
echo "🔧 Creating Front Door endpoint..."
az afd endpoint create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name fleet-endpoint \
  --enabled-state Enabled

# Create Origin Group
echo "🔧 Creating origin group..."
az afd origin-group create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name fleet-origins \
  --probe-request-type GET \
  --probe-protocol Http \
  --probe-interval-in-seconds 100 \
  --probe-path / \
  --sample-size 4 \
  --successful-samples-required 3 \
  --additional-latency-in-milliseconds 50

# Add Origin (ACI Frontend)
echo "🔧 Adding origin (ACI frontend)..."
az afd origin create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name fleet-origins \
  --origin-name fleet-aci-origin \
  --host-name $FRONTEND_ENDPOINT \
  --origin-host-header $FRONTEND_ENDPOINT \
  --priority 1 \
  --weight 1000 \
  --enabled-state Enabled \
  --http-port 80 \
  --https-port 443

# Create Route
echo "🔧 Creating route..."
az afd route create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name fleet-endpoint \
  --route-name default-route \
  --origin-group fleet-origins \
  --supported-protocols Http Https \
  --link-to-default-domain Enabled \
  --forwarding-protocol MatchRequest \
  --https-redirect Enabled

# Add Custom Domain
echo "🔧 Adding custom domain $CUSTOM_DOMAIN..."
az afd custom-domain create \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --custom-domain-name fleet-custom-domain \
  --host-name $CUSTOM_DOMAIN \
  --minimum-tls-version TLS12

# Get validation token
echo ""
echo "📝 DNS Validation Required:"
echo "=================================================="
VALIDATION=$(az afd custom-domain show \
  --profile-name $FRONT_DOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --custom-domain-name fleet-custom-domain \
  --query validationProperties -o json)

echo "$VALIDATION" | jq .

echo ""
echo "⚠️  ACTION REQUIRED:"
echo "=================================================="
echo "1. Add the following DNS records to capitaltechalliance.com:"
echo ""
echo "   TXT Record:"
echo "   Name: _dnsauth.fleet"
echo "   Value: [Get from validation output above]"
echo ""
echo "   CNAME Record:"
echo "   Name: fleet"
echo "   Value: fleet-endpoint-XXXXX.z01.azurefd.net"
echo ""
echo "2. Wait for DNS propagation (5-15 minutes)"
echo ""
echo "3. Run validation:"
echo "   az afd custom-domain update \\"
echo "     --profile-name $FRONT_DOOR_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --custom-domain-name fleet-custom-domain \\"
echo "     --certificate-type ManagedCertificate"
echo ""
echo "4. Associate custom domain with route:"
echo "   az afd route update \\"
echo "     --profile-name $FRONT_DOOR_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --endpoint-name fleet-endpoint \\"
echo "     --route-name default-route \\"
echo "     --custom-domains fleet-custom-domain"
echo ""
echo "✅ Azure Front Door setup initiated!"
echo "🌐 Your app will be available at: https://$CUSTOM_DOMAIN"
echo ""
