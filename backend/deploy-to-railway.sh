#!/bin/bash

# 🚂 Railway Deployment Script for Lokal Backend
# This script helps prepare and deploy the backend to Railway

set -e

echo "🚂 Railway Deployment Script for Lokal Backend"
echo "=============================================="

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

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -f "railway.json" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Function to run security audit
run_security_audit() {
    print_status "Running security audit..."
    npm audit
    print_success "Security audit completed"
}

# Function to test the application locally
test_locally() {
    print_status "Testing application locally..."
    
    # Check if environment file exists
    if [ ! -f "config.env" ]; then
        print_warning "config.env not found. Creating from example..."
        cp config.env.example config.env
    fi
    
    # Test if the server starts
    print_status "Testing server startup..."
    timeout 10s npm start || {
        print_error "Server failed to start within 10 seconds"
        exit 1
    }
    
    print_success "Local test completed"
}

# Function to generate production secrets
generate_secrets() {
    print_status "Generating production secrets..."
    
    SESSION_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    echo "Generated Session Secret: $SESSION_SECRET"
    echo "Generated JWT Secret: $JWT_SECRET"
    
    print_success "Secrets generated successfully"
    print_warning "Make sure to update these in Railway dashboard"
}

# Function to show deployment instructions
show_deployment_instructions() {
    echo ""
    echo "🚀 Railway Deployment Instructions"
    echo "=================================="
    echo ""
    echo "1. Go to https://railway.app"
    echo "2. Sign up/Login with your GitHub account"
    echo "3. Click 'New Project'"
    echo "4. Select 'Deploy from GitHub repo'"
    echo "5. Choose your Lokal repository"
    echo "6. Select the 'backend' folder as source"
    echo "7. Click 'Deploy'"
    echo ""
    echo "📋 Environment Variables to Set:"
    echo "Copy the contents of 'railway.env.example' to Railway dashboard"
    echo ""
    echo "🧪 Testing Commands:"
    echo "Replace YOUR_RAILWAY_URL with your actual Railway URL"
    echo ""
    echo "  # Health check"
    echo "  curl https://YOUR_RAILWAY_URL/api/health"
    echo ""
    echo "  # Database health"
    echo "  curl https://YOUR_RAILWAY_URL/api/health/database"
    echo ""
    echo "  # Products endpoint"
    echo "  curl https://YOUR_RAILWAY_URL/api/products"
    echo ""
}

# Function to show testing commands
show_testing_commands() {
    echo ""
    echo "🧪 Testing Commands"
    echo "==================="
    echo ""
    echo "Replace YOUR_RAILWAY_URL with your actual Railway URL"
    echo ""
    echo "Health Checks:"
    echo "  curl https://YOUR_RAILWAY_URL/api/health"
    echo "  curl https://YOUR_RAILWAY_URL/api/health/database"
    echo "  curl https://YOUR_RAILWAY_URL/api/health/cache"
    echo "  curl https://YOUR_RAILWAY_URL/api/health/ready"
    echo "  curl https://YOUR_RAILWAY_URL/api/health/live"
    echo ""
    echo "API Endpoints:"
    echo "  curl https://YOUR_RAILWAY_URL/api/products"
    echo "  curl -X POST https://YOUR_RAILWAY_URL/api/videos/upload-file \\"
    echo "    -F \"video=@test-video.mp4\" \\"
    echo "    -F \"title=Test Video\" \\"
    echo "    -F \"description=Test Description\""
    echo ""
}

# Function to check Railway CLI
check_railway_cli() {
    print_status "Checking Railway CLI..."
    
    if command -v railway &> /dev/null; then
        print_success "Railway CLI is installed"
        echo "Available Railway CLI commands:"
        echo "  railway login"
        echo "  railway up"
        echo "  railway logs"
        echo "  railway status"
    else
        print_warning "Railway CLI not installed"
        echo "To install Railway CLI:"
        echo "  npm install -g @railway/cli"
    fi
}

# Main execution
main() {
    case "${1:-all}" in
        "prerequisites")
            check_prerequisites
            ;;
        "install")
            install_dependencies
            ;;
        "audit")
            run_security_audit
            ;;
        "test")
            test_locally
            ;;
        "secrets")
            generate_secrets
            ;;
        "deploy")
            show_deployment_instructions
            ;;
        "test-commands")
            show_testing_commands
            ;;
        "railway-cli")
            check_railway_cli
            ;;
        "all")
            check_prerequisites
            install_dependencies
            run_security_audit
            generate_secrets
            show_deployment_instructions
            check_railway_cli
            ;;
        *)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  prerequisites  - Check if all prerequisites are met"
            echo "  install        - Install dependencies"
            echo "  audit          - Run security audit"
            echo "  test           - Test application locally"
            echo "  secrets        - Generate production secrets"
            echo "  deploy         - Show deployment instructions"
            echo "  test-commands  - Show testing commands"
            echo "  railway-cli    - Check Railway CLI installation"
            echo "  all            - Run all checks (default)"
            ;;
    esac
}

# Run main function
main "$@" 