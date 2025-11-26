#!/bin/bash
# Setup custom domain for Fleet Management System
set -e

echo "🌐 Fleet Management - Custom Domain Setup"
CUSTOM_DOMAIN="fleet.capitaltechalliance.com"
AZURE_DEFAULT_DOMAIN="green-pond-0f040980f.3.azurestaticapps.net"

echo "📋 Add these DNS records in your domain registrar:"
echo ""
echo "1. CNAME Record:"
echo "   Name:  fleet"
echo "   Value: $AZURE_DEFAULT_DOMAIN"
echo ""
echo "2. Then run: az staticwebapp hostname set --name green-pond-0f040980f --resource-group Fleet-Production --hostname $CUSTOM_DOMAIN"
