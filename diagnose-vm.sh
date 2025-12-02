#!/bin/bash

az vm run-command invoke \
  --resource-group FLEET-AI-AGENTS \
  --name fleet-agent-orchestrator \
  --command-id RunShellScript \
  --scripts "
    cd /home/azureuser/agent-workspace

    echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    echo '📁 WORKSPACE CONTENTS'
    echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    ls -lah

    echo ''
    echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    echo '📦 PYTHON PACKAGES'
    echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    pip list | grep -iE '(openai|anthropic|google|chromadb)'
  " --output table
