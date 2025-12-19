#!/bin/bash

echo "🔄 Starting continuous monitoring of ARCHITECT-PRIME..."
echo "📊 Updates every 30 seconds. Press Ctrl+C to stop."
echo ""

ITERATION=1

while true; do
    clear
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║     ARCHITECT-PRIME Live Monitor - Update #$ITERATION             ║"
    echo "║     $(date '+%Y-%m-%d %H:%M:%S')                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Query VM status
    az vm run-command invoke \
      --resource-group FLEET-AI-AGENTS \
      --name fleet-agent-orchestrator \
      --command-id RunShellScript \
      --scripts "
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '📊 SYSTEM STATUS'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        cd /home/azureuser/agent-workspace
        if [ -f architect-prime.pid ]; then
            PID=\$(cat architect-prime.pid)
            if ps -p \$PID > /dev/null 2>&1; then
                echo '✅ Status: RUNNING'
                echo '🔢 PID: '\$PID
                echo '⏱️  Uptime: '\$(ps -p \$PID -o etime= | tr -d ' ')
                echo '💾 Memory: '\$(ps -p \$PID -o rss= | awk '{printf \"%.2f MB\", \$1/1024}')
            else
                echo '❌ Status: STOPPED (process not found)'
            fi
        else
            echo '⚠️  Status: NOT STARTED'
        fi
        
        echo ''
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '📋 LATEST ACTIVITY (Last 30 lines)'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        tail -30 architect-prime.log 2>/dev/null || echo 'No log file yet'
        
        echo ''
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        echo '📁 WORKSPACE FILES'
        echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        ls -lh | grep -E '(architect|rag|tracking|enhanced)'
      " 2>&1 | grep -A 100 "stdout" | sed 's/\\n/\n/g'
    
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "⏳ Next update in 30 seconds... (Update #$ITERATION coming)"
    sleep 30
done
