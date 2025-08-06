# Adding Railway PostgreSQL Service

Since the CLI doesn't support adding PostgreSQL directly, please follow these steps:

## 1. Open Railway Dashboard
```bash
railway open
```

## 2. Add PostgreSQL Service
1. In the Railway dashboard, click "New Service"
2. Select "Database" 
3. Choose "PostgreSQL"
4. Give it a name like "lokal-postgresql"
5. Click "Deploy"

## 3. Get the Connection String
1. Once deployed, click on the PostgreSQL service
2. Go to "Connect" tab
3. Copy the "Postgres Connection URL"
4. It will look like: `postgresql://postgres:password@host:port/database`

## 4. Set Environment Variables
```bash
# Set the DATABASE_URL
railway variables --set "DATABASE_URL=your_postgres_connection_url_here"

# Remove old Supabase variables (already done)
railway variables --set "SUPABASE_URL="
railway variables --set "SUPABASE_ANON_KEY="
railway variables --set "SUPABASE_SERVICE_ROLE_KEY="
```

## 5. Deploy the Updated Backend
```bash
railway up
```

## 6. Test the Connection
```bash
curl https://lokal-dev-production.up.railway.app/api/health
```

The health endpoint should now show "PostgreSQL: Available" instead of "Supabase: Available". 