#!/bin/bash

# ============================================================================
# Fleet Management RAG/CAG/MCP Server Deployment Script
# ============================================================================
# Purpose: Deploy RAG (Retrieval-Augmented Generation), CAG (Context-Augmented
#          Generation), and MCP (Model Context Protocol) servers to Azure VM
# Target VM: fleet-build-test-vm (172.173.175.71)
# Resource Group: FLEET-AI-AGENTS
# Date: 2026-01-04
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VM_IP="${AZURE_VM_IP:-172.173.175.71}"
VM_USER="${AZURE_VM_USER:-azureuser}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-fleet_qa}"
POSTGRES_USER="${POSTGRES_USER:-qauser}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-qapass_secure_2026}"
CLAUDE_MCP_PORT="${CLAUDE_MCP_PORT:-9000}"
TELEMETRY_MCP_PORT="${TELEMETRY_MCP_PORT:-3100}"

echo -e "${BLUE}======================================"
echo "Fleet RAG/CAG/MCP Server Deployment"
echo "======================================${NC}"
echo "VM: $VM_IP"
echo "User: $VM_USER"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Step 1: Check prerequisites
print_info "Checking prerequisites..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "ANTHROPIC_API_KEY environment variable not set"
    echo "Please set it: export ANTHROPIC_API_KEY=your-key-here"
    exit 1
fi
print_status "Prerequisites check complete"

# Step 2: Create deployment package
print_info "Creating deployment package..."

# Create temporary directory
TMP_DIR=$(mktemp -d)
DEPLOY_DIR="$TMP_DIR/rag-mcp-deployment"
mkdir -p "$DEPLOY_DIR"/{src/rag,src/mcp,scripts,config}

# Copy RAG files
print_info "Copying RAG components..."
cp -r api/src/services/rag/* "$DEPLOY_DIR/src/rag/" 2>/dev/null || print_warning "RAG files not found in api/src/services/rag/"

# Copy MCP files
print_info "Copying MCP components..."
cp -r api/src/services/mcp/* "$DEPLOY_DIR/src/mcp/" 2>/dev/null || print_warning "MCP files not found in api/src/services/mcp/"

# Create package.json
cat > "$DEPLOY_DIR/package.json" <<'EOF'
{
  "name": "fleet-rag-mcp-server",
  "version": "1.0.0",
  "description": "Fleet Management RAG/CAG/MCP Servers",
  "type": "module",
  "scripts": {
    "start:telemetry": "tsx src/mcp/fleet-telemetry-mcp.ts",
    "start:claude-mcp": "node scripts/claude-mcp-server.cjs",
    "index:knowledge": "tsx scripts/index-fleet-knowledge.ts",
    "setup:db": "tsx scripts/setup-database.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "@anthropic-ai/sdk": "^0.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/pg": "^8.11.2",
    "@types/node": "^20.11.19",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3"
  }
}
EOF

# Create TypeScript config
cat > "$DEPLOY_DIR/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules"]
}
EOF

# Create environment template
cat > "$DEPLOY_DIR/.env.template" <<EOF
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=$POSTGRES_PORT
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB

# Claude MCP Configuration
ANTHROPIC_API_KEY=YOUR_API_KEY_HERE
CLAUDE_MCP_PORT=$CLAUDE_MCP_PORT

# Fleet Telemetry MCP Configuration
TELEMETRY_MCP_PORT=$TELEMETRY_MCP_PORT
EOF

# Create database setup script
cat > "$DEPLOY_DIR/scripts/setup-database.ts" <<'EOFDB'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'fleet_qa',
  user: process.env.POSTGRES_USER || 'qauser',
  password: process.env.POSTGRES_PASSWORD || 'qapass_secure_2026'
})

async function setupDatabase() {
  console.log('🗄️  Setting up database schema...')

  try {
    // Create code_embeddings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS code_embeddings (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        symbols JSONB,
        chroma_id TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ Created code_embeddings table')

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_code_embeddings_fts
      ON code_embeddings USING GIN(to_tsvector('english', content));
    `)
    console.log('✓ Created full-text search index')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_code_embeddings_path_chunk
      ON code_embeddings(file_path, chunk_index);
    `)
    console.log('✓ Created path/chunk index')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_code_embeddings_hash
      ON code_embeddings(content_hash);
    `)
    console.log('✓ Created content hash index')

    console.log('✅ Database setup complete!')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

setupDatabase()
EOFDB

# Create knowledge indexing script
cat > "$DEPLOY_DIR/scripts/index-fleet-knowledge.ts" <<'EOFINDEX'
import { Pool } from 'pg'
import * as crypto from 'crypto'

const FLEET_INDUSTRY_KNOWLEDGE = {
  telematics_standards: {
    j1939: { description: 'SAE J1939 standard for heavy-duty vehicle communications' },
    obd2: { description: 'On-Board Diagnostics II standard for light-duty vehicles' }
  },
  maintenance_schedules: {
    pm_a: { name: 'Preventive Maintenance A', typical_interval_miles: 5000 },
    pm_b: { name: 'Preventive Maintenance B', typical_interval_miles: 15000 },
    pm_c: { name: 'Preventive Maintenance C', typical_interval_miles: 30000 }
  }
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'fleet_qa',
  user: process.env.POSTGRES_USER || 'qauser',
  password: process.env.POSTGRES_PASSWORD || 'qapass_secure_2026'
})

async function indexKnowledge() {
  console.log('📚 Indexing fleet knowledge...')

  const categories = Object.entries(FLEET_INDUSTRY_KNOWLEDGE)

  for (const [category, data] of categories) {
    const content = JSON.stringify(data, null, 2)
    const contentHash = crypto.createHash('sha256').update(content).digest('hex')

    await pool.query(
      `INSERT INTO code_embeddings
        (file_path, chunk_index, content, start_line, end_line, content_hash, symbols, chroma_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (chroma_id) DO UPDATE
         SET content = EXCLUDED.content, symbols = EXCLUDED.symbols`,
      [
        `fleet_knowledge/${category}.json`,
        0,
        content,
        1,
        content.split('\n').length,
        contentHash,
        JSON.stringify({ category, type: 'industry_knowledge' }),
        `fleet_knowledge:${category}`
      ]
    )
    console.log(`✓ Indexed ${category}`)
  }

  await pool.end()
  console.log('✅ Fleet knowledge indexing complete!')
}

indexKnowledge()
EOFINDEX

# Create Claude MCP server
cat > "$DEPLOY_DIR/scripts/claude-mcp-server.cjs" <<'EOFMCP'
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const PORT = process.env.CLAUDE_MCP_PORT || 9000;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

console.log(`
🚀 ========================================
   Claude MCP Server
   AI-Powered Code Analysis
========================================
✅ Server: http://localhost:${PORT}
🤖 Model: ${MODEL}

Endpoints:
  GET  /health - Health check
  POST /analyze - Analyze code
  POST /remediate - Fix code issues
========================================
`);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'claude-mcp',
    model: MODEL,
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', async (req, res) => {
  try {
    const { code, language = 'typescript', context } = req.body;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this ${language} code and identify issues, potential bugs, and improvement suggestions:\n\n${code}\n\n${context ? 'Context: ' + context : ''}`
      }]
    });

    res.json({
      analysis: message.content[0].text,
      model: MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/remediate', async (req, res) => {
  try {
    const { code, issues, language = 'typescript' } = req.body;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Fix the following ${language} code based on these issues:\n\nIssues: ${issues.join(', ')}\n\nCode:\n${code}\n\nProvide the corrected code.`
      }]
    });

    res.json({
      remediated_code: message.content[0].text,
      model: MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Claude MCP Server listening on port ${PORT}`);
});
EOFMCP

# Create deployment script for VM
cat > "$DEPLOY_DIR/scripts/deploy.sh" <<'EOFDEPLOY'
#!/bin/bash
set -e

echo "🚀 Deploying RAG/CAG/MCP Servers..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Step 2: Setup database
echo "🗄️  Setting up database..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo "⚠️  Please edit .env and set your ANTHROPIC_API_KEY"
fi

# Load environment
source .env

# Run database setup
npm run setup:db

# Step 3: Index fleet knowledge
echo "📚 Indexing fleet knowledge..."
npm run index:knowledge

# Step 4: Start services
echo "🎯 Starting services..."

# Start Claude MCP Server
echo "Starting Claude MCP Server on port $CLAUDE_MCP_PORT..."
nohup npm run start:claude-mcp > /tmp/claude-mcp.log 2>&1 &
CLAUDE_PID=$!
echo $CLAUDE_PID > /tmp/claude-mcp.pid
echo "✓ Claude MCP Server started (PID: $CLAUDE_PID)"

# Start Fleet Telemetry MCP
echo "Starting Fleet Telemetry MCP on port $TELEMETRY_MCP_PORT..."
nohup npm run start:telemetry > /tmp/telemetry-mcp.log 2>&1 &
TELEMETRY_PID=$!
echo $TELEMETRY_PID > /tmp/telemetry-mcp.pid
echo "✓ Fleet Telemetry MCP started (PID: $TELEMETRY_PID)"

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo "Claude MCP Server:     http://localhost:$CLAUDE_MCP_PORT"
echo "Fleet Telemetry MCP:   http://localhost:$TELEMETRY_MCP_PORT"
echo ""
echo "Logs:"
echo "  Claude MCP:    tail -f /tmp/claude-mcp.log"
echo "  Telemetry MCP: tail -f /tmp/telemetry-mcp.log"
echo "======================================"
EOFDEPLOY

chmod +x "$DEPLOY_DIR/scripts/deploy.sh"

# Create README
cat > "$DEPLOY_DIR/README.md" <<'EOFREADME'
# Fleet RAG/CAG/MCP Server

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.template .env
   # Edit .env and set ANTHROPIC_API_KEY
   ```

3. Setup database:
   ```bash
   npm run setup:db
   ```

4. Index fleet knowledge:
   ```bash
   npm run index:knowledge
   ```

5. Start servers:
   ```bash
   # Claude MCP Server
   npm run start:claude-mcp

   # Fleet Telemetry MCP (in another terminal)
   npm run start:telemetry
   ```

## API Endpoints

### Claude MCP Server (Port 9000)
- `GET /health` - Health check
- `POST /analyze` - Analyze code
- `POST /remediate` - Fix code issues

### Fleet Telemetry MCP (Port 3100)
- `GET /health` - Health check
- `POST /validate` - Validate telemetry data
- `GET /standards/:protocol` - Get protocol standards

## Testing

```bash
# Test Claude MCP
curl http://localhost:9000/health

# Test Fleet Telemetry MCP
curl http://localhost:3100/health

# Validate telemetry
curl -X POST http://localhost:3100/validate \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"V1","dataType":"engine_rpm","value":2500}'
```
EOFREADME

# Archive deployment package
print_info "Creating deployment archive..."
cd "$TMP_DIR"
tar -czf rag-mcp-deployment.tar.gz rag-mcp-deployment/
print_status "Deployment package created"

# Step 3: Transfer to Azure VM
print_info "Transferring to Azure VM ($VM_IP)..."
scp rag-mcp-deployment.tar.gz ${VM_USER}@${VM_IP}:/tmp/
print_status "Transfer complete"

# Step 4: Deploy on VM
print_info "Deploying on Azure VM..."
ssh ${VM_USER}@${VM_IP} <<EOFVM
set -e

# Extract deployment
cd /home/${VM_USER}
if [ -d "rag-mcp-server" ]; then
    echo "⚠️  Backing up existing installation..."
    mv rag-mcp-server rag-mcp-server.backup.\$(date +%Y%m%d_%H%M%S)
fi

tar -xzf /tmp/rag-mcp-deployment.tar.gz
mv rag-mcp-deployment rag-mcp-server
cd rag-mcp-server

# Create .env from template
cp .env.template .env
sed -i "s/YOUR_API_KEY_HERE/$ANTHROPIC_API_KEY/g" .env

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Setup database (if PostgreSQL is running)
if systemctl is-active --quiet postgresql; then
    echo "🗄️  Setting up database..."
    npm run setup:db || echo "⚠️  Database setup failed - may need manual setup"

    echo "📚 Indexing fleet knowledge..."
    npm run index:knowledge || echo "⚠️  Knowledge indexing failed"
fi

# Start services
echo "🎯 Starting services..."
bash scripts/deploy.sh

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo "Location: /home/${VM_USER}/rag-mcp-server"
echo "Logs: /tmp/claude-mcp.log, /tmp/telemetry-mcp.log"
echo ""
echo "Test endpoints:"
echo "  curl http://localhost:$CLAUDE_MCP_PORT/health"
echo "  curl http://localhost:$TELEMETRY_MCP_PORT/health"
echo "======================================"
EOFVM

print_status "Deployment complete!"

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}======================================"
echo "✅ Deployment Successful!"
echo "======================================${NC}"
echo "VM: $VM_IP"
echo "Claude MCP: http://$VM_IP:$CLAUDE_MCP_PORT"
echo "Telemetry MCP: http://$VM_IP:$TELEMETRY_MCP_PORT"
echo ""
echo "Check logs:"
echo "  ssh ${VM_USER}@${VM_IP} 'tail -f /tmp/claude-mcp.log'"
echo "  ssh ${VM_USER}@${VM_IP} 'tail -f /tmp/telemetry-mcp.log'"
echo ""
