#!/bin/bash

# Lokal Backend Server Startup Script

echo "🚀 Starting Lokal Backend Server..."

# Navigate to backend directory
cd ../Lokal/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file from example"
    else
        echo "❌ No env.example file found. Please create .env manually."
    fi
fi

# Start the server
echo "🌐 Starting server on port 3001..."
npm start

echo "✅ Backend server should now be running at:"
echo "   Local: http://localhost:3001/api"
echo "   Health: http://localhost:3001/api/health" 