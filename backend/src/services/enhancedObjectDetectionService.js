const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

class EnhancedObjectDetectionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/enhanced_detect_objects.py');
    this.confidenceThreshold = process.env.DETECTION_CONFIDENCE_THRESHOLD || 0.5;
    this.demoMode = process.env.DEMO_MODE === 'true';
    this.productionMatching = process.env.PRODUCTION_MATCHING === 'true';
    
    console.log(`🔧 Enhanced Object Detection Service initialized:`);
    console.log(`   - Confidence Threshold: ${this.confidenceThreshold}`);
    console.log(`   - Demo Mode: ${this.demoMode}`);
    console.log(`   - Production Matching: ${this.productionMatching}`);
  }

  async detectObjects(videoPath, manualProductName = null) {
    console.log(`🎯 Starting enhanced object detection for video: ${videoPath}`);
    console.log(`🎯 Manual product name: ${manualProductName || 'None'}`);
    
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`❌ Video file not found: ${videoPath}`);
      return [];
    }

    // Check file size
    const stats = fs.statSync(videoPath);
    console.log(`📊 Video file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('❌ Video file is empty');
      return [];
    }

    return new Promise((resolve, reject) => {
      const options = {
        mode: 'json',
        pythonPath: 'python3',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [videoPath, this.confidenceThreshold.toString()]
      };

      console.log(`🐍 Running enhanced Python script: ${this.pythonScriptPath}`);
      console.log(`🐍 Script arguments: ${options.args}`);

      const pyshell = new PythonShell(path.basename(this.pythonScriptPath), options);

      let results = [];
      let hasError = false;

      pyshell.on('message', function (message) {
        try {
          console.log('🐍 Python output:', message);
          
          if (typeof message === 'object' && message !== null) {
            if (message.objects && Array.isArray(message.objects)) {
              // Filter objects based on confidence and context
              const filteredObjects = this.filterObjectsByContext(message.objects, manualProductName);
              results = filteredObjects;
              console.log(`✅ Filtered objects: ${filteredObjects.join(', ')}`);
            } else if (message.error) {
              console.error('❌ Python script error:', message.error);
              hasError = true;
            }
          }
        } catch (error) {
          console.error('❌ Error processing Python output:', error);
          hasError = true;
        }
      }.bind(this));

      pyshell.on('error', function (err) {
        console.error('❌ Python script execution error:', err);
        hasError = true;
      });

      pyshell.end(function (err) {
        if (err) {
          console.error('❌ Python script execution error:', err);
          hasError = true;
        }
        
        if (hasError) {
          console.log('❌ Detection failed due to errors');
          resolve([]);
        } else if (results.length === 0) {
          console.log('⚠️ No objects detected after filtering');
          resolve([]);
        } else {
          console.log(`🎉 Final detected objects: ${results.join(', ')}`);
          resolve(results);
        }
      }.bind(this));
    });
  }

  // Filter objects based on context and user intent
  filterObjectsByContext(detectedObjects, manualProductName = null) {
    console.log(`🔍 Filtering ${detectedObjects.length} detected objects`);
    console.log(`🔍 Manual product name: ${manualProductName || 'None'}`);

    // If manual product name is provided, prioritize context-relevant objects
    if (manualProductName) {
      const relevantObjects = this.findRelevantObjects(detectedObjects, manualProductName);
      console.log(`🎯 Context-relevant objects: ${relevantObjects.join(', ')}`);
      return relevantObjects;
    }

    // Filter out common irrelevant objects
    const irrelevantObjects = [
      'person', 'people', 'human', 'face', 'hand', 'finger', 'foot', 'leg', 'arm',
      'background', 'wall', 'floor', 'ceiling', 'sky', 'grass', 'tree', 'plant',
      'text', 'sign', 'label', 'logo', 'brand', 'watermark'
    ];

    const filteredObjects = detectedObjects.filter(obj => {
      const objLower = obj.toLowerCase();
      const isIrrelevant = irrelevantObjects.some(irrelevant => 
        objLower.includes(irrelevant) || irrelevant.includes(objLower)
      );
      
      if (isIrrelevant) {
        console.log(`🚫 Filtered out irrelevant object: ${obj}`);
        return false;
      }
      
      return true;
    });

    console.log(`✅ Filtered objects: ${filteredObjects.join(', ')}`);
    return filteredObjects;
  }

  // Find objects relevant to the manual product name
  findRelevantObjects(detectedObjects, manualProductName) {
    const productNameLower = manualProductName.toLowerCase();
    const relevantObjects = [];

    // Define product categories and their related objects
    const productCategories = {
      'phone': ['cell phone', 'smartphone', 'mobile', 'iphone', 'samsung', 'galaxy'],
      'laptop': ['laptop', 'computer', 'notebook', 'macbook', 'dell', 'hp'],
      'watch': ['watch', 'clock', 'timepiece', 'apple watch', 'smartwatch'],
      'headphones': ['headphones', 'earphones', 'airpods', 'earbuds'],
      'shoes': ['sneakers', 'shoes', 'footwear', 'boots', 'sandals'],
      'chair': ['chair', 'seat', 'furniture', 'sofa', 'couch'],
      'table': ['table', 'desk', 'furniture', 'dining table'],
      'car': ['car', 'vehicle', 'automobile', 'sedan', 'suv'],
      'tv': ['tv', 'television', 'monitor', 'screen', 'display'],
      'book': ['book', 'magazine', 'newspaper', 'document'],
      'cup': ['cup', 'mug', 'glass', 'bottle', 'container'],
      'bag': ['bag', 'handbag', 'purse', 'backpack', 'tote']
    };

    // Find the most relevant category for the manual product name
    let bestCategory = null;
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(productCategories)) {
      const score = keywords.reduce((total, keyword) => {
        if (productNameLower.includes(keyword) || keyword.includes(productNameLower)) {
          return total + 1;
        }
        return total;
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // If we found a relevant category, prioritize objects from that category
    if (bestCategory && bestScore > 0) {
      console.log(`🎯 Found relevant category: ${bestCategory} (score: ${bestScore})`);
      
      // Add objects from the relevant category first
      const categoryKeywords = productCategories[bestCategory];
      for (const obj of detectedObjects) {
        const objLower = obj.toLowerCase();
        if (categoryKeywords.some(keyword => objLower.includes(keyword) || keyword.includes(objLower))) {
          relevantObjects.push(obj);
        }
      }

      // Add other non-irrelevant objects as secondary
      for (const obj of detectedObjects) {
        if (!relevantObjects.includes(obj)) {
          const objLower = obj.toLowerCase();
          const isIrrelevant = ['person', 'background', 'text', 'wall', 'floor'].some(irrelevant => 
            objLower.includes(irrelevant)
          );
          if (!isIrrelevant) {
            relevantObjects.push(obj);
          }
        }
      }
    } else {
      // No specific category found, use general filtering
      console.log('⚠️ No specific category found, using general filtering');
      return this.filterObjectsByContext(detectedObjects);
    }

    return relevantObjects;
  }

  // Record detection patterns for learning
  recordDetectionPattern(videoId, videoPath, detectedObjects, suggestions, finalSelection = null, userFeedback = null) {
    try {
      const pattern = {
        videoId,
        videoPath,
        detectedObjects,
        suggestions,
        finalSelection,
        userFeedback,
        timestamp: new Date().toISOString(),
        confidence: this.confidenceThreshold,
        demoMode: this.demoMode
      };

      // In a real implementation, this would be stored in a database
      console.log('📊 Recording detection pattern:', pattern);
      
      // For now, just log the pattern
      const logPath = path.join(__dirname, '../data/detection_patterns.json');
      let patterns = [];
      
      if (fs.existsSync(logPath)) {
        try {
          const fileContent = fs.readFileSync(logPath, 'utf8');
          const parsed = JSON.parse(fileContent);
          // Ensure patterns is always an array
          patterns = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.error('Error reading existing patterns:', error);
          patterns = []; // Reset to empty array on error
        }
      }
      
      // Ensure patterns is an array before pushing
      if (!Array.isArray(patterns)) {
        patterns = [];
      }
      
      patterns.push(pattern);
      
      // Ensure directory exists
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.writeFileSync(logPath, JSON.stringify(patterns, null, 2));
      console.log('✅ Detection pattern recorded successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error recording detection pattern:', error);
      return false;
    }
  }

  // Get detection statistics
  getDetectionStats() {
    try {
      const logPath = path.join(__dirname, '../data/detection_patterns.json');
      if (!fs.existsSync(logPath)) {
        return { totalDetections: 0, patterns: [] };
      }
      
      const fileContent = fs.readFileSync(logPath, 'utf8');
      const parsed = JSON.parse(fileContent);
      const patterns = Array.isArray(parsed) ? parsed : [];
      
      return {
        totalDetections: patterns.length,
        patterns: patterns.slice(-10) // Last 10 patterns
      };
    } catch (error) {
      console.error('Error reading detection stats:', error);
      return { totalDetections: 0, patterns: [] };
    }
  }
}

module.exports = new EnhancedObjectDetectionService(); 