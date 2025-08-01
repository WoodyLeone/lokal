# 🚨 RAILWAY PROJECT CRASH - EMERGENCY FIX GUIDE

**Project ID:** `99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0`  
**Status:** 🔴 **CRASHING**  
**External Dependencies:** ✅ Supabase & Redis are working  

---

## 🚨 **IMMEDIATE DIAGNOSIS**

✅ **Good News:** Your Supabase and Redis services are **accessible and responding**  
❌ **Bad News:** The crash is happening **inside your Railway deployment**

**Most Likely Cause:** Missing or incorrect environment variables

---

## 🔧 **EMERGENCY ACTION PLAN**

### **STEP 1: Check Environment Variables** ⏱️ *2 minutes*

Go to your Railway Variables tab: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/settings

**Verify ALL these variables are set:**

```bash
PORT                        (Railway auto-assigns this - should exist)
NODE_ENV=production
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Yzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0
SESSION_SECRET=ogDyei/r991DRI1Cz1FoGt50vsQ4w3nahP2rBtxXXq4=
JWT_SECRET=hntRJ1g5qy4ozYvxIRxP4XbinMWoAhkRD2VL1tqRpPo=
```

### **STEP 2: Check Railway Logs** ⏱️ *1 minute*

Go to: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/logs

**Look for the FIRST error message. Common crash patterns:**

🔴 **Critical Errors:**
```
Error: Missing required environment variable: SUPABASE_URL
Cannot find module 'express'
Error: listen EADDRINUSE :::3001
connect ECONNREFUSED
JavaScript heap out of memory
```

🟡 **Warning Signs:**
```
npm ERR! Failed at the install step
Process exited with code 1
Application failed to start
Health check timeout
```

### **STEP 3: Force Redeploy** ⏱️ *3 minutes*

1. Go to: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/deployments
2. Click **"Redeploy"** on the latest deployment
3. **Watch the logs** during redeploy for any errors

---

## 🎯 **QUICK FIXES BY ERROR TYPE**

### **❌ "Missing environment variable"**
**Fix:** Copy ALL variables from `railway-env-vars.txt` to Railway Variables tab

### **❌ "Cannot find module"**  
**Fix:** Force redeploy to rebuild node_modules

### **❌ "EADDRINUSE" or "Port already in use"**
**Fix:** Make sure `PORT` variable exists (Railway auto-assigns it)

### **❌ "ECONNREFUSED"**
**Fix:** Double-check Supabase and Redis credentials

### **❌ "JavaScript heap out of memory"**
**Fix:** Increase Railway memory limit or optimize your code

---

## 📋 **COMPLETE ENVIRONMENT VARIABLES LIST**

Copy these **EXACTLY** to your Railway Variables tab:

```
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Yzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Yzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o
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

---

## ✅ **SUCCESS INDICATORS**

**When your app is working, you should see:**
```
Server starting on port 3001
Database connection established
Redis connection ready
Lokal Backend Server is running
```

**No errors in the first 30 seconds of startup**

---

## 🚨 **IF STILL CRASHING**

### **1. Get the Exact Error Message**
- Copy the **FIRST** error from Railway logs
- Include the **full stack trace**

### **2. Check Your package.json**
Your `backend/package.json` should have:
```json
{
  "scripts": {
    "start": "node app.js"
  },
  "main": "app.js"
}
```

### **3. Verify File Structure**
Make sure these files exist in your Railway deployment:
- `backend/app.js` (main entry point)
- `backend/package.json`
- `backend/src/server.js`

---

## 🔗 **Direct Links for Your Project**

- **🚨 Project Dashboard**: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0
- **⚙️ Variables Tab**: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/settings
- **📋 Logs Tab**: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/logs
- **🚀 Deployments Tab**: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/deployments

---

## 💬 **What to Share If Still Crashing**

1. **The FIRST error message** from Railway logs (copy/paste the exact text)
2. **Screenshot** of your Railway Variables tab
3. **Deployment status** - is it failing during build or runtime?

---

**⚡ FASTEST FIX:** 9 out of 10 Railway crashes are caused by missing environment variables. Start there!