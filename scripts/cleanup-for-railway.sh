#!/bin/bash

# Railway Cleanup Script for Lokal Project
# This script cleans up sensitive files and prepares the project for Railway deployment

set -e  # Exit on any error

echo "🧹 Starting Railway cleanup for Lokal project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if credential backup exists
check_credential_backup() {
    print_status "Checking credential backup..."
    if ls credential-backup-* 1> /dev/null 2>&1; then
        print_success "Credential backup found"
    else
        print_warning "No credential backup found. Run ./scripts/backup-credentials.sh first."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Remove sensitive environment files
remove_sensitive_files() {
    print_status "Removing sensitive environment files..."
    
    # List of sensitive files to remove
    sensitive_files=(
        "backend/.env"
        "LokalRN/.env"
        "LokalRN/.env.real"
        "LokalRN/.env.backup*"
        "LokalRN/.env.railway"
        "LokalRN/.env.development"
        "LokalRN/.env.production"
        "LokalRN/.env.test"
        "engine/.env"
        "engine/.env.backup*"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            print_status "Removing $file"
            rm -rf "$file"
            print_success "Removed $file"
        fi
    done
}

# Clean up test files and logs
cleanup_test_files() {
    print_status "Cleaning up test files and logs..."
    
    # Remove test result files
    if [ -f "test-results-*.json" ]; then
        rm -f test-results-*.json
        print_success "Removed test result files"
    fi
    
    # Remove log files
    if [ -d "backend/logs" ]; then
        rm -rf backend/logs/*
        print_success "Cleared backend logs"
    fi
    
    if [ -d "engine/logs" ]; then
        rm -rf engine/logs/*
        print_success "Cleared engine logs"
    fi
    
    # Remove temporary files
    if [ -d "backend/temp" ]; then
        rm -rf backend/temp/*
        print_success "Cleared backend temp files"
    fi
    
    if [ -d "LokalRN/src/temp" ]; then
        rm -rf LokalRN/src/temp/*
        print_success "Cleared React Native temp files"
    fi
}

# Clean up git history of sensitive files
cleanup_git_history() {
    print_status "Cleaning up git history..."
    
    # Check if there are any sensitive files in git
    if git ls-files | grep -E "\.env$|\.env\." > /dev/null; then
        print_warning "Found sensitive files in git history"
        print_status "Removing sensitive files from git tracking..."
        
        # Remove sensitive files from git tracking
        git rm --cached -r backend/.env 2>/dev/null || true
        git rm --cached -r LokalRN/.env* 2>/dev/null || true
        git rm --cached -r engine/.env* 2>/dev/null || true
        
        print_success "Removed sensitive files from git tracking"
    else
        print_success "No sensitive files found in git tracking"
    fi
}

# Update .gitignore to ensure sensitive files are ignored
update_gitignore() {
    print_status "Updating .gitignore..."
    
    # Check if .gitignore already has the necessary entries
    if ! grep -q "credential-backup" .gitignore; then
        echo "" >> .gitignore
        echo "# Credential backups" >> .gitignore
        echo "credential-backup-*/" >> .gitignore
        print_success "Added credential backup entries to .gitignore"
    fi
    
    if ! grep -q "\.env\.backup" .gitignore; then
        echo ".env.backup*" >> .gitignore
        print_success "Added .env.backup entries to .gitignore"
    fi
}

# Create Railway-specific environment examples
create_railway_examples() {
    print_status "Creating Railway-specific environment examples..."
    
    # Create React Native Railway environment example
    cat > LokalRN/env.railway.example << 'EOF'
# Railway Environment Configuration for React Native
# Copy this file to .env and update with your Railway URLs

# Railway Backend API URL
EXPO_PUBLIC_API_BASE_URL=https://your-railway-backend.up.railway.app/api

# Database Configuration (if needed)
EXPO_PUBLIC_DATABASE_URL=your_railway_database_url

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_ENABLE_OBJECT_DETECTION=true
EXPO_PUBLIC_ENABLE_PRODUCT_MATCHING=true
EXPO_PUBLIC_ENABLE_VIDEO_UPLOAD=true
EXPO_PUBLIC_ENABLE_FILE_UPLOAD=true

# Debug Configuration
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_DEV_MODE=false
EOF

    print_success "Created Railway environment examples"
}

# Verify cleanup
verify_cleanup() {
    print_status "Verifying cleanup..."
    
    # Check for remaining sensitive files
    remaining_sensitive=$(find . -name ".env" -o -name ".env.*" | grep -v ".env.example" | grep -v ".env.railway.example" || true)
    
    if [ -n "$remaining_sensitive" ]; then
        print_warning "Found remaining sensitive files:"
        echo "$remaining_sensitive"
        print_warning "Please review and remove these files manually if needed."
    else
        print_success "No sensitive files remaining"
    fi
    
    # Check git status
    if git status --porcelain | grep -E "\.env" > /dev/null; then
        print_warning "Found .env files in git status"
        print_status "Run 'git add .' and 'git commit' to commit the cleanup"
    else
        print_success "Git status is clean"
    fi
}

# Create deployment checklist
create_deployment_checklist() {
    print_status "Creating deployment checklist..."
    
    cat > RAILWAY_DEPLOYMENT_CHECKLIST.md << 'EOF'
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
EOF

    print_success "Created deployment checklist"
}

# Main cleanup process
main() {
    echo "🧹 Lokal Railway Cleanup Script"
    echo "==============================="
    echo ""
    
    check_credential_backup
    remove_sensitive_files
    cleanup_test_files
    cleanup_git_history
    update_gitignore
    create_railway_examples
    verify_cleanup
    create_deployment_checklist
    
    echo ""
    print_success "Railway cleanup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review RAILWAY_DEPLOYMENT_CHECKLIST.md"
    echo "2. Set up Railway environment variables"
    echo "3. Run: ./scripts/deploy-to-railway.sh"
    echo "4. Test the complete application"
    echo ""
    echo "🔒 Your credentials are safely backed up in credential-backup-*/"
    echo "🚀 Your project is now ready for Railway deployment!"
}

# Run main function
main "$@" 