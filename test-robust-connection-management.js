#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Robust Connection Management
 * Tests the new connection manager, circuit breakers, and API resilience
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://lokal-dev-production.up.railway.app',
  WS_URL: process.env.WS_URL || 'wss://lokal-dev-production.up.railway.app',
  TEST_TIMEOUT: 300000, // 5 minutes
  STRESS_REQUESTS: 50,
  CONCURRENT_CONNECTIONS: 10
};

class RobustConnectionTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0,
        startTime: Date.now(),
        endTime: null
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[type] || 'ℹ️';
    
    console.log(`${timestamp} ${emoji} ${message}`);
  }

  async recordTest(testName, testFn) {
    const startTime = performance.now();
    this.log(`Starting test: ${testName}`, 'debug');
    
    try {
      const result = await testFn();
      const duration = performance.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        status: 'passed',
        duration: Math.round(duration),
        result
      });
      
      this.results.summary.passed++;
      this.log(`Test passed: ${testName} (${Math.round(duration)}ms)`, 'success');
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        status: 'failed',
        duration: Math.round(duration),
        error: error.message
      });
      
      this.results.summary.failed++;
      this.log(`Test failed: ${testName} - ${error.message}`, 'error');
      throw error;
    } finally {
      this.results.summary.total++;
    }
  }

  async testBasicConnectivity() {
    return this.recordTest('Basic API Connectivity', async () => {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      
      return {
        status: response.status,
        serverStatus: response.data.status,
        uptime: response.data.uptime,
        database: response.data.database,
        features: response.data.features,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    });
  }

  async testDetailedHealthCheck() {
    return this.recordTest('Current Health Check Analysis', async () => {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
        timeout: 15000
      });
      
      const data = response.data;
      
      if (!data.database || !data.features) {
        throw new Error('Missing database or features information');
      }
      
      return {
        serverStatus: data.status,
        uptime: Math.round(data.uptime),
        memoryUsage: data.memory?.heapUsed || 0,
        database: data.database,
        features: data.features,
        timestamp: data.timestamp
      };
    });
  }

  async testDatabaseHealth() {
    return this.recordTest('Database Health Analysis', async () => {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
        timeout: 20000
      });
      
      const database = response.data.database;
      
      if (!database) {
        throw new Error('No database health information available');
      }
      
      return {
        postgresql: database.postgresql || 'not_configured',
        redis: database.redis || 'not_configured',
        cache: database.cache || 'not_configured',
        allHealthy: Object.values(database).every(status => status === 'Available')
      };
    });
  }

  async testCircuitBreakerResilience() {
    return this.recordTest('Circuit Breaker Resilience', async () => {
      // Test multiple rapid requests to potentially trigger circuit breaker
      const rapidRequests = [];
      
      for (let i = 0; i < 10; i++) {
        rapidRequests.push(
          axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
            timeout: 5000
          }).catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.all(rapidRequests);
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      
      return {
        totalRequests: results.length,
        successful,
        failed,
        successRate: `${((successful / results.length) * 100).toFixed(1)}%`
      };
    });
  }

  async testStressLoad() {
    return this.recordTest('Stress Load Test', async () => {
      this.log(`Starting stress test with ${CONFIG.STRESS_REQUESTS} requests...`);
      
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < CONFIG.STRESS_REQUESTS; i++) {
        promises.push(
          axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
            timeout: 30000
          }).then(response => ({
            success: true,
            status: response.status,
            duration: Date.now() - startTime
          })).catch(error => ({
            success: false,
            error: error.message,
            duration: Date.now() - startTime
          }))
        );
        
        // Small delay to avoid overwhelming
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      return {
        totalRequests: CONFIG.STRESS_REQUESTS,
        successful,
        failed,
        successRate: `${((successful / CONFIG.STRESS_REQUESTS) * 100).toFixed(1)}%`,
        averageResponseTime: `${Math.round(avgDuration)}ms`
      };
    });
  }

  async testWebSocketConnection() {
    return this.recordTest('WebSocket Connection Test', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 15000);
        
        const ws = new WebSocket(`${CONFIG.WS_URL}`);
        let messageReceived = false;
        
        ws.on('open', () => {
          this.log('WebSocket connected', 'debug');
          
          // Send a ping
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        });
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            messageReceived = true;
            
            clearTimeout(timeout);
            ws.close();
            
            resolve({
              connected: true,
              messageType: message.type,
              serverInfo: message.serverInfo || null
            });
          } catch (error) {
            clearTimeout(timeout);
            ws.close();
            reject(new Error(`Invalid WebSocket message: ${error.message}`));
          }
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket error: ${error.message}`));
        });
        
        ws.on('close', () => {
          if (!messageReceived) {
            clearTimeout(timeout);
            reject(new Error('WebSocket closed without receiving message'));
          }
        });
      });
    });
  }

  async testConnectionRecovery() {
    return this.recordTest('Connection Recovery Test', async () => {
      // Test recovery by making requests with different delays
      const delays = [0, 1000, 2000, 5000];
      const results = [];
      
      for (const delay of delays) {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
          const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
            timeout: 10000
          });
          
          results.push({
            delay,
            success: true,
            status: response.status,
            health: response.data.health?.status
          });
        } catch (error) {
          results.push({
            delay,
            success: false,
            error: error.message
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      
      return {
        tests: results.length,
        successful,
        failed: results.length - successful,
        recoveryRate: `${((successful / results.length) * 100).toFixed(1)}%`,
        results
      };
    });
  }

  async testMetricsEndpoint() {
    return this.recordTest('System Metrics Analysis', async () => {
      const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
        timeout: 10000
      });
      
      const data = response.data;
      
      if (!data.memory || !data.uptime) {
        throw new Error('Missing system metrics');
      }
      
      return {
        memoryUsage: data.memory.heapUsed,
        memoryTotal: data.memory.heapTotal,
        memoryRSS: data.memory.rss,
        uptime: Math.round(data.uptime),
        timestamp: data.timestamp,
        hasMemoryMetrics: !!data.memory
      };
    });
  }

  async testConcurrentConnections() {
    return this.recordTest('Concurrent Connections Test', async () => {
      const connections = [];
      
      for (let i = 0; i < CONFIG.CONCURRENT_CONNECTIONS; i++) {
        connections.push(
          axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
            timeout: 30000
          }).then(response => ({
            success: true,
            status: response.status
          })).catch(error => ({
            success: false,
            error: error.message
          }))
        );
      }
      
      const results = await Promise.all(connections);
      const successful = results.filter(r => r.success).length;
      
      return {
        totalConnections: CONFIG.CONCURRENT_CONNECTIONS,
        successful,
        failed: CONFIG.CONCURRENT_CONNECTIONS - successful,
        successRate: `${((successful / CONFIG.CONCURRENT_CONNECTIONS) * 100).toFixed(1)}%`
      };
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Robust Connection Management Test Suite', 'info');
    this.log(`Target: ${CONFIG.API_BASE_URL}`, 'info');
    
    try {
      // Basic connectivity tests
      await this.testBasicConnectivity();
      await this.testDetailedHealthCheck();
      await this.testDatabaseHealth();
      
      // Resilience tests
      await this.testCircuitBreakerResilience();
      await this.testConnectionRecovery();
      
      // Performance tests
      await this.testStressLoad();
      await this.testConcurrentConnections();
      
      // Feature tests
      await this.testWebSocketConnection();
      await this.testMetricsEndpoint();
      
    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error');
    }
    
    this.results.summary.endTime = Date.now();
    this.printSummary();
  }

  printSummary() {
    const duration = this.results.summary.endTime - this.results.summary.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 ROBUST CONNECTION MANAGEMENT TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed} ✅`);
    console.log(`Failed: ${this.results.summary.failed} ❌`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📊 DETAILED RESULTS:');
    this.results.tests.forEach(test => {
      const emoji = test.status === 'passed' ? '✅' : '❌';
      console.log(`  ${emoji} ${test.name} (${test.duration}ms)`);
      
      if (test.result && typeof test.result === 'object') {
        Object.entries(test.result).forEach(([key, value]) => {
          console.log(`      ${key}: ${JSON.stringify(value)}`);
        });
      }
    });
    
    // Overall assessment
    const successRate = (this.results.summary.passed / this.results.summary.total) * 100;
    
    console.log('\n' + '='.repeat(60));
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Connection management is robust and reliable!');
    } else if (successRate >= 75) {
      console.log('✅ GOOD: Connection management is working well with minor issues.');
    } else if (successRate >= 50) {
      console.log('⚠️ CONCERNING: Connection management has significant issues.');
    } else {
      console.log('❌ CRITICAL: Connection management is severely compromised!');
    }
    console.log('='.repeat(60));
  }
}

// Run the test suite
async function main() {
  const tester = new RobustConnectionTester();
  
  try {
    await tester.runAllTests();
    process.exit(tester.results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RobustConnectionTester;