#!/bin/bash
# Railway Environment Switching Script

ENVIRONMENT=${1:-production}

echo "🔄 Switching to ${ENVIRONMENT} environment..."

case $ENVIRONMENT in
  "production"|"prod")
    echo "📋 Linking to production environment..."
    railway link -p lokal-prod -e production
    echo "✅ Switched to production environment"
    ;;
  "development"|"dev")
    echo "📋 Linking to development environment..."
    railway link -p lokal-prod -e development
    echo "✅ Switched to development environment"
    ;;
  *)
    echo "❌ Invalid environment. Use 'production' or 'development'"
    exit 1
    ;;
esac

echo "📊 Current status:"
railway status
