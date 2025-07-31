#!/bin/bash

echo "🚂 Railway Deployment Script for Lokal Backend"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the Lokal project root directory"
    exit 1
fi

print_status "Starting Railway deployment process..."

# Step 1: Verify backend readiness
print_status "Step 1: Verifying backend deployment readiness..."
cd backend
npm run check-deployment
if [ $? -ne 0 ]; then
    print_error "Backend is not ready for deployment. Please fix the issues above."
    exit 1
fi
cd ..

print_success "Backend is ready for deployment!"

# Step 2: Check git status
print_status "Step 2: Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "🚂 Prepare for Railway deployment - $(date)"
    git push origin main
    print_success "Changes committed and pushed to GitHub"
else
    print_success "Git repository is clean"
fi

# Step 3: Generate environment variables file
print_status "Step 3: Generating Railway environment variables..."
cat > railway-env-vars.txt << 'EOF'
# Railway Environment Variables for Lokal Backend
# Copy these to Railway dashboard Variables tab

PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o

# Redis Configuration
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0

# Generated Production Secrets
SESSION_SECRET=ogDyei/r991DRI1Cz1FoGt50vsQ4w3nahP2rBtxXXq4=
JWT_SECRET=hntRJ1g5qy4ozYvxIRxP4XbinMWoAhkRD2VL1tqRpPo=

# Production Configuration
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:3000,http://localhost:19006
LOG_LEVEL=info
MAX_FILE_SIZE=500MB
UPLOAD_PATH=./temp

# YOLO Configuration
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_MODEL=yolov8n.pt

# Cache Configuration
CACHE_TTL=3600
CACHE_TTL_PRODUCTS=3600
CACHE_TTL_DETECTION=86400
CACHE_TTL_MATCHING=1800

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_TTL=86400

# Connection Stability
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000
MAX_CONNECTIONS=1000

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://exact-sturgeon-62017.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
EOF

print_success "Environment variables file created: railway-env-vars.txt"

# Step 4: Create deployment instructions
print_status "Step 4: Creating deployment instructions..."
cat > RAILWAY_DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# 🚂 Railway Deployment Instructions

## Quick Start

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose repository**: `WoodyLeone/lokal`
6. **Set source directory**: `backend`
7. **Click "Deploy"**

## Environment Variables Setup

1. **Go to your project's "Variables" tab**
2. **Copy variables from `railway-env-vars.txt`**
3. **Add each variable one by one**
4. **Save changes**

## Monitor Deployment

1. **Watch the "Deployments" tab**
2. **Look for green checkmark**
3. **Note your Railway URL**

## Test Deployment

1. **Update `test-railway-deployment.js` with your URL**
2. **Run**: `node test-railway-deployment.js`
3. **Verify all endpoints work**

## Next Steps

1. **Update frontend apps with production URL**
2. **Test complete user flow**
3. **Monitor for any issues**

## Troubleshooting

- **Build fails**: Check Railway logs
- **Health check fails**: Verify environment variables
- **Port issues**: Railway handles automatically
EOF

print_success "Deployment instructions created: RAILWAY_DEPLOYMENT_INSTRUCTIONS.md"

# Step 5: Create a quick test script
print_status "Step 5: Creating test script..."
cat > quick-test-railway.js << 'EOF'
#!/usr/bin/env node

const axios = require('axios');

// Update this with your Railway URL
const RAILWAY_URL = process.argv[2] || 'https://your-app-name.up.railway.app';

async function quickTest() {
    console.log('🚂 Quick Railway Test');
    console.log('====================');
    console.log(`Testing: ${RAILWAY_URL}\n`);
    
    try {
        const response = await axios.get(`${RAILWAY_URL}/api/health`, {
            timeout: 10000
        });
        
        console.log('✅ Health check passed!');
        console.log('Response:', response.data);
        console.log('\n🎉 Your Railway deployment is working!');
        console.log(`🌐 Production URL: ${RAILWAY_URL}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

if (RAILWAY_URL === 'https://your-app-name.up.railway.app') {
    console.log('Usage: node quick-test-railway.js <your-railway-url>');
    console.log('Example: node quick-test-railway.js https://lokal-backend.up.railway.app');
} else {
    quickTest();
}
EOF

print_success "Quick test script created: quick-test-railway.js"

# Step 6: Final instructions
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 📱 Go to Railway.app and create your project"
echo "2. 🔧 Configure environment variables (use railway-env-vars.txt)"
echo "3. 👀 Monitor deployment in Railway dashboard"
echo "4. 🧪 Test with: node quick-test-railway.js <your-url>"
echo ""
echo "📁 Files created:"
echo "- railway-env-vars.txt (environment variables)"
echo "- RAILWAY_DEPLOYMENT_INSTRUCTIONS.md (detailed guide)"
echo "- quick-test-railway.js (test script)"
echo ""
echo "🚀 Ready to deploy! Follow the instructions in RAILWAY_DEPLOYMENT_INSTRUCTIONS.md"
echo "" 