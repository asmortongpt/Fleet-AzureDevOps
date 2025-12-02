#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          ARCHITECT-PRIME Deployment & Startup                   ║"
echo "║     Fortune 50-Level Production System with Best LLMs           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Create workspace
mkdir -p /home/azureuser/agent-workspace
cd /home/azureuser/agent-workspace

echo "📦 Installing system dependencies..."
sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  python3-pip \
  python3-venv \
  postgresql \
  postgresql-contrib \
  git \
  > /dev/null 2>&1

echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

echo "📚 Installing Python packages..."
pip install -q --upgrade pip
pip install -q \
  openai>=1.0.0 \
  anthropic>=0.18.0 \
  google-generativeai>=0.3.0 \
  python-dotenv>=1.0.0 \
  chromadb>=0.4.0 \
  sentence-transformers>=2.2.0 \
  psycopg2-binary>=2.9.9 \
  sqlalchemy>=2.0.25 \
  gitpython>=3.1.40 \
  pydantic>=2.5.0 \
  aiofiles>=23.2.1 \
  rich>=13.7.0

echo "🗄️  Setting up PostgreSQL database..."
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE architect_prime;" 2>/dev/null || echo "Database exists"
sudo -u postgres psql -c "CREATE USER arch_user WITH PASSWORD 'arch_pass';" 2>/dev/null || echo "User exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE architect_prime TO arch_user;"

echo "✅ Environment ready. Starting ARCHITECT-PRIME..."
echo ""

# The actual Python orchestrator will be uploaded separately
# This script just prepares the environment

echo "📊 Environment Status:"
python3 --version
pip list | grep -E "(openai|anthropic|google-generativeai|chromadb)"
psql --version

echo ""
echo "✅ Ready to deploy orchestrator code"
