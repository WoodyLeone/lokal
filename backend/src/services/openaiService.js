/**
 * OpenAI Service for Object Analysis
 * Analyzes cropped objects using OpenAI GPT-4 Vision with cost optimization
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const redisService = require('./redisService');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'openai-analysis' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/openai.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class OpenAIService {
  constructor() {
    // Check if OpenAI API key is available
    this.apiKey = process.env.OPENAI_API_KEY;
    this.isAvailable = !!(this.apiKey && this.apiKey.trim() !== '');
    
    if (!this.isAvailable) {
      logger.warn('OpenAI API key not configured, service will use fallback analysis');
      this.openai = null;
    } else {
      // Initialize OpenAI client only if API key is available
      try {
        this.openai = new OpenAI({
          apiKey: this.apiKey,
          maxRetries: 3,
          timeout: 30000 // 30 seconds timeout
        });
        logger.info('OpenAI service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize OpenAI client:', error);
        this.openai = null;
        this.isAvailable = false;
      }
    }

    // Cost optimization settings - Aggressive cost reduction
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150; // Further reduced for cost savings
    this.batchSize = parseInt(process.env.OPENAI_BATCH_SIZE) || 5; // Larger batches for cost efficiency
    this.maxCallsPerVideo = parseInt(process.env.MAX_OPENAI_CALLS_PER_VIDEO) || 10; // Reduced limit per video
    this.confidenceThreshold = parseFloat(process.env.OPENAI_CONFIDENCE_THRESHOLD) || 0.8; // Higher threshold
    this.cacheExpiry = parseInt(process.env.OPENAI_CACHE_EXPIRY) || 604800; // 7 days cache for longer retention
    
    // Cost tracking
    this.costTracker = {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      callsThisHour: 0,
      lastResetTime: Date.now()
    };

    // Initialize Redis for caching
    this.initializeCache();
  }

  /**
   * Initialize Redis cache for cost optimization
   */
  async initializeCache() {
    try {
      await redisService.initialize();
      logger.info('OpenAI service cache initialized');
    } catch (error) {
      logger.warn('Redis cache not available, continuing without caching');
    }
  }

  /**
   * Analyze cropped objects with cost optimization
   */
  async analyzeCroppedObjects(croppedObjects, videoId, options = {}) {
    try {
      logger.info(`Starting OpenAI analysis for ${croppedObjects.length} objects`);

      // If OpenAI is not available, return fallback analysis
      if (!this.isAvailable || !this.openai) {
        logger.info('OpenAI not available, using fallback analysis');
        return this.getFallbackAnalysis(croppedObjects);
      }

      // Filter objects for cost optimization
      const filteredObjects = this.filterObjectsForAnalysis(croppedObjects);
      
      if (filteredObjects.length === 0) {
        logger.info('No objects meet analysis criteria');
        return [];
      }

      // Check cost limits
      if (!this.checkCostLimits(filteredObjects.length)) {
        logger.warn('Cost limit reached, skipping analysis');
        return this.getFallbackAnalysis(croppedObjects);
      }

      // Batch objects for cost optimization
      const batches = this.createBatches(filteredObjects);
      
      const analysisResults = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(`Processing batch ${i + 1}/${batches.length} with ${batch.length} objects`);
        
        try {
          const batchResults = await this.analyzeBatch(batch, videoId, options);
          analysisResults.push(...batchResults);
          
          // Add delay between batches to avoid rate limits
          if (i < batches.length - 1) {
            await this.delay(1000);
          }
        } catch (error) {
          logger.error(`Batch ${i + 1} analysis failed:`, error);
          // Add fallback results for this batch
          const fallbackResults = this.getFallbackAnalysis(batch);
          analysisResults.push(...fallbackResults);
        }
      }

      logger.info(`Analysis completed for ${analysisResults.length} objects`);
      return analysisResults;

    } catch (error) {
      logger.error('OpenAI analysis failed:', error);
      return this.getFallbackAnalysis(croppedObjects);
    }
  }

  /**
   * Filter objects for cost optimization - Aggressive filtering
   */
  filterObjectsForAnalysis(croppedObjects) {
    return croppedObjects.filter(obj => {
      // Only analyze high-confidence detections
      if (obj.confidence < this.confidenceThreshold) {
        return false;
      }

      // Skip very small crops
      if (obj.crop_size.width < 100 || obj.crop_size.height < 100) {
        return false;
      }

      // Skip common background objects and non-products
      const backgroundClasses = ['person', 'background', 'wall', 'floor', 'ceiling', 'sky', 'tree', 'grass', 'road'];
      const nonProductClasses = ['person', 'animal', 'bird', 'car', 'truck', 'bicycle', 'motorcycle'];
      
      if (backgroundClasses.includes(obj.class_name.toLowerCase()) || 
          nonProductClasses.includes(obj.class_name.toLowerCase())) {
        return false;
      }

      // Only analyze objects that appear in multiple frames (likely products)
      if (obj.hits < 2) {
        return false;
      }

      return true;
    }).slice(0, this.maxCallsPerVideo); // Limit total objects per video
  }

  /**
   * Create batches for cost optimization
   */
  createBatches(objects) {
    const batches = [];
    for (let i = 0; i < objects.length; i += this.batchSize) {
      batches.push(objects.slice(i, i + this.batchSize));
    }
    return batches;
  }

  /**
   * Analyze a batch of objects
   */
  async analyzeBatch(batch, videoId, options = {}) {
    try {
      const results = [];
      
      for (const obj of batch) {
        // Check cache first
        const cacheKey = this.generateCacheKey(obj);
        const cachedResult = await this.getCachedAnalysis(cacheKey);
        
        if (cachedResult) {
          logger.debug(`Using cached analysis for object ${obj.track_id}`);
          results.push({
            ...cachedResult,
            track_id: obj.track_id,
            frame_number: obj.frame_number,
            timestamp: obj.timestamp,
            cached: true
          });
          continue;
        }

        // Analyze object
        const analysis = await this.analyzeSingleObject(obj, videoId, options);
        
        if (analysis) {
          // Cache the result
          await this.cacheAnalysis(cacheKey, analysis);
          
          results.push({
            ...analysis,
            track_id: obj.track_id,
            frame_number: obj.frame_number,
            timestamp: obj.timestamp,
            cached: false
          });
        }
      }
      
      return results;

    } catch (error) {
      logger.error('Batch analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze a single object
   */
  async analyzeSingleObject(obj, videoId, options = {}) {
    try {
      // Read image file
      const imageBuffer = fs.readFileSync(obj.crop_path);
      const base64Image = imageBuffer.toString('base64');

      // Create analysis prompt
      const prompt = this.createAnalysisPrompt(obj, options);

      // Make OpenAI API call with aggressive cost optimization
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for cost optimization
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low" // Use low detail for cost optimization
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.1, // Low temperature for consistent results
        response_format: { type: "json_object" } // Force JSON for better parsing
      });

      // Update cost tracking
      this.updateCostTracking(response);

      // Parse response
      const analysis = this.parseAnalysisResponse(response.choices[0].message.content, obj);
      
      logger.debug(`Analyzed object ${obj.track_id}: ${analysis.product_name || 'Unknown'}`);
      
      return analysis;

    } catch (error) {
      logger.error(`Failed to analyze object ${obj.track_id}:`, error);
      return null;
    }
  }

  /**
   * Create analysis prompt
   */
  createAnalysisPrompt(obj, options = {}) {
    const context = options.context || 'product in video';
    const timestamp = obj.timestamp ? `at ${obj.timestamp}ms` : '';
    
    return `Analyze this ${context} ${timestamp} and provide structured information in JSON format:

{
  "product_name": "Name of the product",
  "category": "Product category (electronics, clothing, furniture, etc.)",
  "brand": "Brand name if visible",
  "description": "Brief description of the product",
  "features": ["feature1", "feature2"],
  "estimated_price_range": "low/medium/high",
  "confidence": 0.0-1.0,
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Focus on identifying the main product and its key characteristics. If the object is not a product or unclear, set confidence to 0.3 or lower.`;
  }

  /**
   * Parse analysis response
   */
  parseAnalysisResponse(content, obj) {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          original_response: content,
          detection_confidence: obj.confidence,
          class_name: obj.class_name
        };
      }
      
      // Fallback parsing
      return {
        product_name: this.extractProductName(content),
        category: this.extractCategory(content),
        brand: this.extractBrand(content),
        description: content.substring(0, 200),
        features: [],
        estimated_price_range: 'medium',
        confidence: 0.5,
        keywords: this.extractKeywords(content),
        original_response: content,
        detection_confidence: obj.confidence,
        class_name: obj.class_name
      };

    } catch (error) {
      logger.error('Failed to parse analysis response:', error);
      return {
        product_name: 'Unknown',
        category: 'unknown',
        brand: 'unknown',
        description: 'Analysis failed',
        features: [],
        estimated_price_range: 'unknown',
        confidence: 0.1,
        keywords: [],
        original_response: content,
        detection_confidence: obj.confidence,
        class_name: obj.class_name
      };
    }
  }

  /**
   * Extract product name from text
   */
  extractProductName(text) {
    const productPatterns = [
      /product[:\s]+([^,\n]+)/i,
      /item[:\s]+([^,\n]+)/i,
      /object[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of productPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Unknown Product';
  }

  /**
   * Extract category from text
   */
  extractCategory(text) {
    const categories = ['electronics', 'clothing', 'furniture', 'food', 'book', 'toy', 'tool'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category;
      }
    }
    
    return 'unknown';
  }

  /**
   * Extract brand from text
   */
  extractBrand(text) {
    const brandPatterns = [
      /brand[:\s]+([^,\n]+)/i,
      /by[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'unknown';
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const stopWords = ['this', 'that', 'with', 'from', 'have', 'will', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'than', 'first', 'very', 'after', 'where', 'most', 'over', 'even', 'much', 'make', 'before', 'great', 'through', 'between', 'should', 'being', 'under', 'never', 'every', 'same', 'another', 'such', 'many', 'while', 'last', 'might', 'must', 'shall', 'back', 'years', 'where', 'here', 'just', 'come', 'good', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'our', 'now', 'well', 'only', 'know', 'take', 'than', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'want', 'way', 'because', 'any', 'these', 'give', 'day', 'most', 'us'];
    
    return words
      .filter(word => !stopWords.includes(word))
      .slice(0, 5);
  }

  /**
   * Generate cache key for object
   */
  generateCacheKey(obj) {
    const hash = require('crypto').createHash('md5');
    hash.update(`${obj.track_id}_${obj.class_name}_${obj.crop_size.width}_${obj.crop_size.height}`);
    return `openai_analysis:${hash.digest('hex')}`;
  }

  /**
   * Get cached analysis
   */
  async getCachedAnalysis(cacheKey) {
    try {
      const cached = await redisService.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.debug('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache analysis result
   */
  async cacheAnalysis(cacheKey, analysis) {
    try {
      await redisService.setex(cacheKey, this.cacheExpiry, JSON.stringify(analysis));
    } catch (error) {
      logger.debug('Cache storage failed:', error);
    }
  }

  /**
   * Check cost limits
   */
  checkCostLimits(objectCount) {
    // Reset hourly counter if needed
    const now = Date.now();
    if (now - this.costTracker.lastResetTime > 3600000) { // 1 hour
      this.costTracker.callsThisHour = 0;
      this.costTracker.lastResetTime = now;
    }

    // Check hourly limit
    if (this.costTracker.callsThisHour + objectCount > 100) { // 100 calls per hour limit
      return false;
    }

    return true;
  }

  /**
   * Update cost tracking - Updated for GPT-4o-mini pricing
   */
  updateCostTracking(response) {
    this.costTracker.totalCalls++;
    this.costTracker.callsThisHour++;
    this.costTracker.totalTokens += response.usage.total_tokens;
    
    // Estimate cost (GPT-4o-mini pricing - much cheaper!)
    const inputCost = (response.usage.prompt_tokens / 1000) * 0.00015; // $0.00015 per 1K tokens
    const outputCost = (response.usage.completion_tokens / 1000) * 0.0006; // $0.0006 per 1K tokens
    this.costTracker.totalCost += inputCost + outputCost;
  }

  /**
   * Get fallback analysis when OpenAI is unavailable
   */
  getFallbackAnalysis(croppedObjects) {
    return croppedObjects.map(obj => ({
      product_name: obj.class_name,
      category: 'unknown',
      brand: 'unknown',
      description: `Detected ${obj.class_name}`,
      features: [],
      estimated_price_range: 'unknown',
      confidence: obj.confidence * 0.5, // Reduce confidence for fallback
      keywords: [obj.class_name],
      original_response: 'Fallback analysis',
      detection_confidence: obj.confidence,
      class_name: obj.class_name,
      track_id: obj.track_id,
      frame_number: obj.frame_number,
      timestamp: obj.timestamp,
      cached: false,
      fallback: true
    }));
  }

  /**
   * Get cost statistics
   */
  getCostStats() {
    return {
      ...this.costTracker,
      averageCostPerCall: this.costTracker.totalCalls > 0 ? 
        this.costTracker.totalCost / this.costTracker.totalCalls : 0
    };
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new OpenAIService(); 