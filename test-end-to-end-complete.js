/**
 * Comprehensive End-to-End Testing Suite
 * Tests the complete pipeline from video upload to display with all features
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');

// Configuration
const CONFIG = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  wsUrl: process.env.WS_URL || 'ws://localhost:3000/ws',
  testVideoPath: './test-data/videos/test_video.mp4',
  testImagePath: './test-data/images/test_product_1.jpg',
  timeout: 300000, // 5 minutes for complete pipeline
  retries: 3,
  logLevel: 'info'
};

// Test results storage
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  }
};

// Logging utility
const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  },
  debug: (message) => {
    if (CONFIG.logLevel === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
    }
  }
};

// Test utilities
class TestUtils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retry(fn, maxRetries = CONFIG.retries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        logger.warn(`Retry ${i + 1}/${maxRetries} failed: ${error.message}`);
        await this.delay(1000 * (i + 1));
      }
    }
  }

  static async uploadVideo(videoPath) {
    const formData = new FormData();
    formData.append('video', fs.createReadStream(videoPath));
    
    const response = await axios.post(`${CONFIG.backendUrl}/api/videos/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    });
    
    return response.data;
  }

  static async waitForPipelineCompletion(videoId, timeout = CONFIG.timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(`${CONFIG.backendUrl}/api/videos/${videoId}/status`);
        const status = response.data.status;
        
        if (status === 'completed') {
          return response.data;
        } else if (status === 'failed') {
          throw new Error(`Pipeline failed: ${response.data.error || 'Unknown error'}`);
        }
        
        await this.delay(5000); // Check every 5 seconds
      } catch (error) {
        logger.warn(`Status check failed: ${error.message}`);
        await this.delay(2000);
      }
    }
    
    throw new Error(`Pipeline timeout after ${timeout}ms`);
  }

  static async getVideoAnalysis(videoId) {
    const response = await axios.get(`${CONFIG.backendUrl}/api/videos/${videoId}/analysis`);
    return response.data;
  }

  static async getObjectDetections(videoId) {
    const response = await axios.get(`${CONFIG.backendUrl}/api/videos/${videoId}/detections`);
    return response.data;
  }

  static async getProductMatches(videoId) {
    const response = await axios.get(`${CONFIG.backendUrl}/api/videos/${videoId}/matches`);
    return response.data;
  }

  static async validateUserTags(tags) {
    const response = await axios.post(`${CONFIG.backendUrl}/api/videos/tags/validate`, { tags });
    return response.data;
  }

  static async getTagSuggestions(videoId) {
    const response = await axios.get(`${CONFIG.backendUrl}/api/videos/tags/suggestions/${videoId}`);
    return response.data;
  }

  static async matchProductsWithUserTags(videoId, userTags) {
    const response = await axios.post(`${CONFIG.backendUrl}/api/videos/tags/match/${videoId}`, {
      userTags,
      options: { enhancedMatching: true }
    });
    return response.data;
  }
}

// WebSocket testing utilities
class WebSocketTester {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.messages = [];
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.on('open', () => {
        this.connected = true;
        logger.info('WebSocket connected');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.messages.push(message);
        logger.debug(`WebSocket message: ${message.type}`);
      });
      
      this.ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`);
        reject(error);
      });
      
      this.ws.on('close', () => {
        this.connected = false;
        logger.info('WebSocket disconnected');
      });
    });
  }

  async subscribeToVideo(videoId) {
    if (!this.connected) throw new Error('WebSocket not connected');
    
    const message = {
      type: 'subscribe_video',
      videoId: videoId
    };
    
    this.ws.send(JSON.stringify(message));
  }

  async waitForMessage(type, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const message = this.messages.find(m => m.type === type);
      if (message) return message;
      await TestUtils.delay(100);
    }
    
    throw new Error(`Timeout waiting for message type: ${type}`);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Test cases
class TestSuite {
  static async testBackendHealth() {
    logger.info('Testing backend health...');
    
    try {
      const response = await axios.get(`${CONFIG.backendUrl}/api/health`);
      
      if (response.status === 200 && response.data.status === 'healthy') {
        return { passed: true, message: 'Backend is healthy' };
      } else {
        return { passed: false, message: 'Backend health check failed' };
      }
    } catch (error) {
      return { passed: false, message: `Backend health check error: ${error.message}` };
    }
  }

  static async testVideoUpload() {
    logger.info('Testing video upload...');
    
    try {
      if (!fs.existsSync(CONFIG.testVideoPath)) {
        return { passed: false, message: 'Test video file not found' };
      }
      
      const uploadResult = await TestUtils.retry(() => TestUtils.uploadVideo(CONFIG.testVideoPath));
      
      if (uploadResult.videoId && uploadResult.status === 'uploaded') {
        return { 
          passed: true, 
          message: 'Video upload successful',
          data: { videoId: uploadResult.videoId }
        };
      } else {
        return { passed: false, message: 'Video upload failed' };
      }
    } catch (error) {
      return { passed: false, message: `Video upload error: ${error.message}` };
    }
  }

  static async testPipelineProcessing(videoId) {
    logger.info('Testing pipeline processing...');
    
    try {
      const pipelineResult = await TestUtils.waitForPipelineCompletion(videoId);
      
      if (pipelineResult.status === 'completed') {
        return { 
          passed: true, 
          message: 'Pipeline processing completed successfully',
          data: { pipelineResult }
        };
      } else {
        return { passed: false, message: 'Pipeline processing failed' };
      }
    } catch (error) {
      return { passed: false, message: `Pipeline processing error: ${error.message}` };
    }
  }

  static async testObjectDetection(videoId) {
    logger.info('Testing object detection...');
    
    try {
      const detections = await TestUtils.getObjectDetections(videoId);
      
      if (detections && detections.length > 0) {
        const validDetections = detections.filter(d => 
          d.track_id && d.frame_number && d.confidence > 0.5
        );
        
        if (validDetections.length > 0) {
          return { 
            passed: true, 
            message: `Object detection successful: ${validDetections.length} valid detections`,
            data: { detections: validDetections }
          };
        } else {
          return { passed: false, message: 'No valid object detections found' };
        }
      } else {
        return { passed: false, message: 'No object detections returned' };
      }
    } catch (error) {
      return { passed: false, message: `Object detection error: ${error.message}` };
    }
  }

  static async testProductMatching(videoId) {
    logger.info('Testing product matching...');
    
    try {
      const matches = await TestUtils.getProductMatches(videoId);
      
      if (matches && matches.length > 0) {
        const validMatches = matches.filter(m => 
          m.product_name && m.affiliate_link && m.confidence > 0.3
        );
        
        if (validMatches.length > 0) {
          return { 
            passed: true, 
            message: `Product matching successful: ${validMatches.length} valid matches`,
            data: { matches: validMatches }
          };
        } else {
          return { passed: false, message: 'No valid product matches found' };
        }
      } else {
        return { passed: false, message: 'No product matches returned' };
      }
    } catch (error) {
      return { passed: false, message: `Product matching error: ${error.message}` };
    }
  }

  static async testUserTagIntegration(videoId) {
    logger.info('Testing user tag integration...');
    
    try {
      // Test tag validation
      const testTags = ['shirt', 'blue', 'cotton', 'casual'];
      const validationResult = await TestUtils.validateUserTags(testTags);
      
      if (!validationResult.valid || validationResult.validTags.length === 0) {
        return { passed: false, message: 'Tag validation failed' };
      }
      
      // Test tag suggestions
      const suggestions = await TestUtils.getTagSuggestions(videoId);
      
      if (!suggestions || suggestions.length === 0) {
        return { passed: false, message: 'Tag suggestions failed' };
      }
      
      // Test enhanced product matching with user tags
      const enhancedMatches = await TestUtils.matchProductsWithUserTags(videoId, testTags);
      
      if (enhancedMatches && enhancedMatches.length > 0) {
        return { 
          passed: true, 
          message: 'User tag integration successful',
          data: { 
            validationResult,
            suggestions,
            enhancedMatches
          }
        };
      } else {
        return { passed: false, message: 'Enhanced product matching with user tags failed' };
      }
    } catch (error) {
      return { passed: false, message: `User tag integration error: ${error.message}` };
    }
  }

  static async testWebSocketRealTimeUpdates(videoId) {
    logger.info('Testing WebSocket real-time updates...');
    
    const wsTester = new WebSocketTester(CONFIG.wsUrl);
    
    try {
      // Connect to WebSocket
      await wsTester.connect();
      
      // Subscribe to video updates
      await wsTester.subscribeToVideo(videoId);
      
      // Wait for subscription confirmation
      const subscriptionMsg = await wsTester.waitForMessage('subscription_confirmed');
      
      if (subscriptionMsg.videoId !== videoId) {
        return { passed: false, message: 'WebSocket subscription failed' };
      }
      
      // Wait for progress updates
      const progressMsg = await wsTester.waitForMessage('progress_update', 10000);
      
      if (progressMsg && progressMsg.data) {
        return { 
          passed: true, 
          message: 'WebSocket real-time updates working',
          data: { progressMsg }
        };
      } else {
        return { passed: false, message: 'No progress updates received' };
      }
    } catch (error) {
      return { passed: false, message: `WebSocket testing error: ${error.message}` };
    } finally {
      wsTester.disconnect();
    }
  }

  static async testCompletePipeline() {
    logger.info('Testing complete pipeline end-to-end...');
    
    try {
      // Step 1: Upload video
      const uploadTest = await this.testVideoUpload();
      if (!uploadTest.passed) {
        return uploadTest;
      }
      
      const videoId = uploadTest.data.videoId;
      logger.info(`Video uploaded with ID: ${videoId}`);
      
      // Step 2: Wait for pipeline completion
      const pipelineTest = await this.testPipelineProcessing(videoId);
      if (!pipelineTest.passed) {
        return pipelineTest;
      }
      
      // Step 3: Test object detection
      const detectionTest = await this.testObjectDetection(videoId);
      if (!detectionTest.passed) {
        return detectionTest;
      }
      
      // Step 4: Test product matching
      const matchingTest = await this.testProductMatching(videoId);
      if (!matchingTest.passed) {
        return matchingTest;
      }
      
      // Step 5: Test user tag integration
      const tagTest = await this.testUserTagIntegration(videoId);
      if (!tagTest.passed) {
        return tagTest;
      }
      
      // Step 6: Test WebSocket real-time updates
      const wsTest = await this.testWebSocketRealTimeUpdates(videoId);
      if (!wsTest.passed) {
        return wsTest;
      }
      
      return { 
        passed: true, 
        message: 'Complete pipeline test successful',
        data: { 
          videoId,
          uploadTest,
          pipelineTest,
          detectionTest,
          matchingTest,
          tagTest,
          wsTest
        }
      };
    } catch (error) {
      return { passed: false, message: `Complete pipeline test error: ${error.message}` };
    }
  }
}

// Main test runner
async function runTests() {
  logger.info('Starting comprehensive end-to-end tests...');
  
  const tests = [
    { name: 'Backend Health', fn: TestSuite.testBackendHealth },
    { name: 'Complete Pipeline', fn: TestSuite.testCompletePipeline }
  ];
  
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      logger.info(`Running test: ${test.name}`);
      const result = await test.fn();
      
      const testResult = {
        name: test.name,
        passed: result.passed,
        message: result.message,
        duration: Date.now() - startTime,
        data: result.data || null,
        timestamp: new Date().toISOString()
      };
      
      testResults.tests.push(testResult);
      
      if (result.passed) {
        testResults.summary.passed++;
        logger.info(`✅ ${test.name}: PASSED (${testResult.duration}ms)`);
      } else {
        testResults.summary.failed++;
        logger.error(`❌ ${test.name}: FAILED - ${result.message}`);
      }
      
    } catch (error) {
      const testResult = {
        name: test.name,
        passed: false,
        message: `Test execution error: ${error.message}`,
        duration: Date.now() - startTime,
        data: null,
        timestamp: new Date().toISOString()
      };
      
      testResults.tests.push(testResult);
      testResults.summary.failed++;
      logger.error(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    
    testResults.summary.total++;
  }
  
  // Calculate total duration
  testResults.summary.duration = Date.now() - testResults.startTime.getTime();
  
  // Generate summary
  logger.info('\n=== TEST SUMMARY ===');
  logger.info(`Total Tests: ${testResults.summary.total}`);
  logger.info(`Passed: ${testResults.summary.passed}`);
  logger.info(`Failed: ${testResults.summary.failed}`);
  logger.info(`Duration: ${testResults.summary.duration}ms`);
  
  // Save results
  const resultsFile = `test-results-complete-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  logger.info(`Results saved to: ${resultsFile}`);
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error(`Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { TestSuite, TestUtils, WebSocketTester }; 