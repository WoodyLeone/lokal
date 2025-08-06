#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying to Railway..."

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
  echo "❌ railway.json not found. Make sure you're in the project root."
  exit 1
fi

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Check your Railway dashboard for deployment status"
