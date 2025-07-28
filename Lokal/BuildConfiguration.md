# Build Configuration Guide for Lokal

## Xcode Project Settings

### General Settings
- **Display Name**: Lokal
- **Bundle Identifier**: com.yourcompany.lokal (update with your organization)
- **Version**: 1.0.0
- **Build**: 1
- **Deployment Target**: iOS 15.0
- **Devices**: iPhone, iPad

### Signing & Capabilities
- **Team**: Your Apple Developer Team
- **Signing Certificate**: Automatic
- **Provisioning Profile**: Automatic

### Build Settings

#### Swift Compiler
- **Swift Language Version**: Swift 5.0
- **Swift Compilation Mode**: Incremental
- **Optimization Level**: Fast [-O]

#### Linking
- **Other Linker Flags**: $(inherited)
- **Runpath Search Paths**: $(inherited) @executable_path/Frameworks

#### Packaging
- **Product Bundle Identifier**: com.yourcompany.lokal
- **Product Name**: $(TARGET_NAME)
- **Marketing Version**: 1.0
- **Current Project Version**: 1

#### Info.plist
- **Info.plist File**: Info.plist
- **Generate Info.plist File**: NO

## Required Frameworks

### System Frameworks
- **SwiftUI**: UI framework
- **AVKit**: Video playback
- **PhotosUI**: Photo picker
- **Foundation**: Core functionality

### Optional Frameworks
- **CoreLocation**: Location services (if needed)
- **CoreData**: Data persistence (if needed)

## Build Configurations

### Debug Configuration
```bash
# Build for development
xcodebuild -project Lokal.xcodeproj -scheme Lokal -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Release Configuration
```bash
# Build for distribution
xcodebuild -project Lokal.xcodeproj -scheme Lokal -configuration Release -destination 'generic/platform=iOS'
```

## Archive Configuration

### Archive Settings
- **Archive Name**: Lokal
- **Distribution Method**: App Store Connect
- **Upload to App Store Connect**: Yes
- **Include Bitcode**: No
- **Upload Symbols**: Yes

### Archive Command
```bash
# Create archive
xcodebuild -project Lokal.xcodeproj -scheme Lokal -configuration Release -archivePath build/Lokal.xcarchive archive

# Export archive
xcodebuild -exportArchive -archivePath build/Lokal.xcarchive -exportPath build/export -exportOptionsPlist exportOptions.plist
```

## Export Options

### exportOptions.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

## Testing Configuration

### Unit Tests
- **Target**: LokalTests
- **Framework**: Testing (iOS 18+)
- **Test Plan**: Default

### UI Tests
- **Target**: LokalUITests
- **Framework**: XCTest
- **Test Plan**: Default

### Test Commands
```bash
# Run unit tests
xcodebuild test -project Lokal.xcodeproj -scheme Lokal -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild test -project Lokal.xcodeproj -scheme Lokal -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:LokalUITests
```

## Code Signing

### Development
- **Code Signing Style**: Automatic
- **Development Team**: Your Team ID
- **Provisioning Profile**: Automatic

### Distribution
- **Code Signing Style**: Automatic
- **Distribution Certificate**: App Store
- **Provisioning Profile**: App Store

## Build Phases

### Compile Sources
- LokalApp.swift
- ContentView.swift

### Copy Bundle Resources
- Assets.xcassets
- Info.plist
- LaunchScreen.storyboard

### Link Binary With Libraries
- SwiftUI.framework
- AVKit.framework
- PhotosUI.framework

## Preprocessor Macros

### Debug
- DEBUG=1

### Release
- (none)

## Environment Variables

### Development
```bash
export DEVELOPMENT_TEAM="YOUR_TEAM_ID"
export BUNDLE_IDENTIFIER="com.yourcompany.lokal"
export MARKETING_VERSION="1.0"
export CURRENT_PROJECT_VERSION="1"
```

### Production
```bash
export DEVELOPMENT_TEAM="YOUR_TEAM_ID"
export BUNDLE_IDENTIFIER="com.yourcompany.lokal"
export MARKETING_VERSION="1.0"
export CURRENT_PROJECT_VERSION="1"
```

## Build Scripts

### Pre-build Script
```bash
#!/bin/bash
# Validate Info.plist
if [ ! -f "Info.plist" ]; then
    echo "Error: Info.plist not found"
    exit 1
fi

# Validate assets
if [ ! -d "Assets.xcassets" ]; then
    echo "Error: Assets.xcassets not found"
    exit 1
fi
```

### Post-build Script
```bash
#!/bin/bash
# Copy documentation
cp README.md "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/"
cp PrivacyPolicy.md "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/"
cp TermsOfService.md "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/"
```

## Continuous Integration

### GitHub Actions
```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Select Xcode
      run: sudo xcode-select -switch /Applications/Xcode_15.0.app
      
    - name: Build
      run: |
        xcodebuild -project Lokal.xcodeproj -scheme Lokal -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build
        
    - name: Test
      run: |
        xcodebuild test -project Lokal.xcodeproj -scheme Lokal -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Fastlane
```ruby
# Fastfile
platform :ios do
  desc "Build and test Lokal"
  lane :build_and_test do
    scan(
      project: "Lokal.xcodeproj",
      scheme: "Lokal",
      device: "iPhone 15"
    )
  end
  
  desc "Build for App Store"
  lane :build_for_app_store do
    gym(
      project: "Lokal.xcodeproj",
      scheme: "Lokal",
      configuration: "Release",
      export_method: "app-store"
    )
  end
end
```

## Troubleshooting

### Common Build Issues
1. **Code Signing**: Ensure team ID is correct
2. **Bundle Identifier**: Must be unique
3. **Deployment Target**: Check minimum iOS version
4. **Missing Files**: Verify all required files are included

### Validation
- Use `xcodebuild -validate` to check project configuration
- Test on multiple device types
- Verify all required permissions are declared
- Check App Store Connect requirements

## Performance Optimization

### Build Time
- Use incremental compilation
- Enable parallel builds
- Optimize asset catalogs

### App Size
- Compress assets
- Remove unused code
- Optimize images

### Runtime Performance
- Profile with Instruments
- Monitor memory usage
- Optimize UI rendering 