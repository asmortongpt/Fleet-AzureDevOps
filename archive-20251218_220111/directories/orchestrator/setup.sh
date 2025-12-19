#!/bin/bash

# ============================================================================
# Fleet Frontend Refactoring Orchestrator - Setup Script
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "Fleet Frontend Refactoring Orchestrator - Setup"
echo "============================================================================"
echo ""

# ============================================================================
# STEP 1: Verify Environment Variables
# ============================================================================

echo "Step 1: Verifying environment variables..."

if [ ! -f ~/.env ]; then
  echo "✗ Error: ~/.env file not found"
  echo "  Please ensure ~/.env exists with required variables"
  exit 1
fi

source ~/.env

REQUIRED_VARS=(
  "AZURE_SQL_SERVER"
  "AZURE_SQL_DATABASE"
  "AZURE_SQL_USERNAME"
  "AZURE_SQL_PASSWORD"
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
  "GITHUB_PAT"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "✗ Error: Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  exit 1
fi

echo "✓ All required environment variables present"
echo ""

# ============================================================================
# STEP 2: Check Prerequisites
# ============================================================================

echo "Step 2: Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "✗ Error: python3 not found"
  echo "  Please install Python 3.10+"
  exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✓ Python $PYTHON_VERSION found"

# Check psql
if ! command -v psql &> /dev/null; then
  echo "✗ Error: psql (PostgreSQL client) not found"
  echo "  Install with: brew install postgresql"
  exit 1
fi

echo "✓ psql found"

# Check gh CLI
if ! command -v gh &> /dev/null; then
  echo "✗ Error: gh (GitHub CLI) not found"
  echo "  Install with: brew install gh"
  exit 1
fi

echo "✓ gh CLI found"

# Check gh authentication
if ! gh auth status &> /dev/null; then
  echo "✗ Error: GitHub CLI not authenticated"
  echo "  Authenticate with: gh auth login"
  exit 1
fi

echo "✓ GitHub CLI authenticated"
echo ""

# ============================================================================
# STEP 3: Install Python Dependencies
# ============================================================================

echo "Step 3: Installing Python dependencies..."

pip3 install --quiet psycopg2-binary anthropic openai python-dotenv

echo "✓ Python dependencies installed"
echo ""

# ============================================================================
# STEP 4: Test Database Connection
# ============================================================================

echo "Step 4: Testing database connection..."

PGPASSWORD=$AZURE_SQL_PASSWORD psql \
  -h $AZURE_SQL_SERVER \
  -U $AZURE_SQL_USERNAME \
  -d $AZURE_SQL_DATABASE \
  -c "SELECT version();" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Database connection successful"
else
  echo "✗ Error: Database connection failed"
  echo "  Please check your database credentials in ~/.env"
  exit 1
fi

echo ""

# ============================================================================
# STEP 5: Initialize Database Schema
# ============================================================================

echo "Step 5: Initializing database schema..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if tables already exist
TABLES_EXIST=$(PGPASSWORD=$AZURE_SQL_PASSWORD psql \
  -h $AZURE_SQL_SERVER \
  -U $AZURE_SQL_USERNAME \
  -d $AZURE_SQL_DATABASE \
  -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('projects', 'tasks', 'agents', 'assignments', 'evidence')")

if [ "$TABLES_EXIST" -eq "5" ]; then
  echo "⚠ Warning: Tables already exist"
  read -p "Do you want to DROP and recreate tables? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Skipping schema initialization"
  else
    echo "Dropping and recreating tables..."
    PGPASSWORD=$AZURE_SQL_PASSWORD psql \
      -h $AZURE_SQL_SERVER \
      -U $AZURE_SQL_USERNAME \
      -d $AZURE_SQL_DATABASE \
      -f "$SCRIPT_DIR/db/schema.sql" \
      > /dev/null 2>&1
    echo "✓ Schema initialized"
  fi
else
  PGPASSWORD=$AZURE_SQL_PASSWORD psql \
    -h $AZURE_SQL_SERVER \
    -U $AZURE_SQL_USERNAME \
    -d $AZURE_SQL_DATABASE \
    -f "$SCRIPT_DIR/db/schema.sql" \
    > /dev/null 2>&1
  echo "✓ Schema initialized"
fi

echo ""

# ============================================================================
# STEP 6: Seed Initial Data
# ============================================================================

echo "Step 6: Seeding initial data..."

# Check if project already exists
PROJECT_EXISTS=$(PGPASSWORD=$AZURE_SQL_PASSWORD psql \
  -h $AZURE_SQL_SERVER \
  -U $AZURE_SQL_USERNAME \
  -d $AZURE_SQL_DATABASE \
  -tAc "SELECT COUNT(*) FROM projects WHERE id = '11111111-1111-1111-1111-111111111111'")

if [ "$PROJECT_EXISTS" -eq "1" ]; then
  echo "⚠ Warning: Project already exists"
  read -p "Do you want to reseed data? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Skipping data seeding"
  else
    echo "Reseeding data..."
    # Delete existing data
    PGPASSWORD=$AZURE_SQL_PASSWORD psql \
      -h $AZURE_SQL_SERVER \
      -U $AZURE_SQL_USERNAME \
      -d $AZURE_SQL_DATABASE \
      -c "DELETE FROM evidence; DELETE FROM assignments; DELETE FROM tasks; DELETE FROM agents; DELETE FROM projects;" \
      > /dev/null 2>&1

    # Seed new data
    PGPASSWORD=$AZURE_SQL_PASSWORD psql \
      -h $AZURE_SQL_SERVER \
      -U $AZURE_SQL_USERNAME \
      -d $AZURE_SQL_DATABASE \
      -f "$SCRIPT_DIR/db/seed.sql" \
      > /dev/null 2>&1
    echo "✓ Data seeded"
  fi
else
  PGPASSWORD=$AZURE_SQL_PASSWORD psql \
    -h $AZURE_SQL_SERVER \
    -U $AZURE_SQL_USERNAME \
    -d $AZURE_SQL_DATABASE \
    -f "$SCRIPT_DIR/db/seed.sql" \
    > /dev/null 2>&1
  echo "✓ Data seeded"
fi

echo ""

# ============================================================================
# STEP 7: Verify Setup
# ============================================================================

echo "Step 7: Verifying setup..."

# Count projects, tasks, agents
VERIFICATION=$(PGPASSWORD=$AZURE_SQL_PASSWORD psql \
  -h $AZURE_SQL_SERVER \
  -U $AZURE_SQL_USERNAME \
  -d $AZURE_SQL_DATABASE \
  -tAc "
SELECT
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM agents) as agents
")

echo "Database verification:"
echo "  Projects: $(echo $VERIFICATION | awk '{print $1}')"
echo "  Tasks: $(echo $VERIFICATION | awk '{print $2}')"
echo "  Agents: $(echo $VERIFICATION | awk '{print $3}')"
echo ""

# Test API connectivity
echo "Testing API connectivity..."

# Test Anthropic
if curl -s -o /dev/null -w "%{http_code}" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-5","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  https://api.anthropic.com/v1/messages | grep -q "200"; then
  echo "✓ Anthropic API connection successful"
else
  echo "✗ Warning: Anthropic API connection failed"
fi

# Test OpenAI
if curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
  https://api.openai.com/v1/chat/completions | grep -q "200"; then
  echo "✓ OpenAI API connection successful"
else
  echo "✗ Warning: OpenAI API connection failed"
fi

echo ""

# ============================================================================
# STEP 8: Setup Complete
# ============================================================================

echo "============================================================================"
echo "Setup Complete!"
echo "============================================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Run the orchestrator:"
echo "   cd $SCRIPT_DIR"
echo "   python3 orchestrator.py"
echo ""
echo "2. Monitor progress in another terminal:"
echo "   watch -n 10 cat $SCRIPT_DIR/status.json"
echo ""
echo "3. View task details:"
echo "   cat $SCRIPT_DIR/TASK_PLAN.md"
echo ""
echo "4. Query database for status:"
echo "   PGPASSWORD=\$AZURE_SQL_PASSWORD psql \\"
echo "     -h \$AZURE_SQL_SERVER \\"
echo "     -U \$AZURE_SQL_USERNAME \\"
echo "     -d \$AZURE_SQL_DATABASE \\"
echo "     -c \"SELECT title, status, percent_complete FROM tasks ORDER BY priority DESC\""
echo ""
echo "============================================================================"
