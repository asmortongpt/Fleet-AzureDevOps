#!/bin/bash
# Azure VM Setup and Test Execution Script
# This script runs ON the Azure VM

set -e

echo "🔧 Setting up Azure VM for Fleet Testing..."
echo "📅 $(date)"
echo ""

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Playwright dependencies
echo "🎭 Installing Playwright..."
npm install -g playwright @playwright/test
npx playwright install --with-deps chromium

# Set environment variables
export OPENAI_API_KEY="${OPENAI_API_KEY:-***REMOVED***}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-***REMOVED***}"
export GEMINI_API_KEY="${GEMINI_API_KEY:-***REMOVED***}"
export GROK_API_KEY="${GROK_API_KEY:-***REMOVED***}"

# Clone Fleet repo if not present
if [ ! -d "/home/azureuser/Fleet" ]; then
    echo "📥 Cloning Fleet repository..."
    cd /home/azureuser
    git clone https://github.com/asmortongpt/Fleet.git
fi

cd /home/azureuser/Fleet

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Start the application in background
echo "🚀 Starting Fleet application..."
npm run dev &
APP_PID=$!
sleep 10

# Wait for app to be ready
echo "⏳ Waiting for application to start..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null; then
        echo "✅ Application is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 1
done

# Create test workspace
mkdir -p /home/azureuser/fleet-test-results
cd /home/azureuser/Fleet

# Run the comprehensive test suite
echo ""
echo "🚀 Launching 10 parallel AI test agents..."
bash /home/azureuser/Fleet/azure-test-agents/comprehensive-test-suite.sh

# Cleanup
kill $APP_PID 2>/dev/null || true

echo ""
echo "✅ Testing complete!"
echo "📁 Results: /home/azureuser/fleet-test-results"
