#!/bin/bash

# App Test Toolkit - Local Testing Script
# Auto-generated for react-vite

set -e

echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting preview server..."
echo "Preview URL: http://localhost:4173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run preview
