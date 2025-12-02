#!/bin/bash
# Quick setup script for Smart RAG Orchestrator

set -e

echo "========================================="
echo "Smart RAG Orchestrator Setup"
echo "========================================="
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo "   Please install Python 3.8 or higher"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✓ Python $PYTHON_VERSION found"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip not found!"
    echo "   Run: sudo apt install python3-pip"
    exit 1
fi

echo "✓ pip found"
echo

# Install dependencies
echo "Installing dependencies..."
echo "This may take 2-3 minutes..."
echo

pip3 install -r requirements.txt --quiet

if [ $? -eq 0 ]; then
    echo "✓ All dependencies installed!"
else
    echo "❌ Installation failed"
    echo "   Try: pip3 install -r requirements.txt"
    exit 1
fi

echo

# Check OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set"
    echo
    echo "To use the orchestrator, set your API key:"
    echo "  export OPENAI_API_KEY='sk-...'"
    echo
else
    echo "✓ OPENAI_API_KEY is set"
    echo
fi

# All done
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo
echo "Next steps:"
echo "  1. Set API key (if not done):"
echo "     export OPENAI_API_KEY='sk-...'"
echo
echo "  2. Run the smart orchestrator:"
echo "     ./run_smart_orchestrator.py"
echo
echo "  3. View cost savings:"
echo "     Check the token usage report!"
echo
echo "📖 Read README_SMART_RAG.md for details"
echo
