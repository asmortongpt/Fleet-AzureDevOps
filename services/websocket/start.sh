#!/bin/bash
# Quick start script for WebSocket service

set -e

echo "========================================"
echo "Radio Fleet Dispatch - WebSocket Service"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Check required services
echo "🔍 Checking required services..."

# Check Redis
if ! nc -z localhost 6379 2>/dev/null; then
    echo "⚠️  Redis not running on localhost:6379"
    echo "   Start Redis with: redis-server"
    echo "   Or use Docker: docker run -d -p 6379:6379 redis:7-alpine"
else
    echo "✅ Redis is running"
fi

# Check Kafka
if ! nc -z localhost 9092 2>/dev/null; then
    echo "⚠️  Kafka not running on localhost:9092"
    echo "   Start with docker-compose: make docker-run"
else
    echo "✅ Kafka is running"
fi

echo ""
echo "========================================"
echo "Starting WebSocket service..."
echo "========================================"
echo ""

# Run the service
python main.py
