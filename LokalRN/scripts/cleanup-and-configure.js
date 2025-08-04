#!/usr/bin/env node

/**
 * Cleanup and Configuration Script for Lokal UGC Shoppable Video Platform
 * 
 * This script ensures the project is properly configured for the new design pivot.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Lokal UGC Shoppable Video Platform cleanup and configuration...\n');

// Configuration checklist
const configChecklist = {
  types: false,
  environment: false,
  appConfig: false,
  dependencies: false,
  permissions: false,
  imports: false
};

// Check if types are properly centralized
function checkTypes() {
  console.log('📝 Checking type definitions...');
  
  const typesFile = path.join(__dirname, '../src/types/index.ts');
  if (fs.existsSync(typesFile)) {
    const content = fs.readFileSync(typesFile, 'utf8');
    
    // Check for new tracking types
    const hasTrackedItem = content.includes('interface TrackedItem');
    const hasHotspot = content.includes('interface Hotspot');
    const hasVideoMetadata = content.includes('interface VideoMetadata');
    
    if (hasTrackedItem && hasHotspot && hasVideoMetadata) {
      console.log('✅ Types are properly centralized');
      configChecklist.types = true;
    } else {
      console.log('❌ Missing tracking types in types/index.ts');
    }
  } else {
    console.log('❌ Types file not found');
  }
}

// Check environment configuration
function checkEnvironment() {
  console.log('\n🔧 Checking environment configuration...');
  
  const envFile = path.join(__dirname, '../src/config/env.ts');
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    
    // Check for new interactive video features
    const hasInteractiveVideos = content.includes('ENABLE_INTERACTIVE_VIDEOS');
    const hasItemTracking = content.includes('ENABLE_ITEM_TRACKING');
    const hasHotspots = content.includes('ENABLE_HOTSPOTS');
    const hasTrackingConfig = content.includes('MAX_TRACKED_ITEMS');
    
    if (hasInteractiveVideos && hasItemTracking && hasHotspots && hasTrackingConfig) {
      console.log('✅ Environment configuration updated for interactive features');
      configChecklist.environment = true;
    } else {
      console.log('❌ Missing interactive video environment variables');
    }
  } else {
    console.log('❌ Environment file not found');
  }
}

// Check app configuration
function checkAppConfig() {
  console.log('\n📱 Checking app configuration...');
  
  const appConfigFile = path.join(__dirname, '../app.json');
  if (fs.existsSync(appConfigFile)) {
    const content = fs.readFileSync(appConfigFile, 'utf8');
    const config = JSON.parse(content);
    
    // Check for updated app name and permissions
    const hasUpdatedName = config.expo.name.includes('Interactive Shoppable Videos');
    const hasCameraPermission = content.includes('NSCameraUsageDescription');
    const hasPhotoPermission = content.includes('NSPhotoLibraryUsageDescription');
    const hasUpdatedSplash = content.includes('"backgroundColor": "#6366f1"');
    
    if (hasUpdatedName && hasCameraPermission && hasPhotoPermission && hasUpdatedSplash) {
      console.log('✅ App configuration updated for UGC features');
      configChecklist.appConfig = true;
    } else {
      console.log('❌ App configuration needs updates');
    }
  } else {
    console.log('❌ App config file not found');
  }
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packageFile = path.join(__dirname, '../package.json');
  if (fs.existsSync(packageFile)) {
    const content = fs.readFileSync(packageFile, 'utf8');
    const pkg = JSON.parse(content);
    
    // Check for required dependencies
    const requiredDeps = [
      'expo-av',
      'expo-image-picker',
      '@react-navigation/native',
      '@react-navigation/bottom-tabs',
      '@expo/vector-icons'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      console.log('✅ All required dependencies are installed');
      configChecklist.dependencies = true;
    } else {
      console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    }
  } else {
    console.log('❌ Package.json not found');
  }
}

// Check component imports
function checkImports() {
  console.log('\n🔗 Checking component imports...');
  
  const uploadScreenFile = path.join(__dirname, '../src/screens/UploadScreen.tsx');
  const homeScreenFile = path.join(__dirname, '../src/screens/HomeScreen.tsx');
  const videoPlayerFile = path.join(__dirname, '../src/components/VideoPlayer.tsx');
  const trackingOverlayFile = path.join(__dirname, '../src/components/ItemTrackingOverlay.tsx');
  
  let allImportsCorrect = true;
  
  // Check UploadScreen imports
  if (fs.existsSync(uploadScreenFile)) {
    const content = fs.readFileSync(uploadScreenFile, 'utf8');
    const hasTrackingImport = content.includes('import { TrackedItem, VideoMetadata } from \'../types\'');
    const hasOverlayImport = content.includes('import { ItemTrackingOverlay } from \'../components/ItemTrackingOverlay\'');
    
    if (!hasTrackingImport || !hasOverlayImport) {
      console.log('❌ UploadScreen missing proper imports');
      allImportsCorrect = false;
    }
  }
  
  // Check VideoPlayer imports
  if (fs.existsSync(videoPlayerFile)) {
    const content = fs.readFileSync(videoPlayerFile, 'utf8');
    const hasHotspotImport = content.includes('import { Hotspot } from \'../types\'');
    
    if (!hasHotspotImport) {
      console.log('❌ VideoPlayer missing Hotspot import');
      allImportsCorrect = false;
    }
  }
  
  // Check ItemTrackingOverlay imports
  if (fs.existsSync(trackingOverlayFile)) {
    const content = fs.readFileSync(trackingOverlayFile, 'utf8');
    const hasTrackedItemImport = content.includes('import { TrackedItem } from \'../types\'');
    
    if (!hasTrackedItemImport) {
      console.log('❌ ItemTrackingOverlay missing TrackedItem import');
      allImportsCorrect = false;
    }
  }
  
  if (allImportsCorrect) {
    console.log('✅ All component imports are correct');
    configChecklist.imports = true;
  }
}

// Generate summary report
function generateReport() {
  console.log('\n📊 Configuration Summary:');
  console.log('========================');
  
  Object.entries(configChecklist).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    console.log(`${status} ${name}`);
  });
  
  const allPassed = Object.values(configChecklist).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 All configurations are properly set up!');
    console.log('🚀 Your Lokal UGC Shoppable Video Platform is ready to go!');
  } else {
    console.log('\n⚠️  Some configurations need attention. Please review the issues above.');
  }
  
  return allPassed;
}

// Main execution
function main() {
  checkTypes();
  checkEnvironment();
  checkAppConfig();
  checkDependencies();
  checkImports();
  
  const allConfigured = generateReport();
  
  if (allConfigured) {
    console.log('\n✨ Next steps:');
    console.log('1. Run: npm install (if dependencies were missing)');
    console.log('2. Run: npx expo start');
    console.log('3. Test the new upload flow with item tracking');
    console.log('4. Test interactive video playback with hotspots');
  } else {
    console.log('\n🔧 To fix issues:');
    console.log('1. Review the error messages above');
    console.log('2. Run: npm install (if dependencies are missing)');
    console.log('3. Check that all files are properly updated');
    console.log('4. Re-run this script to verify fixes');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, configChecklist }; 