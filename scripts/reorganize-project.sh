#!/bin/bash

# Lokal Project Reorganization Script
# This script helps reorganize the project structure for better organization

set -e

echo "📁 Reorganizing Lokal project structure..."

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

# Create new directory structure
create_directory_structure() {
    print_status "Creating new directory structure..."
    
    # Create main directories
    mkdir -p production/backend
    mkdir -p production/mobile
    mkdir -p development/backend-dev
    mkdir -p development/mobile-dev
    mkdir -p development/ios-native
    mkdir -p shared/assets
    mkdir -p shared/docs
    mkdir -p shared/scripts
    
    print_success "Directory structure created"
}

# Move production backend files
move_production_backend() {
    print_status "Moving production backend files..."
    
    # Copy current backend to production
    if [ -d "backend" ]; then
        cp -r backend/* production/backend/
        print_success "Backend files moved to production/"
    else
        print_warning "Backend directory not found"
    fi
}

# Move React Native app to production
move_production_mobile() {
    print_status "Moving React Native app to production..."
    
    # Copy current React Native app to production
    if [ -d "LokalRN" ]; then
        cp -r LokalRN/* production/mobile/
        print_success "React Native app moved to production/mobile/"
    else
        print_warning "LokalRN directory not found"
    fi
}

# Move iOS native app to development
move_ios_native() {
    print_status "Moving iOS native app to development..."
    
    # Copy iOS native app to development
    if [ -d "Lokal" ]; then
        cp -r Lokal/* development/ios-native/
        print_success "iOS native app moved to development/ios-native/"
    else
        print_warning "Lokal directory not found"
    fi
}

# Move shared assets
move_shared_assets() {
    print_status "Moving shared assets..."
    
    # Move icons and assets
    if [ -d "icon" ]; then
        cp -r icon/* shared/assets/
        print_success "Icons moved to shared/assets/"
    fi
    
    # Move documentation
    if [ -f "README.md" ]; then
        cp README.md shared/docs/
    fi
    
    # Move other documentation files
    for file in *.md; do
        if [ -f "$file" ]; then
            cp "$file" shared/docs/
        fi
    done
    
    print_success "Shared assets moved"
}

# Move scripts to shared
move_scripts() {
    print_status "Moving scripts to shared..."
    
    # Move existing scripts
    if [ -d "scripts" ]; then
        cp -r scripts/* shared/scripts/
        print_success "Scripts moved to shared/scripts/"
    fi
    
    # Move engine scripts
    if [ -d "engine" ]; then
        cp -r engine shared/
        print_success "Engine moved to shared/"
    fi
}

# Create development copies
create_development_copies() {
    print_status "Creating development copies..."
    
    # Create development backend copy
    if [ -d "production/backend" ]; then
        cp -r production/backend/* development/backend-dev/
        print_success "Development backend copy created"
    fi
    
    # Create development mobile copy
    if [ -d "production/mobile" ]; then
        cp -r production/mobile/* development/mobile-dev/
        print_success "Development mobile copy created"
    fi
}

# Update package.json files for new structure
update_package_files() {
    print_status "Updating package.json files..."
    
    # Update production backend package.json
    if [ -f "production/backend/package.json" ]; then
        sed -i '' 's/"name": "lokal-backend"/"name": "lokal-backend-prod"/' production/backend/package.json
        print_success "Production backend package.json updated"
    fi
    
    # Update development backend package.json
    if [ -f "development/backend-dev/package.json" ]; then
        sed -i '' 's/"name": "lokal-backend"/"name": "lokal-backend-dev"/' development/backend-dev/package.json
        print_success "Development backend package.json updated"
    fi
    
    # Update production mobile package.json
    if [ -f "production/mobile/package.json" ]; then
        sed -i '' 's/"name": "lokal"/"name": "lokal-mobile-prod"/' production/mobile/package.json
        print_success "Production mobile package.json updated"
    fi
    
    # Update development mobile package.json
    if [ -f "development/mobile-dev/package.json" ]; then
        sed -i '' 's/"name": "lokal"/"name": "lokal-mobile-dev"/' development/mobile-dev/package.json
        print_success "Development mobile package.json updated"
    fi
}

# Create new README files
create_readme_files() {
    print_status "Creating README files for new structure..."
    
    # Production README
    cat > production/README.md << 'EOF'
# Lokal Production

This directory contains the production-ready code for the Lokal application.

## Structure
- `backend/` - Production backend server
- `mobile/` - Production React Native mobile app

## Deployment
- Backend: Deployed to Railway production environment
- Mobile: Built and distributed through app stores

## Environment
- Uses production environment variables
- Demo mode disabled
- Production matching enabled
- Higher confidence thresholds for detection
EOF

    # Development README
    cat > development/README.md << 'EOF'
# Lokal Development

This directory contains development and testing code for the Lokal application.

## Structure
- `backend-dev/` - Development backend server
- `mobile-dev/` - Development React Native mobile app
- `ios-native/` - Legacy iOS native app

## Development Workflow
1. Make changes in development directories
2. Test thoroughly
3. Deploy to development environment
4. Promote to production when ready

## Environment
- Uses development environment variables
- Demo mode enabled for testing
- Lower confidence thresholds for testing
- Debug logging enabled
EOF

    # Shared README
    cat > shared/README.md << 'EOF'
# Lokal Shared Resources

This directory contains shared resources used across all environments.

## Structure
- `assets/` - Images, icons, and other static assets
- `docs/` - Documentation files
- `scripts/` - Build and deployment scripts
- `engine/` - AI/ML engine (shared across environments)

## Usage
These resources are shared between development and production environments.
EOF

    print_success "README files created"
}

# Create backup of current structure
create_backup() {
    print_status "Creating backup of current structure..."
    
    backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Copy current files to backup
    cp -r backend "$backup_dir/" 2>/dev/null || true
    cp -r LokalRN "$backup_dir/" 2>/dev/null || true
    cp -r Lokal "$backup_dir/" 2>/dev/null || true
    cp -r icon "$backup_dir/" 2>/dev/null || true
    cp -r scripts "$backup_dir/" 2>/dev/null || true
    cp -r engine "$backup_dir/" 2>/dev/null || true
    cp *.md "$backup_dir/" 2>/dev/null || true
    
    print_success "Backup created in $backup_dir"
}

# Show new structure
show_new_structure() {
    print_status "New project structure:"
    echo ""
    echo "📁 Lokal/"
    echo "├── 📁 production/"
    echo "│   ├── 📁 backend/          # Production backend"
    echo "│   └── 📁 mobile/           # Production React Native app"
    echo "├── 📁 development/"
    echo "│   ├── 📁 backend-dev/      # Development backend"
    echo "│   ├── 📁 mobile-dev/       # Development React Native app"
    echo "│   └── 📁 ios-native/       # Legacy iOS native app"
    echo "├── 📁 shared/"
    echo "│   ├── 📁 assets/           # Shared images and icons"
    echo "│   ├── 📁 docs/             # Documentation"
    echo "│   ├── 📁 scripts/          # Build and deployment scripts"
    echo "│   └── 📁 engine/           # AI/ML engine"
    echo "└── 📁 backup-YYYYMMDD-HHMMSS/  # Backup of original structure"
    echo ""
}

# Main reorganization function
reorganize_project() {
    print_status "Starting project reorganization..."
    
    # Create backup first
    create_backup
    
    # Create new structure
    create_directory_structure
    
    # Move files to new structure
    move_production_backend
    move_production_mobile
    move_ios_native
    move_shared_assets
    move_scripts
    
    # Create development copies
    create_development_copies
    
    # Update package files
    update_package_files
    
    # Create README files
    create_readme_files
    
    print_success "Project reorganization completed!"
    show_new_structure
    
    print_status "Next steps:"
    echo "  1. Review the new structure"
    echo "  2. Update any hardcoded paths in your code"
    echo "  3. Test the development environment"
    echo "  4. Deploy to production when ready"
    echo "  5. Remove old directories when confident everything works"
}

# Show menu
show_menu() {
    echo ""
    echo "📁 Lokal Project Reorganization"
    echo "==============================="
    echo "1. Create backup only"
    echo "2. Show new structure"
    echo "3. Reorganize project (full)"
    echo "4. Exit"
    echo ""
    read -p "Select an option (1-4): " choice
}

# Main script logic
main() {
    while true; do
        show_menu
        
        case $choice in
            1)
                create_backup
                ;;
            2)
                show_new_structure
                ;;
            3)
                reorganize_project
                ;;
            4)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-4."
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