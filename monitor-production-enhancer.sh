#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║     Fleet Production Enhancement System - Live Monitor           ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔄 Monitoring Azure VM: fleet-agent-orchestrator"
echo "📊 Updates every 20 seconds"
echo ""

ITERATION=1

while true; do
    clear
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Production Update #$ITERATION - $(date '+%H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    az vm run-command invoke \
      --resource-group FLEET-AI-AGENTS \
      --name fleet-agent-orchestrator \
      --command-id RunShellScript \
      --scripts "
        echo '🔍 PRODUCTION FLEET ENHANCER STATUS'
        echo ''
        
        if [ -f /home/azureuser/fleet-enhancer.pid ]; then
            PID=\$(cat /home/azureuser/fleet-enhancer.pid)
            if ps -p \$PID > /dev/null 2>&1; then
                echo '✅ Status: RUNNING'
                echo '🔢 PID: '\$PID
                UPTIME=\$(ps -p \$PID -o etime= | tr -d ' ')
                echo '⏱️  Uptime: '\$UPTIME
                CPU=\$(ps -p \$PID -o %cpu= | tr -d ' ')
                MEM=\$(ps -p \$PID -o %mem= | tr -d ' ')
                echo '💻 CPU: '\$CPU'%'
                echo '🧠 Memory: '\$MEM'%'
            else
                echo '❌ Status: STOPPED (PID '\$PID' not running)'
            fi
        else
            echo '⏳ Status: NOT STARTED'
        fi
        
        echo ''
        echo '📋 LATEST ACTIVITY (Last 30 lines):'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        tail -30 /home/azureuser/fleet-enhancer.log 2>/dev/null || echo 'No log yet...'
        
        echo ''
        echo '📂 Fleet Repository Status:'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        if [ -d /home/azureuser/Fleet ]; then
            cd /home/azureuser/Fleet
            echo '✅ Repository: /home/azureuser/Fleet'
            echo 'Branch: '\$(git branch --show-current)
            echo 'Latest commit: '\$(git log -1 --oneline)
            
            # Show git status
            if [ -n \"\$(git status --short)\" ]; then
                echo ''
                echo 'Changes made by orchestrator:'
                git status --short | head -10
            else
                echo 'No changes yet'
            fi
        else
            echo '❌ Repository not found'
        fi
      " --output json 2>&1 | \
      jq -r '.value[0].message' | \
      sed 's/\\n/\n/g' | \
      grep -A 200 "stdout" || echo "Querying..."
    
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    ITERATION=$((ITERATION + 1))
    sleep 20
done
