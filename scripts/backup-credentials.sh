#!/bin/bash

# Secure Credential Backup Script
# This script backs up all current credentials before cleanup

echo "🔐 Creating secure credential backup..."

# Create backup directory with timestamp
BACKUP_DIR="credential-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Backup directory: $BACKUP_DIR"

# Backup backend environment file
if [ -f "backend/.env" ]; then
    echo "📋 Backing up backend/.env..."
    cp backend/.env "$BACKUP_DIR/backend.env"
fi

# Backup React Native environment files
if [ -f "LokalRN/.env" ]; then
    echo "📋 Backing up LokalRN/.env..."
    cp LokalRN/.env "$BACKUP_DIR/lokalrn.env"
fi

if [ -f "LokalRN/.env.production" ]; then
    echo "📋 Backing up LokalRN/.env.production..."
    cp LokalRN/.env.production "$BACKUP_DIR/lokalrn.env.production"
fi

if [ -f "LokalRN/.env.development" ]; then
    echo "📋 Backing up LokalRN/.env.development..."
    cp LokalRN/.env.development "$BACKUP_DIR/lokalrn.env.development"
fi

# Backup engine environment file
if [ -f "engine/.env" ]; then
    echo "📋 Backing up engine/.env..."
    cp engine/.env "$BACKUP_DIR/engine.env"
fi

# Create a summary of all credentials found
echo "📝 Creating credential summary..."
cat > "$BACKUP_DIR/CREDENTIALS_SUMMARY.md" << 'EOF'
# Credential Backup Summary

## Backup Date
$(date)

## Files Backed Up
- backend/.env
- LokalRN/.env
- LokalRN/.env.production
- LokalRN/.env.development
- engine/.env

## Important Notes
1. These credentials are now safely backed up
2. Original files will be cleaned up to remove hardcoded secrets
3. New Railway environment variables will be configured
4. Keep this backup secure and do not commit to git

## Next Steps
1. Configure Railway environment variables with these credentials
2. Remove hardcoded secrets from all files
3. Test the application with Railway environment variables
4. Delete this backup once Railway is working properly

## Railway Environment Variables Needed
Based on the backed up files, you'll need to configure these in Railway:

### Database
- DATABASE_URL
- POSTGRES_URL
- POSTGRES_USER
- POSTGRES_HOST
- POSTGRES_PASSWORD
- POSTGRES_DATABASE

### Redis
- REDIS_URL
- REDIS_HOST
- REDIS_PASSWORD
- REDIS_PORT

### Authentication
- JWT_SECRET
- REFRESH_SECRET
- SESSION_SECRET

### API Configuration
- API_BASE_URL
- CORS_ORIGIN

### Supabase (if still needed)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### OpenAI
- OPENAI_API_KEY
EOF

echo "✅ Credential backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📝 Summary file: $BACKUP_DIR/CREDENTIALS_SUMMARY.md"
echo ""
echo "🔒 IMPORTANT: Keep this backup secure and do not commit to git!"
echo "🚀 Next step: Configure Railway environment variables" 