# Lokal Project Reorganization & Production Fix Plan

## Issues Identified from Live Production Test

### 1. Detection Issues
- **Problem**: Detection reveals wrong items (detecting irrelevant objects)
- **Root Cause**: Object detection is too broad and not context-aware
- **Solution**: Implement smarter detection with user intent filtering

### 2. Suggestions Issues  
- **Problem**: AI suggestions follow wrong detected items instead of user intent
- **Root Cause**: Suggestions are purely based on detected objects, not user context
- **Solution**: Implement context-aware suggestion system with manual product prioritization

### 3. Auto Matching Issues
- **Problem**: Auto matching still displays demo mode sample data
- **Root Cause**: Product matching falls back to demo data when real detection fails
- **Solution**: Implement proper production product database and matching logic

### 4. Project Organization Issues
- **Problem**: Confusing file structure with multiple project folders
- **Root Cause**: Mixed development approaches (iOS native + React Native + Backend)
- **Solution**: Reorganize into clear production vs development structure

### 5. Environment Separation Issues
- **Problem**: No separation between development and production environments
- **Root Cause**: Single environment configuration
- **Solution**: Implement proper dev/staging/production environment separation

## Proposed Project Structure

```
Lokal/
├── production/                    # Production-ready code
│   ├── backend/                  # Production backend
│   ├── mobile/                   # React Native app (production)
│   └── web/                      # Web interface (if needed)
├── development/                  # Development and testing
│   ├── backend-dev/              # Development backend
│   ├── mobile-dev/               # Development mobile app
│   └── ios-native/               # iOS native app (legacy)
├── shared/                       # Shared resources
│   ├── assets/                   # Images, icons, etc.
│   ├── docs/                     # Documentation
│   └── scripts/                  # Build and deployment scripts
└── engine/                       # AI/ML engine (shared)
```

## Implementation Plan

### Phase 1: Environment Separation (Priority: HIGH)
1. Create separate Railway projects for dev/staging/production
2. Implement environment-specific configurations
3. Set up proper environment variable management

### Phase 2: Detection & Matching Fixes (Priority: HIGH)
1. Fix object detection to be more context-aware
2. Implement proper product matching logic
3. Add user intent prioritization in suggestions

### Phase 3: Project Reorganization (Priority: MEDIUM)
1. Reorganize file structure
2. Clean up duplicate code
3. Establish clear development workflow

### Phase 4: Production Optimization (Priority: MEDIUM)
1. Performance optimization
2. Error handling improvements
3. Monitoring and logging enhancements

## Detailed Fixes

### Detection System Improvements
- Add confidence thresholds for object detection
- Implement context filtering (ignore irrelevant objects)
- Add user feedback integration for detection accuracy
- Implement manual product name prioritization

### Suggestion System Improvements
- Base suggestions on user intent, not just detected objects
- Implement learning from user selections
- Add category-based suggestions
- Improve suggestion relevance scoring

### Product Matching Improvements
- Replace demo data with real product database
- Implement proper matching algorithms
- Add user preference learning
- Improve matching accuracy with feedback

### Environment Management
- Separate development and production databases
- Implement proper environment variable management
- Add staging environment for testing
- Set up proper deployment pipelines

## Next Steps
1. Create environment separation first
2. Fix detection and matching logic
3. Reorganize project structure
4. Implement production optimizations 