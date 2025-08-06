#!/bin/bash

# Lokal Backend Live Development Startup Script
echo "🚀 Starting Lokal Backend in Live Development Mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from live development template..."
    cp env.live-development .env
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p temp
mkdir -p models

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Download YOLO model if needed
if [ ! -f "yolov8n.pt" ]; then
    echo "🤖 Downloading YOLO model..."
    npm run download-models
fi

# Start the server in development mode
echo "🌐 Starting server on port 3001..."
echo "📊 Demo mode: DISABLED"
echo "🔗 API URL: http://localhost:3001/api"
echo "📝 Logs: ./logs/development.log"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with proper memory settings
npm run dev 