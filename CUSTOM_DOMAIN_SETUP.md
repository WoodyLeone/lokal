# 🌐 Custom Domain Setup Guide

## Optional: Set Up Custom Domain for Railway Backend

This guide shows you how to set up a custom domain for your Railway backend (optional step 4).

## 🎯 Benefits of Custom Domain

- **Professional URL**: `api.yourdomain.com` instead of `lokal-dev-production.up.railway.app`
- **Brand Consistency**: Matches your app's branding
- **Easier Management**: Simpler to remember and share
- **SSL Certificate**: Automatic HTTPS with your domain

## 📋 Prerequisites

1. **Domain Name**: You need a domain name (e.g., from GoDaddy, Namecheap, Google Domains)
2. **Railway Account**: Your Railway project must be active
3. **DNS Access**: Ability to modify DNS records for your domain

## 🔧 Step-by-Step Setup

### Step 1: Access Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project: `lokal-prod`
3. Click on your service: `Lokal-Dev`

### Step 2: Add Custom Domain

1. Go to **Settings** tab
2. Scroll down to **Domains** section
3. Click **Add Domain**
4. Enter your custom domain (e.g., `api.yourdomain.com`)
5. Click **Add**

### Step 3: Configure DNS Records

Railway will provide you with DNS records to add to your domain provider:

#### Example DNS Configuration:
```
Type: CNAME
Name: api
Value: cname.railway.app
TTL: 3600 (or default)
```

#### For Root Domain (optional):
```
Type: CNAME
Name: @
Value: cname.railway.app
TTL: 3600 (or default)
```

### Step 4: Verify Domain

1. Wait for DNS propagation (can take up to 48 hours, usually 15-30 minutes)
2. Railway will automatically provision SSL certificate
3. Check domain status in Railway dashboard

### Step 5: Update React Native App

Once your custom domain is working, update your React Native app:

#### Option A: Update .env file
```bash
# Update your .env file
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

#### Option B: Update environment configuration
```typescript
// In src/config/env.ts
const RAILWAY_URLS = [
  'https://api.yourdomain.com', // Your custom domain
  'https://lokal-dev-production.up.railway.app',  // Primary
  'https://lokal-backend-production.up.railway.app', // Fallback
];
```

## 🧪 Testing Custom Domain

### Test the new domain:
```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Test video upload
curl -X POST https://api.yourdomain.com/api/videos/upload \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","videoUrl":"https://example.com/video.mp4"}'
```

### Update monitoring script:
```javascript
// In monitor-railway-performance.js
const RAILWAY_BASE_URL = 'https://api.yourdomain.com';
```

## 🔍 Troubleshooting

### Common Issues:

1. **DNS Not Propagated**
   - Wait longer (up to 48 hours)
   - Check DNS propagation with tools like `dig` or `nslookup`
   - Verify DNS records are correct

2. **SSL Certificate Issues**
   - Railway automatically provisions SSL
   - Wait for certificate to be issued (usually 5-10 minutes)
   - Check domain status in Railway dashboard

3. **Domain Not Working**
   - Verify DNS records are correct
   - Check Railway service is running
   - Test with Railway's default domain first

### Useful Commands:

```bash
# Check DNS propagation
dig api.yourdomain.com

# Test domain connectivity
curl -I https://api.yourdomain.com/api/health

# Check SSL certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
```

## 📊 Monitoring Custom Domain

### Update your monitoring script:
```bash
# Test custom domain performance
node monitor-railway-performance.js

# Continuous monitoring with custom domain
node monitor-railway-performance.js --continuous
```

## 🎯 Best Practices

1. **Always Keep Fallbacks**: Keep Railway's default domain as fallback
2. **Test Thoroughly**: Test all endpoints with custom domain
3. **Monitor Performance**: Use monitoring tools to track performance
4. **Document Changes**: Update your team about the new domain
5. **SSL Verification**: Ensure SSL certificate is working properly

## 📞 Support

If you encounter issues:

1. **Railway Support**: Check Railway documentation and support
2. **DNS Provider**: Contact your domain provider for DNS issues
3. **SSL Issues**: Railway handles SSL automatically, but check domain status

---

**Note**: Custom domain setup is optional. Your app works perfectly with Railway's default domain! 