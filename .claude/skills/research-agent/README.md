# Research Agent

AI-powered research agent that actively searches the web and analyzes content to provide current best practices, security information, and technology recommendations.

## Features

✅ **Live Web Search** - Actually calls WebSearch API for current information
✅ **Web Content Fetching** - Fetches and analyzes specific URLs
✅ **Tech Stack Research** - Recommends technologies based on requirements
✅ **Security Analysis** - Checks for vulnerabilities in packages
✅ **JSON Output** - Structured results for automation

## Installation

```bash
# Install dependencies
pip install anthropic --break-system-packages

# Set API key
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Usage

### Web Search

```bash
# Search for current best practices
python scripts/research_live.py \
  --query "best practices for JWT authentication 2026"

# Search for technology comparison
python scripts/research_live.py \
  --query "PostgreSQL vs MongoDB for e-commerce 2026"
```

### Fetch and Analyze URL

```bash
# Fetch specific documentation
python scripts/research_live.py \
  --url "https://jwt.io/introduction" \
  --question "How do JWT tokens work and what are best practices?"

# Analyze API documentation
python scripts/research_live.py \
  --url "https://stripe.com/docs/api" \
  --question "What is the recommended way to handle webhooks?"
```

### Tech Stack Research

```bash
# Research tech stack for application type
python scripts/research_live.py \
  --tech-stack "e-commerce" \
  --requirements "auth,payments,inventory,multi-location"

# Get recommendations for SaaS
python scripts/research_live.py \
  --tech-stack "saas" \
  --requirements "subscriptions,webhooks,api,multi-tenant"
```

### Security Analysis

```bash
# Check package for vulnerabilities
python scripts/research_live.py \
  --check-security "express@4.18.0"

# Check with output file
python scripts/research_live.py \
  --check-security "jsonwebtoken@9.0.0" \
  --output security-report.json
```

## Output Format

### Web Search Results
```json
{
  "query": "best practices for JWT authentication 2026",
  "timestamp": "2026-02-10T10:30:00",
  "content": [
    "Summary of findings...",
    "Key recommendations..."
  ],
  "sources": [
    "https://example.com/article1",
    "https://example.com/article2"
  ]
}
```

### Tech Stack Recommendations
```json
{
  "app_type": "e-commerce",
  "requirements": ["auth", "payments", "inventory"],
  "timestamp": "2026-02-10T10:30:00",
  "recommendations": {
    "frontend": {
      "technology": "React 19 + TypeScript",
      "rationale": "Industry standard with strong ecosystem..."
    },
    "backend": {
      "technology": "Node.js + Express + Prisma",
      "rationale": "Type-safe, mature, excellent PostgreSQL support..."
    },
    "database": {
      "technology": "PostgreSQL 16",
      "rationale": "ACID compliance, complex queries, proven at scale..."
    },
    "infrastructure": {
      "technology": "Docker + Kubernetes",
      "rationale": "Container orchestration, auto-scaling..."
    },
    "confidence_score": 0.95,
    "sources": ["url1", "url2"]
  }
}
```

### Security Analysis
```json
{
  "package": "express",
  "version": "4.18.0",
  "timestamp": "2026-02-10T10:30:00",
  "findings": [
    "No critical vulnerabilities found in express@4.18.0",
    "Consider upgrading to 4.19.x for latest security patches"
  ],
  "sources": [
    "https://cve.mitre.org/...",
    "https://snyk.io/vuln/..."
  ]
}
```

## Comparison: Original vs Live Agent

### Original Agent (`research_tech_stack.py`)
- **Data Source**: Hardcoded decision logic
- **Currency**: Static knowledge
- **Accuracy**: Based on training data
- **Use Case**: Quick offline recommendations

### Live Agent (`research_live.py`)
- **Data Source**: Real-time web search and fetch
- **Currency**: Current best practices (2026)
- **Accuracy**: Based on live sources
- **Use Case**: Production research with sources

## API Requirements

This tool requires:
- **Claude API key** (ANTHROPIC_API_KEY environment variable)
- **Network access** for WebSearch and WebFetch
- **anthropic Python package** (pip install anthropic)

## Use Cases

### 1. Technology Evaluation
```bash
# Before choosing a database
python scripts/research_live.py \
  --query "PostgreSQL vs MongoDB performance benchmarks 2026"
```

### 2. Security Audits
```bash
# Check all dependencies
for package in $(cat package.json | jq -r '.dependencies | keys[]'); do
  python scripts/research_live.py \
    --check-security "$package@$(cat package.json | jq -r .dependencies[\"$package\"])"
done
```

### 3. Best Practices Research
```bash
# Get current recommendations
python scripts/research_live.py \
  --url "https://owasp.org/www-project-api-security/" \
  --question "What are the top API security risks and mitigations?"
```

### 4. Architecture Decisions
```bash
# Research before ADR
python scripts/research_live.py \
  --query "microservices vs monolith for 10000 user SaaS 2026"
```

## Integration with SDLC Skills

### With Requirements Analysis
```bash
# Research before creating requirements
python scripts/research_live.py \
  --tech-stack "$(cat requirements.txt | grep app_type)" \
  --requirements "$(cat requirements.txt | grep features)"
```

### With Backend Development
```bash
# Validate technology choices
python scripts/research_live.py \
  --query "Express.js best practices 2026"
```

### With Infrastructure
```bash
# Research deployment options
python scripts/research_live.py \
  --query "Kubernetes vs Docker Swarm comparison 2026"
```

## Error Handling

The agent handles:
- **Network failures**: Retries with exponential backoff
- **API rate limits**: Respects rate limits
- **Invalid URLs**: Returns error message
- **Parsing errors**: Falls back to raw response

## Limitations

- **Rate limits**: Subject to Claude API rate limits
- **Search quality**: Dependent on web search results
- **Timeliness**: Results reflect current web content
- **Cost**: API calls incur costs

## Best Practices

1. **Cache results** - Save research to avoid duplicate searches
2. **Validate sources** - Always check source URLs
3. **Combine with offline** - Use offline agent for quick checks
4. **Set API limits** - Monitor API usage and costs
5. **Review findings** - Human review for critical decisions

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### "anthropic package not found"
```bash
pip install anthropic --break-system-packages
```

### "Rate limit exceeded"
Wait 60 seconds or upgrade API plan

### "Network timeout"
Check internet connection and firewall settings

## Examples

See `examples/` directory for:
- `tech-stack-research.sh` - Full tech stack evaluation
- `security-audit.sh` - Complete security audit
- `api-research.sh` - API design research

## License

MIT
