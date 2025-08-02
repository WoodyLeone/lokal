#!/bin/bash

# Lokal Railway Environment Setup Script
# This script helps set up separate Railway environments for development and production

set -e

echo "🚂 Setting up Railway environments for Lokal..."

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
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Login to Railway
login_to_railway() {
    print_status "Logging into Railway..."
    if railway login; then
        print_success "Successfully logged into Railway"
    else
        print_error "Failed to login to Railway"
        exit 1
    fi
}

# Create development environment
create_dev_environment() {
    print_status "Creating development environment..."
    
    # Create development project
    if railway init --name "lokal-dev"; then
        print_success "Development project created"
    else
        print_warning "Development project may already exist"
    fi
    
    # Set development environment variables
    print_status "Setting development environment variables..."
    
    # Copy development env file
    if [ -f "backend/env.development" ]; then
        # Read the env file and set variables one by one
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]] && [[ -n "$value" ]]; then
                # Remove quotes from value
                value=$(echo "$value" | sed 's/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
                railway variables --set "$key=$value"
            fi
        done < backend/env.development
        print_success "Development environment variables set"
    else
        print_error "Development environment file not found: backend/env.development"
    fi
}

# Create production environment
create_prod_environment() {
    print_status "Creating production environment..."
    
    # Create production project
    if railway init --name "lokal-prod"; then
        print_success "Production project created"
    else
        print_warning "Production project may already exist"
    fi
    
    # Set production environment variables
    print_status "Setting production environment variables..."
    
    # Copy production env file
    if [ -f "backend/env.production" ]; then
        # Read the env file and set variables one by one
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]] && [[ -n "$value" ]]; then
                # Remove quotes from value
                value=$(echo "$value" | sed 's/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
                railway variables --set "$key=$value"
            fi
        done < backend/env.production
        print_success "Production environment variables set"
    else
        print_error "Production environment file not found: backend/env.production"
    fi
}

# Deploy to development
deploy_dev() {
    print_status "Deploying to development environment..."
    
    # Link to development project (if exists)
    railway link lokal-dev 2>/dev/null || print_warning "Development project not found, will create new one"
    
    # Deploy
    if railway up; then
        print_success "Successfully deployed to development environment"
        print_status "Development URL: $(railway domain)"
    else
        print_error "Failed to deploy to development environment"
    fi
}

# Deploy to production
deploy_prod() {
    print_status "Deploying to production environment..."
    
    # Link to production project (if exists)
    railway link lokal-prod 2>/dev/null || print_warning "Production project not found, will create new one"
    
    # Deploy
    if railway up; then
        print_success "Successfully deployed to production environment"
        print_status "Production URL: $(railway domain)"
    else
        print_error "Failed to deploy to production environment"
    fi
}

# Show environment status
show_status() {
    print_status "Current Railway environments:"
    
    echo ""
    echo "Development Environment:"
    railway link lokal-dev 2>/dev/null && railway status 2>/dev/null || echo "  Not found"
    
    echo ""
    echo "Production Environment:"
    railway link lokal-prod 2>/dev/null && railway status 2>/dev/null || echo "  Not found"
}

# Main menu
show_menu() {
    echo ""
    echo "🚂 Lokal Railway Environment Setup"
    echo "=================================="
    echo "1. Check Railway CLI installation"
    echo "2. Login to Railway"
    echo "3. Create development environment"
    echo "4. Create production environment"
    echo "5. Deploy to development"
    echo "6. Deploy to production"
    echo "7. Show environment status"
    echo "8. Setup all environments"
    echo "9. Exit"
    echo ""
    read -p "Select an option (1-9): " choice
}

# Setup all environments
setup_all() {
    print_status "Setting up all Railway environments..."
    
    check_railway_cli
    login_to_railway
    create_dev_environment
    create_prod_environment
    
    print_success "All environments created successfully!"
    print_status "Next steps:"
    echo "  1. Update environment variables with your actual API keys"
    echo "  2. Deploy to development: ./scripts/setup-railway-environments.sh"
    echo "  3. Test the development environment"
    echo "  4. Deploy to production when ready"
}

# Main script logic
main() {
    while true; do
        show_menu
        
        case $choice in
            1)
                check_railway_cli
                ;;
            2)
                login_to_railway
                ;;
            3)
                create_dev_environment
                ;;
            4)
                create_prod_environment
                ;;
            5)
                deploy_dev
                ;;
            6)
                deploy_prod
                ;;
            7)
                show_status
                ;;
            8)
                setup_all
                ;;
            9)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-9."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 