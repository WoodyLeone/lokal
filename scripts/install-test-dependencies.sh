#!/bin/bash

# Install Test Dependencies Script
# This script installs the required dependencies for testing

set -e

echo "📦 Installing test dependencies..."

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

# Install axios for HTTP requests
install_axios() {
    print_status "Installing axios for HTTP requests..."
    
    if [ -d "backend" ]; then
        cd backend
        npm install axios --save
        cd ..
        print_success "Axios installed in backend"
    fi
    
    if [ -d "LokalRN" ]; then
        cd LokalRN
        npm install axios --save
        cd ..
        print_success "Axios installed in React Native app"
    fi
}

# Install curl for health checks
install_curl() {
    print_status "Checking curl installation..."
    
    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Please install curl:"
        echo "  macOS: brew install curl"
        echo "  Ubuntu/Debian: sudo apt-get install curl"
        echo "  CentOS/RHEL: sudo yum install curl"
    else
        print_success "curl is already installed"
    fi
}

# Install jq for JSON parsing (optional)
install_jq() {
    print_status "Checking jq installation..."
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Installing jq for better JSON handling..."
        
        if command -v brew &> /dev/null; then
            brew install jq
        elif command -v apt-get &> /dev/null; then
            sudo apt-get install jq
        elif command -v yum &> /dev/null; then
            sudo yum install jq
        else
            print_warning "Could not install jq automatically. Please install manually."
        fi
    else
        print_success "jq is already installed"
    fi
}

# Create test data directory
create_test_data() {
    print_status "Creating test data directory..."
    
    mkdir -p test-data/images
    mkdir -p test-data/videos
    
    # Create sample test files
    echo "Test image data" > test-data/images/test_product_1.jpg
    echo "Test image data" > test-data/images/test_product_2.jpg
    echo "Test video data" > test-data/videos/test_video.mp4
    
    print_success "Test data directory created"
}

# Main installation function
main() {
    print_status "Starting dependency installation..."
    
    install_axios
    install_curl
    install_jq
    create_test_data
    
    print_success "All test dependencies installed!"
    
    echo ""
    print_status "Next steps:"
    echo "  1. Run the deployment script: ./scripts/deploy-and-test.sh"
    echo "  2. Or run individual tests: node scripts/test-fixes.js development"
    echo "  3. Check test results in the generated JSON files"
}

# Run main function
main "$@" 