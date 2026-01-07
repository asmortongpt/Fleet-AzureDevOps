# RAG/CAG/MCP Server Recreation Guide

## Summary

This guide contains complete information to recreate the RAG (Retrieval-Augmented Generation), CAG (Context-Augmented Generation), and MCP (Model Context Protocol) servers that were deployed on the Azure VM today.

## Quick Recreation

### Option 1: Automated Deployment (Recommended)

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY="***REMOVED***"

# Run deployment script
./deploy-rag-cag-mcp-server.sh
```

The script will:
1. Create deployment package with all necessary files
2. Transfer to Azure VM
3. Install dependencies
4. Setup PostgreSQL database
5. Index fleet industry knowledge
6. Start all MCP servers

### Option 2: Manual Deployment

See the detailed documentation in `RAG_CAG_MCP_SERVER_DOCUMENTATION.md`

## What Was Setup Today

### 1. Claude MCP Server
- **Port**: 9000
- **Purpose**: AI-powered code analysis and remediation using Claude
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /analyze` - Analyze code for issues
  - `POST /remediate` - Fix code issues

### 2. Fleet Telemetry MCP Server
- **Port**: 3100
- **Purpose**: Validate vehicle telemetry against industry standards
- **Standards Supported**:
  - SAE J1939 (Heavy-duty vehicles)
  - OBD-II (Light-duty vehicles)
  - FMS (European fleet standard)

### 3. RAG API Server
- **Purpose**: Code search and retrieval with semantic understanding
- **Database**: PostgreSQL with full-text search
- **Features**:
  - Code chunking and indexing
  - Symbol extraction (functions, classes, interfaces)
  - Fleet context detection
  - Industry knowledge integration

### 4. Fleet Knowledge Base
- **Purpose**: Industry-standard fleet management knowledge
- **Categories**:
  - Telematics Standards (J1939, OBD-II, FMS)
  - Maintenance Schedules (PM-A, PM-B, PM-C, DOT)
  - Fuel Efficiency Benchmarks
  - Safety Compliance (CSA, FMCSA)
  - Asset Lifecycle (TCO, depreciation)
  - Utilization Metrics

## Files Created

1. **RAG_CAG_MCP_SERVER_DOCUMENTATION.md**
   - Complete technical documentation
   - Database schemas
   - API endpoints
   - Configuration details
   - Troubleshooting guide

2. **deploy-rag-cag-mcp-server.sh**
   - Automated deployment script
   - Creates deployment package
   - Transfers to VM
   - Sets up everything automatically

3. **This file (RAG_CAG_MCP_RECREATION_GUIDE.md)**
   - Quick reference guide
   - Recreation instructions

## Current VM Status

**VM Details**:
- IP: 172.173.175.71
- Name: fleet-build-test-vm
- Resource Group: FLEET-AI-AGENTS
- User: azureuser

**Running Services** (as of 2026-01-04):
```
PID      Service                 Port    Status
-----------------------------------------------
1120679  Claude MCP Server       9000    ✅ Running
807168   RAG API Server          ?       ✅ Running (root)
3100     Fleet Telemetry MCP     3100    ⚠️ Ready (TS source)
```

**Database**:
```
PostgreSQL
  Host: localhost
  Port: 5433
  Database: fleet_qa
  User: qauser
  Password: qapass_secure_2026
```

## Key Information Captured

### Source Code Locations on VM

```
/home/azureuser/
├── qa-framework/src/
│   ├── rag/
│   │   ├── enhanced-indexer.ts       # RAG indexing with fleet context
│   │   ├── fleet-knowledge-base.ts   # Industry knowledge database
│   │   └── indexer.ts                # Basic indexer
│   └── mcp/
│       ├── fleet-telemetry-mcp.ts    # Telemetry validation server
│       ├── asset-lifecycle/
│       ├── compliance/
│       ├── fleet-telemetry/
│       └── maintenance-schedule/
```

### Environment Variables

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

# Telemetry MCP
TELEMETRY_MCP_PORT=3100
```

### Database Schema

```sql
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

-- Indexes
CREATE INDEX idx_code_embeddings_fts ON code_embeddings
  USING GIN(to_tsvector('english', content));
CREATE INDEX idx_code_embeddings_path_chunk ON code_embeddings(file_path, chunk_index);
CREATE INDEX idx_code_embeddings_hash ON code_embeddings(content_hash);
```

## Testing the Deployment

### 1. Check Server Health

```bash
# SSH to VM
ssh azureuser@172.173.175.71

# Check Claude MCP
curl http://localhost:9000/health

# Check Fleet Telemetry MCP
curl http://localhost:3100/health

# Check processes
ps aux | grep -E "(mcp|rag)" | grep -v grep
```

### 2. Test Claude MCP Server

```bash
# Analyze code
curl -X POST http://172.173.175.71:9000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function calculate(a, b) { return a + b }",
    "language": "typescript"
  }'
```

### 3. Test Fleet Telemetry MCP

```bash
# Validate engine RPM
curl -X POST http://172.173.175.71:3100/validate \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEH-001",
    "dataType": "engine_rpm",
    "value": 2500
  }'

# Get J1939 standards
curl http://172.173.175.71:3100/standards/J1939
```

### 4. Query Fleet Knowledge

```bash
ssh azureuser@172.173.175.71

# Check indexed knowledge
psql -U qauser -d fleet_qa -c "
  SELECT file_path, COUNT(*) as chunks
  FROM code_embeddings
  WHERE file_path LIKE 'fleet_knowledge%'
  GROUP BY file_path;
"
```

## Next Steps After Recreation

### Immediate
1. ✅ Verify all services are running
2. ✅ Test all API endpoints
3. ✅ Check database connectivity
4. ✅ Verify fleet knowledge is indexed

### Short Term
1. Create systemd service files for auto-restart
2. Add nginx reverse proxy with SSL
3. Implement API key authentication
4. Set up monitoring and alerting
5. Create backup procedures

### Long Term
1. Migrate secrets to Azure Key Vault
2. Add comprehensive logging
3. Implement rate limiting
4. Create CI/CD pipeline
5. Add automated testing

## Troubleshooting

### Services Not Starting

```bash
# Check logs
tail -f /tmp/claude-mcp.log
tail -f /tmp/telemetry-mcp.log

# Check if ports are in use
lsof -i :9000
lsof -i :3100

# Kill existing processes
pkill -f "claude-mcp-server"
pkill -f "fleet-telemetry-mcp"
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U qauser -d fleet_qa -h localhost -p 5433 -c "SELECT 1;"

# Check if database exists
sudo -u postgres psql -c "\l" | grep fleet_qa
```

### Missing API Key

```bash
# Set API key
export ANTHROPIC_API_KEY="your-key-here"

# Verify it's set
echo $ANTHROPIC_API_KEY

# Restart Claude MCP server
cd /home/azureuser/rag-mcp-server
npm run start:claude-mcp
```

## Important Notes

### Security Considerations

⚠️ **IMPORTANT**: The current setup has several security considerations:

1. **API Keys in Environment**: Move to Azure Key Vault
2. **No HTTPS**: Add SSL/TLS certificates
3. **No Authentication**: Add API key or JWT auth
4. **Root Access**: RAG server running as root (security risk)
5. **Public Ports**: Services exposed without firewall rules

### Known Issues

1. **Claude MCP Server File Deleted**
   - Original `claude-mcp-server.cjs` was deleted but process still running
   - Deployment script recreates this file
   - Backup of running process configuration captured

2. **RAG API Server Location Unknown**
   - Running from `dist/rag-api/server.js`
   - Exact parent directory not identified
   - Deployment script creates new instance

3. **No Process Manager**
   - Services started with nohup (not production-ready)
   - Recommendation: Use PM2 or systemd

## Support

**Documentation Files**:
- `RAG_CAG_MCP_SERVER_DOCUMENTATION.md` - Complete technical docs
- `deploy-rag-cag-mcp-server.sh` - Automated deployment
- This file - Quick reference guide

**VM Access**:
```bash
ssh azureuser@172.173.175.71
```

**Logs**:
```bash
tail -f /tmp/claude-mcp.log
tail -f /tmp/telemetry-mcp.log
```

**Process Management**:
```bash
# View running services
ps aux | grep -E "(mcp|rag)" | grep -v grep

# Stop services
kill $(cat /tmp/claude-mcp.pid)
kill $(cat /tmp/telemetry-mcp.pid)

# Start services
cd /home/azureuser/rag-mcp-server
npm run start:claude-mcp &
npm run start:telemetry &
```

---

**Last Updated**: 2026-01-04
**Status**: ✅ Complete - Ready for deployment
**Tested**: ⚠️ Deployment script not yet tested

---

## Quick Reference Commands

```bash
# Deploy everything
export ANTHROPIC_API_KEY="your-key"
./deploy-rag-cag-mcp-server.sh

# Check status
ssh azureuser@172.173.175.71 'curl -s http://localhost:9000/health && curl -s http://localhost:3100/health'

# View logs
ssh azureuser@172.173.175.71 'tail -100 /tmp/claude-mcp.log'

# Restart services
ssh azureuser@172.173.175.71 'cd rag-mcp-server && bash scripts/deploy.sh'
```

---

**END OF GUIDE**
