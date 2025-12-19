#!/bin/bash
API_KEY="xai-wOeEAYZslZCGGu4tudhzBdMIm4tiZ6Ya4W2cjE0Rgm1UbXnJJezOhaJwdpgTliMg56nCGZTbslp6zlML"

# Agent 041-068 specifications
declare -a AGENTS=(
  "041:Metrics Collection:DevOps"
  "042:Alerting Rules:DevOps"
  "043:SRE Practices:DevOps"
  "044:Disaster Recovery:DevOps"
  "045:Backup Automation:DevOps"
  "046:GDPR Compliance:Compliance"
  "047:HIPAA Compliance:Compliance"
  "048:SOC2 Controls:Compliance"
  "049:PCI-DSS Requirements:Compliance"
  "050:Data Retention Policies:Compliance"
  "051:Consent Management:Compliance"
  "052:Privacy By Design:Compliance"
  "053:Compliance Reporting:Compliance"
  "054:Audit Trail:Compliance"
  "055:Access Controls:Compliance"
  "056:Data Classification:Compliance"
  "057:Vendor Risk Management:Compliance"
  "058:E2E Test Coverage:Testing"
  "059:Integration Tests:Testing"
  "060:Unit Test Enhancement:Testing"
  "061:Performance Testing:Testing"
  "062:Security Testing:Testing"
  "063:Accessibility Testing:Testing"
  "064:Load Testing:Testing"
  "065:Chaos Engineering:Testing"
  "066:Contract Testing:Testing"
  "067:Visual Regression:Testing"
  "068:Test Automation:Testing"
)

echo "🚀 CTAFleet Batch 2: Generating Agents 041-068"
echo "=============================================="
echo "Total: ${#AGENTS[@]} implementations"
echo ""

counter=0
for agent_spec in "${AGENTS[@]}"; do
  IFS=: read -r num name category <<< "$agent_spec"
  
  echo "[$((counter+1))/${#AGENTS[@]}] Agent $num: $name [$category]"
  
  curl -s -X POST https://api.x.ai/v1/chat/completions \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"model\":\"grok-3\",\"messages\":[{\"role\":\"user\",\"content\":\"Create production TypeScript for CTAFleet Agent $num: $name ($category). Include complete working code with tests, error handling, security best practices. Return code only.\"}],\"temperature\":0.3,\"max_tokens\":4000}" \
    | jq -r '.choices[0].message.content' > "agent-${num}.ts"
  
  if [ -s "agent-${num}.ts" ]; then
    lines=$(wc -l < "agent-${num}.ts")
    echo "  ✅ Generated ($lines lines)"
  else
    echo "  ⚠️  WARNING: Empty file!"
  fi
  
  counter=$((counter+1))
  sleep 2
done

echo ""
echo "🎉 Batch 2 Complete!"
echo "📊 Generated: ${#AGENTS[@]} agents"
ls -lh agent-0[4-6]*.ts 2>/dev/null | wc -l
