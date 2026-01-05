# Fleet Management RAG/CAG/MCP Server Setup Documentation

**Date Created**: 2026-01-04
**Azure VM**: fleet-build-test-vm (172.173.175.71)
**Resource Group**: FLEET-AI-AGENTS
**Created By**: Production deployment team

---

## Executive Summary

This document captures the complete configuration of the RAG (Retrieval-Augmented Generation), CAG (Context-Augmented Generation), and MCP (Model Context Protocol) servers that were deployed to the Azure VM today. These servers provide AI-powered code analysis, fleet industry knowledge retrieval, and telemetry validation services.

---

## Architecture Overview

### System Components

1. **RAG API Server** (Port: Unknown - process 807168)
   - Purpose: Code search and retrieval with embeddings
   - Technology: Node.js + PostgreSQL + Vector Search
   - Status: Running as root

2. **Claude MCP Server** (Port: 9000)
   - Purpose: AI-powered code analysis and remediation
   - Technology: Node.js + Anthropic Claude API
   - Status: Running
   - API Key: Uses ANTHROPIC_API_KEY from environment

3. **Fleet Telemetry MCP** (Port: 3100)
   - Purpose: Vehicle telemetry validation against industry standards
   - Technology: Express.js + PostgreSQL
   - Standards: SAE J1939, OBD-II, FMS

4. **Fleet Knowledge Base**
   - Purpose: Industry-standard fleet management knowledge
   - Content: Telematics protocols, maintenance schedules, compliance rules
   - Storage: PostgreSQL code_embeddings table

---

## Component Details

### 1. RAG API Server

**Location**: `/home/azureuser/[unknown]/dist/rag-api/server.js`
**Process ID**: 807168
**User**: root

**Database Configuration**:
```typescript
{
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'fleet_qa',
  user: process.env.POSTGRES_USER || 'qauser',
  password: process.env.POSTGRES_PASSWORD || 'qapass_secure_2026'
}
```

**Database Schema**:
```sql
CREATE TABLE code_embeddings (
  file_path TEXT,
  chunk_index INTEGER,
  content TEXT,
  start_line INTEGER,
  end_line INTEGER,
  content_hash TEXT,
  symbols JSONB,
  chroma_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features**:
- Code chunking (50 lines per chunk)
- Symbol extraction (functions, classes, interfaces, constants)
- Fleet context detection
- Full-text search with PostgreSQL `tsvector`
- Industry knowledge integration

---

### 2. Claude MCP Server

**Location**: `/home/azureuser/FleetOps/claude-mcp-server.cjs` (file deleted but process running)
**Process ID**: 1120679
**Port**: 9000
**Model**: claude-sonnet-4-20250514

**Environment Variables**:
```bash
ANTHROPIC_API_KEY=***REMOVED***
CLAUDE_MCP_PORT=9000
```

**Endpoints**:
- `GET /health` - Health check
- `POST /analyze` - Analyze code
- `POST /remediate` - Fix code issues

**Startup Command**:
```bash
cd FleetOps && \
ANTHROPIC_API_KEY=***REMOVED*** \
CLAUDE_MCP_PORT=9000 \
nohup node claude-mcp-server.cjs > /tmp/claude-mcp.log 2>&1 &
```

---

### 3. Fleet Telemetry MCP Server

**Location**: `/home/azureuser/qa-framework/src/mcp/fleet-telemetry-mcp.ts`
**Port**: 3100
**Purpose**: Validate vehicle telemetry data against industry standards

**API Endpoints**:
- `POST /validate` - Validate telemetry data
- `GET /standards/:protocol` - Get protocol standards (J1939, OBD2, FMS)
- `GET /health` - Health check

**Supported Data Types**:
- `engine_rpm` - SAE J1939 PGN 61444
- `vehicle_speed` - SAE J1939 PGN 65265 or OBD-II PID 0x0D
- `coolant_temperature` - SAE J1939 PGN 65262 or OBD-II PID 0x05
- `fuel_level` - SAE J1939 PGN 65276 or OBD-II PID 0x2F
- `odometer` - SAE J1939 PGN 65248
- `dtc` - Diagnostic Trouble Codes

**Validation Example**:
```typescript
POST /validate
{
  "vehicleId": "VEH-123",
  "dataType": "engine_rpm",
  "value": 2500,
  "timestamp": "2026-01-04T12:00:00Z"
}

Response:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "industry_standard": "SAE J1939 PGN 61444"
}
```

---

### 4. Fleet Knowledge Base

**Location**: `/home/azureuser/qa-framework/src/rag/fleet-knowledge-base.ts`

**Knowledge Categories**:

#### Telematics Standards
- **J1939**: Heavy-duty vehicle communications (CAN bus, PGNs, SPNs)
- **OBD-II**: Light-duty vehicle diagnostics (PIDs, DTCs)
- **FMS Standard**: European fleet management (distance, hours, fuel)

#### Maintenance Schedules
- **PM-A** (5,000 mi / 3 mo): Oil change, tire pressure, fluid checks
- **PM-B** (15,000 mi / 6 mo): PM-A + tire rotation, air filter, fluid checks
- **PM-C** (30,000 mi / 12 mo): PM-B + transmission, differential, coolant flush
- **DOT Inspection** (Annual): Brakes, exhaust, lights, tires, etc.

#### Fuel Efficiency Benchmarks
- Light Duty (Class 1-3): 14-25 MPG
- Medium Duty (Class 4-6): 8-14 MPG
- Heavy Duty (Class 7-8): 5-10 MPG
- Electric Vehicles: 30-120 MPGe

#### Safety Compliance
- **CSA Program**: 7 BASIC categories with severity weights
- **FMCSA Regulations**: Hours of Service, DOT inspections (6 levels)
- **ELD Mandate**: Electronic logging device requirements

#### Asset Lifecycle
- Depreciation methods (straight-line, declining balance, units of production)
- Total Cost of Ownership (TCO) components
- Replacement triggers (age, mileage, cost, condition)

#### Utilization Metrics
- Vehicle utilization: (Actual Hours / Available Hours) × 100
- Driver productivity: Miles/year, revenue/mile, on-time %
- Fleet capacity: In-service rate, deadhead %, availability

---

## PostgreSQL Database Setup

**Connection Details**:
```bash
Host: localhost
Port: 5433
Database: fleet_qa
User: qauser
Password: qapass_secure_2026
```

**Schema Creation**:
```sql
-- Code embeddings table
CREATE TABLE code_embeddings (
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

-- Full-text search index
CREATE INDEX idx_code_embeddings_fts ON code_embeddings
USING GIN(to_tsvector('english', content));

-- Path and chunk index
CREATE INDEX idx_code_embeddings_path_chunk ON code_embeddings(file_path, chunk_index);

-- Content hash for deduplication
CREATE INDEX idx_code_embeddings_hash ON code_embeddings(content_hash);
```

---

## File Structure

```
/home/azureuser/
├── FleetOps/
│   └── claude-mcp-server.cjs (DELETED but process still running)
├── qa-framework/
│   ├── src/
│   │   ├── rag/
│   │   │   ├── enhanced-indexer.ts        # RAG indexing logic
│   │   │   ├── fleet-knowledge-base.ts    # Industry knowledge
│   │   │   └── indexer.ts                 # Basic indexer
│   │   └── mcp/
│   │       ├── fleet-telemetry-mcp.ts     # Telemetry validation
│   │       ├── asset-lifecycle/           # Asset lifecycle MCP
│   │       ├── compliance/                # Compliance MCP
│   │       ├── fleet-telemetry/           # Telemetry MCP modules
│   │       └── maintenance-schedule/      # Maintenance MCP
│   └── Dockerfile.mcp                     # Docker config for MCP
└── [unknown]/
    └── dist/rag-api/
        └── server.js                       # Compiled RAG API server
```

---

## Running Processes

```bash
# Claude MCP Server (PID: 1120679)
node claude-mcp-server.cjs
# Port: 9000
# Log: /tmp/claude-mcp.log

# RAG API Server (PID: 807168)
node dist/rag-api/server.js
# Port: Unknown
# User: root

# FleetOps Application (PID: 1061116)
concurrently npm run dev:api npm run dev:web
# API: tsx watch api/src/index.ts
# Web: vite dev server
```

---

## API Usage Examples

### Claude MCP Server

```bash
# Health check
curl http://172.173.175.71:9000/health

# Analyze code
curl -X POST http://172.173.175.71:9000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function example() { return true }",
    "language": "typescript"
  }'

# Remediate code
curl -X POST http://172.173.175.71:9000/remediate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function buggy() { return undefined }",
    "issues": ["Add type annotations", "Handle null case"]
  }'
```

### Fleet Telemetry MCP

```bash
# Health check
curl http://172.173.175.71:3100/health

# Validate telemetry
curl -X POST http://172.173.175.71:3100/validate \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEH-001",
    "dataType": "engine_rpm",
    "value": 2500
  }'

# Get J1939 standards
curl http://172.173.175.71:3100/standards/J1939

# Get OBD2 standards
curl http://172.173.175.71:3100/standards/OBD2
```

---

## Deployment Steps for Recreation

### 1. Setup PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE fleet_qa;
CREATE USER qauser WITH ENCRYPTED PASSWORD 'qapass_secure_2026';
GRANT ALL PRIVILEGES ON DATABASE fleet_qa TO qauser;
\c fleet_qa
GRANT ALL ON SCHEMA public TO qauser;
EOF

# Create schema
psql -U qauser -d fleet_qa -c "
CREATE TABLE code_embeddings (
  id SERIAL PRIMARY KEY,
  file_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  symbols JSONB,
  chroma_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_code_embeddings_fts ON code_embeddings
  USING GIN(to_tsvector('english', content));
CREATE INDEX idx_code_embeddings_path_chunk ON code_embeddings(file_path, chunk_index);
"
```

### 2. Deploy RAG Components

```bash
# Create qa-framework directory
mkdir -p /home/azureuser/qa-framework/src/{rag,mcp}

# Copy files from repo
cp api/src/services/rag/*.ts /home/azureuser/qa-framework/src/rag/
cp api/src/services/mcp/*.ts /home/azureuser/qa-framework/src/mcp/

# Install dependencies
cd /home/azureuser/qa-framework
npm install pg express @types/express @types/pg @types/node tsx typescript
```

### 3. Deploy Claude MCP Server

```bash
# Create server file
cat > /home/azureuser/FleetOps/claude-mcp-server.cjs <<'EOF'
[Content of claude-mcp-server.cjs - needs to be retrieved from VM or recreated]
EOF

# Start server
cd /home/azureuser/FleetOps
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
CLAUDE_MCP_PORT=9000 \
nohup node claude-mcp-server.cjs > /tmp/claude-mcp.log 2>&1 &
```

### 4. Deploy Fleet Telemetry MCP

```bash
# Compile TypeScript
cd /home/azureuser/qa-framework
npx tsx src/mcp/fleet-telemetry-mcp.ts
```

### 5. Index Fleet Knowledge

```bash
cd /home/azureuser/qa-framework
npx tsx <<'EOF'
import { EnhancedRAGIndexer } from './src/rag/enhanced-indexer.js'

async function main() {
  const indexer = new EnhancedRAGIndexer()
  await indexer.indexFleetKnowledge()
  await indexer.close()
  console.log('Fleet knowledge indexed successfully!')
}

main()
EOF
```

---

## Monitoring & Maintenance

### Check Server Status

```bash
# Check all processes
ps aux | grep -E "(node|python)" | grep -E "(mcp|rag)" | grep -v grep

# Check Claude MCP
curl -s http://localhost:9000/health

# Check Fleet Telemetry MCP
curl -s http://localhost:3100/health

# Check logs
tail -f /tmp/claude-mcp.log
```

### Database Status

```bash
# Check embeddings count
psql -U qauser -d fleet_qa -c "SELECT COUNT(*) FROM code_embeddings;"

# Check fleet knowledge
psql -U qauser -d fleet_qa -c "
  SELECT file_path, COUNT(*) as chunks
  FROM code_embeddings
  WHERE file_path LIKE 'fleet_knowledge%'
  GROUP BY file_path;
"
```

---

## Environment Variables

**Required**:
```bash
# Claude MCP
ANTHROPIC_API_KEY=***REMOVED***
CLAUDE_MCP_PORT=9000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=fleet_qa
POSTGRES_USER=qauser
POSTGRES_PASSWORD=qapass_secure_2026

# Database URL (alternative)
DATABASE_URL=postgresql://qauser:qapass_secure_2026@localhost:5433/fleet_qa
```

---

## Known Issues & Resolutions

### Issue 1: Claude MCP Server File Deleted
**Problem**: Original `claude-mcp-server.cjs` file was deleted but process still running
**Impact**: Cannot restart server without file
**Resolution**: Need to recreate `claude-mcp-server.cjs` from backup or original source

### Issue 2: RAG API Server Location Unknown
**Problem**: Running from `dist/rag-api/server.js` but exact parent directory unknown
**Impact**: Cannot modify or restart easily
**Resolution**: Search for file: `find /home/azureuser -name "server.js" -path "*rag-api*"`

### Issue 3: Root User Running RAG Server
**Problem**: RAG API server running as root (security concern)
**Impact**: Potential security risk
**Resolution**: Restart as azureuser with proper permissions

---

## Security Considerations

1. **Secrets Management**: API keys in environment variables (not secure)
   - **Recommendation**: Use Azure Key Vault

2. **Database Credentials**: Hardcoded in TypeScript files
   - **Recommendation**: Use environment variables exclusively

3. **Root Access**: RAG server running as root
   - **Recommendation**: Run as unprivileged user

4. **No HTTPS**: Servers running on HTTP
   - **Recommendation**: Add nginx reverse proxy with SSL

5. **No Authentication**: MCP endpoints publicly accessible
   - **Recommendation**: Add API key or JWT authentication

---

## Next Steps

1. Locate and backup `claude-mcp-server.cjs` source code
2. Find exact location of RAG API server files
3. Document complete startup sequence
4. Create systemd service files for auto-restart
5. Implement proper secrets management
6. Add authentication to MCP endpoints
7. Set up monitoring and alerting
8. Create backup and restore procedures

---

## Contact & Support

**Deployment Date**: 2026-01-04
**VM**: fleet-build-test-vm (172.173.175.71)
**Resource Group**: FLEET-AI-AGENTS
**Region**: East US

**Access**:
```bash
ssh azureuser@172.173.175.71
```

---

**END OF DOCUMENTATION**
