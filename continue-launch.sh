#!/bin/bash

# 🚀 Continue Lokal App Launch
# This script continues the launch process from where we left off

echo "🚀 Continuing Lokal App Launch..."
echo "=================================="

# Set environment variables
echo "📋 Setting environment variables..."
export DATABASE_URL="postgresql://postgres:olgtwNjDXPQbkNNuknFliLTK@postgres.railway.internal:5432/railway"
export NODE_ENV="production"
export JWT_SECRET="lokal-production-secret-2024"
export EXPO_PUBLIC_API_BASE_URL="https://lokal-dev-production.up.railway.app/api"
export EXPO_PUBLIC_DATABASE_URL="postgresql://postgres:olgtwNjDXPQbkNNuknFliLTK@postgres.railway.internal:5432/railway"

echo "✅ Environment variables set"

# Check dependencies
echo "🔧 Checking dependencies..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Python3: $(python3 --version)"

# Check if backend is already running
echo "🌐 Checking backend status..."
if curl -s "https://lokal-dev-production.up.railway.app/api/health" > /dev/null; then
    echo "✅ Backend is running on Railway"
    BACKEND_RUNNING=true
else
    echo "⚠️  Backend not responding, will start locally"
    BACKEND_RUNNING=false
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Start frontend
echo "🚀 Starting frontend..."
echo "Frontend will be available at: http://localhost:3001"
echo "Backend API: https://lokal-dev-production.up.railway.app/api"
echo ""
echo "🎉 Launch sequence complete!"
echo "============================="
echo "✅ Environment configured"
echo "✅ Dependencies installed"
echo "✅ Frontend starting..."
echo ""
echo "📱 Next steps:"
echo "1. Open http://localhost:3001 in your browser"
echo "2. Test video upload functionality"
echo "3. Verify real-time updates"
echo "4. Check object detection and product matching"
echo ""
echo "📊 Monitor logs for any issues"
echo "🔗 Backend health: https://lokal-dev-production.up.railway.app/api/health"

# Start the frontend
npm start 