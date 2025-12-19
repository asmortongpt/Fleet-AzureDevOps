#!/bin/bash
API_KEY="xai-wOeEAYZslZCGGu4tudhzBdMIm4tiZ6Ya4W2cjE0Rgm1UbXnJJezOhaJwdpgTliMg56nCGZTbslp6zlML"

declare -A AGENTS=(
  [17]="Threat Detection:Security"
  [18]="Incident Response:Security"
  [19]="Database Query Optimization:Performance"
  [20]="API Response Caching:Performance"
  [21]="Asset Compression:Performance"
  [22]="CDN Integration:Performance"
  [23]="Lazy Loading:Performance"
  [24]="Code Splitting:Performance"
  [25]="Memory Management:Performance"
  [26]="Connection Pooling:Performance"
  [27]="Background Jobs:Performance"
  [28]="Rate Limiting Enhancement:Performance"
  [29]="Load Balancing:Performance"
  [30]="Performance Monitoring:Performance"
  [31]="CI/CD Pipeline Hardening:DevOps"
  [32]="Infrastructure as Code:DevOps"
  [33]="Container Orchestration:DevOps"
  [34]="Blue-Green Deployment:DevOps"
  [35]="Automated Rollback:DevOps"
  [36]="Health Checks:DevOps"
  [37]="Service Mesh:DevOps"
  [38]="Observability Stack:DevOps"
  [39]="Log Aggregation:DevOps"
  [40]="Distributed Tracing:DevOps"
  [41]="Metrics Collection:DevOps"
  [42]="Alerting Rules:DevOps"
  [43]="SRE Practices:DevOps"
  [44]="Disaster Recovery:DevOps"
  [45]="Backup Automation:DevOps"
  [46]="GDPR Compliance:Compliance"
  [47]="HIPAA Compliance:Compliance"
  [48]="SOC2 Controls:Compliance"
  [49]="PCI-DSS Requirements:Compliance"
  [50]="Data Retention Policies:Compliance"
  [51]="Consent Management:Compliance"
  [52]="Privacy By Design:Compliance"
  [53]="Compliance Reporting:Compliance"
  [54]="Audit Trail:Compliance"
  [55]="Access Controls:Compliance"
  [56]="Data Classification:Compliance"
  [57]="Vendor Risk Management:Compliance"
  [58]="E2E Test Coverage:Testing"
  [59]="Integration Tests:Testing"
  [60]="Unit Test Enhancement:Testing"
  [61]="Performance Testing:Testing"
  [62]="Security Testing:Testing"
  [63]="Accessibility Testing:Testing"
  [64]="Load Testing:Testing"
  [65]="Chaos Engineering:Testing"
  [66]="Contract Testing:Testing"
  [67]="Visual Regression:Testing"
  [68]="Test Automation:Testing"
)

for num in {17..68}; do
  info="${AGENTS[$num]}"
  name=$(echo "$info" | cut -d':' -f1)
  category=$(echo "$info" | cut -d':' -f2)
  
  echo "🚀 Agent $num: $name [$category]"
  
  curl -s -X POST https://api.x.ai/v1/chat/completions \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"model\":\"grok-3\",\"messages\":[{\"role\":\"user\",\"content\":\"Create production TypeScript for CTAFleet Agent $num: $name ($category). Include complete working code with tests. Return code only.\"}],\"temperature\":0.3,\"max_tokens\":4000}" \
    | jq -r '.choices[0].message.content' > "agent-$(printf '%03d' $num)-${name// /-}.ts"
  
  echo "  ✅ Generated agent-$(printf '%03d' $num).ts"
  sleep 1
done

echo "🎉 All 52 agents generated!"
ls -lh *.ts | wc -l
