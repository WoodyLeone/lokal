# 🚀 Complete Supabase to Railway PostgreSQL Migration

## Overview
This guide will help you completely migrate from Supabase to Railway PostgreSQL. All Supabase dependencies have been removed and replaced with native PostgreSQL connections.

## ✅ What's Been Completed

### 1. Backend Code Migration
- ✅ Removed `@supabase/supabase-js` dependency
- ✅ Updated `database.js` to use Railway PostgreSQL only
- ✅ Updated `authService.js` to use PostgreSQL directly
- ✅ Updated health endpoints to reflect PostgreSQL status
- ✅ Created database migration scripts
- ✅ Updated server configuration

### 2. Environment Variables
- ✅ Removed Supabase environment variables from Railway
- ✅ Updated `env.example` to reflect PostgreSQL-only configuration

## 🔧 Next Steps Required

### Step 1: Add Railway PostgreSQL Service

1. **Open Railway Dashboard:**
   ```bash
   railway open
   ```

2. **Add PostgreSQL Service:**
   - Click "New Service"
   - Select "Database"
   - Choose "PostgreSQL"
   - Name it "lokal-postgresql"
   - Click "Deploy"

3. **Get Connection String:**
   - Click on the PostgreSQL service
   - Go to "Connect" tab
   - Copy the "Postgres Connection URL"

### Step 2: Configure Environment Variables

```bash
# Set the PostgreSQL connection string
railway variables --set "DATABASE_URL=your_postgres_connection_url_here"

# Verify Supabase variables are removed
railway variables
```

### Step 3: Deploy and Run Migrations

```bash
# Deploy the updated backend
railway up

# Run database migrations (after deployment)
railway run npm run migrate
```

### Step 4: Test the Migration

```bash
# Test health endpoint
curl https://lokal-prod-production.up.railway.app/api/health

# Expected response should show:
# "postgresql": "Available"
# "status": "OK"
```

## 📊 Database Schema

The migration script will create the following tables:

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token_hash)
);
```

### Videos Table
```sql
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  duration DECIMAL(10,2),
  width INTEGER,
  height INTEGER,
  status VARCHAR(50) DEFAULT 'uploaded',
  processing_status VARCHAR(50) DEFAULT 'pending',
  detection_results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  image_url VARCHAR(500),
  product_url VARCHAR(500),
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Video Products Junction Table
```sql
CREATE TABLE video_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  confidence_score DECIMAL(5,4),
  bounding_box JSONB,
  timestamp DECIMAL(10,2),
  detection_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, product_id, timestamp)
);
```

## 🔍 Verification Checklist

- [ ] Railway PostgreSQL service added
- [ ] DATABASE_URL environment variable set
- [ ] Supabase environment variables removed
- [ ] Backend deployed successfully
- [ ] Database migrations run successfully
- [ ] Health endpoint shows "postgresql": "Available"
- [ ] Authentication endpoints working
- [ ] Video upload endpoints working
- [ ] Product matching endpoints working

## 🚨 Troubleshooting

### Connection Issues
If you see "PostgreSQL: Unavailable" in the health check:

1. **Verify DATABASE_URL:**
   ```bash
   railway variables
   ```

2. **Check PostgreSQL service status:**
   - Go to Railway dashboard
   - Check if PostgreSQL service is running

3. **Run migrations manually:**
   ```bash
   railway run npm run migrate
   ```

### Migration Errors
If migrations fail:

1. **Check PostgreSQL permissions:**
   - Ensure the database user has CREATE TABLE permissions

2. **Check connection string:**
   - Verify the DATABASE_URL format is correct
   - Ensure SSL settings are appropriate

## 🎉 Benefits of Railway PostgreSQL

1. **Native Integration:** Direct PostgreSQL connection without Supabase abstraction
2. **Better Performance:** No additional API layer overhead
3. **Full Control:** Direct SQL queries and database management
4. **Cost Effective:** Railway PostgreSQL pricing vs Supabase
5. **Simplified Architecture:** One less dependency to manage

## 📝 Post-Migration Tasks

1. **Update Documentation:** Remove all Supabase references
2. **Test All Features:** Ensure authentication, video upload, and product matching work
3. **Monitor Performance:** Check database query performance
4. **Backup Strategy:** Set up regular PostgreSQL backups
5. **Clean Up:** Remove any remaining Supabase-related files

---

## 🎯 Migration Complete!

Once you've followed these steps, your Lokal application will be running entirely on Railway PostgreSQL with no Supabase dependencies! 