#!/usr/bin/env python3
"""
Quick test to verify orchestrator setup is correct.
"""

import os
import sys
from pathlib import Path

# Add agent_orch to path
sys.path.insert(0, str(Path(__file__).parent / "agent_orch"))

print("=" * 60)
print("Testing Multi-Agent Orchestrator Setup")
print("=" * 60)
print()

# Test 1: Check environment variables
print("Test 1: Environment Variables")
required_vars = ["OPENAI_API_KEY", "GEMINI_API_KEY"]
missing = []

for var in required_vars:
    value = os.getenv(var)
    if value:
        print(f"  ✓ {var}: {'*' * 20} (set)")
    else:
        print(f"  ✗ {var}: NOT SET")
        missing.append(var)

if missing:
    print(f"\nError: Missing environment variables: {', '.join(missing)}")
    print("Load them with: export $(grep -v '^#' ~/.env | xargs)")
    sys.exit(1)

print()

# Test 2: Import agents
print("Test 2: Import Agents")
try:
    from agents.codex_agent import CodexAgent
    print("  ✓ CodexAgent imported")
except Exception as e:
    print(f"  ✗ CodexAgent failed: {e}")
    sys.exit(1)

try:
    from agents.jules_agent import JulesAgent
    print("  ✓ JulesAgent imported")
except Exception as e:
    print(f"  ✗ JulesAgent failed: {e}")
    sys.exit(1)

try:
    from agents.devops_agent import DevOpsAgent
    print("  ✓ DevOpsAgent imported")
except Exception as e:
    print(f"  ✗ DevOpsAgent failed: {e}")
    sys.exit(1)

try:
    from agents.verifier_agent import VerifierAgent
    print("  ✓ VerifierAgent imported")
except Exception as e:
    print(f"  ✗ VerifierAgent failed: {e}")
    sys.exit(1)

print()

# Test 3: Initialize agents
print("Test 3: Initialize Agents")
try:
    codex = CodexAgent(os.getenv("OPENAI_API_KEY"))
    print("  ✓ CodexAgent initialized")
except Exception as e:
    print(f"  ✗ CodexAgent init failed: {e}")
    sys.exit(1)

try:
    jules = JulesAgent(os.getenv("GEMINI_API_KEY"))
    print("  ✓ JulesAgent initialized")
except Exception as e:
    print(f"  ✗ JulesAgent init failed: {e}")
    sys.exit(1)

try:
    devops = DevOpsAgent(str(Path.cwd()))
    print("  ✓ DevOpsAgent initialized")
except Exception as e:
    print(f"  ✗ DevOpsAgent init failed: {e}")
    sys.exit(1)

try:
    verifier = VerifierAgent()
    print("  ✓ VerifierAgent initialized")
except Exception as e:
    print(f"  ✗ VerifierAgent init failed: {e}")
    sys.exit(1)

print()

# Test 4: Check config
print("Test 4: Configuration")
config_path = Path.cwd() / "agent_orch" / "config.yaml"
if config_path.exists():
    print(f"  ✓ config.yaml found at {config_path}")
else:
    print(f"  ✗ config.yaml NOT FOUND at {config_path}")
    sys.exit(1)

print()
print("=" * 60)
print("ALL TESTS PASSED ✓")
print("=" * 60)
print()
print("Ready to run orchestrator:")
print("  source agent_orch/venv/bin/activate")
print("  python agent_orch/orchestrator.py --environment staging")
