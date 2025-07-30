# 🔗 Railway Connection Stability Guide

## ❌ **Connection Stability Issues**

If you're experiencing connection stability issues with your Railway deployment, here are the solutions:

## 🔧 **Immediate Fixes**

### **1. Check Environment Variables in Railway Dashboard**

Make sure ALL these variables are set in Railway:

```bash
# Essential for stability
PORT=3001
NODE_ENV=production

# Database connections
SUPABASE_URL=https://sgiuzcfsjzsspnukfdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis for session stability
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0

# Security
SESSION_SECRET=cpPriCnAccrePFoOJ5zzP6N+ZLZJhd4HidU8pyb6llw=
JWT_SECRET=VnkmzR4oxJTwq+JrVAHjD04/q8RkvWq4kZ6vOc7dQCk=

# CORS - Update with your actual domain
CORS_ORIGIN=https://your-frontend-domain.com,http://localhost:3000,http://localhost:19006
```

### **2. Manual Start Command in Railway**

In Railway dashboard:
1. Go to **Settings** tab
2. Set **Start Command** to: `node server.js`
3. Save and redeploy

### **3. Check Railway Logs**

Monitor these specific issues in Railway logs:

```bash
# Connection errors
Error: Cannot find module
Error: connect ECONNREFUSED
Error: Redis connection failed

# Memory issues
FATAL ERROR: Ineffective mark-compacts near heap limit
JavaScript heap out of memory
```

## 🧪 **Testing Connection Stability**

### **Health Check Endpoints**

Test these endpoints to verify stability:

```bash
# Basic health
curl https://your-railway-url/api/health

# Database health
curl https://your-railway-url/api/health/database

# Connection stability
curl https://your-railway-url/api/health/connection

# Liveness probe
curl https://your-railway-url/api/health/live
```

### **Expected Responses**

**Health Check:**
```json
{
  "status": "OK",
  "message": "Lokal Backend Server is running",
  "database": {
    "isConnected": true,
    "supabase": "connected",
    "redis": "ready"
  }
}
```

**Connection Check:**
```json
{
  "uptime": 123.45,
  "memory": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 123456789
  },
  "connections": 5,
  "keepAliveTimeout": 65000,
  "headersTimeout": 66000
}
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: Database Connection Drops**

**Symptoms:**
- 503 errors
- "Database service unavailable"
- Redis connection failures

**Solutions:**
1. **Check Redis credentials** in Railway environment variables
2. **Verify Supabase connection** is working
3. **Add connection retry logic** (already implemented)

### **Issue 2: Memory Leaks**

**Symptoms:**
- Server crashes
- High memory usage
- Slow response times

**Solutions:**
1. **Monitor memory usage** via `/api/health/connection`
2. **Check for memory leaks** in file uploads
3. **Optimize image processing** (YOLO model)

### **Issue 3: Timeout Issues**

**Symptoms:**
- Request timeouts
- Connection drops
- 504 Gateway Timeout

**Solutions:**
1. **Increase timeouts** in Railway settings
2. **Optimize file upload** processing
3. **Add request queuing** for heavy operations

## 🛠️ **Railway Configuration**

### **Railway.json Settings**

```json
{
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Railway Dashboard Settings**

1. **Resources**: Ensure adequate CPU/Memory allocation
2. **Environment**: Set all required variables
3. **Domains**: Configure custom domain if needed
4. **Monitoring**: Enable Railway monitoring

## 📊 **Monitoring & Alerts**

### **Key Metrics to Monitor**

1. **Response Time**: Should be < 2 seconds
2. **Memory Usage**: Should be < 80% of allocated
3. **Database Connections**: Should be stable
4. **Error Rate**: Should be < 1%

### **Railway Monitoring**

Enable Railway monitoring to track:
- CPU usage
- Memory usage
- Network I/O
- Error rates

## 🚨 **Emergency Procedures**

### **If Service is Down**

1. **Check Railway logs** immediately
2. **Verify environment variables** are set
3. **Test health endpoints** manually
4. **Restart service** if needed
5. **Check database connections**

### **If Database is Unreachable**

1. **Verify Supabase status** at status.supabase.com
2. **Check Redis connection** at Upstash dashboard
3. **Update credentials** if needed
4. **Test connections** locally

## 📞 **Support Resources**

- **Railway Documentation**: docs.railway.app
- **Railway Status**: status.railway.app
- **Supabase Status**: status.supabase.com
- **Upstash Status**: status.upstash.com

---

## 🎯 **Quick Fix Checklist**

- [ ] **Environment variables** set in Railway dashboard
- [ ] **Start command** set to `node server.js`
- [ ] **Health endpoints** responding correctly
- [ ] **Database connections** stable
- [ ] **Memory usage** within limits
- [ ] **Error logs** reviewed
- [ ] **CORS settings** updated for your domain

---

*Last updated: January 2025*  
*Status: Connection stability improvements applied* 🔗 