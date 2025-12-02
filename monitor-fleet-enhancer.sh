#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     Fleet Enhancement System - Live Monitor                       ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔄 Monitoring Azure VM: fleet-agent-orchestrator"
echo "📊 Updates every 15 seconds"
echo ""

ITERATION=1

while true; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Update #$ITERATION - $(date '+%H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    az vm run-command invoke \
      --resource-group FLEET-AI-AGENTS \
      --name fleet-agent-orchestrator \
      --command-id RunShellScript \
      --scripts "
        echo '🔍 FLEET ENHANCER STATUS'
        echo ''

        if [ -f /home/azureuser/fleet-enhancer.pid ]; then
            PID=\$(cat /home/azureuser/fleet-enhancer.pid)
            if ps -p \$PID > /dev/null 2>&1; then
                echo '✅ Status: RUNNING'
                echo '🔢 PID: '\$PID
                UPTIME=\$(ps -p \$PID -o etime= | tr -d ' ')
                echo '⏱️  Uptime: '\$UPTIME
            else
                echo '❌ Status: STOPPED'
            fi
        else
            echo '⏳ Status: DEPLOYING or NOT STARTED'
        fi

        echo ''
        echo '📋 LATEST ACTIVITY (Last 15 lines):'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        tail -15 /home/azureuser/fleet-enhancer.log 2>/dev/null || echo 'No log yet - deployment in progress...'

        echo ''
        echo '📂 Fleet Repository Status:'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        if [ -d /home/azureuser/Fleet ]; then
            cd /home/azureuser/Fleet
            echo '✅ Repository cloned'
            echo 'Branch: '\$(git branch --show-current)
            echo 'Latest commit: '\$(git log -1 --oneline)
            echo 'Changes pending: '\$(git status --short | wc -l)' files'
        else
            echo '⏳ Repository not yet cloned'
        fi
      " --output json 2>&1 | \
      jq -r '.value[0].message' | \
      sed 's/\\n/\n/g' | \
      grep -A 100 "stdout" || echo "Querying..."

    echo ""
    ITERATION=$((ITERATION + 1))
    sleep 15
done
