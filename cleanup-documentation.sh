#!/bin/bash

echo "🧹 CLEANING UP REDUNDANT DOCUMENTATION"
echo "======================================"

# Remove Supabase-related documentation (no longer using Supabase)
echo "🗑️ Removing Supabase-related documentation..."
rm -f SUPABASE_CLEANUP_COMPLETE.md
rm -f SUPABASE_INTEGRATION_SUMMARY.md
rm -f STORAGE_SETUP_GUIDE.md
rm -f restore-supabase.js

# Remove old video processing documentation (superseded by new pipeline)
echo "🗑️ Removing old video processing documentation..."
rm -f YOLO_DETECTION_FIX_SUMMARY.md
rm -f VIDEO_UPLOAD_FIX_SUMMARY.md
rm -f VIDEO_UPLOAD_DEBUG_GUIDE.md
rm -f VIDEO_UPLOAD_PREVENTION_STRATEGY.md

# Remove old testing documentation
echo "🗑️ Removing old testing documentation..."
rm -f UI_FIXES_TEST_RESULTS.md
rm -f test-ui-fixes.js

# Remove old network/connection documentation
echo "🗑️ Removing old network/connection documentation..."
rm -f NETWORK_TROUBLESHOOTING_GUIDE.md
rm -f test-connection.js
rm -f test-simple-connection.js
rm -f test-full-connection.js
rm -f test-full-connectivity.js
rm -f test-local-connection.js
rm -f test-network-simple.js
rm -f test-react-native-connectivity.js
rm -f test-performance-optimized.js
rm -f test-url-construction.js

# Remove old project status documentation
echo "🗑️ Removing old project status documentation..."
rm -f PROJECT_STATUS_UPDATE.md
rm -f PROJECT_UPDATE_RAILWAY.md
rm -f FINAL_STATUS_REPORT.md
rm -f FINAL_PROJECT_UPDATE.md
rm -f PROJECT_SUMMARY.md

# Remove old Railway documentation
echo "🗑️ Removing old Railway documentation..."
rm -f RAILWAY_MIGRATION_GUIDE.md
rm -f RAILWAY_MIGRATION_COMPLETE.md
rm -f RAILWAY_DEPLOYMENT_FIX.md

# Remove old environment documentation
echo "🗑️ Removing old environment documentation..."
rm -f ENVIRONMENT_COMPARISON.md
rm -f ENVIRONMENT_FIX_SUMMARY.md
rm -f CLEANUP_SUMMARY.md

# Remove old configuration guides
echo "🗑️ Removing old configuration guides..."
rm -f FRONTEND_CONFIGURATION_GUIDE.md
rm -f HYBRID_PRODUCT_MATCHING_GUIDE.md
rm -f SETUP_GUIDE.md
rm -f RESET_GUIDE.md

# Remove old error analysis
echo "🗑️ Removing old error analysis..."
rm -f ERROR_ANALYSIS_REPORT.md
rm -f TROUBLESHOOTING.md

# Remove old platform vision
echo "🗑️ Removing old platform vision..."
rm -f UGC_PLATFORM_VISION_ALIGNMENT.md
rm -f UI_UX_IMPROVEMENTS.md

# Remove old development setup
echo "🗑️ Removing old development setup..."
rm -f LIVE_DEVELOPMENT_SETUP.md

# Remove ._ files (macOS metadata files)
echo "🗑️ Removing macOS metadata files..."
find . -name "._*" -type f -delete

echo ""
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "📚 REMAINING ESSENTIAL DOCUMENTATION:"
echo "====================================="
echo "✅ backend/VIDEO_PIPELINE_MEMORY_SUMMARY.md - Complete technical reference"
echo "✅ backend/INTEGRATION_GUIDE.md - How to use the pipeline"
echo "✅ backend/COST_OPTIMIZATION_REPORT.md - Cost analysis and savings"
echo "✅ backend/PROJECT_INTEGRATION_SUMMARY.md - Integration overview"
echo "✅ backend/VIDEO_PIPELINE_README.md - Pipeline documentation"
echo "✅ README.md - Main project readme"
echo "✅ backend/README.md - Backend readme"
echo "✅ backend/CRASH_PREVENTION_SUMMARY.md - Production stability"
echo ""
echo "🧪 REMAINING TESTING FILES:"
echo "==========================="
echo "✅ backend/test-pipeline.js - Current pipeline testing"
echo "✅ backend/integration-test.js - Current integration testing"
echo ""
echo "📊 DOCUMENTATION REDUCTION:"
echo "==========================="
echo "🗑️ Removed: ~40+ redundant documentation files"
echo "✅ Kept: 8 essential documentation files"
echo "📉 Reduction: ~80% documentation cleanup" 