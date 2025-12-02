#!/bin/bash

# ===========================================
# Fleet Management System - Secret Generator
# ===========================================
# This script generates cryptographically secure secrets for production use
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Fleet Management System - Secret Generator"
echo "=============================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed."
    exit 1
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "⚠️  Warning: OpenSSL not found. Using Node.js crypto only."
    USE_OPENSSL=false
else
    USE_OPENSSL=true
fi

echo "📝 Generating cryptographically secure secrets..."
echo ""

# Generate JWT secrets (512-bit / 128 hex characters)
echo "🔑 JWT Secrets (512-bit):"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""

# Generate encryption keys (256-bit / 64 hex characters)
echo "🔐 Encryption Keys (256-bit):"
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "API_KEY_SALT=$API_KEY_SALT"
echo ""

# Generate database password
if [ "$USE_OPENSSL" = true ]; then
    echo "🗄️  Database Password:"
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    echo "DATABASE_PASSWORD=$DB_PASSWORD"
    echo ""
fi

# Generate API key
echo "🌐 API Key:"
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "API_KEY=$API_KEY"
echo ""

# Create .env file snippet
echo "📄 Creating .env snippet..."
cat > .env.secrets.tmp << EOF
# ===========================================
# AUTO-GENERATED SECRETS - $(date)
# ===========================================

# JWT Tokens (512-bit)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Encryption (256-bit)
ENCRYPTION_KEY=$ENCRYPTION_KEY
SESSION_SECRET=$SESSION_SECRET
API_KEY_SALT=$API_KEY_SALT

# Database
$(if [ "$USE_OPENSSL" = true ]; then echo "DATABASE_PASSWORD=$DB_PASSWORD"; fi)

# API Key
API_KEY=$API_KEY

# ===========================================
# IMPORTANT:
# 1. Copy these values to your .env file
# 2. Store in Azure Key Vault for production
# 3. Delete this file after copying: rm .env.secrets.tmp
# 4. NEVER commit secrets to git
# ===========================================
EOF

echo ""
echo "✅ Secrets generated successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the generated secrets in: .env.secrets.tmp"
echo "2. Copy secrets to your .env file"
echo "3. For production, store in Azure Key Vault"
echo "4. Delete the temporary file: rm .env.secrets.tmp"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "- These secrets are cryptographically random"
echo "- Store securely - never commit to git"
echo "- Rotate every 90 days minimum"
echo "- Use Azure Key Vault in production"
echo ""
