const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const learningService = require('./learningService');

class EnhancedObjectDetectionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/enhanced_detect_objects.py');
    this.confidenceThreshold = process.env.YOLO_CONFIDENCE_THRESHOLD || 0.6;
    this.maxFrames = process.env.MAX_FRAMES || 15;
  }

  async detectObjects(videoPath) {
    return new Promise((resolve, reject) => {
      console.log('🔍 Starting enhanced object detection...');
      console.log(`📹 Video path: ${videoPath}`);
      console.log(`🎯 Confidence threshold: ${this.confidenceThreshold}`);
      console.log(`📸 Max frames: ${this.maxFrames}`);

      const options = {
        mode: 'text',
        pythonPath: 'python3',
        pythonOptions: ['-u'], // unbuffered output
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [videoPath]
      };

      const pyshell = new PythonShell(path.basename(this.pythonScriptPath), options);
      let results = [];
      let hasValidResult = false;
      let errorMessage = null;
      let jsonOutput = '';

      pyshell.on('message', function (message) {
        try {
          console.log('🐍 Python output:', message);
          
          // Try to parse as JSON
          try {
            const jsonData = JSON.parse(message);
            console.log('🔍 Parsed JSON data:', jsonData);
            
            if (jsonData.objects && Array.isArray(jsonData.objects)) {
              results = jsonData.objects;
              hasValidResult = true;
              console.log('✅ Enhanced detection results:', results);
              console.log(`📊 Detection method: ${jsonData.detection_method}`);
              console.log(`⏱️ Processing time: ${jsonData.processing_time}`);
              console.log(`📸 Frames processed: ${jsonData.frame_count}`);
              console.log(`🎯 Total detections: ${jsonData.total_detections}`);
              console.log(`✅ Validated detections: ${jsonData.validated_detections}`);
            } else if (jsonData.error) {
              errorMessage = jsonData.error;
              console.error('❌ Python script error:', jsonData.error);
            } else {
              console.log('⚠️ JSON parsed but no objects array found:', jsonData);
            }
          } catch (jsonError) {
            // Not JSON, just a log message - ignore
            console.log('📝 Python log:', message);
          }
        } catch (error) {
          console.error('❌ Error processing Python output:', error);
          console.error('Raw message:', message);
        }
      });

      pyshell.end(function (err) {
        if (err) {
          console.error('❌ Python script execution error:', err);
          console.log('🔄 Detection failed due to Python error');
          resolve([]); // Return empty array instead of fake objects
        } else {
          if (!hasValidResult || results.length === 0) {
            if (errorMessage) {
              console.log(`⚠️ Detection failed: ${errorMessage}`);
            } else {
              console.log('⚠️ No valid objects detected');
            }
            console.log('🔄 No objects detected - returning empty result');
            resolve([]); // Return empty array instead of fake objects
          } else {
            console.log(`🎉 Enhanced detection successful: ${results.length} objects found`);
            console.log(`📋 Original objects: ${results}`);
            
            // Store original objects before filtering
            const originalObjects = [...results];
            
            // Filter out non-product objects
            results = this.filterProductObjects(results);
            console.log(`🔍 After filtering: ${results}`);
            
            if (results.length === 0) {
              console.log('🔄 No product objects found after filtering');
              // Use context-aware suggestions instead of random items
              const contextItems = this.getContextAwareItems(originalObjects, videoPath);
              if (contextItems.length > 0) {
                console.log('🎯 Using context-aware suggestions:', contextItems);
                results = contextItems;
              } else {
                console.log('🔄 No context-aware suggestions - returning empty result');
                results = [];
              }
            }
            resolve(results);
          }
        }
      }.bind(this));
    });
  }

  // Filter out non-product objects (like 'person', 'animal', etc.)
  filterProductObjects(objects) {
    const nonProductObjects = [
      'person', 'people', 'human', 'man', 'woman', 'boy', 'girl', 'child', 'children',
      'animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'goat',
      'background', 'sky', 'ground', 'floor', 'wall', 'ceiling', 'tree', 'grass', 'flower'
    ];

    const filteredObjects = objects.filter(obj => 
      !nonProductObjects.includes(obj.toLowerCase())
    );

    console.log(`🔍 Filtered objects: ${objects} -> ${filteredObjects}`);
    return filteredObjects;
  }

  // Get context-aware items when people are detected
  getContextAwareItems(originalObjects, videoPath = null) {
    console.log('🔍 Analyzing context for detected objects:', originalObjects);
    
    // Use learning service for improved suggestions if video path is provided
    if (videoPath && originalObjects.length > 0) {
      const learningSuggestions = learningService.getImprovedContextSuggestions(originalObjects, videoPath);
      if (learningSuggestions.length > 0) {
        console.log('🧠 Using learning-based suggestions:', learningSuggestions);
        return learningSuggestions;
      }
    }
    
    // Fallback to rule-based suggestions
    if (originalObjects.includes('person')) {
      // Check for outdoor/activity context
      const outdoorContext = ['tree', 'grass', 'sky', 'ground', 'park', 'outdoor'];
      const hasOutdoorContext = originalObjects.some(obj => 
        outdoorContext.includes(obj.toLowerCase())
      );
      
      if (hasOutdoorContext) {
        console.log('🌳 Outdoor context detected - suggesting outdoor/activity items');
        return ['sneakers', 'athletic shoes', 'running shoes', 'outdoor gear'];
      }
      
      // Check for indoor context
      const indoorContext = ['chair', 'table', 'lamp', 'couch', 'tv', 'computer'];
      const hasIndoorContext = originalObjects.some(obj => 
        indoorContext.includes(obj.toLowerCase())
      );
      
      if (hasIndoorContext) {
        console.log('🏠 Indoor context detected - suggesting indoor items');
        return ['laptop', 'chair', 'headphones', 'coffee mug'];
      }
      
      // Check for walking/movement context (feet-focused video)
      const movementContext = ['person', 'walking', 'feet', 'foot', 'legs'];
      const hasMovementContext = originalObjects.some(obj => 
        movementContext.includes(obj.toLowerCase())
      );
      
      if (hasMovementContext) {
        console.log('👟 Movement context detected - suggesting footwear and accessories');
        return ['sneakers', 'athletic shoes', 'running shoes', 'sports watch', 'fitness tracker'];
      }
      
      // Default personal items when no specific context
      console.log('👤 General person context - suggesting common personal items');
      return ['cell phone', 'watch', 'sunglasses'];
    }
    
    return [];
  }

  // Test the enhanced detection system
  async testDetection(videoPath) {
    try {
      console.log('🧪 Testing enhanced object detection...');
      
      if (!fs.existsSync(videoPath)) {
        console.error(`❌ Video file not found: ${videoPath}`);
        return {
          success: false,
          error: 'Video file not found',
          objects: []
        };
      }

      const objects = await this.detectObjects(videoPath);
      
      return {
        success: true,
        objects: objects,
        videoPath: videoPath,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Test detection failed:', error);
      return {
        success: false,
        error: error.message,
        objects: []
      };
    }
  }

  // Get detection statistics
  getDetectionStats() {
    return {
      confidenceThreshold: this.confidenceThreshold,
      maxFrames: this.maxFrames,
      pythonScriptPath: this.pythonScriptPath,
      scriptExists: fs.existsSync(this.pythonScriptPath)
    };
  }

  // Record detection pattern for learning
  recordDetectionPattern(videoId, videoPath, detectedObjects, contextItems, finalSelection = null, userFeedback = null) {
    try {
      learningService.recordVideoPattern(videoId, videoPath, detectedObjects, contextItems, finalSelection, userFeedback);
      console.log(`📚 Detection pattern recorded for learning: ${videoId}`);
      return true;
    } catch (error) {
      console.error('❌ Error recording detection pattern:', error);
      return false;
    }
  }

  // Get learning statistics
  getLearningStats() {
    return learningService.getLearningStats();
  }
}

module.exports = new EnhancedObjectDetectionService(); 