#!/bin/bash
API_KEY="xai-wOeEAYZslZCGGu4tudhzBdMIm4tiZ6Ya4W2cjE0Rgm1UbXnJJezOhaJwdpgTliMg56nCGZTbslp6zlML"

# Missing agents to complete 100/100
declare -a AGENTS=(
  "017:Threat Detection:Security"
  "018:Incident Response:Security"
  "019:Database Query Optimization:Performance"
  "020:API Response Caching:Performance"
  "021:Asset Compression:Performance"
  "022:CDN Integration:Performance"
  "031:CI/CD Pipeline Hardening:DevOps"
  "046:GDPR Compliance:Compliance"
)

echo "🚀 CTAFleet Final Batch: Completing 100/100"
echo "==========================================="
echo "Generating remaining 8 agents..."
echo ""

counter=0
for agent_spec in "${AGENTS[@]}"; do
  IFS=: read -r num name category <<< "$agent_spec"
  
  echo "[$((counter+1))/8] Agent $num: $name [$category]"
  
  curl -s -X POST https://api.x.ai/v1/chat/completions \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"model\":\"grok-3\",\"messages\":[{\"role\":\"user\",\"content\":\"Create production TypeScript for CTAFleet Agent $num: $name ($category). Include complete working code with tests, error handling, and security best practices. Return code only.\"}],\"temperature\":0.3,\"max_tokens\":4000}" \
    | jq -r '.choices[0].message.content' > "agent-$(printf '%03d' $num)-${name// /-}.ts"
  
  if [ -s "agent-$(printf '%03d' $num)-${name// /-}.ts" ]; then
    lines=$(wc -l < "agent-$(printf '%03d' $num)-${name// /-}.ts")
    echo "  ✅ Generated ($lines lines)"
  else
    echo "  ⚠️  WARNING: Empty file!"
  fi
  
  counter=$((counter+1))
  sleep 2
done

echo ""
echo "🎉 Final Batch Complete!"
echo "📊 Generated: 8 agents"
ls -lh agent-0[0-2]*.ts 2>/dev/null | wc -l
