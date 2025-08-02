# Railway Deployment Checklist

## ✅ Pre-deployment (Completed)
- [x] Credentials backed up securely
- [x] Sensitive files removed from project
- [x] Git history cleaned up
- [x] Environment examples created
- [x] Railway configuration updated

## 🔧 Railway Setup Required
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login to Railway: `railway login`
- [ ] Initialize Railway project: `railway init`
- [ ] Set environment variables in Railway dashboard

## 🔑 Required Environment Variables
Set these in Railway dashboard:

### Database
- `DATABASE_URL` - Railway PostgreSQL connection string
- `POSTGRES_URL` - Railway PostgreSQL connection string

### Redis
- `REDIS_URL` - Railway Redis connection string
- `REDIS_HOST` - Railway Redis host
- `REDIS_PASSWORD` - Railway Redis password
- `REDIS_PORT` - Railway Redis port (usually 6379)

### Authentication
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `REFRESH_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Optional
- `OPENAI_API_KEY` - For AI features
- `SUPABASE_URL` - For legacy support
- `SUPABASE_ANON_KEY` - For legacy support
- `SUPABASE_SERVICE_ROLE_KEY` - For legacy support

## 🚀 Deployment Steps
1. Run: `./scripts/deploy-to-railway.sh`
2. Set environment variables in Railway dashboard
3. Test deployment: `railway status`
4. Check logs: `railway logs`

## 📱 Frontend Updates
1. Update React Native app with Railway URL
2. Test authentication flow
3. Test video upload functionality
4. Test object detection
5. Test product matching

## ✅ Post-deployment Verification
- [ ] Backend health check passes
- [ ] Authentication works
- [ ] Video upload works
- [ ] Object detection works
- [ ] Product matching works
- [ ] React Native app connects successfully

## 🔧 Troubleshooting
- Check Railway logs: `railway logs`
- Check environment variables in Railway dashboard
- Verify database connection
- Test API endpoints manually
