const fs = require('fs');
const path = require('path');

class LearningService {
  constructor() {
    this.learningDataPath = path.join(__dirname, '../data/learning_data.json');
    this.patternsPath = path.join(__dirname, '../data/detection_patterns.json');
    this.userFeedbackPath = path.join(__dirname, '../data/user_feedback.json');
    this.ensureDataDirectories();
    this.loadLearningData();
  }

  ensureDataDirectories() {
    const dataDir = path.dirname(this.learningDataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadLearningData() {
    try {
      this.learningData = this.loadJSONFile(this.learningDataPath, {
        videoPatterns: {},
        contextPatterns: {},
        userPreferences: {},
        accuracyMetrics: {},
        totalVideos: 0,
        lastUpdated: new Date().toISOString()
      });

      this.detectionPatterns = this.loadJSONFile(this.patternsPath, {
        objectFrequency: {},
        contextMappings: {},
        successfulMatches: {},
        failedMatches: {},
        videoCategories: {}
      });

      this.userFeedback = this.loadJSONFile(this.userFeedbackPath, {
        feedback: [],
        corrections: [],
        preferences: {},
        totalFeedback: 0
      });

      console.log('✅ Learning data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading learning data:', error);
      this.learningData = { videoPatterns: {}, contextPatterns: {}, userPreferences: {}, accuracyMetrics: {}, totalVideos: 0, lastUpdated: new Date().toISOString() };
      this.detectionPatterns = { objectFrequency: {}, contextMappings: {}, successfulMatches: {}, failedMatches: {}, videoCategories: {} };
      this.userFeedback = { feedback: [], corrections: [], preferences: {}, totalFeedback: 0 };
    }
  }

  loadJSONFile(filePath, defaultValue = {}) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  }

  saveJSONFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`❌ Error saving to ${filePath}:`, error);
      return false;
    }
  }

  // Record video detection pattern
  recordVideoPattern(videoId, videoPath, detectedObjects, contextItems, finalSelection, userFeedback = null) {
    try {
      const videoInfo = {
        id: videoId,
        path: videoPath,
        filename: path.basename(videoPath),
        detectedObjects: detectedObjects,
        contextItems: contextItems,
        finalSelection: finalSelection,
        userFeedback: userFeedback,
        timestamp: new Date().toISOString(),
        category: this.categorizeVideo(videoPath, detectedObjects)
      };

      // Update learning data
      this.learningData.videoPatterns[videoId] = videoInfo;
      this.learningData.totalVideos++;
      this.learningData.lastUpdated = new Date().toISOString();

      // Update detection patterns
      this.updateDetectionPatterns(detectedObjects, contextItems, finalSelection, userFeedback);

      // Save data
      this.saveLearningData();
      this.saveDetectionPatterns();

      console.log(`📚 Recorded learning pattern for video: ${videoId}`);
      return true;
    } catch (error) {
      console.error('❌ Error recording video pattern:', error);
      return false;
    }
  }

  // Categorize video based on filename and detected objects
  categorizeVideo(videoPath, detectedObjects) {
    const filename = path.basename(videoPath).toLowerCase();
    const objects = Array.isArray(detectedObjects) ? detectedObjects.map(obj => obj.toLowerCase()) : [];

    // Define category keywords
    const categories = {
      'footwear': ['feet', 'foot', 'walking', 'shoes', 'sneakers', 'boots', 'athletic'],
      'outdoor': ['park', 'outdoor', 'nature', 'tree', 'grass', 'sky', 'walking', 'running'],
      'indoor': ['indoor', 'home', 'office', 'room', 'chair', 'table', 'laptop'],
      'sports': ['sports', 'athletic', 'running', 'fitness', 'exercise', 'gym'],
      'fashion': ['clothing', 'fashion', 'style', 'outfit', 'dress', 'shirt'],
      'technology': ['laptop', 'computer', 'phone', 'tablet', 'electronics', 'gadget'],
      'automotive': ['car', 'vehicle', 'driving', 'road', 'highway', 'transport']
    };

    // Check filename for category keywords
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => filename.includes(keyword))) {
        return category;
      }
    }

    // Check detected objects for category hints
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => objects.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  // Update detection patterns based on new data
  updateDetectionPatterns(detectedObjects, contextItems, finalSelection, userFeedback) {
    // Update object frequency
    detectedObjects.forEach(obj => {
      const objLower = obj.toLowerCase();
      this.detectionPatterns.objectFrequency[objLower] = 
        (this.detectionPatterns.objectFrequency[objLower] || 0) + 1;
    });

    // Update context mappings
    if (detectedObjects.length > 0 && contextItems.length > 0) {
      const primaryObject = detectedObjects[0].toLowerCase();
      if (!this.detectionPatterns.contextMappings[primaryObject]) {
        this.detectionPatterns.contextMappings[primaryObject] = {};
      }
      
      contextItems.forEach(item => {
        const itemLower = item.toLowerCase();
        this.detectionPatterns.contextMappings[primaryObject][itemLower] = 
          (this.detectionPatterns.contextMappings[primaryObject][itemLower] || 0) + 1;
      });
    }

    // Update successful/failed matches
    if (finalSelection) {
      const selectionLower = finalSelection.toLowerCase();
      if (contextItems.includes(finalSelection)) {
        this.detectionPatterns.successfulMatches[selectionLower] = 
          (this.detectionPatterns.successfulMatches[selectionLower] || 0) + 1;
      } else {
        this.detectionPatterns.failedMatches[selectionLower] = 
          (this.detectionPatterns.failedMatches[selectionLower] || 0) + 1;
      }
    }
  }

  // Get improved context suggestions based on learning
  getImprovedContextSuggestions(detectedObjects, videoPath) {
    const category = this.categorizeVideo(videoPath, detectedObjects);
    const primaryObject = detectedObjects.length > 0 ? detectedObjects[0].toLowerCase() : null;

    let suggestions = [];

    // Use learned context mappings
    if (primaryObject && this.detectionPatterns.contextMappings[primaryObject]) {
      const mappings = this.detectionPatterns.contextMappings[primaryObject];
      const sortedMappings = Object.entries(mappings)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([item]) => item);
      
      suggestions.push(...sortedMappings);
    }

    // Use category-based suggestions
    const categorySuggestions = this.getCategorySuggestions(category);
    suggestions.push(...categorySuggestions);

    // Remove duplicates and limit results
    suggestions = [...new Set(suggestions)].slice(0, 6);

    console.log(`🧠 Learning-based suggestions for ${category} category:`, suggestions);
    return suggestions;
  }

  // Get category-specific suggestions
  getCategorySuggestions(category) {
    const categorySuggestions = {
      'footwear': ['sneakers', 'athletic shoes', 'running shoes', 'casual shoes', 'boots', 'sandals'],
      'outdoor': ['sneakers', 'athletic shoes', 'outdoor gear', 'sports watch', 'fitness tracker', 'backpack'],
      'indoor': ['laptop', 'chair', 'headphones', 'coffee mug', 'desk lamp', 'monitor'],
      'sports': ['sneakers', 'athletic shoes', 'sports watch', 'fitness tracker', 'sports equipment', 'athletic wear'],
      'fashion': ['clothing', 'accessories', 'jewelry', 'handbag', 'sunglasses', 'watch'],
      'technology': ['laptop', 'cell phone', 'tablet', 'headphones', 'smartwatch', 'gaming console'],
      'automotive': ['car accessories', 'gps device', 'dash cam', 'car charger', 'seat covers', 'floor mats'],
      'general': ['cell phone', 'watch', 'sunglasses', 'backpack', 'headphones', 'laptop']
    };

    return categorySuggestions[category] || categorySuggestions['general'];
  }

  // Record user feedback for learning
  recordUserFeedback(videoId, feedback) {
    try {
      const feedbackEntry = {
        videoId,
        feedback,
        timestamp: new Date().toISOString()
      };

      this.userFeedback.feedback.push(feedbackEntry);
      this.userFeedback.totalFeedback++;

      // Update accuracy metrics
      this.updateAccuracyMetrics(videoId, feedback);

      this.saveUserFeedback();
      console.log(`📝 Recorded user feedback for video: ${videoId}`);
      return true;
    } catch (error) {
      console.error('❌ Error recording user feedback:', error);
      return false;
    }
  }

  // Update accuracy metrics
  updateAccuracyMetrics(videoId, feedback) {
    if (!this.learningData.accuracyMetrics[videoId]) {
      this.learningData.accuracyMetrics[videoId] = {
        accuracy: 0,
        totalFeedback: 0,
        positiveFeedback: 0,
        negativeFeedback: 0
      };
    }

    const metrics = this.learningData.accuracyMetrics[videoId];
    metrics.totalFeedback++;
    
    if (feedback.accuracy === 'good' || feedback.accuracy === 'excellent') {
      metrics.positiveFeedback++;
    } else if (feedback.accuracy === 'poor' || feedback.accuracy === 'bad') {
      metrics.negativeFeedback++;
    }

    metrics.accuracy = (metrics.positiveFeedback / metrics.totalFeedback) * 100;
  }

  // Get learning statistics
  getLearningStats() {
    return {
      totalVideos: this.learningData.totalVideos,
      totalFeedback: this.userFeedback.totalFeedback,
      lastUpdated: this.learningData.lastUpdated,
      topDetectedObjects: this.getTopDetectedObjects(),
      accuracyTrend: this.getAccuracyTrend(),
      categoryDistribution: this.getCategoryDistribution()
    };
  }

  // Get top detected objects
  getTopDetectedObjects() {
    const sorted = Object.entries(this.detectionPatterns.objectFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([object, count]) => ({ object, count }));
    
    return sorted;
  }

  // Get accuracy trend
  getAccuracyTrend() {
    const accuracies = Object.values(this.learningData.accuracyMetrics)
      .map(metrics => metrics.accuracy)
      .filter(acc => acc > 0);
    
    if (accuracies.length === 0) return 0;
    
    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  // Get category distribution
  getCategoryDistribution() {
    const categories = {};
    Object.values(this.learningData.videoPatterns).forEach(pattern => {
      const category = pattern.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }

  // Save all learning data
  saveLearningData() {
    return this.saveJSONFile(this.learningDataPath, this.learningData);
  }

  saveDetectionPatterns() {
    return this.saveJSONFile(this.patternsPath, this.detectionPatterns);
  }

  saveUserFeedback() {
    return this.saveJSONFile(this.userFeedbackPath, this.userFeedback);
  }

  // Export learning data for analysis
  exportLearningData() {
    return {
      learningData: this.learningData,
      detectionPatterns: this.detectionPatterns,
      userFeedback: this.userFeedback,
      stats: this.getLearningStats()
    };
  }
}

module.exports = new LearningService(); 