#!/bin/bash

echo "🚂 Complete Railway Setup for Lokal Backend"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Starting complete Railway setup..."

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

# Step 2: Check git status and push
print_status "Step 2: Checking git status and pushing latest changes..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "🚂 Complete Railway setup - $(date)"
    git push origin main
    print_success "Changes committed and pushed to GitHub"
else
    print_success "Git repository is clean"
fi

# Step 3: Create Railway setup guide
print_status "Step 3: Creating comprehensive Railway setup guide..."
cat > RAILWAY_COMPLETE_SETUP.md << 'EOF'
# 🚂 Complete Railway Setup Guide

## 🎯 **GOAL: Deploy Lokal Backend to Production**

### **Prerequisites:**
- ✅ GitHub account
- ✅ Lokal repository: `WoodyLeone/lokal`
- ✅ Backend code ready (DONE)
- ✅ Environment variables prepared (DONE)

---

## **STEP 1: Create Railway Account & Project**

### **1.1 Go to Railway**
- Open: [https://railway.app](https://railway.app)
- Click **"Start a New Project"**

### **1.2 Sign in with GitHub**
- Click **"Deploy from GitHub repo"**
- Authorize Railway to access your GitHub account
- Select your GitHub account

### **1.3 Select Repository**
- Find and click on: **`WoodyLeone/lokal`**
- Click **"Deploy Now"**

### **1.4 Configure Deployment**
- **Source Directory**: `backend`
- **Branch**: `main`
- Click **"Deploy"**

---

## **STEP 2: Configure Environment Variables**

### **2.1 Access Variables Tab**
- In your Railway project dashboard
- Click **"Variables"** tab

### **2.2 Add Environment Variables**
Copy and paste these **ONE BY ONE**:

```bash
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0
SESSION_SECRET=ogDyei/r991DRI1Cz1FoGt50vsQ4w3nahP2rBtxXXq4=
JWT_SECRET=hntRJ1g5qy4ozYvxIRxP4XbinMWoAhkRD2VL1tqRpPo=
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:3000,http://localhost:19006
LOG_LEVEL=info
MAX_FILE_SIZE=500MB
UPLOAD_PATH=./temp
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_MODEL=yolov8n.pt
CACHE_TTL=3600
CACHE_TTL_PRODUCTS=3600
CACHE_TTL_DETECTION=86400
CACHE_TTL_MATCHING=1800
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TTL=86400
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000
MAX_CONNECTIONS=1000
UPSTASH_REDIS_REST_URL=https://exact-sturgeon-62017.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
```

### **2.3 Save Variables**
- Click **"Save"** after adding all variables

---

## **STEP 3: Monitor Deployment**

### **3.1 Watch Build Process**
- Go to **"Deployments"** tab
- Watch for:
  - ✅ Installing dependencies
  - ✅ Running `npm install`
  - ✅ Running `npm run postinstall`
  - ✅ Starting application
  - ✅ Green checkmark (success)

### **3.2 Get Your URL**
- Go to **"Settings"** tab
- Look for **"Domains"** section
- Copy your Railway URL (format: `https://your-app-name.up.railway.app`)

---

## **STEP 4: Test Deployment**

### **4.1 Quick Test**
Run this command with your Railway URL:
```bash
node quick-test-railway.js https://your-railway-url.up.railway.app
```

### **4.2 Expected Results**
You should see:
```
🚂 Quick Railway Test
====================
Testing: https://your-app-name.up.railway.app

✅ Health check passed!
Response: { status: 'ok', timestamp: '...', uptime: '...' }

🎉 Your Railway deployment is working!
🌐 Production URL: https://your-app-name.up.railway.app
```

---

## **STEP 5: Troubleshooting**

### **❌ Build Fails**
- Check Railway logs for errors
- Verify all environment variables are set
- Check if `backend/package.json` exists

### **❌ Health Check Fails**
- Verify environment variables are correct
- Check if `/api/health` endpoint exists
- Look for error messages in logs

### **❌ Port Issues**
- Railway sets PORT automatically
- Don't override PORT environment variable

---

## **🎯 Success Criteria**

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Health check passes
- ✅ All environment variables are set
- ✅ Railway URL is accessible
- ✅ Quick test script passes

---

## **📞 Next Steps After Success**

Once deployed successfully:
1. **Update frontend apps** with production URL
2. **Test complete user flow**
3. **Monitor for any issues**
4. **Move to Priority 2** (Frontend Configuration)

---

## **🚨 Need Help?**

If you encounter issues:
1. Check Railway logs for error messages
2. Verify environment variables are set correctly
3. Ensure backend code is pushed to GitHub
4. Contact support with specific error messages

---

**Ready to start? Go to [Railway.app](https://railway.app) and follow these steps!** 🚂
EOF

print_success "Complete setup guide created: RAILWAY_COMPLETE_SETUP.md"

# Step 4: Create environment variables file
print_status "Step 4: Creating environment variables file..."
cat > RAILWAY_ENV_VARS_COMPLETE.txt << 'EOF'
# Railway Environment Variables - Copy ALL of these to Railway dashboard

PORT=3001
NODE_ENV=production
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0
SESSION_SECRET=ogDyei/r991DRI1Cz1FoGt50vsQ4w3nahP2rBtxXXq4=
JWT_SECRET=hntRJ1g5qy4ozYvxIRxP4XbinMWoAhkRD2VL1tqRpPo=
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:3000,http://localhost:19006
LOG_LEVEL=info
MAX_FILE_SIZE=500MB
UPLOAD_PATH=./temp
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_MODEL=yolov8n.pt
CACHE_TTL=3600
CACHE_TTL_PRODUCTS=3600
CACHE_TTL_DETECTION=86400
CACHE_TTL_MATCHING=1800
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TTL=86400
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000
MAX_CONNECTIONS=1000
UPSTASH_REDIS_REST_URL=https://exact-sturgeon-62017.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA

# INSTRUCTIONS:
# 1. Go to Railway dashboard
# 2. Click "Variables" tab
# 3. Copy each line above (one by one)
# 4. Paste into Railway Variables
# 5. Save changes
EOF

print_success "Environment variables file created: RAILWAY_ENV_VARS_COMPLETE.txt"

# Step 5: Create test script
print_status "Step 5: Creating comprehensive test script..."
cat > test-railway-complete.js << 'EOF'
#!/usr/bin/env node

const axios = require('axios');

// Update this with your Railway URL
const RAILWAY_URL = process.argv[2] || 'https://your-app-name.up.railway.app';

async function comprehensiveTest() {
    console.log('🚂 Comprehensive Railway Test');
    console.log('=============================');
    console.log(`Testing: ${RAILWAY_URL}\n`);
    
    const tests = [
        {
            name: 'Basic Health Check',
            url: '/api/health',
            method: 'GET'
        },
        {
            name: 'Database Health',
            url: '/api/health/database',
            method: 'GET'
        },
        {
            name: 'Cache Health',
            url: '/api/health/cache',
            method: 'GET'
        },
        {
            name: 'Products Endpoint',
            url: '/api/products',
            method: 'GET'
        }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            console.log(`🧪 Testing: ${test.name}...`);
            const response = await axios({
                method: test.method,
                url: `${RAILWAY_URL}${test.url}`,
                timeout: 10000
            });
            
            console.log(`✅ ${test.name} passed!`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
            passedTests++;
            
        } catch (error) {
            console.log(`❌ ${test.name} failed!`);
            console.log(`   Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
        }
        console.log('');
    }
    
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! Your Railway deployment is working perfectly!');
        console.log(`🌐 Production URL: ${RAILWAY_URL}`);
    } else {
        console.log('\n⚠️  Some tests failed. Check your Railway deployment configuration.');
    }
}

if (RAILWAY_URL === 'https://your-app-name.up.railway.app') {
    console.log('Usage: node test-railway-complete.js <your-railway-url>');
    console.log('Example: node test-railway-complete.js https://lokal-backend.up.railway.app');
} else {
    comprehensiveTest();
}
EOF

print_success "Comprehensive test script created: test-railway-complete.js"

# Step 6: Final instructions
echo ""
echo "🎯 RAILWAY SETUP COMPLETE!"
echo "=========================="
echo ""
echo "📁 Files created for you:"
echo "- RAILWAY_COMPLETE_SETUP.md (detailed step-by-step guide)"
echo "- RAILWAY_ENV_VARS_COMPLETE.txt (all environment variables)"
echo "- test-railway-complete.js (comprehensive test script)"
echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo ""
echo "1. 📱 Go to [Railway.app](https://railway.app)"
echo "2. 📖 Follow the guide in RAILWAY_COMPLETE_SETUP.md"
echo "3. 🔧 Copy environment variables from RAILWAY_ENV_VARS_COMPLETE.txt"
echo "4. 🧪 Test with: node test-railway-complete.js <your-url>"
echo ""
echo "📋 QUICK CHECKLIST:"
echo "=================="
echo "□ Create Railway project"
echo "□ Set source directory to 'backend'"
echo "□ Add all environment variables"
echo "□ Wait for deployment to complete"
echo "□ Test with the test script"
echo ""
echo "🎉 Ready to deploy! Follow the guide and you'll be live in no time!"
echo "" 