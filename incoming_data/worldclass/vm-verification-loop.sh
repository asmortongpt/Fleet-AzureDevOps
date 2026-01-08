#!/bin/bash
################################################################################
# COMPREHENSIVE VERIFICATION LOOP - ALL SERVICES, ENDPOINTS, CONNECTIONS
################################################################################

echo "🔍 COMPREHENSIVE VERIFICATION LOOP - STARTING NOW"
echo "════════════════════════════════════════════════════════════════════════════"

WORKSPACE="/home/azureuser/fleet-vm-qa/Fleet"
VERIFICATION_REPORT="/tmp/verification-report-$(date +%s).json"

cd "$WORKSPACE" || exit 1

# Initialize report
echo "{\"timestamp\":\"$(date -Iseconds)\",\"verifications\":[]}" > "$VERIFICATION_REPORT"

verify() {
    local name=$1
    local command=$2
    local expected=$3

    echo "  Verifying: $name..."
    result=$(eval "$command" 2>&1)
    status=$?

    if [ $status -eq 0 ] && echo "$result" | grep -q "$expected"; then
        echo "    ✅ PASS"
        jq ".verifications += [{\"name\":\"$name\",\"status\":\"PASS\",\"result\":\"$result\"}]" "$VERIFICATION_REPORT" > /tmp/vr.tmp && mv /tmp/vr.tmp "$VERIFICATION_REPORT"
        return 0
    else
        echo "    ❌ FAIL"
        jq ".verifications += [{\"name\":\"$name\",\"status\":\"FAIL\",\"result\":\"$result\"}]" "$VERIFICATION_REPORT" > /tmp/vr.tmp && mv /tmp/vr.tmp "$VERIFICATION_REPORT"
        return 1
    fi
}

echo ""
echo "📡 ENDPOINTS VERIFICATION"
echo "──────────────────────────────────────────────────────────────────────────"
verify "API Health Endpoint" "curl -s http://localhost:3001/health" "ok"
verify "Frontend Dev Server" "curl -s http://localhost:5174" "<!DOCTYPE html"
verify "Chatbot Service" "curl -s http://localhost:3002/health" "ok"

echo ""
echo "🗄️  DATABASE CONNECTIONS"
echo "──────────────────────────────────────────────────────────────────────────"
verify "PostgreSQL Connection" "PGPASSWORD=fleet_password psql -h localhost -U fleet_user -d fleet_db -c 'SELECT 1'" "1"
verify "Redis Connection" "redis-cli ping" "PONG"

echo ""
echo "🤖 AI SERVICE CONNECTIONS"
echo "──────────────────────────────────────────────────────────────────────────"
verify "Anthropic API" "curl -s -H 'x-api-key: $ANTHROPIC_API_KEY' -H 'anthropic-version: 2023-06-01' https://api.anthropic.com/v1/messages -X POST -d '{\"model\":\"claude-sonnet-4-20250514\",\"max_tokens\":10,\"messages\":[{\"role\":\"user\",\"content\":\"test\"}]}'" "content"
verify "OpenAI API" "curl -s -H 'Authorization: Bearer $OPENAI_API_KEY' https://api.openai.com/v1/models" "gpt-4"
verify "Grok API" "curl -s -H 'Authorization: Bearer $GROK_API_KEY' https://api.x.ai/v1/models" "grok"
verify "Google Gemini API" "curl -s https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=$GEMINI_API_KEY -X POST -d '{\"contents\":[{\"parts\":[{\"text\":\"test\"}]}]}'" "candidates"

echo ""
echo "🔧 DOCKER SERVICES"
echo "──────────────────────────────────────────────────────────────────────────"
verify "Docker Daemon" "docker info" "Server Version"
verify "Docker Compose" "docker-compose --version" "docker-compose"
verify "Fleet Containers" "docker ps" "fleet"

echo ""
echo "📦 NODE SERVICES"
echo "──────────────────────────────────────────────────────────────────────────"
verify "Node Version" "node --version" "v"
verify "NPM Version" "npm --version" "[0-9]"
verify "Package Dependencies" "npm list --depth=0" "Fleet"

echo ""
echo "🌐 EXTERNAL SERVICES"
echo "──────────────────────────────────────────────────────────────────────────"
verify "Google Maps API" "curl -s 'https://maps.googleapis.com/maps/api/geocode/json?address=test&key=$GOOGLE_MAPS_API_KEY'" "results"
verify "GitHub API" "curl -s https://api.github.com/repos/asmortongpt/Fleet" "full_name"

echo ""
echo "📊 VERIFICATION SUMMARY"
echo "══════════════════════════════════════════════════════════════════════════"

total=$(jq '.verifications | length' "$VERIFICATION_REPORT")
passed=$(jq '[.verifications[] | select(.status=="PASS")] | length' "$VERIFICATION_REPORT")
failed=$(jq '[.verifications[] | select(.status=="FAIL")] | length' "$VERIFICATION_REPORT")
pass_rate=$((passed * 100 / total))

echo "Total Checks:  $total"
echo "Passed:        $passed"
echo "Failed:        $failed"
echo "Pass Rate:     $pass_rate%"
echo ""

if [ $pass_rate -eq 100 ]; then
    echo "✅ 100% VERIFICATION PASS - ALL SYSTEMS OPERATIONAL"
    exit 0
else
    echo "⚠️  VERIFICATION INCOMPLETE - $failed checks failed"
    echo "Report: $VERIFICATION_REPORT"
    exit 1
fi
