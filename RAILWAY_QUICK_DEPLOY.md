# 🚂 Railway Quick Deploy Guide

## ⚡ 5-Minute Deployment

### 1. Create Railway Project
```
1. Go to railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose Lokal repository
6. ⚠️ IMPORTANT: Select 'backend' folder (not root)
7. Click "Deploy"
```

### 2. Set Environment Variables
```
1. Go to project dashboard
2. Click "Variables" tab
3. Copy ALL variables from: backend/railway.env.example
4. Update CORS_ORIGIN with your frontend domain
```

### 3. Test Deployment
```bash
# Replace YOUR_URL with your Railway URL
curl https://YOUR_URL/api/health
```

## 🔧 Generated Secrets (Already in railway.env.example)
- **Session Secret**: `cpPriCnAccrePFoOJ5zzP6N+ZLZJhd4HidU8pyb6llw=`
- **JWT Secret**: `VnkmzR4oxJTwq+JrVAHjD04/q8RkvWq4kZ6vOc7dQCk=`

## 🧪 Quick Tests
```bash
# Health check
curl https://YOUR_URL/api/health

# Database health
curl https://YOUR_URL/api/health/database

# Products endpoint
curl https://YOUR_URL/api/products
```

## ✅ Success Indicators
- [ ] Health endpoint returns 200 OK
- [ ] Database health shows "connected"
- [ ] Products endpoint returns data
- [ ] No errors in Railway logs

## 🚨 Common Issues
- **Wrong source folder**: Make sure to select `backend` folder
- **Missing env vars**: Copy ALL variables from railway.env.example
- **CORS errors**: Update CORS_ORIGIN with your domain

## 📞 Need Help?
- Run: `cd backend && node test-railway-readiness.js`
- Check Railway logs in dashboard
- See full guide: `RAILWAY_DEPLOYMENT_SUMMARY.md`

---
**Status**: ✅ Ready for deployment  
**Time**: ~5 minutes  
**Difficulty**: Easy 