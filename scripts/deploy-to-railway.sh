#!/bin/bash

# Railway Deployment Script for Lokal Backend
# This script automates the deployment process to Railway

set -e  # Exit on any error

echo "🚂 Starting Railway deployment for Lokal Backend..."

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

# Check if Railway CLI is installed
check_railway_cli() {
    print_status "Checking Railway CLI installation..."
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check if we're in the correct directory
check_directory() {
    print_status "Checking project structure..."
    if [ ! -f "railway.json" ]; then
        print_error "railway.json not found. Please run this script from the project root."
        exit 1
    fi
    if [ ! -f "backend/package.json" ]; then
        print_error "backend/package.json not found. Please run this script from the project root."
        exit 1
    fi
    print_success "Project structure is correct"
}

# Check environment variables
check_environment() {
    print_status "Checking environment variables..."
    
    # Check if we have a .env file in backend
    if [ -f "backend/.env" ]; then
        print_warning "Found backend/.env file. This will be used for local development only."
        print_warning "For Railway deployment, set environment variables in Railway dashboard."
    fi
    
    # Check if we have the credential backup
    if [ -d "credential-backup-*" ]; then
        print_success "Credential backup found"
    else
        print_warning "No credential backup found. Run ./scripts/backup-credentials.sh first."
    fi
}

# Login to Railway
login_railway() {
    print_status "Logging into Railway..."
    if ! railway login; then
        print_error "Failed to login to Railway"
        exit 1
    fi
    print_success "Logged into Railway"
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    # Check if we're already in a Railway project
    if railway status &> /dev/null; then
        print_status "Already in Railway project, deploying..."
        if railway up; then
            print_success "Deployment successful!"
        else
            print_error "Deployment failed"
            exit 1
        fi
    else
        print_status "Initializing new Railway project..."
        if railway init; then
            print_success "Railway project initialized"
            print_status "Deploying..."
            if railway up; then
                print_success "Deployment successful!"
            else
                print_error "Deployment failed"
                exit 1
            fi
        else
            print_error "Failed to initialize Railway project"
            exit 1
        fi
    fi
}

# Get deployment URL
get_deployment_url() {
    print_status "Getting deployment URL..."
    if railway status; then
        print_success "Deployment URL available in Railway dashboard"
    else
        print_warning "Could not get deployment status"
    fi
}

# Set up environment variables
setup_environment_variables() {
    print_status "Setting up environment variables..."
    print_warning "Please set the following environment variables in Railway dashboard:"
    echo ""
    echo "Required:"
    echo "  - DATABASE_URL (Railway PostgreSQL connection string)"
    echo "  - REDIS_URL (Railway Redis connection string)"
    echo "  - JWT_SECRET (Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "  - REFRESH_SECRET (Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "  - SESSION_SECRET (Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo ""
    echo "Optional:"
    echo "  - OPENAI_API_KEY (For AI features)"
    echo "  - SUPABASE_URL (For legacy support)"
    echo "  - SUPABASE_ANON_KEY (For legacy support)"
    echo "  - SUPABASE_SERVICE_ROLE_KEY (For legacy support)"
    echo ""
    echo "You can set these in the Railway dashboard under your project's Variables tab."
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        print_status "Testing health endpoint at $DEPLOYMENT_URL/api/health"
        
        # Test health endpoint
        if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
            print_success "Health check passed!"
            print_success "Deployment is working correctly"
        else
            print_warning "Health check failed. The deployment might still be starting up."
            print_warning "Please check the Railway logs for more information."
        fi
    else
        print_warning "Could not get deployment URL for testing"
    fi
}

# Main deployment process
main() {
    echo "🚀 Lokal Railway Deployment Script"
    echo "=================================="
    echo ""
    
    check_railway_cli
    check_directory
    check_environment
    login_railway
    deploy_to_railway
    get_deployment_url
    setup_environment_variables
    test_deployment
    
    echo ""
    print_success "Railway deployment process completed!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Railway dashboard"
    echo "2. Update your React Native app with the new Railway URL"
    echo "3. Test the complete application"
    echo ""
    echo "For help, check the Railway dashboard or run: railway logs"
}

# Run main function
main "$@" 