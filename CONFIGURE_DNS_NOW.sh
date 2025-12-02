#!/bin/bash

echo "========================================="
echo "Fleet Management DNS Configuration"
echo "========================================="
echo ""

# Variables
RG="fleet-production-rg"  # Your Azure resource group with DNS zone
ZONE="capitaltechalliance.com"
IP="20.15.65.2"

echo "This script will configure DNS for your Fleet Management System"
echo ""
echo "Target IP: $IP"
echo "DNS Zone: $ZONE"
echo ""
echo "Records to create:"
echo "  - fleet.$ZONE → $IP"
echo "  - fleet-dev.$ZONE → $IP"
echo "  - fleet-staging.$ZONE → $IP"
echo ""

read -p "Do you have access to Azure DNS or another DNS provider? (yes/no): " answer

if [ "$answer" = "yes" ]; then
    read -p "Are you using Azure DNS? (yes/no): " azure_dns
    
    if [ "$azure_dns" = "yes" ]; then
        echo ""
        echo "Running Azure CLI commands to create DNS records..."
        echo ""
        
        # Check if Azure CLI is installed
        if ! command -v az &> /dev/null; then
            echo "❌ Azure CLI not found. Please install it first:"
            echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            exit 1
        fi
        
        # Check if logged in
        if ! az account show &> /dev/null; then
            echo "❌ Not logged in to Azure. Please run: az login"
            exit 1
        fi
        
        echo "Creating DNS A records..."
        
        # Production
        az network dns record-set a add-record \
          --resource-group $RG \
          --zone-name $ZONE \
          --record-set-name fleet \
          --ipv4-address $IP \
          --ttl 300 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Created fleet.$ZONE → $IP"
        else
            echo "⚠️  Note: Record might already exist or RG name incorrect"
        fi
        
        # Development
        az network dns record-set a add-record \
          --resource-group $RG \
          --zone-name $ZONE \
          --record-set-name fleet-dev \
          --ipv4-address $IP \
          --ttl 300 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Created fleet-dev.$ZONE → $IP"
        fi
        
        # Staging
        az network dns record-set a add-record \
          --resource-group $RG \
          --zone-name $ZONE \
          --record-set-name fleet-staging \
          --ipv4-address $IP \
          --ttl 300 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Created fleet-staging.$ZONE → $IP"
        fi
        
        echo ""
        echo "Verifying DNS records..."
        az network dns record-set a list --resource-group $RG --zone-name $ZONE --query "[?name=='fleet' || name=='fleet-dev' || name=='fleet-staging'].{name:name,ip:aRecords[0].ipv4Address}" --output table
        
    else
        echo ""
        echo "Manual DNS Configuration Required"
        echo "========================================="
        echo ""
        echo "Please log in to your DNS provider and create these A records:"
        echo ""
        echo "Record 1:"
        echo "  Type: A"
        echo "  Name: fleet"
        echo "  Value: $IP"
        echo "  TTL: 300"
        echo ""
        echo "Record 2:"
        echo "  Type: A"
        echo "  Name: fleet-dev"
        echo "  Value: $IP"
        echo "  TTL: 300"
        echo ""
        echo "Record 3:"
        echo "  Type: A"
        echo "  Name: fleet-staging"
        echo "  Value: $IP"
        echo "  TTL: 300"
        echo ""
    fi
    
    echo ""
    echo "Testing DNS propagation (this may take 5-15 minutes)..."
    echo ""
    
    for domain in "fleet.$ZONE" "fleet-dev.$ZONE" "fleet-staging.$ZONE"; do
        echo "Testing $domain..."
        result=$(nslookup $domain 2>&1 | grep "Address:" | tail -1 | awk '{print $2}')
        if [ "$result" = "$IP" ]; then
            echo "  ✅ $domain → $IP (propagated)"
        else
            echo "  ⏳ $domain → waiting for propagation (currently: $result)"
            echo "     This is normal - DNS can take 5-15 minutes to propagate"
        fi
    done
    
else
    echo ""
    echo "No problem! For tomorrow's demo, you can use the IP address directly:"
    echo ""
    echo "  Production: http://$IP"
    echo ""
    echo "DNS is optional - the IP address works perfectly for demos."
fi

echo ""
echo "========================================="
echo "Done!"
echo "========================================="
