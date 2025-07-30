# 🚂 Railway Deployment Checklist for Lokal Backend

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [x] **Health endpoint exists** - `/api/health` route is implemented
- [x] **Railway configuration** - `railway.json` is configured
- [x] **Procfile** - `Procfile` is set up correctly
- [x] **Package.json** - All dependencies are listed
- [x] **Security audit** - No vulnerabilities found
- [x] **Environment variables** - `railway.env.example` is prepared

### 2. Environment Variables Setup
- [ ] **Generate secure secrets** for production
- [ ] **Configure Railway environment variables**
- [ ] **Update CORS origins** for production domains
- [ ] **Set production logging level**

### 3. Database & Services
- [x] **Supabase** - Already configured
- [x] **Redis** - Upstash Redis is configured
- [x] **File storage** - Supabase storage is ready
- [ ] **Test all connections** in production environment

## 🚀 Deployment Steps

### Step 1: Generate Production Secrets
```bash
# Generate secure session secret
openssl rand -base64 32

# Generate secure JWT secret
openssl rand -base64 32
```

### Step 2: Railway Dashboard Setup
1. **Create Railway account** at [railway.app](https://railway.app)
2. **Connect GitHub repository**
3. **Create new project** from GitHub repo
4. **Select backend folder** as source
5. **Configure environment variables** (see below)

### Step 3: Environment Variables Configuration
Add these to Railway dashboard:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration (already configured)
SUPABASE_URL=https://sgiuzcfsjzsspnukgdtf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzA4NSwiZXhwIjoyMDY5MjE5MDg1fQ.GlOCkRSU-tBzmdLyv5BbFgdcap6h9KSX02bH0cgxE8o

# Redis Configuration (already configured)
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=0

# Generated Production Secrets (REPLACE THESE)
SESSION_SECRET=YOUR_GENERATED_SESSION_SECRET_HERE
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

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
```

### Step 4: Deploy and Test
1. **Push to GitHub** - Railway will auto-deploy
2. **Monitor deployment logs**
3. **Test health endpoint**
4. **Test all API endpoints**

## 🧪 Testing Checklist

### Health Check Tests
- [ ] **Basic health** - `GET /api/health`
- [ ] **Database health** - `GET /api/health/database`
- [ ] **Cache health** - `GET /api/health/cache`
- [ ] **Readiness probe** - `GET /api/health/ready`
- [ ] **Liveness probe** - `GET /api/health/live`

### API Endpoint Tests
- [ ] **Products endpoint** - `GET /api/products`
- [ ] **Video upload** - `POST /api/videos/upload-file`
- [ ] **Object detection** - `POST /api/videos/[id]/detect-objects`
- [ ] **Product matching** - `POST /api/videos/[id]/match-products`

### Integration Tests
- [ ] **Frontend connection** - Test from React Native app
- [ ] **File upload** - Test video upload functionality
- [ ] **Object detection** - Test YOLO model
- [ ] **Database operations** - Test CRUD operations
- [ ] **Redis caching** - Test cache functionality

## 🔧 Troubleshooting

### Common Issues
1. **Build fails** - Check Railway logs for errors
2. **Environment variables** - Verify all variables are set
3. **Port issues** - Railway sets PORT automatically
4. **File upload issues** - Check temp directory permissions
5. **Database connection** - Verify Supabase credentials

### Monitoring
- [ ] **Set up Railway monitoring**
- [ ] **Configure error alerts**
- [ ] **Monitor resource usage**
- [ ] **Set up logging aggregation**

## 📊 Success Criteria

Your Railway deployment is successful when:

- [ ] **Backend deploys without errors**
- [ ] **Health check responds correctly**
- [ ] **All API endpoints work**
- [ ] **Environment variables are configured**
- [ ] **SSL/HTTPS is working**
- [ ] **Frontend can connect**
- [ ] **Video upload works**
- [ ] **Object detection functions**
- [ ] **Database operations work**
- [ ] **Redis caching works**

## 🎯 Next Steps After Deployment

1. **Update frontend configuration** with production URL
2. **Test complete user flow** from mobile app
3. **Set up monitoring and alerts**
4. **Configure custom domain** (optional)
5. **Set up CI/CD pipeline** (optional)

## 📈 Railway Pricing & Limits

### Free Tier
- **$5 credit** per month
- **Shared infrastructure**
- **Automatic deployments**
- **Custom domains**

### Resource Monitoring
- Monitor usage to stay within free tier
- Consider Pro plan when scaling
- Set up usage alerts

---

**Estimated Time**: 30-60 minutes  
**Difficulty**: Easy  
**Priority**: Critical for production readiness

## 🚨 Important Notes

1. **Keep secrets secure** - Never commit to Git
2. **Monitor usage** - Stay within Railway limits
3. **Backup data** - Ensure Supabase data is backed up
4. **Test thoroughly** - Verify all functionality
5. **Set up monitoring** - Configure alerts for downtime

---

**Ready to deploy? Follow this checklist step by step!** 🚂 