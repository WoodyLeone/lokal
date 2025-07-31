# 🚂 Railway Deployment - Step by Step Guide

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