# Quick Start - Railway Deployment

## 🚀 Immediate Next Steps

### 1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

### 2. **Login to Railway**
```bash
railway login
```

### 3. **Deploy to Railway**
```bash
./scripts/deploy-to-railway.sh
```

## 🔑 Required Environment Variables

Set these in Railway dashboard after deployment:

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Redis
```
REDIS_URL=redis://user:password@host:port
```

### Authentication (Generate these)
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
```
JWT_SECRET=your_generated_secret
REFRESH_SECRET=your_generated_secret
SESSION_SECRET=your_generated_secret
```

## 📱 Update React Native App

After deployment, update your React Native app with the Railway URL:

1. Copy the Railway deployment URL
2. Update `LokalRN/src/config/env.ts`:
   ```typescript
   API_BASE_URL: 'https://your-railway-url.up.railway.app/api'
   ```

## ✅ Test Deployment

1. **Health Check**: Visit `https://your-railway-url.up.railway.app/api/health`
2. **Authentication**: Test user registration/login
3. **Video Upload**: Test video upload functionality
4. **Object Detection**: Test object detection
5. **Product Matching**: Test product matching

## 🔧 Troubleshooting

- **Check logs**: `railway logs`
- **Check status**: `railway status`
- **Redeploy**: `railway up`
- **Environment variables**: Check Railway dashboard

## 📞 Support

- Railway documentation: https://docs.railway.app/
- Project documentation: Check `RAILWAY_DEPLOYMENT_CHECKLIST.md`
- Credentials backup: `credential-backup-20250801_212912/`

---

**Your project is now Railway-ready! 🎉** 