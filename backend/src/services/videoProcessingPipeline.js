/**
 * Video Processing Pipeline
 * Orchestrates the complete video processing pipeline with cost optimization
 * Frame Extraction → YOLOv8 Detection → ByteTrack Tracking → Object Cropping → OpenAI Analysis → Product Matching
 */

const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { PythonShell } = require('python-shell');

// Import services
const frameExtractorService = require('./frameExtractorService');
const objectCropperService = require('./objectCropperService');
const openaiService = require('./openaiService');
const productService = require('./productService');
const redisService = require('./redisService');
const websocketService = require('./websocketService');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'video-processing-pipeline' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/pipeline.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class VideoProcessingPipeline {
  constructor() {
    this.trackingScriptPath = path.join(__dirname, '../../scripts/tracking_service.py');
    this.isInitialized = false;
    
    // Pipeline configuration
    this.maxProcessingTime = parseInt(process.env.MAX_PROCESSING_TIME) || 300000; // 5 minutes
    this.enableCostOptimization = process.env.ENABLE_COST_OPTIMIZATION !== 'false';
    this.saveIntermediateResults = process.env.SAVE_INTERMEDIATE_RESULTS === 'true';
    this.enableFallbackMode = process.env.ENABLE_FALLBACK_MODE !== 'false';
    
    // Cost optimization settings
    this.maxFramesToProcess = parseInt(process.env.MAX_FRAMES_TO_PROCESS) || 50;
    this.maxObjectsPerFrame = parseInt(process.env.MAX_OBJECTS_PER_FRAME) || 5;
    this.minConfidenceThreshold = parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.6;
    
    // Rate limiting settings
    this.rateLimitDelay = parseInt(process.env.RATE_LIMIT_DELAY) || 1000; // 1 second between API calls
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.RETRY_DELAY) || 2000; // 2 seconds
    
    // Performance tracking
    this.processingStats = {
      totalVideos: 0,
      successfulVideos: 0,
      failedVideos: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      fallbackModeUsed: 0
    };
    
    // Active processing tracking
    this.activeProcesses = new Map();
  }

  /**
   * Initialize the pipeline
   */
  async initialize() {
    try {
      // Initialize Redis for caching and status tracking
      await redisService.initialize();
      
      // Initialize OpenAI service
      await openaiService.initializeCache();
      
      // Initialize product service
      await productService.initialize();
      
      this.isInitialized = true;
      logger.info('Video Processing Pipeline initialized');
      
    } catch (error) {
      logger.error('Failed to initialize pipeline:', error);
      throw error;
    }
  }

  /**
   * Process video through the complete pipeline with enhanced error handling
   */
  async processVideo(videoId, videoPath, options = {}) {
    const startTime = Date.now();
    const pipelineId = `pipeline_${videoId}_${Date.now()}`;
    
    // Track active process
    this.activeProcesses.set(videoId, {
      startTime,
      pipelineId,
      status: 'running'
    });
    
    try {
      logger.info(`Starting video processing pipeline for video: ${videoId}`);
      
      // Update status
      await this.updatePipelineStatus(videoId, 'initializing', 0, {
        message: 'Pipeline initialization started',
        pipelineId
      });

      // Validate video file
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      const videoStats = fs.statSync(videoPath);
      logger.info(`Video file size: ${videoStats.size} bytes`);

      // Apply cost optimization settings
      const processingOptions = {
        ...options,
        maxFrames: this.maxFramesToProcess,
        maxObjectsPerFrame: this.maxObjectsPerFrame,
        confidenceThreshold: this.minConfidenceThreshold,
        enableCostOptimization: this.enableCostOptimization,
        enableFallbackMode: this.enableFallbackMode
      };

      // Phase 1: Frame Extraction (10%)
      await this.updatePipelineStatus(videoId, 'extracting_frames', 10, {
        message: 'Extracting video frames'
      });
      
      const frameExtractionResult = await this.executeWithRetry(
        () => this.extractFrames(videoPath, processingOptions),
        'Frame extraction'
      );
      logger.info(`Frame extraction completed: ${frameExtractionResult.frames.length} frames`);

      // Phase 2: Object Detection and Tracking (30%)
      await this.updatePipelineStatus(videoId, 'detecting_objects', 30, {
        message: 'Detecting and tracking objects',
        frameCount: frameExtractionResult.frames.length
      });
      
      const trackingResult = await this.executeWithRetry(
        () => this.detectAndTrack(frameExtractionResult.frames, videoPath, processingOptions),
        'Object detection and tracking'
      );
      logger.info(`Tracking completed: ${trackingResult.total_tracks} unique tracks`);

      // Phase 3: Object Cropping (50%)
      await this.updatePipelineStatus(videoId, 'cropping_objects', 50, {
        message: 'Cropping detected objects',
        trackCount: trackingResult.total_tracks
      });
      
      const croppingResult = await this.executeWithRetry(
        () => this.cropObjects(videoPath, trackingResult, processingOptions),
        'Object cropping'
      );
      logger.info(`Object cropping completed: ${croppingResult.croppedObjects.length} objects cropped`);

      // Phase 4: OpenAI Analysis (70%)
      await this.updatePipelineStatus(videoId, 'analyzing_objects', 70, {
        message: 'Analyzing objects with AI',
        objectCount: croppingResult.croppedObjects.length
      });
      
      const analysisResult = await this.executeWithRetry(
        () => this.analyzeObjects(croppingResult.croppedObjects, videoId, processingOptions),
        'AI analysis'
      );
      logger.info(`AI analysis completed: ${analysisResult.length} objects analyzed`);

      // Phase 5: Product Matching (90%)
      await this.updatePipelineStatus(videoId, 'matching_products', 90, {
        message: 'Matching products',
        analysisCount: analysisResult.length
      });
      
      const matchingResult = await this.executeWithRetry(
        () => this.matchProducts(analysisResult, processingOptions),
        'Product matching'
      );
      logger.info(`Product matching completed: ${matchingResult.length} matches found`);

      // Phase 6: Finalize Results (100%)
      await this.updatePipelineStatus(videoId, 'finalizing', 100, {
        message: 'Finalizing results'
      });
      
      const finalResult = await this.finalizeResults(
        videoId,
        frameExtractionResult,
        trackingResult,
        croppingResult,
        analysisResult,
        matchingResult,
        processingOptions
      );

      // Update final status
      await this.updatePipelineStatus(videoId, 'completed', 100, {
        message: 'Pipeline completed successfully',
        result: finalResult
      });

      // Broadcast final results via WebSocket
      if (websocketService.isInitialized) {
        websocketService.broadcastDetectionResults(videoId, finalResult);
        websocketService.broadcastProductMatches(videoId, finalResult.recommendations);
      }

      // Update statistics
      this.updateProcessingStats(true, Date.now() - startTime);

      // Clean up active process
      this.activeProcesses.delete(videoId);

      logger.info(`Video processing pipeline completed for video: ${videoId}`);
      
      return finalResult;

    } catch (error) {
      logger.error(`Pipeline failed for video ${videoId}:`, error);
      
      // Update error status
      await this.updatePipelineStatus(videoId, 'failed', 0, {
        message: 'Pipeline failed',
        error: error.message,
        fallbackMode: this.processingStats.fallbackModeUsed > 0
      });

      // Broadcast error via WebSocket
      if (websocketService.isInitialized) {
        websocketService.broadcastError(videoId, error);
      }

      // Update statistics
      this.updateProcessingStats(false, Date.now() - startTime);

      // Clean up active process
      this.activeProcesses.delete(videoId);

      throw error;
    }
  }

  /**
   * Execute function with retry logic and fallback mechanisms
   */
  async executeWithRetry(operation, operationName, retries = this.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Add rate limiting delay between retries
        if (attempt > 1) {
          await this.delay(this.retryDelay * attempt);
        }
        
        return await operation();
        
      } catch (error) {
        logger.warn(`${operationName} attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          // Last attempt failed, try fallback mode if enabled
          if (this.enableFallbackMode) {
            logger.info(`Attempting fallback mode for ${operationName}`);
            this.processingStats.fallbackModeUsed++;
            return await this.executeFallbackMode(operationName, error);
          }
          throw error;
        }
      }
    }
  }

  /**
   * Execute fallback mode for failed operations
   */
  async executeFallbackMode(operationName, originalError) {
    try {
      switch (operationName) {
        case 'Frame extraction':
          return await this.extractFramesFallback();
          
        case 'Object detection and tracking':
          return await this.detectAndTrackFallback();
          
        case 'Object cropping':
          return await this.cropObjectsFallback();
          
        case 'AI analysis':
          return await this.analyzeObjectsFallback();
          
        case 'Product matching':
          return await this.matchProductsFallback();
          
        default:
          throw originalError;
      }
    } catch (fallbackError) {
      logger.error(`Fallback mode also failed for ${operationName}:`, fallbackError);
      throw originalError;
    }
  }

  /**
   * Fallback implementations for each pipeline phase
   */
  async extractFramesFallback() {
    logger.info('Using fallback frame extraction');
    return {
      frames: [],
      frameCount: 0,
      fallbackMode: true
    };
  }

  async detectAndTrackFallback() {
    logger.info('Using fallback object detection');
    return {
      frame_results: [],
      total_tracks: 0,
      fallbackMode: true
    };
  }

  async cropObjectsFallback() {
    logger.info('Using fallback object cropping');
    return {
      croppedObjects: [],
      fallbackMode: true
    };
  }

  async analyzeObjectsFallback() {
    logger.info('Using fallback AI analysis');
    return [];
  }

  async matchProductsFallback() {
    logger.info('Using fallback product matching');
    return [];
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Phase 1: Extract frames from video
   */
  async extractFrames(videoPath, options = {}) {
    try {
      const result = await frameExtractorService.extractFrames(videoPath, {
        ...options,
        maxFrames: options.maxFrames || this.maxFramesToProcess,
        sampleRate: options.sampleRate || 2 // Sample every 2nd frame for cost optimization
      });
      
      // Save intermediate results if enabled
      if (this.saveIntermediateResults) {
        await this.saveIntermediateResult('frame_extraction', videoPath, result);
      }
      
      return result;
    } catch (error) {
      logger.error('Frame extraction failed:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Detect and track objects
   */
  async detectAndTrack(frames, videoPath, options = {}) {
    try {
      // Call Python tracking script with enhanced options
      const trackingResult = await this.runTrackingScript(videoPath, {
        ...options,
        confidenceThreshold: options.confidenceThreshold || this.minConfidenceThreshold,
        maxObjectsPerFrame: options.maxObjectsPerFrame || this.maxObjectsPerFrame
      });
      
      // Validate tracking results
      if (!trackingResult || !trackingResult.frame_results) {
        throw new Error('Invalid tracking results received');
      }
      
      // Save intermediate results if enabled
      if (this.saveIntermediateResults) {
        await this.saveIntermediateResult('tracking', videoPath, trackingResult);
      }
      
      return trackingResult;
    } catch (error) {
      logger.error('Object detection and tracking failed:', error);
      throw error;
    }
  }

  /**
   * Run Python tracking script with enhanced error handling
   */
  async runTrackingScript(videoPath, options = {}) {
    return new Promise((resolve, reject) => {
      const scriptOptions = {
        mode: 'json',
        pythonPath: 'python3',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(this.trackingScriptPath),
        args: [
          videoPath,
          '--confidence', (options.confidenceThreshold || this.minConfidenceThreshold).toString(),
          '--max-objects', (options.maxObjectsPerFrame || this.maxObjectsPerFrame).toString()
        ]
      };

      logger.info(`Running tracking script: ${this.trackingScriptPath} with args: ${scriptOptions.args.join(' ')}`);

      const pyshell = new PythonShell(path.basename(this.trackingScriptPath), scriptOptions);
      let result = null;
      let hasError = false;
      let errorMessage = '';

      // Set timeout for script execution
      const timeout = setTimeout(() => {
        pyshell.kill();
        reject(new Error('Tracking script timeout'));
      }, 300000); // 5 minutes timeout

      pyshell.on('message', function (message) {
        try {
          logger.debug('Tracking script output:', message);
          // Handle both string and object messages
          if (typeof message === 'string') {
            result = JSON.parse(message);
          } else {
            result = message;
          }
        } catch (error) {
          logger.error('Failed to parse tracking script output:', error);
          hasError = true;
          errorMessage = error.message;
        }
      });

      pyshell.on('error', function (error) {
        logger.error('Tracking script error:', error);
        hasError = true;
        errorMessage = error.message;
      });

      pyshell.end(function (err) {
        clearTimeout(timeout);
        
        if (err || hasError) {
          logger.error('Tracking script failed:', err || errorMessage);
          reject(err || new Error(errorMessage || 'Tracking script failed'));
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('No result from tracking script'));
        }
      });
    });
  }

  /**
   * Phase 3: Crop objects from video frames
   */
  async cropObjects(videoPath, trackingResult, options = {}) {
    try {
      const result = await objectCropperService.cropTrackedObjects(videoPath, trackingResult, {
        ...options,
        minCropSize: options.minCropSize || 50,
        maxCropSize: options.maxCropSize || 400
      });
      
      // Save intermediate results if enabled
      if (this.saveIntermediateResults) {
        await this.saveIntermediateResult('object_cropping', videoPath, result);
      }
      
      return result;
    } catch (error) {
      logger.error('Object cropping failed:', error);
      throw error;
    }
  }

  /**
   * Phase 4: Analyze objects with OpenAI
   */
  async analyzeObjects(croppedObjects, videoId, options = {}) {
    try {
      // Apply cost optimization for OpenAI analysis
      const optimizedObjects = this.optimizeObjectsForAnalysis(croppedObjects, options);
      
      const result = await openaiService.analyzeCroppedObjects(optimizedObjects, videoId, {
        ...options,
        maxTokens: options.maxTokens || 150,
        temperature: options.temperature || 0.1
      });
      
      // Save intermediate results if enabled
      if (this.saveIntermediateResults) {
        await this.saveIntermediateResult('openai_analysis', videoId, result);
      }
      
      return result;
    } catch (error) {
      logger.error('OpenAI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Optimize objects for analysis to reduce costs
   */
  optimizeObjectsForAnalysis(croppedObjects, options = {}) {
    // Sort by confidence and take top objects
    const sortedObjects = croppedObjects.sort((a, b) => b.confidence - a.confidence);
    
    // Limit number of objects to analyze
    const maxObjects = options.maxObjectsToAnalyze || 10;
    const optimizedObjects = sortedObjects.slice(0, maxObjects);
    
    logger.info(`Optimized objects for analysis: ${optimizedObjects.length}/${croppedObjects.length}`);
    
    return optimizedObjects;
  }

  /**
   * Phase 5: Match products with enhanced user tag integration
   */
  async matchProducts(analysisResults, options = {}) {
    try {
      const matches = [];
      
      for (const analysis of analysisResults) {
        if (analysis.confidence > (options.minMatchConfidence || 0.5)) {
          // Use user tags if available for better matching
          const searchTerms = this.buildSearchTerms(analysis, options.userTags);
          
          const productMatches = await productService.matchProductsByObjects(searchTerms);
          
          matches.push({
            analysis,
            productMatches: productMatches.slice(0, options.maxMatchesPerObject || 5),
            searchTerms,
            matchConfidence: analysis.confidence
          });
        }
      }
      
      // Save intermediate results if enabled
      if (this.saveIntermediateResults) {
        await this.saveIntermediateResult('product_matching', 'matches', matches);
      }
      
      return matches;
    } catch (error) {
      logger.error('Product matching failed:', error);
      throw error;
    }
  }

  /**
   * Build search terms for product matching
   */
  buildSearchTerms(analysis, userTags = []) {
    const terms = [];
    
    // Add AI analysis results
    if (analysis.product_name) {
      terms.push(analysis.product_name);
    }
    if (analysis.keywords && Array.isArray(analysis.keywords)) {
      terms.push(...analysis.keywords);
    }
    
    // Add user tags for better matching
    if (userTags && Array.isArray(userTags)) {
      terms.push(...userTags);
    }
    
    // Add class name as fallback
    if (analysis.class_name) {
      terms.push(analysis.class_name);
    }
    
    // Remove duplicates and filter empty terms
    return [...new Set(terms)].filter(term => term && term.trim().length > 0);
  }

  /**
   * Phase 6: Finalize results with enhanced database storage
   */
  async finalizeResults(videoId, frameExtraction, tracking, cropping, analysis, matching, options = {}) {
    try {
      const finalResult = {
        videoId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
        summary: {
          totalFrames: frameExtraction.metadata.extractedFrames,
          totalTracks: tracking.total_tracks,
          totalObjects: cropping.croppedObjects.length,
          totalAnalyses: analysis.length,
          totalMatches: matching.length
        },
        frameExtraction: {
          metadata: frameExtraction.metadata
        },
        tracking: {
          stats: tracking.tracking_stats,
          frameResults: tracking.frame_results
        },
        cropping: {
          stats: cropping.stats
        },
        analysis: {
          results: analysis,
          costStats: openaiService.getCostStats()
        },
        matching: {
          results: matching
        },
        recommendations: this.generateRecommendations(matching),
        userTags: options.userTags || []
      };

      // Save final results to database
      await this.saveFinalResults(videoId, finalResult);
      
      return finalResult;
    } catch (error) {
      logger.error('Result finalization failed:', error);
      throw error;
    }
  }

  /**
   * Generate product recommendations
   */
  generateRecommendations(matching) {
    const recommendations = [];
    
    for (const match of matching) {
      if (match.productMatches && match.productMatches.length > 0) {
        const topProduct = match.productMatches[0];
        const relevanceScore = this.calculateRelevanceScore(match.analysis, topProduct);
        
        recommendations.push({
          product: topProduct,
          analysis: match.analysis,
          relevanceScore,
          confidence: match.matchConfidence,
          searchTerms: match.searchTerms
        });
      }
    }
    
    // Sort by relevance score
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for product matching
   */
  calculateRelevanceScore(analysis, product) {
    let score = 0;
    
    // Base score from confidence
    score += analysis.confidence * 0.4;
    
    // Product name matching
    if (analysis.product_name && product.title) {
      const nameMatch = this.calculateStringSimilarity(
        analysis.product_name.toLowerCase(),
        product.title.toLowerCase()
      );
      score += nameMatch * 0.3;
    }
    
    // Category matching
    if (analysis.category && product.category) {
      if (analysis.category.toLowerCase() === product.category.toLowerCase()) {
        score += 0.2;
      }
    }
    
    // Brand matching
    if (analysis.brand && product.brand) {
      if (analysis.brand.toLowerCase() === product.brand.toLowerCase()) {
        score += 0.1;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  calculateStringSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Update pipeline status
   */
  async updatePipelineStatus(videoId, status, progress, data = {}) {
    try {
      await redisService.publishDetectionStatus(videoId, status, progress, {
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast via WebSocket if available
      if (websocketService.isInitialized) {
        websocketService.broadcastPipelineStatus(videoId, status, progress, data);
      }
      
      logger.info(`Pipeline status update for ${videoId}: ${status} (${progress}%)`);
    } catch (error) {
      logger.error('Failed to update pipeline status:', error);
    }
  }

  /**
   * Save intermediate result
   */
  async saveIntermediateResult(phase, identifier, data) {
    try {
      const resultPath = path.join(__dirname, '../../temp', `${phase}_${identifier}_${Date.now()}.json`);
      fs.writeFileSync(resultPath, JSON.stringify(data, null, 2));
      logger.debug(`Saved intermediate result: ${resultPath}`);
    } catch (error) {
      logger.error('Failed to save intermediate result:', error);
    }
  }

  /**
   * Save final results to database
   */
  async saveFinalResults(videoId, results) {
    try {
      // Save to database through product service
      await productService.saveVideoResults(videoId, results);
      logger.info(`Saved final results for video: ${videoId}`);
    } catch (error) {
      logger.error('Failed to save final results:', error);
      throw error;
    }
  }

  /**
   * Update processing statistics
   */
  updateProcessingStats(success, processingTime) {
    this.processingStats.totalVideos++;
    
    if (success) {
      this.processingStats.successfulVideos++;
    } else {
      this.processingStats.failedVideos++;
    }
    
    // Update average processing time
    const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.totalVideos - 1) + processingTime;
    this.processingStats.averageProcessingTime = totalTime / this.processingStats.totalVideos;
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats() {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalVideos > 0 
        ? (this.processingStats.successfulVideos / this.processingStats.totalVideos) * 100 
        : 0
    };
  }

  /**
   * Get pipeline status for a video
   */
  async getPipelineStatus(videoId) {
    try {
      return await redisService.getDetectionStatus(videoId);
    } catch (error) {
      logger.error('Failed to get pipeline status:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await redisService.cleanup();
      logger.info('Pipeline cleanup completed');
    } catch (error) {
      logger.error('Pipeline cleanup failed:', error);
    }
  }
}

module.exports = new VideoProcessingPipeline(); 